# План системы резервного копирования

## Обзор

В этом документе описывается план реализации надежной системы резервного копирования проекта NormalDance. Это улучшение имеет низкий приоритет для Q3-Q4 2025 года, так как обеспечивает защиту от потери данных и возможность быстрого восстановления после сбоев.

## Текущая ситуация

### Существующая система резервного копирования

- Ограниченные автоматические бэкапы базы данных
- Нет комплексной стратегии резервного копирования
- Отсутствие многоуровневой системы хранения
- Нет автоматических процедур восстановления

### Проблемы текущей реализации

- Риск потери данных при сбоях
- Отсутствие надежного механизма восстановления
- Нет тестирования процессов восстановления
- Ограниченные возможности архивирования

## Цели реализации

### Основные цели

- Настройка автоматического резервного копирования
- Реализация многоуровневой системы хранения
- Создание процедур восстановления
- Тестирование восстановления данных

### Технические цели

- Надежное резервное копирование данных
- Быстрое восстановление после сбоев
- Защита конфиденциальных данных
- Интеграция с существующей инфраструктурой

## План реализации

### Этап 1: Анализ и планирование (Неделя 1-2)

- Анализ критических данных для бэкапа
- Выбор стратегии резервного копирования
- Проектирование архитектуры бэкапа
- Подготовка политики резервного копирования

### Этап 2: Настройка инфраструктуры (Неделя 3-4)

- Настройка хранилищ для бэкапов
- Интеграция с облачными сервисами
- Создание скриптов бэкапа
- Настройка безопасности

### Этап 3: Реализация бэкапа (Неделя 5-6)

- Настройка автоматического бэкапа БД
- Бэкап файлов и медиа
- Бэкап конфигураций
- Криптование данных

### Этап 4: Восстановление и тестирование (Неделя 7-8)

- Создание процедур восстановления
- Тестирование восстановления
- Проверка целостности данных
- Оптимизация процессов

### Этап 5: Внедрение (Неделя 9)

- Постепенное внедрение системы
- Мониторинг процессов
- Обновление документации

## Технические детали

### Архитектура системы резервного копирования

#### Схема хранения резервных копий

```
backup-storage/
├── database/
│   ├── daily/
│   │   ├── normaldance_2025-01-01.sql
│   │   ├── normaldance_2025-01-02.sql
│   │   └── ...
│   ├── weekly/
│   │   ├── normaldance_week_01_2025.sql
│   │   └── ...
│   └── monthly/
│       ├── normaldance_jan_2025.sql
│       └── ...
├── files/
│   ├── daily/
│   │   ├── media_2025-01-01.tar.gz
│   │   └── ...
│   └── archives/
│       ├── media_jan_2025.tar.gz
│       └── ...
├── configs/
│   ├── daily/
│   │   ├── configs_2025-01-01.tar.gz
│   │   └── ...
│   └── archives/
│       └── ...
└── logs/
    ├── backup_logs_2025-01-01.txt
    └── ...
```

### Политика резервного копирования

#### Классификация данных и частота бэкапа

```typescript
// src/lib/backup-policy.ts
export interface BackupPolicy {
  resourceType: "database" | "files" | "configs" | "logs";
  frequency: "hourly" | "daily" | "weekly" | "monthly";
  retentionPeriod: number; // в днях
  storageClass: "hot" | "warm" | "cold"; // для облачного хранения
  encryption: boolean;
  compression: boolean;
  verification: boolean;
}

export const BACKUP_POLICIES: Record<string, BackupPolicy> = {
  // Критическая база данных - ежедневный бэкап, 30 дней хранения
  database: {
    resourceType: "database",
    frequency: "daily",
    retentionPeriod: 30,
    storageClass: "hot",
    encryption: true,
    compression: true,
    verification: true,
  },

  // Медиафайлы - еженедельный бэкап, 90 дней хранения
  mediaFiles: {
    resourceType: "files",
    frequency: "weekly",
    retentionPeriod: 90,
    storageClass: "warm",
    encryption: true,
    compression: true,
    verification: false,
  },

  // Конфигурационные файлы - ежедневный бэкап, 365 дней хранения
  configs: {
    resourceType: "configs",
    frequency: "daily",
    retentionPeriod: 365,
    storageClass: "cold",
    encryption: true,
    compression: true,
    verification: true,
  },

  // Логи - ежедневный бэкап, 7 дней хранения
  logs: {
    resourceType: "logs",
    frequency: "daily",
    retentionPeriod: 7,
    storageClass: "hot",
    encryption: false,
    compression: true,
    verification: false,
  },
};
```

