'use strict';

const { PaymentMethod, sequelize } = require('../database/models');
const { postResponseCrm } = require('../apis/responseCrmApi');
const { normalizeEmail } = require('../utils/securityUtils');

async function chargeUpsellOrder(payload)
{
  const payment = extractPayment(payload);

  if (!payment.cardNumber)
  {
    const error = new Error('Card number is required for upsell payment');
    error.status = 422;
    throw error;
  }

  const crmPayload = buildResponseCrmOrderPayload(payload, payment);
  const response = await postResponseCrm(process.env.RESPONSE_CRM_ADD_ORDER_URL, crmPayload);
  const crmResult = normalizeCrmResult(response.body);

  if (!crmResult.approved)
  {
    const error = new Error('Upsell payment was declined');
    error.status = 402;
    error.crmResult = crmResult.publicResult;
    throw error;
  }

  return {
    crmResult,
    cardLast4: cardLast4(payment.cardNumber),
    chargedAt: new Date(),
    nextChargeAt: calculateNextChargeAt(payload.nextChargeAt || payload.next_charge_at)
  };
}

async function updateCustomerPaymentMethod(user, payload)
{
  const payment = extractPayment(payload);

  if (!payment.cardNumber)
  {
    const error = new Error('Card number is required');
    error.status = 422;
    throw error;
  }

  const crmPayload = buildResponseCrmPaymentUpdatePayload(user, payload, payment);
  const url = process.env.RESPONSE_CRM_UPDATE_PAYMENT_URL || process.env.RESPONSE_CRM_ADD_ORDER_URL;
  const response = await postResponseCrm(url, crmPayload);
  const crmResult = normalizeCrmResult(response.body);

  if (!crmResult.approved)
  {
    const error = new Error('Payment method update was declined');
    error.status = 402;
    error.crmResult = crmResult.publicResult;
    throw error;
  }

  return {
    crmResult,
    paymentMethod: await savePaymentMethod(user.id, {
      cardLast4: cardLast4(payment.cardNumber),
      externalCustomerId: crmResult.customerId || payload.customerId || payload.customer_id || null,
      externalOrderId: crmResult.orderId || payload.orderId || payload.order_id || null,
      externalTransactionId: crmResult.transactionId || payload.transactionId || payload.transaction_id || null,
      lastChargedAt: null,
      nextChargeAt: calculateNextChargeAt(payload.nextChargeAt || payload.next_charge_at)
    })
  };
}

async function savePaymentMethod(userId, data, options = {})
{
  return sequelize.transaction(async (transaction) =>
  {
    await PaymentMethod.update(
      { status: 'replaced' },
      {
        where: {
          userId,
          provider: 'responsecrm',
          status: 'active'
        },
        transaction
      }
    );

    return PaymentMethod.create({
      userId,
      provider: 'responsecrm',
      externalCustomerId: data.externalCustomerId || null,
      externalOrderId: data.externalOrderId || null,
      externalTransactionId: data.externalTransactionId || null,
      cardLast4: data.cardLast4,
      lastChargedAt: data.lastChargedAt || null,
      nextChargeAt: data.nextChargeAt || null,
      status: data.status || 'active',
      metadata: sanitizeMetadata(data.metadata || {})
    }, { transaction: options.transaction || transaction });
  });
}

async function findActivePaymentMethod(userId)
{
  return PaymentMethod.findOne({
    where: {
      userId,
      provider: 'responsecrm',
      status: 'active'
    },
    order: [['createdAt', 'DESC']]
  });
}

function buildResponseCrmOrderPayload(payload, payment)
{
  return stripEmpty({
    ...safeObject(payload.crm || payload.responseCrm || payload.response_crm),
    site_id: payload.siteId || payload.site_id || process.env.RESPONSE_CRM_SITE_ID,
    campaign_id: payload.campaignId || payload.campaign_id || process.env.RESPONSE_CRM_CAMPAIGN_ID,
    product_id: payload.productId || payload.product_id || process.env.RESPONSE_CRM_PRODUCT_ID,
    offer_id: payload.offerId || payload.offer_id || process.env.RESPONSE_CRM_OFFER_ID,
    email: normalizeEmail(payload.email),
    first_name: payload.firstName || payload.first_name || null,
    last_name: payload.lastName || payload.last_name || null,
    phone: payload.phone || null,
    amount: payload.amount || null,
    currency: payload.currency || 'USD',
    order_id: payload.orderId || payload.order_id || null,
    parent_order_id: payload.parentOrderId || payload.parent_order_id || payload.frontsellOrderId || payload.frontsell_order_id || null,
    idempotency_id: idempotencyId('upsell', payload.orderId || payload.order_id, payload.email),
    is_upsell: true,
    upsell: true,
    billing: safeObject(payload.billing || payload.billingAddress || payload.billing_address),
    shipping: safeObject(payload.shipping || payload.shippingAddress || payload.shipping_address),
    payment: responseCrmPayment(payment),
    metadata: sanitizeMetadata({
      source: 'fitaccess_upsell',
      funnelId: payload.funnelId || payload.funnel_id || null,
      frontendOrderId: payload.orderId || payload.order_id || null
    })
  });
}

