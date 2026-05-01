'use strict';

const { appUrl } = require('./urlUtils');

const BRAND = {
  ink: '#101828',
  muted: '#667085',
  line: '#e4e7ec',
  panel: '#f8fafc',
  blue: '#365cf5',
  green: '#16a34a',
  dark: '#08111f'
};

function accessCodeEmail({ email, code, expiresAt })
{
  const activateUrl = appUrl(`/activate?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);

  return brandedEmail({
    to: email,
    subject: 'Activate your FitAccess membership',
    eyebrow: 'Membership access',
    title: 'Your fitness dashboard is ready',
    intro: 'Use your activation code to open FitAccess and start your workouts, meal guidance, progress tracking, and AI Coach support.',
    buttonText: 'Activate FitAccess',
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
    title: 'Welcome to FitAccess',
    intro: 'Your membership is active. Open your secure link to finish setup and continue into your personalized fitness dashboard.',
    buttonText: 'Open FitAccess',
    buttonUrl: loginUrl,
    footerText: 'This secure link expires shortly and can only be used once.'
  });
}

function passwordResetEmail({ email, token })
{
  const resetUrl = appUrl(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);

  return brandedEmail({
    to: email,
    subject: 'Reset your FitAccess password',
    eyebrow: 'Account security',
    title: 'Choose a new password',
    intro: 'Use the secure button below to create a new password and get back to your FitAccess account.',
    buttonText: 'Reset Password',
    buttonUrl: resetUrl,
    footerText: 'This reset link expires shortly and can only be used once. If you did not request it, you can safely ignore this email.'
  });
}

function brandedEmail({ to, subject, eyebrow, title, intro, buttonText, buttonUrl, code = null, footerText })
{
  const text = [
    title,
    intro,
    code ? `Activation code: ${code}` : null,
    `${buttonText}: ${buttonUrl}`,
    footerText,
    'FitAccess'
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
  const logoUrl = appUrl('/images/logo/logo-white.svg');
  const safeButtonUrl = escapeAttribute(buttonUrl);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#eef2f7;color:${BRAND.ink};font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;margin:0;padding:0;background:#eef2f7;">
      <tr>
        <td align="center" style="padding:30px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;border-collapse:separate;border-spacing:0;">
            <tr>
              <td style="padding:0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="overflow:hidden;border-radius:14px;background:#ffffff;border:1px solid ${BRAND.line};box-shadow:0 18px 48px rgba(15,23,42,0.10);">
                  <tr>
                    <td style="padding:30px 30px 34px;background:${BRAND.dark};background-image:linear-gradient(135deg,#08111f 0%,#13233f 55%,#14532d 100%);">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="left">
                            <img src="${logoUrl}" width="168" alt="FitAccess" style="display:block;width:168px;max-width:168px;height:auto;border:0;">
                          </td>
                          <td align="right" style="font-size:12px;line-height:1.2;color:#bbf7d0;font-weight:800;text-transform:uppercase;">
                            Premium Membership
                          </td>
                        </tr>
                      </table>

                      <div style="margin-top:28px;display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(22,163,74,0.18);color:#bbf7d0;font-size:12px;font-weight:900;text-transform:uppercase;">
                        ${escapeHtml(eyebrow)}
                      </div>

                      <h1 style="margin:18px 0 12px;color:#ffffff;font-size:32px;line-height:1.16;font-weight:900;">
                        ${escapeHtml(title)}
                      </h1>

                      <p style="margin:0;color:#dbe4f0;font-size:16px;line-height:1.7;">
                        ${escapeHtml(intro)}
                      </p>
                    </td>
                  </tr>

                  ${featureStrip()}
                  ${codeBlock(code)}

                  <tr>
                    <td style="padding:26px 30px 8px;background:#ffffff;">
                      <a href="${safeButtonUrl}" style="display:block;width:100%;box-sizing:border-box;text-align:center;background:${BRAND.blue};color:#ffffff;text-decoration:none;padding:16px 20px;border-radius:8px;font-size:16px;font-weight:900;box-shadow:0 12px 26px rgba(54,92,245,0.24);">
                        ${escapeHtml(buttonText)}
                      </a>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:18px 30px 30px;background:#ffffff;">
                      <p style="margin:0;color:${BRAND.muted};font-size:13px;line-height:1.65;">
                        ${escapeHtml(footerText)}
                      </p>
                      <p style="margin:14px 0 0;color:${BRAND.muted};font-size:12px;line-height:1.6;">
                        If the button does not work, copy and paste this link into your browser:<br>
                        <a href="${safeButtonUrl}" style="color:${BRAND.blue};word-break:break-all;text-decoration:none;">${escapeHtml(buttonUrl)}</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:18px 12px 0;color:${BRAND.muted};font-size:12px;line-height:1.6;">
                FitAccess sends account emails for membership access and security.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function featureStrip()
{
  return `<tr>
    <td style="padding:0;background:#ffffff;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-bottom:1px solid ${BRAND.line};">
        <tr>
          <td width="33.33%" align="center" style="padding:18px 10px;border-right:1px solid ${BRAND.line};">
            <div style="font-size:18px;font-weight:900;color:${BRAND.ink};line-height:1;">12</div>
            <div style="margin-top:5px;font-size:12px;color:${BRAND.muted};line-height:1.3;">week workouts</div>
          </td>
          <td width="33.33%" align="center" style="padding:18px 10px;border-right:1px solid ${BRAND.line};">
            <div style="font-size:18px;font-weight:900;color:${BRAND.ink};line-height:1;">4</div>
            <div style="margin-top:5px;font-size:12px;color:${BRAND.muted};line-height:1.3;">meal weeks</div>
          </td>
          <td width="33.33%" align="center" style="padding:18px 10px;">
            <div style="font-size:18px;font-weight:900;color:${BRAND.ink};line-height:1;">AI</div>
            <div style="margin-top:5px;font-size:12px;color:${BRAND.muted};line-height:1.3;">coach support</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function codeBlock(code)
{
  if (!code)
  {
    return '';
  }

  return `<tr>
    <td style="padding:28px 30px 0;background:#ffffff;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.panel};border:1px dashed #b6c2d2;border-radius:12px;">
        <tr>
          <td align="center" style="padding:20px;">
            <div style="font-size:12px;color:${BRAND.muted};font-weight:800;text-transform:uppercase;">Activation code</div>
            <div style="margin-top:8px;font-size:30px;line-height:1;font-weight:900;color:${BRAND.ink};letter-spacing:2px;">${escapeHtml(code)}</div>
          </td>
        </tr>
      </table>
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

function escapeAttribute(value)
{
  return escapeHtml(value).replace(/`/g, '&#096;');
}

module.exports = {
  accessCodeEmail,
  magicLinkEmail,
  passwordResetEmail
};
