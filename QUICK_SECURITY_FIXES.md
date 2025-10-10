# ⚡ Quick Security Fixes - Выполните немедленно

## 🎯 Быстрые действия (10 минут)

### 1. Удалить неиспользуемый n8n пакет (убирает 6 critical уязвимостей)

```bash
# Подтверждено: пакет НЕ используется в коде
npm uninstall n8n-nodes-dewiar-collection

# Проверить результат:
npm audit
```

**Результат**: 27 → 21 уязвимость (останутся 4 high + 17 low)

---

### 2. Сгенерировать секреты для .env

```bash
# Для NEXTAUTH_SECRET и JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Или (если установлен OpenSSL):
openssl rand -base64 32
```

**Замените в .env:**
```env
NEXTAUTH_SECRET="<сгенерированный_секрет_1>"
JWT_SECRET="<сгенерированный_секрет_2>"
```

---

### 3. Проверить .gitignore (защита от commit секретов)

```bash
# Убедиться что .env в .gitignore:
grep "^\.env$" .gitignore

# Если нет - добавить:
echo ".env" >> .gitignore
```

---

## 🔧 Средние действия (30 минут)

### 4. Попробовать fix @walletconnect (17 low уязвимостей)

```bash
# Бэкап перед breaking changes:
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup

# Попробовать fix с --force:
npm audit fix --force

# Тестирование:
npm run type-check
npm run build

# Если сломалось - откатить:
mv package.json.backup package.json
mv package-lock.json.backup package-lock.json
npm install
```

**⚠️ РИСК**: Может downgrade @solana/wallet-adapter-wallets

---

### 5. Добавить overrides в package.json

```json
{
  "overrides": {
    "axios": "^1.7",
    "form-data": "^4.0.4",
    "fast-redact": "^3.5.1",
    "pino": "^9.12.0"
  }
}
```

Затем:
```bash
npm install
npm audit
```

---

## 📊 После выполнения

### Ожидаемый результат:

| Уязвимость | До | После Quick Fixes | Статус |
|------------|----|--------------------|--------|
| Critical | 6 | 0 | ✅ Исправлено |
| High | 4 | 4 | ⚠️ Требует обновления upstream |
| Low | 17 | 0-17 | ⚠️ Зависит от --force |
| **Всего** | **27** | **4-21** | **Значительное улучшение** |

### Оставшиеся 4 high уязвимости:

```
bigint-buffer → @solana/spl-token → @solana/pay
```

**Решение**: 
- Мониторить обновления
- Добавить input validation
- Rate limiting для транзакций

---

## ✅ Чеклист

- [ ] npm uninstall n8n-nodes-dewiar-collection
- [ ] Сгенерировать NEXTAUTH_SECRET и JWT_SECRET
- [ ] Проверить .env в .gitignore
- [ ] npm audit (проверка результата)
- [ ] Попробовать npm audit fix --force (опционально)
- [ ] Добавить overrides в package.json
- [ ] npm run type-check && npm run build (тестирование)
- [ ] Commit изменений (без .env!)

---

## 🚀 После Quick Fixes

### Можно деплоить в:
- ✅ Development
- ✅ Staging (с осторожностью)
- ⚠️ Production (с ограничениями)

### НЕ деплоить в production без:
1. Rate limiting для token operations
2. Input validation для bigint values
3. Monitoring и alerts
4. Тестирования на staging

---

**Время выполнения**: ~10-40 минут  
**Эффект**: Снижение рисков с Critical → Medium
