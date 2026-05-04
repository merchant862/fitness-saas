'use strict';

function normalizeCheckoutCustomer(payload = {})
{
  const customer = asObject(payload.customer || payload.customerInfo || payload.customer_info);
  const billing = mergeAddress(
    customer.billing || customer.billingAddress || customer.billing_address || customer.BillingAddress,
    payload.billing || payload.billingAddress || payload.billing_address || payload.BillingAddress,
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
    payload.FirstName,
    customer.firstName,
    customer.first_name,
    customer.FirstName,
    billing.firstName,
    billing.first_name,
    billing.FirstName
  ]);

  const lastName = pickText([
    payload.lastName,
    payload.last_name,
    payload.LastName,
    customer.lastName,
    customer.last_name,
    customer.LastName,
    billing.lastName,
    billing.last_name,
    billing.LastName
  ]);

  const phone = pickText([
    payload.phone,
    payload.Phone,
    customer.phone,
    customer.Phone,
    billing.phone,
    shipping.phone
  ]);

  const address1 = pickText([
    payload.address1,
    payload.address_1,
    payload.addressLine1,
    payload.address_line1,
    payload.Address1,
    customer.address1,
    customer.address_1,
    customer.addressLine1,
    customer.address_line1,
    customer.Address1,
    billing.address1,
    billing.address_1,
    billing.addressLine1,
    billing.address_line1,
    billing.Address1,
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
    payload.Address2,
    customer.address2,
    customer.address_2,
    customer.addressLine2,
    customer.address_line2,
    customer.Address2,
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
    payload.City,
    customer.city,
    customer.City,
    billing.city,
    billing.City,
    shipping.city
  ]);

  const state = pickText([
    payload.state,
    payload.province,
    payload.State,
    customer.state,
    customer.province,
    customer.State,
    billing.state,
    billing.province,
    billing.State,
    shipping.state,
    shipping.province
  ]);

  const zip = pickText([
    payload.zip,
    payload.postalCode,
    payload.postal_code,
    payload.ZipCode,
    customer.zip,
    customer.postalCode,
    customer.postal_code,
    customer.ZipCode,
    billing.zip,
    billing.postalCode,
    billing.postal_code,
    billing.ZipCode,
    shipping.zip,
    shipping.postalCode,
    shipping.postal_code
  ]);

  const country = pickText([
    payload.country,
    payload.CountryISO,
    customer.country,
    customer.CountryISO,
    billing.country,
    billing.CountryISO,
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
  const address1 = pickText([source.address1, source.address_1, source.addressLine1, source.address_line1, source.Address1, source.address]);
  const address2 = pickText([source.address2, source.address_2, source.addressLine2, source.address_line2]);
  const city = pickText([source.city, source.City]);
  const state = pickText([source.state, source.province, source.State]);
  const zip = pickText([source.zip, source.postalCode, source.postal_code, source.ZipCode]);
  const country = pickText([source.country, source.CountryISO]);

  return stripEmpty({
    first_name: pickText([source.firstName, source.first_name, source.FirstName]),
    last_name: pickText([source.lastName, source.last_name, source.LastName]),
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
    address1: pickText([source.address1, source.address_1, source.addressLine1, source.address_line1, source.Address1, payload.address1, payload.address_1, payload.addressLine1, payload.address_line1, payload.Address1]),
    address2: pickText([source.address2, source.address_2, source.addressLine2, source.address_line2, source.Address2, payload.address2, payload.address_2, payload.addressLine2, payload.address_line2, payload.Address2]),
    city: pickText([source.city, source.City, payload.city, payload.City]),
    state: pickText([source.state, source.province, source.State, payload.state, payload.province, payload.State]),
    zip: pickText([source.zip, source.postalCode, source.postal_code, source.ZipCode, payload.zip, payload.postalCode, payload.postal_code, payload.ZipCode]),
    country: pickText([source.country, source.CountryISO, payload.country, payload.CountryISO]),
    phone: pickText([source.phone, source.Phone, payload.phone, payload.Phone]),
    firstName: pickText([source.firstName, source.first_name, source.FirstName, payload.firstName, payload.first_name, payload.FirstName]),
    lastName: pickText([source.lastName, source.last_name, source.LastName, payload.lastName, payload.last_name, payload.LastName])
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
