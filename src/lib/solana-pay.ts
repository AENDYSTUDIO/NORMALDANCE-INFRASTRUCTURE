import { createQR, encodeURL, validateTransfer } from '@solana/pay';
import { Connection, PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

// Configuration interface
export interface SolanaPayConfig {
  recipient: string;
  amount: number;
  label?: string;
  message?: string;
  memo?: string;
  splToken?: string;
}

// Solana Pay Service class
export class SolanaPayService {
  private connection: Connection;
  private rpcUrl: string;
  private platformWallet: string;

  constructor(rpcUrl: string, platformWallet: string) {
    this.rpcUrl = rpcUrl;
    this.platformWallet = platformWallet;
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Generate a payment request URL
   */
  generatePaymentURL(config: SolanaPayConfig): string {
    const {
      recipient = this.platformWallet,
      amount,
      label,
      message,
      memo,
      splToken
    } = config;

    // Validate required fields
    if (!recipient) {
      throw new Error('Recipient is required');
    }
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    const url = encodeURL({
      recipient: new PublicKey(recipient),
      amount: new BigNumber(amount),
      ...(label && { label }),
      ...(message && { message }),
      ...(memo && { memo }),
      ...(splToken && { splToken: new PublicKey(splToken) })
    });

    return url;
  }

  /**
   * Create a QR code for payment
   */
  createPaymentQR(config: SolanaPayConfig, size: number = 200, bg: string = '#ffffff'): string {
    const url = this.generatePaymentURL(config);
    return createQR(url, size, bg);
  }

  /**
   * Validate a payment transaction
   */
  async validatePayment(signature: string, config: Omit<SolanaPayConfig, 'amount'> & { amount: number }): Promise<boolean> {
    try {
      const {
        recipient,
        amount,
        label,
        message,
        memo,
        splToken
      } = config;

      // Validate required fields
      if (!recipient) {
        throw new Error('Recipient is required for validation');
      }
      
      if (amount <= 0) {
        throw new Error('Amount must be greater than zero for validation');
      }

      // Create recipient PublicKey
      const recipientPubKey = new PublicKey(recipient);
      
      // Validate transfer
      const validated = await validateTransfer(
        this.connection,
        signature,
        {
          recipient: recipientPubKey,
          amount: new BigNumber(amount),
          ...(label && { label }),
          ...(message && { message }),
          ...(memo && { memo }),
          ...(splToken && { splToken: new PublicKey(splToken) })
        }
      );

      return validated;
    } catch (error) {
      console.error('Payment validation failed:', error);
      return false;
    }
  }

  /**
   * Create a payment request object
   */
  createPaymentRequest(config: SolanaPayConfig): {
    url: string;
    qr: string;
  } {
    const url = this.generatePaymentURL(config);
    const qr = this.createPaymentQR(config);
    
    return {
      url,
      qr
    };
  }
}