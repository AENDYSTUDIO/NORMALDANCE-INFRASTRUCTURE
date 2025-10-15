/**
 * Custom Application Error Classes
 * Provides structured error handling across the application
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public metadata?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      metadata: this.metadata,
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', metadata)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', metadata?: Record<string, unknown>) {
    super(message, 401, 'AUTHENTICATION_ERROR', metadata)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', metadata?: Record<string, unknown>) {
    super(message, 403, 'AUTHORIZATION_ERROR', metadata)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, metadata?: Record<string, unknown>) {
    super(`${resource} not found`, 404, 'NOT_FOUND', metadata)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 409, 'CONFLICT_ERROR', metadata)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter: number = 60, metadata?: Record<string, unknown>) {
    super('Too many requests', 429, 'RATE_LIMIT_ERROR', { ...metadata, retryAfter })
    this.name = 'RateLimitError'
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error, metadata?: Record<string, unknown>) {
    super(
      `External service error: ${service}`,
      503,
      'EXTERNAL_SERVICE_ERROR',
      { ...metadata, service, originalError: originalError?.message }
    )
    this.name = 'ExternalServiceError'
  }
}
