'use strict';

const { trackEvent } = require('../../services/eventService');
const { getDashboardContent, listMeals, listWorkouts, saveAiConversation } = require('../../services/contentService');
const { generateCoachReply } = require('../../services/aiCoachService');

async function dashboard(req, res, next)
{
  try
  {
    return res.status(200).json(await getDashboardContent(req.user));
  }
  catch (error)
  {
    next(error);
  }
}

async function workoutIndex(req, res, next)
{
  try
  {
    return res.status(200).json(await listWorkouts(req.user));
  }
  catch (error)
  {
    next(error);
  }
}

async function mealIndex(req, res, next)
{
  try
  {
    return res.status(200).json(await listMeals(req.user));
  }
  catch (error)
  {
    next(error);
  }
}

async function aiChat(req, res, next)
{
  try
  {
    const message = String(req.body.message || '').trim().slice(0, 800);

    if (!message)
    {
      return res.status(422).json({ error: 'Message is required' });
    }

    const reply = await generateCoachReply(req, message);
    await saveAiConversation(req.user.id, message, reply);
    await trackEvent(req, 'ai_chat_used', { length: message.length }, req.user.id);

    return res.status(200).json({ reply });
  }
  catch (error)
  {
    next(error);
  }
}

module.exports = {
  aiChat,
  dashboard,
  mealIndex,
  workoutIndex
};
