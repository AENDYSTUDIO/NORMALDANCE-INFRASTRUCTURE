# 🚀 NORMAL DANCE - Развертывание на REG.RU сервере

## Обзор

Этот документ содержит полную инструкцию по развертыванию платформы NORMAL DANCE на сервере REG.RU с использованием панели управления Ispmanager.

## 📋 Данные доступа

### Панель управления
- **Адрес**: `https://server172.hosting.reg.ru:1500/`
- **Логин**: `u3284463`
- **Пароль**: `[УКАЖИТЕ_ПАРОЛЬ_ПАНЕЛИ]`

### Сервер
- **IP адрес**: `31.31.196.214`
- **SSH логин**: `u3284463`
- **SSH пароль**: `[УКАЖИТЕ_SSH_ПАРОЛЬ]`

### FTP доступ
- **Сервер**: `31.31.196.214`
- **Логин**: `u3284463`
- **Пароль**: `[УКАЖИТЕ_FTP_ПАРОЛЬ]`

### База данных
- **Сервер**: `localhost`
- **Логин**: `u3284463_default`
- **Пароль**: `[УКАЖИТЕ_БД_ПАРОЛЬ]`
- **База данных**: `u3284463_default`

## 🏗️ Архитектура развертывания

```
┌─────────────────────────────────────────────────────────┐
│                    REG.RU сервер                        │
│               IP: 31.31.196.214                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Nginx     │  │  Node.js    │  │    MySQL        │  │
│  │   (Прокси)   │  │   (PM2)     │  │   (База)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Панель управления: https://server172.hosting.reg.ru:1500 │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Быстрое развертывание

### Автоматическое развертывание

```bash
# 1. Клонирование репозитория
git clone https://github.com/AENDYSTUDIO/NORMALDANCE-REVOLUTION.git
cd NORMALDANCE-REVOLUTION

# 2. Редактирование паролей в скрипте
nano scripts/regru-production-deploy.sh
# Укажите реальные пароли в начале файла

# 3. Запуск развертывания
chmod +x scripts/regru-production-deploy.sh
./scripts/regru-production-deploy.sh

# 4. Тестирование развертывания
./scripts/test-regru-deployment.sh
```

### Ручное развертывание через панель управления

#### Шаг 1: Настройка базы данных
1. Зайдите в панель управления
2. Перейдите в **"Базы данных" → "Базы данных"**
3. Найдите базу `u3284463_default`
4. Запомните пароль или смените его

#### Шаг 2: Загрузка файлов
1. Подключитесь по FTP к `31.31.196.214`
2. Загрузите файлы проекта в директорию `/normaldance.ru/`
3. Создайте файл `.env` с настройками

#### Шаг 3: Настройка веб-сервера
1. **"WWW" → "Домены"**
2. Добавьте домены `normaldance.ru` и `normaldance.online`
3. Настройте DNS записи

#### Шаг 4: Получение SSL сертификата
1. **"WWW" → "SSL сертификаты"**
2. Добавьте сертификат для доменов `normaldance.ru`

## 📁 Структура файлов на сервере

```
/var/www/u3284463/data/www/
├── normaldance.ru/           # Основное приложение
│   ├── src/                 # Исходный код
│   ├── public/              # Статические файлы
│   ├── logs/                # Логи приложения
│   │   ├── combined.log     # Все логи
│   │   ├── err.log          # Логи ошибок
│   │   └── out.log          # Стандартный вывод
│   ├── .env                 # Конфигурация
│   ├── package.json         # Зависимости
│   ├── ecosystem.config.js  # Конфигурация PM2
│   └── server.js           # Точка входа
├── normaldance.online/      # Перенаправление
└── backups/                 # Резервные копии
    ├── db-backup-*.sql      # Бэкапы базы данных
    └── app-backup-*.tar.gz  # Бэкапы приложения

/var/log/
├── nginx/                   # Логи Nginx
│   ├── normaldance.ru_access.log
│   └── normaldance.ru_error.log
└── mysql/                   # Логи MySQL

