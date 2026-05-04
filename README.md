<p align="center">
  <img src="public/images/logo/logo.svg" alt="FitAccess" width="220">
</p>

# FitAccess

FitAccess is a premium fitness member area for checkout upsells. The front-sell funnel lives outside this app; when a customer accepts the fitness upsell, the funnel calls FitAccess, FitAccess charges through ResponseCRM, grants membership, and sends a secure first-access email.

## Stack

| Layer | Technology |
| --- | --- |
| Server | Node.js, Express |
| Views | EJS templates |
| Database | MySQL, Sequelize |
| Auth | Password login, secure first-access links, stateless JWT sessions, optional activation codes |
| Email | Resend |
| Payments | ResponseCRM Add Order API |
| Coach Chat | Pattern-based fitness coach widget |
| Content | Sequelize migrations and seeders |
| UI | Bootstrap-based dashboard assets |

## Implemented

- Upsell purchase access endpoint.
- ResponseCRM upsell payment capture before membership delivery.
- Saved billing method record with charge dates.
- Member card update form on the profile page.
- Billing lock that redirects members without a saved card to `/billing`.
- Password login for active members.
- Secure first-access and password-reset email links.
- Optional single-use activation codes.
- Onboarding by goal, level, environment, weight, and workout days.
- User dashboard, workouts, meals, coach widget, progress, and profile.
- User and admin activity logs with IP address and user-agent tracking.
- DB-backed workout and meal content from seeders.
- Pattern-based coach chat using member workout and meal context.
- Coach safety scope, prompt-injection filtering, per-account rate limit, daily quota, and one in-flight request per account.
- Admin dashboard, users, CSV export, activity log, access codes, content overview, workout plan editing, and meal plan editing.

## User Flow

1. Customer buys the external front-sell product.
2. Customer accepts the FitAccess upsell during checkout.
3. Funnel calls `POST /api/integrations/upsell-purchases`.
4. FitAccess sends the upsell order and card details to ResponseCRM.
5. After ResponseCRM approval, FitAccess stores the payment method record and charge dates.
6. FitAccess creates or updates the customer account.
7. FitAccess emails a secure first-access link.
8. Customer opens `/session/verify?token=...`.
9. Customer completes onboarding, sets a password, and adds billing if required.
10. Future sign-ins use email and password.

## Setup

Install dependencies:

```bash
npm install
```

Create `.env`:

```bash
cp .env.example .env
```

Minimum local `.env`:

```env
NODE_ENV=development
PORT=3000
WEB_CONCURRENCY=
TRUST_PROXY=loopback
APP_URL=http://localhost:3000
CORS_ORIGINS=

DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=
DB_NAME=fitaccess
DB_DIALECT=mysql
DB_POOL_MAX=10
DB_POOL_MIN=0
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000
DB_CONNECT_TIMEOUT=10000
DB_LOGGING=false

SECRET=change-this-secret
JWT_SECRET=change-this-jwt-secret
JWT_ISSUER=fitaccess
JWT_AUDIENCE=fitaccess-web
JWT_EXPIRES_DAYS=14
AUTH_COOKIE_NAME=fitaccess_token

MAGIC_LINK_TTL_MINUTES=15
PASSWORD_RESET_TTL_MINUTES=30
PASSWORD_RESET_COOLDOWN_MINUTES=5
DEFAULT_ACCESS_DAYS=30
AUTH_RATE_LIMIT=20
API_RATE_LIMIT=120
UPSELL_WEBHOOK_RATE_LIMIT=5000

ADMIN_API_TOKEN=

RESPONSE_CRM_API_KEY=
RESPONSE_CRM_API_KEY_HEADER=Authorization
RESPONSE_CRM_API_KEY_PREFIX=Bearer
RESPONSE_CRM_ADD_ORDER_URL=
RESPONSE_CRM_TIMEOUT_MS=15000
RESPONSE_CRM_PROCESSOR_ID=
RESPONSE_CRM_UPSELL_PRODUCT_ID=
RESPONSE_CRM_CARD_VERIFY_PRODUCT_ID=
RESPONSE_CRM_RECURRING_MONTHS=1
BILLING_WORKER_BATCH_SIZE=50
BILLING_WORKER_POLL_MS=60000
BILLING_MAX_RETRY_ATTEMPTS=3
BILLING_RETRY_DELAYS_DAYS=1,2,3
BILLING_LOCK_TIMEOUT_MS=600000

RESEND_API_KEY=
RESEND_FROM_EMAIL=FitAccess <noreply@example.com>
EMAIL_QUEUE_BATCH_SIZE=10
EMAIL_QUEUE_POLL_MS=5000
EMAIL_QUEUE_MAX_ATTEMPTS=5
EMAIL_QUEUE_LOCK_TIMEOUT_MS=300000

COACH_CHAT_RATE_LIMIT=12
COACH_CHAT_DAILY_LIMIT=80
```

