# План системы уведомлений

## Обзор

В этом документе описывается план реализации комплексной системы уведомлений проекта NormalDance. Это улучшение имеет средний приоритет для Q2-Q3 2025 года, так как обеспечивает повышение вовлеченности пользователей и улучшает взаимодействие с платформой.

## Текущая ситуация

### Существующая система уведомлений

- Базовая система уведомлений
- Отсутствие push-уведомлений
- Нет email-уведомлений
- Ограниченные возможности настройки

### Проблемы текущей реализации

- Нет push-уведомлений
- Отсутствие email-уведомлений
- Нет настройки предпочтений
- Ограниченные типы уведомлений

## Цели реализации

### Основные цели

- Реализация push-уведомлений
- Добавление email-уведомлений
- Создание системы персонализированных уведомлений
- Настройка управления предпочтениями

### Технические цели

- Поддержка Web Push API
- Интеграция с email-сервисом
- Управление предпочтениями пользователей
- Система очередей для уведомлений

## План реализации

### Этап 1: Анализ и проектирование (Неделя 1-2)

- Анализ требований к уведомлениям
- Выбор сервисов для отправки
- Проектирование архитектуры
- Подготовка схемы данных

### Этап 2: Реализация backend (Неделя 3-5)

- Создание модели уведомлений
- Реализация сервиса отправки
- Интеграция с Web Push
- Создание API для уведомлений

### Этап 3: Frontend интеграция (Неделя 6-7)

- Интеграция с Web Push API
- Создание UI для управления
- Реализация email-уведомлений
- Тестирование UX

### Этап 4: Тестирование (Неделя 8)

- Тестирование отправки уведомлений
- Тестирование управления предпочтениями
- Тестирование на различных устройствах
- Исправление выявленных проблем

### Этап 5: Внедрение (Неделя 9)

- Постепенное внедрение системы
- Мониторинг после внедрения
- Обновление документации

## Технические детали

### Архитектура системы уведомлений

#### Схема данных для уведомлений

```prisma
// schema.prisma
model Notification {
  id          String        @id @default(cuid())
  userId      String
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  type        NotificationType
  title       String
 body        String
 data        Json?         // Дополнительные данные уведомления
  read        Boolean       @default(false)
  delivered   Boolean       @default(false)
  scheduledAt DateTime?
  sentAt      DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([userId])
  @@index([read])
  @@index([createdAt])
}

enum NotificationType {
  TRACK_PUBLISHED
  ARTIST_FOLLOWED
  PAYMENT_RECEIVED
  NFT_SALE
  PLATFORM_UPDATE
 SYSTEM_MESSAGE
  RECOMMENDATION
  ACHIEVEMENT_UNLOCKED
}

model UserNotificationPreference {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  notificationType NotificationType
  channel     NotificationChannel
  enabled     Boolean @default(true)
 createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, notificationType, channel])
}

enum NotificationChannel {
  WEB_PUSH
 EMAIL
  IN_APP
}

// Модель для Web Push подписок
model WebPushSubscription {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint   String
  p256dh     String
 auth       String
 createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([userId])
}
```

### Сервис уведомлений

#### Основной сервис уведомлений