/etc/nginx/sites-available/  # Конфигурации Nginx
├── normaldance.ru
└── normaldance.online
```

## ⚙️ Конфигурация

### Переменные окружения (.env)

```bash
# Database
DATABASE_URL="mysql://u3284463_default:[ПАРОЛЬ]@localhost:3306/u3284463_default"

# Server
NODE_ENV="production"
PORT=3000
HOSTNAME="0.0.0.0"

# Application URLs
NEXT_PUBLIC_APP_URL="https://normaldance.ru"
NEXT_PUBLIC_WS_URL="wss://normaldance.ru"

# Security
JWT_SECRET="[БЕЗОПАСНЫЙ_СЕКРЕТ]"

# Blockchain
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
TON_RPC_URL="https://ton.org/api/v2/jsonRPC"

# IPFS
IPFS_GATEWAY_URL="https://gateway.pinata.cloud"
```

### Конфигурация Nginx

Основные настройки оптимизированы для:
- Безопасности (Security Headers)
- Производительности (кеширование)
- Надежности (таймауты)

## 🔧 Управление приложением

### Через PM2

```bash
# Статус приложения
pm2 status

# Логи приложения
pm2 logs normaldance

# Перезапуск приложения
pm2 restart normaldance

# Остановка приложения
pm2 stop normaldance

# Мониторинг
pm2 monit
```

### Через панель управления

1. **"Инструменты" → "Процессы"**
2. Найдите процессы `node` и `nginx`
3. Используйте кнопки управления

### Через SSH

```bash
# Подключение к серверу
ssh u3284463@31.31.196.214

# Навигация к проекту
cd /var/www/u3284463/data/www/normaldance.ru

# Статус PM2
pm2 status

# Логи в реальном времени
pm2 logs --lines 50
```

## 📊 Мониторинг и логи

### Системный мониторинг

#### Через панель управления
1. **"Инструменты" → "Информация о сервере"**
2. Мониторьте:
   - Загрузку CPU
   - Использование памяти
   - Место на диске
   - Сетевую активность

#### Через SSH команды
```bash
# Общая информация
htop

# Использование диска
df -h

# Использование памяти
free -h

# Загрузка системы
uptime
```

### Логи приложения

#### Просмотр логов
```bash
# Последние логи приложения
tail -f /var/www/u3284463/data/www/normaldance.ru/logs/combined.log

# Логи ошибок
tail -f /var/www/u3284463/data/www/normaldance.ru/logs/err.log

# Логи Nginx
tail -f /var/log/nginx/normaldance.ru_access.log
```

#### Ротация логов
```bash
# Ручная ротация
mv /var/www/u3284463/data/www/normaldance.ru/logs/combined.log \
   /var/www/u3284463/data/www/normaldance.ru/logs/combined.log.$(date +%Y%m%d%H%M%S)

# Перезапуск логирования PM2
pm2 reloadLogs
```

### Автоматический мониторинг

Скрипт мониторинга запускается каждую минуту:

```bash
# Запуск мониторинга вручную
./monitoring/regru-server-monitoring.sh

# Просмотр отчета мониторинга
cat /var/www/u3284463/logs/monitoring.log
```

## 🔒 Безопасность

### Firewall настройки

#### Через панель управления
1. **"Безопасность" → "Firewall"**
2. Разрешите порты:
   - 80 (HTTP)
   - 443 (HTTPS)
   - 22 (SSH)
   - 21 (FTP)

#### Через SSH
```bash
# Проверка firewall
sudo ufw status

# Добавление правил
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
```

### Fail2Ban защита

#### Через панель управления
1. **"Безопасность" → "Fail2Ban"**
2. Включите защиту для SSH

#### Проверка заблокированных IP
```bash
# Статус fail2ban
sudo fail2ban-client status ssh

# Список заблокированных IP
sudo fail2ban-client status ssh | grep "Currently failed"
```

### SSL сертификаты

#### Получение сертификата
```bash
# Через панель управления
WWW → SSL сертификаты → Добавить сертификат

