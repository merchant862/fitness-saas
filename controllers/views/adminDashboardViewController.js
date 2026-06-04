'use strict';

const { getAdminDashboardStats } = require('../../services/adminService');
const { getBrandSettings, getMemberDeviceLimit, getResendSettings, getStickySettings, MAX_MEMBER_DEVICE_LIMIT, MIN_MEMBER_DEVICE_LIMIT } = require('../../services/appSettingsService');

async function adminDashboardViewController(req, res, next)
{
  try
  {
    const dashboard = await getAdminDashboardStats();
    const [memberDeviceLimit, stickySettings, resendSettings, brandSettings] = await Promise.all([
      getMemberDeviceLimit(),
      getStickySettings(),
      getResendSettings(),
      getBrandSettings()
    ]);

    const adminData = {
      currentUser: req.user,
      settings: {
        memberDeviceLimit,
        memberDeviceLimitMin: MIN_MEMBER_DEVICE_LIMIT,
        memberDeviceLimitMax: MAX_MEMBER_DEVICE_LIMIT,
        message: req.query.settingsUpdated ? 'Member device limit updated successfully.' : null,
        stickyMessage: req.query.stickyUpdated ? 'Sticky settings updated successfully.' : null,
        emailMessage: req.query.emailUpdated ? 'Email settings updated successfully.' : null,
        brandMessage: req.query.brandUpdated ? 'Brand and legal settings updated successfully.' : null,
        sticky: stickySettings,
        email: resendSettings,
        brand: brandSettings
      },
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
