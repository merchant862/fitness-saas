<p align="center">
  <img src="public/images/logo/logo.svg" alt="FitAccess" width="220">
</p>

# FitAccess

FitAccess is a premium fitness member area for checkout upsells. The front-sell funnel lives outside this app; when a customer accepts the fitness upsell, the funnel calls FitAccess, FitAccess charges through Sticky.io, grants membership, and sends a secure first-access email.

## Stack

| Layer | Technology |
| --- | --- |
| Server | Node.js, Express |
| Views | EJS templates |
| Database | MySQL, Sequelize |
| Auth | Password login, secure first-access links, stateless JWT sessions, optional activation codes |
| Email | Resend |
| Payments | Sticky.io NewOrder API |
| Coach Chat | Pattern-based fitness coach widget |
| Content | Sequelize migrations and seeders |
| UI | Bootstrap-based dashboard assets |

## Implemented

- Upsell purchase access endpoint.
- Sticky.io upsell payment capture before membership delivery.
- Password login for active members.
- Secure first-access and password-reset email links.
- Onboarding by goal, level, environment, weight, and workout days.
- User dashboard, workouts, meals, coach widget, progress, and profile.
- User and admin activity logs with IP address and user-agent tracking.
- DB-backed workout and meal content from seeders.
- Pattern-based coach chat using member workout and meal context.
- Coach safety scope, prompt-injection filtering, per-account rate limit, daily quota, and one in-flight request per account.
- Admin dashboard, users, CSV export, activity log, content overview, workout plan editing, and meal plan editing.

## User Flow

1. Customer buys the external front-sell product.
2. Customer accepts the FitAccess upsell during checkout.
3. Funnel calls `POST /api/integrations/upsell-purchases`.
4. FitAccess sends the upsell order and card details to Sticky.io.
5. After Sticky.io approval, FitAccess creates or updates the customer account.
6. FitAccess emails a secure first-access link.
7. Customer opens `/session/verify?token=...`.
8. Customer completes onboarding and sets a password.
9. Future sign-ins use email and password.

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
# FitAccess environment configuration
# Keep production secrets in .env only. Use .env.example as a safe template.

# App / HTTP
NODE_ENV=
PORT=
WEB_CONCURRENCY=
ENABLE_NODE_CLUSTER=auto
SHUTDOWN_TIMEOUT_MS=10000
TRUST_PROXY=loopback
ADMIN_BASE_PATH=/panel
ADMIN_API_BASE_PATH=/api/panel
CORS_ORIGINS=
HTTP_ACCESS_LOGS=true
HTTP_KEEP_ALIVE_TIMEOUT_MS=65000
HTTP_HEADERS_TIMEOUT_MS=66000
HTTP_REQUEST_TIMEOUT_MS=120000
COMPRESSION_LEVEL=4
COMPRESSION_THRESHOLD=1kb

# Database
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=
DB_DIALECT=
DB_POOL_MAX=10
DB_POOL_MIN=0
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000
DB_CONNECT_TIMEOUT=10000
DB_LOGGING=false

# Auth / Sessions / Access
SECRET=
JWT_SECRET=
JWT_ISSUER=fitaccess
JWT_AUDIENCE=fitaccess-web
JWT_EXPIRES_DAYS=14
AUTH_COOKIE_NAME=fitaccess_token
MAGIC_LINK_TTL_MINUTES=30
PURCHASE_MAGIC_LINK_TTL_MINUTES=4320
PASSWORD_RESET_TTL_MINUTES=30
PASSWORD_RESET_COOLDOWN_MINUTES=5
DEFAULT_ACCESS_DAYS=30
ADMIN_API_TOKEN=

# Rate Limits
AUTH_RATE_LIMIT=20
API_RATE_LIMIT=120
UPSELL_WEBHOOK_RATE_LIMIT=5000
COACH_CHAT_RATE_LIMIT=12
COACH_CHAT_DAILY_LIMIT=80

# Email Queue
EMAIL_QUEUE_BATCH_SIZE=10
EMAIL_QUEUE_POLL_MS=5000
EMAIL_QUEUE_MAX_ATTEMPTS=5
EMAIL_QUEUE_LOCK_TIMEOUT_MS=300000

# Onboarding Reminder Worker
ONBOARDING_REMINDER_WORKER_BATCH_SIZE=100
ONBOARDING_REMINDER_WORKER_POLL_MS=300000
ONBOARDING_REMINDER_MAX_ATTEMPTS=3
ONBOARDING_REMINDER_INTERVAL_HOURS=24
ONBOARDING_REMINDER_WINDOW_HOURS=96
ONBOARDING_REMINDER_LOCK_TIMEOUT_MS=600000

