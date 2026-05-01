'use strict';

function wantsJson(req)
{
  return req.path.startsWith('/api/') ||
    req.xhr ||
    req.headers['x-requested-with'] === 'XMLHttpRequest' ||
    String(req.headers.accept || '').includes('application/json');
}

function successResponse(req, res, { message = 'Saved successfully.', redirectTo = null, data = {}, status = 200 })
{
  if (wantsJson(req))
  {
    return res.status(status).json({
      ok: true,
      message,
      redirectTo,
      ...data
    });
  }

  if (redirectTo)
  {
    return res.redirect(redirectTo);
  }

  return res.status(status).send(message);
}

function errorResponse(req, res, { message = 'Something went wrong.', status = 422, redirectTo = null })
{
  if (wantsJson(req))
  {
    return res.status(status).json({
      ok: false,
      error: message,
      redirectTo
    });
  }

  if (redirectTo)
  {
    return res.redirect(redirectTo);
  }

  return res.status(status).send(message);
}

module.exports = {
  errorResponse,
  successResponse,
  wantsJson
};
