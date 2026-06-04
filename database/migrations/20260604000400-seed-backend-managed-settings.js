'use strict';

const SETTINGS = {
  support_email: 'support@purple-flare.com',
  company_names: 'THE PURPLE FLARE LLC and PURPLE FLARE LTD',
  website_url: 'https://www.fitaccess.app/',
  resend_api_key: '',
  resend_from_email: 'FitAccess <noreply@example.com>',
  sticky_app_key: '',
  sticky_domain: 'sticky.io',
  sticky_api_path: '/admin/transact.php',
  sticky_api_username: '',
  sticky_api_password: '',
  sticky_timeout_ms: '15000',
  sticky_campaign_id: '',
  sticky_shipping_id: '',
  sticky_offer_id: '',
  sticky_product_id: '',
  sticky_billing_model_id: ''
};

module.exports = {
  async up(queryInterface, Sequelize)
  {
    const existingRows = await queryInterface.sequelize.query(
      'SELECT setting_key FROM app_settings WHERE setting_key IN (:keys)',
      {
        replacements: { keys: Object.keys(SETTINGS) },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    const existing = new Set(existingRows.map((row) => row.setting_key));
    const now = new Date();
    const rows = Object.entries(SETTINGS)
      .filter(([key]) => !existing.has(key))
      .map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
        created_at: now,
        updated_at: now
      }));

    if (rows.length)
    {
      await queryInterface.bulkInsert('app_settings', rows);
    }
  },

  async down(queryInterface)
  {
    await queryInterface.bulkDelete('app_settings', {
      setting_key: Object.keys(SETTINGS)
    });
  }
};
