'use strict';

require('dotenv').config();

const { sequelize } = require('../database/models');
const { processEmailQueueBatch } = require('../services/emailQueueService');

const pollMs = Number(process.env.EMAIL_QUEUE_POLL_MS || 5000);
const batchSize = Number(process.env.EMAIL_QUEUE_BATCH_SIZE || 10);
let shuttingDown = false;

async function run()
{
  console.log(`email_worker_started pollMs=${pollMs} batchSize=${batchSize}`);

  while (!shuttingDown)
  {
    try
    {
      const result = await processEmailQueueBatch(batchSize);

      if (result.claimed)
      {
        console.log('email_worker_batch', result);
      }
    }
    catch (error)
    {
      console.error('email_worker_error', error.message);
    }

    await sleep(pollMs);
  }

  await sequelize.close();
  console.log('email_worker_stopped');
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
  console.error('email_worker_fatal', error);
  await sequelize.close();
  process.exit(1);
});
