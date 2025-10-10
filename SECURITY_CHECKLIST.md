# 🔐 G.rave 2.0 Security Checklist

> **Critical**: All items marked **[BLOCKING]** must be completed before production deployment

## Pre-Deployment Security Gates

### ✅ Telegram Mini App Security

- [ ] **[BLOCKING]** `initData` HMAC-SHA256 verification implemented on backend
  - File: `src/lib/telegram/validateInitData.ts`
  - Test: `curl -H "X-Telegram-Init-Data: fake" /api/memorials` → должен вернуть 401

- [ ] **[BLOCKING]** Content Security Policy (CSP) configured
  - File: `next.config.ts` 
  - Check: `curl -I https://normaldance.com` → должен содержать `Content-Security-Policy`
  - Verify: No inline scripts, `frame-ancestors 'none'`

- [ ] **[BLOCKING]** X-Frame-Options header set to DENY
  - Test: Попытаться встроить в iframe → должна блокироваться

- [ ] **[BLOCKING]** NEVER ask for seed phrase anywhere in UI
  - Code review: `grep -r "seed.*phrase" src/` → должно быть пусто
  - Only use TON Connect SDK for wallet interactions

- [ ] Rate limiting на API endpoints (60 req/min per IP)
  - File: `workers/waf-custom-rules.js`
  - Test: `ab -n 100 -c 10 https://normaldance.com/api/donate` → должен отдавать 429

---

### ✅ Smart Contract Security

- [ ] **[BLOCKING]** Slither static analysis passes
  ```bash
  slither contracts/GraveMemorialSecure.sol --filter-paths node_modules
  ```
  Expected: No HIGH severity issues

- [ ] **[BLOCKING]** Mythril security audit complete
  ```bash
  docker run -v $(pwd):/tmp mythril/myth analyze /tmp/contracts/GraveMemorialSecure.sol
  ```
  Expected: No critical vulnerabilities

- [ ] **[BLOCKING]** ReentrancyGuard applied to all payable functions
  - Verify: All `external payable` functions have `nonReentrant` modifier

- [ ] **[BLOCKING]** Rate limiting implemented (1000 ETH/day max)
  - Check: `totalDonationsToday` variable exists
  - Test: Try to donate 1001 ETH in one day → should revert

- [ ] Emergency pause mechanism tested
  - Test: Call `emergencyPause("test")` → contract should pause
  - Verify: All user functions should revert while paused

- [ ] Access control roles configured
  - EMERGENCY_ROLE assigned to multisig wallet
  - DEFAULT_ADMIN_ROLE assigned to team multisig

---

### ✅ Infrastructure Security

- [ ] **[BLOCKING]** Secrets stored in KMS/External Secrets Operator
  - Check: `kubectl get externalsecrets -n normaldance-prod`
  - Verify: NO hardcoded secrets in code/env files

- [ ] **[BLOCKING]** Pods run as non-root user
  - File: `charts/grave-memorial/values.yaml`
  - Check: `runAsNonRoot: true`, `runAsUser: 1000`

- [ ] NetworkPolicy restricts ingress/egress
  - File: `charts/grave-memorial/templates/networkpolicy.yaml`
  - Test: Try to connect to external API from pod → should be blocked

- [ ] **[BLOCKING]** WAF enabled with OWASP Top 10 rules
  - Cloudflare dashboard: Security → WAF → Rules enabled
  - Test: Send SQL injection payload → should return 403

- [ ] Read-only root filesystem
  - Check: `readOnlyRootFilesystem: true` in securityContext
  - All writable paths mounted as emptyDir volumes

---

### ✅ CI/CD Security

- [ ] **[BLOCKING]** Semgrep SAST passes without HIGH severity
  - GitHub Actions: `.github/workflows/security-scan.yml`
  - Check: Last run status green

- [ ] **[BLOCKING]** Snyk dependency scan shows CVSS < 7
  - Dashboard: https://app.snyk.io/org/normaldance
  - Fix all HIGH/CRITICAL vulnerabilities

- [ ] **[BLOCKING]** Trivy container scan shows no CRITICAL
  ```bash
  trivy image grave-memorial:latest --severity CRITICAL
  ```
  Expected: 0 vulnerabilities

- [ ] **[BLOCKING]** GitLeaks secret scan passes
  ```bash
  gitleaks detect --source . --verbose
  ```
  Expected: No secrets found

- [ ] Pre-commit hooks configured
  - File: `.husky/pre-commit`
  - Runs: prettier, eslint, type-check, gitleaks

---

### ✅ Monitoring & Incident Response

- [ ] Sentry error tracking configured
  - DSN configured in `.env.production`
  - Test error sent: `Sentry.captureException(new Error('test'))`

- [ ] Falco runtime anomaly detection deployed
  - Check: `kubectl get pods -n falco-system`
  - Alerts configured for: shell spawned in container, suspicious file access

