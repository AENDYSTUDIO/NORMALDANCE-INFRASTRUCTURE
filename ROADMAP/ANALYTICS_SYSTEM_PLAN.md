# План системы аналитики

## Обзор

В этом документе описывается план реализации продвинутой системы аналитики проекта NormalDance. Это улучшение имеет низкий приоритет для Q3-Q4 2025 года, так как обеспечивает принятие решений на основе данных и лучшее понимание пользовательского поведения.

## Текущая ситуация

### Существующая система аналитики

- Базовая аналитика с использованием Google Analytics
- Ограниченные возможности отслеживания событий
- Нет комплексной аналитики пользовательского поведения
- Отсутствие продвинутых дашбордов

### Проблемы текущей реализации

- Ограниченные метрики пользовательского поведения
- Нет аналитики Web3-взаимодействий
- Отсутствие персонализированных отчетов
- Недостаточная аналитика монетизации

## Цели реализации

### Основные цели

- Интеграция аналитической системы
- Реализация отслеживания пользовательских событий
- Создание дашбордов для бизнес-метрик
- Настройка отчетов

### Технические цели

- Отслеживание пользовательских событий
- Аналитика Web3-взаимодействий
- Система визуализации данных
- Интеграция существующими системами

## План реализации

### Этап 1: Анализ и выбор инструментов (Неделя 1-2)

- Анализ требований к аналитике
- Выбор инструментов аналитики
- Проектирование архитектуры
- Подготовка схемы событий

### Этап 2: Backend разработка (Неделя 3-4)

- Создание сервиса событий
- Реализация API для аналитики
- Интеграция с базой данных
- Создание моделей аналитики

### Этап 3: Frontend интеграция (Неделя 5-6)

- Интеграция отслеживания событий
- Реализация Web3-аналитики
- Создание клиентского SDK
- Тестирование отслеживания

### Этап 4: Дашборды и визуализация (Неделя 7-8)

- Создание дашбордов для метрик
- Реализация визуализации данных
- Настройка отчетов
- Тестирование UX

### Этап 5: Внедрение (Неделя 9)

- Постепенное внедрение системы
- Мониторинг после внедрения
- Обновление документации

## Технические детали

### Архитектура системы аналитики

#### Схема данных для аналитики

```prisma
// schema.prisma
model AnalyticsEvent {
  id          String     @id @default(cuid())
  userId      String?    // Необязательно для анонимных событий
  user        User?      @relation(fields: [userId], references: [id])
  sessionId   String
  eventName   String
 properties  Json       // Дополнительные свойства события
  timestamp   DateTime   @default(now())
  userAgent   String?
  ip          String?
  pageUrl     String?
  referrer    String?

  @@index([userId])
  @@index([eventName])
  @@index([timestamp])
  @@index([sessionId])
}

model UserBehaviorMetric {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  metricName    String   // например, "session_duration", "tracks_played", "nfts_purchased"
  metricValue   Decimal
  periodStart   DateTime
  periodEnd     DateTime
  createdAt     DateTime @default(now())

  @@index([userId, metricName])
  @@index([periodStart])
}

model BusinessMetric {
  id            String   @id @default(cuid())
  metricName    String   // например, "daily_active_users", "revenue", "conversion_rate"
  metricValue   Decimal
  periodStart   DateTime
  periodEnd     DateTime
  createdAt     DateTime @default(now())

  @@index([metricName])
  @@index([periodStart])
}

model AnalyticsDashboard {
  id          String   @id @default(cuid())
  name        String
  description String?
  userId      String   // Владелец дашборда (для пользовательских дашбордов)
 config      Json     // Конфигурация дашборда
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([isPublic])
}
```

### Сервис аналитики

#### Основной сервис аналитики

