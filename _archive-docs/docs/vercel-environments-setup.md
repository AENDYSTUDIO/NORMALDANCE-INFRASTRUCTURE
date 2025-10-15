# Настройка окружений NORMALDANCE через Vercel

## Обзор

Это руководство описывает настройку трех окружений (dev, staging, production) для NORMALDANCE проекта с полной изоляцией переменных окружения и секретов через Vercel Dashboard и CLI.

## Структура окружений

### 1. Git-ветки
- `main` - Production окружение
- `develop` - Development окружение  
- `release/*` - Staging окружение

### 2. Домены
- **Development**: `dev.dnb1st.ru`
- **Staging**: `staging.dnb1st.ru`
- **Production**: `dnb1st.ru`

### 3. Конфигурационные файлы
- `vercel.json` - Базовая конфигурация
- `vercel.dev.json` - Development окружение
- `vercel.staging.json` - Staging окружение
- `vercel.prod.json` - Production окружение

## Предварительные требования

### 1. Установите Vercel CLI
```bash
npm install -g vercel
```

### 2. Аутентификация в Vercel
```bash
vercel login
```

### 3. Настройте Git-ветки
```bash
# Создайте ветки если они отсутствуют
git checkout -b develop
git checkout main
git push -u origin develop
git push -u origin main
```

## Настройка Vercel Dashboard

