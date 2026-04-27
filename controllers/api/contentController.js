'use strict';

const { trackEvent } = require('../../services/eventService');
const { getDashboardContent, listMeals, listWorkouts, saveAiConversation } = require('../../services/contentService');

async function dashboard(req, res)
{
  return res.status(200).json({
    ...getDashboardContent(req.user)
  });
}

async function workoutIndex(req, res)
{
  return res.status(200).json({ workouts: listWorkouts() });
}

async function mealIndex(req, res)
{
  return res.status(200).json({ meals: listMeals() });
}

async function aiChat(req, res, next)
{
  try
  {
    const message = String(req.body.message || '').trim().slice(0, 2000);

    if (!message)
    {
      return res.status(422).json({ error: 'Message is required' });
    }

    const reply = buildFitnessReply(req.user.profile?.goal, message);
    await saveAiConversation(req.user.id, message, reply);
    await trackEvent(req, 'ai_chat_used', { length: message.length }, req.user.id);

    return res.status(200).json({ reply });
  }
  catch (error)
  {
    next(error);
  }
}

function buildFitnessReply(goal, message)
{
  const goalLabel = goal ? goal.replace('_', ' ') : 'fitness';

  if (/meal|protein|calorie|diet/i.test(message))
  {
    return `For ${goalLabel}, keep meals simple: lean protein, high-fiber carbs, vegetables, and enough water. Adjust portions based on weekly progress.`;
  }

  if (/form|exercise|workout/i.test(message))
  {
    return 'Prioritize controlled reps, full range of motion, and pain-free movement. Stop the set when form breaks.';
  }

  return 'Stay consistent today: finish the next planned workout or meal first, then review progress at the end of the week.';
}

module.exports = {
  aiChat,
  dashboard,
  mealIndex,
  workoutIndex
};
