'use strict';

const { Op } = require('sequelize');
const { UserLoginSession } = require('../database/models');

async function cleanupUserLoginSessions(options = {})
{
  const now = options.now || new Date();
  const revokedRetentionMs = Number(options.revokedRetentionMs || 0);
  const where = {
    [Op.or]: [
      { expiresAt: { [Op.lte]: now } }
    ]
  };

  if (Number.isFinite(revokedRetentionMs) && revokedRetentionMs >= 0)
  {
    where[Op.or].push({
      revokedAt: {
        [Op.ne]: null,
        [Op.lte]: new Date(now.getTime() - revokedRetentionMs)
      }
    });
  }

  return UserLoginSession.destroy({ where });
}

module.exports = {
  cleanupUserLoginSessions
};
