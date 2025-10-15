/**
 * Secure Error Handling
 * Prevents information leakage while providing useful error information
 */

import { NextResponse } from 'next/server';
import { createLogger } from '@/utils/logger';

const logger = createLogger('ErrorHandler');

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ErrorHandler {
  static handle(error: Error | AppError, context?: string): NextResponse {
    // Log the error securely
    this.logError(error, context);

    if (error instanceof AppError) {
      return this.handleAppError(error);
    }

    // Handle unexpected errors
    return this.handleUnexpectedError(error);
  }

  private static logError(error: Error, context?: string): void {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    };

    if (error instanceof AppError) {
      logger.error(`App Error [${error.code}]`, {
        ...errorInfo,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        details: error.details
      });
    } else {
      logger.error('Unexpected Error', errorInfo);
    }
  }

  private static handleAppError(error: AppError): NextResponse {
    const response = {
      error: {
        code: error.code,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { details: error.details })
      }
    };

    return NextResponse.json(response, { status: error.statusCode });
  }

  private static handleUnexpectedError(error: Error): NextResponse {
    // Don't expose internal error details in production
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message;

    const response = {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    };

    return NextResponse.json(response, { status: 500 });
  }

  // Predefined error creators
  static validationError(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, ErrorCode.VALIDATION_ERROR, 400, true, details);
  }

  static authenticationError(message: string = 'Authentication required'): AppError {
    return new AppError(message, ErrorCode.AUTHENTICATION_ERROR, 401);
  }

  static authorizationError(message: string = 'Insufficient permissions'): AppError {
    return new AppError(message, ErrorCode.AUTHORIZATION_ERROR, 403);
  }

  static notFoundError(message: string = 'Resource not found'): AppError {
    return new AppError(message, ErrorCode.NOT_FOUND, 404);
  }

  static rateLimitError(message: string = 'Rate limit exceeded'): AppError {
    return new AppError(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429);
  }

  static databaseError(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(
      process.env.NODE_ENV === 'production' ? 'Database operation failed' : message,
      ErrorCode.DATABASE_ERROR,
      500,
      true,
      details
    );
  }

  static externalServiceError(service: string, details?: Record<string, unknown>): AppError {
    return new AppError(
      `External service ${service} is unavailable`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      503,
      true,
      details
    );
  }
}

// Async error wrapper for API routes
export function asyncHandler<T extends unknown[]>(fn: (...args: T) => Promise<unknown>) {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (error) {
      return ErrorHandler.handle(error as Error, fn.name);
    }
  };
}

// Global error boundary for unhandled promise rejections
if (typeof window === 'undefined') {
  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString()
    });
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack
    });
    
    // Graceful shutdown
    process.exit(1);
  });
}