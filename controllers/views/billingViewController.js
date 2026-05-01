'use strict';

const { findActivePaymentMethod } = require('../../services/paymentService');

async function billingViewController(req, res, next)
{
  try
  {
    const paymentMethod = await findActivePaymentMethod(req.user.id);

    return res.status(200).render('../views/billing.ejs', {
      billingData: {
        currentUser: presentUser(req.user),
        paymentMethod: presentPaymentMethod(paymentMethod),
        message: null
      }
    });
  }
  catch (error)
  {
    next(error);
  }
}

function presentUser(user)
{
  return {
    name: user.name || user.email?.split('@')[0] || 'Member',
    email: user.email,
    goal: label(user.profile?.goal || 'general_fitness')
  };
}

function presentPaymentMethod(paymentMethod)
{
  if (!paymentMethod)
  {
    return null;
  }

  return {
    cardLast4: paymentMethod.cardLast4,
    nextChargedAt: paymentMethod.nextChargedAt ? paymentMethod.nextChargedAt.toISOString().slice(0, 10) : null
  };
}

function label(value)
{
  return String(value || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

module.exports = billingViewController;
