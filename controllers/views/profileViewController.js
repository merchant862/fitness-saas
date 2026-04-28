'use strict';

const { WorkoutCompletion } = require('../../database/models');

async function profileViewController(req, res, next)
{
    try
    {
        const workoutsCompleted = await WorkoutCompletion.count({ where: { userId: req.user.id } });
        const currentUser = presentUser(req.user);

        const profileData = {
            currentUser,
            profile: {
                age: req.user.profile?.preferences?.age || '',
                gender: req.user.profile?.preferences?.gender || '',
                currentWeight: req.user.profile?.currentWeight || '',
                targetWeight: req.user.profile?.targetWeight || '',
                workoutDays: req.user.profile?.workoutDays || '',
                height: req.user.profile?.preferences?.height || '',
                accessStatus: req.user.accessExpiresAt && req.user.accessExpiresAt > new Date() ? 'Active' : 'Expired',
                membership: req.user.tags?.includes('upsell_customer') ? 'Upsell Access' : 'Member Access',
                joinedAt: req.user.createdAt ? req.user.createdAt.toISOString().slice(0, 10) : ''
            },
            stats: {
                streakDays: Math.min(workoutsCompleted, 14),
                workoutsCompleted,
                mealsFollowed: 0
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

module.exports = profileViewController;
