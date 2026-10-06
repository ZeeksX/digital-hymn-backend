import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { COOKIE_NAMES } from '../config/constants';
import { env } from '../config/env';
import { AppError } from '../shared/utils/api-error';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Middleware that sets the XSRF-TOKEN cookie on safe requests
 * and validates the X-XSRF-TOKEN header on mutating requests when
 * auth cookies are present.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const isProd = env.NODE_ENV === 'production';

  // Ensure an XSRF-TOKEN cookie is set if missing
  let currentToken = req.cookies?.[COOKIE_NAMES.XSRF_TOKEN];
  if (!currentToken) {
    currentToken = crypto.randomBytes(32).toString('hex');
    res.cookie(COOKIE_NAMES.XSRF_TOKEN, currentToken, {
      httpOnly: false, // Must be readable by Angular HttpClient
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });
  }

  // Safe HTTP methods don't alter state
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // If in test environment, bypass CSRF verification for simpler testing
  if (env.NODE_ENV === 'test') {
    return next();
  }

  // Check if request is using cookie-based authentication
  const hasAuthCookie = Boolean(
    req.cookies?.[COOKIE_NAMES.ACCESS_TOKEN] || req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN]
  );

  // If not using auth cookie (e.g. initial login, register, public suggestion, or Bearer auth), pass through
  if (!hasAuthCookie) {
    return next();
  }

  // For authenticated cookie requests, check CSRF token header
  const headerToken = req.headers['x-xsrf-token'] || req.headers['x-csrf-token'];
  if (!headerToken || headerToken !== currentToken) {
    return next(
      AppError.forbidden(
        'CSRF validation failed. Missing or invalid X-XSRF-TOKEN header matching the XSRF-TOKEN cookie.'
      )
    );
  }

  next();
}
