'use strict';

const { trackEvent } = require('../../services/eventService');
const { enqueueEmail } = require('../../services/emailQueueService');
const { changePassword, requestPasswordReset, resetPasswordWithToken } = require('../../services/passwordService');
const { isEmail } = require('../../utils/securityUtils');
const { passwordResetEmail } = require('../../utils/emailTemplateUtils');
const { errorResponse, successResponse } = require('../../utils/httpResponseUtils');

async function forgot(req, res, next)
{
  try
  {
    const { email } = req.body;

    if (!isEmail(email))
    {
      return errorResponse(req, res, { message: 'Valid email is required' });
    }

    const result = await requestPasswordReset(req, email);

    if (result)
    {
      await enqueueEmail(passwordResetEmail({ email: result.email, token: result.token }));
      await trackEvent(req, 'password_reset_requested', {}, result.user.id);
    }

    return successResponse(req, res, {
      message: 'If an account exists for that email address, you will receive a password reset link shortly.'
    });
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
      return errorResponse(req, res, { message: 'Email and reset token are required' });
    }

    if (newPassword !== confirmPassword)
    {
      return errorResponse(req, res, { message: 'Passwords do not match' });
    }

    const user = await resetPasswordWithToken({ email, token, password: newPassword });
    await trackEvent(req, 'password_reset_completed', {}, user.id);

    return successResponse(req, res, {
      message: 'Password reset successfully. Sign in with your new password.',
      redirectTo: '/sign-in'
    });
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
      return errorResponse(req, res, { message: 'Passwords do not match' });
    }

    await changePassword(req.user, { currentPassword, newPassword });
    await trackEvent(req, 'password_changed', {}, req.user.id);

    return successResponse(req, res, {
      message: 'Password updated successfully.',
      redirectTo: safeReturnTo(req.body.returnTo, '/change-password')
    });
  }
  catch (error)
  {
    next(error);
  }
}

function safeReturnTo(value, fallback)
{
  const path = String(value || '').trim();

  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://'))
  {
    return fallback;
  }

  return path;
}

module.exports = {
  forgot,
  reset,
  update
};
