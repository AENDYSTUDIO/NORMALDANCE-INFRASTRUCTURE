# 🚀 NEXT STEPS - Security Deployment

## ✅ ЧТО УЖЕ СДЕЛАНО (Phase 1)

1. ✅ Защищен `/api/grave/donations` - Telegram auth + rate limiting
2. ✅ Защищен `/api/nft/mint` - Telegram auth + wallet validation
3. ✅ Обновлен `next.config.ts` - CSP headers для блокировки XSS
4. ✅ Созданы security utilities:
   - `src/lib/security/telegram-validator.ts`
   - `src/lib/security/input-sanitizer.ts`

---

## 🔥 ЧТО ДЕЛАТЬ ПРЯМО СЕЙЧАС

### 1. Настроить переменные окружения

Добавь в `.env.production` или Vercel Environment Variables:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

**Как получить BOT_TOKEN:**
1. Открой @BotFather в Telegram
2. Отправь `/newbot` или `/mybots`
3. Скопируй API token
4. Добавь в environment variables

### 2. Тестировать локально

```bash
# 1. Установи зависимости (если еще нет)
npm install

# 2. Запусти dev server
npm run dev

# 3. Протестируй защищенные endpoints
curl -X POST http://localhost:3000/api/grave/donations \
  -H "Content-Type: application/json" \
  -d '{"memorialId": "test", "amount": 1}'

# Ожидаемый ответ: 401 Unauthorized (нет Telegram auth) ✅
```

### 3. Деплой на production

```bash
# Vercel
vercel --prod

# Или через Git
git add .
git commit -m "feat: add military-grade security (Phase 1)

- Telegram authentication for critical endpoints
- Rate limiting (5 donations/min, 3 mints/min)
- CSP headers for XSS prevention
- Wallet address validation (Solana/TON/ETH)
- Input sanitization for all user inputs

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"

git push origin main
```

---

## ⚠️ ВАЖНО: Проверь после деплоя

### Тест 1: CSP Headers работают

```bash
curl -I https://normaldance.com

# Должен содержать:
# Content-Security-Policy: default-src 'self'; ...
# X-Frame-Options: DENY
# Strict-Transport-Security: max-age=63072000
```

### Тест 2: Telegram auth работает

```bash
# Попытка без auth - должно блокироваться
curl -X POST https://normaldance.com/api/grave/donations \
  -H "Content-Type: application/json" \
  -d '{"memorialId": "test", "amount": 1}'

# Ожидаемый ответ: 401 Unauthorized ✅
```

### Тест 3: Rate limiting работает

```bash
# Отправь 10 запросов подряд (с валидным Telegram auth)
# Первые 5 должны пройти, остальные - 429 Too Many Requests ✅
```

---

## 📋 PHASE 2 (Следующая неделя)

### Критичные endpoints, которые НУЖНО защитить:

| Endpoint | Риск | Файл |
|----------|------|------|
| `/api/telegram/webhook` | 🔴 CRITICAL | `src/app/api/telegram/webhook/route.ts` |
| `/api/tracks/upload` | 🟡 HIGH | `src/app/api/tracks/upload/route.ts` |
| `/api/payment/*` | 🔴 CRITICAL | `src/app/api/payment/*/route.ts` |

### Как защитить (copy-paste готовый код):

1. Открой файл из таблицы выше
2. Добавь import в начало:
```typescript
import { validateTelegramInitData } from '@/lib/security/telegram-validator'
import { sanitizeHTML, isValidSolanaAddress } from '@/lib/security/input-sanitizer'
```
3. Добавь validation в начало POST/PUT функции:
```typescript
const initData = request.headers.get('x-telegram-init-data');
if (!initData) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const validation = validateTelegramInitData(initData, process.env.TELEGRAM_BOT_TOKEN!);
if (!validation.valid) {
  return NextResponse.json({ error: validation.error }, { status: 401 });
}
```
4. Готово! Endpoint защищен ✅

---

## 🛡️ PHASE 3 (Недели 3-4)

### Smart Contract Security

```bash
# Установи инструменты аудита
npm install -g @crytic/slither
npm install -g mythril

# Запусти аудит Solana programs
slither programs/grave-memorial/src/lib.rs

# Запусти аудит Solidity contracts
myth analyze contracts/GraveMemorialNFT.sol
```

### Infrastructure Hardening

1. **Docker Security** - скопируй `Dockerfile.secure` из `SECURITY_IMPLEMENTATION_GUIDE.md`
2. **Kubernetes** - примени PodSecurityPolicy из guide
3. **WAF Rules** - настрой Cloudflare WAF (OWASP Top 10 ruleset)

---

## 📚 Документация

Все примеры кода и инструкции находятся в:

| Файл | Что внутри |
|------|------------|
| **SECURITY_IMPLEMENTATION_GUIDE.md** | Полный гайд (265 KB) со всеми примерами |
| **SECURITY_CHECKLIST.md** | Pre-deployment checklist |
| **SECURITY_DEPLOYMENT_REPORT.md** | Отчет о внедрении Phase 1 |
| **# 📱🔐 ПРОМТ «МОБИЛЬНОЕ ПРИЛОЖЕНИЕ – КРЕ.ini** | Master document |

---

## 🚨 Если что-то сломалось

### CSP блокирует скрипты?

Добавь домен в `next.config.ts`:
```typescript
"script-src 'self' 'wasm-unsafe-eval' https://your-domain.com"
```

### Telegram auth не работает?

Проверь:
1. `TELEGRAM_BOT_TOKEN` установлен в env?
2. initData отправляется в header `x-telegram-init-data`?
3. initData не старше 1 часа? (можно увеличить maxAge)

### Rate limiting слишком строгий?

Измени в файле:
```typescript
checkRateLimit(`donation:${userId}`, 10) // Было 5, стало 10
```

---

## 🎯 Success Criteria

Перед production deployment убедись:

- [ ] `TELEGRAM_BOT_TOKEN` настроен
- [ ] CSP headers работают (проверь через curl)
- [ ] Telegram auth блокирует fake requests
- [ ] Rate limiting работает (429 после 5 requests)
- [ ] XSS sanitization работает (HTML escaped)
- [ ] Wallet validation работает (rejects invalid addresses)

**Если все ✅ - можно деплоить!**

---

## 📞 Контакты

Если нужна помощь:
- Читай `SECURITY_IMPLEMENTATION_GUIDE.md` - там ВСЕ примеры кода
- Проверь `SECURITY_DEPLOYMENT_REPORT.md` - там результаты тестов
- Slack: `#security-alerts` (создай канал если нет)

---

**Удачного деплоя! 🚀**

_"The best security is the one you actually deploy."_ - Ancient Web3 Proverb
