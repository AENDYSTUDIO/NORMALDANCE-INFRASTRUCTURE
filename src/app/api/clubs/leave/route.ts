import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors/errorHandler";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
<<<<<<< HEAD
=======
import { clubLeavePostSchema } from "@/lib/schemas";
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337

// POST /api/clubs/leave - Leave current club
export async function POST() {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user's active club membership
    const membership = await db.clubMember.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        club: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No active club membership found" },
        { status: 404 }
      );
    }

    // Use transaction to ensure data consistency
    await db.$transaction(async (tx) => {
      // Deactivate membership
      await tx.clubMember.update({
        where: { id: membership.id },
        data: {
          isActive: false,
          leftAt: new Date(),
        },
      });

      // Update club member count
      await tx.club.update({
        where: { id: membership.clubId },
        data: { memberCount: { decrement: 1 } },
      });

      // Refund partial amount (80% of original price)
      const refundAmount = Math.floor(membership.club.price * 0.8);

      await tx.user.update({
        where: { id: session.user.id },
        data: { balance: { increment: refundAmount } },
      });

      // Create refund transaction record
      await tx.reward.create({
        data: {
          userId: session.user.id,
          type: "CLUB_LEAVE",
          amount: refundAmount,
          reason: `Club leave refund from ${membership.club.name}`,
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: session.user.id,
          type: "CLUB_LEAVE",
          title: "Вы покинули клуб",
          message: `Вы покинули ${membership.club.name} и получили возврат ${refundAmount} T1`,
          data: {
            clubId: membership.clubId,
            clubName: membership.club.name,
            refundAmount,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Successfully left club",
      refundAmount: Math.floor(membership.club.price * 0.8),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
