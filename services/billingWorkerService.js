'use strict';

const { Op } = require('sequelize');
const { PaymentMethod, User } = require('../database/models');
const { chargeStoredPaymentMethod } = require('./paymentService');
const { enqueueEmail } = require('./emailQueueService');
const { logPaymentTransaction } = require('./paymentTransactionService');
const {
  billingSuccessEmail,
  billingRetryFailedEmail,
  billingLockedEmail
} = require('../utils/emailTemplateUtils');

async function processBillingBatch(limit = 50)
{
  const paymentMethods = await claimDuePaymentMethods(limit);
  let charged = 0;
  let failed = 0;

  for (const paymentMethod of paymentMethods)
  {
    try
    {
      const result = await chargeStoredPaymentMethod(paymentMethod, paymentMethod.user);

      await paymentMethod.update({
        lastChargedAt: result.chargedAt,
        nextChargedAt: result.nextChargedAt,
        billingAttempts: 0,
        nextRetryAt: null,
        billingLockedAt: null,
        lastFailedAt: null,
        failureReason: null,
        status: 'active'
      });

      await logPaymentTransaction({
        userId: paymentMethod.user.id,
        paymentMethodId: paymentMethod.id,
        type: 'renewal',
        status: 'approved',
        customerId: result.crmResult.customerId || paymentMethod.customerId,
        responseCrmOrderId: result.crmResult.orderId,
        responseCrmTransactionId: result.crmResult.transactionId,
        idempotencyKey: result.idempotencyKey,
        cardLast4: paymentMethod.cardLast4,
        chargedAt: result.chargedAt,
        nextChargedAt: result.nextChargedAt
      });

      await queueBillingEmail(paymentMethod.user, billingSuccessEmail({
        email: paymentMethod.user.email,
        nextChargedAt: result.nextChargedAt
      }));

      charged += 1;
    }
    catch (error)
    {
      const failure = await markBillingFailure(paymentMethod, error);
      await logPaymentTransaction({
        userId: paymentMethod.user.id,
        paymentMethodId: paymentMethod.id,
        type: 'renewal',
        status: error.crmResult ? 'declined' : 'failed',
        customerId: paymentMethod.customerId,
        responseCrmOrderId: error.crmResult?.orderId || null,
        responseCrmTransactionId: error.crmResult?.transactionId || null,
        idempotencyKey: error.idempotencyKey,
        cardLast4: paymentMethod.cardLast4,
        failureReason: error.message || error,
        metadata: {
          attempts: failure.attempts,
          willRetry: failure.shouldRetry,
          nextRetryAt: failure.nextRetryAt
        }
      });

      if (failure.shouldRetry)
      {
        await queueBillingEmail(paymentMethod.user, billingRetryFailedEmail({
          email: paymentMethod.user.email,
          retryAttempt: failure.attempts,
          nextRetryAt: failure.nextRetryAt
        }));
      }
      else
      {
        await queueBillingEmail(paymentMethod.user, billingLockedEmail({
          email: paymentMethod.user.email
        }));
      }

      failed += 1;
    }
  }

  return {
    claimed: paymentMethods.length,
    charged,
    failed
  };
}

async function claimDuePaymentMethods(limit)
{
  const now = new Date();
  const staleLockCutoff = new Date(now.getTime() - Number(process.env.BILLING_LOCK_TIMEOUT_MS || 10 * 60 * 1000));
  const rows = await PaymentMethod.findAll({
    where: {
      status: 'active',
      nextChargedAt: { [Op.lte]: now },
      [Op.and]: [
        {
          [Op.or]: [
            { nextRetryAt: null },
            { nextRetryAt: { [Op.lte]: now } }
          ]
        },
        {
          [Op.or]: [
            { billingLockedAt: null },
            { billingLockedAt: { [Op.lt]: staleLockCutoff } }
          ]
        }
      ]
    },
    include: [{
      model: User,
      as: 'user',
      required: true,
      where: {
        status: 'active',
        role: 'user'
      }
    }],
    order: [['nextChargedAt', 'ASC'], ['id', 'ASC']],
    limit
  });

  const claimed = [];

  for (const row of rows)
  {
    const lockWhere = row.billingLockedAt ?
      { billingLockedAt: row.billingLockedAt } :
      { billingLockedAt: null };

    const [updatedCount] = await PaymentMethod.update({
      billingLockedAt: now
    }, {
      where: {
        id: row.id,
        status: 'active',
        ...lockWhere
      }
    });

    if (updatedCount)
    {
      row.billingLockedAt = now;
      claimed.push(row);
    }
  }

  return claimed;
}

async function markBillingFailure(paymentMethod, error)
{
  const attempts = Number(paymentMethod.billingAttempts || 0) + 1;
  const maxAttempts = Number(process.env.BILLING_MAX_RETRY_ATTEMPTS || 3);
  const shouldRetry = attempts <= maxAttempts;
  const retryAt = shouldRetry ? nextRetryAt(attempts) : null;

  await paymentMethod.update({
    billingAttempts: attempts,
    nextRetryAt: retryAt,
    billingLockedAt: null,
    lastFailedAt: new Date(),
    failureReason: String(error.message || error).slice(0, 500),
    status: shouldRetry ? 'active' : 'failed'
  });

  return {
    attempts,
    shouldRetry,
    nextRetryAt: retryAt,
    status: shouldRetry ? 'active' : 'failed'
  };
}

function nextRetryAt(attempts)
{
  const delays = String(process.env.BILLING_RETRY_DELAYS_DAYS || '1,2,3')
    .split(',')
    .map(value => Number(value.trim()))
    .filter(value => Number.isFinite(value) && value > 0);
  const delayDays = delays[Math.min(attempts - 1, delays.length - 1)] || attempts;

  return new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000);
}

async function queueBillingEmail(user, email)
{
  try
  {
    await enqueueEmail(email);
  }
  catch (error)
  {
    console.error(`Billing email queue failed for user ${user.id}:`, error.message);
  }
}

module.exports = {
  processBillingBatch
};
