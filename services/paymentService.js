'use strict';

const { PaymentMethod, sequelize } = require('../database/models');
const { postResponseCrm } = require('../apis/responseCrmApi');
const { normalizeCheckoutCustomer } = require('../utils/checkoutCustomerUtils');
const { normalizeEmail } = require('../utils/securityUtils');

async function chargeUpsellOrder(payload)
{
  const payment = extractPayment(payload);
  validatePayment(payment);

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
    nextChargedAt: calculateNextChargedAt(payload.nextChargedAt || payload.next_charged_at || payload.nextChargeAt || payload.next_charge_at)
  };
}

async function updateCustomerPaymentMethod(user, payload)
{
  const payment = extractPayment(payload);
  validatePayment(payment);

  const usesVerificationOrder = !process.env.RESPONSE_CRM_UPDATE_PAYMENT_URL;
  const crmPayload = usesVerificationOrder ?
    buildResponseCrmCardVerificationPayload(user, payload, payment) :
    buildResponseCrmPaymentUpdatePayload(user, payload, payment);
  const url = process.env.RESPONSE_CRM_UPDATE_PAYMENT_URL || process.env.RESPONSE_CRM_ADD_ORDER_URL;
  const response = await postResponseCrm(url, crmPayload);
  const crmResult = normalizeCrmResult(response.body);

  if (!crmResult.approved)
  {
    const error = new Error('Card verification was declined');
    error.status = 402;
    error.crmResult = crmResult.publicResult;
    throw error;
  }

  return {
    crmResult,
    paymentMethod: await savePaymentMethod(user.id, {
      customerId: crmCustomerId(user, crmResult, payload),
      cardLast4: cardLast4(payment.cardNumber),
      lastChargedAt: null,
      nextChargedAt: calculateNextChargedAt(payload.nextChargedAt || payload.next_charged_at || payload.nextChargeAt || payload.next_charge_at)
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
          status: 'active'
        },
        transaction
      }
    );

    return PaymentMethod.create({
      userId,
      customerId: data.customerId || null,
      cardLast4: data.cardLast4,
      lastChargedAt: data.lastChargedAt || null,
      nextChargedAt: data.nextChargedAt || null,
      status: data.status || 'active'
    }, { transaction: options.transaction || transaction });
  });
}

async function findActivePaymentMethod(userId)
{
  return PaymentMethod.findOne({
    where: {
      userId,
      status: 'active'
    },
    order: [['createdAt', 'DESC']]
  });
}

