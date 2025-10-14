# План системы управления контентом

## Обзор

В этом документе описывается план реализации админ-панели для управления контентом и пользователями проекта NormalDance. Это улучшение имеет низкий приоритет для Q3-Q4 2025 года, так как обеспечивает удобное управление платформой и более эффективную модерацию.

## Текущая ситуация

### Существующая система управления

- Базовая админ-панель
- Ограниченные возможности модерации
- Нет удобного интерфейса для управления контентом
- Ограниченные аналитические возможности

### Проблемы текущей реализации

- Недостаточная модерация контента
- Ограниченные инструменты управления
- Нет аналитики по контенту
- Сложный интерфейс для администраторов

## Цели реализации

### Основные цели

- Разработка интерфейса администратора
- Реализация системы модерации
- Создание инструментов управления пользователями
- Добавление аналитики контента

### Технические цели

- Безопасный доступ к админ-панели
- Удобный интерфейс для модерации
- Интеграция с существующими системами
- Современные UI/UX принципы

## План реализации

### Этап 1: Анализ и проектирование (Неделя 1-2)

- Анализ требований к админ-панели
- Проектирование архитектуры
- Подготовка макетов интерфейса
- Создание схемы данных

### Этап 2: Backend разработка (Неделя 3-4)

- Создание API для админ-панели
- Реализация системы авторизации
- Создание моделей для модерации
- Интеграция с существующими системами

### Этап 3: Frontend разработка (Неделя 5-7)

- Создание интерфейса админ-панели
- Реализация модерации контента
- Создание инструментов управления пользователями
- Интеграция с API

### Этап 4: Тестирование (Неделя 8)

- Тестирование безопасности
- Тестирование функциональности
- Тестирование UX
- Исправление выявленных проблем

### Этап 5: Внедрение (Неделя 9)

- Постепенное внедрение системы
- Обучение администраторов
- Обновление документации

## Технические детали

### Архитектура админ-панели

#### Схема данных для модерации

```prisma
// schema.prisma
enum ModerationStatus {
  PENDING
  APPROVED
  REJECTED
  UNDER_REVIEW
}

enum ReportType {
  INAPPROPRIATE_CONTENT
  COPYRIGHT_VIOLATION
  SPAM
  HATE_SPEECH
  OTHER
}

model ContentReport {
  id          String            @id @default(cuid())
  reporterId  String
  reporter    User              @relation(fields: [reporterId], references: [id], fields: [id])
  contentId   String
  contentType ContentType
  reportType  ReportType
  description String?
  status      ModerationStatus  @default(PENDING)
  resolvedAt  DateTime?
  resolvedBy String?
  resolvedByUser User?          @relation("Moderator", fields: [resolvedBy], references: [id])
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@index([reporterId])
  @@index([contentId, contentType])
  @@index([status])
  @@index([resolvedBy])
}

enum ContentType {
  TRACK
  NFT
  USER_PROFILE
 COMMENT
  PLAYLIST
}

model ModerationAction {
 id          String            @id @default(cuid())
  moderatorId String
  moderator   User              @relation(fields: [moderatorId], references: [id])
  contentId   String
  contentType ContentType
  action      ModerationActionType
  reason      String?
  metadata    Json?
  createdAt   DateTime          @default(now())

  @@index([moderatorId])
  @@index([contentId, contentType])
}

enum ModerationActionType {
  APPROVE
  REJECT
  HIDE
  DELETE
  WARN_USER
  SUSPEND_USER
}

model AdminDashboardSetting {
  id          String   @id @default(cuid())
  key         String   @unique
  value       Json
  description String?
  updatedAt   DateTime @updatedAt

  @@index([key])
}
```

### API для админ-панели

#### Защита админ-панели

```typescript
// src/lib/admin-guard.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return session;
}

// Middleware для админ-панели
export function withAdminAuth(handler: any) {
  return async (request: NextRequest, ...args: any[]) => {
    const authResult = await requireAdmin(request);

    if (authResult.status === 401) {
      return authResult;
    }

    return handler(request, ...args);
  };
}
```

#### API-эндпоинты для модерации