```typescript
// src/lib/notification-service.ts
import { prisma } from '@/lib/db';
import { WebPushService } from './web-push-service';
import { EmailService } from './email-service';
import { NotificationType, NotificationChannel } from '@prisma/client';

export interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
 data?: any;
  scheduledAt?: Date;
}

export interface NotificationPreference {
  type: NotificationType;
  channels: NotificationChannel[];
  enabled: boolean;
}

export class NotificationService {
  static async sendNotification(data: NotificationData): Promise<boolean> {
    try {
      // Проверка предпочтений пользователя
      const preferences = await this.getUserPreferences(data.userId, data.type);

      if (!preferences.enabled) {
        return false;
      }

      // Создание записи уведомления в базе данных
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          body: data.body,
          data: data.data || {},
          scheduledAt: data.scheduledAt,
        }
      });

      // Отправка уведомления по доступным каналам
      let sent = false;

      for (const channel of preferences.channels) {
        switch (channel) {
          case 'WEB_PUSH':
            sent = await WebPushService.sendWebPush(data.userId, data.title, data.body, data.data) || sent;
            break;
          case 'EMAIL':
            sent = await EmailService.sendEmail(data.userId, data.title, data.body, data.data) || sent;
            break;
          case 'IN_APP':
            // Внутреннее уведомление - просто помечаем как доставленное
            await prisma.notification.update({
              where: { id: notification.id },
              data: { delivered: true, sentAt: new Date() }
            });
            sent = true;
            break;
        }
      }

      // Обновление статуса доставки
      if (sent) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { delivered: true, sentAt: new Date() }
        });
      }

      return sent;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  static async getUserPreferences(userId: string, type: NotificationType): Promise<NotificationPreference> {
    const preferences = await prisma.userNotificationPreference.findMany({
      where: {
        userId,
        notificationType: type,
      }
    });

    const enabledChannels = preferences
      .filter(pref => pref.enabled)
      .map(pref => pref.channel);

    return {
      type,
      channels: enabledChannels,
      enabled: enabledChannels.length > 0
    };
  }

  static async updateUserPreferences(
    userId: string,
    type: NotificationType,
    channels: NotificationChannel[],
    enabled: boolean
  ): Promise<void> {
    // Удаление существующих предпочтений
    await prisma.userNotificationPreference.deleteMany({
      where: {
        userId,
        notificationType: type,
      }
    });

    // Создание новых предпочтений
    if (enabled) {
      await prisma.userNotificationPreference.createMany({
        data: channels.map(channel => ({
          userId,
          notificationType: type,
          channel,
          enabled: true,
        }))
      });
    }
  }

  static async getUnreadNotifications(userId: string, limit: number = 20) {
    return await prisma.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      await prisma.notification.update({
        where: {
          id: notificationId,
          userId,
        },
        data: { read: true }
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: { read: true }
      });
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }
}
```

### Web Push сервис

#### Сервис для отправки Web Push уведомлений

```typescript
// src/lib/web-push-service.ts
import webpush from "web-push";
import { prisma } from "@/lib/db";

// Настройка VAPID ключей (в реальном приложении - из env)
webpush.setVapidDetails(
  "mailto:contact@normaldance.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export class WebPushService {
  static async subscribeUser(
    userId: string,
    subscription: any
  ): Promise<boolean> {
    try {
      await prisma.webPushSubscription.upsert({
        where: {
          userId_endpoint: {
            userId,
            endpoint: subscription.endpoint,
          },
        },
        update: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });

      return true;
    } catch (error) {
      console.error("Error subscribing user:", error);
      return false;
    }
  }

  static async unsubscribeUser(
    userId: string,
    endpoint: string
  ): Promise<boolean> {
    try {
      await prisma.webPushSubscription.deleteMany({
        where: {
          userId,
          endpoint,
        },
      });

      return true;
    } catch (error) {
      console.error("Error unsubscribing user:", error);
      return false;
    }
  }

  static async sendWebPush(
    userId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      // Получение подписок пользователя
      const subscriptions = await prisma.webPushSubscription.findMany({
        where: { userId },
      });

      if (subscriptions.length === 0) {
        return false;
      }

      let sent = false;
      const payload = JSON.stringify({
        title,
        body,
        data,
        timestamp: new Date().toISOString(),
      });

      // Отправка уведомления на все подписки
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          );
          sent = true;
        } catch (err) {
          console.error("Error sending push notification:", err);
          // Если подписка недействительна, удаляем её
          if (err.statusCode === 410 || err.statusCode === 404) {
            await prisma.webPushSubscription.delete({
              where: { id: sub.id },
            });
          }
        }
      }

      return sent;
    } catch (error) {
      console.error("Error in sendWebPush:", error);
      return false;
    }
  }
}
```

