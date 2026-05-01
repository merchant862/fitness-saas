'use strict';

const { Event } = require('../database/models');
const { clientIp } = require('../utils/securityUtils');

async function trackEvent(req, eventType, payload = {}, userId = null)
{
  try
  {
    return await Event.create({
      userId: userId || req.user?.id || null,
      eventType,
      payload,
      ipAddress: req ? clientIp(req) : null,
      userAgent: req ? String(req.headers['user-agent'] || '').slice(0, 512) : null
    });
  }
  catch (error)
  {
    console.error('event_tracking_failed', error.message);
    return null;
  }
}

module.exports = { trackEvent };
