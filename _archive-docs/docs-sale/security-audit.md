Security Audit Summary (NormalDance)

Scope:
- Next.js app, API routes under /api/*
- Wallet adapter integration, IPFS layer, Stripe webhook

Findings:
- RBAC enforced for admin operations (rewards create, NFT/track update/delete)
- CSP allows IPFS gateways, Pinata, Sentry ingest, Mixpanel, Stripe
- Webhooks use Stripe signature verification

Recommendations:
- Rotate keys quarterly
- Add rate limiting on write endpoints
- Add audit logs for admin actions


