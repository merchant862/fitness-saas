const { Model } = require("sequelize");

async function aiCoachViewController(req, res, next)
{
    try
    {
        const aiCoachData = {
            currentUser: {
                name: 'Saboor',
                goal: 'Weight Loss',
                level: 'Beginner',
                environment: 'Home'
            },

            summary: {
                totalChats: 12,
                todayQuestions: 3,
                favoriteTopic: 'Nutrition',
                coachMode: 'Fitness Fundamentals'
            },

            suggestedPrompts: [
                'What should I eat after a workout?',
                'Give me a beginner home workout tip.',
                'How much protein should I eat daily?',
                'How do I stay consistent with workouts?'
            ],

            quickTopics: [
                {
                    title: 'Nutrition',
                    description: 'Macros, calories, meal timing, hydration'
                },
                {
                    title: 'Workouts',
                    description: 'Exercise selection, structure, recovery'
                },
                {
                    title: 'Habits',
                    description: 'Consistency, sleep, daily routines'
                }
            ],

            messages: [
                {
                    type: 'assistant',
                    text: 'Hi Saboor. I am your FitAccess AI Coach. Ask me about workouts, nutrition, habits, and staying consistent.'
                },
                {
                    type: 'user',
                    text: 'What is a good post-workout meal for fat loss?'
                },
                {
                    type: 'assistant',
                    text: 'A simple post-workout meal for fat loss can include lean protein and moderate carbs, such as grilled chicken with rice or eggs with oats. Keep it balanced and portion-controlled.'
                }
            ],

            note: 'This coach gives general fitness guidance. For medical concerns or injuries, consult a qualified professional.'
        };

        return res.status(200).render('../views/ai-coach.ejs', { aiCoachData });
    }
    catch (error)
    {
        next(error);
    }
}

module.exports = aiCoachViewController;