```typescript
// src/lib/analytics-service.ts
import { prisma } from "@/lib/db";

export interface AnalyticsEventInput {
  userId?: string;
  sessionId: string;
  eventName: string;
  properties?: any;
  userAgent?: string;
  ip?: string;
  pageUrl?: string;
  referrer?: string;
}

export class AnalyticsService {
  static async trackEvent(event: AnalyticsEventInput): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          userId: event.userId,
          sessionId: event.sessionId,
          eventName: event.eventName,
          properties: event.properties || {},
          userAgent: event.userAgent,
          ip: event.ip,
          pageUrl: event.pageUrl,
          referrer: event.referrer,
        },
      });
    } catch (error) {
      console.error("Error tracking analytics event:", error);
      // Не бросаем ошибку, чтобы не прерывать основной поток
    }
  }

  static async trackPageView(
    userId: string,
    sessionId: string,
    pageUrl: string,
    referrer?: string
  ): Promise<void> {
    await this.trackEvent({
      userId,
      sessionId,
      eventName: "page_view",
      properties: { pageUrl },
      pageUrl,
      referrer,
    });
  }

  static async trackTrackPlay(
    userId: string,
    sessionId: string,
    trackId: string,
    duration?: number
  ): Promise<void> {
    await this.trackEvent({
      userId,
      sessionId,
      eventName: "track_play",
      properties: {
        trackId,
        duration,
        isComplete: duration !== undefined, // если указана продолжительность, считаем что трек прослушан полностью
      },
    });
  }

  static async trackNFTPurchase(
    userId: string,
    sessionId: string,
    nftId: string,
    price: number
  ): Promise<void> {
    await this.trackEvent({
      userId,
      sessionId,
      eventName: "nft_purchase",
      properties: { nftId, price },
    });
  }

  static async trackWalletConnection(
    userId: string,
    sessionId: string,
    walletType: string
  ): Promise<void> {
    await this.trackEvent({
      userId,
      sessionId,
      eventName: "wallet_connected",
      properties: { walletType },
    });
  }

  static async trackStakeAction(
    userId: string,
    sessionId: string,
    action: string,
    amount: number
  ): Promise<void> {
    await this.trackEvent({
      userId,
      sessionId,
      eventName: "stake_action",
      properties: { action, amount },
    });
  }

  // Методы для получения аналитических данных
  static async getUserBehavior(userId: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await prisma.analyticsEvent.findMany({
      where: {
        userId,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: "desc" },
    });

    // Агрегация данных
    const stats = {
      totalEvents: events.length,
      pageViews: events.filter((e) => e.eventName === "page_view").length,
      trackPlays: events.filter((e) => e.eventName === "track_play").length,
      nftPurchases: events.filter((e) => e.eventName === "nft_purchase").length,
      walletConnections: events.filter(
        (e) => e.eventName === "wallet_connected"
      ).length,
    };

    return { events, stats };
  }

  static async getDailyActiveUsers(date: Date) {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const uniqueUsers = await prisma.analyticsEvent.groupBy({
      by: ["userId"],
      where: {
        timestamp: {
          gte: startOfDay,
          lt: endOfDay,
        },
        userId: { not: null },
      },
      _count: true,
    });

    return uniqueUsers.length;
  }

  static async getRevenueMetrics(startDate: Date, endDate: Date) {
    const purchaseEvents = await prisma.analyticsEvent.findMany({
      where: {
        eventName: "nft_purchase",
        timestamp: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    const totalRevenue = purchaseEvents.reduce((sum, event) => {
      const price = event.properties["price"] as number;
      return sum + (price || 0);
    }, 0);

    return {
      totalRevenue,
      totalPurchases: purchaseEvents.length,
      averageOrderValue:
        purchaseEvents.length > 0 ? totalRevenue / purchaseEvents.length : 0,
    };
  }
}
```

### API для аналитики

#### API-эндпоинты для аналитики

```typescript
// src/app/api/analytics/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AnalyticsService } from "@/lib/analytics-service";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  try {
    const body = await request.json();
    const { eventName, properties, sessionId } = body;

    if (!eventName || !sessionId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Отслеживание события
    await AnalyticsService.trackEvent({
      userId: session?.user?.id,
      sessionId,
      eventName,
      properties,
      userAgent: request.headers.get("user-agent") || undefined,
      ip:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        undefined,
      pageUrl: request.url,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking event:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// src/app/api/analytics/metrics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AnalyticsService } from "@/lib/analytics-service";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const metricType = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let result;

    switch (metricType) {
      case "daily-active-users":
        // В реальном приложении: получение DAU за определенный период
        result = await getDailyActiveUsersMetric(startDate, endDate);
        break;
      case "revenue":
        const start = startDate
          ? new Date(startDate)
          : new Date(Date.now() - 30 * 24 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        result = await AnalyticsService.getRevenueMetrics(start, end);
        break;
      case "user-behavior":
        if (!searchParams.get("userId")) {
          return NextResponse.json(
            { error: "userId is required for user-behavior" },
            { status: 400 }
          );
        }
        result = await AnalyticsService.getUserBehavior(
          searchParams.get("userId")!,
          30
        );
        break;
      default:
        return NextResponse.json(
          { error: "Invalid metric type" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Вспомогательная функция для получения DAU
async function getDailyActiveUsersMetric(startDate?: string, endDate?: string) {
  const start = startDate
    ? new Date(startDate)
    : new Date(Date.now() - 30 * 24 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  // В реальном приложении: более сложная логика для получения DAU
  // по дням в заданном диапазоне
  const days = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dauData = [];

  for (let i = 0; i < Math.min(days, 30); i++) {
    const date = new Date(end);
    date.setDate(date.getDate() - i);
    const dau = await AnalyticsService.getDailyActiveUsers(new Date(date));

    dauData.push({
      date: date.toISOString().split("T")[0],
      dau,
    });
  }

  return {
    dauData,
    average: dauData.reduce((sum, day) => sum + day.dau, 0) / dauData.length,
  };
}
```

