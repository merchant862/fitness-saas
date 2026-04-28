'use strict';

const { appUrl } = require('./urlUtils');

function accessCodeEmail({ email, code, expiresAt })
{
  const loginUrl = appUrl(`/activate?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);

  return {
    to: email,
    subject: 'Activate your FitAccess membership',
    text: `Your FitAccess activation code is ${code}. It expires on ${expiresAt.toISOString()}. Activate it here: ${loginUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
        <h2>Your FitAccess is ready</h2>
        <p>Use this secure activation code to unlock your dashboard:</p>
        <p style="font-size:24px;font-weight:700;letter-spacing:1px">${code}</p>
        <p>This code expires on ${expiresAt.toUTCString()}.</p>
        <p><a href="${loginUrl}" style="background:#365CF5;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px">Activate Access</a></p>
      </div>
    `
  };
}

function magicLinkEmail({ email, token })
{
  const loginUrl = appUrl(`/session/verify?token=${encodeURIComponent(token)}`);

  return {
    to: email,
    subject: 'Your FitAccess secure sign-in link',
    text: `Sign in to FitAccess: ${loginUrl}. This link expires shortly and can only be used once.`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
        <h2>Secure FitAccess sign-in</h2>
        <p>Click below to continue. This link expires shortly and can only be used once.</p>
        <p><a href="${loginUrl}" style="background:#365CF5;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px">Continue to FitAccess</a></p>
      </div>
    `
  };
}

function passwordResetEmail({ email, token })
{
  const resetUrl = appUrl(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);

  return {
    to: email,
    subject: 'Reset your FitAccess password',
    text: `Reset your FitAccess password here: ${resetUrl}. This link expires shortly and can only be used once.`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5">
        <h2>Reset your FitAccess password</h2>
        <p>Click below to set a new password. This link expires shortly and can only be used once.</p>
        <p><a href="${resetUrl}" style="background:#365CF5;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px">Reset Password</a></p>
      </div>
    `
  };
}

module.exports = {
  accessCodeEmail,
  magicLinkEmail,
  passwordResetEmail
};
