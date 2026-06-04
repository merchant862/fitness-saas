'use strict';

const { Op } = require('sequelize');
const {
  MagicLink,
  PaymentTransaction,
  User
} = require('../database/models');
const { enqueueEmail } = require('./emailQueueService');
const { onboardingReminderEmail } = require('../utils/emailTemplateUtils');
const {
  generateToken,
  sha256
} = require('../utils/securityUtils');

const REMINDER_EVENT_USER_AGENT = 'fitaccess-onboarding-reminder-worker';

async function processOnboardingReminderBatch(limit = 100)
{
  const users = await claimDueUsers(limit);
  let queued = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users)
  {
    try
    {
      if (await shouldSkipUser(user.id))
      {
        await releaseUser(user, {});
        skipped += 1;
        continue;
      }

      await queueReminder(user);
      queued += 1;
    }
    catch (error)
    {
      await releaseUser(user, { keepDue: true });
      console.error(`onboarding_reminder_queue_failed user=${user.id}`, error.message);
      failed += 1;
    }
  }

  return {
    claimed: users.length,
    queued,
    skipped,
    failed
  };
}

async function claimDueUsers(limit)
{
  const now = new Date();
  const intervalCutoff = new Date(now.getTime() - reminderIntervalMs());
  const windowStart = new Date(now.getTime() - reminderWindowMs());
  const staleLockCutoff = new Date(now.getTime() - lockTimeoutMs());

  const rows = await User.findAll({
    where: {
      role: 'user',
      status: 'active',
      createdAt: { [Op.gte]: windowStart },
      onboardingCompletedAt: null,
      accessExpiresAt: { [Op.gt]: now },
      onboardingRemindersSent: { [Op.lt]: maxReminders() },
      [Op.and]: [
        {
          [Op.or]: [
            { onboardingReminderLockedAt: null },
            { onboardingReminderLockedAt: { [Op.lt]: staleLockCutoff } }
          ]
        },
        {
          [Op.or]: [
            {
              onboardingLastRemindedAt: null,
              createdAt: { [Op.lte]: intervalCutoff }
            },
            {
              onboardingLastRemindedAt: { [Op.lte]: intervalCutoff }
            }
          ]
        }
      ]
    },
    include: [{
      model: PaymentTransaction,
      as: 'paymentTransactions',
      attributes: [],
      required: true,
      where: {
        type: 'upsell',
        status: 'approved'
      }
    }],
    order: [['onboardingLastRemindedAt', 'ASC'], ['createdAt', 'ASC'], ['id', 'ASC']],
    limit
  });

  const claimed = [];

  for (const row of rows)
  {
    const lockWhere = row.onboardingReminderLockedAt ?
      { onboardingReminderLockedAt: row.onboardingReminderLockedAt } :
      { onboardingReminderLockedAt: null };

    const [updatedCount] = await User.update({
      onboardingReminderLockedAt: now
    }, {
      where: {
        id: row.id,
        role: 'user',
        status: 'active',
        onboardingCompletedAt: null,
        ...lockWhere
      }
    });

    if (updatedCount)
    {
      row.onboardingReminderLockedAt = now;
      claimed.push(row);
    }
  }

  return claimed;
}

async function shouldSkipUser(userId)
{
  const user = await User.findByPk(userId, {
    attributes: ['id', 'status', 'onboardingCompletedAt', 'accessExpiresAt']
  });

  return (
    !user ||
    user.status !== 'active' ||
    Boolean(user.onboardingCompletedAt) ||
    (user.accessExpiresAt && user.accessExpiresAt <= new Date())
  );
}

async function queueReminder(user)
{
  const token = generateToken(32);
  const reminderNumber = Number(user.onboardingRemindersSent || 0) + 1;
  const reminderMax = maxReminders();

  await MagicLink.create({
    userId: user.id,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + onboardingLinkTtlMs()),
    requestIp: null,
    userAgent: REMINDER_EVENT_USER_AGENT
  });

  await enqueueEmail(await onboardingReminderEmail({
    email: user.email,
    token,
    reminderNumber,
    maxReminders: reminderMax
  }));

  await user.update({
    onboardingRemindersSent: reminderNumber,
    onboardingLastRemindedAt: new Date(),
    onboardingReminderLockedAt: null
  });
}

async function releaseUser(user, options = {})
{
  const update = {
    onboardingReminderLockedAt: null
  };

  if (!options.keepDue)
  {
    update.onboardingLastRemindedAt = new Date();
  }

  await user.update(update);
}

function maxReminders()
{
  return positiveNumber(process.env.ONBOARDING_REMINDER_MAX_ATTEMPTS, 3);
}

function reminderIntervalMs()
{
  return positiveNumber(process.env.ONBOARDING_REMINDER_INTERVAL_HOURS, 24) * 60 * 60 * 1000;
}

function reminderWindowMs()
{
  return positiveNumber(process.env.ONBOARDING_REMINDER_WINDOW_HOURS, 96) * 60 * 60 * 1000;
}

function lockTimeoutMs()
{
  return positiveNumber(process.env.ONBOARDING_REMINDER_LOCK_TIMEOUT_MS, 10 * 60 * 1000);
}

function onboardingLinkTtlMs()
{
  return positiveNumber(process.env.PURCHASE_MAGIC_LINK_TTL_MINUTES, 4320) * 60 * 1000;
}

function positiveNumber(value, fallback)
{
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

module.exports = {
  processOnboardingReminderBatch
};
