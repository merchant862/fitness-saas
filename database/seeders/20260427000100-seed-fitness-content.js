'use strict';

const goals = {
  weight_loss: {
    label: 'Fat Loss',
    dailyCalories: 1850,
    macros: { protein: '140g', carbs: '160g', fats: '55g', water: '2.5L' },
    mealFocus: ['High Protein', 'Balanced Meals', 'Lower Carb', 'Fat Loss Meals', 'Lean Recovery', 'Higher Energy', 'Flexible Eating'],
    tips: [
      'Keep protein high in every major meal.',
      'Use vegetables and water to control hunger.',
      'Track weekly progress instead of daily scale swings.'
    ]
  },
  muscle_gain: {
    label: 'Muscle Gain',
    dailyCalories: 2650,
    macros: { protein: '180g', carbs: '300g', fats: '75g', water: '3L' },
    mealFocus: ['Protein Surplus', 'Strength Fuel', 'Carb Timing', 'Recovery Meals', 'High Calorie Clean', 'Balanced Bulk', 'Flexible Eating'],
    tips: [
      'Add protein to every meal and snack.',
      'Use carbs around training for better performance.',
      'Increase portions gradually when weight stalls.'
    ]
  },
  general_fitness: {
    label: 'General Fitness',
    dailyCalories: 2200,
    macros: { protein: '150g', carbs: '230g', fats: '70g', water: '2.7L' },
    mealFocus: ['Balanced Nutrition', 'Energy Support', 'Simple Prep', 'Recovery Meals', 'Colorful Plates', 'Smart Snacks', 'Flexible Eating'],
    tips: [
      'Build meals around protein, produce, and whole foods.',
      'Keep prep simple enough to repeat.',
      'Aim for consistency over strict perfection.'
    ]
  }
};

const levels = {
  beginner: { label: 'Beginner', duration: 25, calories: 220, frequency: 4 },
  intermediate: { label: 'Intermediate', duration: 40, calories: 340, frequency: 5 },
  advanced: { label: 'Advanced', duration: 55, calories: 480, frequency: 6 }
};

const environments = {
  home: 'Home',
  gym: 'Gym'
};

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

module.exports = {
  async up(queryInterface)
  {
    const now = new Date();
    const workoutPlans = [];
    const mealPlans = [];

    Object.keys(goals).forEach((goal) =>
    {
      Object.keys(levels).forEach((level) =>
      {
        Object.keys(environments).forEach((environment) =>
        {
          workoutPlans.push({
            key: `${goal}-${level}-${environment}`,
            goal,
            level,
            environment,
            title: `${levels[level].label} ${goals[goal].label} ${environments[environment]} Plan`,
            description: `A 12-week ${environments[environment].toLowerCase()} plan built for ${goals[goal].label.toLowerCase()} and ${levels[level].label.toLowerCase()} training.`,
            duration_weeks: 12,
            sessions_per_week: levels[level].frequency,
            tips: JSON.stringify([
              'Warm up before every session.',
              'Use controlled reps and pain-free movement.',
              'Progress by adding reps, sets, or load gradually.'
            ]),
            is_active: true,
            created_at: now,
            updated_at: now
          });
        });
      });

      mealPlans.push({
        key: `${goal}-meal-plan`,
        goal,
        title: `4 Week ${goals[goal].label} Meal Plan`,
        description: `Simple meals and shopping lists aligned with ${goals[goal].label.toLowerCase()}.`,
        duration_weeks: 4,
        daily_calories: goals[goal].dailyCalories,
        macros: JSON.stringify(goals[goal].macros),
        tips: JSON.stringify(goals[goal].tips),
        is_active: true,
        created_at: now,
        updated_at: now
      });
    });

    await queryInterface.bulkDelete('workout_sessions', null, {});
    await queryInterface.bulkDelete('workout_plans', null, {});
    await queryInterface.bulkDelete('meal_days', null, {});
    await queryInterface.bulkDelete('meal_plans', null, {});

    await queryInterface.bulkInsert('workout_plans', workoutPlans);
    await queryInterface.bulkInsert('meal_plans', mealPlans);

    const [insertedWorkoutPlans] = await queryInterface.sequelize.query('SELECT id, `key`, goal, level, environment FROM workout_plans');
    const [insertedMealPlans] = await queryInterface.sequelize.query('SELECT id, `key`, goal FROM meal_plans');

    const workoutSessions = [];
    insertedWorkoutPlans.forEach((plan) =>
    {
      const level = levels[plan.level];

      for (let week = 1; week <= 12; week += 1)
      {
        dayNames.forEach((dayName, index) =>
        {
          const dayOfWeek = index + 1;
          const isRest = dayOfWeek > level.frequency;
          const focus = sessionFocus(plan.goal, dayOfWeek, isRest);

          workoutSessions.push({
            workout_plan_id: plan.id,
            key: `${plan.key}-w${week}-d${dayOfWeek}`,
            week_number: week,
            day_of_week: dayOfWeek,
            day_label: `Week ${week} - ${dayName}`,
            title: isRest ? 'Recovery Day' : `${focus} Session`,
            duration_minutes: isRest ? 15 : level.duration + Math.min(week - 1, 6),
            calories: isRest ? 80 : level.calories + (week * 8),
            focus,
            exercises: JSON.stringify(buildExercises(plan.environment, plan.level, plan.goal, isRest)),
            created_at: now,
            updated_at: now
          });
        });
      }
    });

    const mealDays = [];
    insertedMealPlans.forEach((plan) =>
    {
      const goal = goals[plan.goal];

      for (let week = 1; week <= 4; week += 1)
      {
        dayNames.forEach((dayName, index) =>
        {
          const dayOfWeek = index + 1;

          mealDays.push({
            meal_plan_id: plan.id,
            key: `${plan.key}-w${week}-d${dayOfWeek}`,
            week_number: week,
            day_of_week: dayOfWeek,
            day_label: `Week ${week} - ${dayName}`,
            focus: goal.mealFocus[index],
            meals: JSON.stringify(buildMeals(plan.goal, dayOfWeek)),
            shopping_list: JSON.stringify(buildShoppingList(plan.goal, dayOfWeek)),
            created_at: now,
            updated_at: now
          });
        });
      }
    });

    await queryInterface.bulkInsert('workout_sessions', workoutSessions);
    await queryInterface.bulkInsert('meal_days', mealDays);
  },

  async down(queryInterface)
  {
    await queryInterface.bulkDelete('workout_sessions', null, {});
    await queryInterface.bulkDelete('workout_plans', null, {});
    await queryInterface.bulkDelete('meal_days', null, {});
    await queryInterface.bulkDelete('meal_plans', null, {});
  }
};

