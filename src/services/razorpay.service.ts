import Razorpay from 'razorpay';
import crypto from 'crypto';
import logger from '../utils/logger';
import { ApiError } from '../utils/apiError';

class RazorpayService {
  private razorpay: Razorpay;
  private webhookSecret: string;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    this.webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    logger.info('Razorpay service initialized');
  }

  /**
   * Create Razorpay customer
   */
  async createCustomer(data: {
    name: string;
    email: string;
    contact?: string;
    notes?: object;
  }) {
    try {
      const customer = await this.razorpay.customers.create({
        name: data.name,
        email: data.email,
        contact: data.contact || '',
        notes: (data.notes as any) || {},
      });

      logger.info(`Razorpay customer created: ${(customer as any).id}`);
      return customer;
    } catch (error: any) {
      logger.error('Error creating Razorpay customer:', error);
      throw ApiError.internal(`Razorpay error: ${error.error?.description || error.message}`);
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(data: {
    plan_id: string;
    customer_id: string;
    quantity?: number;
    total_count?: number;
    start_at?: number;
    expire_by?: number;
    customer_notify?: 0 | 1;
    notes?: object;
  }) {
    try {
      const subscriptionData: any = {
        plan_id: data.plan_id,
        customer_id: data.customer_id,
        quantity: data.quantity || 1,
        customer_notify: data.customer_notify !== undefined ? data.customer_notify : 1,
        notes: data.notes || {},
      };

      // Only include optional fields if they are defined
      if (data.total_count !== undefined) {
        subscriptionData.total_count = data.total_count;
      }
      if (data.start_at !== undefined) {
        subscriptionData.start_at = data.start_at;
      }
      if (data.expire_by !== undefined) {
        subscriptionData.expire_by = data.expire_by;
      }

      const subscription = await this.razorpay.subscriptions.create(subscriptionData);

      logger.info(`Razorpay subscription created: ${(subscription as any).id}`);
      return subscription;
    } catch (error: any) {
      logger.error('Error creating Razorpay subscription:', error);
      throw ApiError.internal(`Razorpay error: ${error.error?.description || error.message}`);
    }
  }

  /**
   * Fetch subscription details
   */
  async fetchSubscription(subscriptionId: string) {
    try {
      const subscription = await this.razorpay.subscriptions.fetch(subscriptionId);
      return subscription;
    } catch (error: any) {
      logger.error('Error fetching Razorpay subscription:', error);
      throw ApiError.internal(`Razorpay error: ${error.error?.description || error.message}`);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = false) {
    try {
      const subscription = await this.razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
      logger.info(`Razorpay subscription cancelled: ${subscriptionId}`);
      return subscription;
    } catch (error: any) {
      logger.error('Error cancelling Razorpay subscription:', error);
      throw ApiError.internal(`Razorpay error: ${error.error?.description || error.message}`);
    }
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(subscriptionId: string) {
    try {
      const subscription = await this.razorpay.subscriptions.pause(subscriptionId);
      logger.info(`Razorpay subscription paused: ${subscriptionId}`);
      return subscription;
    } catch (error: any) {
      logger.error('Error pausing Razorpay subscription:', error);
      throw ApiError.internal(`Razorpay error: ${error.error?.description || error.message}`);
    }
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId: string) {
    try {
      const subscription = await this.razorpay.subscriptions.resume(subscriptionId);
      logger.info(`Razorpay subscription resumed: ${subscriptionId}`);
      return subscription;
    } catch (error: any) {
      logger.error('Error resuming Razorpay subscription:', error);
      throw ApiError.internal(`Razorpay error: ${error.error?.description || error.message}`);
    }
  }

  /**
   * Fetch payment details
   */
  async fetchPayment(paymentId: string) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      return payment;
    } catch (error: any) {
      logger.error('Error fetching Razorpay payment:', error);
      throw ApiError.internal(`Razorpay error: ${error.error?.description || error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Verify payment signature from Razorpay Standard Checkout
   * Used when frontend completes payment and sends signature for verification
   */
  async verifyPaymentSignature(
    razorpayPaymentId: string,
    razorpaySubscriptionId: string,
    razorpaySignature: string
  ): Promise<boolean> {
    try {
      // Create the signature string: payment_id|subscription_id
      const text = `${razorpayPaymentId}|${razorpaySubscriptionId}`;

      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(text)
        .digest('hex');

      const isValid = expectedSignature === razorpaySignature;

      logger.info('Payment signature verification', {
        razorpayPaymentId,
        razorpaySubscriptionId,
        isValid,
      });

      return isValid;
    } catch (error) {
      logger.error('Error verifying payment signature:', error);
      return false;
    }
  }

  /**
   * Create Razorpay plan (one-time setup)
   */
  async createPlan(data: {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    item: {
      name: string;
      amount: number;
      currency: string;
      description?: string;
    };
    notes?: object;
  }) {
    try {
      const plan = await this.razorpay.plans.create(data as any);
      logger.info(`Razorpay plan created: ${(plan as any).id}`);
      return plan;
    } catch (error: any) {
      logger.error('Error creating Razorpay plan:', error);
      throw ApiError.internal(`Razorpay error: ${error.error?.description || error.message}`);
    }
  }
}

export default new RazorpayService();
