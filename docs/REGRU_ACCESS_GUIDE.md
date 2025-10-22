# 🔐 Доступ к REG.RU - Руководство по настройке

## 📋 Данные для доступа к REG.RU

### Домены проекта:
- **NORMALDANCE.RU**
- **NORMALDANCE.ONLINE**

### Шаги для получения доступа:

## 1. Вход в панель управления REG.RU

### URL панели управления:
```
https://www.reg.ru/cp/
```

### Необходимые данные для входа:
- **Логин/Email**: [укажите ваш email от REG.RU]
- **Пароль**: [укажите пароль от аккаунта REG.RU]

### Если нет доступа:
1. Перейдите на https://www.reg.ru/
2. Нажмите "Войти" в правом верхнем углу
3. Используйте email и пароль от аккаунта
4. Если забыли пароль - используйте восстановление

## 2. Управление доменами

### Просмотр доменов:
1. В панели управления выберите "Домены"
2. Вы увидите список: `normaldance.ru`, `normaldance.online`

### Настройка DNS записей:

Для каждого домена нужно добавить A-записи:

```
Имя: @
Тип: A
Значение: [IP адрес вашего сервера или Vercel]
TTL: 3600
```

Для поддоменов (если нужны):
```
Имя: www
Тип: A
Значение: [IP адрес]
TTL: 3600
```

## 3. SSH доступ к серверу

### Настройка SSH ключей:

```bash
# 1. Генерация SSH ключа (если нет)
ssh-keygen -t ed25519 -C "normaldance-project"

# 2. Добавление ключа в SSH агент
ssh-add ~/.ssh/id_ed25519

# 3. Получение публичного ключа
cat ~/.ssh/id_ed25519.pub

# 4. Добавление ключа на сервер (если есть root доступ)
ssh-copy-id root@89.104.67.165
```

### Подключение к серверу:
```bash
ssh root@89.104.67.165
```

## 4. SFTP доступ для загрузки файлов

### Настройка SFTP клиента:

**FileZilla:**
```
Хост: 89.104.67.165
Пользователь: root
Пароль: [пароль root пользователя]
Порт: 22
```

**WinSCP (для Windows):**
```
Файл протокол: SFTP
Имя хоста: 89.104.67.165
Порт: 22
Имя пользователя: root
Пароль: [пароль]
```

## 5. Настройка доменов для проекта

### Опции размещения:

#### Вариант 1: Vercel (рекомендуется)
```bash
# Подключение домена к Vercel
vercel domains add normaldance.ru
vercel domains add normaldance.online
```

#### Вариант 2: Собственный сервер
```bash
# На сервере настроить веб-сервер (nginx/apache)
# Указать DocumentRoot на папку с проектом
# Настроить SSL сертификаты
```

## 6. SSL сертификаты

### Бесплатные сертификаты от Let's Encrypt:

```bash
# Установка certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d normaldance.ru -d www.normaldance.ru
sudo certbot --nginx -d normaldance.online -d www.normaldance.online
```

## 7. Развертывание проекта на сервер

### Через Docker Compose:
```bash
# Загрузка файлов проекта
# Распаковка в /opt/normaldance

# Запуск проекта
cd /opt/normaldance
docker-compose -f docker-compose.full.yml up -d

# Проверка статуса
docker-compose ps
```

### Через Git:
```bash
# Клонирование репозитория
git clone https://github.com/AENDYSTUDIO/NORMALDANCE-REVOLUTION.git /opt/normaldance

# Настройка окружения
cp /opt/normaldance/.env.example /opt/normaldance/.env

# Установка зависимостей и запуск
cd /opt/normaldance
npm install
npm run build
npm start
```

## 8. Мониторинг и логи

### Проверка логов сервера:
```bash
# Логи nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Логи Docker контейнеров
sudo docker-compose logs -f

# Системные логи
sudo journalctl -u docker -f
```

## 9. Резервное копирование

### Автоматическое резервное копирование:
```bash
# Создание скрипта резервного копирования
sudo nano /opt/backup-script.sh

# Содержимое скрипта:
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
sudo docker-compose exec postgres pg_dump -U normaldance normaldance > /backup/db_backup_$DATE.sql
sudo tar -czf /backup/project_backup_$DATE.tar.gz /opt/normaldance --exclude=/opt/normaldance/node_modules
```

## 10. Поддержка и контакты

### Контакты REG.RU:
- **Телефон**: +7 (495) 999-33-40
- **Email**: support@reg.ru
- **Онлайн чат**: на сайте reg.ru

### Техническая поддержка проекта:
- **Email**: support@normaldance.com
- **GitHub Issues**: https://github.com/AENDYSTUDIO/NORMALDANCE-REVOLUTION/issues

---

*Сохраните эти инструкции в безопасном месте. Для получения дополнительной помощи обратитесь в поддержку REG.RU или создайте issue в репозитории проекта.*
