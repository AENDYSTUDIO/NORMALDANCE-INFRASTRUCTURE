import type { ZodError } from 'zod';
import { AppError, type ErrorMetadata } from './base';

/**
 * Validation Error
 * Used when input validation fails
 */
export class ValidationError extends AppError {
  public readonly validationErrors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;

  constructor(
    message: string = 'Validation failed',
    validationErrors?: Array<{ field: string; message: string; code?: string }>,
    metadata?: ErrorMetadata
  ) {
    super(message, 400, 'VALIDATION_ERROR', true, metadata);
    this.validationErrors = validationErrors;
  }

  static fromZodError(error: ZodError): ValidationError {
    const validationErrors = error.errors.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));

    return new ValidationError(
      'Validation failed',
      validationErrors,
      { details: { zodErrors: error.errors } }
    );
  }

  toJSON() {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors,
    };
  }
}

/**
 * File Validation Error
 * Used when file upload validation fails
 */
export class FileValidationError extends ValidationError {
  constructor(
    message: string,
    field: string = 'file',
    metadata?: ErrorMetadata
  ) {
    super(
      message,
      [{ field, message }],
      { ...metadata, code: 'FILE_VALIDATION_ERROR' }
    );
  }
}

/**
 * Schema Validation Error
 * Used when data doesn't match expected schema
 */
export class SchemaValidationError extends ValidationError {
  constructor(
    message: string,
    schemaName: string,
    metadata?: ErrorMetadata
  ) {
    super(
      message,
      undefined,
      { ...metadata, code: 'SCHEMA_VALIDATION_ERROR', details: { schemaName } }
    );
  }
}