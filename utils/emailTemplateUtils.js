'use strict';

const { appUrl } = require('./urlUtils');

function accessCodeEmail({ email, code, expiresAt })
{
  const activateUrl = appUrl(`/activate?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);

  return brandedEmail({
    to: email,
    subject: 'Activate your FitAccess membership',
    eyebrow: 'Membership access',
    title: 'Your FitAccess account is ready',
    intro: 'Use this activation code to unlock your dashboard, workouts, meals, progress, and AI coach.',
    buttonText: 'Activate Membership',
    buttonUrl: activateUrl,
    code,
    footerText: `This activation code expires on ${expiresAt.toUTCString()}.`
  });
}

function magicLinkEmail({ email, token })
{
  const loginUrl = appUrl(`/session/verify?token=${encodeURIComponent(token)}`);

  return brandedEmail({
    to: email,
    subject: 'Open your FitAccess account',
    eyebrow: 'Secure access',
    title: 'Continue to FitAccess',
    intro: 'Your membership is active. Use this secure one-time link to open your account and set your password.',
    buttonText: 'Open FitAccess',
    buttonUrl: loginUrl,
    footerText: 'This link expires shortly and can only be used once.'
  });
}

function passwordResetEmail({ email, token })
{
  const resetUrl = appUrl(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);

  return brandedEmail({
    to: email,
    subject: 'Reset your FitAccess password',
    eyebrow: 'Account security',
    title: 'Create a new password',
    intro: 'We received a request to reset your FitAccess password. Use the secure button below to choose a new password.',
    buttonText: 'Reset Password',
    buttonUrl: resetUrl,
    footerText: 'This reset link expires shortly and can only be used once. If you did not request it, you can ignore this email.'
  });
}

function brandedEmail({ to, subject, eyebrow, title, intro, buttonText, buttonUrl, code = null, footerText })
{
  const text = [
    title,
    intro,
    code ? `Code: ${code}` : null,
    `${buttonText}: ${buttonUrl}`,
    footerText
  ].filter(Boolean).join('\n\n');

  return {
    to,
    subject,
    text,
    html: htmlShell({ eyebrow, title, intro, buttonText, buttonUrl, code, footerText })
  };
}

function htmlShell({ eyebrow, title, intro, buttonText, buttonUrl, code, footerText })
{
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f6f9;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f9;margin:0;padding:0;width:100%;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:28px 28px 18px;background:#111827;">
                <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:0;">FitAccess</div>
                <div style="margin-top:8px;font-size:13px;color:#a7f3d0;">Premium fitness membership</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 10px;">
                <div style="display:inline-block;padding:6px 10px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:12px;font-weight:700;text-transform:uppercase;">
                  ${escapeHtml(eyebrow)}
                </div>
                <h1 style="margin:18px 0 12px;font-size:28px;line-height:1.18;color:#111827;font-weight:800;">
                  ${escapeHtml(title)}
                </h1>
                <p style="margin:0;color:#4b5563;font-size:16px;line-height:1.6;">
                  ${escapeHtml(intro)}
                </p>
              </td>
            </tr>
            ${codeBlock(code)}
            <tr>
              <td style="padding:22px 28px 6px;">
                <a href="${buttonUrl}" style="display:block;text-align:center;background:#16a34a;color:#ffffff;text-decoration:none;padding:15px 18px;border-radius:10px;font-size:16px;font-weight:800;">
                  ${escapeHtml(buttonText)}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 30px;">
                <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                  ${escapeHtml(footerText)}
                </p>
              </td>
            </tr>
          </table>
          <div style="max-width:620px;margin:14px auto 0;color:#6b7280;font-size:12px;line-height:1.5;text-align:center;">
            FitAccess sends account emails for membership access and security.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function codeBlock(code)
{
  if (!code)
  {
    return '';
  }

  return `<tr>
    <td style="padding:22px 28px 0;">
      <div style="background:#f9fafb;border:1px dashed #9ca3af;border-radius:12px;padding:18px;text-align:center;">
        <div style="font-size:13px;color:#6b7280;margin-bottom:8px;">Activation code</div>
        <div style="font-size:28px;font-weight:800;color:#111827;letter-spacing:1px;">${escapeHtml(code)}</div>
      </div>
    </td>
  </tr>`;
}

function escapeHtml(value)
{
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  accessCodeEmail,
  magicLinkEmail,
  passwordResetEmail
};
