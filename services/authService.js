'use strict';

const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const {
  AccessCode,
  MagicLink,
  User,
  UserProfile,
  sequelize
} = require('../database/models');
const {
  addDays,
  clientIp,
  generateAccessCode,
  generateToken,
  normalizeEmail,
  sha256
} = require('../utils/securityUtils');
const { authCookieOptions, jwtOptions, jwtSecret } = require('../utils/jwtUtils');
const { verifyPassword } = require('../utils/passwordUtils');

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'fitaccess_token';
const SESSION_DAYS = Number(process.env.JWT_EXPIRES_DAYS || 14);

async function issueSession(req, res, user, options = {})
{
  const expiresAt = addDays(SESSION_DAYS);

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    jwtSecret(),
    {
      expiresIn: `${SESSION_DAYS}d`,
      ...jwtOptions()
    }
  );

  res.cookie(COOKIE_NAME, token, authCookieOptions(expiresAt));
  return token;
}

async function findUserForSession(payload)
{
  const user = await User.findByPk(payload.sub, {
    include: [{ model: UserProfile, as: 'profile' }]
  });

  if (
    !user ||
    user.status !== 'active' ||
    (user.accessExpiresAt && user.accessExpiresAt <= new Date())
  )
  {
    return null;
  }

  return { user };
}

async function revokeCurrentSession(req, res)
{
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

async function createAccessCode({ email, days = 30, source = 'manual', metadata = {} })
{
  const normalizedEmail = normalizeEmail(email);
  const plainCode = generateAccessCode();
  const expiresAt = addDays(days);

  const record = await AccessCode.create({
    email: normalizedEmail,
    codeHash: sha256(plainCode),
    expiresAt,
    source,
    metadata
  });

  return { accessCode: record, plainCode };
}

async function redeemAccessCode(req, res, { email, accessCode })
{
  const normalizedEmail = normalizeEmail(email);
  const codeHash = sha256(String(accessCode || '').trim().toUpperCase());

  return sequelize.transaction(async (transaction) =>
  {
    const code = await AccessCode.findOne({
      where: { codeHash },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!code || code.email !== normalizedEmail)
    {
      const error = new Error('Invalid access code');
      error.status = 401;
      throw error;
    }

    if (code.status !== 'unused' || code.expiresAt <= new Date())
    {
      if (code.status === 'unused')
      {
        await code.update({ status: 'expired' }, { transaction });
      }

      const error = new Error('Access code is expired or already used');
      error.status = 401;
      throw error;
    }

    const [user] = await User.findOrCreate({
      where: { email: normalizedEmail },
      defaults: {
        email: normalizedEmail,
        status: 'active',
        accessExpiresAt: code.expiresAt,
        tags: ['access_redeemed']
      },
      transaction
    });

    const tags = new Set(user.tags || []);
    tags.add('access_redeemed');
    await user.update({
      status: 'active',
      accessExpiresAt: code.expiresAt,
      lastLoginAt: new Date(),
      tags: Array.from(tags)
    }, { transaction });

    await UserProfile.findOrCreate({
      where: { userId: user.id },
      defaults: { userId: user.id },
      transaction
    });

    await code.update({
      userId: user.id,
      status: 'redeemed',
      redeemedAt: new Date()
    }, { transaction });

    await issueSession(req, res, user, { transaction });
    return user.reload({ include: [{ model: UserProfile, as: 'profile' }], transaction });
  });
}

async function requestMagicLink(req, { email })
{
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({
    where: {
      email: normalizedEmail,
      status: 'active',
      accessExpiresAt: { [Op.gt]: new Date() }
    }
  });

  if (!user)
  {
    return null;
  }

  const token = generateToken(32);
  await MagicLink.create({
    userId: user.id,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + Number(process.env.MAGIC_LINK_TTL_MINUTES || 15) * 60 * 1000),
    requestIp: clientIp(req),
    userAgent: String(req.headers['user-agent'] || '').slice(0, 255)
  });

  return { user, token, email: normalizedEmail };
}

async function loginWithPassword(req, res, { email, password })
{
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({
    where: {
      email: normalizedEmail,
      status: 'active',
      accessExpiresAt: { [Op.gt]: new Date() }
    },
    include: [{ model: UserProfile, as: 'profile' }]
  });

  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash))
  {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  await user.update({ lastLoginAt: new Date() });
  await issueSession(req, res, user);
  return user;
}

async function createPurchaseAccessLink(req, { email, days = 30, source = 'upsell', metadata = {} })
{
  const normalizedEmail = normalizeEmail(email);
  const expiresAt = addDays(days);

  return sequelize.transaction(async (transaction) =>
  {
    const [user] = await User.findOrCreate({
      where: { email: normalizedEmail },
      defaults: {
        email: normalizedEmail,
        status: 'active',
        accessExpiresAt: expiresAt,
        tags: ['upsell_customer', 'access_granted'],
        metadata
      },
      transaction
    });

    const tags = new Set(user.tags || []);
    tags.add('upsell_customer');
    tags.add('access_granted');

    await user.update({
      status: 'active',
      accessExpiresAt: expiresAt,
      tags: Array.from(tags),
      metadata: {
        ...safeJsonObject(user.metadata),
        ...metadata,
        source
      }
    }, { transaction });

    await UserProfile.findOrCreate({
      where: { userId: user.id },
      defaults: { userId: user.id },
      transaction
    });

    const token = generateToken(32);
    await MagicLink.create({
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + Number(process.env.MAGIC_LINK_TTL_MINUTES || 15) * 60 * 1000),
      requestIp: clientIp(req),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 255)
    }, { transaction });

    return {
      user: await user.reload({ include: [{ model: UserProfile, as: 'profile' }], transaction }),
      token,
      email: normalizedEmail,
      accessExpiresAt: expiresAt
    };
  });
}

async function verifyMagicLink(req, res, token)
{
  const link = await MagicLink.findOne({
    where: {
      tokenHash: sha256(token),
      usedAt: null,
      expiresAt: { [Op.gt]: new Date() }
    },
    include: [{ model: User, as: 'user', include: [{ model: UserProfile, as: 'profile' }] }]
  });

  if (!link || !link.user || link.user.status !== 'active')
  {
    const error = new Error('Invalid or expired login link');
    error.status = 401;
    throw error;
  }

  await link.update({ usedAt: new Date() });
  await link.user.update({ lastLoginAt: new Date() });
  await issueSession(req, res, link.user);
  return link.user;
}

module.exports = {
  COOKIE_NAME,
  createAccessCode,
  createPurchaseAccessLink,
  findUserForSession,
  issueSession,
  loginWithPassword,
  redeemAccessCode,
  requestMagicLink,
  revokeCurrentSession,
  verifyMagicLink
};

function safeJsonObject(value)
{
  if (!value)
  {
    return {};
  }

  if (typeof value === 'string')
  {
    if (value.length > 10000)
    {
      return {};
    }

    try
    {
      const parsed = JSON.parse(value);
      return sanitizeMetadataShape(parsed);
    }
    catch
    {
      return {};
    }
  }

  if (typeof value === 'object' && !Array.isArray(value))
  {
    return sanitizeMetadataShape(value);
  }

  return {};
}

function sanitizeMetadataShape(value)
{
  if (!value || typeof value !== 'object' || Array.isArray(value))
  {
    return {};
  }

  const keys = Object.keys(value);
  if (!keys.length)
  {
    return {};
  }

  if (keys.length > 50)
  {
    return {};
  }

  const numericKeys = keys.filter((key) => /^\d+$/.test(key)).length;
  if (numericKeys / keys.length > 0.6)
  {
    return {};
  }

  return value;
}
