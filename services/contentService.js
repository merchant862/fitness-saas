'use strict';

const { AiMessage } = require('../database/models');

const workouts = [
  { id: 'beginner-home-1', level: 'beginner', environment: 'home', title: 'Full Body Starter', duration: 25 },
  { id: 'intermediate-home-1', level: 'intermediate', environment: 'home', title: 'Bodyweight Strength', duration: 35 },
  { id: 'advanced-gym-1', level: 'advanced', environment: 'gym', title: 'Push Pull Power', duration: 50 }
];

const meals = [
  { id: 'weight-loss-day-1', goal: 'weight_loss', breakfast: 'Oats with berries', lunch: 'Chicken salad bowl', dinner: 'Egg omelette', snack: 'Greek yogurt' },
  { id: 'muscle-gain-day-1', goal: 'muscle_gain', breakfast: 'Protein oats', lunch: 'Beef rice bowl', dinner: 'Salmon potatoes', snack: 'Peanut butter toast' },
  { id: 'general-day-1', goal: 'general_fitness', breakfast: 'Eggs and toast', lunch: 'Turkey wrap', dinner: 'Chicken pasta', snack: 'Fruit bowl' }
];

function getDashboardContent(user)
{
  return {
    user,
    todayWorkout: workouts[0],
    todayMeals: meals[0],
    aiTip: 'Small daily wins compound faster than occasional perfect days.'
  };
}

function listWorkouts()
{
  return workouts;
}

function listMeals()
{
  return meals;
}

async function saveAiConversation(userId, message, reply)
{
  await AiMessage.bulkCreate([
    { userId, role: 'user', content: message },
    { userId, role: 'assistant', content: reply }
  ]);
}

module.exports = {
  getDashboardContent,
  listMeals,
  listWorkouts,
  saveAiConversation
};
