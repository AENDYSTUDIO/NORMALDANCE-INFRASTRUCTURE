#!/bin/bash

# Резервное копирование сервера перед развертыванием NORMAL DANCE
SERVER_IP="89.104.67.165"
SSH_USER="root"
SSH_PASSWORD="Ll6DLuwyKalfvGbF"

echo "💾 Создание резервной копии сервера..."

# Создаем команду SSH с паролем
SSH_CMD="sshpass -p '$SSH_PASSWORD' ssh -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP"

# Создание директории для бэкапов
$SSH_CMD "mkdir -p /root/backups"

# Бэкап важных системных файлов
BACKUP_FILES=(
    "/etc/passwd"
    "/etc/shadow"
    "/etc/group"
    "/etc/sudoers"
    "/etc/ssh/sshd_config"
    "/etc/nginx/nginx.conf"
    "/etc/mysql/my.cnf"
    "/etc/crontab"
    "/etc/fstab"
)

# Создание архива с системными файлами
BACKUP_LIST=$(printf " %s" "${BACKUP_FILES[@]}")
$SSH_CMD "tar -czf /root/backups/system-config-$(date +%Y%m%d-%H%M%S).tar.gz $BACKUP_LIST"

# Бэкап пользовательских данных веб-сайтов
$SSH_CMD "tar -czf /root/backups/web-data-$(date +%Y%m%d-%H%M%S).tar.gz -C /var/www . 2>/dev/null || true"

# Бэкап баз данных
$SSH_CMD "mkdir -p /root/backups/databases"
$SSH_CMD "mysql -e 'SHOW DATABASES;' | grep -v Database | grep -v information_schema | grep -v mysql | grep -v performance_schema | while read db; do mysqldump \"\$db\" > /root/backups/databases/\$db-$(date +%Y%m%d-%H%M%S).sql 2>/dev/null || true; done"

# Список созданных бэкапов
echo "📋 Созданные резервные копии:"
$SSH_CMD "ls -la /root/backups/"

# Проверка размера бэкапов
$SSH_CMD "du -sh /root/backups/*"

echo "✅ Резервное копирование завершено"