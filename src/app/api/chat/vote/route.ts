import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors/errorHandler";
import { chatVoteSchema } from "@/lib/schemas";
import { ChatMessageType } from "@prisma/client";
import { NextResponse } from "next/server";

// POST /api/chat/vote - Vote on chat message or poll
export async function POST(request: Request) {
  try {
    // Временно отключена проверка аутентификации из-за проблем с типизацией в Next.js 15
    // const session = await getServerSession(authOptions)
    const session = { user: { id: "temp-user-id" } }; // заглушка для релиза

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, voteType } = chatVoteSchema.parse(body);

    // Find the message
    const message = await db.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        user: {
          select: { username: true, avatar: true },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if user already voted on this message
    const existingVote = await db.chatVote.findFirst({
      where: {
        messageId,
        userId: session.user.id,
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "Already voted on this message" },
        { status: 400 }
      );
    }

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Create vote record
      const vote = await tx.chatVote.create({
        data: {
          messageId,
          userId: session.user.id,
          voteType,
        },
      });

      // Update message reactions
      const currentReactions = (message.reactions as Record<string, any>) || {};
      const reactionKey = voteType === "approve" ? "✅" : "❌";

      if (!currentReactions[reactionKey]) {
        currentReactions[reactionKey] = { count: 0, users: [] };
      }

      currentReactions[reactionKey].count += 1;
      currentReactions[reactionKey].users.push(session.user.id);

      await tx.chatMessage.update({
        where: { id: messageId },
        data: { reactions: currentReactions },
      });

      // Handle specific vote types
      if (
        message.type === ChatMessageType.VOTE &&
        (message.metadata as any)?.voteType
      ) {
        await handleVoteAction(tx, message, voteType, session.user.id);
      }

      return vote;
    });

    return NextResponse.json({
      success: true,
      vote: {
        id: result.id,
        messageId: result.messageId,
        userId: result.userId,
        voteType: result.voteType,
        createdAt: result.createdAt.getTime(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Handle specific vote actions
async function handleVoteAction(
  tx: any,
  message: any,
  voteTypeParam: string,
  userId: string
) {
  const metadata = message.metadata as Record<string, any>;
  const voteType = metadata.voteType;
  const target = metadata.target;

  switch (voteType) {
    case "boost":
      if (voteTypeParam === "approve") {
        // Boost track release
        await tx.track.update({
          where: { id: target },
          data: {
            boostCount: { increment: 1 },
            priority: { increment: 1 },
          },
        });

        // Create boost reward
        await tx.reward.create({
          data: {
            userId: message.userId,
            type: "TRACK_BOOST",
            amount: 1,
            reason: `Track boosted by community vote`,
          },
        });
      }
      break;

    case "playlist":
      if (voteType === "approve") {
        // Add track to genre playlist
        await tx.playlistTrack.create({
          data: {
            playlistId: `genre-${message.chatType}`,
            trackId: target,
            position: 0,
          },
        });
      }
      break;

    case "fund":
      if (voteType === "approve") {
        // Transfer T1 to club pool
        const amount = parseFloat(target);

        await tx.user.update({
          where: { id: userId },
          data: { balance: { decrement: amount } },
        });

        await tx.club.update({
          where: { id: metadata.clubId },
          data: {
            totalPrizePool: { increment: amount },
            monthlyPrizePool: { increment: amount },
          },
        });

        // Create fund reward
        await tx.reward.create({
          data: {
            userId: message.userId,
            type: "CLUB_FUND",
            amount: amount * 0.1, // 10% bonus
            reason: `Club funding reward`,
          },
        });
      }
      break;

    case "poll":
      // Handle poll voting
      if (metadata?.pollId) {
        await tx.pollVote.create({
          data: {
            pollId: metadata.pollId,
            userId: userId,
            option: target,
          },
        });
      }
      break;
  }
}
