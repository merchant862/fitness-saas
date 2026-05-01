'use strict';

const { MealCompletion, WeightLog, WorkoutCompletion } = require('../database/models');

async function getUserProgress(userId)
{
  const [weightLogs, workoutsCompleted] = await Promise.all([
    WeightLog.findAll({ where: { userId }, order: [['loggedAt', 'ASC']] }),
    WorkoutCompletion.count({ where: { userId } })
  ]);

  const mealCompletions = await MealCompletion.count({ where: { userId } });

  return { weightLogs, workoutsCompleted, mealCompletions };
}

async function logUserWeight(userId, { weight, loggedAt })
{
  const [log] = await WeightLog.upsert({
    userId,
    weight,
    loggedAt
  });

  return log;
}

async function completeUserWorkout(userId, { workoutKey, metadata = {} })
{
  const existing = await WorkoutCompletion.findOne({
    where: { userId, workoutKey }
  });

  if (existing)
  {
    return existing;
  }

  return WorkoutCompletion.create({
    userId,
    workoutKey,
    completedAt: new Date(),
    metadata
  });
}

async function completeUserMealDay(userId, { mealKey, metadata = {} })
{
  const existing = await MealCompletion.findOne({
    where: { userId, mealKey }
  });

  if (existing)
  {
    return existing;
  }

  return MealCompletion.create({
    userId,
    mealKey,
    completedAt: new Date(),
    metadata
  });
}

module.exports = {
  completeUserWorkout,
  completeUserMealDay,
  getUserProgress,
  logUserWeight
};
