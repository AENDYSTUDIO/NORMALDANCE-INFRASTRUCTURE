import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { handleApiError } from '@/lib/errors/errorHandler'

// Validation schema for burning NFT
const burnSchema = z.object({
  nftId: z.string().min(1),
  ownerAddress: z.string().min(1),
  quantity: z.number().min(1).default(1),
})

// POST /api/nft/burn - Burn NFT (permanently remove from circulation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nftId, ownerAddress, quantity } = burnSchema.parse(body)

    // Find the NFT
    const nft = await db.nft.findUnique({
      where: { id: nftId },
      include: {
        owner: true,
        track: true,
      }
    })

    if (!nft) {
      return NextResponse.json({ error: 'NFT not found' }, { status: 404 })
    }

    // Check if owner has the NFT
    if (nft.ownerId !== ownerAddress) {
      return NextResponse.json({ error: 'You do not own this NFT' }, { status: 400 })
    }

    // Simulate blockchain burn process
    // In a real implementation, this would interact with Solana
    const burnTransaction = {
      signature: `burn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      blockhash: `blockhash_${Date.now()}`,
      slot: Math.floor(Date.now() / 1000),
    }

    // Update NFT status to BURNED
    await db.nft.update({
      where: { id: nftId },
      data: {
        status: 'BURNED',
        burnedAt: new Date(),
        transactionSignature: burnTransaction.signature,
      }
    })

    // Record burn history in rewards table
    await db.reward.create({
      data: {
        userId: nft.ownerId,
        type: 'NFT_BURN',
        amount: 0, // No reward for burning
        reason: `NFT burned: ${nft.name} (${quantity} units)`,
        metadata: {
          nftId: nft.id,
          transactionSignature: burnTransaction.signature,
          blockhash: burnTransaction.blockhash,
          slot: burnTransaction.slot,
        }
      }
    })

    return NextResponse.json({
      message: 'NFT burned successfully',
      transaction: burnTransaction,
      nft: {
        id: nft.id,
        name: nft.name,
        burnedAt: new Date(),
      },
      quantity,
    })
  } catch (error) {
    return handleApiError(error)
  }
}