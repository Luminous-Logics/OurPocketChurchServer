/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  SubscriptionPlanModel,
  ParishSubscriptionModel,
  SubscriptionHistoryModel,
} from '../models/Subscription';
import { ParishModel } from '../models/Parish';
import razorpayService from './razorpay.service';
import { ApiError } from '../utils/apiError';
import {
  SubscriptionStatus as ParishSubscriptionStatus,
  SubscriptionAction,
  ICreateSubscriptionDTO,
  IFeatureAccess,
  ISubscriptionUsage,
} from '../types/subscription.types';
import { SubscriptionStatus as ParishStatus } from '../types/index';
import logger from '../utils/logger';
import database from '../config/database';

class SubscriptionService {
  /**
   * Create new parish subscription
   */
  async createParishSubscription(data: ICreateSubscriptionDTO, userId: number) {
    try {
      // 1. Validate parish exists
      const parish = await ParishModel.findById(data.parish_id);
      if (!parish) {
        throw ApiError.notFound('Parish not found');
      }

      // 2. Check if parish already has subscription
      const existing = await ParishSubscriptionModel.findByParishId(data.parish_id);
      if (existing) {
        throw ApiError.badRequest('Parish already has an active subscription');
      }

      // 3. Validate plan exists
      const plan = await SubscriptionPlanModel.findById(data.plan_id);
      if (!plan || !plan.is_active) {
        throw ApiError.badRequest('Invalid or inactive subscription plan');
      }

      const paymentMethod = data.payment_method || 'online';
      const now = new Date();
      const trialStartDate = now;
      const trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + plan.trial_period_days);

      let customer: any;
      let razorpaySubscription: any;

      // Only create Razorpay customer and subscription for online payments
      if (paymentMethod === 'online') {
        // 4. Create Razorpay customer
        customer = await razorpayService.createCustomer({
          name: parish.parish_name,
          email: data.billing_email,
          contact: data.billing_phone || parish.phone || '',
          notes: {
            parish_id: data.parish_id.toString(),
            parish_name: parish.parish_name,
          },
        });

        // 5. Create Razorpay subscription
        if (plan.razorpay_plan_id) {
          // Calculate total_count based on billing cycle to ensure ~30 years duration
          // Razorpay has a 30-year limit for UPI payments (expire_at cannot exceed 30 years)
          let totalCount = 360; // Default for monthly (30 years = 360 months)
          if (plan.billing_cycle === 'quarterly') {
            totalCount = 120; // 120 quarters = 30 years
          } else if (plan.billing_cycle === 'yearly') {
            totalCount = 30; // 30 years
          }

          razorpaySubscription = await razorpayService.createSubscription({
            plan_id: plan.razorpay_plan_id,
            customer_id: (customer as any).id,
            quantity: 1,
            total_count: totalCount,
            customer_notify: 1,
            notes: {
              parish_id: data.parish_id.toString(),
              plan_id: plan.plan_id.toString(),
            },
          });
        }
      }

      // 6. Create subscription in database
      // Handle billing_address - can be string or object
      const billingAddressObj = typeof data.billing_address === 'string'
        ? { line1: data.billing_address }
        : data.billing_address;

      const subscription = await ParishSubscriptionModel.create({
        parish_id: data.parish_id,
        plan_id: data.plan_id,
        payment_method: paymentMethod,
        razorpay_subscription_id: razorpaySubscription?.id,
        razorpay_customer_id: customer?.id,
        billing_contact_user_id: userId,
        billing_email: data.billing_email,
        billing_phone: data.billing_phone,
        billing_address_line1: billingAddressObj?.line1 || data.billing_address as string,
        billing_address_line2: billingAddressObj?.line2,
        billing_city: data.billing_city || billingAddressObj?.city,
        billing_state: data.billing_state || billingAddressObj?.state,
        billing_country: data.billing_country || billingAddressObj?.country || 'India',
        billing_postal_code: data.billing_pincode || billingAddressObj?.postal_code,
        tax_identification_number: data.tax_identification_number,
        company_name: data.billing_name || data.company_name,
        subscription_status: paymentMethod === 'cash' ? ParishSubscriptionStatus.PENDING : ParishSubscriptionStatus.CREATED,
        start_date: now,
        trial_start_date: plan.trial_period_days > 0 ? trialStartDate : undefined,
        trial_end_date: plan.trial_period_days > 0 ? trialEndDate : undefined,
      });

      // 7. Update parish table
      await database.executeQuery(
        `UPDATE parishes
         SET current_plan_id = $1,
             is_subscription_managed = TRUE,
             updated_at = CURRENT_TIMESTAMP
         WHERE parish_id = $2`,
        [plan.plan_id, data.parish_id]
      );

      // 8. Log history
      const subscriptionStatus = paymentMethod === 'cash' ? ParishSubscriptionStatus.PENDING : ParishSubscriptionStatus.CREATED;
      await SubscriptionHistoryModel.create({
        subscription_id: subscription.subscription_id,
        parish_id: data.parish_id,
        action: SubscriptionAction.CREATED,
        new_status: subscriptionStatus,
        new_plan_id: plan.plan_id,
        description: `Subscription created for ${plan.plan_name} (Payment Method: ${paymentMethod})`,
        performed_by: userId,
      });

      logger.info(`Subscription created for parish ${data.parish_id} with payment method: ${paymentMethod}`);

      // Return different response based on payment method
      if (paymentMethod === 'cash') {
        return {
          subscription,
          plan,
          payment_method: 'cash',
          checkout_info: {
            message: 'Cash payment selected. Please contact admin to complete payment and activate your subscription.',
            integration_type: 'cash',
            next_steps: [
              '1. Make cash payment to the parish office',
              '2. Provide payment receipt to admin',
              '3. Admin will verify and activate your subscription',
              '4. You will be notified once subscription is active',
            ],
          },
        };
      }

      return {
        subscription,
        plan,
        payment_method: 'online',
        // Razorpay Standard Checkout integration data
        razorpay_subscription_id: razorpaySubscription?.id,
        razorpay_key_id: process.env.RAZORPAY_KEY_ID,

        // Full Razorpay response for debugging
        razorpay_subscription: razorpaySubscription,

        // Checkout instructions
        checkout_info: {
          message: 'Use razorpay_subscription_id with Razorpay Standard Checkout for payment',
          integration_type: 'standard_checkout',
          test_mode: process.env.NODE_ENV !== 'production',
        },
      };
    } catch (error) {
      logger.error('Error creating parish subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(parishId: number, reason: string, userId: number, cancelAtCycleEnd: boolean = false) {
    const subscription = await ParishSubscriptionModel.findByParishId(parishId);

    if (!subscription) {
      throw ApiError.notFound('Subscription not found');
    }

    // Cancel in Razorpay
    if (subscription.razorpay_subscription_id) {
      await razorpayService.cancelSubscription(subscription.razorpay_subscription_id, cancelAtCycleEnd);
    }

    // Update database
    await ParishSubscriptionModel.cancel(subscription.subscription_id, userId, reason);

    // Clear parish plan
    await database.executeQuery(
      `UPDATE parishes SET current_plan_id = NULL WHERE parish_id = $1`,
      [parishId]
    );

    // Log history
    await SubscriptionHistoryModel.create({
      subscription_id: subscription.subscription_id,
      parish_id: parishId,
      action: SubscriptionAction.CANCELLED,
      old_status: subscription.subscription_status,
      new_status: ParishSubscriptionStatus.CANCELLED,
      description: `Subscription cancelled: ${reason}`,
      performed_by: userId,
    });

    logger.info(`Subscription cancelled for parish ${parishId}`);
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(parishId: number, userId: number) {
    const subscription = await ParishSubscriptionModel.findByParishId(parishId);

    if (!subscription) {
      throw ApiError.notFound('Subscription not found');
    }

    if (subscription.razorpay_subscription_id) {
      await razorpayService.pauseSubscription(subscription.razorpay_subscription_id);
    }

    await ParishSubscriptionModel.updateStatus(subscription.subscription_id, ParishSubscriptionStatus.PAUSED);

    await SubscriptionHistoryModel.create({
      subscription_id: subscription.subscription_id,
      parish_id: parishId,
      action: SubscriptionAction.PAUSED,
      old_status: subscription.subscription_status,
      new_status: ParishSubscriptionStatus.PAUSED,
      description: 'Subscription paused',
      performed_by: userId,
    });

    logger.info(`Subscription paused for parish ${parishId}`);
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(parishId: number, userId: number) {
    const subscription = await ParishSubscriptionModel.findByParishId(parishId);

    if (!subscription) {
      throw ApiError.notFound('Subscription not found');
    }

    if (subscription.razorpay_subscription_id) {
      await razorpayService.resumeSubscription(subscription.razorpay_subscription_id);
    }

    await ParishSubscriptionModel.updateStatus(subscription.subscription_id, ParishSubscriptionStatus.ACTIVE);

    await SubscriptionHistoryModel.create({
      subscription_id: subscription.subscription_id,
      parish_id: parishId,
      action: SubscriptionAction.RESUMED,
      old_status: subscription.subscription_status,
      new_status: ParishSubscriptionStatus.ACTIVE,
      description: 'Subscription resumed',
      performed_by: userId,
    });

    logger.info(`Subscription resumed for parish ${parishId}`);
  }

  /**
   * Check feature limits
   */
  async checkFeatureLimit(parishId: number, feature: 'parishioner' | 'family' | 'ward' | 'user'): Promise<boolean> {
    const subscription = await ParishSubscriptionModel.getSubscriptionWithPlan(parishId);

    if (!subscription || subscription.subscription_status !== ParishSubscriptionStatus.ACTIVE) {
      return false; // No active subscription
    }

    // Get limit for feature
    let limit: number | null = null;
    switch (feature) {
      case 'parishioner':
        limit = subscription.max_parishioners;
        break;
      case 'family':
        limit = subscription.max_families;
        break;
      case 'ward':
        limit = subscription.max_wards;
        break;
      case 'user':
        limit = subscription.max_users;
        break;
    }

    // If null (unlimited), allow
    if (limit === null) return true;

    // Get current count
    const table = feature === 'parishioner' ? 'parishioners' : feature === 'user' ? 'users' : `${feature}s`;
    const result = await database.executeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${table} WHERE parish_id = $1 AND is_active = TRUE`,
      [parishId]
    );

    const currentCount = result.rows[0]?.count || 0;

    return currentCount < limit;
  }

  /**
   * Get feature usage
   */
  async getFeatureUsage(parishId: number): Promise<ISubscriptionUsage> {
    const queries = await Promise.all([
      database.executeQuery<{ count: number }>('SELECT COUNT(*) as count FROM parishioners WHERE parish_id = $1 AND is_active = TRUE', [parishId]),
      database.executeQuery<{ count: number }>('SELECT COUNT(*) as count FROM families WHERE parish_id = $1 AND is_active = TRUE', [parishId]),
      database.executeQuery<{ count: number }>('SELECT COUNT(*) as count FROM wards WHERE parish_id = $1 AND is_active = TRUE', [parishId]),
      database.executeQuery<{ count: number }>('SELECT COUNT(*) as count FROM users u JOIN church_admins ca ON u.user_id = ca.user_id WHERE ca.parish_id = $1 AND u.is_active = TRUE', [parishId]),
    ]);

    return {
      current_parishioners: queries[0].rows[0]?.count || 0,
      current_families: queries[1].rows[0]?.count || 0,
      current_wards: queries[2].rows[0]?.count || 0,
      current_users: queries[3].rows[0]?.count || 0,
      current_storage_gb: 0, // TODO: Implement storage calculation
    };
  }

  /**
   * Get feature access (usage + limits)
   */
  async getFeatureAccess(parishId: number): Promise<IFeatureAccess> {
    const subscription = await ParishSubscriptionModel.getSubscriptionWithPlan(parishId);
    const usage = await this.getFeatureUsage(parishId);

    if (!subscription || subscription.subscription_status !== ParishSubscriptionStatus.ACTIVE) {
      return {
        can_add_parishioner: false,
        can_add_family: false,
        can_add_ward: false,
        can_add_user: false,
        can_upload_file: false,
      };
    }

    const calculateRemaining = (current: number, max: number | null): number | undefined => {
      if (max === null) return undefined; // Unlimited
      return Math.max(0, max - current);
    };

    return {
      can_add_parishioner: subscription.max_parishioners === null || usage.current_parishioners < subscription.max_parishioners,
      can_add_family: subscription.max_families === null || usage.current_families < subscription.max_families,
      can_add_ward: subscription.max_wards === null || usage.current_wards < subscription.max_wards,
      can_add_user: subscription.max_users === null || usage.current_users < subscription.max_users,
      can_upload_file: true, // TODO: Check storage
      remaining_parishioners: calculateRemaining(usage.current_parishioners, subscription.max_parishioners),
      remaining_families: calculateRemaining(usage.current_families, subscription.max_families),
      remaining_wards: calculateRemaining(usage.current_wards, subscription.max_wards),
      remaining_users: calculateRemaining(usage.current_users, subscription.max_users),
    };
  }

  /**
   * [TESTING ONLY] Manually activate parish subscription
   * Bypasses Razorpay payment flow for testing purposes
   *
   * @param parishId - ID of the parish to activate
   * @param userId - ID of the user performing the activation (must be super admin)
   * @param reason - Reason for manual activation
   */
  async manuallyActivateParish(parishId: number, userId: number, reason: string) {
    try {
      logger.info('Manual parish activation initiated', { parishId, userId, reason });

      // 1. Validate parish exists
      const parish = await ParishModel.findById(parishId);
      if (!parish) {
        throw ApiError.notFound('Parish not found');
      }

      // 2. Check if parish subscription exists
      const subscription = await ParishSubscriptionModel.findByParishId(parishId);

      if (subscription) {
        // Update existing subscription to active
        await ParishSubscriptionModel.updateStatus(
          subscription.subscription_id,
          ParishSubscriptionStatus.ACTIVE,
          {
            current_period_start: new Date(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          }
        );

        // Log history
        await SubscriptionHistoryModel.create({
          subscription_id: subscription.subscription_id,
          parish_id: parishId,
          action: SubscriptionAction.ACTIVATED,
          old_status: subscription.subscription_status,
          new_status: ParishSubscriptionStatus.ACTIVE,
          description: reason,
          performed_by: userId,
        });

        logger.info('Existing subscription activated manually', {
          subscriptionId: subscription.subscription_id,
          parishId,
        });
      }

      // 3. Update parish status to ACTIVE
      await ParishModel.update(parishId, {
        subscription_status: ParishStatus.ACTIVE,
        is_subscription_managed: true,
      });

      logger.info('Parish subscription status updated to ACTIVE', { parishId });

      // 4. Get updated parish
      const updatedParish = await ParishModel.findById(parishId);

      return {
        parish: updatedParish,
        subscription: subscription ? await ParishSubscriptionModel.findByParishId(parishId) : null,
        message: 'Parish manually activated successfully',
        warning: 'This is a manual activation for testing purposes only. In production, use the Razorpay payment flow.',
      };
    } catch (error) {
      logger.error('Failed to manually activate parish', {
        parishId,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Verify payment signature from Razorpay Standard Checkout
   * This ensures the payment response hasn't been tampered with
   */
  async verifyPaymentSignature(data: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) {
    try {
      logger.info('Verifying payment signature', {
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_subscription_id: data.razorpay_subscription_id,
      });

      // Verify signature using Razorpay service
      const isValid = await razorpayService.verifyPaymentSignature(
        data.razorpay_payment_id,
        data.razorpay_subscription_id,
        data.razorpay_signature
      );

      if (!isValid) {
        logger.error('Invalid payment signature', data);
        throw ApiError.badRequest('Invalid payment signature. Payment verification failed.');
      }

      // Find subscription by Razorpay subscription ID
      const subscription = await ParishSubscriptionModel.findByRazorpayId(data.razorpay_subscription_id);

      if (!subscription) {
        logger.error('Subscription not found for razorpay_subscription_id', {
          razorpay_subscription_id: data.razorpay_subscription_id,
        });
        throw ApiError.notFound('Subscription not found');
      }

      // Update subscription status to active
      await ParishSubscriptionModel.updateStatus(
        subscription.subscription_id,
        ParishSubscriptionStatus.ACTIVE,
        {
          last_payment_date: new Date(),
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      );

      // Update parish status to ACTIVE
      await ParishModel.update(subscription.parish_id, {
        subscription_status: ParishStatus.ACTIVE,
      });

      // Log history
      await SubscriptionHistoryModel.create({
        subscription_id: subscription.subscription_id,
        parish_id: subscription.parish_id,
        action: SubscriptionAction.ACTIVATED,
        old_status: subscription.subscription_status,
        new_status: ParishSubscriptionStatus.ACTIVE,
        description: `Payment verified and subscription activated. Payment ID: ${data.razorpay_payment_id}`,
        performed_by: undefined, // System action (no user)
      });

      logger.info('Payment verified and subscription activated', {
        subscription_id: subscription.subscription_id,
        parish_id: subscription.parish_id,
        razorpay_payment_id: data.razorpay_payment_id,
      });

      return {
        verified: true,
        subscription_id: subscription.subscription_id,
        parish_id: subscription.parish_id,
        subscription_status: 'active',
        message: 'Payment verified successfully. Your subscription is now active!',
      };
    } catch (error) {
      logger.error('Failed to verify payment signature', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

export default new SubscriptionService();