### Клиентский SDK аналитики

#### Клиентский SDK для отслеживания событий

```typescript
// src/lib/client-analytics.ts
declare global {
  interface Window {
    analytics: any;
  }
}

export class ClientAnalytics {
  private static instance: ClientAnalytics;
  private sessionId: string;
  private userId: string | null = null;
  private initialized: boolean = false;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.init();
  }

  static getInstance(): ClientAnalytics {
    if (!ClientAnalytics.instance) {
      ClientAnalytics.instance = new ClientAnalytics();
    }
    return ClientAnalytics.instance;
  }

  private init() {
    // Инициализация аналитики
    this.initialized = true;

    // Отслеживание просмотра страницы
    this.trackPageView(window.location.href);

    // Отслеживание навигации (для SPA)
    this.setupNavigationTracking();
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private setupNavigationTracking() {
    // Отслеживание навигации в браузере
    let currentUrl = window.location.href;

    // Для Next.js роутинга
    if (typeof window !== "undefined" && (window as any).next) {
      // Интеграция с Next.js роутингом
      const handleRouteChange = (url: string) => {
        this.trackPageView(url);
      };

      // В реальном приложении: подписка на события роутинга Next.js
    }

    // Для обычной навигации
    const handlePopState = () => {
      if (window.location.href !== currentUrl) {
        this.trackPageView(window.location.href);
        currentUrl = window.location.href;
      }
    };

    window.addEventListener("popstate", handlePopState);
  }

  async identify(userId: string) {
    this.userId = userId;
  }

  async track(eventName: string, properties: any = {}) {
    if (!this.initialized) return;

    try {
      await fetch("/api/analytics/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventName,
          properties,
          sessionId: this.sessionId,
          userId: this.userId,
        }),
      });
    } catch (error) {
      console.error("Error sending analytics event:", error);
    }
  }

  trackPageView(pageUrl: string, referrer?: string) {
    this.track("page_view", {
      pageUrl,
      referrer: referrer || document.referrer,
    });
  }

  trackTrackPlay(trackId: string, duration?: number) {
    this.track("track_play", { trackId, duration });
  }

  trackNFTPurchase(nftId: string, price: number) {
    this.track("nft_purchase", { nftId, price });
  }

  trackWalletConnection(walletType: string) {
    this.track("wallet_connected", { walletType });
  }

  trackButtonClick(elementId: string, elementText?: string) {
    this.track("button_click", {
      elementId,
      elementText,
      pageUrl: window.location.href,
    });
  }

  // Метод для автоматического отслеживания кликов
  setupAutoTracking() {
    document.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;

      // Отслеживание кликов по кнопкам и ссылкам
      if (target.tagName === "BUTTON" || target.tagName === "A") {
        const elementId =
          target.id || target.textContent?.substring(0, 20) || "unknown";
        this.trackButtonClick(
          target.tagName === "A" ? target.href : elementId,
          target.textContent || ""
        );
      }
    });
  }
}

// Инициализация глобального экземпляра
export const analytics = ClientAnalytics.getInstance();
```

### Дашборд аналитики

#### Компонент дашборда аналитики

