import cron from 'node-cron';
import { PrayerRequestModel } from '../models/PrayerRequest';
import logger from '../utils/logger';

/**
 * Scheduler Service
 * Manages all scheduled/cron jobs for the application
 */
export class SchedulerService {
  /**
   * Initialize all scheduled jobs
   */
  public static init(): void {
    logger.info('Initializing scheduled jobs...');

    // Auto-archive old prayer requests
    this.scheduleAutoArchivePrayerRequests();

    logger.info('All scheduled jobs initialized successfully');
  }

  /**
   * Schedule auto-archive job for prayer requests
   * Runs daily at 2:00 AM to archive prayer requests older than 10 days
   */
  private static scheduleAutoArchivePrayerRequests(): void {
    // Run every day at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('Running auto-archive job for prayer requests...');

        const archivedCount = await PrayerRequestModel.autoArchiveOldRequests(10);

        logger.info(`Auto-archive job completed: ${archivedCount} prayer requests archived`);
      } catch (error) {
        logger.error('Error in auto-archive job for prayer requests:', error);
      }
    });

    logger.info('Auto-archive prayer requests job scheduled (runs daily at 2:00 AM)');
  }

  /**
   * Manual trigger for auto-archive (useful for testing)
   * @param daysOld - Number of days old for archiving (default: 10)
   */
  public static async manualArchivePrayerRequests(daysOld: number = 10): Promise<number> {
    try {
      logger.info(`Manually triggering auto-archive for prayer requests older than ${daysOld} days...`);

      const archivedCount = await PrayerRequestModel.autoArchiveOldRequests(daysOld);

      logger.info(`Manual auto-archive completed: ${archivedCount} prayer requests archived`);

      return archivedCount;
    } catch (error) {
      logger.error('Error in manual auto-archive:', error);
      throw error;
    }
  }
}

export default SchedulerService;