# Или через командную строку
sudo certbot --nginx -d normaldance.ru -d www.normaldance.ru
```

#### Проверка сертификата
```bash
# Проверка срока действия
sudo certbot certificates

# Обновление сертификата
sudo certbot renew --dry-run
```

## 💾 Резервное копирование

### Автоматическое резервное копирование

Настроено ежедневно в 2:00:
- Бэкап базы данных
- Бэкап файлов приложения
- Хранение 7 дней

### Ручное резервное копирование

#### База данных
```bash
# Создание дампа базы данных
mysqldump -h localhost -u u3284463_default -p u3284463_default > backup-$(date +%Y%m%d).sql

# Сжатие дампа
gzip backup-$(date +%Y%m%d).sql
```

#### Файлы приложения
```bash
# Создание архива
cd /var/www/u3284463/data/www/normaldance.ru
tar -czf /var/www/u3284463/backups/app-backup-$(date +%Y%m%d).tar.gz \
    . --exclude=./node_modules --exclude=./.next/cache --exclude=./logs
```

### Восстановление из резервной копии

#### База данных
```bash
# Восстановление базы данных
mysql -h localhost -u u3284463_default -p u3284463_default < backup.sql
```

#### Файлы приложения
```bash
# Извлечение архива
cd /var/www/u3284463/data/www/normaldance.ru
tar -xzf /var/www/u3284463/backups/app-backup-*.tar.gz
```

## 🚨 Устранение неисправностей

### Диагностика проблем

#### Шаг 1: Проверка доступности
```bash
# Проверка домена
curl -I http://normaldance.ru

# Проверка приложения
curl -I http://31.31.196.214:3000/api/health

# Проверка базы данных
mysql -h localhost -u u3284463_default -p -e 'SELECT 1'
```

#### Шаг 2: Проверка сервисов
```bash
# Статус сервисов
sudo systemctl status nginx mysql

# Процессы PM2
pm2 status
pm2 jlist

# Проверка портов
netstat -tlnp | grep -E ':(80|3000|3306)'
```

#### Шаг 3: Анализ логов
```bash
# Поиск ошибок
tail -f /var/log/nginx/normaldance.ru_error.log | grep -i error

# Поиск в логах приложения
tail -f /var/www/u3284463/data/www/normaldance.ru/logs/combined.log | grep -i error

# Поиск атак
tail -f /var/log/fail2ban.log | grep Ban
```

### Распространенные проблемы

#### Проблема: Сайт недоступен
```bash
# Диагностика
sudo systemctl status nginx
sudo nginx -t
pm2 status
netstat -tlnp | grep :80

# Решение
sudo systemctl restart nginx
pm2 restart normaldance
```

#### Проблема: Ошибки базы данных
```bash
# Диагностика
sudo systemctl status mysql
mysql -h localhost -u u3284463_default -p -e 'SHOW PROCESSLIST'

# Решение
sudo systemctl restart mysql
# Проверьте размер базы данных и оптимизируйте таблицы
```

#### Проблема: Высокая нагрузка
```bash
# Диагностика
htop
ps aux --sort=-%cpu | head -10

