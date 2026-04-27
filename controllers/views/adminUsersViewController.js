'use strict';

const { listAdminUsers } = require('../../services/adminService');

async function adminUsersViewController(req, res, next)
{
  try
  {
    const users = await listAdminUsers();

    return res.status(200).render('../views/admin/users.ejs', {
      adminData: {
        currentUser: req.user,
        users
      }
    });
  }
  catch (error)
  {
    next(error);
  }
}

module.exports = adminUsersViewController;
