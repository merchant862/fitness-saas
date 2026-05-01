'use strict';

const { listAdminActivity } = require('../../services/activityService');

async function adminActivityLogViewController(req, res, next)
{
  try
  {
    const events = await listAdminActivity();

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
