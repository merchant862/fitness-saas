async function onboardingViewController(req, res, next)
{
    try
    {
        const onboardingData = {
            currentUser: {
                name: req.user?.name || req.user?.email || 'Member'
            },

            goals: [
                { value: 'weight_loss', label: 'Weight Loss', description: 'Lose fat and stay lean.' },
                { value: 'muscle_gain', label: 'Muscle Gain', description: 'Build muscle and strength.' },
                { value: 'general_fitness', label: 'General Fitness', description: 'Improve health and consistency.' }
            ],

            levels: [
                { value: 'beginner', label: 'Beginner' },
                { value: 'intermediate', label: 'Intermediate' },
                { value: 'advanced', label: 'Advanced' }
            ],

            environments: [
                { value: 'home', label: 'Home' },
                { value: 'gym', label: 'Gym' }
            ],

            defaultValues: {
                goal: req.user?.profile?.goal || 'weight_loss',
                level: 'beginner',
                environment: 'home',
                currentWeight: '78',
                targetWeight: '72',
                workoutDays: '4'
            }
        };

        return res.status(200).render('../views/onboarding.ejs', { onboardingData });
    }
    catch (error)
    {
        next(error);
    }
}

module.exports = onboardingViewController;
