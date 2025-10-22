import { PublicKey } from '@solana/web3.js'

// Валидные Solana адреса (base58)
export const NDT_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_NDT_PROGRAM_ID || '11111111111111111111111111111112'
)

export const NDT_MINT_ADDRESS = new PublicKey(
  process.env.NEXT_PUBLIC_NDT_MINT_ADDRESS || '11111111111111111111111111111112'
)

export const TRACKNFT_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_TRACKNFT_PROGRAM_ID || '11111111111111111111111111111112'
)

export const STAKING_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_STAKING_PROGRAM_ID || '11111111111111111111111111111112'
)