# Development Seed Helpers
SEED_WEBHOOK_USER_COUNT=12
SEED_WEBHOOK_PORT=0
SEED_WEBHOOK_DOMAIN=seed.fitaccess.local
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

Start the onboarding reminder worker in a separate process:

```bash
npm run onboarding:worker
```

## Production Scaling

If you run the web app with PM2 cluster mode, keep the app's internal Node cluster disabled:

```env
ENABLE_NODE_CLUSTER=false
WEB_CONCURRENCY=1
```

If you run the app directly without PM2 cluster mode, you can enable the built-in cluster:

```env
ENABLE_NODE_CLUSTER=auto
WEB_CONCURRENCY=4
```

Size the DB pool against total processes, not one process. Total possible DB connections are roughly:

```text
(web processes + email workers + onboarding workers) * DB_POOL_MAX
```

For high traffic behind a proxy or load balancer, keep these production defaults explicit:

```env
TRUST_PROXY=loopback
HTTP_KEEP_ALIVE_TIMEOUT_MS=65000
HTTP_HEADERS_TIMEOUT_MS=66000
HTTP_REQUEST_TIMEOUT_MS=120000
COMPRESSION_LEVEL=4
COMPRESSION_THRESHOLD=1kb
```

`/healthz` returns a lightweight JSON response for load balancer health checks. Rate limits use the default in-process limiter; with multiple PM2 instances the effective limit is per process. Use an external rate-limit store if you need a strict global limit across all instances.

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
| `npm run onboarding:worker` | Queue daily setup reminders for paid users who have not completed onboarding |
| `npm run admin:promote -- email password` | Create or promote an admin account |

## Public Routes

| Route | Purpose |
| --- | --- |
| `GET /sign-in` | Member sign-in page |
| `POST /sign-in` | Password login |
| `GET /session/verify` | Verify secure sign-in token |
| `GET /onboarding` | First-time profile setup |
| `POST /onboarding` | Save onboarding |
| `GET /dashboard` | Member dashboard |
| `GET /workouts` | Workout plan |
| `GET /meals` | Meal planner |
| `GET /progress` | Progress tracking |
| `GET /profile` | Profile settings |
| `POST /profile` | Save profile settings |
| `GET /activity-log` | Member activity log |

## API Routes

| Route | Purpose |
| --- | --- |
| `POST /api/integrations/upsell-purchases` | Grant access after upsell purchase |
| `POST /api/sessions/email-link` | Send secure sign-in email |
| `POST /api/sessions/password` | Password login |
| `GET /api/sessions/verify` | Verify secure sign-in token |
| `GET /api/auth/session` | Current session |
| `POST /api/auth/logout` | Logout |
| `GET /api/dashboard` | Dashboard content |
| `GET /api/workouts` | Workout content |
| `POST /api/workouts/:id/complete` | Mark workout complete |
| `GET /api/meals` | Meal content |
| `POST /api/coach/chat` | Coach widget chat |
| `GET /api/progress` | Progress data |
| `POST /api/progress/weight` | Log weight |

## Admin Routes

| Route | Purpose |
| --- | --- |
| `GET /panel` | Admin dashboard |
| `GET /panel/users` | User list with filters |
| `GET /panel/users/export.csv` | CSV user export |
| `GET /panel/activity-log` | Admin activity log |
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

### Sticky.io Payments

Sticky.io checkout settings are managed from the admin dashboard, not from environment variables. The webhook uses the DB-backed Sticky settings for API credentials, campaign, shipping, gateway, and product IDs.

Do not log webhook request bodies in production.

Onboarding reminders are handled by `npm run onboarding:worker`. The worker claims paid, active users who have not completed onboarding, queues one reminder every `ONBOARDING_REMINDER_INTERVAL_HOURS`, and stops after `ONBOARDING_REMINDER_MAX_ATTEMPTS`. `ONBOARDING_REMINDER_WINDOW_HOURS` prevents very old accounts from receiving new reminder campaigns after a late deploy. Each reminder gets a fresh one-time secure setup link using `PURCHASE_MAGIC_LINK_TTL_MINUTES`.

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
- Set the public website URL from the admin dashboard.
- Configure Resend API key, sender email, support email, and company names from the admin dashboard.
- Keep `DB_LOGGING=false` in production.
- Tune `DB_POOL_MAX` based on server size and MySQL capacity.
- For multiple Node instances, use Redis-backed rate limiting later. Daily coach quota is already database-backed.

## Current Status

Core product and admin functionality are implemented. The remaining planned work is visual theme polish and UI styling refinements.
