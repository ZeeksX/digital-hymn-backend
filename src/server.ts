import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './shared/utils/logger';

async function bootstrap() {
  try {
    // Connect to MongoDB
    await connectDatabase();

    const app = createApp();
    const server = http.createServer(app);

    server.listen(env.PORT, () => {
      logger.info(`Digital Hymn Book Backend running on port ${env.PORT} in ${env.NODE_ENV} mode.`);
      logger.info(`Swagger documentation available at: http://localhost:${env.PORT}/api/docs`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          await disconnectDatabase();
          logger.info('Database connection closed.');
          process.exit(0);
        } catch (err) {
          logger.error('Error during database disconnect:', err);
          process.exit(1);
        }
      });

      // Force shutdown after timeout if pending requests hang
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