# Решение
# Найдите и остановите ресурсоемкие процессы
pm2 restart normaldance
```

## 📞 Поддержка и контакты

### Техническая поддержка REG.RU
- **Телефон**: +7 (495) 580-11-11
- **Email**: support@reg.ru
- **Личный кабинет**: https://www.reg.ru/
- **Статус сервисов**: https://status.reg.ru/

### Экстренные ситуации
1. Если сервер недоступен: проверьте статус на https://status.reg.ru/
2. Если панель управления недоступна: используйте SSH
3. Если потеряны доступы: обратитесь в поддержку с документами

## 📚 Документация

### Основные руководства
- [Руководство по панели управления](./REGRU_ISPMANAGER_GUIDE.md)
- [Процесс развертывания](./DEPLOYMENT_PROCESS.md)
- [Мониторинг сервера](./monitoring/regru-server-monitoring.sh)
- [Тестирование развертывания](./scripts/test-regru-deployment.sh)

### Скрипты автоматизации
- [Основной деплой](./scripts/regru-production-deploy.sh)
- [Простой деплой](./scripts/regru-deploy.sh)
- [Тестирование](./scripts/test-regru-deployment.sh)
- [Мониторинг](./monitoring/regru-server-monitoring.sh)

### Конфигурации
- [Docker конфигурация](./docker/regru.Dockerfile)
- [Nginx конфигурация](./nginx/regru.conf)
- [Настройка базы данных](./db/regru-mysql-setup.sql)
- [Entrypoint скрипт](./scripts/entrypoint.sh)

## 🔄 Обновление приложения

### Автоматическое обновление

```bash
# 1. Создание резервной копии
./scripts/regru-production-deploy.sh

# 2. Тестирование
./scripts/test-regru-deployment.sh

# 3. Мониторинг после обновления
./monitoring/regru-server-monitoring.sh
```

### Ручное обновление

```bash
# 1. Подключение к серверу
ssh u3284463@31.31.196.214

# 2. Переход в директорию проекта
cd /var/www/u3284463/data/www/normaldance.ru

# 3. Создание резервной копии
cp .env .env.backup

# 4. Получение обновлений
git fetch origin
git reset --hard origin/main

# 5. Установка зависимостей
npm ci

# 6. Применение миграций базы данных
npm run db:migrate

# 7. Сборка приложения
npm run build

# 8. Перезапуск приложения
pm2 restart normaldance

# 9. Проверка
curl -f http://localhost:3000/api/health
```

## 📈 Производительность

### Оптимизация

#### Веб-сервер
```bash
# Настройка Nginx
sudo nano /etc/nginx/nginx.conf

# Параметры для оптимизации
worker_processes auto;
worker_rlimit_nofile 1024;
```

#### База данных
```sql
-- Оптимизация таблиц
OPTIMIZE TABLE users;
OPTIMIZE TABLE tracks;
ANALYZE TABLE tracks;

-- Создание индексов
CREATE INDEX idx_tracks_created_at ON tracks(created_at);
CREATE INDEX idx_users_wallet ON users(wallet_address);
```

#### Приложение
```bash
# Мониторинг памяти
pm2 monit

# Настройка лимитов памяти
pm2 restart normaldance --max-memory-restart 1G
```

### Мониторинг производительности

```bash
# Системная производительность
htop
vmstat 1 10
iostat -x 1 10

# Производительность приложения
curl -w "@curl-format.txt" -o /dev/null -s "http://normaldance.ru"

# Производительность базы данных
mysql -h localhost -u u3284463_default -p -e 'SHOW ENGINE INNODB STATUS\G'
```

## 🎯 Чек-лист после развертывания

### ✅ Обязательные проверки

- [ ] Домены `normaldance.ru` и `normaldance.online` работают
- [ ] SSL сертификат установлен и действителен
- [ ] Приложение отвечает на health check
- [ ] База данных доступна и содержит таблицы
- [ ] Резервное копирование настроено
- [ ] Мониторинг работает
- [ ] Логи приложения корректны

### 🔧 Рекомендуемые настройки

- [ ] Firewall настроен правильно
- [ ] Fail2Ban активен
- [ ] Мониторинг уведомлений настроен
- [ ] Регулярное резервное копирование проверено
- [ ] Производительность оптимизирована

### 📊 Мониторинг после запуска

- [ ] Загрузка CPU < 80%
- [ ] Память < 85%
- [ ] Диск < 90%
- [ ] Время ответа < 2 секунд
- [ ] Error rate < 1%

---

*Последнее обновление: $(date +%Y-%m-%d)*
*Следуйте этим инструкциям для успешного развертывания и эксплуатации NORMAL DANCE на REG.RU сервере*