import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors/errorHandler";
import { messageSchema, messageQuerySchema } from "@/lib/schemas";
import { NextResponse } from "next/server";

// GET /api/messages - Fetch messages between two users
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const { userId, otherUserId, limit, offset } = messageQuerySchema.parse(query);

    const messages = await db.message.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/messages - Send a message
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { senderId, recipientId, content } = messageSchema.parse(body);

    const message = await db.message.create({
      data: {
        senderId,
        recipientId,
        content,
      },
    });

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
