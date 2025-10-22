/**
 * Centralized error handling exports
 * Import errors from this file throughout the application
 */

// Base errors
export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  TooManyRequestsError,
  InternalServerError,
  ServiceUnavailableError,
  isOperationalError,
  type ErrorMetadata,
} from './base';

// Validation errors
export {
  ValidationError,
  FileValidationError,
  SchemaValidationError,
} from './validation';

// Web3 errors
export {
  WalletError,
  WalletNotConnectedError,
  WalletConnectionError,
  TransactionError,
  TransactionFailedError,
  InsufficientBalanceError,
  SmartContractError,
  NFTError,
  NFTNotFoundError,
  NFTAlreadyMintedError,
} from './web3';

// API errors
export {
  APIError,
  RateLimitError,
  ExternalAPIError,
  DatabaseError,
  IPFSError,
  FileUploadError,
} from './api';