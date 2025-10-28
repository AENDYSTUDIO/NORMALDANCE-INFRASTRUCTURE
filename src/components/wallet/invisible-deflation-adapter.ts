import { EventEmitter } from 'events';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PrismaClient } from '@prisma/client';
import { DeflationaryTokenManager } from '../../lib/wallet/deflationary-token-manager';
import { WalletAdapter } from './wallet-adapter';

interface InvisibleDeflationConfig {
  autoBurnEnabled: boolean;
  showBurnNotifications: boolean;
  cacheTransactionResults: boolean;
  feeCalculationMode: 'standard' | 'dynamic';
}

export interface InvisibleTransactionResult {
  success: boolean;
  transactionId?: string;
  burnedAmount: number;
  treasuryAmount: number;
  stakingAmount: number;
  netAmount: number;
  originalAmount: number;
  feeAmount: number;
  error?: string;
}

export class InvisibleDeflationAdapter extends EventEmitter {
  private deflationaryTokenManager: DeflationaryTokenManager;
  private walletAdapter: WalletAdapter;
  private config: InvisibleDeflationConfig;
  private transactionCache: Map<string, InvisibleTransactionResult>;
  private connection: Connection;
  private db: PrismaClient;

  constructor(
    connection: Connection,
    db: PrismaClient,
    walletAdapter: WalletAdapter,
    config?: Partial<InvisibleDeflationConfig>
  ) {
    super();
    
    this.connection = connection;
    this.db = db;
    this.walletAdapter = walletAdapter;
    this.deflationaryTokenManager = new DeflationaryTokenManager(connection, db, walletAdapter);
    
    this.config = {
      autoBurnEnabled: true,
      showBurnNotifications: true,
      cacheTransactionResults: true,
      feeCalculationMode: 'standard',
      ...config
    };
    
    this.transactionCache = new Map();
    
    // Listen to wallet events to handle deflation automatically
    this.walletAdapter.on('transaction', (tx) => {
      this.handleWalletTransaction(tx);
    });
  }