### Сервис резервного копирования

#### Основной сервис бэкапа

```typescript
// src/lib/backup-service.ts
import { exec } from "child_process";
import {
  createReadStream,
  createWriteStream,
  promises as fsPromises,
} from "fs";
import { join } from "path";
import { promisify } from "util";
import * as AWS from "aws-sdk";
import * as zlib from "zlib";
import { BACKUP_POLICIES } from "./backup-policy";

const execPromise = promisify(exec);

export class BackupService {
  private static s3: AWS.S3;
  private static readonly BACKUP_DIR = process.env.BACKUP_DIR || "./backups";

  static initialize() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || "us-east-1",
    });
  }

  static async createDatabaseBackup(): Promise<string> {
    const policy = BACKUP_POLICIES.database;
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `normaldance_${timestamp}.sql`;
    const filepath = join(this.BACKUP_DIR, "database", "daily", filename);

    // Создание бэкапа базы данных
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL is not defined");
    }

    // Для PostgreSQL
    if (dbUrl.includes("postgresql")) {
      const command = `pg_dump "${dbUrl}" > "${filepath}"`;
      await execPromise(command);
    }
    // Для SQLite
    else if (dbUrl.includes("sqlite")) {
      const dbPath = dbUrl.replace("file:", "");
      const command = `cp "${dbPath}" "${filepath}"`;
      await execPromise(command);
    }

    // Сжатие файла
    if (policy.compression) {
      await this.compressFile(filepath);
    }

    // Шифрование файла
    if (policy.encryption) {
      await this.encryptFile(filepath + ".gz");
    }

    // Загрузка в облачное хранилище
    await this.uploadToCloud(filepath + ".gz.enc", "database");

    return filepath + ".gz.enc";
  }

  static async createMediaFilesBackup(): Promise<string> {
    const policy = BACKUP_POLICIES.mediaFiles;
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `media_${timestamp}.tar.gz`;
    const filepath = join(this.BACKUP_DIR, "files", "daily", filename);

    // Архивация медиафайлов
    const mediaDir = process.env.MEDIA_DIR || "./public/media";
    const command = `tar -czf "${filepath}" -C "${mediaDir}" .`;
    await execPromise(command);

    // Загрузка в облачное хранилище
    await this.uploadToCloud(filepath, "files");

    return filepath;
  }

  static async createConfigsBackup(): Promise<string> {
    const policy = BACKUP_POLICIES.configs;
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `configs_${timestamp}.tar.gz`;
    const filepath = join(this.BACKUP_DIR, "configs", "daily", filename);

    // Архивация конфигурационных файлов
    const configFiles = [
      "./.env",
      "./next.config.js",
      "./package.json",
      "./prisma/schema.prisma",
      "./nginx.conf",
      "./docker-compose.yml",
    ];

    // Создание временной директории для конфигов
    const tempDir = join(this.BACKUP_DIR, "temp", timestamp);
    await fsPromises.mkdir(tempDir, { recursive: true });

    for (const configFile of configFiles) {
      try {
        await fsPromises.copyFile(
          configFile,
          join(tempDir, configFile.split("/").pop() || "")
        );
      } catch (error) {
        console.warn(`Could not backup config file: ${configFile}`, error);
      }
    }

    // Архивация
    const command = `tar -czf "${filepath}" -C "${tempDir}" .`;
    await execPromise(command);

    // Удаление временной директории
    await fsPromises.rm(tempDir, { recursive: true, force: true });

    // Загрузка в облачное хранилище
    await this.uploadToCloud(filepath, "configs");

    return filepath;
  }

  static async compressFile(filepath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const gzip = zlib.createGzip();
      const readStream = createReadStream(filepath);
      const writeStream = createWriteStream(filepath + ".gz");

      readStream.pipe(gzip).pipe(writeStream);

      writeStream.on("finish", () => resolve(filepath + ".gz"));
      writeStream.on("error", reject);
    });
  }

  static async encryptFile(filepath: string): Promise<string> {
    // В реальном приложении использовать надежное шифрование
    // Пока заглушка - просто добавляем расширение
    const encryptedPath = filepath + ".enc";
    await fsPromises.rename(filepath, encryptedPath);
    return encryptedPath;
  }

  static async uploadToCloud(
    filepath: string,
    resourceType: string
  ): Promise<void> {
    try {
      const fileContent = await fsPromises.readFile(filepath);
      const key = `${resourceType}/${
        new Date().toISOString().split("T")[0]
      }/${filepath.split("/").pop()}`;

      await this.s3
        .upload({
          Bucket: process.env.BACKUP_S3_BUCKET!,
          Key: key,
          Body: fileContent,
          ServerSideEncryption: "AES256",
        })
        .promise();

      console.log(`Successfully uploaded ${filepath} to S3`);
    } catch (error) {
      console.error(`Failed to upload ${filepath} to S3:`, error);
      throw error;
    }
  }

  static async verifyBackup(filepath: string): Promise<boolean> {
    try {
      // Проверка целостности файла
      const stats = await fsPromises.stat(filepath);
      return stats.size > 0;
    } catch (error) {
      console.error(`Failed to verify backup ${filepath}:`, error);
      return false;
    }
  }

  static async cleanupOldBackups(
    resourceType: string,
    retentionDays: number
  ): Promise<void> {
    const policy =
      BACKUP_POLICIES[resourceType as keyof typeof BACKUP_POLICIES];
    if (!policy) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const backupDir = join(this.BACKUP_DIR, resourceType);
    const files = await fsPromises.readdir(backupDir, { withFileTypes: true });

    for (const file of files) {
      if (file.isFile()) {
        const filePath = join(backupDir, file.name);
        const fileStat = await fsPromises.stat(filePath);

        if (fileStat.mtime < cutoffDate) {
          await fsPromises.unlink(filePath);
          console.log(`Deleted old backup: ${filePath}`);
        }
      }
    }
  }

  static async runScheduledBackup(
    backupType: keyof typeof BACKUP_POLICIES
  ): Promise<void> {
    try {
      let backupFile: string;

      switch (backupType) {
        case "database":
          backupFile = await this.createDatabaseBackup();
          break;
        case "mediaFiles":
          backupFile = await this.createMediaFilesBackup();
          break;
        case "configs":
          backupFile = await this.createConfigsBackup();
          break;
        default:
          throw new Error(`Unknown backup type: ${backupType}`);
      }

      // Проверка бэкапа
      const policy = BACKUP_POLICIES[backupType];
      if (policy.verification) {
        const isVerified = await this.verifyBackup(backupFile);
        if (!isVerified) {
          throw new Error(`Backup verification failed for ${backupFile}`);
        }
      }

      console.log(`Successfully created ${backupType} backup: ${backupFile}`);

      // Удаление старых бэкапов
      await this.cleanupOldBackups(backupType, policy.retentionPeriod);
    } catch (error) {
      console.error(`Backup failed for ${backupType}:`, error);
      throw error;
    }
  }
}
```

