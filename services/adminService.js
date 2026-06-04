'use strict';

const { Op } = require('sequelize');
const {
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
const { hashPassword, validatePassword } = require('../utils/passwordUtils');

async function getAdminDashboardStats()
{
  const now = new Date();
  const [
    totalUsers,
    activeUsers,
    onboardedUsers,
    workoutCompletions,
    aiMessages,
    workoutPlans,
    mealPlans,
    recentEvents
  ] = await Promise.all([
    User.count({ where: { role: 'user' } }),
    User.count({ where: { role: 'user', status: 'active' } }),
    User.count({ where: { role: 'user', onboardingCompletedAt: { [Op.ne]: null } } }),
    WorkoutCompletion.count(),
    AiMessage.count(),
    WorkoutPlan.count({ where: { isActive: true } }),
    MealPlan.count({ where: { isActive: true } }),
    Event.findAll({
      include: [{
        model: User,
        as: 'user',
        where: { role: 'user' },
        required: true
      }],
      order: [['createdAt', 'DESC']],
      limit: 8
    })
  ]);

  return {
    stats: {
      totalUsers,
      activeUsers,
      onboardedUsers,
      workoutCompletions,
      aiMessages,
      workoutPlans,
      mealPlans,
      onboardingRate: percentage(onboardedUsers, totalUsers),
      generatedAt: now
    },
    recentEvents
  };
}

async function listAdminUsers(filters = {})
{
  const where = {
    role: 'user'
  };
  const profileWhere = {};
  const limit = Math.min(Math.max(Number(filters.limit || 25), 1), 100);
  const offset = Math.max(Number(filters.offset || 0), 0);

  if (filters.search)
  {
    where.email = { [Op.like]: `${String(filters.search).toLowerCase()}%` };
  }

  if (['active', 'pending', 'suspended'].includes(filters.status))
  {
    where.status = filters.status;
  }

  if (['weight_loss', 'muscle_gain', 'general_fitness'].includes(filters.goal))
  {
    profileWhere.goal = filters.goal;
  }

  const query = {
    where,
    include: [{
      model: UserProfile,
      as: 'profile',
      where: profileWhere,
      required: Boolean(filters.goal)
    }],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  };

  const users = await User.findAll(query);

  return users.map(normalizeUserJson);
}

async function searchAdminUsers(filters = {})
{
  const where = {
    role: 'user'
  };
  const profileWhere = {};
  const limit = Math.min(Math.max(Number(filters.limit || 25), 1), 100);
  const offset = Math.max(Number(filters.offset || 0), 0);

  if (filters.search)
  {
    where.email = { [Op.like]: `${String(filters.search).toLowerCase()}%` };
  }

  if (['active', 'pending', 'suspended'].includes(filters.status))
  {
    where.status = filters.status;
  }

  if (['weight_loss', 'muscle_gain', 'general_fitness'].includes(filters.goal))
  {
    profileWhere.goal = filters.goal;
  }

  const include = [{
    model: UserProfile,
    as: 'profile',
    where: profileWhere,
    required: Boolean(filters.goal)
  }];

  const { rows, count } = await User.findAndCountAll({
    where,
    include,
    distinct: true,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return {
    users: rows.map(normalizeUserJson),
    total: count,
    limit,
    offset
  };
}

async function updateAdminUserStatus(id, status)
{
  if (!['active', 'pending', 'suspended'].includes(status))
  {
    const error = new Error('Choose a valid user status.');
    error.status = 422;
    throw error;
  }

  const user = await User.findByPk(id);

  if (!user)
  {
    return null;
  }

  await user.update({ status });
  return normalizeUserJson(user);
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

async function getAdminWorkoutPlan(id)
{
  return WorkoutPlan.findByPk(id, {
    include: [{ model: WorkoutSession, as: 'sessions' }],
    order: [[{ model: WorkoutSession, as: 'sessions' }, 'weekNumber', 'ASC'], [{ model: WorkoutSession, as: 'sessions' }, 'dayOfWeek', 'ASC']]
  });
}

async function getAdminMealPlan(id)
{
  return MealPlan.findByPk(id, {
    include: [{ model: MealDay, as: 'days' }],
    order: [[{ model: MealDay, as: 'days' }, 'weekNumber', 'ASC'], [{ model: MealDay, as: 'days' }, 'dayOfWeek', 'ASC']]
  });
}

async function updateAdminWorkoutPlan(id, payload)
{
  const plan = await WorkoutPlan.findByPk(id);

  if (!plan)
  {
    return null;
  }

  await plan.update({
    title: payload.title,
    description: payload.description,
    durationWeeks: payload.durationWeeks,
    sessionsPerWeek: payload.sessionsPerWeek,
    tips: payload.tips,
    isActive: payload.isActive
  });

  return getAdminWorkoutPlan(id);
}

async function updateAdminMealPlan(id, payload)
{
  const plan = await MealPlan.findByPk(id);

  if (!plan)
  {
    return null;
  }

  await plan.update({
    title: payload.title,
    description: payload.description,
    durationWeeks: payload.durationWeeks,
    dailyCalories: payload.dailyCalories,
    macros: payload.macros,
    tips: payload.tips,
    isActive: payload.isActive
  });

  return getAdminMealPlan(id);
}

async function promoteAdminUser(email, password = null)
{
  if (password)
  {
    const passwordError = validatePassword(password);

    if (passwordError)
    {
      throw new Error(passwordError);
    }
  }

  const [user, created] = await User.findOrCreate({
    where: { email },
    defaults: {
      email,
      role: 'admin',
      status: 'active',
      accessExpiresAt: addDays(3650),
      passwordHash: password ? hashPassword(password) : null,
      tags: ['admin']
    }
  });

  const tags = new Set(user.tags || []);
  tags.add('admin');

  const updates = {
    role: 'admin',
    status: 'active',
    accessExpiresAt: user.accessExpiresAt && user.accessExpiresAt > new Date() ? user.accessExpiresAt : addDays(3650),
    tags: Array.from(tags)
  };

  if (password)
  {
    updates.passwordHash = hashPassword(password);
  }

  await user.update(updates);

  await UserProfile.findOrCreate({
    where: { userId: user.id },
    defaults: { userId: user.id }
  });

  return { user, created };
}

module.exports = {
  getAdminContentOverview,
  getAdminDashboardStats,
  getAdminMealPlan,
  getAdminWorkoutPlan,
  listAdminUsers,
  promoteAdminUser,
  searchAdminUsers,
  updateAdminUserStatus,
  updateAdminMealPlan,
  updateAdminWorkoutPlan
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
