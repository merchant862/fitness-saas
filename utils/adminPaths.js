'use strict';

const ADMIN_BASE_PATH = normalizeBasePath(process.env.ADMIN_BASE_PATH || '/panel');
const ADMIN_API_BASE_PATH = normalizeBasePath(process.env.ADMIN_API_BASE_PATH || '/api/panel');

function adminRoute(path = '')
{
  return joinPath(ADMIN_BASE_PATH, path);
}

function adminApiRoute(path = '')
{
  return joinPath(ADMIN_API_BASE_PATH, path);
}

function normalizeBasePath(path)
{
  const value = String(path || '/').trim();
  const prefixed = value.startsWith('/') ? value : `/${value}`;
  return prefixed.length > 1 ? prefixed.replace(/\/+$/, '') : '/';
}

function joinPath(basePath, path)
{
  const suffix = String(path || '').trim();

  if (!suffix || suffix === '/')
  {
    return basePath;
  }

  return `${basePath}/${suffix.replace(/^\/+/, '')}`;
}

module.exports = {
  ADMIN_API_BASE_PATH,
  ADMIN_BASE_PATH,
  adminApiRoute,
  adminRoute
};
