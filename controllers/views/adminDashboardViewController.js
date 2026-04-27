'use strict';

const { getAdminDashboardStats } = require('../../services/adminService');

async function adminDashboardViewController(req, res, next)
{
  try
  {
    const dashboard = await getAdminDashboardStats();

    const adminData = {
      currentUser: req.user,
      stats: dashboard.stats,
      recentEvents: dashboard.recentEvents
    };

    return res.status(200).render('../views/admin/dashboard.ejs', { adminData });
  }
  catch (error)
  {
    next(error);
  }
}

module.exports = adminDashboardViewController;
