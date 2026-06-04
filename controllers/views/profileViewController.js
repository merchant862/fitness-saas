'use strict';

const { Event, MealCompletion, WorkoutCompletion } = require('../../database/models');
const { Op } = require('sequelize');
const { getAvatarType, getProfilePreferences, isProfileComplete } = require('../../utils/profileCompletion');

async function profileViewController(req, res, next)
{
    try
    {
        const [workoutsCompleted, mealCompletions, recentProgressEvents] = await Promise.all([
            WorkoutCompletion.count({ where: { userId: req.user.id } }),
            MealCompletion.count({ where: { userId: req.user.id } }),
            Event.findAll({
                where: {
                    userId: req.user.id,
                    eventType: {
                        [Op.in]: ['weight_logged', 'workout_completed', 'meal_day_completed']
                    }
                },
                attributes: ['createdAt'],
                order: [['createdAt', 'DESC']],
                limit: 50
            }),
        ]);
        const currentUser = presentUser(req.user);
        const preferences = getProfilePreferences(req.user);
        const height = heightParts(preferences);

        const profileData = {
            currentUser,
            profile: {
                age: preferences.age || '',
                gender: preferences.gender || '',
                currentWeight: req.user.profile?.currentWeight || '',
                targetWeight: req.user.profile?.targetWeight || '',
                workoutDays: req.user.profile?.workoutDays || '',
                heightFeet: height.feet,
                heightInches: height.inches,
                heightLabel: height.feet !== '' ? `${height.feet} ft ${height.inches || 0} in` : '',
                accessStatus: req.user.accessExpiresAt && req.user.accessExpiresAt > new Date() ? 'Active' : 'Expired',
                membership: req.user.tags?.includes('upsell_customer') ? 'Upsell Access' : 'Member Access',
                joinedAt: req.user.createdAt ? req.user.createdAt.toISOString().slice(0, 10) : ''
            },
            completion: {
                complete: isProfileComplete(req.user),
                items: [
                    { label: 'Age', done: Boolean(preferences.age) },
                    { label: 'Gender', done: Boolean(preferences.gender) },
                    { label: 'Height', done: height.feet !== '' && height.inches !== '' },
                    { label: 'Goal', done: Boolean(req.user.profile?.goal) },
                    { label: 'Training Level', done: Boolean(req.user.profile?.level) },
                    { label: 'Workout Environment', done: Boolean(req.user.profile?.environment) }
                ],
                missingFields: {
                    age: !preferences.age,
                    gender: !preferences.gender,
                    height: !(height.feet !== '' && height.inches !== ''),
                    goal: !req.user.profile?.goal,
                    level: !req.user.profile?.level,
                    environment: !req.user.profile?.environment,
                    currentWeight: !(req.user.profile?.currentWeight !== null && req.user.profile?.currentWeight !== undefined),
                    targetWeight: !(req.user.profile?.targetWeight !== null && req.user.profile?.targetWeight !== undefined),
                    workoutDays: !(req.user.profile?.workoutDays !== null && req.user.profile?.workoutDays !== undefined)
                }
            },
            stats: {
                streakDays: calculateStreakDays(recentProgressEvents),
                workoutsCompleted,
                mealsFollowed: mealCompletions
            },
            note: 'Your profile settings help personalize your workouts, meals, and AI guidance.',
            message: null
        };

        return res.status(200).render('../views/profile.ejs', { profileData });
    }
    catch (error)
    {
        next(error);
    }
}

function calculateStreakDays(events)
{
    if (!events.length)
    {
        return 0;
    }

    const seen = new Set(events.map((event) => event.createdAt.toISOString().slice(0, 10)));
    let streak = 0;
    const cursor = new Date();

    for (let i = 0; i < 30; i += 1)
    {
        const dayKey = cursor.toISOString().slice(0, 10);
        if (seen.has(dayKey))
        {
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
            continue;
        }

        if (streak > 0)
        {
            break;
        }

        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
}

function presentUser(user)
{
    const preferences = getProfilePreferences(user);

    return {
        name: user.name || user.email?.split('@')[0] || 'Member',
        email: user.email,
        goal: label(user.profile?.goal || 'general_fitness'),
        level: label(user.profile?.level || 'beginner'),
        environment: label(user.profile?.environment || 'home'),
        gender: preferences.gender || null,
        avatarType: getAvatarType(user),
        profileComplete: isProfileComplete(user)
    };
}

function heightParts(preferences)
{
    const heightFeet = toInteger(preferences?.heightFeet ?? preferences?.height_feet);
    const heightInches = toInteger(preferences?.heightInches ?? preferences?.height_inches);

    if (heightFeet !== null || heightInches !== null)
    {
        return {
            feet: heightFeet !== null ? heightFeet : '',
            inches: heightInches !== null ? heightInches : ''
        };
    }

    const legacyHeight = String(preferences?.height || '').trim();
    const match = legacyHeight.match(/^(\d{1,2})\s*(?:ft|feet|')\s*(\d{1,2})?\s*(?:in|inch|inches|")?$/i);

    if (match)
    {
        return {
            feet: toInteger(match[1]) ?? '',
            inches: toInteger(match[2]) ?? ''
        };
    }

    return {
        feet: '',
        inches: ''
    };
}

function toInteger(value)
{
    if (value === undefined || value === null || value === '')
    {
        return null;
    }

    const number = Number(value);
    return Number.isInteger(number) ? number : null;
}

function label(value)
{
    return String(value || '')
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

module.exports = profileViewController;
