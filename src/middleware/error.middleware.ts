import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/utils/api-error';
import { logger } from '../shared/utils/logger';
import { env } from '../config/env';
import { ERROR_CODES } from '../config/constants';

interface MongoCastError extends Error {
  name: 'CastError';
  path: string;
  value: unknown;
}

interface MongoDuplicateKeyError extends Error {
  code: number;
  keyPattern?: Record<string, number>;
  keyValue?: Record<string, unknown>;
}

interface MongoValidationError extends Error {
  name: 'ValidationError';
  errors: Record<string, { path: string; message: string }>;
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Operational AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.fields ? { fields: err.fields } : {}),
      },
    });
    return;
  }

  // Malformed JSON payload
  if ('type' in err && (err as { type: string }).type === 'entity.parse.failed') {
    res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Malformed JSON payload in request body.',
      },
    });
    return;
  }

  // Mongoose CastError (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    const castErr = err as MongoCastError;
    res.status(400).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: `Invalid format for parameter: ${castErr.path}.`,
        fields: {
          [castErr.path]: `Invalid identifier format: ${String(castErr.value)}`,
        },
      },
    });
    return;
  }

  // Mongoose duplicate key error (E11000)
  if ('code' in err && (err as MongoDuplicateKeyError).code === 11000) {
    const dupErr = err as MongoDuplicateKeyError;
    const key = dupErr.keyValue ? Object.keys(dupErr.keyValue)[0] : 'field';
    res.status(409).json({
      success: false,
      error: {
        code: ERROR_CODES.CONFLICT,
        message: `A resource with this ${key} already exists.`,
        fields: {
          [key]: `Value already in use.`,
        },
      },
    });
    return;
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const valErr = err as MongoValidationError;
    const fields: Record<string, string> = {};
    for (const [key, errorItem] of Object.entries(valErr.errors)) {
      fields[key] = errorItem.message;
    }
    res.status(422).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Database schema validation failed.',
        fields,
      },
    });
    return;
  }

  // Log unhandled server error
  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);

  // Safe response for clients
  const isDev = env.NODE_ENV !== 'production';
  res.status(500).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: 'An unexpected internal server error occurred.',
      ...(isDev ? { stack: err.stack, details: err.message } : {}),
    },
  });
}
