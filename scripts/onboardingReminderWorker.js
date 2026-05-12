'use strict';

require('dotenv').config();

const { sequelize } = require('../database/models');
const { processOnboardingReminderBatch } = require('../services/onboardingReminderWorkerService');

const pollMs = Number(process.env.ONBOARDING_REMINDER_WORKER_POLL_MS || 5 * 60 * 1000);
const batchSize = Number(process.env.ONBOARDING_REMINDER_WORKER_BATCH_SIZE || 100);
let shuttingDown = false;

async function run()
{
  console.log(`onboarding_reminder_worker_started pollMs=${pollMs} batchSize=${batchSize}`);

  while (!shuttingDown)
  {
    try
    {
      const result = await processOnboardingReminderBatch(batchSize);

      if (result.claimed)
      {
        console.log('onboarding_reminder_worker_batch', result);
      }
    }
    catch (error)
    {
      console.error('onboarding_reminder_worker_error', error.message);
    }

    await sleep(pollMs);
  }

  await sequelize.close();
  console.log('onboarding_reminder_worker_stopped');
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
  console.error('onboarding_reminder_worker_fatal', error);
  await sequelize.close();
  process.exit(1);
});
