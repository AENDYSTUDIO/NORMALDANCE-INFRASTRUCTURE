Deployment Guide (NormalDance)

1) Prerequisites
- Node.js 18, npm 10
- PostgreSQL / SQLite (Prisma)
- Stripe keys, Mixpanel token, Sentry DSN

2) Env
- Copy .env.example to .env and set:
  - STRIPE_SECRET_KEY
  - NEXT_PUBLIC_MIXPANEL_TOKEN
  - DATABASE_URL
  - SENTRY_DSN (optional)

3) Install & Build
- npm ci
- npm run build

4) Run
- npm start

5) Vercel
- vercel deploy --prod

6) Migrations
- npx prisma migrate deploy


