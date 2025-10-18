import type { NextResponse } from 'next/server';
import { AppError, isOperationalError } from '@/lib/errors';
import { logger } from './logger';

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    details?: Record<string, unknown>;
    timestamp: string;
  };
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: Error): ErrorResponse {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.metadata?.details,
        timestamp: error.metadata?.timestamp || new Date().toISOString(),
      },
    };
  }

  // Unknown error - don't expose details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    success: false,
    error: {
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      details: isDevelopment ? { stack: error.stack } : undefined,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Handle error and return appropriate response
 */
export function handleError(error: Error): {
  response: ErrorResponse;
  statusCode: number;
} {
  // Log error with proper metadata
  const errorDetails = extractErrorDetails(error);
  
  if (isOperationalError(error)) {
    logger.warn('Operational error occurred', errorDetails);
  } else {
    logger.error('Non-operational error occurred', errorDetails);
  }

  const response = formatErrorResponse(error);
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  return { response, statusCode };
}

/**
 * Create error response for Next.js API routes
 */
export function createErrorResponse(error: Error): Response {
  const { response, statusCode } = handleError(error);
  
  return Response.json(response, { status: statusCode });
}

/**
 * Safe error message for client
 * Sanitizes error messages to prevent information leakage
 */
export function getSafeErrorMessage(error: Error): string {
  if (error instanceof AppError && error.isOperational) {
    return error.message;
  }

  // Don't expose internal errors to client
  return 'An unexpected error occurred. Please try again later.';
}

/**
 * Extract error details for logging
 */
export function extractErrorDetails(error: Error): Record<string, unknown> {
  const details: Record<string, unknown> = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  if (error instanceof AppError) {
    details.code = error.code;
    details.statusCode = error.statusCode;
    details.isOperational = error.isOperational;
    details.metadata = error.metadata;
  }

  return details;
}