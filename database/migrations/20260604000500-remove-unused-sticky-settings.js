'use strict';

const REMOVED_KEYS = [
  'sticky_gateway_id',
  'sticky_default_affiliate_id',
  'sticky_tracker_postback_url',
  'sticky_product_key',
  'sticky_product_label',
  'sticky_tran_type',
  'sticky_upsell_step_num'
];

module.exports = {
  async up(queryInterface)
  {
    await queryInterface.bulkDelete('app_settings', {
      setting_key: REMOVED_KEYS
    });
  },

  async down(queryInterface)
  {
    const now = new Date();
    await queryInterface.bulkInsert('app_settings', REMOVED_KEYS.map((key) => ({
      setting_key: key,
      setting_value: defaultValue(key),
      created_at: now,
      updated_at: now
    }))).catch(() => {});
  }
};

function defaultValue(key)
{
  const defaults = {
    sticky_tran_type: 'Sale',
    sticky_product_key: 'main',
    sticky_product_label: 'Main product'
  };

  return defaults[key] || '';
}
