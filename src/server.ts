/* eslint-disable @typescript-eslint/no-explicit-any */
import app from './app';
import config from './config';
import database from './config/database';
import logger from './utils/logger';
import { emailService } from './services/email/email.service';
import { SchedulerService } from './services/scheduler.service';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await database.connect();
    logger.info('Database connection established');

    // Initialize email service
    const emailServiceReady = await emailService.initialize();
    if (emailServiceReady) {
      logger.info('Email service initialized successfully');
    } else {
      logger.warn('Email service initialization failed - emails will not be sent');
    }

    // Initialize scheduled jobs
    SchedulerService.init();
    logger.info('Scheduled jobs initialized successfully');

    // Start listening
const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info(`Server is running on port ${config.port} in ${config.env} mode`);
  logger.info(`API Version: ${config.apiVersion}`);
  logger.info(`Access the API at: http://0.0.0.0:${config.port}/api/${config.apiVersion}`);
});


    // Graceful shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} signal received: closing HTTP server`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await database.disconnect();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
