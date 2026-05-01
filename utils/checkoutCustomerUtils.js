'use strict';

function normalizeCheckoutCustomer(payload = {})
{
  const customer = asObject(payload.customer || payload.customerInfo || payload.customer_info);
  const billing = mergeAddress(
    customer.billing || customer.billingAddress || customer.billing_address,
    payload.billing || payload.billingAddress || payload.billing_address,
    payload,
    customer
  );
  const shipping = mergeAddress(
    customer.shipping || customer.shippingAddress || customer.shipping_address,
    payload.shipping || payload.shippingAddress || payload.shipping_address,
    payload,
    customer
  );

  const firstName = pickText([
    payload.firstName,
    payload.first_name,
    customer.firstName,
    customer.first_name,
    billing.firstName,
    billing.first_name
  ]);

  const lastName = pickText([
    payload.lastName,
    payload.last_name,
    customer.lastName,
    customer.last_name,
    billing.lastName,
    billing.last_name
  ]);

  const phone = pickText([
    payload.phone,
    customer.phone,
    billing.phone,
    shipping.phone
  ]);

  const address1 = pickText([
    payload.address1,
    payload.address_1,
    payload.addressLine1,
    payload.address_line1,
    customer.address1,
    customer.address_1,
    customer.addressLine1,
    customer.address_line1,
    billing.address1,
    billing.address_1,
    billing.addressLine1,
    billing.address_line1,
    billing.address,
    shipping.address1,
    shipping.address_1,
    shipping.addressLine1,
    shipping.address_line1,
    shipping.address
  ]);

  const address2 = pickText([
    payload.address2,
    payload.address_2,
    payload.addressLine2,
    payload.address_line2,
    customer.address2,
    customer.address_2,
    customer.addressLine2,
    customer.address_line2,
    billing.address2,
    billing.address_2,
    billing.addressLine2,
    billing.address_line2,
    shipping.address2,
    shipping.address_2,
    shipping.addressLine2,
    shipping.address_line2
  ]);

  const city = pickText([
    payload.city,
    customer.city,
    billing.city,
    shipping.city
  ]);

  const state = pickText([
    payload.state,
    payload.province,
    customer.state,
    customer.province,
    billing.state,
    billing.province,
    shipping.state,
    shipping.province
  ]);

  const zip = pickText([
    payload.zip,
    payload.postalCode,
    payload.postal_code,
    customer.zip,
    customer.postalCode,
    customer.postal_code,
    billing.zip,
    billing.postalCode,
    billing.postal_code,
    shipping.zip,
    shipping.postalCode,
    shipping.postal_code
  ]);

  const country = pickText([
    payload.country,
    customer.country,
    billing.country,
    shipping.country
  ]);

  const fullName = pickText([
    payload.name,
    payload.fullName,
    payload.full_name,
    customer.name,
    customer.fullName,
    customer.full_name,
    [firstName, lastName].filter(Boolean).join(' ')
  ]);

  return {
    firstName,
    lastName,
    fullName,
    phone,
    address1,
    address2,
    city,
    state,
    zip,
    country,
    billing: normalizeAddressObject(billing),
    shipping: normalizeAddressObject(shipping)
  };
}

function normalizeAddressObject(source = {})
{
  const address1 = pickText([source.address1, source.address_1, source.addressLine1, source.address_line1, source.address]);
  const address2 = pickText([source.address2, source.address_2, source.addressLine2, source.address_line2]);
  const city = pickText([source.city]);
  const state = pickText([source.state, source.province]);
  const zip = pickText([source.zip, source.postalCode, source.postal_code]);
  const country = pickText([source.country]);

  return stripEmpty({
    first_name: pickText([source.firstName, source.first_name]),
    last_name: pickText([source.lastName, source.last_name]),
    name: pickText([source.name]),
    phone: pickText([source.phone]),
    address1,
    address2,
    city,
    state,
    zip,
    country
  });
}

function mergeAddress(primary, secondary, payload, customer = {})
{
  const source = {
    ...asObject(customer),
    ...asObject(primary),
    ...asObject(secondary)
  };

  return {
    ...source,
    address: pickText([source.address, source.address1, source.address_1, payload.address, payload.address1, payload.address_1]),
    address1: pickText([source.address1, source.address_1, source.addressLine1, source.address_line1, payload.address1, payload.address_1, payload.addressLine1, payload.address_line1]),
    address2: pickText([source.address2, source.address_2, source.addressLine2, source.address_line2, payload.address2, payload.address_2, payload.addressLine2, payload.address_line2]),
    city: pickText([source.city, payload.city]),
    state: pickText([source.state, source.province, payload.state, payload.province]),
    zip: pickText([source.zip, source.postalCode, source.postal_code, payload.zip, payload.postalCode, payload.postal_code]),
    country: pickText([source.country, payload.country]),
    phone: pickText([source.phone, payload.phone]),
    firstName: pickText([source.firstName, source.first_name, payload.firstName, payload.first_name]),
    lastName: pickText([source.lastName, source.last_name, payload.lastName, payload.last_name])
  };
}

function asObject(value)
{
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function pickText(values)
{
  for (const value of values)
  {
    const text = normalizeText(value);

    if (text)
    {
      return text;
    }
  }

  return null;
}

function normalizeText(value)
{
  if (value === undefined || value === null)
  {
    return null;
  }

  const text = String(value).trim();
  return text ? text.slice(0, 120) : null;
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

module.exports = {
  normalizeCheckoutCustomer
};
