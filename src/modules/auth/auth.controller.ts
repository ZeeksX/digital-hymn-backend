import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { COOKIE_NAMES } from '../../config/constants';
import { setAuthCookies, clearAuthCookies } from '../../shared/utils/tokens';
import { sendCreated, sendSuccess } from '../../shared/utils/api-response';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      sendCreated(res, { user: result.user }, 'Registration successful.');
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      sendSuccess(res, { user: result.user }, 200, 'Login successful.');
    } catch (error) {
      next(error);
    }
  }

  static async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken } = req.body;
      const result = await AuthService.googleLogin(idToken);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      sendSuccess(res, { user: result.user }, 200, 'Google authentication successful.');
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken =
        req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] || req.body?.refreshToken;

      const result = await AuthService.refresh(refreshToken);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      sendSuccess(res, { user: result.user }, 200, 'Session refreshed successfully.');
    } catch (error) {
      // If refresh fails, clear stale cookies
      clearAuthCookies(res);
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken =
        req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] || req.body?.refreshToken;

      await AuthService.logout(refreshToken, req.user?.id);
      clearAuthCookies(res);
      sendSuccess(res, null, 200, 'Logged out successfully.');
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        return next();
      }
      const data = await AuthService.getCurrentUser(req.user.id);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  }

  static getCsrfToken(req: Request, res: Response): void {
    const csrfToken = req.cookies?.[COOKIE_NAMES.XSRF_TOKEN];
    sendSuccess(res, { csrfToken }, 200, 'CSRF token initialized.');
  }
}
