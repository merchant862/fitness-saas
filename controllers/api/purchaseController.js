'use strict';

const { enqueueEmail } = require('../../services/emailQueueService');
const { createPurchaseAccessLink } = require('../../services/authService');
const { trackEvent } = require('../../services/eventService');
const { logPaymentTransaction } = require('../../services/paymentTransactionService');
const { updateUserProfile } = require('../../services/userService');
const { chargeUpsellOrder, savePaymentMethod } = require('../../services/paymentService');
const { sequelize, User } = require('../../database/models');
const { normalizeCheckoutCustomer } = require('../../utils/checkoutCustomerUtils');
const { isEmail, normalizeEmail, sha256 } = require('../../utils/securityUtils');
const { magicLinkEmail } = require('../../utils/emailTemplateUtils');

async function grantUpsellAccess(req, res, next)
{
  try
  {
    const result = await processUpsellPurchase(req);

    return res.status(202).json({
      message: 'FitAccess membership email queued.',
      email: result.email,
      accessExpiresAt: result.accessExpiresAt,
      payment: result.payment,
      emailQueued: result.emailQueued
    });
  }
  catch (error)
  {
    if (error.duplicate)
    {
      return res.status(409).json({
        error: error.message,
        email: error.email,
        accessExpiresAt: error.accessExpiresAt,
        duplicate: true
      });
    }

    if (error.status && error.status < 500)
    {
      return res.status(error.status).json({ error: error.message });
    }

    next(error);
  }
}

async function processUpsellPurchase(req)
{
  let claim = null;

  try
  {
    console.log('upsell_purchase_request_body', req.body);

    const email = req.body.email;
    const normalizedEmail = normalizeEmail(email);
    const customer = normalizeCheckoutCustomer(req.body);

    if (!isEmail(email))
    {
      const error = new Error('Valid customer email is required');
      error.status = 422;
      throw error;
    }

    claim = await reserveUpsellWebhookClaim({
      email: normalizedEmail,
      payload: req.body
    });

    if (claim.duplicate)
    {
      const error = new Error('Webhook already processed for this email.');
      error.status = 409;
      error.duplicate = true;
      error.email = normalizedEmail;
      error.accessExpiresAt = claim.user?.accessExpiresAt || null;
      throw error;
    }

    const paymentResult = await chargeUpsellOrder({
      ...req.body,
      ipAddress: req.ip
    });

    const accessResult = await createPurchaseAccessLink(req, {
      email: normalizedEmail,
      days: Number(process.env.DEFAULT_ACCESS_DAYS || 30),
      source: 'upsell',
      metadata: {
        stickyCustomerId: paymentResult.crmResult.customerId || null,
        stickyOrderId: paymentResult.crmResult.orderId || null,
        stickyTransactionId: paymentResult.crmResult.transactionId || null,
        lastUpsellWebhookFingerprint: claim.fingerprint,
        lastUpsellWebhookStatus: 'success',
        lastUpsellWebhookProcessedAt: new Date().toISOString()
      }
    });

    await updateUserProfile(accessResult.user, buildCustomerProfileUpdate(customer));

    const paymentMethod = await savePaymentMethod(accessResult.user.id, {
      customerId: paymentResult.crmResult.customerId || null,
      cardNo: paymentResult.cardNo,
      cardLast4: paymentResult.cardLast4,
      expiryMonth: paymentResult.expiryMonth,
      expiryYear: paymentResult.expiryYear,
      cvv: paymentResult.cvv,
      lastChargedAt: paymentResult.chargedAt,
      nextChargedAt: paymentResult.nextChargedAt
    });

    await logPaymentTransaction({
      userId: accessResult.user.id,
      paymentMethodId: paymentMethod.id,
      type: 'upsell',
      status: 'approved',
      customerId: paymentResult.crmResult.customerId || null,
      responseCrmOrderId: paymentResult.crmResult.orderId,
      responseCrmTransactionId: paymentResult.crmResult.transactionId,
      idempotencyKey: paymentResult.idempotencyKey,
      cardLast4: paymentResult.cardLast4,
      chargedAt: paymentResult.chargedAt,
      nextChargedAt: paymentResult.nextChargedAt,
      metadata: {
        source: 'upsell_webhook',
        email: accessResult.email
      }
    });

    let emailQueued = false;
    try
    {
      await enqueueEmail(magicLinkEmail({
        email: accessResult.email,
        token: accessResult.token
      }));
      emailQueued = true;
    }
    catch (emailError)
    {
      console.error('Upsell magic link email failed:', emailError);
    }

    await trackEvent(req, 'upsell_purchase_access_granted', {
      accessExpiresAt: accessResult.accessExpiresAt,
      payment: {
        stickyOrderId: paymentResult.crmResult.orderId,
        stickyTransactionId: paymentResult.crmResult.transactionId,
        cardLast4: paymentResult.cardLast4,
        chargedAt: paymentResult.chargedAt,
        nextChargedAt: paymentResult.nextChargedAt
      }
    }, accessResult.user.id);

    return {
      email: accessResult.email,
      accessExpiresAt: accessResult.accessExpiresAt,
      payment: {
        cardLast4: paymentResult.cardLast4,
        chargedAt: paymentResult.chargedAt,
        nextChargedAt: paymentResult.nextChargedAt
      },
      emailQueued
    };
  }
  catch (error)
  {
    if (claim && !claim.duplicate && claim.user)
    {
      try
      {
        await claim.user.update({
          metadata: {
            ...safeJsonObject(claim.user.metadata),
            lastUpsellWebhookStatus: 'failed',
            lastUpsellWebhookFailedAt: new Date().toISOString(),
            lastUpsellWebhookError: String(error.message || 'Upsell webhook processing failed').slice(0, 255)
          }
        });
      }
      catch (metadataError)
      {
        console.error('Failed to mark upsell webhook as failed:', metadataError);
      }
    }

    throw error;
  }
}

