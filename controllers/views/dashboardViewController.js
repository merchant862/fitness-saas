'use strict';

const { getDashboardContent } = require('../../services/contentService');

async function dashboardViewController(req, res, next)
{
    try
    {
        const dashboardData = await getDashboardContent(req.user);

        return res.status(200).render('../views/dashboard.ejs', { dashboardData });
    }
    catch(error)
    {
        next(error);
    }
}

module.exports = dashboardViewController;
