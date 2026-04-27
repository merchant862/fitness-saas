'use strict';

function jwtSecret()
{
  const secret = process.env.JWT_SECRET || process.env.SECRET;

  if (!secret || secret.length < 32)
  {
    throw new Error('JWT_SECRET must be set and at least 32 characters long');
  }

  return secret;
}

function jwtOptions()
{
  return {
    issuer: process.env.JWT_ISSUER || 'fitaccess',
    audience: process.env.JWT_AUDIENCE || 'fitaccess-web'
  };
}

function authCookieOptions(expiresAt)
{
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/'
  };
}

module.exports = {
  authCookieOptions,
  jwtOptions,
  jwtSecret
};