Run migrations:

```bash
npm run db:migrate
```

Seed starter fitness content:

```bash
npm run db:seed
```

Start development server:

```bash
npm run dev
```

Start the email worker in a separate process:

```bash
npm run email:worker
```

Start the billing worker in a separate process:

```bash
npm run billing:worker
```

Open:

```text
http://localhost:3000/sign-in
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start production server |
| `npm run dev` | Start dev server with Nodemon |
| `npm run db:migrate` | Run DB migrations |
| `npm run db:migrate:undo` | Undo latest migration |
| `npm run db:seed` | Seed workout and meal content |
| `npm run db:seed:undo` | Undo all seeders |
| `npm run email:worker` | Process durable email queue jobs |
| `npm run billing:worker` | Process due monthly billing and retries |
| `npm run admin:promote -- email password` | Create or promote an admin account |

## Public Routes

| Route | Purpose |
| --- | --- |
| `GET /sign-in` | Member sign-in page |
| `POST /sign-in` | Password login |
| `GET /session/verify` | Verify secure sign-in token |
| `GET /activate` | Activation-code page |
| `POST /activate` | Redeem activation code |
| `GET /onboarding` | First-time profile setup |
| `POST /onboarding` | Save onboarding |
| `GET /billing` | Required card setup for members without billing |
| `GET /dashboard` | Member dashboard |
| `GET /workouts` | Workout plan |
| `GET /meals` | Meal planner |
| `GET /progress` | Progress tracking |
| `GET /profile` | Profile settings |
| `POST /profile` | Save profile settings |
| `GET /activity-log` | Member activity log |
| `POST /billing/payment-method` | Update member card through ResponseCRM |

## API Routes

| Route | Purpose |
| --- | --- |
| `POST /api/integrations/upsell-purchases` | Grant access after upsell purchase |
| `POST /api/sessions/email-link` | Send secure sign-in email |
| `POST /api/sessions/password` | Password login |
| `GET /api/sessions/verify` | Verify secure sign-in token |
| `POST /api/access-codes/redeem` | Redeem activation code |
| `GET /api/auth/session` | Current session |
| `POST /api/auth/logout` | Logout |
| `GET /api/dashboard` | Dashboard content |
| `GET /api/workouts` | Workout content |
| `POST /api/workouts/:id/complete` | Mark workout complete |
| `GET /api/meals` | Meal content |
| `POST /api/coach/chat` | Coach widget chat |
| `GET /api/progress` | Progress data |
| `POST /api/progress/weight` | Log weight |
| `GET /api/billing/payment-method` | Current saved billing reference |
| `POST /api/billing/payment-method` | Update member card through ResponseCRM |

## Admin Routes

| Route | Purpose |
| --- | --- |
| `GET /panel` | Admin dashboard |
| `GET /panel/users` | User list with filters |
| `GET /panel/users/export.csv` | CSV user export |
| `GET /panel/activity-log` | Admin activity log |
| `GET /panel/access-codes` | Access code management |
| `POST /panel/access-codes` | Generate access code |
| `POST /panel/access-codes/:id/revoke` | Revoke access code |
| `POST /panel/access-codes/:id/extend` | Extend access code |
| `GET /panel/content` | Workout and meal content overview |
| `GET /panel/content/workout-plans/:id` | Edit workout plan |
| `POST /panel/content/workout-plans/:id` | Save workout plan |
| `GET /panel/content/meal-plans/:id` | Edit meal plan |
| `POST /panel/content/meal-plans/:id` | Save meal plan |

## Upsell Webhook

Example request from the external funnel:

```bash
curl -X POST http://localhost:3000/api/integrations/upsell-purchases \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "customerId": 16528318,
    "billing": {
      "firstName": "Customer",
      "lastName": "Name",
      "address1": "123 Test Street",
      "city": "Los Angeles",
      "state": "CA",
      "zip": "90001",
      "country": "US"
    },
    "paymentMethod": {
      "cardNumber": "4111111111111111",
      "expiryMonth": "12",
      "expiryYear": "2030",
      "cvv": "123",
      "cardHolderName": "Customer Name"
    }
  }'
