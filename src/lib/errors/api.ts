import { AppError, type ErrorMetadata } from './base';

/**
 * API Error
 * Base class for API-specific errors
 */
export class APIError extends AppError {
  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'API_ERROR',
    metadata?: ErrorMetadata
  ) {
    super(message, statusCode, code, true, metadata);
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends APIError {
  public readonly retryAfter?: number;

  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter?: number,
    metadata?: ErrorMetadata
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', metadata);
    this.retryAfter = retryAfter;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * External API Error
 * Used when external API calls fail
 */
export class ExternalAPIError extends APIError {
  public readonly service: string;
  public readonly originalError?: string;

  constructor(
    service: string,
    message: string,
    originalError?: string,
    metadata?: ErrorMetadata
  ) {
    super(
      `External API error from ${service}: ${message}`,
      502,
      'EXTERNAL_API_ERROR',
      metadata
    );
    this.service = service;
    this.originalError = originalError;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      service: this.service,
      originalError: this.originalError,
    };
  }
}

/**
 * Database Error
 */
export class DatabaseError extends AppError {
  public readonly operation?: string;

  constructor(
    message: string,
    operation?: string,
    metadata?: ErrorMetadata
  ) {
    super(message, 500, 'DATABASE_ERROR', false, metadata);
    this.operation = operation;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      operation: this.operation,
    };
  }
}

/**
 * IPFS Error
 */
export class IPFSError extends APIError {
  public readonly cid?: string;
  public readonly gateway?: string;

  constructor(
    message: string,
    cid?: string,
    gateway?: string,
    metadata?: ErrorMetadata
  ) {
    super(message, 502, 'IPFS_ERROR', metadata);
    this.cid = cid;
    this.gateway = gateway;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      cid: this.cid,
      gateway: this.gateway,
    };
  }
}

/**
 * File Upload Error
 */
export class FileUploadError extends APIError {
  public readonly fileName?: string;
  public readonly fileSize?: number;

  constructor(
    message: string,
    fileName?: string,
    fileSize?: number,
    metadata?: ErrorMetadata
  ) {
    super(message, 400, 'FILE_UPLOAD_ERROR', metadata);
    this.fileName = fileName;
    this.fileSize = fileSize;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      fileName: this.fileName,
      fileSize: this.fileSize,
    };
  }
}