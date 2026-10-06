import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { CookieOptions, Response } from 'express';
import { env } from '../../config/env';
import { COOKIE_NAMES, TOKEN_EXPIRY } from '../../config/constants';

export interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
  jti?: string;
}

export function signAccessToken(payload: { userId: string; email: string }): string {
  return jwt.sign(
    { userId: payload.userId, email: payload.email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN_SECONDS }
  );
}

export function signRefreshToken(payload: { userId: string; email: string; familyId: string; tokenId: string }): string {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      familyId: payload.familyId,
      jti: payload.tokenId,
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: TOKEN_EXPIRY.REFRESH_TOKEN_SECONDS }
  );
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): (TokenPayload & { familyId: string; jti: string }) | null {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as (TokenPayload & { familyId: string; jti: string });
  } catch {
    return null;
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getCookieOptions(isRefreshToken = false): CookieOptions {
  const isProd = env.NODE_ENV === 'production';
  const maxAgeMs = isRefreshToken
    ? TOKEN_EXPIRY.REFRESH_TOKEN_SECONDS * 1000
    : TOKEN_EXPIRY.ACCESS_TOKEN_SECONDS * 1000;

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, getCookieOptions(false));
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, getCookieOptions(true));
}

export function clearAuthCookies(res: Response): void {
  const isProd = env.NODE_ENV === 'production';
  const clearOptions: CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  };
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, clearOptions);
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, clearOptions);
}
