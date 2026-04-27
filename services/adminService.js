'use strict';

const { AccessCode, Event, User, UserProfile, WorkoutCompletion } = require('../database/models');
const { addDays } = require('../utils/securityUtils');

async function getAdminDashboardStats()
{
  const now = new Date();
  const [
    totalUsers,
    activeUsers,
    unusedCodes,
    redeemedCodes,
    revokedCodes,
    workoutCompletions,
    recentEvents
  ] = await Promise.all([
    User.count(),
    User.count({ where: { status: 'active' } }),
    AccessCode.count({ where: { status: 'unused' } }),
    AccessCode.count({ where: { status: 'redeemed' } }),
    AccessCode.count({ where: { status: 'revoked' } }),
    WorkoutCompletion.count(),
    Event.findAll({ order: [['createdAt', 'DESC']], limit: 8 })
  ]);

  return {
    stats: {
      totalUsers,
      activeUsers,
      unusedCodes,
      redeemedCodes,
      revokedCodes,
      workoutCompletions,
      generatedAt: now
    },
    recentEvents
  };
}

async function listAdminUsers()
{
  return User.findAll({
    include: [{ model: UserProfile, as: 'profile' }],
    order: [['createdAt', 'DESC']],
    limit: 200
  });
}

async function listAdminAccessCodes()
{
  return AccessCode.findAll({
    include: [{ model: User, as: 'user' }],
    order: [['createdAt', 'DESC']],
    limit: 200
  });
}

async function promoteAdminUser(email)
{
  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      email,
      role: 'admin',
      status: 'active',
      accessExpiresAt: addDays(3650),
      tags: ['admin']
    }
  });

  const tags = new Set(user.tags || []);
  tags.add('admin');

  await user.update({
    role: 'admin',
    status: 'active',
    accessExpiresAt: user.accessExpiresAt && user.accessExpiresAt > new Date() ? user.accessExpiresAt : addDays(3650),
    tags: Array.from(tags)
  });

  await UserProfile.findOrCreate({
    where: { userId: user.id },
    defaults: { userId: user.id }
  });

  return { user, created };
}

module.exports = {
  getAdminDashboardStats,
  listAdminAccessCodes,
  listAdminUsers,
  promoteAdminUser
};
