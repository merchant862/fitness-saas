'use strict';

const { trackEvent } = require('../../services/eventService');
const { sendResendEmail } = require('../../apis/resendApi');
const {
  loginWithPassword,
  redeemAccessCode,
  requestMagicLink,
  revokeCurrentSession,
  verifyMagicLink
} = require('../../services/authService');
const { compactUser, isEmail } = require('../../utils/securityUtils');
const { getPostAuthRedirect } = require('../../utils/profileCompletion');
const { magicLinkEmail } = require('../../utils/emailTemplateUtils');
const { errorResponse, successResponse } = require('../../utils/httpResponseUtils');
const { adminRoute } = require('../../utils/adminPaths');
const { renderAdminLogin } = require('../views/adminLoginViewController');

async function passwordLogin(req, res, next)
{
  try
  {
    const { email, password } = req.body;

    if (!isEmail(email) || !password)
    {
      return respondLoginFailure(req, res, 'Valid email and password are required.');
    }

    const user = await loginWithPassword(req, res, { email, password });
    await trackEvent(req, 'password_login', {}, user.id);

    const redirectTo = getPostAuthRedirect(user);

    return successResponse(req, res, {
      message: 'Signed in successfully.',
      redirectTo,
      data: { user: compactUser(user) }
    });
  }
  catch (error)
  {
    if (error.status && error.status < 500)
    {
      return respondLoginFailure(req, res, error.message);
    }

    next(error);
  }
}

async function adminPasswordLogin(req, res, next)
{
  try
  {
    const { email, password } = req.body;

    if (!isEmail(email) || !password)
    {
      return respondAdminLoginFailure(req, res, 'Valid email and password are required.');
    }

    const user = await loginWithPassword(req, res, { email, password });

    if (user.role !== 'admin')
    {
      await revokeCurrentSession(req, res);
      return respondAdminLoginFailure(req, res, 'Admin access required.');
    }

    await trackEvent(req, 'admin_password_login', {}, user.id);

    return successResponse(req, res, {
      message: 'Signed in successfully.',
      redirectTo: adminRoute(),
      data: { user: compactUser(user) }
    });
  }
  catch (error)
  {
    if (error.status && error.status < 500)
    {
      return respondAdminLoginFailure(req, res, error.message);
    }

    next(error);
  }
}


async function redeem(req, res, next)
{
  try
  {
    const { email, accessCode } = req.body;

    if (!isEmail(email) || !accessCode)
    {
      return errorResponse(req, res, { message: 'Valid email and access code are required' });
    }

    const user = await redeemAccessCode(req, res, { email, accessCode });
    await trackEvent(req, 'access_code_redeemed', {}, user.id);

    return successResponse(req, res, {
      message: 'Access activated successfully.',
      redirectTo: getPostAuthRedirect(user),
      data: { user: compactUser(user) }
    });
  }
  catch (error)
  {
    next(error);
  }
}

async function magicLinkRequest(req, res, next)
{
  try
  {
    const { email } = req.body;

    if (!isEmail(email))
    {
      return errorResponse(req, res, { message: 'Valid email is required' });
    }

    const result = await requestMagicLink(req, { email });

    if (result)
    {
      await sendResendEmail(magicLinkEmail({ email: result.email, token: result.token }));
      await trackEvent(req, 'magic_link_requested', {}, result.user.id);
    }

    return successResponse(req, res, {
      message: 'If that email has active access, a secure sign-in link has been sent.',
      redirectTo: '/sign-in'
    });
  }
  catch (error)
  {
    next(error);
  }
}

async function magicLinkVerify(req, res, next)
{
  try
  {
    const token = req.query.token || req.body.token;

    if (!token)
    {
      return errorResponse(req, res, { message: 'Token is required' });
    }

    const user = await verifyMagicLink(req, res, token);
    await trackEvent(req, 'magic_link_login', {}, user.id);

    return successResponse(req, res, {
      message: 'Signed in successfully.',
      redirectTo: getPostAuthRedirect(user),
      data: { user: compactUser(user) }
    });
  }
  catch (error)
  {
    next(error);
  }
}

async function logout(req, res, next)
{
  try
  {
    const redirectTo = req.user?.role === 'admin' ? adminRoute('/sign-in') : '/sign-in';
    await revokeCurrentSession(req, res);

    return successResponse(req, res, {
      message: 'Signed out successfully.',
      redirectTo
    });
  }
  catch (error)
  {
    next(error);
  }
}

async function session(req, res)
{
  return res.status(200).json({ user: compactUser(req.user) });
}

module.exports = {
  adminPasswordLogin,
  logout,
  magicLinkRequest,
  magicLinkVerify,
  passwordLogin,
  redeem,
  session
};

function respondLoginFailure(req, res, message)
{
  if (req.path.startsWith('/api/'))
  {
    return errorResponse(req, res, { message, status: 401 });
  }

  return errorResponse(req, res, { message, status: 401, redirectTo: '/sign-in' });
}

function respondAdminLoginFailure(req, res, message)
{
  if (req.path.startsWith('/api/'))
  {
    return errorResponse(req, res, { message, status: 401 });
  }

  return renderAdminLogin(res, { error: message, status: 401 });
}
