'use strict';

const { AiMessage } = require('../../database/models');

async function aiCoachViewController(req, res, next)
{
    try
    {
        const messages = await AiMessage.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'ASC']],
            limit: 20
        });

        const today = new Date().toISOString().slice(0, 10);
        const todayQuestions = messages.filter((message) =>
        {
            return message.role === 'user' && message.createdAt.toISOString().slice(0, 10) === today;
        }).length;

        const aiCoachData = {
            currentUser: presentUser(req.user),
            summary: {
                totalChats: messages.filter((message) => message.role === 'user').length,
                todayQuestions,
                favoriteTopic: favoriteTopic(messages),
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
            messages: presentMessages(messages, req.user),
            note: 'This coach gives general fitness guidance. For medical concerns or injuries, consult a qualified professional.'
        };

        return res.status(200).render('../views/ai-coach.ejs', { aiCoachData });
    }
    catch (error)
    {
        next(error);
    }
}

function presentMessages(messages, user)
{
    if (!messages.length)
    {
        return [{
            type: 'assistant',
            text: `Hi ${user.name || user.email?.split('@')[0] || 'there'}. I am your FitAccess AI Coach. Ask me about workouts, nutrition, habits, and staying consistent.`
        }];
    }

    return messages.map((message) =>
    {
        return {
            type: message.role,
            text: message.content
        };
    });
}

function favoriteTopic(messages)
{
    const text = messages.map((message) => message.content).join(' ');

    if (/meal|protein|calorie|diet|nutrition/i.test(text))
    {
        return 'Nutrition';
    }

    if (/workout|exercise|form|sets|reps/i.test(text))
    {
        return 'Workouts';
    }

    return 'Habits';
}

function presentUser(user)
{
    return {
        name: user.name || user.email?.split('@')[0] || 'Member',
        email: user.email,
        goal: label(user.profile?.goal || 'general_fitness'),
        level: label(user.profile?.level || 'beginner'),
        environment: label(user.profile?.environment || 'home')
    };
}

function label(value)
{
    return String(value || '')
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

module.exports = aiCoachViewController;
