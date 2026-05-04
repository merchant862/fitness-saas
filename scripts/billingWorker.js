'use strict';

require('dotenv').config();

const { sequelize } = require('../database/models');
const { processBillingBatch } = require('../services/billingWorkerService');

const pollMs = Number(process.env.BILLING_WORKER_POLL_MS || 60 * 1000);
const batchSize = Number(process.env.BILLING_WORKER_BATCH_SIZE || 50);
let shuttingDown = false;

async function run()
{
  console.log(`billing_worker_started pollMs=${pollMs} batchSize=${batchSize}`);

  while (!shuttingDown)
  {
    try
    {
      const result = await processBillingBatch(batchSize);

      if (result.claimed)
      {
        console.log('billing_worker_batch', result);
      }
    }
    catch (error)
    {
      console.error('billing_worker_error', error.message);
    }

    await sleep(pollMs);
  }

  await sequelize.close();
  console.log('billing_worker_stopped');
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
  console.error('billing_worker_fatal', error);
  await sequelize.close();
  process.exit(1);
});
