import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions, getSessionUser } from '@/lib/auth'
import { chatReportSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

// POST /api/chat/report - Report spam or inappropriate content
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = getSessionUser(session)
    
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { messageId, reason } = chatReportSchema.parse(body)

    // Check if user has enough balance for report
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: { balance: true }
    })

    if (!user || user.balance < 0.01) {
      return NextResponse.json(
        { error: 'Insufficient balance for report' },
        { status: 400 }
      )
    }

    const reportCost = 0.01 // 0.01 T1 to report

    // Check if user already reported this message
    const existingReport = await db.chatReport.findFirst({
      where: {
        messageId,
        reporterId: sessionUser.id
      }
    })

    if (existingReport) {
      return NextResponse.json(
        { error: 'Already reported this message' },
        { status: 400 }
      )
    }

    // Use transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // Deduct report cost from user balance
      await tx.user.update({
        where: { id: sessionUser.id },
        data: { balance: { decrement: reportCost } }
      })

      // Create report
      const report = await tx.chatReport.create({
        data: {
          messageId,
          reporterId: sessionUser.id,
          reason,
          status: 'PENDING'
        }
      })

      // Check if message has enough reports to trigger moderation
      const reportCount = await tx.chatReport.count({
        where: { 
          messageId,
          status: 'PENDING'
        }
      })

      if (reportCount >= 3) {
        // Auto-moderate if 3+ reports
        await tx.chatMessage.update({
          where: { id: messageId },
          data: { isModerated: true }
        })

        // Update all reports to reviewed
        await tx.chatReport.updateMany({
          where: { messageId },
          data: { status: 'REVIEWED' }
        })

        // Find message author and penalize
        const message = await tx.chatMessage.findUnique({
          where: { id: messageId },
          select: { userId: true }
        })

        if (message) {
          // Penalize spammer
          await tx.user.update({
            where: { id: message.userId },
            data: { balance: { decrement: 0.1 } } // 0.1 T1 penalty
          })

          // Reward reporters
          const reporters = await tx.chatReport.findMany({
            where: { messageId },
            select: { reporterId: true }
          })

          for (const reporter of reporters) {
            await tx.user.update({
              where: { id: reporter.reporterId },
              data: { balance: { increment: 0.02 } } // 0.02 T1 reward
            })

            await tx.reward.create({
              data: {
                userId: reporter.reporterId,
                type: 'SPAM_REPORT_REWARD',
                amount: 0.02,
                reason: 'Spam report reward'
              }
            })
          }
        }
      }

      return report
    })

    return NextResponse.json({
      success: true,
      report: {
        id: result.id,
        messageId: result.messageId,
        reporterId: result.reporterId,
        reason: result.reason,
        status: result.status,
        createdAt: result.createdAt.getTime()
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}
