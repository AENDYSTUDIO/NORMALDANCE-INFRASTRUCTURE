import { PublicKey } from "@solana/web3.js";

// Валидные Solana адреса (base58) - используйте переменные окружения для продакшена
export const NDT_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_NDT_PROGRAM_ID ||
    "So11111111111111111111111111111111111111112" // Wrapped SOL mint как fallback для dev
);

export const NDT_MINT_ADDRESS = new PublicKey(
  process.env.NEXT_PUBLIC_NDT_MINT_ADDRESS ||
    "So11111111111111111111111111111111111111112" // Wrapped SOL mint как fallback для dev
);

export const TRACKNFT_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_TRACKNFT_PROGRAM_ID ||
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" // Token Program как fallback для dev
);

export const STAKING_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_STAKING_PROGRAM_ID ||
    "Stake11111111111111111111111111111111111111" // Stake Program как fallback для dev
);
