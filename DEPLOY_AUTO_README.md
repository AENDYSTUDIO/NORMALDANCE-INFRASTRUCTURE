# 🚀 NORMALDANCE - Автоматический Деплой

## Описание

Полностью автоматизированный деплой NORMALDANCE на VPS сервер Debian 12.

**Один скрипт делает всё:**
- ✅ Настройка сервера (Node.js, PM2, Nginx, PostgreSQL)
- ✅ Загрузка и сборка проекта
- ✅ Настройка базы данных
- ✅ Получение SSL сертификатов
- ✅ Настройка firewall
- ✅ Автобэкапы
- ✅ Мониторинг

## Требования

### На локальной машине:
- Bash (Git Bash на Windows, Terminal на Mac/Linux)
- `sshpass` (устанавливается автоматически)
- Доступ в интернет

### На сервере:
- Debian 12
- Root доступ
- Открытые порты: 22, 80, 443

## Быстрый старт

### 1. Подготовка (одна команда)

```bash
chmod +x scripts/*.sh scripts/deploy-config/*.sh
```

### 2. Запуск деплоя (одна команда)

```bash
bash scripts/deploy-auto.sh
```

**Всё!** Скрипт сам:
1. Подключится к серверу
2. Упакует и загрузит проект
3. Настроит всё необходимое
4. Запустит приложение
5. Получит SSL сертификаты

**Время выполнения:** ~10-15 минут

### 3. Проверка

```bash
bash scripts/deploy-test.sh
```

## Конфигурация

Все настройки в `scripts/deploy-auto.sh`:

```bash
SERVER_IP="89.104.67.165"           # IP вашего сервера
SERVER_USER="root"                  # SSH пользователь
SERVER_PASSWORD="Ll6DLuwyKalfvGbF"  # SSH пароль
DOMAIN_PRIMARY="normaldance.ru"     # Основной домен
DOMAIN_SECONDARY="normaldance.online" # Дополнительный домен
SSL_EMAIL="admin@normaldance.ru"    # Email для SSL
```

## После деплоя

### Обязательные действия:

1. **Настройте DNS**
   ```
   A    @    89.104.67.165
   A    www  89.104.67.165
   ```

2. **Настройте .env.production** на сервере:
   ```bash
   ssh root@89.104.67.165
   nano /var/www/normaldance/.env.production
   ```
   
   Обновите:
   - `PINATA_API_KEY` - получите на https://pinata.cloud
   - `PINATA_SECRET_API_KEY`
   - `PINATA_JWT`
   - `SENTRY_DSN` - опционально, для мониторинга ошибок

3. **Перезапустите приложение**:
   ```bash
   ssh root@89.104.67.165 'pm2 restart normaldance'
   ```

## Полезные команды

### Логи приложения
```bash
ssh root@89.104.67.165 'pm2 logs normaldance'
```

### Статус приложения
```bash
ssh root@89.104.67.165 'pm2 status'
```

### Рестарт
```bash
ssh root@89.104.67.165 'pm2 restart normaldance'
```

### Логи Nginx
```bash
ssh root@89.104.67.165 'tail -f /var/log/nginx/normaldance-error.log'
```

### Мониторинг в реальном времени
```bash
ssh root@89.104.67.165 'pm2 monit'
```

## Обновление приложения

```bash
# На локальной машине
cd /path/to/NORMALDANCE
git pull
bash scripts/deploy-auto.sh  # Автоматически обновит на сервере
```

## Бэкапы

Автоматические бэкапы запускаются каждый день в 3:00 UTC.

### Ручной бэкап:
```bash
ssh root@89.104.67.165 '/root/backup-normaldance.sh'
```

### Восстановление из бэкапа:
```bash
ssh root@89.104.67.165
cd /backups/normaldance
# Восстановление БД
gunzip < db_YYYYMMDD_HHMMSS.sql.gz | psql -U normaldance normaldance
# Восстановление файлов
tar -xzf files_YYYYMMDD_HHMMSS.tar.gz -C /var/www/
pm2 restart normaldance
```

## Структура скриптов

```
scripts/
├── deploy-auto.sh              # Главный скрипт деплоя
├── server-setup.sh             # Скрипт настройки сервера
├── deploy-test.sh              # Тестирование после деплоя
└── deploy-config/
    ├── nginx.conf              # Конфиг Nginx
    ├── ecosystem.config.js     # Конфиг PM2
    └── backup.sh               # Скрипт бэкапа
```

## Troubleshooting

### Проблема: SSL не получен
**Решение:** Проверьте DNS настройки:
```bash
nslookup normaldance.ru
```
Должен показывать 89.104.67.165

### Проблема: Приложение не запускается
**Решение:** Проверьте логи:
```bash
ssh root@89.104.67.165 'pm2 logs normaldance --lines 50'
```

### Проблема: 502 Bad Gateway
**Решение:** 
1. Проверьте, запущено ли приложение: `pm2 status`
2. Проверьте логи Nginx: `tail -f /var/log/nginx/normaldance-error.log`
3. Перезапустите: `pm2 restart normaldance && systemctl restart nginx`

### Проблема: Не подключается к серверу
**Решение:**
1. Проверьте IP и пароль в `deploy-auto.sh`
2. Проверьте доступность сервера: `ping 89.104.67.165`
3. Проверьте SSH порт: `telnet 89.104.67.165 22`

## Безопасность

После первого деплоя рекомендуется:

1. **Сменить root пароль**:
   ```bash
   ssh root@89.104.67.165 'passwd'
   ```

2. **Настроить SSH ключи** (вместо пароля)

3. **Отключить root логин по паролю**:
   ```bash
   ssh root@89.104.67.165
   sed -i 's/#PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
   systemctl restart sshd
   ```

4. **Настроить fail2ban**:
   ```bash
   apt install fail2ban
   systemctl enable fail2ban
   ```

## Мониторинг

Рекомендуемые сервисы:
- **Sentry** (ошибки): https://sentry.io
- **UptimeRobot** (доступность): https://uptimerobot.com
- **Datadog** (метрики): https://www.datadoghq.com

## Поддержка

Документация: https://github.com/AENDYSTUDIO/NORMAL-DANCE
Issues: https://github.com/AENDYSTUDIO/NORMAL-DANCE/issues

---

**Готово! Теперь ваш NORMALDANCE работает на https://normaldance.ru 🚀**
