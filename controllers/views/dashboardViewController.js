async function dashboardViewController(req, res, next) 
{
    try
    {
        const dashboardData = 
        {
            user: 
            {
                name: 'Saif',
                goal: 'Weight Loss',
                level: 'Beginner',
                environment: 'Home'
            },

            stats: 
            {
                streakDays: 6,
                workoutsCompleted: 14,
                mealsFollowed: 18,
                currentWeight: 78,
                targetWeight: 72
            },

            todayWorkout: 
            {
                title: 'Full Body Fat Burn',
                dayLabel: 'Day 3',
                duration: '25 min',
                focus: 'Bodyweight'
            },

            todayMeals: 
            {
                breakfast: 'Oats with banana and peanut butter',
                lunch: 'Grilled chicken with rice',
                dinner: 'Egg omelette with salad',
                snack: 'Greek yogurt'
            },

            progress: 
            {
                weeklyChange: '-0.8 kg',
                completionRate: '82%'
            },

            aiTip: 'Stay consistent. A short workout done today beats a perfect plan delayed to tomorrow.'
        };

        return res.status(200).render('../views/dashboard.ejs', { dashboardData });
    }
    catch(error)
    {
        next(error);
    }
}

module.exports = dashboardViewController;