```typescript
// src/app/api/admin/moderation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/admin-guard";
import {
  ModerationStatus,
  ContentType,
  ModerationActionType,
} from "@prisma/client";

// Получение отчетов на модерацию
export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";
    const contentType = searchParams.get("contentType") as ContentType | null;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const whereClause: any = { status };

    if (contentType) {
      whereClause.contentType = contentType;
    }

    const reports = await prisma.contentReport.findMany({
      where: whereClause,
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        resolvedByUser: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await prisma.contentReport.count({ where: whereClause });

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
});

// Обработка отчета
export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { reportId, action, reason } = body;
    const session = await getServerSession(authOptions);

    if (!reportId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Обновление статуса отчета
    const updatedReport = await prisma.contentReport.update({
      where: { id: reportId },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        resolvedAt: new Date(),
        resolvedBy: session?.user.id,
      },
      include: {
        reporter: true,
      },
    });

    // Создание записи о действии модератора
    await prisma.moderationAction.create({
      data: {
        moderatorId: session?.user.id,
        contentId: updatedReport.contentId,
        contentType: updatedReport.contentType,
        action: action as ModerationActionType,
        reason,
        metadata: { reportId: updatedReport.id },
      },
    });

    // В зависимости от типа контента и действия, выполнить соответствующие действия
    await handleModerationAction(updatedReport, action, reason);

    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    console.error("Error processing report:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
});

// Вспомогательная функция для обработки действий модерации
async function handleModerationAction(
  report: any,
  action: string,
  reason?: string
) {
  switch (report.contentType) {
    case "TRACK":
      if (action === "HIDE") {
        await prisma.track.update({
          where: { id: report.contentId },
          data: { status: "hidden" },
        });
      } else if (action === "DELETE") {
        await prisma.track.update({
          where: { id: report.contentId },
          data: { status: "deleted" },
        });
      }
      break;
    case "NFT":
      if (action === "HIDE") {
        await prisma.nFT.update({
          where: { id: report.contentId },
          data: { status: "hidden" },
        });
      } else if (action === "DELETE") {
        await prisma.nFT.update({
          where: { id: report.contentId },
          data: { status: "deleted" },
        });
      }
      break;
    // Добавить обработку других типов контента
  }
}
```

### Интерфейс админ-панели

#### Основной компонент админ-панели

```tsx
// src/app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { useAdminStats } from "@/hooks/useAdminStats";

const AdminDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { fetchStats } = useAdminStats();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchStats();
        setStats(data);
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

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
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            change={stats?.userGrowth || 0}
            icon="👥"
          />
          <StatCard
            title="Total Tracks"
            value={stats?.totalTracks || 0}
            change={stats?.trackGrowth || 0}
            icon="🎵"
          />
          <StatCard
            title="Total NFTs"
            value={stats?.totalNFTs || 0}
            change={stats?.nftGrowth || 0}
            icon="🖼️"
          />
          <StatCard
            title="Pending Reports"
            value={stats?.pendingReports || 0}
            change={stats?.reportTrend || 0}
            icon="⚠️"
          />
        </div>

        {/* Быстрые действия */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickAction
              title="Content Moderation"
              description="Review and manage content reports"
              href="/admin/moderation"
              icon="🛡️"
            />
            <QuickAction
              title="User Management"
              description="Manage user accounts and permissions"
              href="/admin/users"
              icon="👤"
            />
            <QuickAction
              title="Content Management"
              description="Manage tracks, NFTs, and playlists"
              href="/admin/content"
              icon="📚"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Компонент статистики
const StatCard = ({ title, value, change, icon }: any) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
      <div className="text-2xl">{icon}</div>
    </div>
    <p
      className={`text-sm mt-2 ${
        change >= 0 ? "text-green-600" : "text-red-600"
      }`}
    >
      {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% from last week
    </p>
  </div>
);

// Компонент быстрого действия
const QuickAction = ({ title, description, href, icon }: any) => (
  <a
    href={href}
    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
  >
    <div className="flex items-start space-x-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  </a>
);
```

#### Компонент модерации контента

```tsx
// src/app/admin/moderation/page.tsx
"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { ReportCard } from "@/components/admin/ReportCard";

const ModerationPage = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(
          `/api/admin/moderation?status=${filter}&page=${page}&limit=10`
        );
        const data = await response.json();

        setReports(data.reports);
        setTotalPages(data.pagination.pages);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [filter, page]);

  const handleAction = async (
    reportId: string,
    action: string,
    reason?: string
  ) => {
    try {
      const response = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportId, action, reason }),
      });

      if (response.ok) {
        // Обновить список отчетов
        const updatedReports = reports.filter(
          (report) => report.id !== reportId
        );
        setReports(updatedReports);
      }
    } catch (error) {
      console.error("Error processing report:", error);
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
          <h1 className="text-2xl font-bold">Content Moderation</h1>
          <div className="flex space-x-4">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="UNDER_REVIEW">Under Review</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reports found
            </div>
          ) : (
            reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onAction={handleAction}
              />
            ))
          )}
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              Previous
            </button>

            <span className="px-3 py-1">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
```

#### Компонент карточки отчета