### Скрипты автоматизации

#### Cron-скрипт для автоматического бэкапа

```bash
#!/bin/bash
# backup-cron.sh

# Установка переменных окружения
export NODE_ENV=production
export BACKUP_DIR="/var/backups/normaldance"

# Создание директории бэкапов
mkdir -p $BACKUP_DIR/database/daily
mkdir -p $BACKUP_DIR/database/weekly
mkdir -p $BACKUP_DIR/database/monthly
mkdir -p $BACKUP_DIR/files/daily
mkdir -p $BACKUP_DIR/files/archives
mkdir -p $BACKUP_DIR/configs/daily
mkdir -p $BACKUP_DIR/configs/archives
mkdir -p $BACKUP_DIR/logs

# Логирование
LOG_FILE="$BACKUP_DIR/logs/backup_$(date +%Y-%m-%d).log"
echo "$(date): Starting backup process" >> $LOG_FILE

# Бэкап базы данных
echo "$(date): Starting database backup" >> $LOG_FILE
if npm run backup:database >> $LOG_FILE 2>&1; then
    echo "$(date): Database backup completed successfully" >> $LOG_FILE
else
    echo "$(date): Database backup failed" >> $LOG_FILE
    # Отправка уведомления о сбое
    curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
         -H 'Content-type: application/json' \
         --data '{"text":"Database backup failed!"}'
fi

# Бэкап файлов
echo "$(date): Starting files backup" >> $LOG_FILE
if npm run backup:files >> $LOG_FILE 2>&1; then
    echo "$(date): Files backup completed successfully" >> $LOG_FILE
else
    echo "$(date): Files backup failed" >> $LOG_FILE
fi

# Бэкап конфигов
echo "$(date): Starting configs backup" >> $LOG_FILE
if npm run backup:configs >> $LOG_FILE 2>&1; then
    echo "$(date): Configs backup completed successfully" >> $LOG_FILE
else
    echo "$(date): Configs backup failed" >> $LOG_FILE
fi

# Удаление старых логов (старше 30 дней)
find $BACKUP_DIR/logs -name "*.log" -mtime +30 -delete

echo "$(date): Backup process completed" >> $LOG_FILE
echo "----------------------------------------" >> $LOG_FILE
```

