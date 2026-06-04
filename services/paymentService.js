'use strict';

const { postStickyOrder } = require('../apis/stickyApi');
const { getStickySettings } = require('./appSettingsService');
const { normalizeCheckoutCustomer } = require('../utils/checkoutCustomerUtils');
const { normalizeEmail } = require('../utils/securityUtils');

async function chargeUpsellOrder(payload)
{
  const payment = extractPayment(payload);
  validatePayment(payment);
  const chargedAt = new Date();
  const stickySettings = await getStickySettings();

  const crmPayload = buildStickyOrderPayload(payload, payment, stickySettings);
  const response = await postStickyOrder(crmPayload, stickySettings);
  const crmResult = normalizeStickyResult(response.body);

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
    cardLast4: cardLast4(payment.cardNumber),
    chargedAt
  };
}

function buildStickyOrderPayload(payload, payment, stickySettings)
{
  const customer = normalizeCheckoutCustomer(payload);
  const customerId = providerCustomerIdFromPayload(payload);

  return stickyNewOrderPayload({
    customer,
    payment,
    productId: stickyProductId(stickySettings, 'sticky_product_id', 'Sticky product ID'),
    ipAddress: payload.ipAddress || payload.ip_address || payload.ip || null,
    email: payload.email,
    idempotencyKey: idempotencyId('upsell', customerId, payload.email),
    stepNum: stickyValue(stickySettings, 'sticky_upsell_step_num'),
    stickySettings
  });
}

function stickyNewOrderPayload({ customer, user = null, payment, productId, ipAddress, email, idempotencyKey, stepNum = null, stickySettings = {} })
{
  const nameParts = splitName(customer.fullName || user?.name || payment.cardHolderName);
  const firstName = customer.firstName || nameParts.firstName;
  const lastName = customer.lastName || nameParts.lastName;

  return stripEmpty({
    method: 'NewOrder',
    firstName,
    lastName,
    shippingAddress1: customer.address1,
    shippingAddress2: customer.address2,
    shippingCity: customer.city,
    shippingState: customer.state,
    shippingZip: customer.zip,
    shippingCountry: customer.country,
    phone: customer.phone,
    email: email || user?.email,
    creditCardType: stickyCardType(payment.cardNumber),
    creditCardNumber: payment.cardNumber,
    expirationDate: stickyExpirationDate(payment),
    CVV: payment.cvv,
    tranType: stickyValue(stickySettings, 'sticky_tran_type') || 'Sale',
    ipAddress,
    campaignId: stickyRequired(stickySettings, 'sticky_campaign_id', 'Sticky campaign ID'),
    productId,
    shippingId: stickyRequired(stickySettings, 'sticky_shipping_id', 'Sticky shipping ID'),
    billingSameAsShipping: 'YES',
    billingFirstName: firstName,
    billingLastName: lastName,
    billingAddress1: customer.address1,
    billingAddress2: customer.address2,
    billingCity: customer.city,
    billingState: customer.state,
    billingZip: customer.zip,
    billingCountry: customer.country,
    product_qty_1: 1,
    forceGatewayId: stickyValue(stickySettings, 'sticky_gateway_id'),
    AFID: stickySettings.sticky_default_affiliate_id || null,
    offer_id: stickySettings.sticky_offer_id || null,
    billing_model_id: stickySettings.sticky_billing_model_id || null,
    'product_step[1]': stepNum || null,
    _idempotencyKey: idempotencyKey,
    notes: stickyNotes(idempotencyKey, customer)
  });
}

function stickyProductId(stickySettings, primaryKey, label)
{
  const productId = stickySettings[primaryKey];

  if (!productId)
  {
    throwValidationError(`${label} is not configured.`);
  }

  return normalizeNumberValue(productId);
}

function stickyRequired(stickySettings, settingKey, label)
{
  const value = stickyValue(stickySettings, settingKey);

  if (!value)
  {
    throwValidationError(`${label} is not configured.`);
  }

  return value;
}

function stickyValue(stickySettings, settingKey)
{
  return stickySettings?.[settingKey] || '';
}

function stickyCardType(cardNumber)
{
  const brand = detectCardBrand(cardNumber);

  if (!brand)
  {
    return null;
  }

  const aliases = {
    amex: 'amex',
    diners: 'diners',
    discover: 'discover',
    elo: 'elo',
    hipercard: 'hipercard',
    jcb: 'jcb',
    maestro: 'maestro',
    mastercard: 'master',
    unionpay: 'unionpay',
    visa: 'visa'
  };

  return aliases[brand.name] || brand.name;
}

function stickyExpirationDate(payment)
{
  return `${payment.expiryMonth}${String(payment.expiryYear).slice(-2)}`;
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

function normalizeStickyResult(body)
{
  const responseCode = String(
    body.responseCode ||
    body.response_code ||
    body.ResponseCode ||
    ''
  );
  const errorFound = String(body.errorFound ?? body.error_found ?? '').toLowerCase();
  const statusText = String(
    body.status ||
    body.result ||
    body.response ||
    body.transaction_status ||
    body.transactionStatus ||
    body.resp_msg ||
    body.declineReason ||
    body.errorMessage ||
    ''
  ).toLowerCase();

  const declined = errorFound === '1' ||
    (responseCode && responseCode !== '100') ||
    ['declined', 'failed', 'failure', 'error', 'rejected'].some((word) => statusText.includes(word));
  const approved = body.success === true ||
    body.approved === true ||
    responseCode === '100' ||
    (!declined && statusText.includes('approved'));

  return {
    approved: approved && !declined,
    orderId: body.orderId || body.order_id || body.id || body.data?.order_id || body.data?.orderId || null,
    transactionId: body.transactionID || body.transactionId || body.transaction_id || body.trans_id || body.data?.transaction_id || body.data?.transactionId || null,
    customerId: body.customerId || body.customer_id || body.data?.customer_id || body.data?.customerId || null,
    publicResult: body
  };
}

function cardLast4(value)
{
  return digits(value).slice(-4);
}

function providerCustomerIdFromPayload(payload = {}, user = null)
{
  const customerId =
    payload.customerId ||
    payload.customer_id ||
    payload.CustomerID ||
    payload.stickyCustomerId ||
    payload.sticky_customer_id ||
    user?.metadata?.stickyCustomerId ||
    user?.metadata?.responseCrmCustomerId ||
    null;

  return normalizeNumberValue(customerId);
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

module.exports = {
  chargeUpsellOrder
};
