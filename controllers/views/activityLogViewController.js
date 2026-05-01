'use strict';

const { listUserActivity } = require('../../services/activityService');

async function activityLogViewController(req, res, next)
{
  try
  {
    const events = await listUserActivity(req.user.id);

    return res.status(200).render('../views/activity-log.ejs', {
      activityData: {
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

module.exports = activityLogViewController;
