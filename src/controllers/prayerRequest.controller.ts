import { Request, Response, NextFunction } from 'express';
import { PrayerRequestModel } from '../models/PrayerRequest';
import { ApiError } from '../utils/apiError';
import { IAuthRequest } from '../types';

export class PrayerRequestController {
  /**
   * Get active/new prayer requests (pending + confirmed)
   * For "Active/New" tab in UI
   */
  public static async getActiveRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const prayerRequests = await PrayerRequestModel.getActiveRequests(parishId);

      res.json({
        success: true,
        data: prayerRequests,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get past prayer requests (completed + cancelled)
   * For "Past Requests" tab in UI
   */
  public static async getPastRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const prayerRequests = await PrayerRequestModel.getPastRequests(parishId);

      res.json({
        success: true,
        data: prayerRequests,
      });
    } catch (error) {
      next(error);
    }
  }


  /**
   * Create a new prayer request booking
   */
  public static async create(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const prayerRequestData = req.body;

      // If user is authenticated and is a parishioner, link to their account
      if (req.user && req.user.user_type === 'parishioner') {
        // You may want to fetch parishioner_id from user_id here
        // For now, we'll use the provided requested_by if available
      }

      const prayerRequest = await PrayerRequestModel.create(prayerRequestData);

      res.status(201).json({
        success: true,
        message: 'Prayer request booking created successfully',
        data: prayerRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve a prayer request (Admin action)
   * Changes status from 'pending' to 'confirmed'
   */
  public static async approve(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const prayerRequestId = parseInt(req.params.id);

      if (isNaN(prayerRequestId)) {
        throw ApiError.badRequest('Invalid prayer request ID');
      }

      // Get church_admin_id from user_id (if user is a church admin)
      let church_admin_id: number | undefined;
      if (req.user?.user_id) {
        church_admin_id = await PrayerRequestModel.getChurchAdminId(req.user.user_id);
      }

      const prayerRequest = await PrayerRequestModel.approve(prayerRequestId, church_admin_id);

      res.json({
        success: true,
        message: 'Prayer request approved successfully',
        data: prayerRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Close a prayer request (Admin action)
   * Changes status from 'pending/confirmed' to 'completed'
   */
  public static async close(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const prayerRequestId = parseInt(req.params.id);

      if (isNaN(prayerRequestId)) {
        throw ApiError.badRequest('Invalid prayer request ID');
      }

      const prayerRequest = await PrayerRequestModel.close(prayerRequestId);

      res.json({
        success: true,
        message: 'Prayer request closed successfully',
        data: prayerRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manual trigger for auto-archive (Admin only)
   * Useful for testing the auto-archive functionality
   */
  public static async manualArchive(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const daysOld = parseInt(req.query.daysOld as string) || 10;

      const archivedCount = await PrayerRequestModel.autoArchiveOldRequests(daysOld);

      res.json({
        success: true,
        message: `Auto-archive completed: ${archivedCount} prayer requests archived`,
        data: {
          archived_count: archivedCount,
          days_threshold: daysOld,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default PrayerRequestController;