  /**
   * Executes a deflationary token transaction through the invisible adapter
   * This method handles the transaction transparently without user intervention
   */
  async executeInvisibleTransaction(
    toPublicKey: PublicKey,
    tokenMint: PublicKey,
    amount: number
  ): Promise<InvisibleTransactionResult> {
    try {
      // Get the connected wallet public key
      const fromPublicKey = this.walletAdapter.publicKey;
      if (!fromPublicKey) {
        throw new Error('Wallet not connected');
      }

      // Calculate fees before transaction
      const fees = this.calculateFees(amount);
      const totalAmount = amount + fees.feeAmount;

      // Check if user has sufficient balance
      const tokenAccount = await this.connection.getTokenAccountBalance(
        await Token.getAssociatedTokenAddress(
          tokenMint,
          fromPublicKey
        )
      );
      
      if (tokenAccount.value.amount < totalAmount) {
        throw new Error(`Insufficient balance. Required: ${totalAmount}, Available: ${tokenAccount.value.amount}`);
      }

      // Create deflationary transaction
      const result = await this.deflationaryTokenManager.createDeflationaryTransaction(
        fromPublicKey,
        toPublicKey,
        tokenMint,
        amount
      );

      if (!result.success) {
        throw new Error(`Deflationary transaction failed: ${result.error}`);
      }

      // Execute the transaction using wallet adapter
      const transaction = new Transaction().add(
        Token.createTransferInstruction(
          TOKEN_PROGRAM_ID,
          tokenMint,
          fromPublicKey,
          toPublicKey,
          [],
          result.netAmount
        )
      );

      // Add burn instruction if applicable
      if (result.burnedAmount > 0) {
        const burnAddress = new PublicKey('11111111'); // Burn address
        transaction.add(
          Token.createTransferInstruction(
            TOKEN_PROGRAM_ID,
            tokenMint,
            fromPublicKey,
            burnAddress,
            [],
            result.burnedAmount
          )
        );
      }

      // Sign and send transaction
      const signature = await this.walletAdapter.sendTransaction(transaction, this.connection);

      // Update result with transaction details
      result.transactionId = signature;
      result.originalAmount = amount;
      result.feeAmount = result.burnedAmount + result.treasuryAmount + result.stakingAmount;

      // Cache the result if caching is enabled
      if (this.config.cacheTransactionResults && signature) {
        this.transactionCache.set(signature, result);
      }

      // Emit events for UI updates
      this.emit('transactionComplete', result);
      this.emit('tokensBurned', {
        amount: result.burnedAmount,
        tokenMint: tokenMint.toString()
      });
      this.emit('feesDistributed', {
        treasury: result.treasuryAmount,
        staking: result.stakingAmount,
        tokenMint: tokenMint.toString()
      });

      // Show notification if enabled
      if (this.config.showBurnNotifications) {
        this.showBurnNotification(result);
      }

      return result;
    } catch (error) {
      console.error('Error executing invisible deflation transaction:', error);
      const result: InvisibleTransactionResult = {
        success: false,
        burnedAmount: 0,
        treasuryAmount: 0,
        stakingAmount: 0,
        netAmount: 0,
        originalAmount: amount,
        feeAmount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      this.emit('transactionError', result);
      return result;
    }
  }

  /**
   * Calculates fees based on the deflationary model
   */
  private calculateFees(amount: number): {
    burnAmount: number;
    treasuryAmount: number;
    stakingAmount: number;
    netAmount: number;
    feeAmount: number;
  } {
    const burnPercentage = 0.01; // 1% of transaction amount
    const treasuryPercentage = 0.006; // 0.6% of transaction amount
    const stakingPercentage = 0.004; // 0.4% of transaction amount
    const totalFeePercentage = 0.02; // 2% total fee

    const burnAmount = Math.floor(amount * burnPercentage);
    const treasuryAmount = Math.floor(amount * treasuryPercentage);
    const stakingAmount = Math.floor(amount * stakingPercentage);
    const feeAmount = burnAmount + treasuryAmount + stakingAmount;
    const netAmount = amount - feeAmount;

    return {
      burnAmount,
      treasuryAmount,
      stakingAmount,
      netAmount,
      feeAmount
    };
  }

  /**
   * Handles wallet adapter transactions to apply deflation transparently
   */
  private async handleWalletTransaction(transaction: any): Promise<void> {
    if (!this.config.autoBurnEnabled) {
      return;
    }

    // Extract transaction details and apply deflation if it's a token transfer
    if (transaction.type === 'token-transfer' && transaction.tokenMint) {
      const result = await this.executeInvisibleTransaction(
        new PublicKey(transaction.to),
        new PublicKey(transaction.tokenMint),
        transaction.amount
      );

      // Update transaction with deflation results
      transaction.deflationResult = result;
    }
  }

  /**
   * Shows burn notification to the user
   */
  private showBurnNotification(result: InvisibleTransactionResult): void {
    if (result.burnedAmount > 0) {
      const notification = {
        type: 'burn',
        message: `Сожжено ${result.burnedAmount} токенов`,
        burnedAmount: result.burnedAmount,
        timestamp: new Date().toISOString()
      };
      
      this.emit('notification', notification);
    }
  }

  /**
   * Gets cached transaction result by signature
   */
  getCachedTransaction(signature: string): InvisibleTransactionResult | undefined {
    return this.transactionCache.get(signature);
  }

  /**
   * Clears the transaction cache
   */
  clearCache(): void {
    this.transactionCache.clear();
  }

  /**
   * Gets deflation statistics for the connected wallet
   */
  async getWalletDeflationStats(): Promise<{
    totalBurned: number;
    totalFeesPaid: number;
    transactionsCount: number;
  }> {
    if (!this.walletAdapter.publicKey) {
      throw new Error('Wallet not connected');
    }

    // This would typically query the database for wallet-specific deflation stats
    // For now, we'll return placeholder values
    return {
      totalBurned: 0,
      totalFeesPaid: 0,
      transactionsCount: 0
    };
  }

  /**
   * Gets the total burned tokens for a specific token mint
   */
  async getTotalBurnedTokens(tokenMint: PublicKey): Promise<number> {
    return await this.deflationaryTokenManager.getTotalBurnedTokens(tokenMint);
  }

  /**
   * Gets the total distributed to treasury for a specific token mint
   */
  async getTotalTreasuryDistribution(tokenMint: PublicKey): Promise<number> {
    return await this.deflationaryTokenManager.getTotalTreasuryDistribution(tokenMint);
  }

  /**
   * Gets the total distributed to staking for a specific token mint
   */
  async getTotalStakingDistribution(tokenMint: PublicKey): Promise<number> {
    return await this.deflationaryTokenManager.getTotalStakingDistribution(tokenMint);
  }

  /**
   * Gets the current supply after deflation for a specific token mint
   */
  async getCurrentSupply(tokenMint: PublicKey): Promise<number> {
    return await this.deflationaryTokenManager.getCurrentSupply(tokenMint);
  }

  /**
   * Gets deflation statistics for a specific token mint
   */
  async getDeflationStats(tokenMint: PublicKey): Promise<{
    totalSupply: number;
    burnedTokens: number;
    currentSupply: number;
    treasuryDistributed: number;
    stakingDistributed: number;
  }> {
    return await this.deflationaryTokenManager.getDeflationStats(tokenMint);
  }

  /**
   * Updates the adapter configuration
   */
  updateConfig(config: Partial<InvisibleDeflationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Enables or disables auto burn feature
   */
 setAutoBurn(enabled: boolean): void {
    this.config.autoBurnEnabled = enabled;
  }

  /**
   * Enables or disables burn notifications
   */
  setShowBurnNotifications(enabled: boolean): void {
    this.config.showBurnNotifications = enabled;
  }
}