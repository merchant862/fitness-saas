'use strict';

function appUrl(path = '/')
{
  const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;

  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

module.exports = {
  appUrl
};
