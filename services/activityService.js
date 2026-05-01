'use strict';

const { Event, User } = require('../database/models');

async function listUserActivity(userId, limit = 100)
{
  const events = await Event.findAll({
    where: { userId },
    attributes: ['id', 'eventType', 'ipAddress', 'userAgent', 'createdAt'],
    order: [['createdAt', 'DESC']],
    limit: Math.min(Number(limit || 100), 250)
  });

  return events.map(formatEventForDisplay);
}

async function listAdminActivity(limit = 250)
{
  const events = await Event.findAll({
    attributes: ['id', 'userId', 'eventType', 'ipAddress', 'userAgent', 'createdAt'],
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'email']
    }],
    order: [['createdAt', 'DESC']],
    limit: Math.min(Number(limit || 250), 500)
  });

  return events.map(formatEventForDisplay);
}

function formatEventForDisplay(event)
{
  const plain = event.get ? event.get({ plain: true }) : event;

  return {
    ...plain,
    userAgentLabel: parseUserAgentLabel(plain.userAgent),
    timeLabel: formatEventTime(plain.createdAt)
  };
}

function parseUserAgentLabel(userAgent)
{
  const value = String(userAgent || '').trim();

  if (!value)
  {
    return '-';
  }

  const browser = detectBrowser(value);
  const os = detectOs(value);

  if (browser && os)
  {
    return `${browser}, ${os}`;
  }

  return browser || os || value;
}

function formatEventTime(createdAt)
{
  if (!createdAt)
  {
    return '-';
  }

  const date = createdAt instanceof Date ? createdAt : new Date(createdAt);

  if (Number.isNaN(date.getTime()))
  {
    return '-';
  }

  const datePart = date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });

  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return `${datePart}, ${timePart}`;
}

function detectBrowser(userAgent)
{
  const rules = [
    { name: 'Edge', pattern: /Edg(?:e|A|iOS)?\/([\d.]+)/i },
    { name: 'Opera', pattern: /OPR\/([\d.]+)/i },
    { name: 'Chrome', pattern: /Chrome\/([\d.]+)/i },
    { name: 'Safari', pattern: /Version\/([\d.]+).*Safari/i },
    { name: 'Firefox', pattern: /Firefox\/([\d.]+)/i },
    { name: 'Samsung Internet', pattern: /SamsungBrowser\/([\d.]+)/i },
    { name: 'UC Browser', pattern: /UCBrowser\/([\d.]+)/i },
    { name: 'Brave', pattern: /Brave\/([\d.]+)/i }
  ];

  for (const rule of rules)
  {
    if (rule.pattern.test(userAgent))
    {
      return rule.name;
    }
  }

  return null;
}

function detectOs(userAgent)
{
  const rules = [
    { name: 'Windows', pattern: /Windows NT/i },
    { name: 'macOS', pattern: /Mac OS X|Macintosh/i },
    { name: 'iPhone iOS', pattern: /iPhone|iPad|iPod/i },
    { name: 'Android', pattern: /Android/i },
    { name: 'Linux', pattern: /Linux/i }
  ];

  for (const rule of rules)
  {
    if (rule.pattern.test(userAgent))
    {
      return rule.name;
    }
  }

  return null;
}

module.exports = {
  listAdminActivity,
  listUserActivity
};
