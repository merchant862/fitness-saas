'use strict';

const { trackEvent } = require('../../services/eventService');
const { completeUserWorkout, getUserProgress, logUserWeight } = require('../../services/progressService');

async function progress(req, res, next)
{
  try
  {
    const { weightLogs, workoutsCompleted } = await getUserProgress(req.user.id);

    return res.status(200).json({ weightLogs, workoutsCompleted });
  }
  catch (error)
  {
    next(error);
  }
}

async function logWeight(req, res, next)
{
  try
  {
    const weight = Number(req.body.weight);

    if (!Number.isFinite(weight) || weight <= 0)
    {
      return res.status(422).json({ error: 'Valid weight is required' });
    }

    const loggedAt = req.body.loggedAt || new Date().toISOString().slice(0, 10);
    const log = await logUserWeight(req.user.id, { weight, loggedAt });
    await trackEvent(req, 'weight_logged', { weight, loggedAt }, req.user.id);

    return res.status(201).json({ weightLog: log });
  }
  catch (error)
  {
    next(error);
  }
}

async function completeWorkout(req, res, next)
{
  try
  {
    const workoutKey = String(req.params.id || req.body.workoutKey || '').trim().slice(0, 120);

    if (!workoutKey)
    {
      return res.status(422).json({ error: 'Workout key is required' });
    }

    const completion = await completeUserWorkout(req.user.id, {
      workoutKey,
      metadata: req.body.metadata || {}
    });
    await trackEvent(req, 'workout_completed', { workoutKey }, req.user.id);

    return res.status(201).json({ completion });
  }
  catch (error)
  {
    next(error);
  }
}

module.exports = {
  completeWorkout,
  logWeight,
  progress
};
