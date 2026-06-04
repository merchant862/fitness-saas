'use strict';

const DEFAULT_TIMEOUT_MS = 15000;

async function postStickyOrder(payload, stickySettings = {})
{
  const url = stickyApiUrl(stickySettings);
  const username = stickySettings.sticky_api_username;
  const password = stickySettings.sticky_api_password;

  if (!url || !username || !password)
  {
    const error = new Error('Sticky.io is not configured');
    error.status = 503;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(stickySettings.sticky_timeout_ms || DEFAULT_TIMEOUT_MS)
  );

  try
  {
    console.log('sticky_request_url', url);
    console.log('sticky_request_payload', payload);

    const response = await fetch(url, {
      method: 'POST',
      headers: stickyHeaders(username, password),
      body: formBody(payload),
      signal: controller.signal
    });

    const body = await parseBody(response);

    console.log('sticky_response_status', response.status);
    console.log('sticky_response_body', body);

    if (!response.ok)
    {
      const error = new Error(`Sticky.io request failed with ${response.status}`);
      error.status = 502;
      error.responseStatus = response.status;
      error.responseBody = body;
      throw error;
    }

    return {
      statusCode: response.status,
      body
    };
  }
  catch (error)
  {
    if (error.name === 'AbortError')
    {
      const timeoutError = new Error('Sticky.io request timed out');
      timeoutError.status = 504;
      throw timeoutError;
    }

    throw error;
  }
  finally
  {
    clearTimeout(timeout);
  }
}

function stickyApiUrl(stickySettings = {})
{
  const appKey = String(stickySettings.sticky_app_key || '').trim();
  const domain = String(stickySettings.sticky_domain || 'sticky.io').trim().replace(/^\.+/, '');
  const apiPath = String(stickySettings.sticky_api_path || '/admin/transact.php').trim();

  if (appKey)
  {
    return `https://${appKey}.${domain}${apiPath.startsWith('/') ? apiPath : `/${apiPath}`}`;
  }

  return '';
}

function stickyHeaders(username, password)
{
  return {
    Accept: 'text/plain, application/json',
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
  };
}

function formBody(payload)
{
  const params = new URLSearchParams();

  Object.keys(payload).forEach((key) =>
  {
    const value = payload[key];

    if (key.startsWith('_') || value === undefined || value === null || value === '')
    {
      return;
    }

    params.append(key, String(value));
  });

  return params.toString();
}

async function parseBody(response)
{
  const text = await response.text();

  if (!text)
  {
    return {};
  }

  const trimmed = text.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('['))
  {
    try
    {
      return JSON.parse(trimmed);
    }
    catch
    {
      return { raw: trimmed.slice(0, 1000) };
    }
  }

  const parsed = {};
  const params = new URLSearchParams(trimmed);

  for (const [key, value] of params.entries())
  {
    parsed[key] = value;
  }

  return Object.keys(parsed).length ? parsed : { raw: trimmed.slice(0, 1000) };
}

module.exports = {
  postStickyOrder
};
