import {
  formatErrorResponse,
  handleError,
  getSafeErrorMessage,
  extractErrorDetails,
} from '../error-formatter';
import { AppError, BadRequestError, InternalServerError } from '@/lib/errors';

describe('Error Formatter', () => {
  describe('formatErrorResponse', () => {
    it('should format AppError correctly', () => {
      const error = new BadRequestError('Invalid input');
      const response = formatErrorResponse(error);

      expect(response.success).toBe(false);
      expect(response.error.message).toBe('Invalid input');
      expect(response.error.code).toBe('BAD_REQUEST');
      expect(response.error.statusCode).toBe(400);
      expect(response.error.timestamp).toBeDefined();
    });

    it('should format unknown error in production', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      });

      const error = new Error('Internal error');
      const response = formatErrorResponse(error);

      expect(response.success).toBe(false);
      expect(response.error.message).toBe('An unexpected error occurred');
      expect(response.error.code).toBe('INTERNAL_ERROR');
      expect(response.error.statusCode).toBe(500);
      expect(response.error.details).toBeUndefined();

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true,
      });
    });

    it('should include error details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      });

      const error = new Error('Internal error');
      const response = formatErrorResponse(error);

      expect(response.error.message).toBe('Internal error');
      expect(response.error.details).toBeDefined();

      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('handleError', () => {
    it('should return correct status code for AppError', () => {
      const error = new BadRequestError('Invalid input');
      const { response, statusCode } = handleError(error);

      expect(statusCode).toBe(400);
      expect(response.error.code).toBe('BAD_REQUEST');
    });

    it('should return 500 for unknown errors', () => {
      const error = new Error('Unknown error');
      const { statusCode } = handleError(error);

      expect(statusCode).toBe(500);
    });
  });

  describe('getSafeErrorMessage', () => {
    it('should return message for operational errors', () => {
      const error = new BadRequestError('Invalid input');
      const message = getSafeErrorMessage(error);

      expect(message).toBe('Invalid input');
    });

    it('should return generic message for non-operational errors', () => {
      const error = new InternalServerError('Database error');
      const message = getSafeErrorMessage(error);

      expect(message).toBe('An unexpected error occurred. Please try again later.');
    });

    it('should return generic message for unknown errors', () => {
      const error = new Error('Unknown error');
      const message = getSafeErrorMessage(error);

      expect(message).toBe('An unexpected error occurred. Please try again later.');
    });
  });

  describe('extractErrorDetails', () => {
    it('should extract details from AppError', () => {
      const error = new BadRequestError('Invalid input', {
        details: { field: 'email' },
      });
      const details = extractErrorDetails(error);

      expect(details.name).toBe('BadRequestError');
      expect(details.message).toBe('Invalid input');
      expect(details.code).toBe('BAD_REQUEST');
      expect(details.statusCode).toBe(400);
      expect(details.isOperational).toBe(true);
      expect(details.metadata).toBeDefined();
    });

    it('should extract basic details from regular Error', () => {
      const error = new Error('Regular error');
      const details = extractErrorDetails(error);

      expect(details.name).toBe('Error');
      expect(details.message).toBe('Regular error');
      expect(details.stack).toBeDefined();
    });
  });
});