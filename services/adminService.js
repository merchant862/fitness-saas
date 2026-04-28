'use strict';

const { Op } = require('sequelize');
const {
  AccessCode,
  AiMessage,
  Event,
  MealDay,
  MealPlan,
  User,
  UserProfile,
  WorkoutCompletion,
  WorkoutPlan,
  WorkoutSession
} = require('../database/models');
const { addDays } = require('../utils/securityUtils');

async function getAdminDashboardStats()
{
  const now = new Date();
  const [
    totalUsers,
    activeUsers,
    onboardedUsers,
    unusedCodes,
    redeemedCodes,
    revokedCodes,
    workoutCompletions,
    aiMessages,
    workoutPlans,
    mealPlans,
    recentEvents
  ] = await Promise.all([
    User.count(),
    User.count({ where: { status: 'active' } }),
    User.count({ where: { onboardingCompletedAt: { [Op.ne]: null } } }),
    AccessCode.count({ where: { status: 'unused' } }),
    AccessCode.count({ where: { status: 'redeemed' } }),
    AccessCode.count({ where: { status: 'revoked' } }),
    WorkoutCompletion.count(),
    AiMessage.count(),
    WorkoutPlan.count({ where: { isActive: true } }),
    MealPlan.count({ where: { isActive: true } }),
    Event.findAll({ order: [['createdAt', 'DESC']], limit: 8 })
  ]);

  return {
    stats: {
      totalUsers,
      activeUsers,
      onboardedUsers,
      unusedCodes,
      redeemedCodes,
      revokedCodes,
      workoutCompletions,
      aiMessages,
      workoutPlans,
      mealPlans,
      activationRate: percentage(redeemedCodes, redeemedCodes + unusedCodes),
      onboardingRate: percentage(onboardedUsers, totalUsers),
      generatedAt: now
    },
    recentEvents
  };
}

async function listAdminUsers(filters = {})
{
  const where = {};
  const profileWhere = {};

  if (filters.search)
  {
    where.email = { [Op.like]: `%${filters.search}%` };
  }

  if (['active', 'pending', 'suspended'].includes(filters.status))
  {
    where.status = filters.status;
  }

  if (['weight_loss', 'muscle_gain', 'general_fitness'].includes(filters.goal))
  {
    profileWhere.goal = filters.goal;
  }

  const users = await User.findAll({
    where,
    include: [{
      model: UserProfile,
      as: 'profile',
      where: profileWhere,
      required: Boolean(filters.goal)
    }],
    order: [['createdAt', 'DESC']],
    limit: Math.min(Number(filters.limit || 200), 1000)
  });

  return users.map(normalizeUserJson);
}

async function listAdminAccessCodes()
{
  return AccessCode.findAll({
    include: [{ model: User, as: 'user' }],
    order: [['createdAt', 'DESC']],
    limit: 200
  });
}

async function getAdminContentOverview()
{
  const [
    workoutPlans,
    workoutSessionCount,
    mealPlans,
    mealDayCount
  ] = await Promise.all([
    WorkoutPlan.findAll({
      include: [{ model: WorkoutSession, as: 'sessions' }],
      order: [['goal', 'ASC'], ['level', 'ASC'], ['environment', 'ASC']]
    }),
    WorkoutSession.count(),
    MealPlan.findAll({
      include: [{ model: MealDay, as: 'days' }],
      order: [['goal', 'ASC']]
    }),
    MealDay.count()
  ]);

  return {
    stats: {
      workoutPlans: workoutPlans.length,
      workoutSessions: workoutSessionCount,
      mealPlans: mealPlans.length,
      mealDays: mealDayCount
    },
    workoutPlans,
    mealPlans
  };
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
  getAdminContentOverview,
  getAdminDashboardStats,
  listAdminAccessCodes,
  listAdminUsers,
  promoteAdminUser
};

function normalizeUserJson(user)
{
  user.tags = asJson(user.tags, []);
  user.metadata = asJson(user.metadata, {});

  if (user.profile)
  {
    user.profile.preferences = asJson(user.profile.preferences, {});
  }

  return user;
}

function asJson(value, fallback)
{
  if (value === undefined || value === null)
  {
    return fallback;
  }

  if (typeof value !== 'string')
  {
    return value;
  }

  try
  {
    return JSON.parse(value);
  }
  catch (error)
  {
    return fallback;
  }
}

function percentage(part, total)
{
  if (!total)
  {
    return '0%';
  }

  return `${Math.round((part / total) * 100)}%`;
}
