import type { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/lib/errors';

/**
 * Validate data against a Zod schema
 * Throws ValidationError if validation fails
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      throw ValidationError.fromZodError(error as ZodError);
    }
    throw error;
  }
}

/**
 * Validate data and return result with success flag
 */
export function validateSafe<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ValidationError } {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      return {
        success: false,
        error: ValidationError.fromZodError(error as ZodError),
      };
    }
    return {
      success: false,
      error: new ValidationError('Validation failed'),
    };
  }
}

/**
 * Validate request body
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return validate(schema, body);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid request body');
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): T {
  const params = Object.fromEntries(searchParams.entries());
  return validate(schema, params);
}

/**
 * Validate form data
 */
export async function validateFormData<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    return validate(schema, data);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid form data');
  }
}