#!/bin/bash

echo "💾 Создание резервной копии сервера..."

# Создание директории для бэкапов
mkdir -p /root/backups

# Бэкап важных системных файлов
echo "📁 Создание бэкапа системных файлов..."
BACKUP_FILES=(
    "/etc/passwd"
    "/etc/shadow"
    "/etc/group"
    "/etc/sudoers"
    "/etc/ssh/sshd_config"
    "/etc/crontab"
    "/etc/fstab"
)

# Создание архива с системными файлами
BACKUP_LIST=""
for file in "${BACKUP_FILES[@]}"; do
    if [ -f "$file" ]; then
        BACKUP_LIST="$BACKUP_LIST $file"
    fi
done

if [ ! -z "$BACKUP_LIST" ]; then
    tar -czf /root/backups/system-config-$(date +%Y%m%d-%H%M%S).tar.gz $BACKUP_LIST
    echo "✅ Системные файлы заархивированы"
fi

# Бэкап веб-директорий
echo "🌐 Создание бэкапа веб-данных..."
if [ -d "/var/www" ]; then
    tar -czf /root/backups/web-data-$(date +%Y%m%d-%H%M%S).tar.gz -C /var/www . 2>/dev/null || true
    echo "✅ Веб-данные заархивированы"
fi

# Бэкап баз данных
echo "🗄️ Создание бэкапа баз данных..."
mkdir -p /root/backups/databases

# Список баз данных
if command -v mysql &> /dev/null; then
    mysql -e 'SHOW DATABASES;' | grep -v Database | grep -v information_schema | grep -v mysql | grep -v performance_schema | while read db; do
        if [ ! -z "$db" ]; then
            mysqldump "$db" > /root/backups/databases/$db-$(date +%Y%m%d-%H%M%S).sql 2>/dev/null || true
        fi
    done
    echo "✅ Базы данных заархивированы"
fi

# Список созданных бэкапов
echo "📋 Созданные резервные копии:"
ls -la /root/backups/

# Проверка размера бэкапов
echo "📊 Размер резервных копий:"
du -sh /root/backups/*

echo "✅ Резервное копирование завершено"