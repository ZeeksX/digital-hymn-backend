import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../config/env';
import { ERROR_CODES } from '../config/constants';

function createRateLimitHandler(message: string) {
  return (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: ERROR_CODES.RATE_LIMITED,
        message,
      },
    });
  };
}

const isTest = env.NODE_ENV === 'test';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many requests from this IP. Please try again after 15 minutes.'),
  skip: () => isTest,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTest ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many authentication attempts. Please try again after 15 minutes.'),
  skip: () => isTest,
});

export const suggestionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isTest ? 1000 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many hymn suggestions submitted from this IP. Please try again later.'),
  skip: () => isTest,
});

export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: isTest ? 1000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler('Too many search requests. Please slow down.'),
  skip: () => isTest,
});
