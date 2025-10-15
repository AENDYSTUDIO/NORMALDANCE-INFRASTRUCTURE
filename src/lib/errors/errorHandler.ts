/**
 * Unified Error Handler for API Routes
 * Provides consistent error responses across the application
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { logger } from '@/lib/utils/logger'
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ExternalServiceError,
} from './AppError'

interface ErrorResponse {
  error: string
  code: string
  statusCode: number
  details?: unknown
  timestamp: string
}

export function handleApiError(error: unknown): NextResponse<ErrorResponse> {
  const timestamp = new Date().toISOString()

  // Handle AppError and its subclasses
  if (error instanceof AppError) {
    logger.warn(error.message, error.metadata)
    
    const response: ErrorResponse = {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.metadata,
      timestamp,
    }
    
    // Add retry-after header for rate limits
    if (error instanceof RateLimitError && error.metadata?.retryAfter) {
      return NextResponse.json(response, {
        status: error.statusCode,
        headers: {
          'Retry-After': String(error.metadata.retryAfter),
        },
      })
    }
    
    return NextResponse.json(response, { status: error.statusCode })
  }

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    logger.warn('Validation error', { errors: error.errors })
    
    const response: ErrorResponse = {
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
      })),
      timestamp,
    }
    
    return NextResponse.json(response, { status: 400 })
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: Record<string, unknown> }
    
    if (prismaError.code === 'P2002') {
      logger.warn('Unique constraint violation', { meta: prismaError.meta })
      
      return NextResponse.json({
        error: 'Resource already exists',
        code: 'DUPLICATE_ERROR',
        statusCode: 409,
        timestamp,
      }, { status: 409 })
    }
    
    if (prismaError.code === 'P2025') {
      logger.warn('Record not found', { meta: prismaError.meta })
      
      return NextResponse.json({
        error: 'Resource not found',
        code: 'NOT_FOUND',
        statusCode: 404,
        timestamp,
      }, { status: 404 })
    }
  }

  // Handle standard Error
  if (error instanceof Error) {
    logger.error('Unexpected error', error)
    Sentry.captureException(error)
    
    return NextResponse.json({
      error: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      timestamp,
    }, { status: 500 })
  }

  // Handle unknown errors
  logger.error('Unknown error type', new Error(String(error)))
  Sentry.captureException(error)
  
  return NextResponse.json({
    error: 'Internal server error',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
    timestamp,
  }, { status: 500 })
}

// Helper to throw typed errors
export function throwError(
  message: string,
  statusCode: number = 500,
  code: string = 'ERROR'
): never {
  throw new AppError(message, statusCode, code)
}

// Async error wrapper for API routes
export function withErrorHandler<T extends unknown[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

// Export error classes for convenience
export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ExternalServiceError,
}
