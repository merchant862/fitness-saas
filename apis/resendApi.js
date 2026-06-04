'use strict';

const { getResendSettings } = require('../services/appSettingsService');

async function sendResendEmail({ to, subject, html, text, attachments = [] })
{
  const settings = await getResendSettings();

  if (!settings.resend_api_key)
  {
    console.warn('Resend API key is not configured. Email skipped for:', to);
    return { skipped: true };
  }

  const payload = {
    from: settings.resend_from_email,
    to: [to],
    subject,
    html,
    text
  };

  if (attachments.length)
  {
    payload.attachments = attachments;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.resend_api_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok)
  {
    const body = await response.text();
    throw new Error(`Resend email failed: ${response.status} ${body}`);
  }

  return response.json();
}

module.exports = {
  sendResendEmail
};
