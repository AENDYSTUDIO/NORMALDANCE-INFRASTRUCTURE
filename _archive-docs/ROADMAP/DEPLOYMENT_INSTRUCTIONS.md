# NormalDance Deployment Instructions

## Production Deployment to normaldance.online

### 1. Domain Setup
- Domain: `normaldance.online`
- Configure DNS A records to point to Vercel
- Set up SSL certificate (automatic with Vercel)

### 2. Environment Variables (Vercel)
Set these in Vercel Environment Variables:

```bash
# Production URL
NEXT_PUBLIC_APP_URL=https://normaldance.online

# Database (SQLite/Prisma)
DATABASE_URL=postgresql://username:password@host:port/database

# Telegram Bot (get from @BotFather)
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_TOKEN=your_bot_token

# IPFS/Pinata
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
PINATA_JWT=your_pinata_jwt

# Blockchains
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_TON_RPC_URL=https://toncenter.com/api/v2/jsonRPC

# Analytics (optional)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token

# Production Settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 3. Telegram Bot Setup
1. Create bot via @BotFather
2. Set WebApp URL: `https://normaldance.online/telegram-app`
3. Configure payment settings (for Stars)
4. Set Webhook for payment notifications

### 4. Deployment Steps

#### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production with custom domain
vercel --prod --name normaldance-online

# Add domain (one-time setup)
vercel domains add normaldance.online
```

#### Option B: Vercel Dashboard
1. Push changes to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Configure custom domain: `normaldance.online`
5. Deploy

### 5. Post-Deployment Checks
1. Verify domain resolves correctly
2. Test Telegram Mini App: https://normaldance.online/telegram-app
3. Check all API endpoints work
4. Verify Telegram Stars payments
5. Test Solana and TON integration
6. Monitor error logs in Sentry

### 6. SEO and Meta Tags
- Update meta tags in `src/app/layout.tsx`
- Configure sitemap.xml
- Set up robots.txt
- Test with Google PageSpeed Insights

### 7. Performance Optimization
- Enable image optimization
- Configure CDN caching
- Set up service worker (PWA)
- Monitor with Vercel Analytics

### 8. Security Validation
Run security check:
```bash
npm run security:check
```

### 9. Backup Strategy
- Database backups
- Redis backup if using
- File storage backup (IPFS)
- Configuration backup

## URL Structure
- Main app: https://normaldance.online
- Telegram Mini App: https://normaldance.online/telegram-app
- Short redirects: https://normaldance.online/t or /mini or /app

## Monitoring and Alerting
- Set up Vercel project alerts
- Monitor Telegram Bot API errors
- Track payment success rates
- Watch for performance degradation

## Rollback Plan
1. Keep previous Vercel deployment
2. Database migrations must be reversible
3. Have DNS fallback ready
4. Monitor for 24 hours post-deployment

## Support
- Technical issues: Create GitHub issue
- Telegram bot issues: Check BotFather settings
- Payment issues: Verify Telegram Stars configuration
- Performance issues: Check Vercel Analytics

## Next Steps
1. Set up automated testing pipeline
2. Configure CI/CD for automatic deployments
3. Add monitoring dashboards
4. Prepare for international expansion
