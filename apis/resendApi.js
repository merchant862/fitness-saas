'use strict';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'FitAccess <noreply@example.com>';

async function sendResendEmail({ to, subject, html, text })
{
  if (!process.env.RESEND_API_KEY)
  {
    console.warn('RESEND_API_KEY is not configured. Email skipped for:', to);
    return { skipped: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      text
    })
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
