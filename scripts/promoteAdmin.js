'use strict';

require('dotenv').config();

const { sequelize } = require('../database/models');
const { promoteAdminUser } = require('../services/adminService');
const { normalizeEmail, isEmail } = require('../utils/securityUtils');

async function main()
{
  const email = normalizeEmail(process.argv[2]);
  const password = process.argv[3] || null;

  if (!isEmail(email))
  {
    throw new Error('Pass an email: npm run admin:promote -- admin@example.com optionalPassword');
  }

  const { created } = await promoteAdminUser(email, password);
  console.log(`${created ? 'Created' : 'Updated'} admin user: ${email}${password ? ' with password login enabled' : ''}`);
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