```

Browser example:

```js
await fetch('https://your-fitaccess-domain.com/api/integrations/upsell-purchases', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'customer@example.com',
    customerId: 16528318,
    billing: {
      firstName: 'Customer',
      lastName: 'Name',
      address1: '123 Test Street',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
      country: 'US'
    },
    paymentMethod: {
      cardNumber: '4111111111111111',
      expiryMonth: '12',
      expiryYear: '2030',
      cvv: '123',
      cardHolderName: 'Customer Name'
    }
  })
});
```

The endpoint is intended for checkout/browser testing and is protected by rate limiting plus duplicate email/payment guards.

### ResponseCRM Payments

ResponseCRM docs describe Add Order as the checkout and upsell endpoint, with product IDs required for billing/checkout/upsell pages. FitAccess uses that flow through `RESPONSE_CRM_ADD_ORDER_URL`.

Required production values:

```env
RESPONSE_CRM_API_KEY=your-responsecrm-open-api-key
RESPONSE_CRM_ADD_ORDER_URL=https://...
RESPONSE_CRM_PROCESSOR_ID=...
RESPONSE_CRM_UPSELL_PRODUCT_ID=...
RESPONSE_CRM_CARD_VERIFY_PRODUCT_ID=...
```

Do not log webhook request bodies in production.

Upsell purchases, monthly billing, and card changes use `RESPONSE_CRM_ADD_ORDER_URL`. Upsell purchases and monthly billing use `RESPONSE_CRM_UPSELL_PRODUCT_ID`; normal active-account card changes use `RESPONSE_CRM_CARD_VERIFY_PRODUCT_ID`, which should be a `$0` verification product in ResponseCRM. If a member is locked because the old card failed, adding a new card charges `RESPONSE_CRM_UPSELL_PRODUCT_ID` immediately and restores access only after ResponseCRM approves the charge. The local payment method is replaced only after ResponseCRM returns an approved response.

Monthly billing is handled by `npm run billing:worker`, not by ResponseCRM recurring cycles. The worker claims due `payment_methods` rows in batches, charges them through ResponseCRM, advances `next_charged_at` by one calendar month on success, and retries failed charges with `BILLING_RETRY_DELAYS_DAYS`. After `BILLING_MAX_RETRY_ATTEMPTS`, the payment method status becomes `failed`, which locks member-only features through the existing billing guard.

## Fitness Content

Content is stored in the database, not hardcoded in controllers.

Seeded content includes:

- 18 workout plan variants.
- 1512 workout sessions.
- 3 goal-based meal plans.
- 84 meal days.

Workout matching uses:

- `goal`
- `level`
- `environment`

Meal matching uses:

- `goal`

Admins can review and edit plan-level fields from `/panel/content`.

## Coach Widget

The coach widget is a deterministic assistant, not an external AI model. It uses predefined intent patterns plus each member's goal, workout plan, meal plan, and progress context.

Safety and cost controls:

- Only answers fitness, workouts, exercises, meals, macros, hydration, recovery, sleep, habits, and consistency questions.
- Blocks prompt-injection and requests for secrets, prompts, admin details, database details, or unrelated topics.
- Does not diagnose medical conditions or replace qualified professionals.
- Per-account minute limit: `COACH_CHAT_RATE_LIMIT`.
- Daily per-account limit: `COACH_CHAT_DAILY_LIMIT`.
- One in-flight coach request per account.
- Rendered as a bottom-right widget on member pages.

## Admin Access

Promote an admin user:

```bash
npm run admin:promote -- admin@example.com 'StrongPassword123!'
```

Admin pages also accept `X-Admin-Token` when `ADMIN_API_TOKEN` is configured, useful for controlled integrations and smoke tests.

## Production Notes

- Set strong `SECRET` and `JWT_SECRET`.
- Set `APP_URL` to the real HTTPS app URL.
- Configure `RESEND_API_KEY` and verified `RESEND_FROM_EMAIL`.
- Keep `DB_LOGGING=false` in production.
- Tune `DB_POOL_MAX` based on server size and MySQL capacity.
- For multiple Node instances, use Redis-backed rate limiting later. Daily coach quota is already database-backed.

## Current Status

Core product and admin functionality are implemented. The remaining planned work is visual theme polish and UI styling refinements.
