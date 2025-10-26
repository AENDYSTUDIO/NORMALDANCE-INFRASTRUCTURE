# NormalDance Microservices Platform

Полноценная Docker-инфраструктура для микросервисного проекта на основе сервисов: frontend (Next.js), backend (NestJS), IPFS, Reg.Ru интеграция, смарт-контракты и PostgreSQL.

## 🚀 Быстрый старт

### Разработка

```bash
# Запуск среды разработки
make dev

# Или вручную
docker compose -f docker-compose.yml -f docker-compose.override.yml --profile dev up -d
```

### Продакшн

```bash
# Сборка и запуск продакшн среды
make prod-build

# Или вручную
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile prod up -d --build
```

## 📋 Предварительные требования

- Docker 20.10+
- Docker Compose 2.0+
- Make (опционально)
- Node.js 18+ (для локальной разработки)

## 🏗️ Архитектура

### Сервисы

- **frontend** (Next.js): SSR/SPA приложение с TypeScript
- **backend** (NestJS): REST API с TypeScript
- **ipfs-service** (Go/Node.js): IPFS клиент для децентрализованного хранения
- **regru** (Node.js): Интеграция с Reg.Ru API
- **smart-contracts** (Hardhat): Solidity смарт-контракты
- **postgres**: Основная база данных
- **redis**: Кэширование и сессии
- **traefik**: Reverse proxy с автоматическим TLS
- **prometheus/grafana/loki**: Мониторинг и логирование

### Сети

- `web`: Публичный трафик через Traefik
- `backend-db`: Внутренняя сеть для БД
- `ipfs-internal`: IPFS сеть
- `monitoring`: Мониторинг стек

## 🔧 Конфигурация

### Переменные окружения

Создайте файлы `.env` на основе примеров:

```bash
cp .env.example .env
cp .env.development.example .env.development
cp .env.production.example .env.production
```

### Секреты

Для продакшна настройте Docker secrets:

```bash
echo "your-secret" | docker secret create db_password -
echo "your-jwt-secret" | docker secret create jwt_secret -
```

## 🛠️ Команды Makefile

```bash
# Разработка
make dev              # Запуск dev среды
make dev-build        # Сборка и запуск dev
make dev-logs         # Логи dev среды
make dev-down         # Остановка dev

# Продакшн
make prod             # Запуск prod среды
make prod-build       # Сборка и запуск prod
make prod-logs        # Логи prod среды
make prod-down        # Остановка prod

# Сборка
make build            # Сборка всех сервисов
make build-prod       # Продакшн сборка с multi-arch
make build-nextjs     # Сборка только Next.js
make build-backend    # Сборка только backend

# Тестирование
make test             # Все тесты
make test-unit        # Unit тесты
make test-e2e         # E2E тесты
make test-integration # Интеграционные тесты

# Качество кода
make lint             # ESLint
make typecheck        # TypeScript проверка
make format           # Prettier форматирование

# Безопасность
make scan             # Trivy сканирование
make sbom             # Генерация SBOM

# Деплой
make deploy-dev       # Деплой в dev
make deploy-staging   # Деплой в staging
make deploy-prod      # Деплой в prod
make rollback         # Откат версии

# База данных
make db-migrate       # Миграции БД
make db-seed          # Начальные данные
make db-reset         # Сброс БД

# Мониторинг
make monitoring       # Запуск мониторинга
make monitoring-logs  # Логи мониторинга

# Утилиты
make clean            # Очистка контейнеров
make clean-all        # Полная очистка
make logs             # Все логи
make status           # Статус сервисов
make health           # Проверка здоровья
```

## 🌐 Доступ к сервисам

### Разработка

- Frontend: http://localhost:3000
- API: http://localhost:4000
- PGAdmin: http://localhost:5050
- MailHog: http://localhost:8025
- Traefik Dashboard: http://localhost:8080

### Продакшн

- Frontend: https://frontend.example.com
- API: https://api.example.com
- Prometheus: https://prometheus.example.com
- Grafana: https://grafana.example.com
- Traefik Dashboard: https://traefik.example.com

## 🔒 Безопасность

### Dockerfile безопасность

- Non-root пользователи (UID 1001)
- Минимальные базовые образы (Alpine, Distroless)
- Удаление dev зависимостей в runtime
- HEALTHCHECK декларативно
- Drop capabilities в проде

### Secrets management

- Docker secrets для продакшна
- File-based для разработки
- Нет hardcoded credentials
- Валидация переменных на старте

### Мониторинг безопасности

- Trivy сканирование уязвимостей
- SBOM генерация
- Cosign подпись образов
- Audit logs

## 📊 Мониторинг

### Метрики

- Prometheus scraping всех сервисов
- Node.js metrics endpoint
- PostgreSQL exporter
- cAdvisor для контейнеров

### Логи

- Loki для агрегации логов
- Promtail для сбора
- JSON structured logging
- Trace ID корреляция

### Dashboards

- Grafana с преднастроенными дашбордами
- Node.js app metrics (ID 1860)
- PostgreSQL metrics (ID 9628)
- Traefik metrics
- Custom dashboards для latency/errors

## 🚢 Деплой

### CI/CD

- GitHub Actions workflow
- Multi-arch сборки (amd64/arm64)
- Docker cache для быстрой сборки
- Security scanning
- Auto deploy на merge

### Production deployment

```bash
# На сервере
git clone <repo>
cd normaldance
cp .env.production.example .env.production
# Настроить .env.production
make prod-build
make deploy-prod
```

### Rollback

```bash
make rollback
# Или вручную
docker tag old-image:latest current-service:latest
docker compose up -d current-service
```

## 🧪 Тестирование

### Локальное тестирование

```bash
npm run test:unit      # Unit тесты
npm run test:e2e       # E2E тесты
npm run test:int       # Интеграционные
```

### CI тестирование

- Автоматический запуск на push/PR
- Coverage >80%
- E2E на docker-compose
- Security scan fail on CRITICAL

## 📈 Масштабирование

### Horizontal scaling

```bash
# Масштабирование backend
docker compose up -d --scale backend=5

# Масштабирование IPFS
docker compose up -d --scale ipfs-service=3
```

### Resource limits

- CPU/Memory limits per service
- Health-based scaling
- Rolling updates с zero-downtime

## 🔧 Troubleshooting

### Логи

```bash
# Все логи
make logs

# Логи конкретного сервиса
docker compose logs backend

# Follow логи
docker compose logs -f backend
```

### Health checks

```bash
# Проверка здоровья
make health

# Ручная проверка
curl http://localhost:4000/health
```

### Debug режим

```bash
# Backend debug
docker compose exec backend npm run start:debug

# Next.js debug
docker compose exec nextjs npm run dev:debug
```

## 📚 Документация

- [API Documentation](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Security Guidelines](./docs/security.md)
- [Monitoring Guide](./docs/monitoring.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Run tests: `make test`
5. Lint: `make lint`
6. Create PR

## 📄 Лицензия

MIT License - see [LICENSE](LICENSE) file.

## 🆘 Поддержка

- Issues: [GitHub Issues](https://github.com/your-org/normaldance/issues)
- Docs: [Documentation](./docs/)
- Chat: [Discord/TG link]

---

**Happy coding! 🎵🎨**