function buildResponseCrmPaymentUpdatePayload(user, payload, payment)
{
  return stripEmpty({
    ...safeObject(payload.crm || payload.responseCrm || payload.response_crm),
    site_id: payload.siteId || payload.site_id || process.env.RESPONSE_CRM_SITE_ID,
    campaign_id: payload.campaignId || payload.campaign_id || process.env.RESPONSE_CRM_CAMPAIGN_ID,
    product_id: payload.productId || payload.product_id || process.env.RESPONSE_CRM_PRODUCT_ID,
    email: user.email,
    customer_id: payload.customerId || payload.customer_id || user.metadata?.responseCrmCustomerId || null,
    order_id: payload.orderId || payload.order_id || user.metadata?.responseCrmOrderId || null,
    idempotency_id: idempotencyId('payment-update', payload.orderId || payload.order_id || user.metadata?.responseCrmOrderId, user.email),
    update_payment_method: true,
    amount: payload.amount || 0,
    currency: payload.currency || 'USD',
    payment: responseCrmPayment(payment),
    billing: safeObject(payload.billing || payload.billingAddress || payload.billing_address),
    metadata: sanitizeMetadata({
      source: 'fitaccess_payment_update',
      userId: user.id
    })
  });
}

function responseCrmPayment(payment)
{
  return stripEmpty({
    card_number: payment.cardNumber,
    card_exp_month: payment.expiryMonth,
    card_exp_year: payment.expiryYear,
    cvv: payment.cvv,
    cardholder_name: payment.cardHolderName
  });
}

function extractPayment(payload)
{
  const source = payload.paymentMethod || payload.payment_method || payload.card || payload;

  return {
    cardNumber: digits(source.cardNumber || source.card_number || source.ccNumber || source.cc_number),
    expiryMonth: twoDigits(source.expiryMonth || source.expiry_month || source.cardExpMonth || source.card_exp_month),
    expiryYear: fourDigitYear(source.expiryYear || source.expiry_year || source.cardExpYear || source.card_exp_year),
    cvv: digits(source.cvv || source.cvc || source.cardCvv || source.card_cvv).slice(0, 4),
    cardHolderName: String(source.cardHolderName || source.card_holder_name || source.nameOnCard || source.name_on_card || '').trim().slice(0, 120)
  };
}

function normalizeCrmResult(body)
{
  const statusText = String(
    body.status ||
    body.result ||
    body.response ||
    body.transaction_status ||
    body.transactionStatus ||
    ''
  ).toLowerCase();

  const declined = ['declined', 'failed', 'failure', 'error', 'rejected'].some((word) => statusText.includes(word));
  const approved = body.success === true || body.approved === true || statusText.includes('approved') || statusText.includes('success') || (!declined && !statusText);

  return {
    approved,
    orderId: body.order_id || body.orderId || body.id || body.data?.order_id || body.data?.orderId || null,
    transactionId: body.transaction_id || body.transactionId || body.trans_id || body.data?.transaction_id || body.data?.transactionId || null,
    customerId: body.customer_id || body.customerId || body.data?.customer_id || body.data?.customerId || null,
    publicResult: sanitizeMetadata(body)
  };
}

function calculateNextChargeAt(value)
{
  if (value)
  {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime()))
    {
      return date;
    }
  }

  const days = Number(process.env.RESPONSE_CRM_RECURRING_DAYS || 30);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function cardLast4(value)
{
  return digits(value).slice(-4);
}

function sanitizeMetadata(value)
{
  if (Array.isArray(value))
  {
    return value.map(sanitizeMetadata);
  }

  if (!value || typeof value !== 'object')
  {
    return value;
  }

  const blocked = new Set([
    'cardNumber',
    'card_number',
    'ccNumber',
    'cc_number',
    'cvv',
    'cvc',
    'cardCvv',
    'card_cvv',
    'paymentMethod',
    'payment_method',
    'payment',
    'card'
  ]);

  return Object.keys(value).reduce((clean, key) =>
  {
    if (!blocked.has(key))
    {
      clean[key] = sanitizeMetadata(value[key]);
    }

    return clean;
  }, {});
}

function safeObject(value)
{
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function stripEmpty(value)
{
  return Object.keys(value).reduce((clean, key) =>
  {
    if (value[key] !== undefined && value[key] !== null && value[key] !== '')
    {
      clean[key] = value[key];
    }

    return clean;
  }, {});
}

function digits(value)
{
  return String(value || '').replace(/\D/g, '');
}

function twoDigits(value)
{
  const clean = digits(value).slice(0, 2);
  return clean.length === 1 ? `0${clean}` : clean;
}

function fourDigitYear(value)
{
  const clean = digits(value).slice(-4);

  if (clean.length === 2)
  {
    return `20${clean}`;
  }

  return clean;
}

function idempotencyId(prefix, orderId, email)
{
  return [prefix, orderId || 'no-order', normalizeEmail(email || 'unknown')]
    .join(':')
    .slice(0, 191);
}

module.exports = {
  chargeUpsellOrder,
  findActivePaymentMethod,
  sanitizeMetadata,
  savePaymentMethod,
  updateCustomerPaymentMethod
};
