# Настройка автоматического переключения окружений для NORMALDANCE

## Введение

Этот документ описывает настройку автоматического переключения окружений при пуше в ветки для NORMALDANCE проекта. Система автоматически деплоит приложение в соответствующие окружения на основе Git-веток.

## Архитектура

### Ветки и окружения

| Ветка | Окружение | Описание | Автоматический деплой |
|-------|-----------|----------|----------------------|
| `main` | Production | Производственное окружение | ✅ |
| `develop` | Development | Окружение для разработки | ✅ |
| `release/*` | Staging | Стейджинг окружение | ✅ |

### Триггеры

- **Push в ветку `main`** → Деплой в Production
- **Push в ветку `develop`** → Деплой в Development
- **Push в ветку `release/*`** → Деплой в Staging
- **Pull Request** → Запуск тестов и проверок
- **Релиз GitHub** → Создание релиза и обновление версии

## Настройка окружений

### 1. GitHub Secrets

Необходимо настроить следующие секреты в настройках репозитория GitHub:

```bash
# Vercel
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID

# Kubernetes (для staging и production)
KUBE_CONFIG_STAGING
KUBE_CONFIG_PRODUCTION

# Базы данных
DATABASE_URL_STAGING
DATABASE_URL_PRODUCTION

# Solana RPC
SOLANA_RPC_URL_STAGING
SOLANA_RPC_URL_PRODUCTION

# NextAuth
NEXTAUTH_URL_STAGING
NEXTAUTH_SECRET_STAGING
NEXTAUTH_URL_PRODUCTION
NEXTAUTH_SECRET_PRODUCTION

# Мониторинг
SENTRY_DSN
DATADOG_API_KEY

# Уведомления
SLACK_WEBHOOK

# Mobile App
EXPO_TOKEN
EAS_UPDATE_SECRET

# Безопасность
SNYK_TOKEN
```

### 2. Vercel Configuration

Проект использует Vercel для деплоя. Убедитесь, что:

1. Проект подключен к Vercel
2. Настроены переменные окружения для каждого окружения
3. Настроены домены для каждого окружения

#### Файлы конфигурации:

- [`vercel.dev.json`](../vercel.dev.json) - Development окружение
- [`vercel.staging.json`](../vercel.staging.json) - Staging окружение
- [`vercel.prod.json`](../vercel.prod.json) - Production окружение

### 3. Kubernetes Configuration

Для staging и production окружений используется Kubernetes:

- **Staging**: Kubernetes кластер для тестирования
- **Production**: Kubernetes кластер для продакшена

#### Helm чарты:

- [`helm/normaldance/`](../helm/normaldance/) - Конфигурация Helm чарта
- [`k8s/`](../k8s/) - Kubernetes manifests

## Автоматизация деплоя

### GitHub Actions Workflow

Основной CI/CD пайплайн находится в [`.github/workflows/ci-cd-optimized.yml`](../.github/workflows/ci-cd-optimized.yml).

#### Основные этапы:

1. **Code Quality Checks** - Проверка качества кода
2. **Unit and Integration Tests** - Тесты
3. **Mobile App Tests** - Тесты мобильного приложения
4. **Build Application** - Сборка приложения
5. **Security Scans** - Сканирование безопасности
6. **Performance Testing** - Тестирование производительности
7. **Determine Environment** - Определение окружения
8. **Deploy to Vercel** - Деплой в Vercel
9. **Deploy to Staging** - Деплой в staging
10. **Deploy to Production** - Деплой в production
11. **Database Migration** - Миграции базы данных
12. **Mobile App Deployment** - Деплой мобильного приложения
13. **Generate Release Notes** - Генерация релизных заметок
14. **Create GitHub Release** - Создание GitHub релиза
15. **Update Version** - Обновление версии
16. **Notification** - Уведомления

### Скрипты управления

#### Environment Manager

Скрипт [`scripts/environment-manager.js`](../scripts/environment-manager.js) управляет окружениями:

```bash
# Деплой в конкретное окружение
npm run env:deploy <environment>

# Автоматический деплой на основе текущей ветки
npm run env:auto-deploy

# Промоут окружения
npm run env:promote <from> <to>

# Откат окружения
npm run env:rollback <environment>

# Статус окружения
npm run env:status <environment>

# Логи окружения
npm run env:logs <environment>
```

#### Version Manager

Скрипт [`scripts/version-manager.js`](../scripts/version-manager.js) управляет версиями:

```bash
# Бамп версии
npm run version [patch|minor|major]

# Текущая версия
npm run version:current

# Отчет по версиям
npm run version:report

# Список тегов
npm run version:tags

# Генерация changelog
npm run version:report

# Создание релиза
npm run version:release
```

#### Deployment Rules

Скрипт [`scripts/deployment-rules.js`](../scripts/deployment-rules.js) определяет правила деплоя:

```bash
# Валидация правил
npm run env:validate

# Проверка правил для окружения
npm run env:check <environment>

# Список всех правил
npm run env:list

# Тестирование правил
npm run env:test
```

## Предварительные проверки

### Production деплой

Перед деплоем в production выполняются следующие проверки:

1. **Проверка ветки**: Только ветка `main` может деплоиться в production
2. **Секреты**: Проверка наличия всех необходимых секретов
3. **Валидация окружения**: Проверка конфигурации окружения
4. **Полные тесты**: Запуск всех тестов
5. **Безопасность**: Полное сканирование безопасности
6. **Производительность**: Тестирование производительности

### Staging деплой

Для staging окружения:

1. **Проверка ветки**: Ветки `release/*`
2. **Основные тесты**: Unit, integration, E2E тесты
3. **Безопасность**: Основное сканирование безопасности
4. **Сборка**: Полная сборка приложения

### Development деплой

Для development окружения:

1. **Проверка ветки**: Ветка `develop`
2. **Быстрая сборка**: Упрощенная сборка без оптимизаций
3. **Основные тесты**: Только unit тесты
4. **Минимальная безопасность**: Отключено для скорости

## Уведомления

### Slack уведомления

Настройте Slack webhook для получения уведомлений о деплоях:

1. Создайте Incoming Webhook в Slack
2. Добавьте секрет `SLACK_WEBHOOK` в GitHub
3. Настройте канал для уведомлений

### Уведомления содержат:

- Статус деплоя (успех/ошибка)
- Окружение
- URL деплоя
- Preview URL
- Информация о релизе
- Версия приложения

## Управление версиями и релизами

### Автоматическое обновление версий

При пуше в `main` ветку:

1. Автоматический бамп версии (patch)
2. Генерация changelog
3. Создание GitHub релиза
4. Пуш тегов

### Ручное управление версиями

Для ручного управления:

```bash
# Бамп версии
npm run version:patch
npm run version:minor
npm run version:major

# Создание релиза
npm run version:release
```

### Changelog

Changelog автоматически генерируется на основе коммитов. Формат коммитов:

```
feat: добавление новой функции
fix: исправление бага
docs: обновление документации
style: форматирование кода
refactor: рефакторинг
test: добавление тестов
chore: обновление зависимостей
```

## Откаты и отмена деплоев

### Откат окружения

```bash
# Откат окружения
npm run env:rollback <environment>

# Промпт для подтверждения
npm run env:rollback <environment> --confirm
```

### Отмена деплоя

Если деплой завершился с ошибкой, система автоматически:

1. Отправляет уведомление об ошибке
2. Откатывает предыдущий успешный деплой
3. Логирует ошибку для анализа

## Мониторинг и логирование

### Логирование

Все деплои логируются в:

- GitHub Actions logs
- Vercel dashboard
- Kubernetes logs
- Sentry (для ошибок)

### Мониторинг

Настроен мониторинг через:

- Sentry для ошибок
- Datadog для метрик
- Vercel Analytics для производительности
- Kubernetes Health Checks

## Тестирование

### Автоматические тесты

На каждом пуше запускаются:

- Unit тесты
- Интеграционные тесты
- E2E тесты
- Тесты мобильного приложения
- Тесты безопасности

### Ручное тестирование

После деплоя в production:

- Функциональное тестирование
- Производительность
- Безопасность
- Совместимость

## Troubleshooting

### Проблемы с деплоем

1. **Проверьте логи**: GitHub Actions logs
2. **Проверьте секреты**: Все ли секреты настроены
3. **Проверьте окружение**: Валидация через `npm run env:validate`
4. **Проверьте тесты**: Все ли тесты проходят

### Проблемы с Vercel

1. **Проверьте конфигурацию**: Vercel dashboard
2. **Проверьте переменные окружения**: Vercel > Settings > Environment Variables
3. **Проверьте домены**: Vercel > Settings > Domains

### Проблемы с Kubernetes

1. **Проверьте конфигурацию**: `kubectl config current-context`
2. **Проверьте доступ**: `kubectl get pods`
3. **Проверьте логи**: `kubectl logs <pod-name>`

## Безопасность

### Секреты

- Все секреты хранятся в GitHub Secrets
- Никакие секреты не хранятся в коде
- Используются managed secrets для Vercel и Kubernetes

### Сканирование безопасности

- Регулярное сканирование уязвимостей
- Проверка зависимостей
- Code security analysis

## Оптимизация

### Кеширование

- Docker build cache
- NPM cache
- Vercel build cache

### Параллельные задачи

- Тесты запускаются параллельно
- Сборка и деплой параллельные
- Мобильные тесты отдельно

## Заключение

Эта система автоматического переключения окружений обеспечивает:

- Автоматизацию деплоев
- Гарантию качества
- Безопасность
- Мониторинг
- Откат при ошибках

Для вопросов и поддержки обращайтесь к команде DevOps.