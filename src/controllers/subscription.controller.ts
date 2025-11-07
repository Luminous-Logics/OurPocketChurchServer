/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { Request, Response, NextFunction } from 'express';
import { SubscriptionPlanModel, ParishSubscriptionModel, SubscriptionPaymentModel } from '../models/Subscription';
import subscriptionService from '../services/subscription.service';
import { ApiError } from '../utils/apiError';
import { IAuthRequest } from '../types';

export class SubscriptionController {
  /**
   * Get all subscription plans
   */
  public static async getPlans(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await SubscriptionPlanModel.findAll();

      res.json({
        success: true,
        data: plans,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single plan by ID
   */
  public static async getPlanById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const plan = await SubscriptionPlanModel.findById(parseInt(id));

      if (!plan) {
        throw ApiError.notFound('Subscription plan not found');
      }

      res.json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new subscription
   */
  public static async createSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as IAuthRequest;
      const userId = authReq.user?.user_id!;

      const result = await subscriptionService.createParishSubscription(req.body, userId);

      res.status(201).json({
        success: true,
        message: 'Subscription created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get parish subscription
   */
  public static async getSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { parishId } = req.params;

      const subscription = await ParishSubscriptionModel.getSubscriptionWithPlan(parseInt(parishId));

      if (!subscription) {
        throw ApiError.notFound('Subscription not found for this parish');
      }

      res.json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel subscription
   */
  public static async cancelSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as IAuthRequest;
      const userId = authReq.user?.user_id!;
      const { parishId } = req.params;
      const { cancellation_reason, cancel_at_cycle_end } = req.body;

      await subscriptionService.cancelSubscription(
        parseInt(parishId),
        cancellation_reason,
        userId,
        cancel_at_cycle_end || false
      );

      res.json({
        success: true,
        message: 'Subscription cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Pause subscription
   */
  public static async pauseSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as IAuthRequest;
      const userId = authReq.user?.user_id!;
      const { parishId } = req.params;

      await subscriptionService.pauseSubscription(parseInt(parishId), userId);

      res.json({
        success: true,
        message: 'Subscription paused successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resume subscription
   */
  public static async resumeSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as IAuthRequest;
      const userId = authReq.user?.user_id!;
      const { parishId } = req.params;

      await subscriptionService.resumeSubscription(parseInt(parishId), userId);

      res.json({
        success: true,
        message: 'Subscription resumed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment history
   */
  public static async getPaymentHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { parishId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const payments = await SubscriptionPaymentModel.findByParishId(parseInt(parishId), limit);

      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get feature usage and limits
   */
  public static async getFeatureAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { parishId } = req.params;

      const access = await subscriptionService.getFeatureAccess(parseInt(parishId));

      res.json({
        success: true,
        data: access,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get usage statistics
   */
  public static async getUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { parishId } = req.params;

      const usage = await subscriptionService.getFeatureUsage(parseInt(parishId));

      res.json({
        success: true,
        data: usage,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update billing details for a subscription
   */
  public static async updateBillingDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { parishId } = req.params;
      const billingData = req.body;

      // Get current subscription
      const subscription = await ParishSubscriptionModel.findByParishId(parseInt(parishId));

      if (!subscription) {
        throw ApiError.notFound('No subscription found for this parish');
      }

      // Update billing details
      await ParishSubscriptionModel.updateBillingDetails(subscription.subscription_id, billingData);

      // Get updated subscription
      const updatedSubscription = await ParishSubscriptionModel.findByParishId(parseInt(parishId));

      res.json({
        success: true,
        message: 'Billing details updated successfully',
        data: updatedSubscription,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if parish can use a specific feature (feature limit check)
   */
  public static async checkFeatureLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { parishId } = req.params;
      const { feature } = req.body;

      const canUse = await subscriptionService.checkFeatureLimit(parseInt(parishId), feature);

      res.json({
        success: true,
        data: {
          feature,
          canUse,
          message: canUse
            ? `You can add more ${feature.replace('max_', '').replace('_', ' ')}`
            : `You have reached the limit for ${feature.replace('max_', '').replace('_', ' ')}`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * [SUPER ADMIN ONLY] Manually activate parish subscription
   * For testing purposes - bypasses Razorpay payment flow
   *
   * This endpoint allows super admins to manually mark a parish as paid/active
   * Useful during development when Razorpay test mode doesn't have hosted pages
   */
  public static async manuallyActivateParish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as IAuthRequest;
      const userId = authReq.user?.user_id!;
      const { parishId } = req.params;
      const { reason } = req.body;

      const result = await subscriptionService.manuallyActivateParish(
        parseInt(parishId),
        userId,
        reason || 'Manual activation by super admin for testing'
      );

      res.json({
        success: true,
        message: 'Parish subscription manually activated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify payment signature after Razorpay Standard Checkout
   * This endpoint is called by the frontend after successful payment
   */
  public static async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature,
      } = req.body;

      const result = await subscriptionService.verifyPaymentSignature({
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature,
      });

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment details for a pending subscription
   * This allows users to retrieve payment information if they didn't complete payment during registration
   * Public endpoint - requires parish_id
   */
  public static async getPaymentDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { parishId } = req.params;

      // Get subscription with plan details
      const subscription = await ParishSubscriptionModel.getSubscriptionWithPlan(parseInt(parishId));

      if (!subscription) {
        throw ApiError.notFound('No subscription found for this parish');
      }

      // Only return payment details for pending subscriptions
      if (subscription.subscription_status !== 'pending' && subscription.subscription_status !== 'created') {
        res.json({
          success: true,
          message: 'Subscription is already active',
          data: {
            subscription_status: subscription.subscription_status,
            message: 'Your subscription is already active. No payment required.',
          },
        });
        return;
      }

      // Return different response based on payment method
      if (subscription.payment_method === 'cash') {
        res.json({
          success: true,
          payment_required: true,
          payment_method: 'cash',
          message: 'Your parish subscription is pending cash payment verification.',
          data: {
            subscription: {
              subscription_id: subscription.subscription_id,
              plan_name: subscription.plan_name,
              amount: subscription.amount,
              billing_cycle: subscription.billing_cycle,
              payment_method: 'cash',
              status: subscription.subscription_status,
            },
            instructions: [
              'Your cash payment is pending verification by the admin.',
              'Please contact the parish office if you have already made the payment.',
              'Once verified, you will be able to login.',
            ],
          },
        });
        return;
      }

      // Online payment - return Razorpay details
      res.json({
        success: true,
        payment_required: true,
        payment_method: 'online',
        message: 'Your parish subscription payment is pending. Please complete the payment to activate your subscription.',
        data: {
          subscription: {
            subscription_id: subscription.subscription_id,
            plan_name: subscription.plan_name,
            amount: subscription.amount,
            billing_cycle: subscription.billing_cycle,
            payment_method: 'online',
            status: subscription.subscription_status,
            razorpay_subscription_id: subscription.razorpay_subscription_id,
          },
          // Razorpay payment details
          razorpay_subscription_id: subscription.razorpay_subscription_id,
          razorpay_key_id: process.env.RAZORPAY_KEY_ID,
          checkout_info: {
            message: 'Complete your payment to activate your subscription',
            integration_type: 'standard_checkout',
            steps: [
              '1. Use razorpay_subscription_id and razorpay_key_id to open Razorpay checkout',
              '2. Complete payment using your preferred method',
              '3. After payment, verify by calling POST /subscriptions/verify-payment',
              '4. Login to access your account',
            ],
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
