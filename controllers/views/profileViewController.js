async function profileViewController(req, res, next)
{
    try
    {
        const profileData = {
            currentUser: {
                name: 'Saif',
                email: 'saif@example.com',
                goal: 'Weight Loss',
                level: 'Beginner',
                environment: 'Home'
            },

            profile: {
                age: 25,
                gender: 'Male',
                currentWeight: 78,
                targetWeight: 72,
                workoutDays: 4,
                height: '4 ft 0 in',
                accessStatus: 'Active',
                membership: 'Upsell Access',
                joinedAt: '2026-04-10'
            },

            stats: {
                streakDays: 6,
                workoutsCompleted: 14,
                mealsFollowed: 18
            },

            note: 'Your profile settings help personalize your workouts, meals, and AI guidance.'
        };

        return res.status(200).render('../views/profile.ejs', { profileData });
    }
    catch (error)
    {
        next(error);
    }
}

module.exports = profileViewController;