<p align="center">
  <img src="public/images/logo/logo.svg" alt="FitAccess" width="220">
</p>

# FitAccess

FitAccess is a premium fitness member area for checkout upsells. The front-sell funnel lives outside this app; when a customer accepts the fitness upsell, the funnel calls FitAccess, FitAccess grants membership, and the customer receives a secure email sign-in link.

## Stack

| Layer | Technology |
| --- | --- |
| Server | Node.js, Express |
| Views | EJS templates |
| Database | MySQL, Sequelize |
| Auth | Secure email links, JWT sessions, optional activation codes |
| Email | Resend |
| AI Coach | Gemini API with scoped fitness safety rules |
| Content | Sequelize migrations and seeders |
| UI | Bootstrap-based dashboard assets |

## Implemented

- Upsell purchase access endpoint.
- Secure sign-in link flow.
- Optional single-use activation codes.
- Onboarding by goal, level, environment, weight, and workout days.
- User dashboard, workouts, meals, AI coach, progress, and profile.
- DB-backed workout and meal content from seeders.
- Gemini AI Coach with fallback response when no API key is configured.
- AI safety scope, prompt-injection filtering, per-account rate limit, daily quota, and one in-flight request per account.
- Admin dashboard, users, CSV export, access codes, content overview, workout plan editing, and meal plan editing.

## User Flow

1. Customer buys the external front-sell product.
2. Customer accepts the FitAccess upsell during checkout.
3. Funnel calls `POST /api/integrations/upsell-purchases`.
4. FitAccess creates or updates the customer account.
5. FitAccess emails a secure sign-in link.
6. Customer opens `/session/verify?token=...`.
7. Customer completes onboarding.
8. Dashboard, workouts, meals, AI coach, profile, and progress unlock.

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
DEFAULT_ACCESS_DAYS=30
AUTH_RATE_LIMIT=20
API_RATE_LIMIT=120

ADMIN_API_TOKEN=
ADMIN_EMAIL=
UPSELL_WEBHOOK_TOKEN=

RESEND_API_KEY=
RESEND_FROM_EMAIL=FitAccess <noreply@example.com>

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_TIMEOUT_MS=9000
GEMINI_MAX_OUTPUT_TOKENS=180
AI_CHAT_RATE_LIMIT=6
AI_CHAT_DAILY_LIMIT=40
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
| `npm run admin:promote` | Promote `ADMIN_EMAIL` to admin |

## Public Routes

| Route | Purpose |
| --- | --- |
| `GET /sign-in` | Email sign-in page |
| `POST /sign-in` | Send secure sign-in link |
| `GET /session/verify` | Verify secure sign-in token |
| `GET /activate` | Activation-code page |
| `POST /activate` | Redeem activation code |
| `GET /onboarding` | First-time profile setup |
| `POST /onboarding` | Save onboarding |
| `GET /dashboard` | Member dashboard |
| `GET /workouts` | Workout plan |
| `GET /meals` | Meal planner |
| `GET /ai-coach` | AI fitness coach |
| `GET /progress` | Progress tracking |
| `GET /profile` | Profile settings |
| `POST /profile` | Save profile settings |

## API Routes

| Route | Purpose |
| --- | --- |
| `POST /api/integrations/upsell-purchases` | Grant access after upsell purchase |
| `POST /api/sessions/email-link` | Send secure sign-in email |
| `GET /api/sessions/verify` | Verify secure sign-in token |
| `POST /api/access-codes/redeem` | Redeem activation code |
| `GET /api/auth/session` | Current session |
| `POST /api/auth/logout` | Logout |
| `GET /api/dashboard` | Dashboard content |
| `GET /api/workouts` | Workout content |
| `POST /api/workouts/:id/complete` | Mark workout complete |
| `GET /api/meals` | Meal content |
| `POST /api/ai/chat` | AI Coach chat |
| `GET /api/progress` | Progress data |
| `POST /api/progress/weight` | Log weight |

## Admin Routes

| Route | Purpose |
| --- | --- |
| `GET /admin` | Admin dashboard |
| `GET /admin/users` | User list with filters |
| `GET /admin/users/export.csv` | CSV user export |
| `GET /admin/access-codes` | Access code management |
| `POST /admin/access-codes` | Generate access code |
| `POST /admin/access-codes/:id/revoke` | Revoke access code |
| `POST /admin/access-codes/:id/extend` | Extend access code |
| `GET /admin/content` | Workout and meal content overview |
| `GET /admin/content/workout-plans/:id` | Edit workout plan |
| `POST /admin/content/workout-plans/:id` | Save workout plan |
| `GET /admin/content/meal-plans/:id` | Edit meal plan |
| `POST /admin/content/meal-plans/:id` | Save meal plan |

## Upsell Webhook

Example request from the external funnel:

```bash
curl -X POST http://localhost:3000/api/integrations/upsell-purchases \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Token: your-shared-token" \
  -d '{
    "email": "customer@example.com",
    "orderId": "ORDER-1001",
    "productId": "fitaccess-upsell",
    "funnelId": "frontsell-main",
    "amount": "29.00",
    "currency": "USD",
    "accessDays": 30
  }'
```

If `UPSELL_WEBHOOK_TOKEN` is empty, the endpoint accepts requests without the token. Set it in production.

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

Admins can review and edit plan-level fields from `/admin/content`.

## AI Coach

AI Coach uses Gemini when `GEMINI_API_KEY` is configured. Without the key, the app returns a local scoped fallback response.

Safety and cost controls:

- Only answers fitness, workouts, exercises, meals, macros, hydration, recovery, sleep, habits, and consistency questions.
- Blocks prompt-injection and requests for secrets, prompts, admin details, database details, or unrelated topics.
- Does not diagnose medical conditions or replace qualified professionals.
- Per-account minute limit: `AI_CHAT_RATE_LIMIT`.
- Daily per-account limit: `AI_CHAT_DAILY_LIMIT`.
- One in-flight AI request per account.
- Gemini timeout: `GEMINI_TIMEOUT_MS`.
- Output cap: `GEMINI_MAX_OUTPUT_TOKENS`.

Recommended starting model:

```env
GEMINI_MODEL=gemini-2.5-flash-lite
```

## Admin Access

Promote an admin user:

```bash
ADMIN_EMAIL=admin@example.com npm run admin:promote
```

Admin pages also accept `X-Admin-Token` when `ADMIN_API_TOKEN` is configured, useful for controlled integrations and smoke tests.

## Production Notes

- Set strong `SECRET` and `JWT_SECRET`.
- Set `APP_URL` to the real HTTPS app URL.
- Configure `RESEND_API_KEY` and verified `RESEND_FROM_EMAIL`.
- Configure `UPSELL_WEBHOOK_TOKEN` before connecting an external funnel.
- Configure `GEMINI_API_KEY` for live AI responses.
- Keep `DB_LOGGING=false` in production.
- Tune `DB_POOL_MAX` based on server size and MySQL capacity.
- For multiple Node instances, use Redis-backed rate limiting later. Daily AI quota is already database-backed.

## Current Status

Core product and admin functionality are implemented. The remaining planned work is visual theme polish and UI styling refinements.
