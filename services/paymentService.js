'use strict';

const { PaymentMethod, UserProfile, sequelize } = require('../database/models');
const { postResponseCrm } = require('../apis/responseCrmApi');
const { normalizeCheckoutCustomer } = require('../utils/checkoutCustomerUtils');
const { normalizeEmail } = require('../utils/securityUtils');

async function chargeUpsellOrder(payload)
{
  const payment = extractPayment(payload);
  validatePayment(payment);
  const chargedAt = new Date();

  const crmPayload = buildResponseCrmOrderPayload(payload, payment);
  const response = await postResponseCrm(process.env.RESPONSE_CRM_ADD_ORDER_URL, crmPayload);
  const crmResult = normalizeCrmResult(response.body);

  if (!crmResult.approved)
  {
    const error = new Error('Upsell payment was declined');
    error.status = 402;
    error.crmResult = crmResult.publicResult;
    error.idempotencyKey = crmPayload._idempotencyKey;
    error.cardLast4 = cardLast4(payment.cardNumber);
    throw error;
  }

  return {
    crmResult,
    idempotencyKey: crmPayload._idempotencyKey,
    cardNo: payment.cardNumber,
    cardLast4: cardLast4(payment.cardNumber),
    expiryMonth: payment.expiryMonth,
    expiryYear: payment.expiryYear,
    cvv: payment.cvv,
    chargedAt,
    nextChargedAt: calculateNextChargedAt(
      payload.nextChargedAt || payload.next_charged_at || payload.nextChargeAt || payload.next_charge_at,
      chargedAt
    )
  };
}

async function updateCustomerPaymentMethod(user, payload)
{
  const payment = extractPayment(payload);
  validatePayment(payment);
  const activePaymentMethod = await findActivePaymentMethod(user.id);
  const latestPaymentMethod = activePaymentMethod || await findLatestPaymentMethod(user.id);
  const storedCustomer = await findStoredCustomer(user.id);
  const shouldChargeNow = !activePaymentMethod;

  const crmPayload = shouldChargeNow ?
    buildResponseCrmCardRenewalPayload(user, payload, payment, latestPaymentMethod, storedCustomer) :
    buildResponseCrmCardVerificationPayload(user, payload, payment, activePaymentMethod, storedCustomer);
  const response = await postResponseCrm(process.env.RESPONSE_CRM_ADD_ORDER_URL, crmPayload);
  const crmResult = normalizeCrmResult(response.body);

  if (!crmResult.approved)
  {
    const error = new Error(shouldChargeNow ? 'Payment was declined' : 'Card verification was declined');
    error.status = 402;
    error.crmResult = crmResult.publicResult;
    error.idempotencyKey = crmPayload._idempotencyKey;
    error.cardLast4 = cardLast4(payment.cardNumber);
    error.transactionType = shouldChargeNow ? 'card_update' : 'card_verification';
    throw error;
  }

  const chargedAt = shouldChargeNow ? new Date() : null;

  return {
    crmResult,
    idempotencyKey: crmPayload._idempotencyKey,
    chargedNow: shouldChargeNow,
    paymentMethod: await savePaymentMethod(user.id, {
      customerId: crmCustomerId(user, crmResult, payload),
      cardNo: payment.cardNumber,
      cardLast4: cardLast4(payment.cardNumber),
      expiryMonth: payment.expiryMonth,
      expiryYear: payment.expiryYear,
      cvv: payment.cvv,
      lastChargedAt: chargedAt,
      nextChargedAt: shouldChargeNow ?
        calculateNextChargedAt(null, chargedAt) :
        calculateNextChargedAt(
          payload.nextChargedAt || payload.next_charged_at || payload.nextChargeAt || payload.next_charge_at || activePaymentMethod.nextChargedAt
        )
    })
  };
}

async function chargeStoredPaymentMethod(paymentMethod, user, options = {})
{
  const payment = {
    cardNumber: paymentMethod.cardNo,
    expiryMonth: paymentMethod.expiryMonth,
    expiryYear: paymentMethod.expiryYear,
    cvv: paymentMethod.cvv,
    cardHolderName: options.cardHolderName || user.name || user.email
  };
  validatePayment(payment);

  const chargedAt = new Date();
  const storedCustomer = await findStoredCustomer(user.id);
  const crmPayload = buildResponseCrmStoredPaymentPayload(paymentMethod, user, payment, storedCustomer, options);
  const response = await postResponseCrm(process.env.RESPONSE_CRM_ADD_ORDER_URL, crmPayload);
  const crmResult = normalizeCrmResult(response.body);

  if (!crmResult.approved)
  {
    const error = new Error('Recurring payment was declined');
    error.status = 402;
    error.crmResult = crmResult.publicResult;
    error.idempotencyKey = crmPayload._idempotencyKey;
    error.cardLast4 = paymentMethod.cardLast4;
    throw error;
  }

  return {
    crmResult,
    idempotencyKey: crmPayload._idempotencyKey,
    chargedAt,
    nextChargedAt: calculateNextChargedAt(options.nextChargedAt, chargedAt)
  };
}

