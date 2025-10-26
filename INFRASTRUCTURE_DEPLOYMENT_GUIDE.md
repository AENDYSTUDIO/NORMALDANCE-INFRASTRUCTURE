# 🚀 Руководство по развертыванию инфраструктуры NormalDance

## Обзор

Это полное руководство по развертыванию и управлению инфраструктурой платформы NormalDance с использованием современных практик DevOps.

## 🏗️ Архитектура инфраструктуры

### Компоненты системы
- **Frontend**: Next.js 15 с TypeScript
- **Backend**: Next.js API Routes с Socket.IO
- **База данных**: PostgreSQL с Prisma ORM
- **Блокчейн**: Solana с кастомными программами
- **Хранение**: IPFS через Pinata
- **Деплой**: Vercel для фронтенда
- **Мониторинг**: Комплексный стек мониторинга

## 📋 Подготовка к развертыванию

### 1. Предварительные требования

Убедитесь, что у вас установлены:
- Node.js 18+
- Git
- Vercel CLI (`npm install -g vercel`)
- OpenSSL (для генерации секретов)

### 2. Настройка секретов

```bash
# Генерация безопасных секретов
chmod +x generate-secrets.sh
./generate-secrets.sh

# Следуйте инструкциям на экране
```

### 3. Проверка безопасности

```bash
# Запуск комплексной проверки безопасности
chmod +x security-check.sh
./security-check.sh
```

## 🚀 Процесс развертывания

### Этап 1: Подготовка окружения

```bash
# Установка зависимостей
npm ci

# Проверка типов
npm run type-check

# Сборка приложения
npm run build
```

### Этап 2: Развертывание на Vercel

#### Вариант 1: Автоматическое развертывание
```bash
# Автоматическое развертывание с проверками
chmod +x deploy-vercel.sh
./deploy-vercel.sh
```

#### Вариант 2: Ручное развертывание через Dashboard
1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Создайте новый проект
3. Импортируйте репозиторий `AENDYSTUDIO/NORMALDANCE-Enterprise`
4. Перейдите к ветке `release/v0.0.1`
5. Скопируйте переменные окружения из `VERCEL_ENV_PRODUCTION_OPTIMIZED.txt`
6. Разверните проект

### Этап 3: Настройка домена

1. В Vercel Dashboard перейдите в Settings > Domains
2. Добавьте кастомный домен: `normaldance.online`
3. Настройте DNS записи согласно инструкциям Vercel
4. Дождитесь выдачи SSL сертификата

### Этап 4: Пост-развертывание

```bash
# Комплексная проверка после развертывания
chmod +x post-deploy-verification.sh
./post-deploy-verification.sh
```

## 📊 Настройка мониторинга

### Автоматическая настройка мониторинга
```bash
# Запуск скрипта настройки мониторинга
chmod +x setup-monitoring.sh
./setup-monitoring.sh
```

### Рекомендуемые инструменты мониторинга

1. **Vercel Analytics** (автоматически включен)
   - Web Vitals мониторинг
   - Аналитика пользователей
   - Performance insights

2. **Sentry** для error tracking
   ```typescript
   // В вашем приложении
   import * as Sentry from '@sentry/nextjs'

   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     environment: process.env.NODE_ENV,
   })
   ```

3. **Uptime Monitoring**
   - Better Stack
   - Pingdom
   - StatusCake

## 🔒 Безопасность

### Автоматическая проверка безопасности
```bash
# Запуск security аудита
./security-check.sh
```

### Критические меры безопасности

1. **Секреты в коде**: Никогда не коммитьте секреты в Git
2. **Переменные окружения**: Используйте Vercel secrets для продакшена
3. **HTTPS Only**: Всегда используйте HTTPS в продакшене
4. **CORS**: Настройте правильные CORS политики
5. **Rate Limiting**: Внедрите rate limiting для API

## 🔧 Управление инфраструктурой

### Масштабирование

Автоматическое масштабирование настраивается в Vercel:
- **Автоскейлинг**: Автоматически на основе нагрузки
- **Регионы**: Глобальное распределение
- **Edge Functions**: Выполнение на edge для низкой задержки

### Резервное копирование

1. **База данных**: Настройте автоматическое резервное копирование
2. **IPFS контент**: Мульти-шлюз репликация
3. **Конфигурация**: Регулярное резервное копирование конфигов

## 🚨 Troubleshooting

### Распространенные проблемы

#### Build Errors
```bash
# Проверьте переменные окружения
vercel env ls

# Просмотрите логи сборки
vercel logs --follow
```

#### Runtime Errors
```bash
# Проверьте health check
curl https://normaldance.online/api/health

# Просмотрите function логи
vercel logs --function-logs
```

#### Database Issues
```bash
# Проверьте подключение к БД
npm run db:check

# Миграция базы данных
npm run db:migrate
```

## 📈 Производительность

### Оптимизации
1. **Изображения**: Используйте Next.js Image optimization
2. **Кеширование**: Настройте правильные cache headers
3. **CDN**: Используйте Vercel CDN для статических ресурсов
4. **Database**: Оптимизируйте запросы с индексами

### Мониторинг производительности
- Core Web Vitals через Vercel Analytics
- Кастомные метрики через Google Analytics
- Database performance monitoring

## 🔄 CI/CD Pipeline

### Автоматическое развертывание
Настроено через GitHub Actions в файле `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production
on:
  push:
    branches: [main, release/*]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: vercel/action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
```

## 📋 Чек-лист развертывания

### Перед развертыванием
- [ ] Все секреты сгенерированы (`./generate-secrets.sh`)
- [ ] Безопасность проверена (`./security-check.sh`)
- [ ] Переменные окружения настроены в Vercel
- [ ] Домены настроены и DNS распространяется
- [ ] База данных доступна и миграции готовы

### После развертывания
- [ ] Health check пройден
- [ ] Все API эндпоинты работают
- [ ] Telegram интеграция функционирует
- [ ] Мониторинг настроен
- [ ] SSL сертификат выдан
- [ ] Производительность в норме

### Мониторинг после запуска
- [ ] Мониторьте error rate первые 24 часа
- [ ] Следите за performance метриками
- [ ] Проверяйте логи на ошибки
- [ ] Тестируйте ключевые пользовательские сценарии

## 🆘 Поддержка

### Полезные команды
```bash
# Статус развертывания
vercel ls

# Логи в реальном времени
vercel logs --follow

# Откат версии (если нужно)
vercel rollback

# Просмотр переменных окружения
vercel env ls
```

### Контакты
- **DevOps Team**: devops@normaldance.online
- **Monitoring**: alerts@normaldance.online
- **Emergency**: emergency@normaldance.online

## 📚 Дополнительная документация

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Solana Integration Guide](https://docs.solana.com/)
- [Prisma Database Guide](https://www.prisma.io/docs/)

---

**Статус**: Готово к продакшен развертыванию
**Версия**: 1.0.0
**Последнее обновление**: $(date)