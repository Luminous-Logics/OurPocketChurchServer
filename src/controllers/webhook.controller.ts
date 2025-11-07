/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import razorpayService from '../services/razorpay.service';
import {
  ParishSubscriptionModel,
  SubscriptionPaymentModel,
  WebhookLogModel,
  SubscriptionHistoryModel,
} from '../models/Subscription';
import {
  SubscriptionStatus,
  PaymentStatus,
  SubscriptionAction,
  IRazorpayWebhookPayload,
} from '../types/subscription.types';
import logger from '../utils/logger';
import { ApiError } from '../utils/apiError';
import database from '../config/database';

export class WebhookController {
  /**
   * Handle Razorpay webhook events
   */
  public static async handleRazorpayWebhook(req: Request, res: Response): Promise<void> {
    try {
      // 1. Get signature from headers
      const signature = req.headers['x-razorpay-signature'] as string;

      if (!signature) {
        throw ApiError.badRequest('Missing webhook signature');
      }

      // 2. Get raw body
      const payload = JSON.stringify(req.body);

      // 3. Verify signature
      const isValid = razorpayService.verifyWebhookSignature(payload, signature);

      if (!isValid) {
        logger.error('Invalid webhook signature');
        throw ApiError.unauthorized('Invalid webhook signature');
      }

      // 4. Parse event
      const event: IRazorpayWebhookPayload = req.body;

      // 5. Check if event already processed (idempotency)
      if (event.account_id) {
        const alreadyProcessed = await WebhookLogModel.isEventProcessed(event.account_id);
        if (alreadyProcessed) {
          logger.info(`Event ${event.account_id} already processed, skipping`);
          res.status(200).json({ success: true, message: 'Event already processed' });
          return;
        }
      }

      // 6. Create webhook log
      const webhookLog = await WebhookLogModel.create({
        event_id: event.account_id,
        event_type: event.event,
        entity_type: event.entity,
        entity_id: event.payload?.subscription?.entity?.id || event.payload?.payment?.entity?.id || 'unknown',
        payload: event,
      });

      // 7. Process event based on type
      try {
        await WebhookController.processWebhookEvent(event);

        // Mark as processed
        await WebhookLogModel.markAsProcessed(webhookLog.log_id);

        logger.info(`Webhook event processed successfully: ${event.event}`);
      } catch (error: any) {
        // Log error but don't fail the webhook
        logger.error('Error processing webhook:', error);
        await WebhookLogModel.markAsProcessed(webhookLog.log_id, error.message);
      }

      // 8. Return 200 OK to Razorpay
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Webhook handler error:', error);
      // Return 200 even on error to prevent Razorpay retries
      res.status(200).json({ success: false, error: 'Webhook processing failed' });
    }
  }

  /**
   * Process webhook event
   */
  private static async processWebhookEvent(event: IRazorpayWebhookPayload): Promise<void> {
    switch (event.event) {
      case 'subscription.activated':
        await this.handleSubscriptionActivated(event);
        break;

      case 'subscription.charged':
        await this.handleSubscriptionCharged(event);
        break;

      case 'subscription.completed':
        await this.handleSubscriptionCompleted(event);
        break;

      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(event);
        break;

      case 'subscription.paused':
        await this.handleSubscriptionPaused(event);
        break;

      case 'subscription.resumed':
        await this.handleSubscriptionResumed(event);
        break;

      case 'subscription.halted':
        await this.handleSubscriptionHalted(event);
        break;

      case 'payment.captured':
        await this.handlePaymentCaptured(event);
        break;

      case 'payment.failed':
        await this.handlePaymentFailed(event);
        break;

      default:
        logger.info(`Unhandled webhook event: ${event.event}`);
    }
  }

