'use strict';

const { trackEvent } = require('../../services/eventService');
const { sendResendEmail } = require('../../apis/resendApi');
const {
  redeemAccessCode,
  requestMagicLink,
  revokeCurrentSession,
  verifyMagicLink
} = require('../../services/authService');
const { compactUser, isEmail } = require('../../utils/securityUtils');
const { magicLinkEmail } = require('../../utils/emailTemplateUtils');

async function redeem(req, res, next)
{
  try
  {
    const { email, accessCode } = req.body;

    if (!isEmail(email) || !accessCode)
    {
      return res.status(422).json({ error: 'Valid email and access code are required' });
    }

    const user = await redeemAccessCode(req, res, { email, accessCode });
    await trackEvent(req, 'access_code_redeemed', {}, user.id);

    if (!req.path.startsWith('/api/'))
    {
      return res.redirect(user.onboardingCompletedAt ? '/dashboard' : '/onboarding');
    }

    return res.status(200).json({ user: compactUser(user), redirectTo: user.onboardingCompletedAt ? '/dashboard' : '/onboarding' });
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
      return res.status(422).json({ error: 'Valid email is required' });
    }

    const result = await requestMagicLink(req, { email });

    if (result)
    {
      await sendResendEmail(magicLinkEmail({ email: result.email, token: result.token }));
      await trackEvent(req, 'magic_link_requested', {}, result.user.id);
    }

    if (!req.path.startsWith('/api/'))
    {
      return res.redirect('/sign-in?sent=1');
    }

    return res.status(200).json({ message: 'If that email has active access, a secure sign-in link has been sent.' });
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
      return res.status(422).json({ error: 'Token is required' });
    }

    const user = await verifyMagicLink(req, res, token);
    await trackEvent(req, 'magic_link_login', {}, user.id);

    if (req.path.startsWith('/api/'))
    {
      return res.status(200).json({
        user: compactUser(user),
        redirectTo: user.onboardingCompletedAt ? '/dashboard' : '/onboarding'
      });
    }

    return res.redirect(user.onboardingCompletedAt ? '/dashboard' : '/onboarding');
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
    await revokeCurrentSession(req, res);

    if (req.path.startsWith('/api/'))
    {
      return res.status(200).json({ ok: true });
    }

    return res.redirect('/sign-in');
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
  logout,
  magicLinkRequest,
  magicLinkVerify,
  redeem,
  session
};
