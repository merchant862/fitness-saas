'use strict';

const { AppSetting } = require('../database/models');

const MEMBER_DEVICE_LIMIT_KEY = 'member_device_limit';
const DEFAULT_MEMBER_DEVICE_LIMIT = 1;
const MIN_MEMBER_DEVICE_LIMIT = 1;
const MAX_MEMBER_DEVICE_LIMIT = 10;
const RESEND_SETTING_KEYS = [
  'resend_api_key',
  'resend_from_email'
];
const BRAND_SETTING_KEYS = [
  'support_email',
  'company_names',
  'website_url'
];
const STICKY_SETTING_KEYS = [
  'sticky_gateway_id',
  'sticky_app_key',
  'sticky_domain',
  'sticky_api_path',
  'sticky_api_username',
  'sticky_api_password',
  'sticky_timeout_ms',
  'sticky_campaign_id',
  'sticky_shipping_id',
  'sticky_tran_type',
  'sticky_upsell_step_num',
  'sticky_default_affiliate_id',
  'sticky_tracker_postback_url',
  'sticky_product_key',
  'sticky_product_label',
  'sticky_offer_id',
  'sticky_product_id',
  'sticky_billing_model_id'
];

const STICKY_DEFAULTS = {
  sticky_domain: 'sticky.io',
  sticky_api_path: '/admin/transact.php',
  sticky_timeout_ms: '15000',
  sticky_tran_type: 'Sale',
  sticky_product_key: 'main',
  sticky_product_label: 'Main product'
};
const BRAND_DEFAULTS = {
  support_email: 'support@purple-flare.com',
  company_names: 'THE PURPLE FLARE LLC and PURPLE FLARE LTD',
  website_url: 'https://www.fitaccess.app/'
};
const RESEND_DEFAULTS = {
  resend_api_key: '',
  resend_from_email: 'FitAccess <noreply@example.com>'
};

async function getMemberDeviceLimit(options = {})
{
  const setting = await AppSetting.findOne({
    where: { settingKey: MEMBER_DEVICE_LIMIT_KEY },
    transaction: options.transaction
  });

  return normalizeDeviceLimit(setting?.settingValue);
}

async function setMemberDeviceLimit(value)
{
  const limit = normalizeDeviceLimit(value);

  const [setting] = await AppSetting.findOrCreate({
    where: { settingKey: MEMBER_DEVICE_LIMIT_KEY },
    defaults: {
      settingKey: MEMBER_DEVICE_LIMIT_KEY,
      settingValue: String(limit)
    }
  });

  if (setting.settingValue !== String(limit))
  {
    await setting.update({ settingValue: String(limit) });
  }

  return limit;
}

async function getStickySettings(options = {})
{
  const rows = await AppSetting.findAll({
    where: { settingKey: STICKY_SETTING_KEYS },
    transaction: options.transaction
  });
  const stored = new Map(rows.map((row) => [row.settingKey, row.settingValue]));
  const settings = {};

  STICKY_SETTING_KEYS.forEach((key) =>
  {
    settings[key] = stored.get(key) || STICKY_DEFAULTS[key] || '';
  });

  return settings;
}

async function getResendSettings(options = {})
{
  return getSettingsObject(RESEND_SETTING_KEYS, RESEND_DEFAULTS, options);
}

async function updateResendSettings(input)
{
  const settings = {
    resend_api_key: clean(input.resendApiKey),
    resend_from_email: clean(input.resendFromEmail) || RESEND_DEFAULTS.resend_from_email
  };

  await saveSettings(settings);
  return getResendSettings();
}

async function getBrandSettings(options = {})
{
  return getSettingsObject(BRAND_SETTING_KEYS, BRAND_DEFAULTS, options);
}

async function updateBrandSettings(input)
{
  const settings = {
    support_email: clean(input.supportEmail) || BRAND_DEFAULTS.support_email,
    company_names: normalizeCompanyNames(input.companyNames || input.companyName),
    website_url: normalizeWebsiteUrl(input.websiteUrl)
  };

  await saveSettings(settings);
  return getBrandSettings();
}

async function getPublicWebsiteUrl(path = '/')
{
  const settings = await getBrandSettings();
  const baseUrl = normalizeWebsiteUrl(settings.website_url);
  const suffix = String(path || '/');

  try
  {
    return new URL(suffix.startsWith('/') ? suffix : `/${suffix}`, baseUrl).toString();
  }
  catch
  {
    return new URL('/', BRAND_DEFAULTS.website_url).toString();
  }
}

async function updateStickySettings(input)
{
  const settings = normalizeStickySettings(input);

  await saveSettings(settings);

  return getStickySettings();
}

