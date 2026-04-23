async function workoutsViewController(req, res, next)
{
    try
    {
        const workoutsData = {
            currentUser: {
                name: 'Saboor',
                goal: 'Weight Loss',
                level: 'Beginner',
                environment: 'Home'
            },

            summary: {
                activePlan: '12 Week Fat Loss Plan',
                currentWeek: 3,
                completedSessions: 14,
                totalSessions: 36
            },

            plans: [
                {
                    id: 1,
                    title: 'Beginner Fat Loss',
                    level: 'Beginner',
                    environment: 'Home',
                    duration: '25 min',
                    frequency: '4 days / week',
                    status: 'Active'
                },
                {
                    id: 2,
                    title: 'Strength Builder',
                    level: 'Intermediate',
                    environment: 'Gym',
                    duration: '45 min',
                    frequency: '5 days / week',
                    status: 'Locked'
                },
                {
                    id: 3,
                    title: 'Lean Muscle Routine',
                    level: 'Advanced',
                    environment: 'Gym',
                    duration: '60 min',
                    frequency: '6 days / week',
                    status: 'Locked'
                }
            ],

            todayWorkout: {
                title: 'Full Body Fat Burn',
                dayLabel: 'Day 3',
                duration: '25 min',
                calories: '220 kcal',
                focus: 'Bodyweight + Core',
                exercises: [
                    'Jumping Jacks - 3 sets',
                    'Bodyweight Squats - 4 sets',
                    'Push Ups - 3 sets',
                    'Mountain Climbers - 3 sets',
                    'Plank - 3 rounds'
                ]
            },

            weeklySchedule: [
                { day: 'Monday', workout: 'Upper Body Burn', status: 'Completed' },
                { day: 'Tuesday', workout: 'Lower Body Focus', status: 'Completed' },
                { day: 'Wednesday', workout: 'Active Recovery', status: 'Rest' },
                { day: 'Thursday', workout: 'Full Body Fat Burn', status: 'Today' },
                { day: 'Friday', workout: 'Core + Cardio', status: 'Upcoming' },
                { day: 'Saturday', workout: 'Mobility Session', status: 'Upcoming' },
                { day: 'Sunday', workout: 'Rest Day', status: 'Rest' }
            ],

            tips: [
                'Warm up for 5 minutes before every session.',
                'Focus on form before speed.',
                'Drink water before and after training.'
            ]
        };

        return res.status(200).render('../views/workouts.ejs', { workoutsData });
    }
    catch (error)
    {
        next(error);
    }
}

module.exports = workoutsViewController; 