# 🛡️ Руководство по управлению секретами NORMALDANCE

## Оглавление

1. [Введение](#введение)
2. [Архитектура системы](#архитектура-системы)
3. [Установка и настройка](#установка-и-настройка)
4. [Управление секретами](#управление-секретами)
5. [Безопасность](#безопасность)
6. [Мониторинг и аудит](#мониторинг-и-аудит)
7. [Интеграция с CI/CD](#интеграция-с-cicd)
8. [Лучшие практики](#лучшие-практики)
9. [Устранение неполадок](#устранение-неполадок)
10. [Справочник по API](#справочник-по-api)

## Введение

Это руководство описывает систему управления секретами для проекта NORMALDANCE, которая обеспечивает безопасное хранение, управление и мониторинг секретов во всех окружениях разработки.

### Ключевые возможности

- 🔐 **Шифрование**: AES-256-GCM шифрование для всех секретов
- 🔄 **Автоматическая ротация**: Регулярное обновление секретов
- 📊 **Мониторинг безопасности**: Непрерывный мониторинг и аудит
- 🚀 **CI/CD интеграция**: Автоматическая интеграция с GitHub Actions
- 📈 **Отчетность**: Подробные отчеты и уведомления
- 🛡️ **Безопасность**: Соответствие стандартам безопасности

### Окружения

- **Development**: Локальная разработка с минимальными ограничениями
- **Staging**: Предварительное тестирование с полным функционалом
- **Production**: Производственная среда с максимальной безопасностью

## Архитектура системы

### Компоненты системы

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel CLI    │    │  GitHub Actions │    │   Security      │
│   Secrets       │◄──►│   Secrets       │◄──►│   Monitor       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Environment   │    │   Build Artifacts│    │   Audit Logs    │
│   Variables     │    │   & Secrets     │    │   & Reports     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Поток данных

1. **Создание секретов**: Генерация через шаблоны или ручное добавление
2. **Валидация**: Проверка формата и безопасности
3. **Шифрование**: AES-256-GCM шифрование
4. **Хранение**: Безопасное хранение в Vercel и GitHub
5. **Мониторинг**: Непрерывный контроль безопасности
6. **Ротация**: Автоматическое обновление по расписанию

## Установка и настройка

### Предварительные требования

- Node.js 18+
- npm или yarn
- Vercel CLI
- GitHub CLI (опционально)
- Slack webhook для уведомлений

### Установка Vercel CLI

```bash
# Установка Vercel CLI
npm install -g vercel

# Аутентификация
vercel login

# Настройка проекта
vercel init
```

### Настройка проекта

```bash
# Клонирование репозитория
git clone https://github.com/normaldance/normaldance.git
cd normaldance

# Установка зависимостей
npm install

# Настройка окружения
cp .env.example .env
```

### Конфигурация Vercel

1. Создайте проект в Vercel dashboard
2. Импортируйте репозиторий GitHub
3. Настройте окружения:
   - Development: `dev.dnb1st.ru`
   - Staging: `staging.dnb1st.ru`
   - Production: `dnb1st.ru`

### Настройка GitHub Secrets

Добавьте следующие секреты в GitHub repository:

```bash
# GitHub Repository Settings > Secrets and variables > Actions
GITHUB_TOKEN: github_token_here
VERCEL_TOKEN: vercel_token_here
VERCEL_ORG_ID: vercel_org_id_here
VERCEL_PROJECT_ID: vercel_project_id_here
SLACK_WEBHOOK: slack_webhook_here
```

## Управление секретами

### Структура секретов

#### Development окружение

```json
{
  "NEXTAUTH_SECRET": "dev_nextauth_secret_here",
  "DATABASE_URL": "file:./dev.db",
  "SOLANA_RPC_URL": "https://api.devnet.solana.com",
  "REDIS_URL": "redis://localhost:6379",
  "LOG_LEVEL": "debug",
  "ENABLE_DEBUG": "true",
  "ENABLE_MOCK_DATA": "true"
}
```

#### Staging окружение

```json
{
  "NEXTAUTH_SECRET": "staging_nextauth_secret_here",
  "DATABASE_URL": "postgresql://user:password@staging-db:5432/normaldance_staging",
  "SOLANA_RPC_URL": "https://api.testnet.solana.com",
  "REDIS_URL": "redis://staging-redis:6379",
  "LOG_LEVEL": "info",
  "ANALYTICS_ENABLED": "true",
  "MONITORING_ENABLED": "true",
  "SENTRY_DSN": "https://staging_dsn_here",
  "DATADOG_API_KEY": "staging_datadog_key_here"
}
```

#### Production окружение

```json
{
  "NEXTAUTH_SECRET": "production_nextauth_secret_here",
  "DATABASE_URL": "postgresql://user:password@prod-db:5432/normaldance_production",
  "SOLANA_RPC_URL": "https://api.mainnet-beta.solana.com",
  "REDIS_URL": "redis://prod-redis:6379",
  "LOG_LEVEL": "warn",
  "ANALYTICS_ENABLED": "true",
  "MONITORING_ENABLED": "true",
  "SENTRY_DSN": "https://production_dsn_here",
  "DATADOG_API_KEY": "production_datadog_key_here",
  "GOOGLE_ANALYTICS_ID": "G-XXXXXXXXXX",
  "MIXPANEL_TOKEN": "production_mixpanel_token_here",
  "JWT_SECRET": "production_jwt_secret_here",
  "ENCRYPTION_KEY": "production_encryption_key_here",
  "AWS_ACCESS_KEY_ID": "production_aws_key_here",
  "AWS_SECRET_ACCESS_KEY": "production_aws_secret_here",
  "AWS_REGION": "us-east-1",
  "CLOUDFLARE_API_TOKEN": "production_cloudflare_token_here",
  "PINATA_API_KEY": "production_pinata_key_here",
  "PINATA_SECRET_API_KEY": "production_pinata_secret_here",
  "EMAIL_HOST": "smtp.gmail.com",
  "EMAIL_PORT": "587",
  "EMAIL_USER": "production_email_here",
  "EMAIL_PASS": "production_email_password_here"
}
```

### Добавление секретов

#### Через Vercel CLI

```bash
# Добавление секрета для development
vercel env add DATABASE_URL dev

# Добавление секрета для staging
vercel env add DATABASE_URL staging

# Добавление секрета для production
vercel env add DATABASE_URL production
```

#### Через скрипты

```bash
# Массовое добавление из конфигурационного файла
node scripts/secrets-manager.js sync --from config/secrets-config.json

# Добавление секрета через шаблон
node scripts/secrets-manager.js add --env production --key DATABASE_URL --value "postgresql://user:pass@host:5432/db"
```

### Валидация секретов

```bash
# Валидация всех секретов
node scripts/secrets-manager.js validate --env production

# Проверка формата секретов
node scripts/secrets-manager.js validate --env staging --format

# Генерация отчета о валидации
node scripts/secrets-manager.js validate --env dev --output validation-report.json
```

## Безопасность

### Шифрование

#### Алгоритмы шифрования

- **AES-256-GCM**: Стандарт шифрования для всех секретов
- **Ключи**: 256-битные ключи, генерируемые криптографически безопасным способом
- **IV**: Уникальный вектор инициализации для каждого шифрования

#### Управление ключами

```bash
# Генерация нового ключа шифрования
openssl rand -hex 32

# Вращение ключей шифрования
node scripts/secrets-manager.js rotate-keys --env production
```

### Контроль доступа

#### Разграничение прав

- **Development**: Доступ только для разработчиков
- **Staging**: Доступ для разработчиков и QA команды
- **Production**: Доступ для разработчиков, QA и DevOps команд

#### Настройка доступа

```bash
# Настройка доступа к Vercel проекту
vercel team add normaldance-team

# Настройка доступа к GitHub репозиторию
gh secret set VERCEL_TOKEN --body "vercel_token_here"
```

### Аутентификация

#### Vercel CLI

```bash
# Аутентификация
vercel login

# Проверка аутентификации
vercel whoami

# Выход
vercel logout
```

#### GitHub CLI

```bash
# Аутентификация
gh auth login

# Проверка аутентификации
gh auth status

# Выход
gh auth logout
```

## Мониторинг и аудит

### Мониторинг безопасности

#### Запуск мониторинга

```bash
# Мониторинг production окружения
node scripts/security-monitor.js --env production

# Мониторинг всех окружений
node scripts/security-monitor.js --env all --format html --output security-report.html

# С включенными уведомлениями
node scripts/security-monitor.js --env staging --alerts --compliance
```

#### Параметры мониторинга

- **Проверка силы паролей**: Автоматическая проверка сложности секретов
- **Проверка ротации**: Мониторинг частоты обновления секретов
- **Контроль доступа**: Проверка прав доступа к секретам
- **Шифрование**: Проверка состояния шифрования
- **Аудит логов**: Анализ логов доступа и изменений
- **Обнаружение утечек**: Поиск секретов в коде и логах

### Аудит

#### Логирование операций

```bash
# Просмотр логов аудита
node scripts/secrets-manager.js audit --env production

# Фильтрация по типу операции
node scripts/secrets-manager.js audit --env staging --action add

# Экспорт логов
node scripts/secrets-manager.js audit --env dev --output audit-log.json
```

#### Типы аудируемых событий

- **Добавление секрета**: `add`
- **Обновление секрета**: `update`
- **Удаление секрета**: `remove`
- **Ротация секрета**: `rotate`
- **Доступ к секрету**: `access`
- **Ошибка доступа**: `access_denied`

### Уведомления

#### Настройка уведомлений

```bash
# Настройка Slack уведомлений
export SLACK_WEBHOOK="https://hooks.slack.com/services/..."

# Настройка email уведомлений
export EMAIL_NOTIFICATIONS="true"
export EMAIL_RECIPIENTS="devops@normaldance.com"
```

#### Типы уведомлений

- **Критические ошибки**: Немедленные уведомления
- **Предупреждения безопасности**: Ежедневные сводки
- **Отчеты о ротации**: После каждой ротации
- **События доступа**: При нестандартном доступе

## Интеграция с CI/CD

### GitHub Actions

#### Конфигурация workflow

```yaml
name: Secrets Management
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to manage'
        required: true
        default: 'staging'
        type: choice
        options:
          - dev
          - staging
          - production

jobs:
  validate-secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: node scripts/secrets-manager.js validate --env ${{ matrix.environment }}
```

#### Автоматизация

```bash
# Автоматическая валидация при пуше
git push origin main

# Ручной запуск workflow
gh workflow run secrets-management.yml --env production

# Просмотр статуса workflow
gh run list --watch
```

### Сборка и деплой

#### Безопасная сборка

```bash
# Сборка с использованием секретов
npm run build

# Деплой с проверкой секретов
npm run deploy:vercel:staging

# Проверка артефактов сборки
node scripts/check-hardcoded-secrets.js --env production
```

#### Очистка артефактов

```bash
# Очистка временных файлов
npm run clean

# Удаление секретов из артефактов
node scripts/cleanup-artifacts.js --env production
```

## Лучшие практики

### Управление секретами

#### Правила именования

```bash
# Правильные имена
NEXTAUTH_SECRET
DATABASE_URL
SOLANA_RPC_URL
AWS_ACCESS_KEY_ID

# Неправильные имена
secret
password
key
token
```

#### Хранение секретов

- Никогда не храните секреты в коде
- Используйте шаблоны для генерации секретов
- Регулярно ротируйте секреты
- Ограничивайте доступ к секретам
- Используйте разные секреты для разных окружений

### Безопасность

#### Принципы безопасности

1. **Минимальные привилегии**: Давайте только необходимые права
2. **Защита в глубину**: Используйте несколько уровней защиты
3. **Регулярный аудит**: Периодически проверяйте безопасность
4. **Минимизация атакующей поверхности**: Удаляйте неиспользуемые секреты

#### Проверки безопасности

```bash
# Проверка на жестко закодированные секреты
node scripts/check-hardcoded-secrets.js --env production

# Проверка соответствия стандартам
node scripts/security-monitor.js --env production --compliance

# Проверка утечек
node scripts/check-exposed-secrets.js --env staging
```

### Мониторинг

#### Метрики мониторинга

- **Количество секретов**: Общее количество активных секретов
- **Частота ротации**: Как часто обновляются секреты
- **Доступ к секретам**: Кто и когда обращался к секретам
- **Ошибки доступа**: Количество отказанных в доступе
- **Утечки**: Обнаруженные утечки секретов

#### Алерты

```bash
# Настройка алертов
node scripts/setup-alerts.js --env production

# Проверка алертов
node scripts/test-alerts.js --env staging
```

## Устранение неполадок

### Распространенные проблемы

#### Проблема: Секреты не доступны

```bash
# Проверка аутентификации Vercel
vercel whoami

# Проверка доступности секретов
vercel env ls dev

# Проверка прав доступа
vercel team ls
```

#### Проблема: Ошибки при добавлении секретов

```bash
# Проверка формата секрета
node scripts/secrets-manager.js validate --env production --key DATABASE_URL

# Проверка синтаксиса конфигурации
node -e "console.log(require('./config/secrets-config.json'))"
```

#### Проблема: Ошибки при ротации

```bash
# Проверка прав на ротацию
vercel env ls production

# Проверка конфигурации ротации
node scripts/rotate-secrets.js --env production --dry-run

# Проверка бэкапов
ls -la backups/
```

### Отладка

#### Включение отладки

```bash
# Включение verbose режима
export DEBUG=secrets-manager:*

# Запуск с отладкой
node scripts/secrets-manager.js --env production --verbose
```

#### Логи

```bash
# Просмотр логов
tail -f scripts/secrets-audit.log

# Фильтрация логов
grep "ERROR" scripts/secrets-audit.log

# Поиск по типу операции
grep "rotate" scripts/secrets-audit.log
```

### Восстановление

#### Восстановление после ошибок

```bash
# Восстановление из бэкапа
node scripts/secrets-manager.js restore --env production --backup backup-2024-01-01.json

# Откат изменений
node scripts/secrets-manager.js rollback --env production --timestamp 2024-01-01T12:00:00Z
```

#### Восстановление доступа

```bash
# Сброс пароля Vercel
vercel login

# Сброс токена GitHub
gh auth token

// Восстановление доступа к секретам
node scripts/recover-access.js --env production
```

## Справочник по API

### Secrets Manager API

#### Основные методы

```javascript
const { SecretsManager } = require('./scripts/secrets-manager');

const manager = new SecretsManager();

// Добавление секрета
await manager.addSecret('production', 'DATABASE_URL', 'postgresql://...');

// Получение секрета
const secret = await manager.getSecret('production', 'DATABASE_URL');

// Обновление секрета
await manager.updateSecret('production', 'DATABASE_URL', 'new_value');

// Удаление секрета
await manager.removeSecret('production', 'DATABASE_URL');

// Валидация секрета
await manager.validateSecret('production', 'DATABASE_URL', 'value');
```

#### Методы ротации

```javascript
// Ротация всех секретов
await manager.rotateAllSecrets('production');

// Ротация конкретного секрета
await manager.rotateSecret('production', 'DATABASE_URL');

// Проверка необходимости ротации
const needsRotation = await manager.needsRotation('production', 'DATABASE_URL');
```

#### Методы аудита

```javascript
// Получение логов аудита
const auditLogs = await manager.getAuditLogs('production');

// Фильтрация по типу операции
const addLogs = await manager.getAuditLogs('production', 'add');

// Экспорт логов
await manager.exportAuditLogs('production', 'audit-report.json');
```

### Security Monitor API

#### Основные методы

```javascript
const { SecurityMonitor } = require('./scripts/security-monitor');

const monitor = new SecurityMonitor();

// Запуск мониторинга
const report = await monitor.monitorEnvironment('production');

// Проверка безопасности
const securityCheck = await monitor.checkSecurity('production');

// Генерация отчета
const report = await monitor.generateReport('production', 'html');
```

#### Методы проверки

```javascript
// Проверка силы паролей
const passwordCheck = await monitor.checkPasswordStrength('production', 'password');

// Проверка ротации
const rotationCheck = await monitor.checkRotation('production');

// Проверка доступа
const accessCheck = await monitor.checkAccess('production');
```

## Заключение

Эта система управления секретами обеспечивает надежную защиту чувствительных данных NORMALDANCE проекта. Следуя этим рекомендациям, вы сможете обеспечить высокий уровень безопасности и соответствие отраслевым стандартам.

### Дополнительные ресурсы

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Node.js Security Guide](https://nodejs.org/en/docs/guides/security/)
- [OWASP Security Guidelines](https://cheatsheetseries.owasp.org/)

### Поддержка

Для получения поддержки обратитесь:

- DevOps команда: devops@normaldance.com
- GitHub Issues: [Создать issue](https://github.com/normaldance/normaldance/issues)
- Документация: [Документация проекта](https://docs.normaldance.com)

---

*Последнее обновление: September 2024*
*Версия: 1.0.1*