### API для управления бэкапами

#### API-эндпоинты для бэкапа

```typescript
// src/app/api/backup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { BackupService } from "@/lib/backup-service";

// Инициализация сервиса бэкапа
BackupService.initialize();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    switch (action) {
      case "status":
        // В реальном приложении: получение статуса последнего бэкапа
        return NextResponse.json({
          lastBackup: new Date().toISOString(),
          status: "success",
          nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

      case "list":
        // В реальном приложении: получение списка бэкапов из S3
        return NextResponse.json({
          backups: [
            {
              id: "db-2025-01-01",
              type: "database",
              date: "2025-01-01",
              size: "1.2GB",
            },
            {
              id: "files-2025-01-01",
              type: "files",
              date: "2025-01-01",
              size: "50GB",
            },
            {
              id: "configs-2025-01-01",
              type: "configs",
              date: "2025-01-01",
              size: "2MB",
            },
          ],
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in backup API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, type } = body;

    switch (action) {
      case "create":
        if (!type || !["database", "mediaFiles", "configs"].includes(type)) {
          return NextResponse.json(
            { error: "Invalid backup type" },
            { status: 400 }
          );
        }

        await BackupService.runScheduledBackup(type);
        return NextResponse.json({
          success: true,
          message: `Backup of ${type} completed`,
        });

      case "restore":
        // В реальном приложении: реализация восстановления
        // ВНИМАНИЕ: восстановление - очень чувствительная операция
        const { backupId, confirm } = body;
        if (!confirm) {
          return NextResponse.json(
            { error: "Restore confirmation required" },
            { status: 400 }
          );
        }

        // Реализация восстановления из резервной копии
        await restoreFromBackup(backupId);
        return NextResponse.json({
          success: true,
          message: "Restore completed",
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in backup API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Вспомогательная функция восстановления (заглушка)
async function restoreFromBackup(backupId: string) {
  // В реальном приложении:
  // 1. Скачивание бэкапа из S3
  // 2. Расшифровка
  // 3. Распаковка
  // 4. Восстановление данных
  console.log(`Restoring from backup: ${backupId}`);

  // Дополнительные проверки безопасности
  if (process.env.NODE_ENV !== "production") {
    console.log("Restore operation simulated in non-production environment");
    return;
  }

  // Реализация восстановления в зависимости от типа бэкапа
  throw new Error("Restore functionality not fully implemented for production");
}
```

