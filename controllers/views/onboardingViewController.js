async function onboardingViewController(req, res, next)
{
    try
    {
        const onboardingData = {
            currentUser: {
                name: 'Saboor'
            },

            goals: [
                { value: 'weight-loss', label: 'Weight Loss', description: 'Lose fat and stay lean.' },
                { value: 'muscle-gain', label: 'Muscle Gain', description: 'Build muscle and strength.' },
                { value: 'general-fitness', label: 'General Fitness', description: 'Improve health and consistency.' }
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
                goal: 'weight-loss',
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