'use strict';

const { trackEvent } = require('../../services/eventService');
const { findActivePaymentMethod, updateCustomerPaymentMethod } = require('../../services/paymentService');

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
      nextChargeAt: result.paymentMethod.nextChargeAt,
      responseCrmOrderId: result.paymentMethod.externalOrderId,
      responseCrmTransactionId: result.paymentMethod.externalTransactionId
    }, req.user.id);

    if (!req.path.startsWith('/api/'))
    {
      return res.redirect(safeReturnTo(req.body.returnTo, '/profile?billing=updated'));
    }

    return res.status(200).json({
      message: 'Payment method updated.',
      paymentMethod: presentPaymentMethod(result.paymentMethod)
    });
  }
  catch (error)
  {
    if (!req.path.startsWith('/api/') && error.status && error.status < 500)
    {
      return res.redirect(safeReturnTo(req.body.returnTo, '/profile?billing=failed', 'failed'));
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
    nextChargeAt: paymentMethod.nextChargeAt,
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

  if (failureState === 'failed')
  {
    return path.includes('?') ? `${path}&billing=failed` : `${path}?billing=failed`;
  }

  return path.includes('?') ? `${path}&billing=updated` : `${path}?billing=updated`;
}

module.exports = {
  showPaymentMethod,
  updatePaymentMethod
};
