'use strict';

const {
  AiMessage,
  MealDay,
  MealPlan,
  WeightLog,
  WorkoutCompletion,
  WorkoutPlan,
  WorkoutSession
} = require('../database/models');

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

async function getDashboardContent(user)
{
  const [workoutData, mealData, progressData] = await Promise.all([
    getWorkoutContent(user),
    getMealContent(user),
    getProgressSummary(user)
  ]);

  return {
    user: presentUser(user),
    stats: {
      streakDays: progressData.streakDays,
      workoutsCompleted: progressData.workoutsCompleted,
      mealsFollowed: progressData.mealsFollowed,
      currentWeight: progressData.currentWeight,
      targetWeight: progressData.targetWeight
    },
    todayWorkout: presentWorkoutSession(workoutData.todayWorkout),
    todayMeals: {
      breakfast: mealData.todayMeals.breakfast.title,
      lunch: mealData.todayMeals.lunch.title,
      dinner: mealData.todayMeals.dinner.title,
      snack: mealData.todayMeals.snack.title
    },
    progress: {
      weeklyChange: progressData.weeklyChange,
      completionRate: workoutData.summary.completionRate
    },
    coachTip: buildDailyTip(user.profile?.goal)
  };
}

async function getWorkoutContent(user)
{
  const profile = profileValues(user);
  const plan = await findWorkoutPlan(profile);
  const sessions = plan?.sessions || [];
  const weekNumber = currentWeek(plan?.durationWeeks || 12);
  const dayOfWeek = currentDayOfWeek();
  const todayWorkout = findSession(sessions, weekNumber, dayOfWeek) || sessions[0];
  const completedSessions = await WorkoutCompletion.count({ where: { userId: user.id } });
  const totalSessions = sessions.length || ((plan?.durationWeeks || 12) * (plan?.sessionsPerWeek || 4));

  return {
    currentUser: presentUser(user),
    summary: {
      activePlan: plan?.title || 'Starter Fitness Plan',
      currentWeek: weekNumber,
      completedSessions,
      totalSessions,
      completionRate: `${Math.min(100, Math.round((completedSessions / Math.max(totalSessions, 1)) * 100))}%`
    },
    plans: await listWorkoutPlans(profile),
    todayWorkout: presentWorkoutSession(todayWorkout),
    weeklySchedule: buildWorkoutSchedule(sessions, weekNumber, dayOfWeek),
    tips: asJson(plan?.tips, [])
  };
}

async function getMealContent(user)
{
  const profile = profileValues(user);
  const plan = await findMealPlan(profile);
  const days = plan?.days || [];
  const weekNumber = currentWeek(plan?.durationWeeks || 4);
  const dayOfWeek = currentDayOfWeek();
  const todayMealDay = findMealDay(days, weekNumber, dayOfWeek) || days[0];

  return {
    currentUser: presentUser(user),
    summary: {
      activePlan: plan?.title || 'Starter Meal Plan',
      currentWeek: weekNumber,
      mealsFollowed: 0,
      dailyCalories: plan?.dailyCalories || 2200
    },
    macros: asJson(plan?.macros, {}),
    todayMeals: presentMealCards(todayMealDay),
    shoppingList: asJson(todayMealDay?.shoppingList, []),
    weeklyPlan: buildMealSchedule(days, weekNumber, dayOfWeek),
    tips: asJson(plan?.tips, [])
  };
}

async function listWorkouts(user = null)
{
  if (!user)
  {
    return WorkoutPlan.findAll({
      where: { isActive: true },
      include: [{ model: WorkoutSession, as: 'sessions' }],
      order: [['goal', 'ASC'], ['level', 'ASC'], ['environment', 'ASC']]
    });
  }

  return getWorkoutContent(user);
}

async function listMeals(user = null)
{
  if (!user)
  {
    return MealPlan.findAll({
      where: { isActive: true },
      include: [{ model: MealDay, as: 'days' }],
      order: [['goal', 'ASC']]
    });
  }

  return getMealContent(user);
}

async function saveCoachConversation(userId, message, reply)
{
  await AiMessage.bulkCreate([
    { userId, role: 'user', content: message },
    { userId, role: 'assistant', content: reply }
  ]);
}

async function findWorkoutPlan(profile)
{
  return WorkoutPlan.findOne({
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
  });
}

async function findMealPlan(profile)
{
  return MealPlan.findOne({
    where: {
      goal: profile.goal,
      isActive: true
    },
    include: [{
      model: MealDay,
      as: 'days'
    }],
    order: [[{ model: MealDay, as: 'days' }, 'weekNumber', 'ASC'], [{ model: MealDay, as: 'days' }, 'dayOfWeek', 'ASC']]
  });
}

