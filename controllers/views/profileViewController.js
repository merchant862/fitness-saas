'use strict';

const { PaymentMethod, WorkoutCompletion } = require('../../database/models');

async function profileViewController(req, res, next)
{
    try
    {
        const [workoutsCompleted, paymentMethod] = await Promise.all([
            WorkoutCompletion.count({ where: { userId: req.user.id } }),
            PaymentMethod.findOne({
                where: {
                    userId: req.user.id,
                    provider: 'responsecrm',
                    status: 'active'
                },
                order: [['createdAt', 'DESC']]
            })
        ]);
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
            billing: presentPaymentMethod(paymentMethod),
            note: 'Your profile settings help personalize your workouts, meals, and AI guidance.',
            message: req.query.updated ? 'Profile updated successfully.' : null,
            billingMessage: billingMessage(req.query.billing)
        };

        return res.status(200).render('../views/profile.ejs', { profileData });
    }
    catch (error)
    {
        next(error);
    }
}

function presentPaymentMethod(paymentMethod)
{
    if (!paymentMethod)
    {
        return {
            cardLast4: null,
            nextChargeAt: null,
            status: 'Not added'
        };
    }

    return {
        cardLast4: paymentMethod.cardLast4,
        nextChargeAt: paymentMethod.nextChargeAt ? paymentMethod.nextChargeAt.toISOString().slice(0, 10) : null,
        status: label(paymentMethod.status)
    };
}

function billingMessage(value)
{
    if (value === 'updated')
    {
        return {
            type: 'success',
            text: 'Payment method updated successfully.'
        };
    }

    if (value === 'failed')
    {
        return {
            type: 'danger',
            text: 'Payment method could not be updated. Please check the card details and try again.'
        };
    }

    return null;
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
