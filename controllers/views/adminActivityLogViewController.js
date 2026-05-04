'use strict';

const { listAdminAccountActivity } = require('../../services/activityService');

async function adminActivityLogViewController(req, res, next)
{
  try
  {
    const events = req.user ? await listAdminAccountActivity(req.user.id) : [];

    return res.status(200).render('../views/admin/activity-log.ejs', {
      adminData: {
        currentUser: req.user,
        events
      }
    });
  }
  catch (error)
  {
    next(error);
  }
}

module.exports = adminActivityLogViewController;