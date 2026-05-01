'use strict';

const { trackEvent } = require('../../services/eventService');
const { findActivePaymentMethod, updateCustomerPaymentMethod } = require('../../services/paymentService');
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
    const result = await updateCustomerPaymentMethod(req.user, req.body);

    await trackEvent(req, 'payment_method_updated', {
      cardLast4: result.paymentMethod.cardLast4,
      nextChargedAt: result.paymentMethod.nextChargedAt
    }, req.user.id);

    return successResponse(req, res, {
      message: 'Payment method updated.',
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

module.exports = {
  showPaymentMethod,
  updatePaymentMethod
};
