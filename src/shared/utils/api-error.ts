import { ERROR_CODES } from '../../config/constants';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly fields?: Record<string, string>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, fields?: Record<string, string>): AppError {
    return new AppError(400, ERROR_CODES.VALIDATION_ERROR, message, fields);
  }

  static validation(fields: Record<string, string>, message = 'Some of the provided information is invalid.'): AppError {
    return new AppError(422, ERROR_CODES.VALIDATION_ERROR, message, fields);
  }

  static unauthorized(message = 'Authentication is required to access this resource.'): AppError {
    return new AppError(401, ERROR_CODES.UNAUTHENTICATED, message);
  }

  static forbidden(message = 'You do not have permission to perform this action.'): AppError {
    return new AppError(403, ERROR_CODES.FORBIDDEN, message);
  }

  static notFound(message = 'The requested resource was not found.'): AppError {
    return new AppError(404, ERROR_CODES.NOT_FOUND, message);
  }

  static conflict(message: string, fields?: Record<string, string>): AppError {
    return new AppError(409, ERROR_CODES.CONFLICT, message, fields);
  }

  static rateLimited(message = 'Too many requests. Please try again later.'): AppError {
    return new AppError(429, ERROR_CODES.RATE_LIMITED, message);
  }

  static internal(message = 'An unexpected error occurred. Please try again later.'): AppError {
    return new AppError(500, ERROR_CODES.INTERNAL_ERROR, message, undefined, false);
  }
}
