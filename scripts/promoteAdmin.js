'use strict';

require('dotenv').config();

const { sequelize } = require('../database/models');
const { promoteAdminUser } = require('../services/adminService');
const { normalizeEmail, isEmail } = require('../utils/securityUtils');

async function main()
{
  const email = normalizeEmail(process.env.ADMIN_EMAIL || process.argv[2]);

  if (!isEmail(email))
  {
    throw new Error('Set ADMIN_EMAIL in .env or pass an email: npm run admin:promote -- admin@example.com');
  }

  const { created } = await promoteAdminUser(email);
  console.log(`${created ? 'Created' : 'Updated'} admin user: ${email}`);
}

main()
  .catch((error) =>
  {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () =>
  {
    await sequelize.close();
  });
