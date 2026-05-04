'use strict';

const { trackEvent } = require('../../services/eventService');
const { enqueueEmail } = require('../../services/emailQueueService');
const { logPaymentTransaction } = require('../../services/paymentTransactionService');
const { findActivePaymentMethod, updateCustomerPaymentMethod } = require('../../services/paymentService');
const { billingSuccessEmail } = require('../../utils/emailTemplateUtils');
const { errorResponse, successResponse, wantsJson } = require('../../utils/httpResponseUtils');

async function showPaymentMethod(req, res, next)
{
  try
  {
    const paymentMethod = await findActivePaymentMethod(req.user.id);

    return res.status(200).json({
      paymentMethod: presentPaymentMethod(paymentMethod)
    });
  }
  catch (error)
  {
    next(error);
  }
}

async function updatePaymentMethod(req, res, next)
{
  try
  {
    const result = await updateCustomerPaymentMethod(req.user, {
      ...req.body,
      ipAddress: req.ip
    });

    await trackEvent(req, 'payment_method_updated', {
      cardLast4: result.paymentMethod.cardLast4,
      nextChargedAt: result.paymentMethod.nextChargedAt,
      chargedNow: result.chargedNow
    }, req.user.id);

    if (result.chargedNow)
    {
      await logPaymentTransaction({
        userId: req.user.id,
        paymentMethodId: result.paymentMethod.id,
        type: 'card_update',
        status: 'approved',
        customerId: result.crmResult.customerId || result.paymentMethod.customerId,
        responseCrmOrderId: result.crmResult.orderId,
        responseCrmTransactionId: result.crmResult.transactionId,
        idempotencyKey: result.idempotencyKey,
        cardLast4: result.paymentMethod.cardLast4,
        chargedAt: result.paymentMethod.lastChargedAt,
        nextChargedAt: result.paymentMethod.nextChargedAt,
        metadata: {
          restoredAccess: true
        }
      });
      await queuePaymentSuccessEmail(req.user.email, result.paymentMethod.nextChargedAt);
    }
    else
    {
      await logPaymentTransaction({
        userId: req.user.id,
        paymentMethodId: result.paymentMethod.id,
        type: 'card_verification',
        status: 'approved',
        customerId: result.crmResult.customerId || result.paymentMethod.customerId,
        responseCrmOrderId: result.crmResult.orderId,
        responseCrmTransactionId: result.crmResult.transactionId,
        idempotencyKey: result.idempotencyKey,
        cardLast4: result.paymentMethod.cardLast4,
        nextChargedAt: result.paymentMethod.nextChargedAt
      });
    }

    return successResponse(req, res, {
      message: result.chargedNow ? 'Payment processed and access restored.' : 'Payment method updated.',
      redirectTo: safeReturnTo(req.body.returnTo, '/profile'),
      data: { paymentMethod: presentPaymentMethod(result.paymentMethod) }
    });
  }
  catch (error)
  {
    if (wantsJson(req) && error.status && error.status < 500)
    {
      return errorResponse(req, res, {
        message: error.message || 'Payment method could not be updated.',
        status: error.status
      });
    }

    if (!req.path.startsWith('/api/') && error.status && error.status < 500)
    {
      return res.redirect(safeReturnTo(req.body.returnTo, '/profile', 'failed'));
    }

    next(error);
  }
}

function presentPaymentMethod(paymentMethod)
{
  if (!paymentMethod)
  {
    return null;
  }

  return {
    cardLast4: paymentMethod.cardLast4,
    lastChargedAt: paymentMethod.lastChargedAt,
    nextChargedAt: paymentMethod.nextChargedAt,
    status: paymentMethod.status
  };
}

function safeReturnTo(value, fallback, failureState = null)
{
  const path = String(value || '').trim();

  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://'))
  {
    return fallback;
  }

  return path;
}

async function queuePaymentSuccessEmail(email, nextChargedAt)
{
  try
  {
    await enqueueEmail(billingSuccessEmail({
      email,
      nextChargedAt
    }));
  }
  catch (error)
  {
    console.error('Payment success email queue failed:', error.message);
  }
}

module.exports = {
  showPaymentMethod,
  updatePaymentMethod
};
