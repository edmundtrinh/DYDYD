import { Context } from 'hono';
import { ApiError } from '@dydyd/shared';

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const Errors = {
  badRequest: (message: string, details?: Record<string, unknown>) =>
    new AppError(message, 400, 'BAD_REQUEST', details),

  unauthorized: (message: string = 'Unauthorized') =>
    new AppError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Forbidden') =>
    new AppError(message, 403, 'FORBIDDEN'),

  notFound: (resource: string = 'Resource') =>
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),

  conflict: (message: string) =>
    new AppError(message, 409, 'CONFLICT'),

  validationError: (details: Record<string, unknown>) =>
    new AppError('Validation failed', 422, 'VALIDATION_ERROR', details),

  tooManyRequests: (message: string = 'Too many requests') =>
    new AppError(message, 429, 'TOO_MANY_REQUESTS'),

  internal: (message: string = 'Internal server error') =>
    new AppError(message, 500, 'INTERNAL_ERROR'),
};

export const errorHandler = (err: Error, c: Context) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  if (err instanceof AppError) {
    const errorResponse: { success: false; error: ApiError } = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };
    return c.json(errorResponse, err.statusCode as any);
  }

  if (err.name === 'JsonWebTokenError') {
    return c.json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
    }, 401);
  }

  if (err.name === 'TokenExpiredError') {
    return c.json({
      success: false,
      error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' },
    }, 401);
  }

  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    },
  }, 500);
};