function buildCustomerProfileUpdate(customer)
{
  const preferences = {};

  [
    'firstName',
    'lastName',
    'phone',
    'address1',
    'address2',
    'city',
    'state',
    'zip',
    'country'
  ].forEach((field) =>
  {
    if (customer[field])
    {
      preferences[field] = customer[field];
    }
  });

  const update = {
    preferences
  };

  if (!Object.keys(preferences).length)
  {
    delete update.preferences;
  }

  if (customer.fullName)
  {
    update.name = customer.fullName;
  }

  return update;
}

async function reserveUpsellWebhookClaim({ email, payload })
{
  const fingerprint = buildUpsellWebhookFingerprint({ email, payload });

  return sequelize.transaction(async (transaction) =>
  {
    const [user] = await User.findOrCreate({
      where: { email },
      defaults: {
        email,
        status: 'pending',
        tags: [],
        metadata: {}
      },
      transaction
    });

    const metadata = safeJsonObject(user.metadata);
    const claimedAt = metadata.lastUpsellWebhookClaimedAt ? new Date(metadata.lastUpsellWebhookClaimedAt) : null;
    const sameFingerprint =
      metadata.lastUpsellWebhookFingerprint === fingerprint &&
      (
        metadata.lastUpsellWebhookStatus === 'success' ||
        (
          metadata.lastUpsellWebhookStatus === 'processing' &&
          claimedAt &&
          Date.now() - claimedAt.getTime() < 15 * 60 * 1000
        )
      );

    if (sameFingerprint)
    {
      return {
        duplicate: true,
        fingerprint,
        user: await user.reload({ transaction })
      };
    }

    await user.update({
      metadata: {
        ...metadata,
        lastUpsellWebhookFingerprint: fingerprint,
        lastUpsellWebhookStatus: 'processing',
        lastUpsellWebhookClaimedAt: new Date().toISOString(),
        lastUpsellWebhookEmail: email
      }
    }, { transaction });

    return {
      duplicate: false,
      fingerprint,
      user: await user.reload({ transaction })
    };
  });
}

function buildUpsellWebhookFingerprint({ email, payload })
{
  const parts = [
    normalizeEmail(email),
    payload.customerId || payload.customer_id || payload.CustomerID || 'no-customer',
    payload.paymentMethod?.cardNumber || payload.paymentMethod?.card_number || payload.PaymentInformation?.CCNumber || payload.cardNumber || payload.card_number || 'no-card',
    payload.paymentMethod?.expiryMonth || payload.paymentMethod?.expiry_month || payload.PaymentInformation?.ExpMonth || payload.expiryMonth || payload.expiry_month || 'no-exp-month',
    payload.paymentMethod?.expiryYear || payload.paymentMethod?.expiry_year || payload.PaymentInformation?.ExpYear || payload.expiryYear || payload.expiry_year || 'no-exp-year'
  ];

  return sha256(parts.join('|'));
}

function safeJsonObject(value)
{
  if (!value)
  {
    return {};
  }

  if (typeof value === 'string')
  {
    if (value.length > 10000)
    {
      return {};
    }

    try
    {
      const parsed = JSON.parse(value);
      return sanitizeMetadataShape(parsed);
    }
    catch
    {
      return {};
    }
  }

  if (typeof value === 'object' && !Array.isArray(value))
  {
    return sanitizeMetadataShape(value);
  }

  return {};
}

function sanitizeMetadataShape(value)
{
  if (!value || typeof value !== 'object' || Array.isArray(value))
  {
    return {};
  }

  const keys = Object.keys(value);
  if (!keys.length)
  {
    return {};
  }

  if (keys.length > 50)
  {
    return {};
  }

  const numericKeys = keys.filter((key) => /^\d+$/.test(key)).length;
  if (numericKeys / keys.length > 0.6)
  {
    return {};
  }

  return value;
}

module.exports = {
  grantUpsellAccess,
  processUpsellPurchase
};
