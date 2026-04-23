async function progressViewController(req, res, next)
{
    try
    {
        const progressData = {
            currentUser: {
                name: 'Saboor',
                goal: 'Weight Loss',
                level: 'Beginner',
                environment: 'Home'
            },

            summary: {
                currentWeight: 78,
                startingWeight: 82,
                targetWeight: 72,
                streakDays: 6,
                workoutsCompleted: 14,
                mealsFollowed: 18
            },

            weeklyProgress: {
                thisWeekChange: '-0.8 kg',
                totalChange: '-4.0 kg',
                completionRate: '82%',
                consistencyScore: '8/10'
            },

            milestones: [
                {
                    title: 'First 5 Workouts',
                    status: 'Completed',
                    description: 'You completed your first 5 workouts.'
                },
                {
                    title: '3 Day Streak',
                    status: 'Completed',
                    description: 'You stayed consistent for 3 days in a row.'
                },
                {
                    title: 'Lose 5 kg',
                    status: 'In Progress',
                    description: 'You are getting close to your next major milestone.'
                }
            ],

            recentLogs: [
                {
                    date: '2026-04-18',
                    weight: '79.2 kg',
                    workout: 'Completed',
                    meals: 'On Track'
                },
                {
                    date: '2026-04-19',
                    weight: '78.9 kg',
                    workout: 'Completed',
                    meals: 'On Track'
                },
                {
                    date: '2026-04-20',
                    weight: '78.7 kg',
                    workout: 'Rest Day',
                    meals: 'On Track'
                },
                {
                    date: '2026-04-21',
                    weight: '78.4 kg',
                    workout: 'Completed',
                    meals: 'Missed 1 Meal'
                },
                {
                    date: '2026-04-22',
                    weight: '78.0 kg',
                    workout: 'Completed',
                    meals: 'On Track'
                }
            ],

            note: 'Progress is not only about the scale. Consistency in workouts, meals, and recovery matters just as much.'
        };

        return res.status(200).render('../views/progress.ejs', { progressData });
    }
    catch (error)
    {
        next(error);
    }
}

module.exports = progressViewController;