### 1. Создание проекта в Vercel
1. Перейдите в [Vercel Dashboard](https://vercel.com/dashboard)
2. Нажмите "New Project"
3. Импортируйте ваш GitHub репозиторий
4. Настройте базовые переменные окружения

### 2. Настройка окружений
1. В проекте перейдите в "Settings" > "Environments"
2. Создайте три окружения: `dev`, `staging`, `production`
3. Настройте домены для каждого окружения

### 3. Настройка доменов
1. В "Settings" > "Domains" добавьте:
   - `dev.dnb1st.ru` (для dev окружения)
   - `staging.dnb1st.ru` (для staging окружения)
   - `dnb1st.ru` (для production окружения)

## Управление секретами

### 1. Использование Secrets Manager

#### Настройка секретов для окружения
```bash
# Настройка секретов для development
node scripts/secrets-manager.js setup dev

# Настройка секретов для staging
node scripts/secrets-manager.js setup staging

# Настройка секретов для production
node scripts/secrets-manager.js setup production
```

#### Добавление конкретного секрета
```bash
# Добавление секрета в staging окружение
node scripts/secrets-manager.js add staging NEXTAUTH_SECRET your-secret-value

# Добавление секрета через интерактивный ввод
node scripts/secrets-manager.js add staging DATABASE_URL
```

#### Просмотр секретов
```bash
# Просмотр всех секретов окружения
node scripts/secrets-manager.js list staging
```

#### Валидация секретов
```bash
# Проверка наличия всех обязательных секретов
node scripts/secrets-manager.js validate production
```

#### Резервное копирование и восстановление
```bash
# Создание резервной копии секретов
node scripts/secrets-manager.js backup staging

# Восстановление секретов из резервной копии
node scripts/secrets-manager.js restore staging
```

### 2. Ручное добавление секретов через CLI
```bash
# Добавление секрета в Vercel
vercel env add dev NEXTAUTH_SECRET
vercel env add staging DATABASE_URL
vercel env add production SOLANA_RPC_URL
```

### 3. Обязательные секреты для каждого окружения

#### Development
- `NEXTAUTH_SECRET`
- `DATABASE_URL`
- `SOLANA_RPC_URL`
- `REDIS_URL`
- `LOG_LEVEL`
- `ENABLE_DEBUG`
- `ENABLE_MOCK_DATA`

#### Staging
- `NEXTAUTH_SECRET`
- `DATABASE_URL`
- `SOLANA_RPC_URL`
- `REDIS_URL`
- `LOG_LEVEL`
- `ANALYTICS_ENABLED`
- `MONITORING_ENABLED`
- `SENTRY_DSN`
- `DATADOG_API_KEY`

#### Production
- `NEXTAUTH_SECRET`
- `DATABASE_URL`
- `SOLANA_RPC_URL`
- `REDIS_URL`
- `LOG_LEVEL`
- `ANALYTICS_ENABLED`
- `MONITORING_ENABLED`
- `SENTRY_DSN`
- `DATADOG_API_KEY`
- `GOOGLE_ANALYTICS_ID`
- `MIXPANEL_TOKEN`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `CLOUDFLARE_API_TOKEN`

## Автоматическое переключение окружений

### 1. Использование Environment Manager

#### Автоматический деплой на основе ветки
```bash
# Автоматически определяет окружение на основе текущей ветки
node scripts/environment-manager.js auto-deploy
```

#### Ручной деплой в конкретное окружение
```bash
# Деплой в development
node scripts/environment-manager.js deploy dev

# Деплой в staging
node scripts/environment-manager.js deploy staging

# Деплой в production
node scripts/environment-manager.js deploy production
```

#### Продвижение окружений
```bash
# Продвижение staging в production
node scripts/environment-manager.js promote staging production
```

#### Откат деплоя
```bash
# Откат к предыдущему деплою в production
node scripts/environment-manager.js rollback production
```

#### Проверка статуса
```bash
# Проверка статуса деплоя
node scripts/environment-manager.js status staging
```

#### Просмотр логов
```bash
# Просмотр логов деплоя
node scripts/environment-manager.js logs production
```

### 2. Автоматический деплой через GitHub Actions

#### Триггеры деплоя
- **Production**: Автоматический деплой при пуше в `main` ветку
- **Development**: Автоматический деплой при пуше в `develop` ветку
- **Staging**: Автоматический деплой при пуше в `release/*` ветки

#### Отклонение деплоев
Деплой будет отклонен если:
- Тесты не пройдены
- Сканер безопасности обнаружил уязвимости
- Сборка завершилась с ошибкой

## Конфигурация для каждого окружения

### 1. Development окружение
```json
{
  "env": {
    "NODE_ENV": "development",
    "DOMAIN": "dev.dnb1st.ru",
    "DATABASE_URL": "file:./dev.db",
    "ENABLE_DEBUG": "true",
    "ENABLE_MOCK_DATA": "true",
    "HOT_RELOAD": "true",
    "CACHE_ENABLED": "false"
  },
  "functions": {
    "memory": 512
  }
}
```

### 2. Staging окружение
```json
{
  "env": {
    "NODE_ENV": "staging",
    "DOMAIN": "staging.dnb1st.ru",
    "DATABASE_URL": "postgresql://...",
    "ANALYTICS_ENABLED": "true",
    "MONITORING_ENABLED": "true",
    "RATE_LIMITING_ENABLED": "true",
    "CACHE_ENABLED": "true"
  },
  "functions": {
    "memory": 768
  }
}
```

### 3. Production окружение
```json
{
  "env": {
    "NODE_ENV": "production",
    "DOMAIN": "dnb1st.ru",
    "DATABASE_URL": "postgresql://...",
    "ANALYTICS_ENABLED": "true",
    "MONITORING_ENABLED": "true",
    "RATE_LIMITING_ENABLED": "true",
    "CACHE_ENABLED": "true",
    "SSL_ENABLED": "true",
    "HSTS_ENABLED": "true"
  },
  "functions": {
    "memory": 1024
  }
}
```

## Мониторинг и логирование

### 1. Vercel Analytics
- Включен для всех окружений
- Отслеживание производительности
- Мониторинг ошибок

### 2. Sentry
- Настроен для staging и production
- Отслеживание ошибок в реальном времени
- Производительность приложения

### 3. Datadog
- Мониторинг инфраструктуры
- Аналитика пользовательского поведения
- Метрики производительности

## Безопасность

### 1. Заголовки безопасности
- **Production**: Полный набор заголовков безопасности
- **Staging**: Основные заголовки безопасности
- **Development**: Минимальный набор заголовков

### 2. SSL/TLS
- Все окружения используют HTTPS
- HSTS включен для production
- Сертификаты автоматически управляются Vercel

### 3. Rate Limiting
- **Production**: 50 запросов в минуту
- **Staging**: 100 запросов в минуту
- **Development**: Отключен

## Производительность

### 1. Кэширование
- **Production**: 1 год для статических файлов
- **Staging**: 1 час для API ответов
- **Development**: Отключено

### 2. Оптимизация изображений
- Автоматическая оптимизация через Vercel
- WebP формат для современных браузеров
- Адаптивные размеры

### 3. CDN
- **Production**: Глобальный CDN
- **Staging**: Региональный CDN
- **Development**: Локальная разработка

## Обслуживание и обновления

### 1. Регулярное обслуживание
- Обновление зависимостей
- Мониторинг безопасности
- Оптимизация производительности

### 2. Резервное копирование
- Автоматические бэкапы для production
- Ручное резервное копирование секретов
- Тестирование восстановления

### 3. Откат изменений
- Автоматический откат при ошибках
- Ручной откат через Environment Manager
- Версионирование деплоев

## Устранение неполадок

### 1. Распространенные проблемы

#### Проблема: Секреты не доступны
```bash
# Проверка наличия секретов
vercel env ls dev

# Валидация секретов
node scripts/secrets-manager.js validate dev
```

#### Проблема: Деплой не запускается
```bash
# Проверка ветки
git branch

# Проверка синтаксиса конфигурации
node -e "console.log(require('./vercel.dev.json'))"
```

#### Проблема: Ошибки сборки
```bash
# Локальная сборка
npm run build

# Проверка типов
npm run type-check
```

### 2. Отладка
```bash
# Просмотр логов деплоя
node scripts/environment-manager.js logs production

# Проверка статуса
node scripts/environment-manager.js status production

# Локальное тестирование
vercel --version
vercel whoami
```

## Лучшие практики

### 1. Управление секретами
- Никогда не храните секреты в коде
- Используйте Secrets Manager для управления
- Регулярно обновляйте секреты
- Создавайте резервные копии

### 2. Деплой
- Всегда тестируйте в staging перед production
- Используйте blue-green деплой для production
- Мониторьте после деплоя
- Имейте план отката

### 3. Безопасность
- Регулярно обновляйте зависимости
- Используйте последние версии SSL
- Мониторьте уязвимости
- Ограничьте доступ к секретам

### 4. Производительность
- Оптимизируйте изображения
- Используйте кэширование
- Мониторьте метрики
- Регулярно тестируйте нагрузку

## Поддержка

### 1. Внутренняя документация
- [CI/CD Setup Guide](../CI_CD_SETUP_GUIDE.md)
- [Environment Configuration](../environments.config.js)
- [Vercel Optimization Guide](../vercel-optimization-guide.md)

### 2. Внешние ресурсы
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)

### 3. Контакты
- DevOps команда: devops@normaldance.com
- Техническая поддержка: support@normaldance.com
- GitHub Issues: [Создать issue](https://github.com/normaldance/normaldance/issues)

---

*Последнее обновление: September 2024*
*Версия: 1.0.1*