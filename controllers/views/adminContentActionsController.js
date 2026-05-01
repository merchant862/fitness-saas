'use strict';

const {
  getAdminMealPlan,
  getAdminWorkoutPlan,
  updateAdminMealPlan,
  updateAdminWorkoutPlan
} = require('../../services/adminService');
const { errorResponse, successResponse, wantsJson } = require('../../utils/httpResponseUtils');

async function editWorkout(req, res, next)
{
  try
  {
    const plan = await getAdminWorkoutPlan(req.params.id);

    if (!plan)
    {
      return res.status(404).send('Workout plan not found');
    }

    return res.status(200).render('../views/admin/workout-plan-edit.ejs', {
      adminData: {
        currentUser: req.user,
        plan,
        message: req.query.updated ? 'Workout plan updated successfully.' : null,
        error: null
      }
    });
  }
  catch (error)
  {
    next(error);
  }
}

async function updateWorkout(req, res, next)
{
  try
  {
    const payload = normalizeWorkoutPayload(req.body);
    const plan = await updateAdminWorkoutPlan(req.params.id, payload);

    if (!plan)
    {
      return errorResponse(req, res, { message: 'Workout plan not found', status: 404 });
    }

    return successResponse(req, res, {
      message: 'Workout plan updated successfully.',
      redirectTo: `/admin/content/workout-plans/${plan.id}`
    });
  }
  catch (error)
  {
    return renderWorkoutError(req, res, next, error);
  }
}

async function editMeal(req, res, next)
{
  try
  {
    const plan = await getAdminMealPlan(req.params.id);

    if (!plan)
    {
      return res.status(404).send('Meal plan not found');
    }

    return res.status(200).render('../views/admin/meal-plan-edit.ejs', {
      adminData: {
        currentUser: req.user,
        plan,
        message: req.query.updated ? 'Meal plan updated successfully.' : null,
        error: null
      }
    });
  }
  catch (error)
  {
    next(error);
  }
}

async function updateMeal(req, res, next)
{
  try
  {
    const payload = normalizeMealPayload(req.body);
    const plan = await updateAdminMealPlan(req.params.id, payload);

    if (!plan)
    {
      return errorResponse(req, res, { message: 'Meal plan not found', status: 404 });
    }

    return successResponse(req, res, {
      message: 'Meal plan updated successfully.',
      redirectTo: `/admin/content/meal-plans/${plan.id}`
    });
  }
  catch (error)
  {
    return renderMealError(req, res, next, error);
  }
}

async function renderWorkoutError(req, res, next, error)
{
  try
  {
    if (wantsJson(req))
    {
      return errorResponse(req, res, { message: error.message });
    }

    const plan = await getAdminWorkoutPlan(req.params.id);

    if (!plan)
    {
      return res.status(404).send('Workout plan not found');
    }

    return res.status(422).render('../views/admin/workout-plan-edit.ejs', {
      adminData: {
        currentUser: req.user,
        plan,
        message: null,
        error: error.message
      }
    });
  }
  catch (renderError)
  {
    next(renderError);
  }
}

async function renderMealError(req, res, next, error)
{
  try
  {
    if (wantsJson(req))
    {
      return errorResponse(req, res, { message: error.message });
    }

    const plan = await getAdminMealPlan(req.params.id);

    if (!plan)
    {
      return res.status(404).send('Meal plan not found');
    }

    return res.status(422).render('../views/admin/meal-plan-edit.ejs', {
      adminData: {
        currentUser: req.user,
        plan,
        message: null,
        error: error.message
      }
    });
  }
  catch (renderError)
  {
    next(renderError);
  }
}

function normalizeWorkoutPayload(body)
{
  return {
    title: requiredText(body.title, 'Title'),
    description: String(body.description || '').trim(),
    durationWeeks: boundedInt(body.durationWeeks, 'Duration weeks', 1, 52),
    sessionsPerWeek: boundedInt(body.sessionsPerWeek, 'Sessions per week', 1, 7),
    tips: jsonArray(body.tips, 'Tips'),
    isActive: body.isActive === 'on'
  };
}

function normalizeMealPayload(body)
{
  return {
    title: requiredText(body.title, 'Title'),
    description: String(body.description || '').trim(),
    durationWeeks: boundedInt(body.durationWeeks, 'Duration weeks', 1, 52),
    dailyCalories: boundedInt(body.dailyCalories, 'Daily calories', 500, 8000),
    macros: jsonObject(body.macros, 'Macros'),
    tips: jsonArray(body.tips, 'Tips'),
    isActive: body.isActive === 'on'
  };
}

function requiredText(value, label)
{
  const text = String(value || '').trim().slice(0, 160);

  if (!text)
  {
    throw new Error(`${label} is required`);
  }

  return text;
}

function boundedInt(value, label, min, max)
{
  const number = Number(value);

  if (!Number.isInteger(number) || number < min || number > max)
  {
    throw new Error(`${label} must be between ${min} and ${max}`);
  }

  return number;
}

function jsonArray(value, label)
{
  const parsed = parseJson(value, label);

  if (!Array.isArray(parsed))
  {
    throw new Error(`${label} must be a JSON array`);
  }

  return parsed;
}

function jsonObject(value, label)
{
  const parsed = parseJson(value, label);

  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object')
  {
    throw new Error(`${label} must be a JSON object`);
  }

  return parsed;
}

function parseJson(value, label)
{
  try
  {
    return JSON.parse(String(value || '').trim());
  }
  catch (error)
  {
    throw new Error(`${label} contains invalid JSON`);
  }
}

module.exports = {
  editMeal,
  editWorkout,
  updateMeal,
  updateWorkout
};
