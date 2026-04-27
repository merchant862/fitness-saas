'use strict';

const { trackEvent } = require('../../services/eventService');
const { completeUserOnboarding, listUsers, updateUserProfile } = require('../../services/userService');
const { compactUser } = require('../../utils/securityUtils');

const allowedGoals = ['weight_loss', 'muscle_gain', 'general_fitness'];
const allowedLevels = ['beginner', 'intermediate', 'advanced'];
const allowedEnvironments = ['home', 'gym'];

async function me(req, res)
{
  return res.status(200).json({ user: compactUser(req.user) });
}

async function onboarding(req, res, next)
{
  try
  {
    const payload = normalizeOnboarding(req.body);

    if (!payload.goal || !payload.level || !payload.environment)
    {
      return res.status(422).json({ error: 'Goal, level, and environment are required' });
    }

    await completeUserOnboarding(req.user, payload);

    await trackEvent(req, 'onboarding_completed', payload, req.user.id);
    return res.redirect('/dashboard');
  }
  catch (error)
  {
    next(error);
  }
}

async function updateProfile(req, res, next)
{
  try
  {
    const update = {};

    if (req.body.name)
    {
      update.name = String(req.body.name).trim().slice(0, 120);
    }

    const user = await updateUserProfile(req.user, update);
    return res.status(200).json({ user: compactUser(user) });
  }
  catch (error)
  {
    next(error);
  }
}

async function adminUsers(req, res, next)
{
  try
  {
    const users = await listUsers(req.query.limit);
    return res.status(200).json({ users });
  }
  catch (error)
  {
    next(error);
  }
}

function normalizeOnboarding(body)
{
  const goal = String(body.goal || '').trim();
  const level = String(body.level || '').trim();
  const environment = String(body.environment || '').trim();

  return {
    goal: allowedGoals.includes(goal) ? goal : null,
    level: allowedLevels.includes(level) ? level : null,
    environment: allowedEnvironments.includes(environment) ? environment : null,
    currentWeight: parsePositiveNumber(body.currentWeight),
    targetWeight: parsePositiveNumber(body.targetWeight),
    workoutDays: parsePositiveInteger(body.workoutDays, 1, 7)
  };
}

function parsePositiveNumber(value)
{
  if (value === undefined || value === null || value === '')
  {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function parsePositiveInteger(value, min, max)
{
  if (value === undefined || value === null || value === '')
  {
    return null;
  }

  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : null;
}

module.exports = {
  adminUsers,
  me,
  onboarding,
  updateProfile
};