### Email сервис

#### Сервис для отправки email-уведомлений

```typescript
// src/lib/email-service.ts
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";

// Настройка транспорта (в реальном приложении - из env)
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class EmailService {
  static async sendEmail(
    userId: string,
    subject: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      // Получение email пользователя
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, username: true },
      });

      if (!user?.email) {
        console.log(`No email found for user ${userId}`);
        return false;
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || "noreply@normaldance.com",
        to: user.email,
        subject,
        html: this.generateEmailTemplate(subject, body, user.username, data),
      };

      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  private static generateEmailTemplate(
    subject: string,
    body: string,
    username: string,
    data?: any
  ): string {
    // Шаблон email-уведомления
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #6d28d9;">NormalDance</h1>
            <h2 style="color: #33;">${subject}</h2>
            <p>Привет, ${username}!</p>
            <p>${body}</p>
            <div style="margin-top: 20px; padding: 10px; background-color: #f9fafb; border-radius: 5px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                Это автоматическое уведомление от NormalDance. 
                <a href="${process.env.BASE_URL}/settings/notifications" style="color: #6d28d9;">Изменить настройки уведомлений</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
```

### Frontend компоненты

#### Компонент управления уведомлениями

```tsx
// src/components/NotificationPreferences.tsx
"use client";

import { useState, useEffect } from "react";
import { NotificationType, NotificationChannel } from "@prisma/client";
import { NotificationService } from "@/lib/notification-service";

const NOTIFICATION_TYPES = [
  {
    value: "TRACK_PUBLISHED",
    label: "Новый трек от артиста, за которым я слежу",
  },
  { value: "ARTIST_FOLLOWED", label: "Новый подписчик" },
  { value: "PAYMENT_RECEIVED", label: "Получение платежа" },
  { value: "NFT_SALE", label: "Продажа NFT" },
  { value: "PLATFORM_UPDATE", label: "Обновления платформы" },
  { value: "RECOMMENDATION", label: "Персональные рекомендации" },
  { value: "ACHIEVEMENT_UNLOCKED", label: "Новые достижения" },
];

const NOTIFICATION_CHANNELS = [
  { value: "WEB_PUSH", label: "Push-уведомления" },
  { value: "EMAIL", label: "Email" },
  { value: "IN_APP", label: "Внутри приложения" },
];

interface NotificationPreference {
  type: NotificationType;
  channels: NotificationChannel[];
  enabled: boolean;
}

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        // В реальном приложении получить предпочтения пользователя
        const userPrefs = await NotificationService.getUserPreferences(
          "current-user-id",
          "TRACK_PUBLISHED"
        );
        setPreferences([userPrefs]); // Заглушка
      } catch (error) {
        console.error("Error fetching preferences:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handlePreferenceChange = async (
    type: NotificationType,
    channel: NotificationChannel,
    enabled: boolean
  ) => {
    try {
      // Получить текущие предпочтения для типа уведомления
      const existingPref = preferences.find((p) => p.type === type);

      if (existingPref) {
        const updatedChannels = enabled
          ? [...new Set([...existingPref.channels, channel])]
          : existingPref.channels.filter((c) => c !== channel);

        const updatedPref = {
          ...existingPref,
          channels: updatedChannels,
          enabled: updatedChannels.length > 0,
        };

        setPreferences((prev) =>
          prev.map((p) => (p.type === type ? updatedPref : p))
        );

        // Сохранить изменения в бэкенде
        await NotificationService.updateUserPreferences(
          "current-user-id",
          type,
          updatedPref.channels,
          updatedPref.enabled
        );
      }
    } catch (error) {
      console.error("Error updating preference:", error);
    }
  };

  if (loading) {
    return <div>Загрузка настроек уведомлений...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Настройки уведомлений</h2>

      {NOTIFICATION_TYPES.map((notificationType) => (
        <div
          key={notificationType.value}
          className="border-b border-gray-200 pb-4"
        >
          <h3 className="font-medium text-gray-900">
            {notificationType.label}
          </h3>
          <div className="mt-2 ml-4 space-y-2">
            {NOTIFICATION_CHANNELS.map((channel) => {
              const pref = preferences.find(
                (p) => p.type === notificationType.value
              );
              const isChannelEnabled = pref?.channels.includes(
                channel.value as NotificationChannel
              );

              return (
                <label key={channel.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isChannelEnabled}
                    onChange={(e) =>
                      handlePreferenceChange(
                        notificationType.value as NotificationType,
                        channel.value as NotificationChannel,
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-30 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-gray-700">{channel.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
```

