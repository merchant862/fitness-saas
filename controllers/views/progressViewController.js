'use strict';

const { WeightLog, WorkoutCompletion } = require('../../database/models');

async function progressViewController(req, res, next)
{
    try
    {
        const [weightLogs, workoutsCompleted] = await Promise.all([
            WeightLog.findAll({ where: { userId: req.user.id }, order: [['loggedAt', 'ASC']], limit: 30 }),
            WorkoutCompletion.count({ where: { userId: req.user.id } })
        ]);

        const firstWeight = weightLogs[0]?.weight || req.user.profile?.currentWeight || 0;
        const lastWeight = weightLogs[weightLogs.length - 1]?.weight || req.user.profile?.currentWeight || 0;
        const targetWeight = req.user.profile?.targetWeight || 0;
        const totalChange = Number(lastWeight) && Number(firstWeight)
            ? `${(Number(lastWeight) - Number(firstWeight)).toFixed(1)} kg`
            : 'Not enough data';

        const progressData = {
            currentUser: presentUser(req.user),
            summary: {
                currentWeight: lastWeight,
                startingWeight: firstWeight,
                targetWeight,
                streakDays: Math.min(workoutsCompleted, 14),
                workoutsCompleted,
                mealsFollowed: 0
            },
            weeklyProgress: {
                thisWeekChange: 'Log more weights to calculate',
                totalChange,
                completionRate: workoutsCompleted ? `${Math.min(workoutsCompleted * 5, 100)}%` : '0%',
                consistencyScore: workoutsCompleted ? `${Math.min(workoutsCompleted, 10)}/10` : '0/10'
            },
            milestones: buildMilestones(workoutsCompleted, firstWeight, lastWeight),
            recentLogs: buildRecentLogs(weightLogs),
            note: 'Progress is not only about the scale. Consistency in workouts, meals, and recovery matters just as much.'
        };

        return res.status(200).render('../views/progress.ejs', { progressData });
    }
    catch (error)
    {
        next(error);
    }
}

function buildMilestones(workoutsCompleted, firstWeight, lastWeight)
{
    const weightChange = Math.abs(Number(lastWeight || 0) - Number(firstWeight || 0));

    return [
        {
            title: 'First 5 Workouts',
            status: workoutsCompleted >= 5 ? 'Completed' : 'In Progress',
            description: 'Complete your first 5 workout sessions.'
        },
        {
            title: '3 Day Streak',
            status: workoutsCompleted >= 3 ? 'Completed' : 'In Progress',
            description: 'Build early momentum with consistent training.'
        },
        {
            title: 'First 2 kg Change',
            status: weightChange >= 2 ? 'Completed' : 'In Progress',
            description: 'Track weight changes through regular check-ins.'
        }
    ];
}

function buildRecentLogs(weightLogs)
{
    if (!weightLogs.length)
    {
        return [{
            date: new Date().toISOString().slice(0, 10),
            weight: 'No weight logged',
            workout: 'Pending',
            meals: 'Pending'
        }];
    }

    return weightLogs.slice(-7).reverse().map((log) =>
    {
        return {
            date: log.loggedAt,
            weight: `${log.weight} kg`,
            workout: 'Tracked separately',
            meals: 'Pending'
        };
    });
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

module.exports = progressViewController;
