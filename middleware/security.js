'use strict';

const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

function securityHeaders(req, res, next)
{
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  if (process.env.NODE_ENV === 'production')
  {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT || 120),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' }
});

const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.AI_CHAT_RATE_LIMIT || 8),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: function(req)
  {
    return req.user ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req.ip)}`;
  },
  message: { error: 'AI coach limit reached. Please wait a minute before sending another message.' }
});

module.exports = {
  aiChatLimiter,
  apiLimiter,
  authLimiter,
  securityHeaders
};