#### Компонент отображения уведомлений

```tsx
// src/components/NotificationList.tsx
"use client";

import { useState, useEffect } from "react";
import { NotificationService } from "@/lib/notification-service";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
  type: string;
}

const NotificationList = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userNotifications =
          await NotificationService.getUnreadNotifications("current-user-id");
        setNotifications(userNotifications as any[]);
        setUnreadCount(userNotifications.length);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const success = await NotificationService.markAsRead(
        id,
        "current-user-id"
      );
      if (success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setUnreadCount((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const success = await NotificationService.markAllAsRead(
        "current-user-id"
      );
      if (success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  if (loading) {
    return <div>Загрузка уведомлений...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Уведомления</h2>
        {notifications.length > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-purple-600 hover:text-purple-800"
          >
            Отметить все как прочитанные
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          У вас нет новых уведомлений
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${
                notification.read
                  ? "bg-white border-gray-200"
                  : "bg-purple-50 border-purple-200"
              }`}
            >
              <div className="flex justify-between">
                <h3 className="font-medium">{notification.title}</h3>
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mt-1">{notification.body}</p>
              <p className="text-xs text-gray-500 mt-2">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: ru,
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### API для уведомлений

#### API-эндпоинты для управления уведомлениями

```typescript
// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NotificationService } from "@/lib/notification-service";
import { NotificationType, NotificationChannel } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const read = searchParams.get("read");

    let whereClause: any = { userId: session.user.id };

    if (read !== undefined) {
      whereClause.read = read === "true";
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, title, body: notificationBody, data, scheduledAt } = body;

    if (!type || !title || !notificationBody) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // В реальном приложении проверить права пользователя
    // и отправить уведомление только ему или другим пользователям

    const success = await NotificationService.sendNotification({
      userId: session.user.id,
      type: type as NotificationType,
      title,
      body: notificationBody,
      data,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Failed to send notification" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { notificationId, read } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: "Missing notificationId" },
        { status: 400 }
      );
    }

    const updated = await prisma.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      data: { read },
    });

    return NextResponse.json({ notification: updated });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
```

## Риски и меры по их снижению

### Риск 1: Спам уведомлениями

- **Мера**: Настройка предпочтений пользователей
- **Мера**: Ограничение частоты уведомлений

### Риск 2: Проблемы с доставкой

- **Мера**: Резервные каналы доставки
- **Мера**: Мониторинг доставки уведомлений

### Риск 3: Приватность данных

- **Мера**: Шифрование персональных данных
- **Мера**: Соблюдение GDPR и других норм

## Критерии успеха

- Успешная отправка уведомлений
- Настройка предпочтений пользователей
- Повышенная вовлеченность
- Удовлетворенность пользователей
- Надежная доставка уведомлений

## Ресурсы

- 2-3 разработчика на 9 недель
- DevOps-инженер для настройки инфраструктуры
- QA-инженер для тестирования

## Сроки

- Начало: 1 сентября 2025
- Завершение: 24 октября 2025
- Общее время: 9 недель
