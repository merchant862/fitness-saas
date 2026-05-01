'use strict';

const { listAdminAccessCodes } = require('../../services/adminService');

async function adminAccessCodesViewController(req, res, next)
{
  try
  {
    const accessCodes = await listAdminAccessCodes();

    return res.status(200).render('../views/admin/access-codes.ejs', {
      adminData: {
        currentUser: req.user,
        accessCodes,
        message: req.query.granted ? 'Customer access created successfully.' : (req.query.created ? 'Access code generated successfully.' : null),
        error: null
      }
    });
  }
  catch (error)
  {
    next(error);
  }
}

module.exports = adminAccessCodesViewController;
