'use strict';

const { User, UserProfile, WeightLog } = require('../database/models');

async function completeUserOnboarding(user, payload)
{
  const [profile] = await UserProfile.findOrCreate({
    where: { userId: user.id },
    defaults: { userId: user.id }
  });

  await profile.update(payload);

  const tags = new Set(user.tags || []);
  tags.add(`goal:${payload.goal}`);
  tags.add(`level:${payload.level}`);
  tags.add(`environment:${payload.environment}`);

  await user.update({
    onboardingCompletedAt: user.onboardingCompletedAt || new Date(),
    tags: Array.from(tags)
  });

  if (payload.currentWeight)
  {
    await WeightLog.upsert({
      userId: user.id,
      weight: payload.currentWeight,
      loggedAt: new Date().toISOString().slice(0, 10)
    });
  }

  return user.reload({ include: [{ model: UserProfile, as: 'profile' }] });
}

async function updateUserProfile(user, payload)
{
  await user.update(payload);
  return user.reload({ include: [{ model: UserProfile, as: 'profile' }] });
}

async function listUsers(limit = 100)
{
  return User.findAll({
    include: [{ model: UserProfile, as: 'profile' }],
    order: [['createdAt', 'DESC']],
    limit: Math.min(Number(limit || 100), 500)
  });
}

module.exports = {
  completeUserOnboarding,
  listUsers,
  updateUserProfile
};
