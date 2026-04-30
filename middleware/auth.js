'use strict';

const jwt = require('jsonwebtoken');
const { PaymentMethod } = require('../database/models');
const { COOKIE_NAME, findUserForSession } = require('../services/authService');
const { jwtOptions, jwtSecret } = require('../utils/jwtUtils');

async function attachUser(req, res, next)
{
  try
  {
    const token = req.cookies?.[COOKIE_NAME] || bearerToken(req);
    res.locals.currentUser = null;

    if (!token)
    {
      return next();
    }

    const payload = jwt.verify(token, jwtSecret(), {
      ...jwtOptions()
    });

    const session = await findUserForSession(payload);

    if (!session)
    {
      res.clearCookie(COOKIE_NAME, { path: '/' });
      return next();
    }

    req.user = session.user;
    req.sessionRecord = session.sessionRecord;
    res.locals.currentUser = session.user;
    return next();
  }
  catch (error)
  {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return next();
  }
}

function requireAuth(req, res, next)
{
  if (req.user)
  {
    return next();
  }

  if (req.path.startsWith('/api/'))
  {
    return res.status(401).json({ error: 'Authentication required' });
  }

  return res.redirect('/sign-in');
}

function requireOnboarding(req, res, next)
{
  if (!req.user)
  {
    return requireAuth(req, res, next);
  }

  if (req.user.onboardingCompletedAt || req.path === '/onboarding')
  {
    return next();
  }

  return res.redirect('/onboarding');
}

async function requireBilling(req, res, next)
{
  if (!req.user)
  {
    return requireAuth(req, res, next);
  }

  try
  {
    const paymentMethod = await PaymentMethod.findOne({
      where: {
        userId: req.user.id,
        provider: 'responsecrm',
        status: 'active'
      }
    });

    if (paymentMethod)
    {
      req.paymentMethod = paymentMethod;
      return next();
    }

    if (req.path.startsWith('/api/'))
    {
      return res.status(402).json({
        error: 'Payment method required',
        billingUrl: '/billing'
      });
    }

    return res.redirect('/billing');
  }
  catch (error)
  {
    next(error);
  }
}

function requirePasswordSetup(req, res, next)
{
  if (!req.user)
  {
    return requireAuth(req, res, next);
  }

  if (req.user.passwordHash)
  {
    return next();
  }

  if (req.path.startsWith('/api/'))
  {
    return res.status(428).json({
      error: 'Password setup required',
      passwordSetupUrl: '/change-password'
    });
  }

  return res.redirect('/change-password?setup=1');
}

function requireAdmin(req, res, next)
{
  const adminHeader = req.headers['x-admin-token'];

  if (req.user?.role === 'admin')
  {
    return next();
  }

  if (process.env.ADMIN_API_TOKEN && adminHeader === process.env.ADMIN_API_TOKEN)
  {
    return next();
  }

  if (!req.path.startsWith('/api/') && !req.user)
  {
    return res.redirect('/sign-in');
  }

  if (!req.path.startsWith('/api/'))
  {
    return res.status(403).send('Admin access required');
  }

  return res.status(403).json({ error: 'Admin access required' });
}

function bearerToken(req)
{
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer '))
  {
    return null;
  }

  return authHeader.slice(7);
}

module.exports = {
  attachUser,
  requireAdmin,
  requireAuth,
  requireBilling,
  requireOnboarding,
  requirePasswordSetup
};
