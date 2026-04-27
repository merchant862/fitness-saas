'use strict';

const { AccessCode } = require('../database/models');

async function listAccessCodes(limit = 100)
{
  return AccessCode.findAll({
    order: [['createdAt', 'DESC']],
    limit: Math.min(Number(limit || 100), 500)
  });
}

async function findAccessCode(id)
{
  return AccessCode.findByPk(id);
}

async function revokeAccessCode(id)
{
  const code = await findAccessCode(id);

  if (!code)
  {
    return null;
  }

  await code.update({ status: 'revoked' });
  return code;
}

async function extendAccessCode(id, days = 30)
{
  const code = await findAccessCode(id);

  if (!code)
  {
    return null;
  }

  const expiresAt = new Date(code.expiresAt);
  expiresAt.setDate(expiresAt.getDate() + Number(days || 30));

  await code.update({
    expiresAt,
    status: code.status === 'expired' ? 'unused' : code.status
  });

  return code;
}

module.exports = {
  extendAccessCode,
  listAccessCodes,
  revokeAccessCode
};
