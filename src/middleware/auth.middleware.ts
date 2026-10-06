import { Request, Response, NextFunction } from 'express';
import { COOKIE_NAMES } from '../config/constants';
import { verifyAccessToken } from '../shared/utils/tokens';
import { AppError } from '../shared/utils/api-error';
import { UserModel } from '../modules/users/user.model';

function extractToken(req: Request): string | null {
  if (req.cookies && req.cookies[COOKIE_NAMES.ACCESS_TOKEN]) {
    return req.cookies[COOKIE_NAMES.ACCESS_TOKEN];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    return next(AppError.unauthorized('Authentication required. No session or access token provided.'));
  }

  const payload = verifyAccessToken(token);
  if (!payload || !payload.userId) {
    return next(AppError.unauthorized('Authentication expired or invalid. Please refresh your session or log in again.'));
  }

  try {
    const user = await UserModel.findById(payload.userId).lean();
    if (!user) {
      return next(AppError.unauthorized('Authenticated user account no longer exists.'));
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };
    req.accessToken = token;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  const payload = verifyAccessToken(token);
  if (!payload || !payload.userId) {
    return next();
  }

  try {
    const user = await UserModel.findById(payload.userId).lean();
    if (user) {
      req.user = {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      };
      req.accessToken = token;
    }
    next();
  } catch {
    next();
  }
}