function sessionFocus(goal, dayOfWeek, isRest)
{
  if (isRest)
  {
    return 'Mobility and Recovery';
  }

  const map = {
    weight_loss: ['Full Body Burn', 'Lower Body Focus', 'Core and Cardio', 'Upper Body Burn', 'Conditioning', 'Metabolic Circuit'],
    muscle_gain: ['Push Strength', 'Pull Strength', 'Leg Hypertrophy', 'Upper Volume', 'Posterior Chain', 'Arms and Shoulders'],
    general_fitness: ['Full Body Strength', 'Cardio Base', 'Mobility Strength', 'Core Stability', 'Athletic Conditioning', 'Recovery Flow']
  };

  return map[goal][(dayOfWeek - 1) % map[goal].length];
}

function buildExercises(environment, level, goal, isRest)
{
  if (isRest)
  {
    return [
      'Easy walk - 10 minutes',
      'Hip mobility - 2 rounds',
      'Shoulder circles - 2 rounds',
      'Breathing reset - 3 minutes'
    ];
  }

  if (environment === 'gym')
  {
    return [
      `${level === 'beginner' ? 'Goblet Squat' : 'Barbell Squat'} - 3 sets`,
      `${goal === 'muscle_gain' ? 'Bench Press' : 'Incline Dumbbell Press'} - 3 sets`,
      'Lat Pulldown - 3 sets',
      'Romanian Deadlift - 3 sets',
      'Plank - 3 rounds'
    ];
  }

  return [
    'Bodyweight Squats - 4 sets',
    'Push Ups - 3 sets',
    'Reverse Lunges - 3 sets',
    'Mountain Climbers - 3 rounds',
    'Plank - 3 rounds'
  ];
}

function buildMeals(goal, dayOfWeek)
{
  const variants = {
    weight_loss: {
      breakfast: ['Protein Oats', '380 kcal', ['Rolled oats', 'Greek yogurt', 'Berries']],
      lunch: ['Grilled Chicken Bowl', '520 kcal', ['Chicken breast', 'Rice', 'Mixed vegetables']],
      dinner: ['Egg Omelette Salad', '430 kcal', ['Eggs', 'Tomato cucumber salad', 'Whole wheat toast']],
      snack: ['Greek Yogurt Cup', '180 kcal', ['Greek yogurt', 'Berries']]
    },
    muscle_gain: {
      breakfast: ['Protein Oats and Banana', '620 kcal', ['Oats', 'Banana', 'Protein powder', 'Peanut butter']],
      lunch: ['Beef Rice Bowl', '760 kcal', ['Lean beef', 'Rice', 'Avocado', 'Vegetables']],
      dinner: ['Salmon Potatoes', '710 kcal', ['Salmon', 'Potatoes', 'Olive oil salad']],
      snack: ['Peanut Butter Toast', '330 kcal', ['Whole wheat toast', 'Peanut butter', 'Milk']]
    },
    general_fitness: {
      breakfast: ['Eggs and Toast', '480 kcal', ['Eggs', 'Whole wheat toast', 'Fruit']],
      lunch: ['Turkey Wrap', '610 kcal', ['Turkey', 'Whole wheat wrap', 'Salad vegetables']],
      dinner: ['Chicken Pasta', '650 kcal', ['Chicken', 'Pasta', 'Tomato sauce', 'Vegetables']],
      snack: ['Fruit and Nuts', '240 kcal', ['Apple', 'Mixed nuts']]
    }
  };

  const meals = variants[goal];

  return {
    breakfast: mealObject(meals.breakfast, '8:00 AM'),
    lunch: mealObject(meals.lunch, '1:00 PM'),
    dinner: mealObject(meals.dinner, '8:00 PM'),
    snack: mealObject(meals.snack, '5:00 PM'),
    rotationDay: dayOfWeek
  };
}

function mealObject(values, time)
{
  return {
    title: values[0],
    calories: values[1],
    time,
    items: values[2]
  };
}

function buildShoppingList(goal)
{
  const lists = {
    weight_loss: ['Chicken breast', 'Eggs', 'Rolled oats', 'Rice', 'Greek yogurt', 'Berries', 'Tomatoes', 'Cucumbers', 'Mixed vegetables'],
    muscle_gain: ['Lean beef', 'Salmon', 'Oats', 'Bananas', 'Rice', 'Potatoes', 'Peanut butter', 'Milk', 'Avocado'],
    general_fitness: ['Eggs', 'Turkey', 'Chicken', 'Whole wheat wraps', 'Pasta', 'Fruit', 'Mixed nuts', 'Salad vegetables']
  };

  return lists[goal];
}
