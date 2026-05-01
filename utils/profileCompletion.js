'use strict';

function normalizeGender(value)
{
  const gender = String(value || '').trim().toLowerCase();

  if (gender === 'male' || gender === 'female' || gender === 'other')
  {
    return gender;
  }

  return null;
}

function getProfilePreferences(user)
{
  return user?.profile?.preferences || {};
}

function parseHeight(preferences)
{
  const feet = toInteger(preferences?.heightFeet ?? preferences?.height_feet);
  const inches = toInteger(preferences?.heightInches ?? preferences?.height_inches);

  if (feet !== null || inches !== null)
  {
    return {
      feet: feet !== null ? feet : 0,
      inches: inches !== null ? inches : 0
    };
  }

  const legacyHeight = String(preferences?.height || '').trim();
  const match = legacyHeight.match(/^(\d{1,2})\s*(?:ft|feet|')\s*(\d{1,2})?\s*(?:in|inch|inches|")?$/i);

  if (match)
  {
    return {
      feet: toInteger(match[1]) ?? 0,
      inches: toInteger(match[2]) ?? 0
    };
  }

  return {
    feet: null,
    inches: null
  };
}

function isProfileComplete(user)
{
  if (!user?.onboardingCompletedAt)
  {
    return false;
  }

  const profile = user.profile || {};
  const preferences = getProfilePreferences(user);
  const height = parseHeight(preferences);
  const gender = normalizeGender(preferences.gender);
  const age = toInteger(preferences.age);

  return Boolean(
    profile.goal &&
    profile.level &&
    profile.environment &&
    age !== null &&
    profile.currentWeight !== null &&
    profile.currentWeight !== undefined &&
    profile.targetWeight !== null &&
    profile.targetWeight !== undefined &&
    profile.workoutDays !== null &&
    profile.workoutDays !== undefined &&
    gender &&
    height.feet !== null &&
    height.inches !== null
  );
}

function getPostAuthRedirect(user)
{
  if (!user?.onboardingCompletedAt)
  {
    return '/onboarding';
  }

  if (!isProfileComplete(user))
  {
    return '/profile';
  }

  return '/dashboard';
}

function getAvatarType(user)
{
  const gender = normalizeGender(getProfilePreferences(user).gender);
  return gender || 'guest';
}

function getAvatarSymbol(user)
{
  switch (getAvatarType(user))
  {
    case 'male':
      return '♂';
    case 'female':
      return '♀';
    case 'other':
      return '⚧';
    default:
      return null;
  }
}

function toInteger(value)
{
  if (value === undefined || value === null || value === '')
  {
    return null;
  }

  const number = Number(value);
  return Number.isInteger(number) ? number : null;
}

module.exports = {
  getAvatarSymbol,
  getAvatarType,
  getPostAuthRedirect,
  isProfileComplete,
  normalizeGender
};
