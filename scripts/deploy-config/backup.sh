#!/bin/bash

#####################################################
# NORMALDANCE BACKUP SCRIPT
# Автоматический бэкап базы данных и файлов
#####################################################

set -e

# Конфигурация
APP_NAME="normaldance"
BACKUP_DIR="/backups/$APP_NAME"
DB_NAME="normaldance"
DB_USER="normaldance"
APP_DIR="/var/www/$APP_NAME"
RETENTION_DAYS=7

# Дата для имени бэкапа
DATE=$(date +%Y%m%d_%H%M%S)

# Создать директорию для бэкапов
mkdir -p $BACKUP_DIR

echo "[$(date)] Starting backup..."

# Бэкап базы данных PostgreSQL
echo "Backing up database..."
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_${DATE}.sql.gz

if [ $? -eq 0 ]; then
    echo "✓ Database backup successful: db_${DATE}.sql.gz"
else
    echo "✗ Database backup failed!"
    exit 1
fi

# Бэкап файлов приложения (исключая node_modules и .next)
echo "Backing up application files..."
tar -czf $BACKUP_DIR/files_${DATE}.tar.gz \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='*.log' \
    -C $(dirname $APP_DIR) $(basename $APP_DIR)

if [ $? -eq 0 ]; then
    echo "✓ Files backup successful: files_${DATE}.tar.gz"
else
    echo "✗ Files backup failed!"
    exit 1
fi

# Бэкап .env файлов
echo "Backing up environment files..."
cp $APP_DIR/.env.production $BACKUP_DIR/env_${DATE}.backup

# Показать размер бэкапов
echo ""
echo "Backup sizes:"
du -h $BACKUP_DIR/db_${DATE}.sql.gz
du -h $BACKUP_DIR/files_${DATE}.tar.gz

# Удалить старые бэкапы (старше RETENTION_DAYS дней)
echo ""
echo "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "db_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "files_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "env_*.backup" -type f -mtime +$RETENTION_DAYS -delete

# Показать список оставшихся бэкапов
echo ""
echo "Remaining backups:"
ls -lh $BACKUP_DIR | tail -n +2

echo ""
echo "[$(date)] Backup completed successfully!"

# Отправить уведомление (опционально)
# curl -X POST https://your-webhook-url.com/notify \
#   -H "Content-Type: application/json" \
#   -d "{\"message\": \"Backup completed: $DATE\"}"

exit 0
