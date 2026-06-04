'use strict';

const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const {
  MagicLink,
  User,
  UserLoginSession,
  UserProfile,
  sequelize
} = require('../database/models');
const { getMemberDeviceLimit } = require('./appSettingsService');
const {
  addDays,
  clientIp,
  generateToken,
  normalizeEmail,
  sha256
} = require('../utils/securityUtils');
const { authCookieOptions, jwtOptions, jwtSecret } = require('../utils/jwtUtils');
const { verifyPassword } = require('../utils/passwordUtils');

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'fitaccess_token';
const SESSION_DAYS = Number(process.env.JWT_EXPIRES_DAYS || 14);
const MAGIC_LINK_TTL_MINUTES = minutesFromEnv('MAGIC_LINK_TTL_MINUTES', 30);
const PURCHASE_MAGIC_LINK_TTL_MINUTES = minutesFromEnv('PURCHASE_MAGIC_LINK_TTL_MINUTES', 4320);

function minutesFromEnv(key, fallback)
{
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function issueSession(req, res, user, options = {})
{
  const expiresAt = addDays(SESSION_DAYS);
  const sid = generateToken(32);

  const token = jwt.sign(
    { sub: user.id, role: user.role, sid },
    jwtSecret(),
    {
      expiresIn: `${SESSION_DAYS}d`,
      ...jwtOptions()
    }
  );

  if (user.role === 'user')
  {
    await saveMemberLoginSession(req, user, sid, expiresAt, options);
  }

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

  if (user.role === 'user' && !(await isCurrentMemberLoginSession(user, payload.sid)))
  {
    return null;
  }

  return { user };
}

async function revokeCurrentSession(req, res)
{
  if (req.user?.role === 'user' && req.authSessionId)
  {
    const currentHash = sha256(req.authSessionId);
    await UserLoginSession.update(
      { revokedAt: new Date() },
      {
        where: {
          userId: req.user.id,
          sessionTokenHash: currentHash,
          revokedAt: null
        }
      }
    );
  }

  res.clearCookie(COOKIE_NAME, { path: '/' });
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
    expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000),
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

async function loginAdminWithPassword(req, res, { email, password })
{
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({
    where: {
      email: normalizedEmail,
      role: 'admin',
      status: 'active'
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
      expiresAt: new Date(Date.now() + PURCHASE_MAGIC_LINK_TTL_MINUTES * 60 * 1000),
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

  await issueSession(req, res, link.user);
  await link.update({ usedAt: new Date() });
  await link.user.update({ lastLoginAt: new Date() });
  return link.user;
}

module.exports = {
  COOKIE_NAME,
  createPurchaseAccessLink,
  findUserForSession,
  issueSession,
  loginAdminWithPassword,
  loginWithPassword,
  requestMagicLink,
  revokeCurrentSession,
  verifyMagicLink
};

async function saveMemberLoginSession(req, user, sid, expiresAt, options = {})
{
  if (!options.transaction)
  {
    return sequelize.transaction(async (transaction) =>
      saveMemberLoginSession(req, user, sid, expiresAt, { ...options, transaction })
    );
  }

  const now = new Date();
  const sessionHash = sha256(sid);
  const transaction = options.transaction;

  const lockedUser = transaction
    ? await User.findByPk(user.id, { transaction, lock: transaction.LOCK.UPDATE })
    : await User.findByPk(user.id);

  if (!lockedUser)
  {
    const error = new Error('User account is no longer available');
    error.status = 401;
    throw error;
  }

  await UserLoginSession.destroy({
    where: {
      userId: lockedUser.id,
      [Op.or]: [
        { expiresAt: { [Op.lte]: now } },
        { revokedAt: { [Op.ne]: null } }
      ]
    },
    transaction
  });

  const [deviceLimit, activeSessionCount] = await Promise.all([
    getMemberDeviceLimit({ transaction }),
    UserLoginSession.count({
      where: {
        userId: lockedUser.id,
        revokedAt: null,
        expiresAt: { [Op.gt]: now }
      },
      transaction
    })
  ]);

  if (activeSessionCount >= deviceLimit)
  {
    const error = new Error(`This account is already signed in on ${deviceLimit} allowed ${deviceLimit === 1 ? 'device' : 'devices'}. Please log out from an active device before signing in again.`);
    error.status = 409;
    throw error;
  }

  await UserLoginSession.create({
    userId: lockedUser.id,
    sessionTokenHash: sessionHash,
    expiresAt,
    ipAddress: String(clientIp(req) || '').slice(0, 64) || null,
    userAgent: String(req.headers['user-agent'] || '').slice(0, 255) || null
  }, { transaction });

  Object.assign(user, lockedUser.get({ plain: true }));
}

async function isCurrentMemberLoginSession(user, sid)
{
  if (!sid)
  {
    return false;
  }

  const session = await UserLoginSession.findOne({
    where: {
      userId: user.id,
      sessionTokenHash: sha256(sid),
      revokedAt: null,
      expiresAt: { [Op.gt]: new Date() }
    }
  });

  return Boolean(session);
}

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
