import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { generalLimiter } from './middleware/rate-limiter';
import { requestLogger } from './middleware/request-logger';
import { csrfProtection } from './middleware/csrf.middleware';
import { notFoundHandler } from './middleware/not-found.middleware';
import { errorHandler } from './middleware/error.middleware';

// Routes
import authRoutes from './modules/auth/auth.routes';
import hymnRoutes from './modules/hymns/hymn.routes';
import categoryRoutes from './modules/categories/category.routes';
import favoriteRoutes from './modules/favorites/favorite.routes';
import historyRoutes from './modules/history/history.routes';
import preferenceRoutes from './modules/preferences/preference.routes';
import suggestionRoutes from './modules/suggestions/suggestion.routes';
import swaggerRoutes from './docs/swagger.routes';

export function createApp(): Application {
  const app: Application = express();

  // Trust proxy for rate limiting and secure cookies when behind reverse proxy
  app.set('trust proxy', 1);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI assets
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS with explicit allowlist and credentials support
  const allowedOrigins = env.FRONTEND_ORIGIN.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, or Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-XSRF-TOKEN',
        'X-CSRF-TOKEN',
      ],
      exposedHeaders: ['Set-Cookie'],
    })
  );

  // Body parsers with size limit
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Cookie parser
  app.use(cookieParser(env.COOKIE_SECRET));

  // Request logger
  app.use(requestLogger);

  // Global rate limiter
  app.use('/api', generalLimiter);

  // CSRF protection for mutating requests
  app.use('/api', csrfProtection);

  // Swagger Documentation
  app.use('/api', swaggerRoutes);
  app.use('/api/v1', swaggerRoutes);

  // Health endpoint
  app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  });

  // API v1 Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/hymns', hymnRoutes);
  app.use('/api/v1/categories', categoryRoutes);
  app.use('/api/v1/users/me/favorites', favoriteRoutes);
  app.use('/api/v1/users/me/recently-viewed', historyRoutes);
  app.use('/api/v1/users/me/preferences', preferenceRoutes);
  app.use('/api/v1/hymn-suggestions', suggestionRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Global centralized error handler
  app.use(errorHandler);

  return app;
}
