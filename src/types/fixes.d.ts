// Временные типы для исправления критических ошибок

declare module 'bn.js' {
  export default class BN {
    constructor(value: string | number | BN)
    toString(): string
    toNumber(): number
  }
}

declare module 'swagger-jsdoc' {
  export default function swaggerJSDoc(options: any): any
}

declare module 'js-sha3' {
  export function keccak256(data: string): string
}

// Исправление типов Solana
declare module '@solana/web3.js' {
  export class Connection {
    constructor(endpoint: string)
  }
  export class PublicKey {
    constructor(value: string)
    toString(): string
  }
  export class Transaction {
    constructor()
  }
  export class Keypair {
    static generate(): Keypair
    publicKey: PublicKey
  }
  export const LAMPORTS_PER_SOL: number
}

// Глобальные типы
declare global {
  interface Window {
    Telegram?: {
      WebApp: any
    }
  }
}