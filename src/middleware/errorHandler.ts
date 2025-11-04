/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';
import config from '../config';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  // Check if it's an ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Log error
  if (!isOperational || statusCode >= 500) {
    logger.error(`Error: ${message}`, {
      error: err,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userId: (req as any).user?.user_id,
    });
  } else {
    logger.warn(`Operational error: ${message}`, {
      url: req.url,
      method: req.method,
      ip: req.ip,
    });
  }

  // Send error response
  const response: any = {
    success: false,
    error: message,
  };

  // Include stack trace in development
  if (config.env === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Handle 404 - Not Found
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};