  /**
   * Handle subscription.activated
   */
  private static async handleSubscriptionActivated(event: IRazorpayWebhookPayload): Promise<void> {
    const subscriptionEntity = event.payload.subscription?.entity;
    if (!subscriptionEntity) return;

    const subscription = await ParishSubscriptionModel.findByRazorpayId(subscriptionEntity.id);
    if (!subscription) {
      logger.error(`Subscription not found for Razorpay ID: ${subscriptionEntity.id}`);
      return;
    }

    // Update subscription status
    await ParishSubscriptionModel.updateStatus(subscription.subscription_id, SubscriptionStatus.ACTIVE, {
      current_period_start: new Date(subscriptionEntity.current_start * 1000),
      current_period_end: new Date(subscriptionEntity.current_end * 1000),
      next_billing_date: new Date(subscriptionEntity.charge_at * 1000),
    });

    // Update parish plan AND subscription_status to ACTIVE
    await database.executeQuery(
      `UPDATE parishes
       SET current_plan_id = @plan_id,
           subscription_status = 'ACTIVE'
       WHERE parish_id = @parish_id`,
      {
        plan_id: subscription.plan_id,
        parish_id: subscription.parish_id,
      }
    );

    // Log history
    await SubscriptionHistoryModel.create({
      subscription_id: subscription.subscription_id,
      parish_id: subscription.parish_id,
      action: SubscriptionAction.ACTIVATED,
      new_status: SubscriptionStatus.ACTIVE,
      description: 'Subscription activated via webhook - Parish status changed to ACTIVE',
    });

    logger.info(`Subscription activated: ${subscription.subscription_id}, Parish ${subscription.parish_id} status set to ACTIVE`);
  }

  /**
   * Handle subscription.charged
   */
  private static async handleSubscriptionCharged(event: IRazorpayWebhookPayload): Promise<void> {
    const subscriptionEntity = event.payload.subscription?.entity;
    if (!subscriptionEntity) return;

    const subscription = await ParishSubscriptionModel.findByRazorpayId(subscriptionEntity.id);
    if (!subscription) return;

    // Update billing dates
    await ParishSubscriptionModel.updateStatus(subscription.subscription_id, SubscriptionStatus.ACTIVE, {
      current_period_start: new Date(subscriptionEntity.current_start * 1000),
      current_period_end: new Date(subscriptionEntity.current_end * 1000),
      next_billing_date: new Date(subscriptionEntity.charge_at * 1000),
      last_payment_date: new Date(),
    });

    logger.info(`Subscription charged: ${subscription.subscription_id}`);
  }

