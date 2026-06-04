'use strict';

const { setMemberDeviceLimit, updateBrandSettings, updateResendSettings, updateStickySettings } = require('../../services/appSettingsService');
const { adminRoute } = require('../../utils/adminPaths');
const { errorResponse, successResponse } = require('../../utils/httpResponseUtils');

async function updateDeviceLimit(req, res, next)
{
  try
  {
    const limit = await setMemberDeviceLimit(req.body.memberDeviceLimit);

    return successResponse(req, res, {
      message: `Member device limit updated to ${limit}.`,
      redirectTo: adminRoute('/?settingsUpdated=1')
    });
  }
  catch (error)
  {
    next(error);
  }
}

async function updateSticky(req, res, next)
{
  try
  {
    await updateStickySettings(req.body);

    return successResponse(req, res, {
      message: 'Sticky settings updated.',
      redirectTo: adminRoute('/?stickyUpdated=1')
    });
  }
  catch (error)
  {
    next(error);
  }
}

async function updateEmail(req, res, next)
{
  try
  {
    await updateResendSettings(req.body);

    return successResponse(req, res, {
      message: 'Email settings updated.',
      redirectTo: adminRoute('/?emailUpdated=1')
    });
  }
  catch (error)
  {
    next(error);
  }
}

async function updateBrand(req, res, next)
{
  try
  {
    await updateBrandSettings(req.body);

    return successResponse(req, res, {
      message: 'Brand and legal settings updated.',
      redirectTo: adminRoute('/?brandUpdated=1')
    });
  }
  catch (error)
  {
    next(error);
  }
}

module.exports = {
  updateDeviceLimit,
  updateEmail,
  updateBrand,
  updateSticky
};
