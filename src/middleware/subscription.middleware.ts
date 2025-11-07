/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import { ParishSubscriptionModel, SubscriptionPlanModel } from '../models/Subscription';
import { SubscriptionStatus as RazorpaySubscriptionStatus, PlanTier } from '../types/subscription.types';
import { SubscriptionStatus, IAuthRequest } from '../types';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';
import database from '../config/database';
import { ParishModel } from '../models/Parish';

/**
 * NEW: Middleware to check if parish subscription_status is ACTIVE
 * This enforces payment before access (Approach 1)
 * Blocks PENDING, SUSPENDED, CANCELLED parishes
 */
export const requireActiveParishSubscription = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Super Admin bypasses subscription checks
    if (user.user_type === 'super_admin') {
      return next();
    }

    // Get parish_id from user token
    const parishId = user.parish_id;

    if (!parishId) {
      logger.warn('User has no associated parish', {
        userId: user.user_id,
        userType: user.user_type,
      });
      throw ApiError.forbidden('No parish associated with this account');
    }

    // Fetch parish subscription status
    const parish = await ParishModel.findById(parishId);

    if (!parish) {
      logger.error('Parish not found for subscription check', {
        userId: user.user_id,
        parishId,
      });
      throw ApiError.notFound('Parish not found');
    }

    // Check subscription status
    if (parish.subscription_status !== SubscriptionStatus.ACTIVE) {
      logger.warn('Access blocked - Subscription not active', {
        userId: user.user_id,
        parishId,
        currentStatus: parish.subscription_status,
      });

      // Return different messages based on status
      let message: string;
      let action: string;

      switch (parish.subscription_status) {
        case SubscriptionStatus.PENDING:
          message = 'Your parish subscription is pending. Please complete payment to activate your account.';
          action = 'Visit /subscriptions/plans to view plans and /subscriptions to create a subscription.';
          break;

        case SubscriptionStatus.SUSPENDED:
          message = 'Your parish subscription has been suspended due to payment issues. Please renew your subscription.';
          action = 'Contact support or renew your subscription to regain access.';
          break;

        case SubscriptionStatus.CANCELLED:
          message = 'Your parish subscription has been cancelled. Please resubscribe to access this feature.';
          action = 'Visit /subscriptions to create a new subscription.';
          break;

        default:
          message = 'Subscription status unknown. Please contact support.';
          action = 'Contact support for assistance.';
      }

      res.status(403).json({
        success: false,
        error: 'Subscription Required',
        message,
        data: {
          subscription_status: parish.subscription_status,
          parish_id: parish.parish_id,
          parish_name: parish.parish_name,
          action,
          endpoints: {
            view_plans: '/subscriptions/plans',
            create_subscription: '/subscriptions',
            manage_subscription: `/subscriptions/parish/${parishId}`,
          },
        },
      });
      return;
    }

    // Subscription is ACTIVE - allow access
    logger.debug('Subscription check passed', {
      userId: user.user_id,
      parishId,
      subscriptionStatus: parish.subscription_status,
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * OLD: Middleware to check if parish has an active Razorpay subscription
 * Blocks request if subscription is expired, cancelled, or halted
 * @deprecated Use requireActiveParishSubscription instead
 */
export const requireActiveSubscription = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parishId = parseInt(req.params.parishId) || (req as any).parish?.parish_id;

    if (!parishId) {
      throw ApiError.badRequest('Parish ID is required');
    }

    const subscription = await ParishSubscriptionModel.findByParishId(parishId);

    if (!subscription) {
      throw ApiError.forbidden('No subscription found for this parish. Please subscribe to a plan.');
    }

    // Check if subscription is active
    const activeStatuses = [RazorpaySubscriptionStatus.ACTIVE, RazorpaySubscriptionStatus.AUTHENTICATED];

    if (!activeStatuses.includes(subscription.subscription_status)) {
      throw ApiError.forbidden(
        `Subscription is ${subscription.subscription_status}. Please renew or reactivate your subscription.`
      );
    }

    // Check if subscription is expired
    if (subscription.expiry_date && new Date(subscription.expiry_date) < new Date()) {
      throw ApiError.forbidden('Subscription has expired. Please renew your subscription.');
    }

    // Attach subscription to request for downstream use
    (req as any).subscription = subscription;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if parish can use a specific feature based on plan limits
 * Usage: requireFeatureLimit('max_parishioners')
 */
export const requireFeatureLimit = (feature: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parishId = parseInt(req.params.parishId) || (req as any).parish?.parish_id;

      if (!parishId) {
        throw ApiError.badRequest('Parish ID is required');
      }

      // Get active subscription
      const subscription = await ParishSubscriptionModel.findByParishId(parishId);

      if (!subscription || subscription.subscription_status !== RazorpaySubscriptionStatus.ACTIVE) {
        throw ApiError.forbidden('Active subscription required to use this feature');
      }

      // Get plan details
      const plan = await SubscriptionPlanModel.findById(subscription.plan_id);

      if (!plan) {
        throw ApiError.notFound('Subscription plan not found');
      }

      // Check specific feature limit
      let currentUsage = 0;
      let maxLimit = 0;

      switch (feature) {
        case 'max_parishioners': {
          const parishionerResult = await database.executeQuery<{ count: string }>(
            `SELECT COUNT(*) as count FROM parishioners WHERE parish_id = $1 AND is_deleted = FALSE`,
            [parishId]
          );
          currentUsage = parseInt(parishionerResult.rows[0]?.count || '0');
          maxLimit = plan.max_parishioners;
          break;
        }

        case 'max_families': {
          const familyResult = await database.executeQuery<{ count: string }>(
            `SELECT COUNT(*) as count FROM families WHERE parish_id = $1 AND is_deleted = FALSE`,
            [parishId]
          );
          currentUsage = parseInt(familyResult.rows[0]?.count || '0');
          maxLimit = plan.max_families;
          break;
        }

        case 'max_admins': {
          const adminResult = await database.executeQuery<{ count: string }>(
            `SELECT COUNT(*) as count FROM users WHERE parish_id = $1 AND role = 'parish_admin' AND is_deleted = FALSE`,
            [parishId]
          );
          currentUsage = parseInt(adminResult.rows[0]?.count || '0');
          maxLimit = plan.max_admins || 5; // Default to 5 if not specified
          break;
        }

        default:
          throw ApiError.badRequest(`Unknown feature: ${feature}`);
      }

      // Check if limit exceeded (0 means unlimited)
      if (maxLimit > 0 && currentUsage >= maxLimit) {
        throw ApiError.forbidden(
          `You have reached the maximum limit of ${maxLimit} ${feature.replace('max_', '').replace('_', ' ')} for your ${plan.plan_name} plan. Please upgrade to add more.`
        );
      }

      // Attach usage info to request
      (req as any).featureUsage = {
        feature,
        currentUsage,
        maxLimit,
        remaining: maxLimit > 0 ? maxLimit - currentUsage : 'unlimited',
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to require a specific plan tier or higher
 * Usage: requirePlan(PlanTier.STANDARD)
 */
export const requirePlan = (minimumTier: PlanTier) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parishId = parseInt(req.params.parishId) || (req as any).parish?.parish_id;

      if (!parishId) {
        throw ApiError.badRequest('Parish ID is required');
      }

      // Get active subscription
      const subscription = await ParishSubscriptionModel.findByParishId(parishId);

      if (!subscription || subscription.subscription_status !== RazorpaySubscriptionStatus.ACTIVE) {
        throw ApiError.forbidden('Active subscription required');
      }

      // Get plan details
      const plan = await SubscriptionPlanModel.findById(subscription.plan_id);

      if (!plan) {
        throw ApiError.notFound('Subscription plan not found');
      }

      // Define tier hierarchy
      const tierHierarchy: Record<PlanTier, number> = {
        [PlanTier.BASIC]: 1,
        [PlanTier.STANDARD]: 2,
        [PlanTier.PREMIUM]: 3,
        [PlanTier.ENTERPRISE]: 4,
      };

      const currentTierLevel = tierHierarchy[plan.tier as PlanTier] || 0;
      const requiredTierLevel = tierHierarchy[minimumTier];

      if (currentTierLevel < requiredTierLevel) {
        throw ApiError.forbidden(
          `This feature requires ${minimumTier} plan or higher. Your current plan is ${plan.tier}. Please upgrade your subscription.`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if parish is in trial period
 * Allows access but adds warning header
 */
export const checkTrialStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parishId = parseInt(req.params.parishId) || (req as any).parish?.parish_id;

    if (!parishId) {
      return next();
    }

    const subscription = await ParishSubscriptionModel.findByParishId(parishId);

    if (subscription && subscription.trial_end_date) {
      const trialEndDate = new Date(subscription.trial_end_date);
      const now = new Date();

      if (trialEndDate > now) {
        // Still in trial
        const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        res.setHeader('X-Trial-Days-Remaining', daysRemaining.toString());
        res.setHeader('X-Trial-End-Date', trialEndDate.toISOString());

        // Log trial status
        logger.info(`Parish ${parishId} is in trial period. ${daysRemaining} days remaining.`);
      }
    }

    next();
  } catch (error) {
    // Don't block request if trial check fails
    logger.error('Trial status check error:', error);
    next();
  }
};

/**
 * Middleware to enforce storage limits
 * Checks if parish has exceeded storage quota
 */
export const checkStorageLimit = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parishId = parseInt(req.params.parishId) || (req as any).parish?.parish_id;

    if (!parishId) {
      throw ApiError.badRequest('Parish ID is required');
    }

    // Get active subscription
    const subscription = await ParishSubscriptionModel.findByParishId(parishId);

    if (!subscription || subscription.subscription_status !== RazorpaySubscriptionStatus.ACTIVE) {
      throw ApiError.forbidden('Active subscription required');
    }

    // Get plan details
    const plan = await SubscriptionPlanModel.findById(subscription.plan_id);

    if (!plan) {
      throw ApiError.notFound('Subscription plan not found');
    }

    // Get current storage usage (this would need to be implemented based on your file storage)
    // For now, using a placeholder query
    const storageResult = await database.executeQuery<{ total_mb: string }>(
      `SELECT COALESCE(SUM(file_size_mb), 0) as total_mb
       FROM uploaded_files
       WHERE parish_id = $1`,
      [parishId]
    );

    const currentStorageMB = parseFloat(storageResult.rows[0]?.total_mb || '0');
    const maxStorageMB = plan.max_storage_gb * 1024; // Convert GB to MB

    // Check if limit exceeded (0 means unlimited)
    if (maxStorageMB > 0 && currentStorageMB >= maxStorageMB) {
      throw ApiError.forbidden(
        `You have reached the maximum storage limit of ${maxStorageMB}MB for your ${plan.plan_name} plan. Please upgrade or delete some files.`
      );
    }

    // Attach storage info to request
    (req as any).storageUsage = {
      currentMB: currentStorageMB,
      maxMB: maxStorageMB,
      remainingMB: maxStorageMB > 0 ? maxStorageMB - currentStorageMB : 'unlimited',
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to log subscription activity
 * Useful for analytics and monitoring
 */
export const logSubscriptionActivity = (action: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parishId = parseInt(req.params.parishId) || (req as any).parish?.parish_id;
      const userId = (req as IAuthRequest).user?.user_id;

      if (parishId) {
        logger.info(`Subscription activity: ${action}`, {
          parish_id: parishId,
          user_id: userId,
          ip: req.ip,
          user_agent: req.headers['user-agent'],
          timestamp: new Date().toISOString(),
        });
      }

      next();
    } catch (error) {
      // Don't block request if logging fails
      logger.error('Subscription activity logging error:', error);
      next();
    }
  };
};

/**
 * Middleware to add subscription info to response headers
 * Useful for frontend to display subscription status
 */
export const addSubscriptionHeaders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parishId = parseInt(req.params.parishId) || (req as any).parish?.parish_id;

    if (!parishId) {
      return next();
    }

    const subscription = await ParishSubscriptionModel.findByParishId(parishId);

    if (subscription) {
      res.setHeader('X-Subscription-Status', subscription.subscription_status);
      res.setHeader('X-Subscription-Plan-Id', subscription.plan_id.toString());

      if (subscription.next_billing_date) {
        res.setHeader('X-Next-Billing-Date', new Date(subscription.next_billing_date).toISOString());
      }

      if (subscription.expiry_date) {
        res.setHeader('X-Subscription-Expiry', new Date(subscription.expiry_date).toISOString());
      }
    }

    next();
  } catch (error) {
    // Don't block request if header addition fails
    logger.error('Subscription header addition error:', error);
    next();
  }
};
