<p align="center">
  <img src="public/images/logo/logo.svg" alt="FitAccess" width="220">
</p>

# FitAccess

FitAccess is a premium fitness member area built for upsell traffic. Customers buy a front-sell product outside this app, accept the fitness upsell during checkout, then receive a secure FitAccess email link that opens their account and onboarding flow.

## Current Stack

| Layer | Technology |
| --- | --- |
| Server | Node.js, Express |
| Views | EJS templates |
| Database | MySQL with Sequelize |
| Auth | Secure email links, access sessions, optional activation codes |
| Email | Resend |
| Fitness Content | Sequelize migrations and seeders |
| UI Assets | Bootstrap-based dashboard theme |

## User Flow

1. Customer buys a front-sell product on an external funnel.
2. Customer accepts the FitAccess upsell at checkout.
3. Funnel/checkout system calls `POST /api/integrations/upsell-purchases`.
4. FitAccess creates or updates the customer account.
5. FitAccess emails a secure sign-in link.
6. Customer opens `/session/verify?token=...`.
7. Customer completes onboarding and lands on the fitness dashboard.

## Main Routes

| Route | Purpose |
| --- | --- |
| `GET /sign-in` | Customer email sign-in page |
| `POST /sign-in` | Send a secure email sign-in link |
| `GET /session/verify` | Verify the emailed session token |
| `GET /activate` | Optional activation-code page |
| `POST /activate` | Redeem a single-use access code |
| `GET /onboarding` | First-time goal and profile setup |
| `GET /dashboard` | Member dashboard |
| `GET /workouts` | Workout plan page |
| `GET /meals` | Meal planner page |
| `GET /ai-coach` | Fitness assistant page |
| `GET /progress` | Progress tracking page |

## API Routes

| Route | Purpose |
| --- | --- |
| `POST /api/integrations/upsell-purchases` | Grant access after an upsell purchase |
| `POST /api/sessions/email-link` | Send secure sign-in email |
| `GET /api/sessions/verify` | Verify a secure sign-in token |
| `POST /api/access-codes/redeem` | Redeem activation code |
| `GET /api/dashboard` | Dashboard content |
| `GET /api/workouts` | Workout content |
| `GET /api/meals` | Meal content |
| `POST /api/ai/chat` | AI coach chat |
| `GET /api/progress` | Progress data |
| `POST /api/progress/weight` | Log weight |

## Upsell Webhook Example

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

## Setup

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env
```

Configure the required values in `.env`:

```env
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=
DB_NAME=fitaccess
DB_DIALECT=mysql
JWT_SECRET=change-this-secret
SECRET=change-this-secret
RESEND_API_KEY=
RESEND_FROM_EMAIL=FitAccess <noreply@example.com>
UPSELL_WEBHOOK_TOKEN=
```

Run migrations:

```bash
npm run db:migrate
```

Load starter workouts and meals:

```bash
npm run db:seed
```

Start the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/sign-in
```

## Notes

- The front-sell landing pages live outside this project.
- This app owns the FitAccess member experience after the upsell purchase.
- Workout and meal content is stored in the database, loaded by seeders, and personalized by goal, level, and training environment.
- Admin routes exist in the codebase, but current product work is focused on the customer journey.
- Resend emails are skipped locally if `RESEND_API_KEY` is not configured.
