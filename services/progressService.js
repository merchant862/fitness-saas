'use strict';

const { WeightLog, WorkoutCompletion } = require('../database/models');

async function getUserProgress(userId)
{
  const [weightLogs, workoutsCompleted] = await Promise.all([
    WeightLog.findAll({ where: { userId }, order: [['loggedAt', 'ASC']] }),
    WorkoutCompletion.count({ where: { userId } })
  ]);

  return { weightLogs, workoutsCompleted };
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
  return WorkoutCompletion.create({
    userId,
    workoutKey,
    completedAt: new Date(),
    metadata
  });
}

module.exports = {
  completeUserWorkout,
  getUserProgress,
  logUserWeight
};
