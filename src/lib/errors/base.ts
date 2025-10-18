/**
 * Base error classes for the application
 * Provides a consistent error handling structure across the codebase
 */

export interface ErrorMetadata {
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
  timestamp?: string;
  path?: string;
  method?: string;
}

/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly metadata?: ErrorMetadata;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    metadata?: ErrorMetadata
  ) {
    super(message);
    
    Object.setPrototypeOf(this, new.target.prototype);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.metadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
    };

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      metadata: this.metadata,
    };
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', metadata?: ErrorMetadata) {
    super(message, 400, 'BAD_REQUEST', true, metadata);
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', metadata?: ErrorMetadata) {
    super(message, 401, 'UNAUTHORIZED', true, metadata);
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', metadata?: ErrorMetadata) {
    super(message, 403, 'FORBIDDEN', true, metadata);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', metadata?: ErrorMetadata) {
    super(message, 404, 'NOT_FOUND', true, metadata);
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', metadata?: ErrorMetadata) {
    super(message, 409, 'CONFLICT', true, metadata);
  }
}

/**
 * Unprocessable Entity Error (422)
 */
export class UnprocessableEntityError extends AppError {
  constructor(message: string = 'Unprocessable entity', metadata?: ErrorMetadata) {
    super(message, 422, 'UNPROCESSABLE_ENTITY', true, metadata);
  }
}

/**
 * Too Many Requests Error (429)
 */
export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests', metadata?: ErrorMetadata) {
    super(message, 429, 'TOO_MANY_REQUESTS', true, metadata);
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', metadata?: ErrorMetadata) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false, metadata);
  }
}

/**
 * Service Unavailable Error (503)
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable', metadata?: ErrorMetadata) {
    super(message, 503, 'SERVICE_UNAVAILABLE', true, metadata);
  }
}

/**
 * Check if error is an operational error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}