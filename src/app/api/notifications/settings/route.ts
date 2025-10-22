import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors/errorHandler";
import { notificationSettingsSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";

// GET /api/notifications/settings - Fetch notification settings for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const settings = await db.user.findUnique({
      where: { id: userId },
      select: { emailNotifications: true, pushNotifications: true },
    });

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/notifications/settings - Update notification settings for a user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, emailNotifications, pushNotifications } = notificationSettingsSchema.parse(body);

    const updatedSettings = await db.user.update({
      where: { id: userId },
      data: {
        emailNotifications,
        pushNotifications,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSettings,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
