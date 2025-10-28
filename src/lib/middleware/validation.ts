// Input validation middleware for NORMAL DANCE API
// Uses Zod schemas for runtime validation and sanitization

import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";

// Validation result type
export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

// Validate request body against schema
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);

    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        },
      };
    }

    return {
      success: false,
      error: {
        message: "Invalid JSON",
        code: "INVALID_JSON",
      },
    };
  }
}

// Validate query parameters
export function validateQuery<T>(
  url: URL,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const queryParams: Record<string, string> = {};

    // Convert URLSearchParams to plain object
    for (const [key, value] of url.searchParams) {
      queryParams[key] = value;
    }

    const validatedData = schema.parse(queryParams);

    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: {
          message: "Query validation failed",
          code: "QUERY_VALIDATION_ERROR",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        },
      };
    }

    return {
      success: false,
      error: {
        message: "Invalid query parameters",
        code: "INVALID_QUERY",
      },
    };
  }
}

// Validate path parameters
export function validateParams<T>(
  params: Record<string, string>,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(params);

    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: {
          message: "Parameter validation failed",
          code: "PARAM_VALIDATION_ERROR",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        },
      };
    }

    return {
      success: false,
      error: {
        message: "Invalid parameters",
        code: "INVALID_PARAMS",
      },
    };
  }
}

// Sanitize input data (remove potentially dangerous content)
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  return (
    input
      // Remove null bytes
      .replace(/\0/g, "")
      // Remove potential script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove potential HTML tags (basic)
      .replace(/<[^>]*>/g, "")
      // Trim whitespace
      .trim()
      // Limit length to prevent buffer overflow
      .substring(0, 10000)
  );
}

// Validate file upload
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): ValidationResult<{
  file: File;
  size: number;
  type: string;
  extension: string;
}> {
  const {
    maxSize = 50 * 1024 * 1024, // 50MB default
    allowedTypes = [],
    allowedExtensions = [],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      success: false,
      error: {
        message: `File too large. Maximum size: ${maxSize} bytes`,
        code: "FILE_TOO_LARGE",
      },
    };
  }

  // Check MIME type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: {
        message: `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
        code: "INVALID_FILE_TYPE",
      },
    };
  }

  // Check file extension
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
    return {
      success: false,
      error: {
        message: `Invalid file extension. Allowed: ${allowedExtensions.join(
          ", "
        )}`,
        code: "INVALID_FILE_EXTENSION",
      },
    };
  }

  return {
    success: true,
    data: {
      file,
      size: file.size,
      type: file.type,
      extension,
    },
  };
}

// Create validation error response
export function createValidationErrorResponse(result: ValidationResult): any {
  return new NextResponse(
    JSON.stringify({
      success: false,
      error: result.error?.message || "Validation failed",
      code: result.error?.code || "VALIDATION_ERROR",
      details: result.error?.details,
    }),
    {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

// Middleware helper for API routes
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (validatedData: T, request: Request) => Promise<any> | any
) {
  return async (request: Request): Promise<any> => {
    const validation = await validateBody(request.clone(), schema);

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    return handler(validation.data!, request);
  };
}

// Rate limiting + validation combined middleware
export function withRateLimitAndValidation<T>(
  schema: ZodSchema<T>,
  handler: (validatedData: T, request: any) => Promise<any> | any
) {
  return async (request: any): Promise<any> => {
    // Apply rate limiting first
    const rateLimitResult = await import("../middleware/rate-limit").then(
      (module) => module.rateLimitMiddleware(request)
    );

    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Then apply validation
    const validation = await validateBody(request.clone(), schema);

    if (!validation.success) {
      return createValidationErrorResponse(validation);
    }

    return handler(validation.data!, request);
  };
}
