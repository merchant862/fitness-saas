'use strict';

const crypto = require('crypto');

const ITERATIONS = 210000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

function validatePassword(password)
{
  const value = String(password || '');

  if (value.length < 10)
  {
    return 'Password must be at least 10 characters.';
  }

  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value))
  {
    return 'Password must include uppercase, lowercase, and a number.';
  }

  return null;
}

function hashPassword(password)
{
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = crypto.pbkdf2Sync(String(password), salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('base64url');

  return `pbkdf2_${DIGEST}$${ITERATIONS}$${salt}$${hash}`;
}

function verifyPassword(password, storedHash)
{
  if (!storedHash)
  {
    return false;
  }

  const [scheme, iterations, salt, expected] = storedHash.split('$');

  if (scheme !== `pbkdf2_${DIGEST}` || !iterations || !salt || !expected)
  {
    return false;
  }

  const actual = crypto.pbkdf2Sync(String(password), salt, Number(iterations), KEY_LENGTH, DIGEST).toString('base64url');

  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

module.exports = {
  hashPassword,
  validatePassword,
  verifyPassword
};
