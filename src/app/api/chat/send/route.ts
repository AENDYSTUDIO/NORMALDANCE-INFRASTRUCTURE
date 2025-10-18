import { authOptions, getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors/errorHandler";
import { chatMessageSchema } from "@/lib/schemas";
import { ChatMessageType } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

// POST /api/chat/send - Send message to chat
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = getSessionUser(session);

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, chatType, metadata } = chatMessageSchema.parse(body);

    // Check if user has enough balance
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: { balance: true, username: true, avatar: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const messageCost = 0.001; // 0.001 T1 per message

    if (user.balance < messageCost) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Check daily spending limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailySpending = await db.chatMessage.aggregate({
      where: {
        userId: sessionUser.id,
        createdAt: { gte: today },
      },
      _sum: { cost: true },
    });

    const totalDailySpending = dailySpending._sum?.cost || 0;
    const dailyLimit = 1.0; // 1 T1 per day

    if (totalDailySpending >= dailyLimit) {
      return NextResponse.json(
        { error: "Daily spending limit reached" },
        { status: 400 }
      );
    }

    // Determine message type and role
    let messageType: ChatMessageType = ChatMessageType.MESSAGE;
    let userRole = "voter";
    let permissions = ["vote"];

    // Check if it's a vote command
    if (content.startsWith("/vote")) {
      messageType = ChatMessageType.VOTE;

      // Parse vote command
      const voteMatch = content.match(/\/vote (\w+) (.+)/);
      if (voteMatch && metadata) {
        const [, voteType, target] = voteMatch;
        metadata.voteType = voteType;
        metadata.target = target;
      }
    }

    // Check if it's a poll command
    if (content.startsWith("/poll")) {
      messageType = ChatMessageType.POLL;
      const pollCost = 0.1; // 0.1 T1 to create poll

      if (user.balance < pollCost) {
        return NextResponse.json(
          { error: "Insufficient balance for poll creation" },
          { status: 400 }
        );
      }
    }

    // Determine user role based on holdings and activity
    const userHoldings = await db.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        clubMemberships: {
          where: { isActive: true },
          include: { club: true },
        },
        tracks: true,
      },
    });

    if (userHoldings) {
      // Check if user is club captain (owns 5%+ of club NFT supply)
      const clubMembership = userHoldings.clubMemberships[0];
      if (clubMembership && clubMembership.nftBalance >= 5) {
        userRole = "captain";
        permissions = ["vote", "create_poll", "platform_poll"];
      }

      // Check if user is artist (has minted tracks)
      if (userHoldings.tracks.length > 0) {
        userRole = "artist";
        permissions = ["vote", "create_poll", "boost_release"];
      }

      // Check if user is country moderator (top 10 by T1 donations)
      const countryDonations = await db.chatMessage.aggregate({
        where: {
          userId: sessionUser.id,
          chatType: "country",
          type: "FUND",
        },
        _sum: { cost: true },
      });

      if (countryDonations._sum?.cost && countryDonations._sum.cost > 100) {
        userRole = "moderator";
        permissions = ["vote", "moderate", "mute_users"];
      }
    }

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Deduct message cost from user balance
      await tx.user.update({
        where: { id: sessionUser.id },
        data: { balance: { decrement: messageCost } },
      });

      // Create chat message
      const message = await tx.chatMessage.create({
        data: {
          userId: sessionUser.id,
          chatType,
          content,
          type: messageType,
          cost: messageCost,
          role: userRole,
          metadata: metadata as any,
          isPinned: false,
        },
      });

      // Create reward for message (refund if no complaints)
      await tx.reward.create({
        data: {
          userId: sessionUser.id,
          type: "CHAT_MESSAGE",
          amount: messageCost,
          reason: `Chat message refund (pending review)`,
        },
      });

      return message;
    });

    // Format response
    const responseMessage = {
      id: result.id,
      userId: result.userId,
      username: user.username || "Anonymous",
      avatar: user.avatar || "/avatars/default.jpg",
      content: result.content,
      timestamp: result.createdAt.getTime(),
      type: result.type,
      reactions: [],
      isPinned: result.isPinned,
      cost: result.cost,
      role: {
        type: userRole,
        permissions,
        description: getRoleDescription(userRole),
      },
      metadata: result.metadata,
    };

    return NextResponse.json({
      success: true,
      message: responseMessage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Helper function to get role description
function getRoleDescription(role: string): string {
  const descriptions: { [key: string]: string } = {
    voter: "Голосующий",
    captain: "Капитан клуба",
    moderator: "Модератор страны",
    artist: "Артист",
  };
  return descriptions[role] || "Пользователь";
}
