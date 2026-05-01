'use strict';

const { updateAdminUserStatus } = require('../../services/adminService');
const { adminRoute } = require('../../utils/adminPaths');
const { errorResponse, successResponse } = require('../../utils/httpResponseUtils');

async function updateStatus(req, res, next)
{
  try
  {
    const user = await updateAdminUserStatus(req.params.id, req.body.status);

    if (!user)
    {
      return errorResponse(req, res, {
        message: 'User not found.',
        status: 404,
        redirectTo: adminRoute('/users')
      });
    }

    return successResponse(req, res, {
      message: 'User status updated.',
      redirectTo: safeReturnTo(req.get('referer'), adminRoute('/users'))
    });
  }
  catch (error)
  {
    next(error);
  }
}

module.exports = {
  updateStatus
};

function safeReturnTo(value, fallback)
{
  const url = String(value || '').trim();

  if (!url)
  {
    return fallback;
  }

  try
  {
    const parsed = new URL(url, 'http://local');
    return `${parsed.pathname}${parsed.search}`;
  }
  catch
  {
    return fallback;
  }
}
