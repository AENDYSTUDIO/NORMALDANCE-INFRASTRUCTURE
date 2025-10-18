import { AppError, type ErrorMetadata } from './base';

/**
 * Wallet Error
 * Used for wallet-related errors
 */
export class WalletError extends AppError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, 400, 'WALLET_ERROR', true, metadata);
  }
}

/**
 * Wallet Not Connected Error
 */
export class WalletNotConnectedError extends WalletError {
  constructor(message: string = 'Wallet not connected', metadata?: ErrorMetadata) {
    super(message, { ...metadata, code: 'WALLET_NOT_CONNECTED' });
  }
}

/**
 * Wallet Connection Failed Error
 */
export class WalletConnectionError extends WalletError {
  constructor(message: string = 'Failed to connect wallet', metadata?: ErrorMetadata) {
    super(message, { ...metadata, code: 'WALLET_CONNECTION_FAILED' });
  }
}

/**
 * Transaction Error
 * Used for blockchain transaction errors
 */
export class TransactionError extends AppError {
  public readonly transactionHash?: string;

  constructor(
    message: string,
    transactionHash?: string,
    metadata?: ErrorMetadata
  ) {
    super(message, 400, 'TRANSACTION_ERROR', true, metadata);
    this.transactionHash = transactionHash;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      transactionHash: this.transactionHash,
    };
  }
}

/**
 * Transaction Failed Error
 */
export class TransactionFailedError extends TransactionError {
  constructor(
    message: string = 'Transaction failed',
    transactionHash?: string,
    metadata?: ErrorMetadata
  ) {
    super(message, transactionHash, { ...metadata, code: 'TRANSACTION_FAILED' });
  }
}

/**
 * Insufficient Balance Error
 */
export class InsufficientBalanceError extends AppError {
  public readonly required: number;
  public readonly available: number;

  constructor(
    required: number,
    available: number,
    message?: string,
    metadata?: ErrorMetadata
  ) {
    super(
      message || `Insufficient balance. Required: ${required}, Available: ${available}`,
      400,
      'INSUFFICIENT_BALANCE',
      true,
      metadata
    );
    this.required = required;
    this.available = available;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      required: this.required,
      available: this.available,
    };
  }
}

/**
 * Smart Contract Error
 */
export class SmartContractError extends AppError {
  public readonly contractAddress?: string;
  public readonly method?: string;

  constructor(
    message: string,
    contractAddress?: string,
    method?: string,
    metadata?: ErrorMetadata
  ) {
    super(message, 500, 'SMART_CONTRACT_ERROR', true, metadata);
    this.contractAddress = contractAddress;
    this.method = method;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      contractAddress: this.contractAddress,
      method: this.method,
    };
  }
}

/**
 * NFT Error
 */
export class NFTError extends AppError {
  constructor(message: string, metadata?: ErrorMetadata) {
    super(message, 400, 'NFT_ERROR', true, metadata);
  }
}

/**
 * NFT Not Found Error
 */
export class NFTNotFoundError extends NFTError {
  constructor(tokenId: string, metadata?: ErrorMetadata) {
    super(
      `NFT with token ID ${tokenId} not found`,
      { ...metadata, code: 'NFT_NOT_FOUND', details: { tokenId } }
    );
  }
}

/**
 * NFT Already Minted Error
 */
export class NFTAlreadyMintedError extends NFTError {
  constructor(tokenId: string, metadata?: ErrorMetadata) {
    super(
      `NFT with token ID ${tokenId} already minted`,
      { ...metadata, code: 'NFT_ALREADY_MINTED', details: { tokenId } }
    );
  }
}