'use strict';

const DEFAULT_TIMEOUT_MS = 15000;

async function postResponseCrm(url, payload)
{
  const apiKey = process.env.RESPONSE_CRM_API_KEY;
  const { _idempotencyKey, ...requestPayload } = payload;

  if (!url || !apiKey)
  {
    const error = new Error('ResponseCRM is not configured');
    error.status = 503;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.RESPONSE_CRM_TIMEOUT_MS || DEFAULT_TIMEOUT_MS)
  );

  try
  {
    const response = await fetch(url, {
      method: 'POST',
      headers: responseCrmHeaders(apiKey, requestPayload, _idempotencyKey),
      body: JSON.stringify(requestPayload),
      signal: controller.signal
    });

    const body = await parseBody(response);

    if (!response.ok)
    {
      const error = new Error(`ResponseCRM request failed with ${response.status}`);
      error.status = 502;
      error.responseStatus = response.status;
      error.responseBody = redactSensitive(body);
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
      const timeoutError = new Error('ResponseCRM request timed out');
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

function responseCrmHeaders(apiKey, payload, idempotencyKeyOverride = null)
{
  const headerName = process.env.RESPONSE_CRM_API_KEY_HEADER || 'Authorization';
  const prefix = process.env.RESPONSE_CRM_API_KEY_PREFIX || 'Bearer';
  const authorizationValue = prefix ? `${prefix} ${apiKey}` : apiKey;
  const idempotencyKey = idempotencyKeyOverride || payload.idempotency_id || payload.idempotencyId || payload.metadata?.idempotencyId;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    [headerName]: authorizationValue
  };

  if (idempotencyKey)
  {
    headers['Idempotency-Key'] = String(idempotencyKey);
  }

  return headers;
}

async function parseBody(response)
{
  const text = await response.text();

  if (!text)
  {
    return {};
  }

  try
  {
    return JSON.parse(text);
  }
  catch (error)
  {
    return { raw: text.slice(0, 1000) };
  }
}

function redactSensitive(value)
{
  if (Array.isArray(value))
  {
    return value.map(redactSensitive);
  }

  if (!value || typeof value !== 'object')
  {
    return value;
  }

  const blocked = new Set([
    'cardNumber',
    'card_number',
    'ccNumber',
    'cc_number',
    'cvv',
    'cvc',
    'cardCvv',
    'card_cvv',
    'paymentMethod',
    'payment_method',
    'payment',
    'card'
  ]);

  return Object.keys(value).reduce((clean, key) =>
  {
    clean[key] = blocked.has(key) ? '[redacted]' : redactSensitive(value[key]);
    return clean;
  }, {});
}

module.exports = {
  postResponseCrm
};