function normalizeDeviceLimit(value)
{
  const number = Number(value);

  if (!Number.isInteger(number))
  {
    return DEFAULT_MEMBER_DEVICE_LIMIT;
  }

  return Math.min(Math.max(number, MIN_MEMBER_DEVICE_LIMIT), MAX_MEMBER_DEVICE_LIMIT);
}

function normalizeStickySettings(input)
{
  return {
    sticky_gateway_id: clean(input.stickyGatewayId),
    sticky_app_key: clean(input.stickyAppKey),
    sticky_domain: clean(input.stickyDomain) || STICKY_DEFAULTS.sticky_domain,
    sticky_api_path: normalizeApiPath(input.stickyApiPath),
    sticky_api_username: clean(input.stickyApiUsername),
    sticky_api_password: clean(input.stickyApiPassword),
    sticky_timeout_ms: normalizeIntegerString(input.stickyTimeoutMs, STICKY_DEFAULTS.sticky_timeout_ms),
    sticky_campaign_id: clean(input.stickyCampaignId),
    sticky_shipping_id: clean(input.stickyShippingId),
    sticky_tran_type: clean(input.stickyTranType) || STICKY_DEFAULTS.sticky_tran_type,
    sticky_upsell_step_num: clean(input.stickyUpsellStepNum),
    sticky_default_affiliate_id: clean(input.stickyDefaultAffiliateId),
    sticky_tracker_postback_url: clean(input.stickyTrackerPostbackUrl),
    sticky_product_key: clean(input.stickyProductKey) || STICKY_DEFAULTS.sticky_product_key,
    sticky_product_label: clean(input.stickyProductLabel) || STICKY_DEFAULTS.sticky_product_label,
    sticky_offer_id: clean(input.stickyOfferId),
    sticky_product_id: clean(input.stickyProductId),
    sticky_billing_model_id: clean(input.stickyBillingModelId)
  };
}

async function getSettingsObject(keys, defaults, options = {})
{
  const rows = await AppSetting.findAll({
    where: { settingKey: keys },
    transaction: options.transaction
  });
  const stored = new Map(rows.map((row) => [row.settingKey, row.settingValue]));
  const settings = {};

  keys.forEach((key) =>
  {
    settings[key] = stored.get(key) || defaults[key] || '';
  });

  return settings;
}

async function saveSettings(settings)
{
  await Promise.all(Object.entries(settings).map(async ([key, value]) =>
  {
    const [setting] = await AppSetting.findOrCreate({
      where: { settingKey: key },
      defaults: {
        settingKey: key,
        settingValue: value
      }
    });

    if (setting.settingValue !== value)
    {
      await setting.update({ settingValue: value });
    }
  }));
}

function normalizeCompanyNames(value)
{
  const names = String(value || '')
    .split(/\r?\n|,/)
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 10);

  return names.length ? names.join(' and ') : BRAND_DEFAULTS.company_names;
}

function normalizeWebsiteUrl(value)
{
  const raw = clean(value) || BRAND_DEFAULTS.website_url;

  try
  {
    const parsed = new URL(raw);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
    {
      return BRAND_DEFAULTS.website_url;
    }

    parsed.hash = '';
    parsed.search = '';
    parsed.pathname = '/';
    return parsed.toString();
  }
  catch
  {
    return BRAND_DEFAULTS.website_url;
  }
}

function clean(value)
{
  return String(value || '').trim().slice(0, 1000);
}

function normalizeApiPath(value)
{
  const path = clean(value) || STICKY_DEFAULTS.sticky_api_path;
  return path.startsWith('/') ? path : `/${path}`;
}

function normalizeIntegerString(value, fallback)
{
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? String(number) : fallback;
}

module.exports = {
  BRAND_DEFAULTS,
  BRAND_SETTING_KEYS,
  DEFAULT_MEMBER_DEVICE_LIMIT,
  MAX_MEMBER_DEVICE_LIMIT,
  MEMBER_DEVICE_LIMIT_KEY,
  MIN_MEMBER_DEVICE_LIMIT,
  RESEND_DEFAULTS,
  RESEND_SETTING_KEYS,
  STICKY_DEFAULTS,
  STICKY_SETTING_KEYS,
  getBrandSettings,
  getMemberDeviceLimit,
  getPublicWebsiteUrl,
  getResendSettings,
  getStickySettings,
  normalizeDeviceLimit,
  normalizeStickySettings,
  normalizeWebsiteUrl,
  setMemberDeviceLimit,
  updateBrandSettings,
  updateResendSettings,
  updateStickySettings
};
