import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors/errorHandler";
import { notificationSchema, notificationQuerySchema } from "@/lib/schemas";
import { NextResponse } from "next/server";

// GET /api/notifications - Fetch notifications for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const { userId, limit, offset, unreadOnly } = notificationQuerySchema.parse(query);

    const whereClause: any = { userId };
    if (unreadOnly) {
      whereClause.isRead = false;
    }

    const notifications = await db.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, type, message, url } = notificationSchema.parse(body);

    const notification = await db.notification.create({
      data: {
        userId,
        type,
        message,
        url,
      },
    });

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