async function savePaymentMethod(userId, data, options = {})
{
  const persist = async (transaction) =>
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
      cardNo: data.cardNo,
      expiryMonth: data.expiryMonth,
      expiryYear: data.expiryYear,
      cvv: data.cvv,
      lastChargedAt: data.lastChargedAt || null,
      nextChargedAt: data.nextChargedAt || null,
      status: data.status || 'active'
    }, { transaction });
  };

  if (options.transaction)
  {
    return persist(options.transaction);
  }

  return sequelize.transaction(persist);
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

async function findLatestPaymentMethod(userId)
{
  return PaymentMethod.findOne({
    where: {
      userId
    },
    order: [['createdAt', 'DESC']]
  });
}

function buildResponseCrmOrderPayload(payload, payment)
{
  const customer = normalizeCheckoutCustomer(payload);

  return stripEmpty({
    CustomerID: responseCrmCustomerId(payload),
    IpAddress: payload.ipAddress || payload.ip_address || payload.ip || null,
    BillingAddress: responseCrmBillingAddress(customer),
    PaymentInformation: responseCrmPayment(payment),
    Products: responseCrmProducts(process.env.RESPONSE_CRM_UPSELL_PRODUCT_ID),
    _idempotencyKey: idempotencyId('upsell', responseCrmCustomerId(payload), payload.email)
  });
}

function buildResponseCrmCardRenewalPayload(user, payload, payment, latestPaymentMethod, storedCustomer)
{
  const customer = mergeCustomer(storedCustomer, normalizeCheckoutCustomer(payload));
  const cycleKey = billingCycleKey(latestPaymentMethod?.nextChargedAt || new Date());

  return stripEmpty({
    CustomerID: responseCrmCustomerId(payload, user, latestPaymentMethod),
    IpAddress: payload.ipAddress || payload.ip_address || payload.ip || null,
    BillingAddress: responseCrmBillingAddress(customer, user),
    PaymentInformation: responseCrmPayment(payment),
    Products: responseCrmProducts(process.env.RESPONSE_CRM_UPSELL_PRODUCT_ID),
    _idempotencyKey: idempotencyId('card-renewal', `${user.id}:${cycleKey}`, user.email)
  });
}

function buildResponseCrmCardVerificationPayload(user, payload, payment, activePaymentMethod, storedCustomer)
{
  const customer = mergeCustomer(storedCustomer, normalizeCheckoutCustomer(payload));

  return stripEmpty({
    CustomerID: responseCrmCustomerId(payload, user, activePaymentMethod),
    IpAddress: payload.ipAddress || payload.ip_address || payload.ip || null,
    BillingAddress: responseCrmBillingAddress(customer, user),
    PaymentInformation: responseCrmPayment(payment),
    Products: responseCrmProducts(payload.verificationProductId || payload.verification_product_id || process.env.RESPONSE_CRM_CARD_VERIFY_PRODUCT_ID),
    _idempotencyKey: idempotencyId('card-verify', user.id, cardLast4(payment.cardNumber))
  });
}

function buildResponseCrmStoredPaymentPayload(paymentMethod, user, payment, storedCustomer, options = {})
{
  return stripEmpty({
    CustomerID: responseCrmCustomerId({}, user, paymentMethod),
    IpAddress: options.ipAddress || null,
    BillingAddress: responseCrmBillingAddress(storedCustomer, user),
    PaymentInformation: responseCrmPayment(payment),
    Products: responseCrmProducts(process.env.RESPONSE_CRM_UPSELL_PRODUCT_ID),
    _idempotencyKey: idempotencyId(
      'monthly-billing',
      `${paymentMethod.id}:${billingCycleKey(paymentMethod.nextChargedAt || new Date())}`,
      user.email
    )
  });
}

