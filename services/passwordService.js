'use strict';

const { Op } = require('sequelize');
const { PasswordResetToken, User } = require('../database/models');
const { clientIp, generateToken, normalizeEmail, sha256 } = require('../utils/securityUtils');
const { hashPassword, validatePassword, verifyPassword } = require('../utils/passwordUtils');

async function requestPasswordReset(req, email)
{
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({
    where: {
      email: normalizedEmail,
      status: 'active'
    }
  });

  if (!user || user.role === 'admin')
  {
    return null;
  }

  const now = new Date();
  const cooldownMinutes = Number(process.env.PASSWORD_RESET_COOLDOWN_MINUTES || 5);
  const activeResetToken = await PasswordResetToken.findOne({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { [Op.gt]: now },
      createdAt: {
        [Op.gte]: new Date(now.getTime() - cooldownMinutes * 60 * 1000)
      }
    },
    order: [['createdAt', 'DESC']]
  });

  if (activeResetToken)
  {
    return null;
  }

  const token = generateToken(32);
  await PasswordResetToken.update({
    usedAt: now
  }, {
    where: {
      userId: user.id,
      usedAt: null
    }
  });

  await PasswordResetToken.create({
    userId: user.id,
    tokenHash: sha256(token),
    expiresAt: new Date(now.getTime() + Number(process.env.PASSWORD_RESET_TTL_MINUTES || 30) * 60 * 1000),
    requestIp: clientIp(req)
  });

  return { user, token, email: user.email };
}

async function resetPasswordWithToken({ email, token, password })
{
  const validationError = validatePassword(password);

  if (validationError)
  {
    const error = new Error(validationError);
    error.status = 422;
    throw error;
  }

  const resetToken = await PasswordResetToken.findOne({
    where: {
      tokenHash: sha256(token),
      usedAt: null,
      expiresAt: { [Op.gt]: new Date() }
    },
    include: [{ model: User, as: 'user' }]
  });

  if (!resetToken || !resetToken.user || resetToken.user.email !== normalizeEmail(email))
  {
    const error = new Error('Invalid or expired reset token');
    error.status = 401;
    throw error;
  }

  if (resetToken.user.role === 'admin')
  {
    const error = new Error('Password reset is not available for this account');
    error.status = 403;
    throw error;
  }

  await resetToken.user.update({ passwordHash: hashPassword(password), status: 'active' });
  await resetToken.update({ usedAt: new Date() });
  return resetToken.user;
}

async function changePassword(user, { currentPassword, newPassword })
{
  const validationError = validatePassword(newPassword);

  if (validationError)
  {
    const error = new Error(validationError);
    error.status = 422;
    throw error;
  }

  if (user.passwordHash && !verifyPassword(currentPassword, user.passwordHash))
  {
    const error = new Error('Current password is incorrect');
    error.status = 401;
    throw error;
  }

  await user.update({ passwordHash: hashPassword(newPassword) });
  return user;
}

module.exports = {
  changePassword,
  requestPasswordReset,
  resetPasswordWithToken
};
