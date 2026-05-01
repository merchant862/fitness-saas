'use strict';

const { sendResendEmail } = require('../../apis/resendApi');
const { createPurchaseAccessLink } = require('../../services/authService');
const { trackEvent } = require('../../services/eventService');
const { updateUserProfile } = require('../../services/userService');
const { chargeUpsellOrder, sanitizeMetadata, savePaymentMethod } = require('../../services/paymentService');
const { sequelize, User } = require('../../database/models');
const { normalizeCheckoutCustomer } = require('../../utils/checkoutCustomerUtils');
const { isEmail, normalizeEmail, sha256 } = require('../../utils/securityUtils');
const { magicLinkEmail } = require('../../utils/emailTemplateUtils');

async function grantUpsellAccess(req, res, next)
{
  let claim = null;

  try
  {
    if (process.env.UPSELL_WEBHOOK_TOKEN && req.headers['x-webhook-token'] !== process.env.UPSELL_WEBHOOK_TOKEN)
    {
      return res.status(401).json({ error: 'Invalid webhook token' });
    }

    const email = req.body.email;
    const normalizedEmail = normalizeEmail(email);
    const customer = normalizeCheckoutCustomer(req.body);

    if (!isEmail(email))
    {
      return res.status(422).json({ error: 'Valid customer email is required' });
    }

    claim = await reserveUpsellWebhookClaim({
      email: normalizedEmail,
      payload: req.body
    });

    if (claim.duplicate)
    {
      return res.status(409).json({
        error: 'Webhook already processed for this email.',
        email: normalizedEmail,
        accessExpiresAt: claim.user?.accessExpiresAt || null,
        duplicate: true
      });
    }

    const paymentResult = await chargeUpsellOrder(req.body);

    const result = await createPurchaseAccessLink(req, {
      email: normalizedEmail,
      days: Number(req.body.accessDays || process.env.DEFAULT_ACCESS_DAYS || 30),
      source: 'upsell',
      metadata: {
        productId: req.body.productId || null,
        orderId: req.body.orderId || null,
        funnelId: req.body.funnelId || null,
        amount: req.body.amount || null,
        currency: req.body.currency || null,
        responseCrmCustomerId: paymentResult.crmResult.customerId || '16528318',
        responseCrmOrderId: paymentResult.crmResult.orderId || null,
        responseCrmTransactionId: paymentResult.crmResult.transactionId || null,
        lastUpsellWebhookFingerprint: claim.fingerprint,
        lastUpsellWebhookStatus: 'success',
        lastUpsellWebhookProcessedAt: new Date().toISOString()
      }
    });

    await updateUserProfile(result.user, buildCustomerProfileUpdate(customer));

    await savePaymentMethod(result.user.id, {
      customerId: paymentResult.crmResult.customerId || '16528318',
      cardLast4: paymentResult.cardLast4,
      lastChargedAt: paymentResult.chargedAt,
      nextChargedAt: paymentResult.nextChargedAt
    });

    let emailQueued = false;
    try
    {
      await sendResendEmail(magicLinkEmail({
        email: result.email,
        token: result.token
      }));
      emailQueued = true;
    }
    catch (emailError)
    {
      console.error('Upsell magic link email failed:', emailError);
    }

    await trackEvent(req, 'upsell_purchase_access_granted', {
      productId: req.body.productId || null,
      orderId: req.body.orderId || null,
      accessExpiresAt: result.accessExpiresAt,
      payment: sanitizeMetadata({
        responseCrmOrderId: paymentResult.crmResult.orderId,
        responseCrmTransactionId: paymentResult.crmResult.transactionId,
        cardLast4: paymentResult.cardLast4,
        chargedAt: paymentResult.chargedAt,
        nextChargedAt: paymentResult.nextChargedAt
      })
    }, result.user.id);

    return res.status(202).json({
      message: 'FitAccess membership email queued.',
      email: result.email,
      accessExpiresAt: result.accessExpiresAt,
      payment: {
        cardLast4: paymentResult.cardLast4,
        chargedAt: paymentResult.chargedAt,
        nextChargedAt: paymentResult.nextChargedAt
      },
      emailQueued
    });
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

    next(error);
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
        lastUpsellWebhookEmail: email,
        lastUpsellWebhookOrderId: payload.orderId || payload.order_id || null
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
    payload.orderId || payload.order_id || 'no-order',
    payload.productId || payload.product_id || 'no-product',
    payload.funnelId || payload.funnel_id || 'no-funnel',
    payload.amount || payload.total || 'no-amount',
    payload.currency || 'no-currency'
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
  grantUpsellAccess
};
