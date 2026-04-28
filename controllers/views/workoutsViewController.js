'use strict';

const { getWorkoutContent } = require('../../services/contentService');

async function workoutsViewController(req, res, next)
{
    try
    {
        const workoutsData = await getWorkoutContent(req.user);

        return res.status(200).render('../views/workouts.ejs', { workoutsData });
    }
    catch (error)
    {
        next(error);
    }
}

module.exports = workoutsViewController;