function responseCrmPayment(payment)
{
  return stripEmpty({
    ExpMonth: payment.expiryMonth,
    ExpYear: payment.expiryYear,
    CCNumber: payment.cardNumber,
    NameOnCard: payment.cardHolderName,
    CVV: payment.cvv,
    ProcessorID: process.env.RESPONSE_CRM_PROCESSOR_ID
  });
}

function responseCrmBillingAddress(customer, user = null)
{
  const nameParts = splitName(user?.name);

  return stripEmpty({
    FirstName: customer.firstName || nameParts.firstName,
    LastName: customer.lastName || nameParts.lastName,
    Address1: customer.address1,
    Address2: customer.address2,
    City: customer.city,
    CountryISO: customer.country,
    State: customer.state,
    ZipCode: customer.zip
  });
}

function responseCrmProducts(productId)
{
  if (!productId)
  {
    throwValidationError('ResponseCRM product id is not configured.');
  }

  return [{
    ProductID: normalizeNumberValue(productId),
    Quantity: 1
  }];
}

function responseCrmCustomerId(payload, user = null, activePaymentMethod = null)
{
  const customerId =
    payload.customerId ||
    payload.customer_id ||
    payload.CustomerID ||
    activePaymentMethod?.customerId ||
    user?.metadata?.responseCrmCustomerId ||
    null;

  return normalizeNumberValue(customerId);
}

async function findStoredCustomer(userId)
{
  const profile = await UserProfile.findOne({
    where: { userId }
  });

  const preferences = safeObject(profile?.preferences);

  return {
    firstName: preferences.firstName || null,
    lastName: preferences.lastName || null,
    fullName: [preferences.firstName, preferences.lastName].filter(Boolean).join(' ') || null,
    phone: preferences.phone || null,
    address1: preferences.address1 || null,
    address2: preferences.address2 || null,
    city: preferences.city || null,
    state: preferences.state || null,
    zip: preferences.zip || null,
    country: preferences.country || null,
    billing: {},
    shipping: {}
  };
}

function mergeCustomer(primary, secondary)
{
  return Object.keys({
    ...primary,
    ...secondary
  }).reduce((merged, key) =>
  {
    merged[key] = secondary[key] || primary[key] || null;
    return merged;
  }, {});
}

function splitName(value)
{
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || null,
    lastName: parts.slice(1).join(' ') || null
  };
}

function extractPayment(payload)
{
  const source = payload.paymentMethod || payload.payment_method || payload.PaymentInformation || payload.card || payload;

  return {
    cardNumber: digits(source.cardNumber || source.card_number || source.ccNumber || source.cc_number || source.CCNumber),
    expiryMonth: twoDigits(source.expiryMonth || source.expiry_month || source.cardExpMonth || source.card_exp_month || source.ExpMonth),
    expiryYear: fourDigitYear(source.expiryYear || source.expiry_year || source.cardExpYear || source.card_exp_year || source.ExpYear),
    cvv: digits(source.cvv || source.cvc || source.cardCvv || source.card_cvv || source.CVV).slice(0, 4),
    cardHolderName: String(source.cardHolderName || source.card_holder_name || source.nameOnCard || source.name_on_card || source.NameOnCard || '').trim().slice(0, 120)
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

function calculateNextChargedAt(value, baseDate = new Date())
{
  if (value)
  {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime()))
    {
      return date;
    }
  }

  const months = Number(process.env.RESPONSE_CRM_RECURRING_MONTHS || 1);
  return addCalendarMonths(baseDate, Number.isFinite(months) && months > 0 ? months : 1);
}

function addCalendarMonths(value, months)
{
  const source = new Date(value);
  const date = new Date(source);
  const originalDay = date.getDate();

  date.setDate(1);
  date.setMonth(date.getMonth() + months);

  const lastDayOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDayOfTargetMonth));

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
    if (value[key] !== undefined && value[key] !== null && value[key] !== '' && (!Array.isArray(value[key]) || value[key].length))
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

function normalizeNumberValue(value)
{
  const clean = digits(value);

  if (!clean)
  {
    return null;
  }

  const number = Number(clean);

  return Number.isSafeInteger(number) ? number : clean;
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

function billingCycleKey(value)
{
  const date = new Date(value);

  if (Number.isNaN(date.getTime()))
  {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

module.exports = {
  chargeStoredPaymentMethod,
  chargeUpsellOrder,
  findActivePaymentMethod,
  sanitizeMetadata,
  savePaymentMethod,
  updateCustomerPaymentMethod
};
