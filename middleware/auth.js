'use strict';

const jwt = require('jsonwebtoken');
const { COOKIE_NAME, findUserForSession } = require('../services/authService');
const { getPostAuthRedirect, isProfileComplete } = require('../utils/profileCompletion');
const { jwtOptions, jwtSecret } = require('../utils/jwtUtils');
const { adminRoute } = require('../utils/adminPaths');

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

    req.authSessionId = payload.sid || null;
    req.user = session.user;
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

function requireGuest(req, res, next)
{
  if (!req.user)
  {
    return next();
  }

  const redirectTo = getPostAuthRedirect(req.user);

  if (req.path.startsWith('/api/'))
  {
    return res.status(409).json({ error: 'Already authenticated', redirectTo });
  }

  return res.redirect(redirectTo);
}

function requireOnboarding(req, res, next)
{
  if (!req.user)
  {
    return requireAuth(req, res, next);
  }

  if (req.user.role === 'admin')
  {
    return next();
  }

  if (req.user.onboardingCompletedAt || req.path === '/onboarding')
  {
    return next();
  }

  return res.redirect('/onboarding');
}

function requireProfileComplete(req, res, next)
{
  if (!req.user)
  {
    return requireAuth(req, res, next);
  }

  if (req.user.role === 'admin')
  {
    return next();
  }

  if (isProfileComplete(req.user) || profileExceptions(req.path))
  {
    return next();
  }

  if (req.path.startsWith('/api/'))
  {
    return res.status(428).json({
      error: 'Profile completion required',
      redirectTo: '/profile'
    });
  }

  return res.redirect('/profile');
}

function requirePasswordSetup(req, res, next)
{
  if (!req.user)
  {
    return requireAuth(req, res, next);
  }

  if (req.user.role === 'admin')
  {
    return next();
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
    return res.redirect(adminRoute('/sign-in'));
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
  requireGuest,
  requireOnboarding,
  requirePasswordSetup,
  requireProfileComplete
};

function profileExceptions(path)
{
  return path === '/profile' ||
    path === '/api/users/me' ||
    path === '/api/users/onboarding' ||
    path === '/api/auth/session';
}
