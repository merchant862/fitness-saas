'use strict';

const { trackEvent } = require('../../services/eventService');
const { sendResendEmail } = require('../../apis/resendApi');
const { changePassword, requestPasswordReset, resetPasswordWithToken } = require('../../services/passwordService');
const { isEmail } = require('../../utils/securityUtils');
const { passwordResetEmail } = require('../../utils/emailTemplateUtils');

async function forgot(req, res, next)
{
  try
  {
    const { email } = req.body;

    if (!isEmail(email))
    {
      return res.status(422).send('Valid email is required');
    }

    const result = await requestPasswordReset(req, email);

    if (result)
    {
      await sendResendEmail(passwordResetEmail({ email: result.email, token: result.token }));
      await trackEvent(req, 'password_reset_requested', {}, result.user.id);
    }

    if (req.path.startsWith('/api/'))
    {
      return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    }

    return res.redirect('/reset-password?sent=1');
  }
  catch (error)
  {
    next(error);
  }
}

async function reset(req, res, next)
{
  try
  {
    const { email, token, newPassword, confirmPassword } = req.body;

    if (!isEmail(email) || !token)
    {
      return res.status(422).send('Email and reset token are required');
    }

    if (newPassword !== confirmPassword)
    {
      return res.status(422).send('Passwords do not match');
    }

    const user = await resetPasswordWithToken({ email, token, password: newPassword });
    await trackEvent(req, 'password_reset_completed', {}, user.id);

    if (req.path.startsWith('/api/'))
    {
      return res.status(200).json({ ok: true });
    }

    return res.redirect('/sign-in?passwordReset=1');
  }
  catch (error)
  {
    next(error);
  }
}

async function update(req, res, next)
{
  try
  {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword)
    {
      return res.status(422).send('Passwords do not match');
    }

    await changePassword(req.user, { currentPassword, newPassword });
    await trackEvent(req, 'password_changed', {}, req.user.id);

    if (req.path.startsWith('/api/'))
    {
      return res.status(200).json({ ok: true });
    }

    return res.redirect('/change-password?updated=1');
  }
  catch (error)
  {
    next(error);
  }
}

module.exports = {
  forgot,
  reset,
  update
};
