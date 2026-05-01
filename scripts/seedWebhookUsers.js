'use strict';

require('dotenv').config();

const crypto = require('crypto');
const http = require('http');
const app = require('../bootstrap/app');

const COUNT = clampInt(Number(process.env.SEED_WEBHOOK_USER_COUNT || 12), 10, 15);
const PORT = Number(process.env.SEED_WEBHOOK_PORT || 0);
const DOMAIN = process.env.SEED_WEBHOOK_DOMAIN || 'seed.fitaccess.local';

async function main()
{
  const originalFetch = global.fetch;
  global.fetch = mockResponseCrmFetch;

  const server = app.listen(PORT, '127.0.0.1');

  try
  {
    await waitForServer(server);

    const port = server.address().port;
    const results = [];

    for (let index = 0; index < COUNT; index += 1)
    {
      const payload = buildWebhookPayload(index);
      const result = await postJson(port, '/api/integrations/upsell-purchases', payload);
      results.push({
        email: payload.email,
        status: result.statusCode,
        response: result.body
      });
    }

    console.log(JSON.stringify({
      created: results.length,
      results
    }, null, 2));
  }
  finally
  {
    global.fetch = originalFetch;
    await closeServer(server);
  }
}

function buildWebhookPayload(index)
{
  const token = crypto.randomBytes(4).toString('hex');
  const month = String((index % 12) + 1).padStart(2, '0');
  const year = String(new Date().getFullYear() + 3);

  return {
    email: `theme-audit-${token}-${index + 1}@${DOMAIN}`,
    firstName: ['Ayan', 'Sana', 'Musa', 'Hira', 'Usman', 'Zoya'][index % 6],
    lastName: ['Khan', 'Ali', 'Ahmed', 'Shah', 'Iqbal', 'Malik'][index % 6],
    phone: `03${String(100000000 + index).slice(-9)}`,
    address1: `${10 + index} Example Street`,
    city: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi'][index % 4],
    state: ['Punjab', 'Sindh', 'ICT', 'Punjab'][index % 4],
    zip: String(54000 + index),
    country: 'Pakistan',
    productId: `seed-product-${index + 1}`,
    funnelId: `seed-funnel-${index + 1}`,
    orderId: `seed-order-${Date.now()}-${index + 1}`,
    amount: 47,
    currency: 'USD',
    accessDays: 30,
    cardNumber: ['4111111111111111', '5555555555554444', '378282246310005'][index % 3],
    cardHolderName: `${['Ayan', 'Sana', 'Musa', 'Hira', 'Usman', 'Zoya'][index % 6]} ${['Khan', 'Ali', 'Ahmed', 'Shah', 'Iqbal', 'Malik'][index % 6]}`,
    nameOnCard: `${['Ayan', 'Sana', 'Musa', 'Hira', 'Usman', 'Zoya'][index % 6]} ${['Khan', 'Ali', 'Ahmed', 'Shah', 'Iqbal', 'Malik'][index % 6]}`,
    expiryMonth: month,
    expiryYear: year,
    cardCvv: ['123', '321', '1234'][index % 3]
  };
}

function mockResponseCrmFetch(url, options)
{
  const body = safeParseJson(options?.body);
  const emailSeed = String(body.email || '').split('@')[0] || 'seed';
  const hash = crypto.createHash('sha256').update(emailSeed).digest('hex').slice(0, 8);

  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      approved: true,
      id: `mock-${hash}`
    }),
    text: async () => JSON.stringify({
      success: true,
      approved: true,
      customer_id: '16528318',
      order_id: body.order_id || body.orderId || `order-${hash}`,
      transaction_id: `tx-${hash}`,
      payloadEcho: {
        email: body.email,
        product_id: body.product_id,
        amount: body.amount
      }
    })
  });
}

function safeParseJson(value)
{
  try
  {
    return JSON.parse(value || '{}');
  }
  catch
  {
    return {};
  }
}

function postJson(port, path, payload)
{
  return new Promise((resolve, reject) =>
  {
    const request = http.request({
      host: '127.0.0.1',
      port,
      method: 'POST',
      path,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(payload))
      }
    }, (response) =>
    {
      let raw = '';

      response.on('data', (chunk) =>
      {
        raw += chunk;
      });

      response.on('end', () =>
      {
        resolve({
          statusCode: response.statusCode,
          body: safeParseJson(raw)
        });
      });
    });

    request.on('error', reject);
    request.write(JSON.stringify(payload));
    request.end();
  });
}

function waitForServer(server)
{
  return new Promise((resolve) =>
  {
    if (server.listening)
    {
      return resolve();
    }

    server.once('listening', resolve);
  });
}

function closeServer(server)
{
  return new Promise((resolve) =>
  {
    server.close(() => resolve());
  });
}

function clampInt(value, min, max)
{
  if (!Number.isInteger(value))
  {
    return 12;
  }

  return Math.min(max, Math.max(min, value));
}

main().catch((error) =>
{
  console.error(error);
  process.exitCode = 1;
});