- [ ] Canary token (honeypot) set up
  - File: `src/lib/security/canaryToken.ts`
  - Verify: Accessing `JWT_SECRET_CANARY` sends Slack alert

- [ ] **[BLOCKING]** Kill switch tested
  - File: `src/lib/security/killSwitch.ts`
  - Test: Set `grave_kill_switch=true` in Firebase Remote Config → app should show maintenance page

- [ ] Incident response playbook documented
  - File: `docs/incident-response.md`
  - Team trained on emergency procedures

---

## Testing Protocol

### 1. Penetration Testing (Before Launch)

```bash
# SQL Injection test
curl -X POST "https://normaldance.com/api/donate?id=1%27%20OR%20%271%27=%271" 
# Expected: 403 Forbidden

# XSS test
curl -X POST "https://normaldance.com/api/donate" \
  -H "Content-Type: application/json" \
  -d '{"message":"<script>alert(1)</script>"}'
# Expected: 403 Forbidden or sanitized

# CSRF test (without CSRF token)
curl -X POST "https://normaldance.com/api/donate" \
  -H "Origin: https://evil.com"
# Expected: 403 Forbidden

# Rate limit test
ab -n 100 -c 10 "https://normaldance.com/api/donate"
# Expected: 429 after ~60 requests
```

### 2. Smart Contract Audit (Manual)

- [ ] Check for integer overflow/underflow (covered by Solidity 0.8+)
- [ ] Verify all external calls use checks-effects-interactions pattern
- [ ] Ensure no delegatecall to untrusted contracts
- [ ] Test emergency pause during active transactions
- [ ] Verify access control on admin functions

### 3. Telegram Mini App Security Test

- [ ] Try to fake `initData` signature → should fail
- [ ] Attempt clickjacking with transparent iframe → should be blocked by CSP
- [ ] Test XSS via `postMessage` → should be sanitized
- [ ] Clone bot and try to phish users → real bot should have verified badge

---

## Production Deployment Checklist

### Day -7: Security Audit Week
- [ ] Internal security review completed
- [ ] External audit firm engaged (optional but recommended)
- [ ] All BLOCKING items resolved

### Day -3: Pre-Production Testing
- [ ] Penetration testing on staging environment
- [ ] Load testing with realistic traffic
- [ ] Smart contract deployed to testnet and audited

### Day -1: Final Verification
- [ ] All CI/CD security gates passing
- [ ] Kill switch tested and working
- [ ] Incident response team on standby

### Day 0: Launch Day
- [ ] Monitoring dashboards live (Sentry, Grafana, Dune Analytics)
- [ ] WAF rules active
- [ ] Rate limiting verified
- [ ] Team monitoring Slack alerts channel

### Day +1: Post-Launch Review
- [ ] No security incidents reported
- [ ] Review Sentry errors for anomalies
- [ ] Check Falco alerts for suspicious activity
- [ ] Verify canary token not triggered

---

## Emergency Procedures

### If Security Breach Detected:

1. **Immediate Actions** (< 5 minutes)
   ```bash
   # Activate kill switch
   firebase remoteconfig:set grave_kill_switch=true
   
   # Pause smart contracts
   cast send $CONTRACT_ADDRESS "emergencyPause(string)" "Security incident" \
     --private-key $EMERGENCY_PRIVATE_KEY
   ```

2. **Containment** (< 30 minutes)
   - Block attacker IPs in Cloudflare WAF
   - Rotate all secrets (API keys, JWT secrets)
   - Scale down affected services
   - Notify users via Telegram channel

3. **Investigation** (< 2 hours)
   - Review Sentry error logs
   - Check Falco alerts
   - Analyze smart contract events
   - Identify attack vector

4. **Recovery** (< 24 hours)
   - Deploy security patch
   - Restore service gradually (canary deployment)
   - Post-mortem report to team
   - Notify users of resolution

---

## Security Contacts

- **Security Lead**: [Insert Contact]
- **On-Call Engineer**: [Pagerduty Rotation]
- **Incident Response Slack**: `#security-incidents`
- **External Audit Firm**: [Insert Firm if engaged]

---

## Compliance & Audits

- [ ] GDPR compliance verified (if applicable)
- [ ] Smart contract audit report published on website
- [ ] Bug bounty program launched (HackerOne/Immunefi)
- [ ] Security disclosure policy documented

---

**Last Updated**: 2025-01-XX  
**Next Review**: [Schedule quarterly security reviews]

---

## Sign-Off

Before production deployment, the following stakeholders must sign off:

- [ ] **CTO/Tech Lead**: ___________________ Date: _______
- [ ] **Security Engineer**: ___________________ Date: _______
- [ ] **Smart Contract Auditor**: ___________________ Date: _______
- [ ] **DevOps Lead**: ___________________ Date: _______

**Release approved only when ALL BLOCKING items are ✅**