```tsx
// src/app/admin/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/admin/DashboardLayout';
import {
  LineChart,
  Line,
 BarChart,
 Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
 const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/analytics/metrics?type=daily-active-users&startDate=${getDateRangeStart(dateRange)}`);
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [dateRange]);

  const getDateRangeStart = (range: string) => {
    const today = new Date();
    switch (range) {
      case '7d':
        today.setDate(today.getDate() - 7);
        break;
      case '30d':
        today.setDate(today.getDate() - 30);
        break;
      case '90d':
        today.setDate(today.getDate() - 90);
        break;
      default:
        today.setDate(today.getDate() - 7);
    }
    return today.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-60"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <div className="flex space-x-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>

        {/* Ключевые метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Daily Active Users"
            value={metrics?.dauData?.slice(-1)[0]?.dau || 0}
            change={calculateChange(metrics?.dauData)}
            icon="👤"
          />
          <MetricCard
            title="Total Revenue"
            value={`$${(metrics?.revenue?.totalRevenue || 0).toFixed(2)}`}
            change={0}
            icon="💰"
          />
          <MetricCard
            title="NFT Sales"
            value={metrics?.nftSales || 0}
            change={0}
            icon="🖼️"
          />
          <MetricCard
            title="Track Plays"
            value={metrics?.trackPlays || 0}
            change={0}
            icon="🎵"
          />
        </div>

        {/* Графики */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* DAU график */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Daily Active Users</h2>
            <ResponsiveContainer width="10%" height={300}>
              <LineChart data={metrics?.dauData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="dau" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Типы событий */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Event Distribution</h2>
            <ResponsiveContainer width="10%" height={300}>
              <BarChart data={[
                { name: 'Page Views', value: 1200 },
                { name: 'Track Plays', value: 800 },
                { name: 'NFT Purchases', value: 150 },
                { name: 'Wallet Connects', value: 300 },
                { name: 'Sign Ups', value: 50 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Таблица событий */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Events</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Properties</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* В реальном приложении: данные из API */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">user123</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">track_play</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{"{trackId: '456', duration: 180}"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2 min ago</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">user456</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">nft_purchase</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{"{nftId: '789', price: 0.5}"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5 min ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Компонент метрики
const MetricCard = ({ title, value, change, icon }: any) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
      <div className="text-2xl">{icon}</div>
    </div>
    <p className={`text-sm mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
      {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last period
    </p>
  </div>
);

// Вспомогательная функция для расчета изменения
const calculateChange = (data: any[]) => {
  if (!data || data.length < 2) return 0;

  const current = data[data.length - 1]?.dau || 0;
  const previous = data[data.length - 2]?.dau || 0;

  if (previous === 0) return current > 0 ? 100 : 0;

  return ((current - previous) / previous) * 100;
};
```

### Аналитика Web3-взаимодействий

#### Сервис аналитики Web3-событий

```typescript
// src/lib/web3-analytics-service.ts
import { AnalyticsService } from "./analytics-service";

export class Web3AnalyticsService {
  static async trackWalletConnection(
    userId: string,
    sessionId: string,
    walletType: string
  ) {
    await AnalyticsService.trackEvent({
      userId,
      sessionId,
      eventName: "wallet_connected",
      properties: {
        walletType,
        timestamp: new Date().toISOString(),
      },
    });

    // Дополнительная аналитика для внутреннего использования
    console.log(`Wallet connected: ${walletType} by user ${userId}`);
  }

  static async trackTransaction(
    userId: string,
    sessionId: string,
    transactionType: string,
    amount: number,
    token: string = "SOL"
  ) {
    await AnalyticsService.trackEvent({
      userId,
      sessionId,
      eventName: "web3_transaction",
      properties: {
        transactionType,
        amount,
        token,
        timestamp: new Date().toISOString(),
      },
    });
  }

  static async trackNFTMint(
    userId: string,
    sessionId: string,
    nftId: string,
    collection: string
  ) {
    await AnalyticsService.trackEvent({
      userId,
      sessionId,
      eventName: "nft_minted",
      properties: {
        nftId,
        collection,
        timestamp: new Date().toISOString(),
      },
    });
  }

  static async trackTokenSwap(
    userId: string,
    sessionId: string,
    fromToken: string,
    toToken: string,
    amount: number
  ) {
    await AnalyticsService.trackEvent({
      userId,
      sessionId,
      eventName: "token_swapped",
      properties: {
        fromToken,
        toToken,
        amount,
        timestamp: new Date().toISOString(),
      },
    });
  }

  static async trackStakeAction(
    userId: string,
    sessionId: string,
    action: string,
    amount: number,
    duration?: number
  ) {
    await AnalyticsService.trackEvent({
      userId,
      sessionId,
      eventName: "stake_action",
      properties: {
        action,
        amount,
        duration,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
```

## Риски и меры по их снижению

### Риск 1: Нарушение конфиденциальности

- **Мера**: Анонимизация данных
- **Мера**: Соблюдение GDPR и CCPA

### Риск 2: Перегрузка системы

- **Мера**: Асинхронная обработка событий
- **Мера**: Бatching запросов

### Риск 3: Недостоверные данные

- **Мера**: Валидация входных данных
- **Мера**: Фильтрация ботов

## Критерии успеха

- Комплексная аналитика пользовательского поведения
- Достоверные бизнес-метрики
- Удобные дашборды
- Принятие решений на основе данных
- Улучшенное понимание пользователей

## Ресурсы

- 2-3 разработчика на 9 недель
- Специалист по данным для настройки дашбордов
- QA-инженер для тестирования

## Сроки

- Начало: 1 ноября 2025
- Завершение: 6 декабря 2025
- Общее время: 9 недель
