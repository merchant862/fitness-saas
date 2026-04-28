'use strict';

const { getAdminContentOverview } = require('../../services/adminService');

async function adminContentViewController(req, res, next)
{
  try
  {
    const content = await getAdminContentOverview();

    return res.status(200).render('../views/admin/content.ejs', {
      adminData: {
        currentUser: req.user,
        ...content
      }
    });
  }
  catch (error)
  {
    next(error);
  }
}

module.exports = adminContentViewController;
