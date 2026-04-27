'use strict';

const crypto = require('crypto');

const ACCESS_CODE_PREFIX = 'FIT';

function normalizeEmail(email)
{
  return String(email || '').trim().toLowerCase();
}

function sha256(value)
{
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function generateToken(bytes = 32)
{
  return crypto.randomBytes(bytes).toString('base64url');
}

function generateAccessCode()
{
  const body = crypto
    .randomBytes(12)
    .toString('base64url')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 16);

  return `${ACCESS_CODE_PREFIX}-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}-${body.slice(12, 16)}`;
}

function addDays(days)
{
  const date = new Date();
  date.setDate(date.getDate() + Number(days || 0));
  return date;
}

function clientIp(req)
{
  return req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
}

function isEmail(email)
{
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function compactUser(user)
{
  if (!user)
  {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    tags: user.tags || [],
    accessExpiresAt: user.accessExpiresAt,
    onboardingCompletedAt: user.onboardingCompletedAt,
    profile: user.profile || null
  };
}

module.exports = {
  addDays,
  clientIp,
  compactUser,
  generateAccessCode,
  generateToken,
  isEmail,
  normalizeEmail,
  sha256
};
