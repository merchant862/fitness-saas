'use strict';

const { Op } = require('sequelize');
const { EmailJob } = require('../database/models');
const { sendResendEmail } = require('../apis/resendApi');

async function enqueueEmail(email, options = {})
{
  const availableAt = options.availableAt || new Date();

  return EmailJob.create({
    toEmail: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text || null,
    attachments: email.attachments || [],
    maxAttempts: Number(options.maxAttempts || process.env.EMAIL_QUEUE_MAX_ATTEMPTS || 5),
    availableAt
  });
}

async function processEmailQueueBatch(limit = 10)
{
  const jobs = await claimPendingJobs(limit);
  let sent = 0;
  let failed = 0;

  for (const job of jobs)
  {
    try
    {
      await sendResendEmail({
        to: job.toEmail,
        subject: job.subject,
        html: job.html,
        text: job.text,
        attachments: job.attachments || []
      });

      await job.update({
        status: 'sent',
        sentAt: new Date(),
        lockedAt: null,
        lastError: null
      });

      sent += 1;
    }
    catch (error)
    {
      await markFailedAttempt(job, error);
      failed += 1;
    }
  }

  return {
    claimed: jobs.length,
    sent,
    failed
  };
}

async function claimPendingJobs(limit)
{
  const now = new Date();
  const staleProcessingCutoff = new Date(now.getTime() - Number(process.env.EMAIL_QUEUE_LOCK_TIMEOUT_MS || 5 * 60 * 1000));
  const jobs = await EmailJob.findAll({
    where: {
      [Op.or]: [
        {
          status: 'pending',
          availableAt: { [Op.lte]: now }
        },
        {
          status: 'processing',
          lockedAt: { [Op.lt]: staleProcessingCutoff }
        }
      ]
    },
    order: [['availableAt', 'ASC'], ['id', 'ASC']],
    limit
  });

  const claimedJobs = [];

  for (const job of jobs)
  {
    const claimWhere = {
      id: job.id,
      status: job.status
    };

    if (job.status === 'pending')
    {
      claimWhere.availableAt = job.availableAt;
    }
    else
    {
      claimWhere.lockedAt = job.lockedAt;
    }

    const [updatedCount] = await EmailJob.update({
      status: 'processing',
      lockedAt: now
    }, {
      where: claimWhere
    });

    if (updatedCount)
    {
      job.status = 'processing';
      job.lockedAt = now;
      claimedJobs.push(job);
    }
  }

  return claimedJobs;
}

async function markFailedAttempt(job, error)
{
  const attempts = Number(job.attempts || 0) + 1;
  const retryDelayMs = Math.min(30 * 60 * 1000, Math.pow(2, attempts) * 60 * 1000);
  const shouldRetry = attempts < Number(job.maxAttempts || 5);

  await job.update({
    attempts,
    status: shouldRetry ? 'pending' : 'failed',
    availableAt: new Date(Date.now() + retryDelayMs),
    lockedAt: null,
    lastError: String(error.message || error).slice(0, 2000)
  });
}

module.exports = {
  enqueueEmail,
  processEmailQueueBatch
};