async function listWorkoutPlans(profile)
{
  const plans = await WorkoutPlan.findAll({
    where: { isActive: true },
    order: [['goal', 'ASC'], ['level', 'ASC'], ['environment', 'ASC']]
  });

  return plans.map((plan) =>
  {
    const active = plan.goal === profile.goal && plan.level === profile.level && plan.environment === profile.environment;

    return {
      id: plan.id,
      title: plan.title,
      level: label(plan.level),
      environment: label(plan.environment),
      duration: `${plan.durationWeeks} weeks`,
      frequency: `${plan.sessionsPerWeek} days / week`,
      status: active ? 'Active' : 'Available'
    };
  });
}

async function getProgressSummary(user)
{
  const [workoutsCompleted, latestWeight] = await Promise.all([
    WorkoutCompletion.count({ where: { userId: user.id } }),
    WeightLog.findOne({ where: { userId: user.id }, order: [['loggedAt', 'DESC']] })
  ]);

  const currentWeight = latestWeight?.weight || user.profile?.currentWeight || 0;
  const targetWeight = user.profile?.targetWeight || 0;

  return {
    streakDays: workoutsCompleted ? Math.min(workoutsCompleted, 14) : 0,
    workoutsCompleted,
    mealsFollowed: 0,
    currentWeight,
    targetWeight,
    weeklyChange: 'Not enough data yet'
  };
}

function buildWorkoutSchedule(sessions, weekNumber, today)
{
  return dayNames.map((day, index) =>
  {
    const dayOfWeek = index + 1;
    const session = findSession(sessions, weekNumber, dayOfWeek);
    const isRest = session?.focus === 'Mobility and Recovery';

    return {
      day,
      workout: session?.title || 'Recovery Day',
      status: dayOfWeek === today ? 'Today' : (isRest ? 'Rest' : 'Upcoming')
    };
  });
}

function buildMealSchedule(days, weekNumber, today)
{
  return dayNames.map((day, index) =>
  {
    const dayOfWeek = index + 1;
    const mealDay = findMealDay(days, weekNumber, dayOfWeek);

    return {
      day,
      focus: mealDay?.focus || 'Balanced Meals',
      status: dayOfWeek === today ? 'Today' : 'Upcoming'
    };
  });
}

function presentUser(user)
{
  const profile = profileValues(user);

  return {
    name: user.name || user.email?.split('@')[0] || 'Member',
    email: user.email,
    goal: label(profile.goal),
    level: label(profile.level),
    environment: label(profile.environment)
  };
}

function presentWorkoutSession(session)
{
  if (!session)
  {
    return {
      id: null,
      title: 'Starter Movement Session',
      dayLabel: 'Today',
      duration: '25 min',
      calories: '200 kcal',
      focus: 'Full Body',
      exercises: []
    };
  }

  return {
    id: session.key,
    title: session.title,
    dayLabel: session.dayLabel,
    duration: `${session.durationMinutes} min`,
    calories: `${session.calories || 0} kcal`,
    focus: session.focus,
    exercises: asJson(session.exercises, [])
  };
}

function presentMealCards(mealDay)
{
  const meals = asJson(mealDay?.meals, {});

  return {
    breakfast: meals.breakfast || emptyMeal('Breakfast'),
    lunch: meals.lunch || emptyMeal('Lunch'),
    dinner: meals.dinner || emptyMeal('Dinner'),
    snack: meals.snack || emptyMeal('Snack')
  };
}

function presentDashboardMeals(mealDay)
{
  const meals = presentMealCards(mealDay);

  return {
    breakfast: meals.breakfast.title,
    lunch: meals.lunch.title,
    dinner: meals.dinner.title,
    snack: meals.snack.title
  };
}

function emptyMeal(title)
{
  return {
    title,
    calories: '0 kcal',
    time: '',
    items: []
  };
}

function findSession(sessions, weekNumber, dayOfWeek)
{
  return sessions.find((session) => session.weekNumber === weekNumber && session.dayOfWeek === dayOfWeek);
}

function findMealDay(days, weekNumber, dayOfWeek)
{
  return days.find((day) => day.weekNumber === weekNumber && day.dayOfWeek === dayOfWeek);
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

function profileValues(user)
{
  return {
    goal: user.profile?.goal || 'general_fitness',
    level: user.profile?.level || 'beginner',
    environment: user.profile?.environment || 'home'
  };
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

function buildDailyTip(goal)
{
  const tips = {
    weight_loss: 'Win the next meal and the next workout. Small controlled choices compound quickly.',
    muscle_gain: 'Train hard, recover well, and keep protein consistent across the day.',
    general_fitness: 'Keep today simple: move, hydrate, eat balanced meals, and sleep on time.'
  };

  return tips[goal] || tips.general_fitness;
}

module.exports = {
  getDashboardContent,
  getMealContent,
  getWorkoutContent,
  listMeals,
  listWorkouts,
  saveCoachConversation
};
