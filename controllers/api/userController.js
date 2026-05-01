'use strict';

const { trackEvent } = require('../../services/eventService');
const { completeUserOnboarding, updateUserProfile } = require('../../services/userService');
const { searchAdminUsers } = require('../../services/adminService');
const { compactUser } = require('../../utils/securityUtils');
const { errorResponse, successResponse } = require('../../utils/httpResponseUtils');

const allowedGoals = ['weight_loss', 'muscle_gain', 'general_fitness'];
const allowedLevels = ['beginner', 'intermediate', 'advanced'];
const allowedEnvironments = ['home', 'gym'];
const allowedGenders = ['male', 'female', 'other'];

async function me(req, res)
{
  return res.status(200).json({ user: compactUser(req.user) });
}

async function onboarding(req, res, next)
{
  try
  {
    const payload = normalizeOnboarding(req.body);

    if (!payload.goal || !payload.level || !payload.environment || !payload.gender)
    {
      return errorResponse(req, res, { message: 'Goal, level, environment, and gender are required' });
    }

    const user = await completeUserOnboarding(req.user, payload);

    await trackEvent(req, 'onboarding_completed', payload, req.user.id);
    return successResponse(req, res, {
      message: 'Onboarding completed successfully.',
      redirectTo: '/dashboard',
      data: { user: compactUser(user) }
    });
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

    const profilePayload = normalizeOnboarding(req.body);

    Object.keys(profilePayload).forEach((key) =>
    {
      if (profilePayload[key] !== null)
      {
        update[key] = profilePayload[key];
      }
    });

    const preferences = {};

    if (req.body.age)
    {
      preferences.age = parsePositiveInteger(req.body.age, 1, 120);
    }

    if (req.body.gender)
    {
      const gender = String(req.body.gender).trim().toLowerCase();
      if (allowedGenders.includes(gender))
      {
        preferences.gender = gender;
      }
    }

    const height = normalizeHeight(req.body);

    if (height.feet !== null)
    {
      preferences.heightFeet = height.feet;
      preferences.heightInches = height.inches;
    }

    [
      'address1',
      'address2',
      'city',
      'state',
      'zip',
      'country',
      'phone'
    ].forEach((field) =>
    {
      if (req.body[field])
      {
        preferences[field] = String(req.body[field]).trim().slice(0, 120);
      }
    });

    if (req.body.firstName)
    {
      preferences.firstName = String(req.body.firstName).trim().slice(0, 120);
    }

    if (req.body.lastName)
    {
      preferences.lastName = String(req.body.lastName).trim().slice(0, 120);
    }

    if (Object.keys(preferences).length)
    {
      update.preferences = {
        ...safePreferences(req.user.profile?.preferences),
        ...preferences
      };
    }

    const user = await updateUserProfile(req.user, update);

    return successResponse(req, res, {
      message: 'Profile updated successfully.',
      data: { user: compactUser(user) }
    });
  }
  catch (error)
  {
    next(error);
  }
}

function normalizeHeight(body)
{
  const feet = parseBoundedInteger(body.heightFeet || body.height_feet, 1, 9);
  const inches = parseBoundedInteger(body.heightInches || body.height_inches, 0, 11);

  if (feet !== null || inches !== null)
  {
    return {
      feet: feet !== null ? feet : 0,
      inches: inches !== null ? inches : 0
    };
  }

  const legacy = String(body.height || '').trim();
  const match = legacy.match(/^(\d{1,2})\s*(?:ft|feet|')\s*(\d{1,2})?\s*(?:in|inch|inches|")?$/i);

  if (match)
  {
    return {
      feet: parseBoundedInteger(match[1], 1, 9) || 0,
      inches: parseBoundedInteger(match[2], 0, 11) || 0
    };
  }

  const decimalMatch = legacy.match(/^(\d{1,2})(?:\.(\d{1,2}))$/);

  if (decimalMatch)
  {
    return {
      feet: parseBoundedInteger(decimalMatch[1], 1, 9) || 0,
      inches: parseBoundedInteger(decimalMatch[2], 0, 11) || 0
    };
  }

  return {
    feet: null,
    inches: null
  };
}

function parseBoundedInteger(value, min, max)
{
  if (value === undefined || value === null || value === '')
  {
    return null;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number < min || number > max)
  {
    return null;
  }

  return number;
}

async function adminUsers(req, res, next)
{
  try
  {
    const result = await searchAdminUsers(normalizeAdminUserFilters(req.query));
    return res.status(200).json(result);
  }
  catch (error)
  {
    next(error);
  }
}

function normalizeAdminUserFilters(query)
{
  return {
    search: String(query.search || '').trim().slice(0, 120),
    status: allowed(query.status, ['active', 'pending', 'suspended']),
    goal: allowed(query.goal, ['weight_loss', 'muscle_gain', 'general_fitness']),
    limit: Number(query.limit || 25),
    offset: Number(query.offset || 0)
  };
}

function allowed(value, options)
{
  const text = String(value || '').trim();
  return options.includes(text) ? text : '';
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
    gender: normalizeGender(body.gender),
    currentWeight: parsePositiveNumber(body.currentWeight),
    targetWeight: parsePositiveNumber(body.targetWeight),
    workoutDays: parsePositiveInteger(body.workoutDays, 1, 7)
  };
}

function normalizeGender(value)
{
  const gender = String(value || '').trim().toLowerCase();

  if (allowedGenders.includes(gender))
  {
    return gender;
  }

  return null;
}

function safePreferences(value)
{
  if (!value)
  {
    return {};
  }

  if (typeof value === 'string')
  {
    try
    {
      const parsed = JSON.parse(value);
      return isPlainObject(parsed) ? parsed : {};
    }
    catch (error)
    {
      return {};
    }
  }

  if (isPlainObject(value))
  {
    return { ...value };
  }

  return {};
}

function isPlainObject(value)
{
  return Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype;
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
