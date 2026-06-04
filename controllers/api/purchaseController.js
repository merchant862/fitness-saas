'use strict';

const { enqueueEmail } = require('../../services/emailQueueService');
const { createPurchaseAccessLink } = require('../../services/authService');
const { trackEvent } = require('../../services/eventService');
const { logPaymentTransaction } = require('../../services/paymentTransactionService');
const { updateUserProfile } = require('../../services/userService');
const { chargeUpsellOrder } = require('../../services/paymentService');
const { User } = require('../../database/models');
const { normalizeCheckoutCustomer } = require('../../utils/checkoutCustomerUtils');
const { isEmail, normalizeEmail, sha256 } = require('../../utils/securityUtils');
const { magicLinkEmail } = require('../../utils/emailTemplateUtils');

const DUPLICATE_EMAIL_MESSAGE = 'An account already exists for this email address. Duplicate purchases are not allowed. Please sign in with the existing account or use a different email address.';

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

  await assertUpsellEmailAvailable(normalizedEmail);

  const webhookFingerprint = buildUpsellWebhookFingerprint({
    email: normalizedEmail,
    payload: req.body
  });

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
      lastUpsellWebhookFingerprint: webhookFingerprint,
      lastUpsellWebhookStatus: 'success',
      lastUpsellWebhookProcessedAt: new Date().toISOString()
    }
  });

  await updateUserProfile(accessResult.user, buildCustomerProfileUpdate(customer));

  await logPaymentTransaction({
    userId: accessResult.user.id,
    type: 'upsell',
    status: 'approved',
    customerId: paymentResult.crmResult.customerId || null,
    responseCrmOrderId: paymentResult.crmResult.orderId,
    responseCrmTransactionId: paymentResult.crmResult.transactionId,
    idempotencyKey: paymentResult.idempotencyKey,
    cardLast4: paymentResult.cardLast4,
    chargedAt: paymentResult.chargedAt,
    metadata: {
      source: 'upsell_webhook',
      email: accessResult.email
    }
  });

  let emailQueued = false;
  try
  {
    await enqueueEmail(await magicLinkEmail({
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
      chargedAt: paymentResult.chargedAt
    }
  }, accessResult.user.id);

  return {
    email: accessResult.email,
    accessExpiresAt: accessResult.accessExpiresAt,
    payment: {
      cardLast4: paymentResult.cardLast4,
      chargedAt: paymentResult.chargedAt
    },
    emailQueued
  };
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

async function assertUpsellEmailAvailable(email)
{
  const user = await User.findOne({ where: { email } });

  if (!user)
  {
    return;
  }

  const error = new Error(DUPLICATE_EMAIL_MESSAGE);
  error.status = 409;
  error.duplicate = true;
  error.email = email;
  error.accessExpiresAt = user.accessExpiresAt || null;
  throw error;
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

module.exports = {
  grantUpsellAccess
};