```tsx
// src/components/admin/ReportCard.tsx
import { useState } from 'react';

interface Report {
  id: string;
  reporter: {
    username: string;
    email: string;
  };
  contentId: string;
  contentType: string;
  reportType: string;
  description: string;
  status: string;
  createdAt: string;
}

interface ReportCardProps {
  report: Report;
  onAction: (reportId: string, action: string, reason?: string) => void;
}

export const ReportCard = ({ report, onAction }: ReportCardProps) => {
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reason, setReason] = useState('');

  const handleAction = (action: string) => {
    if (action === 'REJECT') {
      setShowReasonModal(true);
      return;
    }

    onAction(report.id, action);
  };

  const confirmAction = () => {
    onAction(report.id, 'REJECT', reason);
    setReason('');
    setShowReasonModal(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              report.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              report.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
              report.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {report.status}
            </span>
            <span className="text-sm text-gray-500">
              {new Date(report.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h3 className="font-medium">{report.reportType} Report</h3>
          <p className="text-sm text-gray-600 mb-2">
            Reported by: {report.reporter.username} ({report.reporter.email})
          </p>

          {report.description && (
            <p className="text-gray-700 mb-3">{report.description}</p>
          )}

          <div className="text-sm">
            <p><span className="font-medium">Content ID:</span> {report.contentId}</p>
            <p><span className="font-medium">Type:</span> {report.contentType}</p>
          </div>

        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => handleAction('APPROVE')}
            className="px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm"
          >
            Approve
          </button>
          <button
            onClick={() => handleAction('REJECT')}
            className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm"
          >
            Reject
          </button>
          <button
            onClick={() => handleAction('HIDE')}
            className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-sm"
          >
            Hide
          </button>
        </div>
      </div>

      {/* Модальное окно для причины отклонения */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Reason for Rejection</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 mb-4"
              placeholder="Enter reason for rejection..."
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowReasonModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={!reason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

### Управление пользователями

#### API для управления пользователями

```typescript
// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/admin-guard";
import { UserRole } from "@prisma/client";

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        avatar: true,
        bio: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await prisma.user.count({ where: whereClause });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
});

export const PUT = withAdminAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { userId, role, status } = body;
    const session = await getServerSession(authOptions);

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Обновление роли пользователя
    if (role) {
      await prisma.user.update({
        where: { id: userId },
        data: { role: role as UserRole },
      });
    }

    // Создание записи о действии модератора
    await prisma.moderationAction.create({
      data: {
        moderatorId: session?.user.id,
        contentId: userId,
        contentType: "USER_PROFILE",
        action: "WARN_USER", // или другой тип действия
        reason: `User role updated to ${role}`,
        metadata: { newRole: role },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
});
```

### Система аналитики

#### Хуки для получения статистики

```typescript
// src/hooks/useAdminStats.ts
import { useState } from "react";

export const useAdminStats = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();
      setStats(data);
      return data;
    } catch (error) {
      console.error("Error fetching stats:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    fetchStats,
  };
};
```

#### API для статистики

```typescript
// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/admin-guard";

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    // Получение общей статистики
    const [
      totalUsers,
      totalTracks,
      totalNFTs,
      pendingReports,
      newUserCount,
      newTrackCount,
      newNFTCount,
      reportTrend,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.track.count(),
      prisma.nFT.count(),
      prisma.contentReport.count({ where: { status: "PENDING" } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // за последнюю неделю
          },
        },
      }),
      prisma.track.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.nFT.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.contentReport.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 1000),
          },
        },
      }),
    ]);

    // Рассчет роста в процентах (упрощенный расчет)
    const userGrowth = totalUsers > 0 ? (newUserCount / totalUsers) * 100 : 0;
    const trackGrowth =
      totalTracks > 0 ? (newTrackCount / totalTracks) * 100 : 0;
    const nftGrowth = totalNFTs > 0 ? (newNFTCount / totalNFTs) * 100 : 0;
    const reportTrendPercent =
      pendingReports > 0 ? (reportTrend / pendingReports) * 100 : 0;

    return NextResponse.json({
      totalUsers,
      totalTracks,
      totalNFTs,
      pendingReports,
      userGrowth: parseFloat(userGrowth.toFixed(2)),
      trackGrowth: parseFloat(trackGrowth.toFixed(2)),
      nftGrowth: parseFloat(nftGrowth.toFixed(2)),
      reportTrend: parseFloat(reportTrendPercent.toFixed(2)),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
});
```

## Риски и меры по их снижению

### Риск 1: Несанкционированный доступ к админ-панели

- **Мера**: Многоуровневая аутентификация
- **Мера**: Регулярный аудит доступа

### Риск 2: Ошибочная модерация контента

- **Мера**: Система подтверждения действий
- **Мера**: Обучение модераторов

### Риск 3: Низкая эффективность модерации

- **Мера**: Автоматизация простых задач
- **Мера**: Приоритезация отчетов

## Критерии успеха

- Упрощенное управление платформой
- Более эффективная модерация
- Удобный интерфейс для администраторов
- Снижение времени обработки отчетов
- Улучшенная аналитика

## Ресурсы

- 2-3 разработчика на 9 недель
- UI/UX-дизайнер для интерфейса
- QA-инженер для тестирования

## Сроки

- Начало: 1 октября 2025
- Завершение: 28 ноября 2025
- Общее время: 9 недель
