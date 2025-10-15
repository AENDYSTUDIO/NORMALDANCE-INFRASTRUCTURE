import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logger } from '@/lib/utils/logger'
import { nftMintSchema } from '@/lib/schemas'
import { z } from 'zod'
import { validateTelegramInitData } from '@/lib/security/telegram-validator'
import { isValidSolanaAddress } from '@/lib/security/input-sanitizer'

// 🔐 SECURITY: Rate limiting for NFT minting (very strict)
const mintRateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkMintRateLimit(identifier: string, maxRequests: number = 3): boolean {
  const now = Date.now();
  const oneMinute = 60 * 1000;
  
  const record = mintRateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    mintRateLimitMap.set(identifier, { count: 1, resetTime: now + oneMinute });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

// 🔐 SECURITY: Enhanced validation schema for minting NFT
const mintSchema = z.object({
  nftId: z.string().uuid('Invalid NFT ID format'),
  recipientAddress: z.string().min(32).max(44, 'Invalid Solana address length'),
  quantity: z.number().int().min(1).max(10, 'Max 10 NFTs per mint'),
})

// POST /api/nft/mint - Mint NFT to a specific address
export async function POST(request: NextRequest) {
  try {
    // 🔐 SECURITY 1: Telegram authentication (CRITICAL for minting)
    const initData = request.headers.get('x-telegram-init-data');
    
    if (!initData) {
      logger.warn('NFT mint attempt without Telegram auth');
      return NextResponse.json(
        { error: 'Unauthorized: Telegram authentication required' },
        { status: 401 }
      );
    }
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      logger.error('TELEGRAM_BOT_TOKEN not configured!');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    const validation = validateTelegramInitData(initData, botToken, 3600);
    
    if (!validation.valid) {
      logger.warn('Invalid Telegram initData for NFT mint', { error: validation.error });
      return NextResponse.json(
        { error: `Authentication failed: ${validation.error}` },
        { status: 401 }
      );
    }
    
    const userId = validation.userId || 'anonymous';
    
    // 🔐 SECURITY 2: Very strict rate limiting (3 mints per minute)
    if (!checkMintRateLimit(`nft-mint:${userId}`, 3)) {
      logger.warn('Rate limit exceeded for NFT minting', { userId });
      return NextResponse.json(
        { error: 'Too many mint requests. Please wait before minting again.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
    
    const body = await request.json()
    
    // 🔐 SECURITY 3: Input validation
    const parseResult = mintSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.errors },
        { status: 400 }
      );
    }
    
    const { nftId, recipientAddress, quantity } = parseResult.data;
    
    // 🔐 SECURITY 4: Validate Solana address format
    if (!isValidSolanaAddress(recipientAddress)) {
      logger.warn('Invalid Solana address for NFT mint', { recipientAddress });
      return NextResponse.json(
        { error: 'Invalid Solana wallet address' },
        { status: 400 }
      );
    }
    
    // 🔐 SECURITY 5: Suspicious activity detection
    if (quantity > 5) {
      logger.warn('Suspicious NFT mint quantity', { userId, quantity, nftId });
      // Log for manual review but don't block yet
    }

    // Find the NFT
    const nft = await db.nft.findUnique({
      where: { id: nftId },
      include: {
        artist: true,
      }
    })

    if (!nft) {
      return NextResponse.json(
        { error: 'NFT not found' },
        { status: 404 }
      )
    }

    // Check if NFT is published
    if (!nft.isPublished) {
      return NextResponse.json(
        { error: 'NFT is not published for minting' },
        { status: 400 }
      )
    }

    // Check if there's enough supply
    const totalMinted = await db.nftOwner.count({
      where: { nftId: nftId }
    })

    if (totalMinted + quantity > nft.supply) {
      return NextResponse.json(
        { error: 'Not enough supply available' },
        { status: 400 }
      )
    }

    // Simulate blockchain minting process
    // In a real implementation, this would interact with Solana
    const mintTransaction = {
      signature: `mint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      blockhash: `blockhash_${Date.now()}`,
      slot: Math.floor(Date.now() / 1000),
    }

    // Create NFT ownership records
    const ownershipRecords: any[] = []
    for (let i = 0; i < quantity; i++) {
      const ownership = await db.nftOwner.create({
        data: {
          nftId: nftId,
          ownerAddress: recipientAddress,
          mintedAt: new Date(),
          transactionSignature: mintTransaction.signature,
          quantity: 1,
        }
      })
      ownershipRecords.push(ownership)
    }

    // Update NFT mint count
    await db.nft.update({
      where: { id: nftId },
      data: {
        mintCount: { increment: quantity },
        lastMintedAt: new Date(),
      }
    })

    // Award minting reward to artist (royalty)
    const royaltyAmount = nft.price ? Math.floor((nft.price * (nft.royaltyPercentage / 100)) * quantity) : 0
    if (royaltyAmount > 0) {
      // Apply deflationary model for royalty calculation (2% burn)
      const burnAmount = Math.floor(royaltyAmount * 0.02) // 2% burn
      const royaltyAfterDeflation = royaltyAmount - burnAmount
      
      await db.reward.create({
        data: {
          userId: nft.artistId,
          type: 'NFT',
          amount: royaltyAfterDeflation,
          reason: `NFT minting royalty: ${nft.title} (${quantity} units)`
        }
      })

      // Update artist balance
      await db.user.update({
        where: { id: nft.artistId },
        data: { balance: { increment: royaltyAfterDeflation } }
      })
    }

    // 🔐 SECURITY 6: Log successful mint event
    logger.info('NFT minted successfully', {
      userId,
      nftId,
      recipientAddress,
      quantity,
      transactionSignature: mintTransaction.signature,
    });

    return NextResponse.json({
      message: 'NFT minted successfully',
      transaction: mintTransaction,
      ownershipRecords,
      quantity,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('NFT mint validation failed', { errors: error.errors })
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('Error minting NFT', error as Error)
    return NextResponse.json(
      { error: 'Failed to mint NFT' },
      { status: 500 }
    )
  }
}