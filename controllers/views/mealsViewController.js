'use strict';

const { getMealContent } = require('../../services/contentService');

async function mealsViewController(req, res, next)
{
    try
    {
        const mealsData = await getMealContent(req.user);

        return res.status(200).render('../views/meals.ejs', { mealsData });
    }
    catch (error)
    {
        next(error);
    }
}

module.exports = mealsViewController;