### Дашборд управления бэкапами

#### Компонент дашборда бэкапа

```tsx
// src/app/admin/backup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/admin/DashboardLayout';

const BackupDashboard = () => {
  const [backupStatus, setBackupStatus] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загрузка статуса бэкапа
        const statusResponse = await fetch('/api/backup?action=status');
        const statusData = await statusResponse.json();
        setBackupStatus(statusData);

        // Загрузка списка бэкапов
        const listResponse = await fetch('/api/backup?action=list');
        const listData = await listResponse.json();
        setBackups(listData.backups);
      } catch (error) {
        console.error('Error fetching backup data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateBackup = async (type: string) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          type
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`Backup of ${type} completed successfully!`);
        // Обновить данные
        window.location.reload();
      } else {
        alert(`Backup failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Error creating backup');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    if (!confirm('Are you sure you want to restore from this backup? This will overwrite current data.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'restore',
          backupId,
          confirm: true
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Restore completed successfully!');
      } else {
        alert(`Restore failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Error restoring backup');
    } finally {
      setActionLoading(false);
    }
  };

 if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    );
  }

 return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Backup Management</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => handleCreateBackup('database')}
              disabled={actionLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {actionLoading ? 'Creating...' : 'Backup Database'}
            </button>
            <button
              onClick={() => handleCreateBackup('mediaFiles')}
              disabled={actionLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {actionLoading ? 'Creating...' : 'Backup Files'}
            </button>
            <button
              onClick={() => handleCreateBackup('configs')}
              disabled={actionLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-70 disabled:opacity-50"
            >
              {actionLoading ? 'Creating...' : 'Backup Configs'}
            </button>
          </div>
        </div>

        {/* Статус бэкапа */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Last Backup</h3>
            <p className="text-gray-600">{backupStatus?.lastBackup ? new Date(backupStatus.lastBackup).toLocaleString() : 'N/A'}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Status</h3>
            <p className={`font-medium ${backupStatus?.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {backupStatus?.status?.toUpperCase() || 'N/A'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Next Backup</h3>
            <p className="text-gray-600">{backupStatus?.nextBackup ? new Date(backupStatus.nextBackup).toLocaleString() : 'N/A'}</p>
          </div>

        {/* Список бэкапов */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Available Backups</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No backups found
                    </td>
                  </tr>
                ) : (
                  backups.map((backup) => (
                    <tr key={backup.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{backup.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.size}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleRestore(backup.id)}
                          className="text-red-600 hover:text-red-900 mr-4"
                        >
                          Restore
                        </button>
                        <button className="text-blue-600 hover:text-blue-900">
                          Download
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        {/* Информация о политике бэкапа */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Backup Policy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-gray-20 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Database</h3>
              <p className="text-sm text-gray-600">Daily, 30 days retention</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Media Files</h3>
              <p className="text-sm text-gray-600">Weekly, 90 days retention</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Configs</h3>
              <p className="text-sm text-gray-600">Daily, 365 days retention</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Logs</h3>
              <p className="text-sm text-gray-600">Daily, 7 days retention</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
```

### Мониторинг и уведомления

#### Сервис мониторинга бэкапов

```typescript
// src/lib/backup-monitoring.ts
import { BackupService } from "./backup-service";

export class BackupMonitoringService {
  static async checkBackupStatus(): Promise<boolean> {
    try {
      // Проверка последнего бэкапа
      const lastBackupDate = await this.getLastBackupDate();
      const timeSinceLastBackup = Date.now() - lastBackupDate.getTime();

      // Если прошло больше 24 часов с последнего бэкапа
      if (timeSinceLastBackup > 24 * 60 * 60 * 1000) {
        await this.sendAlert("No backup performed in the last 24 hours");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking backup status:", error);
      await this.sendAlert("Error checking backup status");
      return false;
    }
  }

  static async getLastBackupDate(): Promise<Date> {
    // В реальном приложении: получение даты последнего бэкапа из S3 или базы данных
    // Пока возвращаем текущую дату для тестирования
    return new Date();
  }

  static async sendAlert(message: string): Promise<void> {
    // Отправка уведомления в Slack, email или другой канал
    console.log(`Backup Alert: ${message}`);

    // В реальном приложении:
    // 1. Отправка в Slack через webhook
    // 2. Отправка email уведомления
    // 3. Запись в систему мониторинга

    try {
      // Пример отправки в Slack
      if (process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: `🚨 Backup Alert: ${message}`,
            channel: "#alerts",
          }),
        });
      }
    } catch (error) {
      console.error("Error sending backup alert:", error);
    }
  }

  static async runHealthCheck(): Promise<any> {
    const results = {
      databaseBackup: await this.verifyDatabaseBackup(),
      filesBackup: await this.verifyFilesBackup(),
      configsBackup: await this.verifyConfigsBackup(),
      storageSpace: await this.checkStorageSpace(),
      overallStatus: "healthy",
    };

    if (
      !results.databaseBackup ||
      !results.filesBackup ||
      !results.configsBackup ||
      !results.storageSpace.ok
    ) {
      results.overallStatus = "unhealthy";
      await this.sendAlert("Backup health check failed");
    }

    return results;
  }

  static async verifyDatabaseBackup(): Promise<boolean> {
    // Проверка целостности последнего бэкапа базы данных
    try {
      // В реальном приложении: проверка доступности и целостности последнего бэкапа в S3
      return true;
    } catch (error) {
      console.error("Database backup verification failed:", error);
      return false;
    }
  }

  static async verifyFilesBackup(): Promise<boolean> {
    // Проверка целостности последнего бэкапа файлов
    try {
      // В реальном приложении: проверка доступности и целостности последнего бэкапа файлов в S3
      return true;
    } catch (error) {
      console.error("Files backup verification failed:", error);
      return false;
    }
  }

  static async verifyConfigsBackup(): Promise<boolean> {
    // Проверка целостности последнего бэкапа конфигов
    try {
      // В реальном приложении: проверка доступности и целостности последнего бэкапа конфигов в S3
      return true;
    } catch (error) {
      console.error("Configs backup verification failed:", error);
      return false;
    }
  }

  static async checkStorageSpace(): Promise<{
    ok: boolean;
    used: string;
    total: string;
  }> {
    // Проверка свободного места в облачном хранилище
    try {
      // В реальном приложении: получение информации о занятом месте в S3
      return { ok: true, used: "45GB", total: "100GB" };
    } catch (error) {
      console.error("Storage space check failed:", error);
      return { ok: false, used: "0", total: "0" };
    }
  }
}
```

## Риски и меры по их снижению

### Риск 1: Потеря данных при сбоях

- **Мера**: Многоуровневая система бэкапов
- **Мера**: Регулярное тестирование восстановления

### Риск 2: Недостаточное хранилище

- **Мера**: Автоматическая очистка старых бэкапов
- **Мера**: Мониторинг использования хранилища

### Риск 3: Несанкционированный доступ к бэкапам

- **Мера**: Шифрование бэкапов
- **Мера**: Ограниченный доступ к хранилищу

## Критерии успеха

- Надежная система резервного копирования
- Быстрое восстановление данных
- Защита конфиденциальных данных
- Автоматизация процессов
- Мониторинг состояния системы

## Ресурсы

- 1-2 DevOps-инженера на 9 недель
- Облачное хранилище для бэкапов
- Специалист по безопасности для настройки шифрования

## Сроки

- Начало: 1 декабря 2025
- Завершение: 6 января 2026
- Общее время: 9 недель
