'use strict';

require('dotenv').config();

const { sequelize } = require('../database/models');
const { cleanupUserLoginSessions } = require('../services/sessionCleanupService');

const pollMs = positiveNumber(process.env.SESSION_CLEANUP_WORKER_POLL_MS, 60 * 1000);
const revokedRetentionMs = positiveNumber(process.env.SESSION_CLEANUP_REVOKED_RETENTION_MS, 24 * 60 * 60 * 1000);
const runOnce = process.argv.includes('--once');
let shuttingDown = false;

async function run()
{
  console.log(`session_cleanup_worker_started pollMs=${pollMs} revokedRetentionMs=${revokedRetentionMs} runOnce=${runOnce}`);

  do
  {
    try
    {
      const deleted = await cleanupUserLoginSessions({ revokedRetentionMs });

      if (deleted)
      {
        console.log('session_cleanup_worker_deleted', { deleted });
      }
    }
    catch (error)
    {
      console.error('session_cleanup_worker_error', error.message);
    }

    if (!runOnce && !shuttingDown)
    {
      await sleep(pollMs);
    }
  }
  while (!runOnce && !shuttingDown);

  await sequelize.close();
  console.log('session_cleanup_worker_stopped');
}

function positiveNumber(value, fallback)
{
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function sleep(ms)
{
  return new Promise(resolve => setTimeout(resolve, ms));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function shutdown()
{
  shuttingDown = true;
}

run().catch(async function(error)
{
  console.error('session_cleanup_worker_fatal', error);
  await sequelize.close();
  process.exit(1);
});
