'use strict';

const { Op } = require('sequelize');
const {
  Event,
  MealDay,
  MealPlan,
  WorkoutPlan,
  WorkoutSession
} = require('../database/models');

const activeRequests = new Set();

async function generateCoachReply(req, message)
{
  const user = req.user;
  const cleanMessage = normalizeMessage(message);
  const safetyBlock = validateMessage(cleanMessage);

  if (safetyBlock)
  {
    return safetyBlock;
  }

  await enforceDailyQuota(user.id);
  enterUserRequest(user.id);

  try
  {
    const context = await getCoachContext(user);
    return buildPatternReply(context, cleanMessage);
  }
  finally
  {
    activeRequests.delete(user.id);
  }
}

function normalizeMessage(message)
{
  return String(message || '')
    .replace(/[<>`{}[\]\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

function validateMessage(message)
{
  if (!message)
  {
    return 'Ask me about your workout, meals, exercises, macros, hydration, or consistency.';
  }

  if (message.length < 3)
  {
    return 'Send a little more detail so I can point you to the right workout or meal.';
  }

  const injectionPattern = /(ignore|bypass|override|forget|reveal|show|print|leak|developer|system prompt|instructions|jailbreak|roleplay|act as|api key|secret|token|password|database|sql|admin|source code|environment|env)/i;

  if (injectionPattern.test(message))
  {
    return 'I can only help with your FitAccess workouts, meals, exercises, macros, hydration, and consistency.';
  }

  const allowedTopicPattern = /(workout|exercise|form|sets?|reps?|gym|home|training|cardio|strength|stretch|mobility|recovery|meal|eat|food|protein|carb|fat|calorie|macro|diet|recipe|breakfast|lunch|dinner|snack|water|hydration|weight|goal|habit|streak|consistency|sleep|plan|today|tomorrow)/i;

  if (!allowedTopicPattern.test(message))
  {
    return 'I stay focused on your fitness plan. Ask me about today’s workout, meals, exercises, macros, hydration, or consistency.';
  }

  return null;
}

async function enforceDailyQuota(userId)
{
  const dailyLimit = Number(process.env.COACH_CHAT_DAILY_LIMIT || 80);

  if (!dailyLimit)
  {
    return;
  }

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const todayUsage = await Event.count({
    where: {
      userId,
      eventType: { [Op.in]: ['coach_chat_used', 'ai_chat_used'] },
      createdAt: { [Op.gte]: dayStart }
    }
  });

  if (todayUsage >= dailyLimit)
  {
    const error = new Error('Daily coach chat limit reached. Please come back tomorrow.');
    error.status = 429;
    throw error;
  }
}

function enterUserRequest(userId)
{
  if (activeRequests.has(userId))
  {
    const error = new Error('Your previous coach message is still processing.');
    error.status = 429;
    throw error;
  }

  activeRequests.add(userId);
}

async function getCoachContext(user)
{
  const profile = {
    goal: user.profile?.goal || 'general_fitness',
    level: user.profile?.level || 'beginner',
    environment: user.profile?.environment || 'home',
    workoutDays: user.profile?.workoutDays || 4,
    currentWeight: user.profile?.currentWeight || null,
    targetWeight: user.profile?.targetWeight || null
  };

  const [workoutPlan, mealPlan] = await Promise.all([
    WorkoutPlan.findOne({
      where: {
        goal: profile.goal,
        level: profile.level,
        environment: profile.environment,
        isActive: true
      },
      include: [{
        model: WorkoutSession,
        as: 'sessions'
      }],
      order: [[{ model: WorkoutSession, as: 'sessions' }, 'weekNumber', 'ASC'], [{ model: WorkoutSession, as: 'sessions' }, 'dayOfWeek', 'ASC']]
    }),
    MealPlan.findOne({
      where: {
        goal: profile.goal,
        isActive: true
      },
      include: [{
        model: MealDay,
        as: 'days'
      }],
      order: [[{ model: MealDay, as: 'days' }, 'weekNumber', 'ASC'], [{ model: MealDay, as: 'days' }, 'dayOfWeek', 'ASC']]
    })
  ]);

  const todayWorkout = findTodayWorkout(workoutPlan);
  const todayMealDay = findTodayMealDay(mealPlan);

  return {
    profile,
    goalLabel: label(profile.goal),
    levelLabel: label(profile.level),
    environmentLabel: label(profile.environment),
    workout: presentWorkout(todayWorkout, workoutPlan),
    meals: presentMeals(todayMealDay, mealPlan)
  };
}

function buildPatternReply(context, message)
{
  if (/meal|eat|food|protein|carb|fat|calorie|macro|diet|recipe|breakfast|lunch|dinner|snack/i.test(message))
  {
    return mealReply(context);
  }

  if (/form|exercise|sets?|reps?|workout|training|gym|home|cardio|strength|stretch|mobility|recovery/i.test(message))
  {
    return workoutReply(context, message);
  }

  if (/weight|goal|progress|streak|habit|consistency|sleep|water|hydration/i.test(message))
  {
    return habitReply(context);
  }

  return `For your ${context.goalLabel} plan, keep today simple: complete ${context.workout.title}, follow your planned meals, and drink water with each meal.`;
}

function mealReply(context)
{
  const meals = context.meals;
  const macros = meals.macros;
  const macroText = macros.protein
    ? ` Your current macro target is about ${macros.protein} protein, ${macros.carbs || 'balanced carbs'}, and ${macros.fats || 'healthy fats'}.`
    : '';

  return [
    `For ${context.goalLabel}, use today’s meal plan as the base: ${meals.breakfast}, ${meals.lunch}, ${meals.dinner}, and ${meals.snack}.`,
    `${macroText}Keep each meal protein-first, add vegetables or fruit, and adjust portions based on weekly progress.`
  ].join(' ');
}

function workoutReply(context, message)
{
  const exercise = context.workout.exercises[0];
  const exerciseText = exercise
    ? ` Start with ${exercise.name || exercise.title || 'the first exercise'} and keep the reps controlled.`
    : '';

  if (/form/i.test(message))
  {
    return `${exerciseText || 'For form today,'} use a steady tempo, full pain-free range of motion, and stop the set when technique breaks. Keep 1-2 reps in reserve.`;
  }

  return `Today’s ${context.environmentLabel} workout is ${context.workout.title} (${context.workout.duration}) with a ${context.workout.focus} focus.${exerciseText} Stay controlled and log the workout when done.`;
}

function habitReply(context)
{
  const weightText = context.profile.currentWeight && context.profile.targetWeight
    ? ` You are tracking from ${context.profile.currentWeight}kg toward ${context.profile.targetWeight}kg.`
    : '';

  return `Your next win is consistency: finish ${context.workout.title}, follow your planned meals, and keep hydration steady.${weightText} Review progress weekly, not after one meal or one workout.`;
}

function findTodayWorkout(plan)
{
  const sessions = plan?.sessions || [];
  const week = currentWeek(plan?.durationWeeks || 12);
  const day = currentDayOfWeek();

  return sessions.find((session) => session.weekNumber === week && session.dayOfWeek === day) || sessions[0];
}

function findTodayMealDay(plan)
{
  const days = plan?.days || [];
  const week = currentWeek(plan?.durationWeeks || 4);
  const day = currentDayOfWeek();

  return days.find((mealDay) => mealDay.weekNumber === week && mealDay.dayOfWeek === day) || days[0];
}

function presentWorkout(session, plan)
{
  return {
    plan: plan?.title || 'Starter Fitness Plan',
    title: session?.title || 'Starter Movement Session',
    duration: session?.durationMinutes ? `${session.durationMinutes} min` : '25 min',
    focus: session?.focus || 'Full Body',
    exercises: asJson(session?.exercises, []).slice(0, 5)
  };
}

function presentMeals(mealDay, plan)
{
  const meals = asJson(mealDay?.meals, {});

  return {
    plan: plan?.title || 'Starter Meal Plan',
    macros: asJson(plan?.macros, {}),
    breakfast: meals.breakfast?.title || 'Balanced Breakfast',
    lunch: meals.lunch?.title || 'Balanced Lunch',
    dinner: meals.dinner?.title || 'Balanced Dinner',
    snack: meals.snack?.title || 'Smart Snack'
  };
}

function currentWeek(durationWeeks)
{
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const days = Math.floor((Date.now() - yearStart.getTime()) / 86400000);

  return (days % durationWeeks) + 1;
}

function currentDayOfWeek()
{
  const day = new Date().getDay();

  return day === 0 ? 7 : day;
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

function label(value)
{
  return String(value || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

module.exports = {
  generateCoachReply
};