  /**
   * Handle payment.captured
   */
  private static async handlePaymentCaptured(event: IRazorpayWebhookPayload): Promise<void> {
    const paymentEntity = event.payload.payment?.entity;
    if (!paymentEntity) return;

    // Check if payment already recorded
    const existingPayment = await SubscriptionPaymentModel.findByRazorpayId(paymentEntity.id);
    if (existingPayment) {
      logger.info(`Payment already recorded: ${paymentEntity.id}`);
      return;
    }

    // Find subscription by subscription_id OR parish_id in notes
    const subscriptionId = paymentEntity.notes?.subscription_id;
    const parishId = paymentEntity.notes?.parish_id;

    let subscription;

    if (subscriptionId) {
      subscription = await ParishSubscriptionModel.findByRazorpayId(subscriptionId);
    } else if (parishId) {
      // Find subscription by parish_id (for payment links)
      subscription = await ParishSubscriptionModel.findByParishId(parseInt(parishId));
      logger.info(`Found subscription for parish ${parishId} via payment link`);
    }

    if (!subscription) {
      logger.warn(`No subscription found for payment ${paymentEntity.id}`);
      return;
    }

    // Create payment record
    await SubscriptionPaymentModel.create({
      subscription_id: subscription.subscription_id,
      parish_id: subscription.parish_id,
      razorpay_payment_id: paymentEntity.id,
      razorpay_order_id: paymentEntity.order_id,
      amount: paymentEntity.amount / 100, // Convert from paise
      currency: paymentEntity.currency,
      amount_paid: paymentEntity.amount / 100,
      payment_method: paymentEntity.method,
      payment_status: PaymentStatus.CAPTURED,
      paid_on: new Date(paymentEntity.created_at * 1000),
      description: `Subscription payment - ${subscription.plan_id}`,
    });

    // Update subscription total paid
    await ParishSubscriptionModel.updateTotalPaid(subscription.subscription_id, paymentEntity.amount / 100);

    // Activate parish if this is the first payment (subscription status is CREATED)
    if (subscription.subscription_status === 'created') {
      await ParishSubscriptionModel.updateStatus(subscription.subscription_id, SubscriptionStatus.ACTIVE, {
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // Update parish status to ACTIVE
      await database.executeQuery(
        `UPDATE parishes
         SET subscription_status = 'ACTIVE',
             current_plan_id = @plan_id
         WHERE parish_id = @parish_id`,
        {
          plan_id: subscription.plan_id,
          parish_id: subscription.parish_id,
        }
      );

      logger.info(`Parish ${subscription.parish_id} activated via payment link`);
    }

    // Log history
    await SubscriptionHistoryModel.create({
      subscription_id: subscription.subscription_id,
      parish_id: subscription.parish_id,
      action: SubscriptionAction.PAYMENT_SUCCEEDED,
      description: `Payment captured: ₹${paymentEntity.amount / 100}`,
    });

    logger.info(`Payment captured: ${paymentEntity.id}`);
  }

  /**
   * Handle payment.failed
   */
  private static async handlePaymentFailed(event: IRazorpayWebhookPayload): Promise<void> {
    const paymentEntity = event.payload.payment?.entity;
    if (!paymentEntity) return;

    const subscriptionId = paymentEntity.notes?.subscription_id;
    if (!subscriptionId) return;

    const subscription = await ParishSubscriptionModel.findByRazorpayId(subscriptionId);
    if (!subscription) return;

    // Increment failed count
    await ParishSubscriptionModel.incrementPaymentFailedCount(subscription.subscription_id);

    // Create payment record
    await SubscriptionPaymentModel.create({
      subscription_id: subscription.subscription_id,
      parish_id: subscription.parish_id,
      razorpay_payment_id: paymentEntity.id,
      amount: paymentEntity.amount / 100,
      currency: paymentEntity.currency,
      payment_status: PaymentStatus.FAILED,
      failure_reason: paymentEntity.error_description || 'Payment failed',
    });

    // Log history
    await SubscriptionHistoryModel.create({
      subscription_id: subscription.subscription_id,
      parish_id: subscription.parish_id,
      action: SubscriptionAction.PAYMENT_FAILED,
      description: `Payment failed: ${paymentEntity.error_description || 'Unknown error'}`,
    });

    logger.warn(`Payment failed for subscription: ${subscription.subscription_id}`);
  }

  /**
   * Handle subscription.cancelled
   */
  private static async handleSubscriptionCancelled(event: IRazorpayWebhookPayload): Promise<void> {
    const subscriptionEntity = event.payload.subscription?.entity;
    if (!subscriptionEntity) return;

    const subscription = await ParishSubscriptionModel.findByRazorpayId(subscriptionEntity.id);
    if (!subscription) return;

    await ParishSubscriptionModel.updateStatus(subscription.subscription_id, SubscriptionStatus.CANCELLED, {
      expiry_date: new Date(),
    });

    // Update parish subscription_status to CANCELLED
    await database.executeQuery(
      `UPDATE parishes
       SET current_plan_id = NULL,
           subscription_status = 'CANCELLED'
       WHERE parish_id = @parish_id`,
      { parish_id: subscription.parish_id }
    );

    await SubscriptionHistoryModel.create({
      subscription_id: subscription.subscription_id,
      parish_id: subscription.parish_id,
      action: SubscriptionAction.CANCELLED,
      new_status: SubscriptionStatus.CANCELLED,
      description: 'Subscription cancelled via webhook - Parish status changed to CANCELLED',
    });

    logger.info(`Subscription cancelled: ${subscription.subscription_id}, Parish ${subscription.parish_id} status set to CANCELLED`);
  }

  /**
   * Handle subscription.paused
   */
  private static async handleSubscriptionPaused(event: IRazorpayWebhookPayload): Promise<void> {
    const subscriptionEntity = event.payload.subscription?.entity;
    if (!subscriptionEntity) return;

    const subscription = await ParishSubscriptionModel.findByRazorpayId(subscriptionEntity.id);
    if (!subscription) return;

    await ParishSubscriptionModel.updateStatus(subscription.subscription_id, SubscriptionStatus.PAUSED);

    await SubscriptionHistoryModel.create({
      subscription_id: subscription.subscription_id,
      parish_id: subscription.parish_id,
      action: SubscriptionAction.PAUSED,
      new_status: SubscriptionStatus.PAUSED,
      description: 'Subscription paused via webhook',
    });

    logger.info(`Subscription paused: ${subscription.subscription_id}`);
  }

  /**
   * Handle subscription.resumed
   */
  private static async handleSubscriptionResumed(event: IRazorpayWebhookPayload): Promise<void> {
    const subscriptionEntity = event.payload.subscription?.entity;
    if (!subscriptionEntity) return;

    const subscription = await ParishSubscriptionModel.findByRazorpayId(subscriptionEntity.id);
    if (!subscription) return;

    await ParishSubscriptionModel.updateStatus(subscription.subscription_id, SubscriptionStatus.ACTIVE);

    await SubscriptionHistoryModel.create({
      subscription_id: subscription.subscription_id,
      parish_id: subscription.parish_id,
      action: SubscriptionAction.RESUMED,
      new_status: SubscriptionStatus.ACTIVE,
      description: 'Subscription resumed via webhook',
    });

    logger.info(`Subscription resumed: ${subscription.subscription_id}`);
  }

  /**
   * Handle subscription.halted
   */
  private static async handleSubscriptionHalted(event: IRazorpayWebhookPayload): Promise<void> {
    const subscriptionEntity = event.payload.subscription?.entity;
    if (!subscriptionEntity) return;

    const subscription = await ParishSubscriptionModel.findByRazorpayId(subscriptionEntity.id);
    if (!subscription) return;

    await ParishSubscriptionModel.updateStatus(subscription.subscription_id, SubscriptionStatus.HALTED);

    // Update parish subscription_status to SUSPENDED (halted = suspended due to payment failures)
    await database.executeQuery(
      `UPDATE parishes
       SET subscription_status = 'SUSPENDED'
       WHERE parish_id = @parish_id`,
      { parish_id: subscription.parish_id }
    );

    await SubscriptionHistoryModel.create({
      subscription_id: subscription.subscription_id,
      parish_id: subscription.parish_id,
      action: SubscriptionAction.PAYMENT_FAILED,
      new_status: SubscriptionStatus.HALTED,
      description: 'Subscription halted due to payment failures - Parish status changed to SUSPENDED',
    });

    logger.warn(`Subscription halted: ${subscription.subscription_id}, Parish ${subscription.parish_id} status set to SUSPENDED`);
  }

  /**
   * Handle subscription.completed
   */
  private static async handleSubscriptionCompleted(event: IRazorpayWebhookPayload): Promise<void> {
    const subscriptionEntity = event.payload.subscription?.entity;
    if (!subscriptionEntity) return;

    const subscription = await ParishSubscriptionModel.findByRazorpayId(subscriptionEntity.id);
    if (!subscription) return;

    await ParishSubscriptionModel.updateStatus(subscription.subscription_id, SubscriptionStatus.EXPIRED, {
      expiry_date: new Date(),
    });

    await SubscriptionHistoryModel.create({
      subscription_id: subscription.subscription_id,
      parish_id: subscription.parish_id,
      action: SubscriptionAction.EXPIRED,
      new_status: SubscriptionStatus.EXPIRED,
      description: 'Subscription completed/expired',
    });

    logger.info(`Subscription completed: ${subscription.subscription_id}`);
  }
}
