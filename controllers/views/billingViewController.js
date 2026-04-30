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
        message: billingMessage(req.query)
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
    nextChargeAt: paymentMethod.nextChargeAt ? paymentMethod.nextChargeAt.toISOString().slice(0, 10) : null
  };
}

function billingMessage(query)
{
  if (query.passwordUpdated)
  {
    return {
      type: 'success',
      text: 'Password saved. Add a verified card to unlock your dashboard.'
    };
  }

  if (query.billing === 'updated')
  {
    return {
      type: 'success',
      text: 'Card added successfully. Your FitAccess dashboard is unlocked.'
    };
  }

  if (query.billing === 'failed')
  {
    return {
      type: 'danger',
      text: 'Card could not be verified. Please check the details and try again.'
    };
  }

  return null;
}

function label(value)
{
  return String(value || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

module.exports = billingViewController;