function buildResponseCrmOrderPayload(payload, payment)
{
  const customer = normalizeCheckoutCustomer(payload);

  return stripEmpty({
    ...safeObject(payload.crm || payload.responseCrm || payload.response_crm),
    site_id: payload.siteId || payload.site_id || process.env.RESPONSE_CRM_SITE_ID,
    campaign_id: payload.campaignId || payload.campaign_id || process.env.RESPONSE_CRM_CAMPAIGN_ID,
    product_id: payload.productId || payload.product_id || process.env.RESPONSE_CRM_PRODUCT_ID,
    offer_id: payload.offerId || payload.offer_id || process.env.RESPONSE_CRM_OFFER_ID,
    email: normalizeEmail(payload.email),
    first_name: customer.firstName,
    last_name: customer.lastName,
    phone: customer.phone,
    address1: customer.address1,
    address2: customer.address2,
    city: customer.city,
    state: customer.state,
    zip: customer.zip,
    country: customer.country,
    amount: payload.amount || null,
    currency: payload.currency || 'USD',
    order_id: payload.orderId || payload.order_id || null,
    parent_order_id: payload.parentOrderId || payload.parent_order_id || payload.frontsellOrderId || payload.frontsell_order_id || null,
    idempotency_id: idempotencyId('upsell', payload.orderId || payload.order_id, payload.email),
    is_upsell: true,
    upsell: true,
    billing: {
      ...customer.billing,
      ...safeObject(payload.billing || payload.billingAddress || payload.billing_address)
    },
    shipping: {
      ...customer.shipping,
      ...safeObject(payload.shipping || payload.shippingAddress || payload.shipping_address)
    },
    customer: {
      first_name: customer.firstName,
      last_name: customer.lastName,
      phone: customer.phone,
      address1: customer.address1,
      address2: customer.address2,
      city: customer.city,
      state: customer.state,
      zip: customer.zip,
      country: customer.country
    },
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
  const customer = normalizeCheckoutCustomer(payload);

  return stripEmpty({
    ...safeObject(payload.crm || payload.responseCrm || payload.response_crm),
    site_id: payload.siteId || payload.site_id || process.env.RESPONSE_CRM_SITE_ID,
    campaign_id: payload.campaignId || payload.campaign_id || process.env.RESPONSE_CRM_CAMPAIGN_ID,
    product_id: payload.productId || payload.product_id || process.env.RESPONSE_CRM_PRODUCT_ID,
    email: user.email,
    first_name: customer.firstName || user.name || null,
    last_name: customer.lastName || null,
    phone: customer.phone,
    customer_id: payload.customerId || payload.customer_id || user.metadata?.responseCrmCustomerId || null,
    order_id: payload.orderId || payload.order_id || user.metadata?.responseCrmOrderId || null,
    idempotency_id: idempotencyId('payment-update', payload.orderId || payload.order_id || user.metadata?.responseCrmOrderId, user.email),
    update_payment_method: true,
    amount: payload.amount || 0,
    currency: payload.currency || 'USD',
    billing: {
      ...customer.billing,
      ...safeObject(payload.billing || payload.billingAddress || payload.billing_address)
    },
    payment: responseCrmPayment(payment),
    metadata: sanitizeMetadata({
      source: 'fitaccess_payment_update',
      userId: user.id
    })
  });
}

function buildResponseCrmCardVerificationPayload(user, payload, payment)
{
  const customer = normalizeCheckoutCustomer(payload);

  return stripEmpty({
    ...safeObject(payload.crm || payload.responseCrm || payload.response_crm),
    site_id: payload.siteId || payload.site_id || process.env.RESPONSE_CRM_SITE_ID,
    campaign_id: payload.campaignId || payload.campaign_id || process.env.RESPONSE_CRM_CAMPAIGN_ID,
    product_id: payload.verificationProductId || payload.verification_product_id || process.env.RESPONSE_CRM_VERIFICATION_PRODUCT_ID || process.env.RESPONSE_CRM_PRODUCT_ID,
    offer_id: payload.verificationOfferId || payload.verification_offer_id || process.env.RESPONSE_CRM_VERIFICATION_OFFER_ID || process.env.RESPONSE_CRM_OFFER_ID,
    email: user.email,
    first_name: customer.firstName || user.name || null,
    last_name: customer.lastName || null,
    phone: customer.phone,
    amount: 0,
    currency: payload.currency || 'USD',
    order_id: payload.orderId || payload.order_id || null,
    customer_id: payload.customerId || payload.customer_id || user.metadata?.responseCrmCustomerId || null,
    parent_order_id: payload.parentOrderId || payload.parent_order_id || user.metadata?.responseCrmOrderId || null,
    idempotency_id: idempotencyId('card-verify', user.id, cardLast4(payment.cardNumber)),
    verify_card: true,
    card_verification: true,
    payment_update: true,
    billing: {
      ...customer.billing,
      ...safeObject(payload.billing || payload.billingAddress || payload.billing_address)
    },
    payment: responseCrmPayment(payment),
    metadata: sanitizeMetadata({
      source: 'fitaccess_card_verification',
      userId: user.id,
      purpose: 'payment_method_update'
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

function validatePayment(payment)
{
  if (!payment.cardHolderName)
  {
    throwValidationError('Name on card is required.');
  }

  const brand = detectCardBrand(payment.cardNumber);

  if (!brand)
  {
    throwValidationError('Enter a supported card number.');
  }

  if (!brand.lengths.includes(payment.cardNumber.length))
  {
    throwValidationError(`${brand.label} card number must be ${brand.lengths.join(' or ')} digits.`);
  }

  if (!luhnValid(payment.cardNumber))
  {
    throwValidationError('Card number is not valid. Please check the digits.');
  }

  if (!payment.expiryMonth || !payment.expiryYear)
  {
    throwValidationError('Card expiry month and year are required.');
  }

  const month = Number(payment.expiryMonth);
  const year = Number(payment.expiryYear);

  if (!Number.isInteger(month) || month < 1 || month > 12)
  {
    throwValidationError('Expiry month must be between 01 and 12.');
  }

  if (!Number.isInteger(year) || String(year).length !== 4)
  {
    throwValidationError('Expiry year must be four digits.');
  }

  const now = new Date();
  const expiryCutoff = new Date(year, month, 1);

  if (expiryCutoff <= new Date(now.getFullYear(), now.getMonth(), 1))
  {
    throwValidationError('Card expiry must be a future month.');
  }

  if (!new RegExp(`^\\d{${brand.cvvLength}}$`).test(payment.cvv))
  {
    throwValidationError(`${brand.label} security code must be ${brand.cvvLength} digits.`);
  }
}

function detectCardBrand(cardNumber)
{
  if (/^4/.test(cardNumber))
  {
    return brand('visa', 'Visa', [13, 16, 19], 3);
  }

  if (/^(5[1-5]|2[2-7])/.test(cardNumber) && mastercardInRange(cardNumber))
  {
    return brand('mastercard', 'Mastercard', [16], 3);
  }

  if (/^3[47]/.test(cardNumber))
  {
    return brand('amex', 'American Express', [15], 4);
  }

  if (jcbInRange(cardNumber))
  {
    return brand('jcb', 'JCB', [16, 17, 18, 19], 3);
  }

  if (dinersInRange(cardNumber))
  {
    return brand('diners', 'Diners Club', [14, 16, 19], 3);
  }

  if (eloInRange(cardNumber))
  {
    return brand('elo', 'Elo', [16], 3);
  }

  if (/^(606282|3841)/.test(cardNumber))
  {
    return brand('hipercard', 'Hipercard', [13, 16, 19], 3);
  }

  if (/^62/.test(cardNumber))
  {
    return brand('unionpay', 'UnionPay', [16, 17, 18, 19], 3);
  }

  if (discoverInRange(cardNumber))
  {
    return brand('discover', 'Discover', [16, 19], 3);
  }

  if (maestroInRange(cardNumber))
  {
    return brand('maestro', 'Maestro', [12, 13, 14, 15, 16, 17, 18, 19], 3);
  }

  return null;
}

function brand(name, label, lengths, cvvLength)
{
  return { name, label, lengths, cvvLength };
}

function mastercardInRange(cardNumber)
{
  const firstTwo = Number(cardNumber.slice(0, 2));
  const firstSix = Number(cardNumber.slice(0, 6));

  return (firstTwo >= 51 && firstTwo <= 55) || (firstSix >= 222100 && firstSix <= 272099);
}

function discoverInRange(cardNumber)
{
  const firstTwo = Number(cardNumber.slice(0, 2));
  const firstThree = Number(cardNumber.slice(0, 3));
  const firstFour = Number(cardNumber.slice(0, 4));
  const firstSix = Number(cardNumber.slice(0, 6));

  return firstFour === 6011 ||
    firstTwo === 65 ||
    (firstThree >= 644 && firstThree <= 649) ||
    (firstSix >= 622126 && firstSix <= 622925);
}

function jcbInRange(cardNumber)
{
  const firstFour = Number(cardNumber.slice(0, 4));
  return firstFour >= 3528 && firstFour <= 3589;
}

function dinersInRange(cardNumber)
{
  const firstTwo = Number(cardNumber.slice(0, 2));
  const firstThree = Number(cardNumber.slice(0, 3));
  const firstFour = Number(cardNumber.slice(0, 4));

  return (firstThree >= 300 && firstThree <= 305) ||
    firstTwo === 36 ||
    firstTwo === 38 ||
    firstTwo === 39 ||
    firstFour === 3095;
}

function maestroInRange(cardNumber)
{
  return /^(50|5[6-9]|6[0-9])/.test(cardNumber);
}

function eloInRange(cardNumber)
{
  return /^(401178|401179|431274|438935|451416|457393|457631|457632|504175|5067|5090|627780|636297|636368|6500|6504|6505|6507|6509|6516|6550)/.test(cardNumber);
}

function luhnValid(cardNumber)
{
  let sum = 0;
  let doubleDigit = false;

  for (let index = cardNumber.length - 1; index >= 0; index -= 1)
  {
    let digit = Number(cardNumber[index]);

    if (doubleDigit)
    {
      digit *= 2;

      if (digit > 9)
      {
        digit -= 9;
      }
    }

    sum += digit;
    doubleDigit = !doubleDigit;
  }

  return sum > 0 && sum % 10 === 0;
}

function throwValidationError(message)
{
  const error = new Error(message);
  error.status = 422;
  throw error;
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

function calculateNextChargedAt(value)
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

function crmCustomerId(user, crmResult, payload)
{
  return String(
    crmResult.customerId ||
    payload.customerId ||
    payload.customer_id ||
    user.metadata?.responseCrmCustomerId ||
    '16528318'
  );
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
