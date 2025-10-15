import { 
  createQR, 
  encodeURL, 
  TransactionRequestURLFields
} from '@solana/pay'
import { 
  Connection, 
  PublicKey, 
  Keypair,
  Transaction,
  SystemProgram
} from '@solana/web3.js'
import BigNumber from 'bignumber.js'

export interface EnhancedSolanaPayConfig {
  recipient: string;
  amount: number;
  label?: string;
  message?: string;
  memo?: string;
  splToken?: string;
  webhook?: string;
  timeout?: number;
}

export interface PaymentResult {
  success: boolean;
  signature?: string;
  error?: string;
  transaction?: Record<string, unknown>;
  fee?: string;
}

export interface TelegramPaymentConfig extends EnhancedSolanaPayConfig {
  enableTelegramVerification?: boolean;
  customVerificationParams?: Record<string, unknown>;
}

export class EnhancedSolanaPayService {
  private connection: Connection;
  private platformWallet: string;
  private webhookUrl?: string;

  constructor(rpcUrl: string, platformWallet: string, webhookUrl?: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.platformWallet = platformWallet;
    this.webhookUrl = webhookUrl;
  }

  /**
   * Generate payment request with enhanced features
   */
  async createEnhancedPaymentRequest(config: EnhancedSolanaPayConfig): Promise<{
    url: string;
    qrCode: string;
    reference: string;
    expiresAt: Date;
    timeout: number;
  }> {
    const {
      recipient,
      amount,
      label = "NormalDance",
      message = `Payment of ${amount} SOL`,
      memo,
      splToken,
      timeout = 300000, // 5 minutes default
    } = config;

    // Generate reference for tracking
    const reference = Keypair.generate();
    
    // Calculate expiration
    const expiresAt = new Date(Date.now() + timeout);

    const transactionRequest: TransactionRequestURLFields = {
      recipient: new PublicKey(recipient),
      amount: new BigNumber(amount),
      label,
      message,
      memo,
      reference: reference.publicKey,
    };

    const encodedURL = encodeURL(transactionRequest);
    const qrCode = createQR(encodedURL, {
      width: 400,
      margin: 0,
      color: {
        dark: "#FFFFFF",
        light: "#2B2D2B",
        transparent: "#0000"
      }
    });

    return {
      url: encodedURL,
      qrCode,
      reference: reference.publicKey.toString(),
      expiresAt,
      timeout
    };
  }

  /**
   * Verify payment using reference tracking
   */
  async verifyPayment(
    reference: string,
    recipient: string,
    expectedAmount?: number
  ): Promise<PaymentResult> {
    try {
      // Find the transaction using the reference
      const foundSignature = await this.findTransactionByReference(
        reference,
        recipient
      );

      if (!foundSignature) {
        return {
          success: false,
          error: 'Transaction not found'
        };
      }

      // Get transaction details
      const transaction = await this.connection.getTransaction(foundSignature);
      
      if (transaction.meta.err) {
        return {
          success: false,
          error: `Transaction failed: ${transaction.meta.err}`,
          signature: foundSignature
        };
      }

      // Verify recipient if specified
      if (recipient && transaction.transaction.message.instructions[0]) {
        const transferInstruction = transaction.transaction.message.instructions[0];
        if (transferInstruction.programId.toBase58() === "11111111111111111111111111111111111111111111111111111") {
          const transferInfo = transferInstruction.parsed;
          if (transferInfo.info.destination !== recipient) {
            return {
              success: false,
              error: 'Invalid recipient',
              signature: foundSignature
            };
          }

          // Verify amount if specified
          if (expectedAmount) {
            const transferAmount = new BigNumber(transferInfo.info.lamports).div(
              new BigNumber(10).pow(transferInfo.info.decimals || 9)
            );
            if (transferAmount.isLessThan(new BigNumber(expectedAmount).times(0.95))) {
              return {
                success: false,
                error: 'Amount mismatch',
                signature: foundSignature
              };
            }
          }
        }
      }

      // Send webhook notification if configured
      if (this.webhookUrl) {
        await this.sendWebhookNotification({
          type: 'payment_verified',
          signature: foundSignature,
          recipient,
          amount: expectedAmount,
          timestamp: new Date().toISOString()
        });
      }

      return {
        success: true,
        signature: foundSignature,
        transaction
      };
    } catch (error) {
      console.error('Payment verification failed:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  /**
   * Find transaction by reference
   */
  private async findTransactionByReference(
    reference: string,
    recipient: string
  ): Promise<string> {
    try {
      const info = await this.connection.getAccountInfo(
        new PublicKey(recipient)
      );
      
      // Get recent signatures
      const signatures = await this.connection.getSignaturesForAddress(
        new PublicKey(recipient),
        { limit: 10 }
      );

      // In a production environment, you would use a transaction indexing service
      // For now, we'll return a mock signature for demonstration
      return "mock_transaction_signature";
    } catch (error) {
      console.error('Error finding transaction:', error);
      throw error;
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(data: Record<string, unknown>): Promise<void> {
    if (!this.webhookUrl) return;

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Webhook notification failed:', error);
      // Don't throw error to avoid blocking payment flow
    }
  }

  /**
   * Monitor payment status with polling
   */
  async monitorPayment(
    reference: string,
    options: {
      recipient?: string;
      expectedAmount?: number;
      pollingInterval?: number;
      timeout?: number;
      onStatusChange?: (status: PaymentResult) => void;
    } = {}
  ): Promise<PaymentResult> {
    const {
      recipient,
      expectedAmount,
      pollingInterval = 3000,
      timeout = 300000,
      onStatusChange
    } = options;

    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = Math.floor(timeout / pollingInterval);

    while (attempts < maxAttempts) {
      try {
        const result = await this.verifyPayment(
          reference,
          recipient || this.platformWallet,
          expectedAmount
        );

        if (result.success) {
          onStatusChange?.(result);
          return result;
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
      } catch (error) {
        console.error(`Payment verification attempt ${attempts} failed:`, error);
        
        // Return failure after too many attempts
        if (attempts >= maxAttempts) {
          return {
            success: false,
            error: `Verification timeout after ${maxAttempts} attempts`,
          };
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
      }
    }

    return {
      success: false,
      error: 'Payment verification failed'
    };
  }

  /**
   * Calculate transaction fee
   */
  async calculateFee(amount: number): Promise<string> {
    try {
      const fee = amount * 0.000005; // 0.05% of amount in SOL
      return fee.toFixed(6);
    } catch (error) {
      console.error('Fee calculation failed:', error);
      return '0.000005';
    }
  }

  /**
   * Create Telegram Mini App enhanced payment
   */
  async createTelegramPayment(config: TelegramPaymentConfig): Promise<{
    qrCode: string;
    url: string;
    reference: string;
    expiresAt: Date;
    needsConfirmation: boolean;
  }> {
    const enhancedConfig = await this.createEnhancedPaymentRequest(config);

      return {
        ...enhancedConfig,
        needsConfirmation: true // Telegram Mini App always needs manual confirmation
      };
  }
}

export const enhancedSolanaPayService = new EnhancedSolanaPayService(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  process.env.NEXT_PUBLIC_PLATFORM_WALLET || "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9ReYzd4",
  process.env.SOLANA_PAY_WEBHOOK_URL
);
