/* eslint-disable @typescript-eslint/no-explicit-any */
import database from '../config/database';
import {
  ISubscriptionPlan,
  IParishSubscription,
  ISubscriptionPayment,
  IRazorpayWebhookLog,
  ISubscriptionHistory,
  SubscriptionStatus,
  PaymentStatus,
  SubscriptionAction,
} from '../types/subscription.types';
import { ApiError } from '../utils/apiError';

// =====================================================
// SUBSCRIPTION PLAN MODEL
// =====================================================

export class SubscriptionPlanModel {
  /**
   * Get all active subscription plans
   */
  public static async findAll(): Promise<ISubscriptionPlan[]> {
    const result = await database.executeQuery<ISubscriptionPlan>(
      `SELECT * FROM subscription_plans
       WHERE is_active = TRUE
       ORDER BY display_order ASC, amount ASC`
    );

    return result.rows;
  }

  /**
   * Find plan by ID
   */
  public static async findById(planId: number): Promise<ISubscriptionPlan | null> {
    const result = await database.executeQuery<ISubscriptionPlan>(
      `SELECT * FROM subscription_plans WHERE plan_id = $1`,
      [planId]
    );

    return result.rows[0] || null;
  }

  /**
   * Find plan by code
   */
  public static async findByCode(planCode: string): Promise<ISubscriptionPlan | null> {
    const result = await database.executeQuery<ISubscriptionPlan>(
      `SELECT * FROM subscription_plans WHERE plan_code = $1`,
      [planCode]
    );

    return result.rows[0] || null;
  }

  /**
   * Find plan by Razorpay plan ID
   */
  public static async findByRazorpayId(razorpayPlanId: string): Promise<ISubscriptionPlan | null> {
    const result = await database.executeQuery<ISubscriptionPlan>(
      `SELECT * FROM subscription_plans WHERE razorpay_plan_id = $1`,
      [razorpayPlanId]
    );

    return result.rows[0] || null;
  }

  /**
   * Update Razorpay plan ID
   */
  public static async updateRazorpayPlanId(planId: number, razorpayPlanId: string): Promise<void> {
    await database.executeQuery(
      `UPDATE subscription_plans SET razorpay_plan_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE plan_id = $2`,
      [razorpayPlanId, planId]
    );
  }
}

// =====================================================
// PARISH SUBSCRIPTION MODEL
// =====================================================

export class ParishSubscriptionModel {
  /**
   * Create new subscription
   */
  public static async create(data: {
    parish_id: number;
    plan_id: number;
    payment_method?: string;
    razorpay_subscription_id?: string;
    razorpay_customer_id?: string;
    billing_contact_user_id?: number;
    billing_email?: string;
    billing_phone?: string;
    billing_address_line1?: string;
    billing_address_line2?: string;
    billing_city?: string;
    billing_state?: string;
    billing_country?: string;
    billing_postal_code?: string;
    tax_identification_number?: string;
    company_name?: string;
    subscription_status?: SubscriptionStatus;
    start_date: Date;
    trial_start_date?: Date;
    trial_end_date?: Date;
  }): Promise<IParishSubscription> {
    const result = await database.executeQuery<{ subscription_id: number }>(
      `INSERT INTO parish_subscriptions (
        parish_id, plan_id, payment_method, razorpay_subscription_id, razorpay_customer_id,
        billing_contact_user_id, billing_email, billing_phone,
        billing_address_line1, billing_address_line2, billing_city, billing_state,
        billing_country, billing_postal_code, tax_identification_number, company_name,
        subscription_status, start_date, trial_start_date, trial_end_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING subscription_id`,
      [
        data.parish_id,
        data.plan_id,
        data.payment_method || 'online',
        data.razorpay_subscription_id || null,
        data.razorpay_customer_id || null,
        data.billing_contact_user_id || null,
        data.billing_email || null,
        data.billing_phone || null,
        data.billing_address_line1 || null,
        data.billing_address_line2 || null,
        data.billing_city || null,
        data.billing_state || null,
        data.billing_country || 'India',
        data.billing_postal_code || null,
        data.tax_identification_number || null,
        data.company_name || null,
        data.subscription_status || SubscriptionStatus.PENDING,
        data.start_date,
        data.trial_start_date || null,
        data.trial_end_date || null,
      ]
    );

    const subscriptionId = result.rows[0].subscription_id;
    const subscription = await this.findById(subscriptionId);

    if (!subscription) {
      throw ApiError.internal('Failed to create subscription');
    }

    return subscription;
  }

  /**
   * Find subscription by ID
   */
  public static async findById(subscriptionId: number): Promise<IParishSubscription | null> {
    const result = await database.executeQuery<IParishSubscription>(
      `SELECT * FROM parish_subscriptions WHERE subscription_id = $1`,
      [subscriptionId]
    );

    return result.rows[0] || null;
  }

  /**
   * Find subscription by parish ID
   */
  public static async findByParishId(parishId: number): Promise<IParishSubscription | null> {
    const result = await database.executeQuery<IParishSubscription>(
      `SELECT * FROM parish_subscriptions WHERE parish_id = $1`,
      [parishId]
    );

    return result.rows[0] || null;
  }

  /**
   * Find subscription by Razorpay subscription ID
   */
  public static async findByRazorpayId(razorpaySubscriptionId: string): Promise<IParishSubscription | null> {
    const result = await database.executeQuery<IParishSubscription>(
      `SELECT * FROM parish_subscriptions WHERE razorpay_subscription_id = $1`,
      [razorpaySubscriptionId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get active subscription for parish
   */
  public static async getActiveSubscription(parishId: number): Promise<any | null> {
    const result = await database.executeQuery(
      `SELECT * FROM get_active_subscription($1)`,
      [parishId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get subscription with plan details
   */
  public static async getSubscriptionWithPlan(parishId: number): Promise<any | null> {
    const result = await database.executeQuery(
      `SELECT
        ps.*,
        sp.plan_name,
        sp.plan_code,
        sp.amount,
        sp.billing_cycle,
        sp.features,
        sp.max_parishioners,
        sp.max_families,
        sp.max_wards,
        sp.max_users,
        sp.max_storage_gb
      FROM parish_subscriptions ps
      JOIN subscription_plans sp ON ps.plan_id = sp.plan_id
      WHERE ps.parish_id = $1`,
      [parishId]
    );

    return result.rows[0] || null;
  }

  /**
   * Update subscription status
   */
  public static async updateStatus(
    subscriptionId: number,
    status: SubscriptionStatus,
    additionalData?: {
      current_period_start?: Date;
      current_period_end?: Date;
      next_billing_date?: Date;
      last_payment_date?: Date;
      expiry_date?: Date;
    }
  ): Promise<void> {
    const updateFields = ['subscription_status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [status, subscriptionId];
    let paramIndex = 2;

    if (additionalData) {
      if (additionalData.current_period_start) {
        updateFields.push(`current_period_start = $${++paramIndex}`);
        params.splice(paramIndex - 1, 0, additionalData.current_period_start);
      }
      if (additionalData.current_period_end) {
        updateFields.push(`current_period_end = $${++paramIndex}`);
        params.splice(paramIndex - 1, 0, additionalData.current_period_end);
      }
      if (additionalData.next_billing_date) {
        updateFields.push(`next_billing_date = $${++paramIndex}`);
        params.splice(paramIndex - 1, 0, additionalData.next_billing_date);
      }
      if (additionalData.last_payment_date) {
        updateFields.push(`last_payment_date = $${++paramIndex}`);
        params.splice(paramIndex - 1, 0, additionalData.last_payment_date);
      }
      if (additionalData.expiry_date) {
        updateFields.push(`expiry_date = $${++paramIndex}`);
        params.splice(paramIndex - 1, 0, additionalData.expiry_date);
      }
    }

    await database.executeQuery(
      `UPDATE parish_subscriptions
       SET ${updateFields.join(', ')}
       WHERE subscription_id = $2`,
      params
    );
  }

  /**
   * Cancel subscription
   */
  public static async cancel(
    subscriptionId: number,
    userId: number,
    reason: string
  ): Promise<void> {
    await database.executeQuery(
      `UPDATE parish_subscriptions
       SET subscription_status = $1,
           cancellation_date = CURRENT_TIMESTAMP,
           cancellation_reason = $2,
           cancelled_by = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE subscription_id = $4`,
      [SubscriptionStatus.CANCELLED, reason, userId, subscriptionId]
    );
  }

  /**
   * Update Razorpay subscription ID
   */
  public static async updateRazorpayId(subscriptionId: number, razorpaySubscriptionId: string): Promise<void> {
    await database.executeQuery(
      `UPDATE parish_subscriptions
       SET razorpay_subscription_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE subscription_id = $2`,
      [razorpaySubscriptionId, subscriptionId]
    );
  }

  /**
   * Increment payment failed count
   */
  public static async incrementPaymentFailedCount(subscriptionId: number): Promise<void> {
    await database.executeQuery(
      `UPDATE parish_subscriptions
       SET payment_failed_count = payment_failed_count + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE subscription_id = $1`,
      [subscriptionId]
    );
  }

  /**
   * Update total paid amount
   */
  public static async updateTotalPaid(subscriptionId: number, amount: number): Promise<void> {
    await database.executeQuery(
      `UPDATE parish_subscriptions
       SET total_paid = total_paid + $1,
           total_invoices = total_invoices + 1,
           payment_failed_count = 0,
           updated_at = CURRENT_TIMESTAMP
       WHERE subscription_id = $2`,
      [amount, subscriptionId]
    );
  }

  /**
   * Update billing details
   */
  public static async updateBillingDetails(
    subscriptionId: number,
    data: {
      billing_email?: string;
      billing_phone?: string;
      billing_address_line1?: string;
      billing_address_line2?: string;
      billing_city?: string;
      billing_state?: string;
      billing_country?: string;
      billing_postal_code?: string;
      tax_identification_number?: string;
      company_name?: string;
    }
  ): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (data.billing_email !== undefined) {
      updates.push(`billing_email = $${paramCounter++}`);
      values.push(data.billing_email);
    }
    if (data.billing_phone !== undefined) {
      updates.push(`billing_phone = $${paramCounter++}`);
      values.push(data.billing_phone);
    }
    if (data.billing_address_line1 !== undefined) {
      updates.push(`billing_address_line1 = $${paramCounter++}`);
      values.push(data.billing_address_line1);
    }
    if (data.billing_address_line2 !== undefined) {
      updates.push(`billing_address_line2 = $${paramCounter++}`);
      values.push(data.billing_address_line2);
    }
    if (data.billing_city !== undefined) {
      updates.push(`billing_city = $${paramCounter++}`);
      values.push(data.billing_city);
    }
    if (data.billing_state !== undefined) {
      updates.push(`billing_state = $${paramCounter++}`);
      values.push(data.billing_state);
    }
    if (data.billing_country !== undefined) {
      updates.push(`billing_country = $${paramCounter++}`);
      values.push(data.billing_country);
    }
    if (data.billing_postal_code !== undefined) {
      updates.push(`billing_postal_code = $${paramCounter++}`);
      values.push(data.billing_postal_code);
    }
    if (data.tax_identification_number !== undefined) {
      updates.push(`tax_identification_number = $${paramCounter++}`);
      values.push(data.tax_identification_number);
    }
    if (data.company_name !== undefined) {
      updates.push(`company_name = $${paramCounter++}`);
      values.push(data.company_name);
    }

    if (updates.length === 0) {
      return; // Nothing to update
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(subscriptionId);

    const query = `
      UPDATE parish_subscriptions
      SET ${updates.join(', ')}
      WHERE subscription_id = $${paramCounter}
    `;

    await database.executeQuery(query, values);
  }
}

// =====================================================
// SUBSCRIPTION PAYMENT MODEL
// =====================================================

export class SubscriptionPaymentModel {
  /**
   * Create payment record
   */
  public static async create(data: {
    subscription_id: number;
    parish_id: number;
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_invoice_id?: string;
    amount: number;
    currency?: string;
    amount_paid?: number;
    amount_due?: number;
    tax_amount?: number;
    payment_method?: string;
    payment_status: PaymentStatus;
    invoice_number?: string;
    receipt_number?: string;
    invoice_date?: Date;
    due_date?: Date;
    paid_on?: Date;
    description?: string;
    notes?: string;
    failure_reason?: string;
  }): Promise<ISubscriptionPayment> {
    const result = await database.executeQuery<{ payment_id: number }>(
      `INSERT INTO subscription_payments (
        subscription_id, parish_id, razorpay_payment_id, razorpay_order_id,
        razorpay_invoice_id, amount, currency, amount_paid, amount_due, tax_amount,
        payment_method, payment_status, invoice_number, receipt_number,
        invoice_date, due_date, paid_on, description, notes, failure_reason
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING payment_id`,
      [
        data.subscription_id,
        data.parish_id,
        data.razorpay_payment_id || null,
        data.razorpay_order_id || null,
        data.razorpay_invoice_id || null,
        data.amount,
        data.currency || 'INR',
        data.amount_paid || null,
        data.amount_due || null,
        data.tax_amount || null,
        data.payment_method || null,
        data.payment_status,
        data.invoice_number || null,
        data.receipt_number || null,
        data.invoice_date || null,
        data.due_date || null,
        data.paid_on || null,
        data.description || null,
        data.notes || null,
        data.failure_reason || null,
      ]
    );

    const paymentId = result.rows[0].payment_id;
    const payment = await this.findById(paymentId);

    if (!payment) {
      throw ApiError.internal('Failed to create payment');
    }

    return payment;
  }

  /**
   * Find payment by ID
   */
  public static async findById(paymentId: number): Promise<ISubscriptionPayment | null> {
    const result = await database.executeQuery<ISubscriptionPayment>(
      `SELECT * FROM subscription_payments WHERE payment_id = $1`,
      [paymentId]
    );

    return result.rows[0] || null;
  }

  /**
   * Find payment by Razorpay payment ID
   */
  public static async findByRazorpayId(razorpayPaymentId: string): Promise<ISubscriptionPayment | null> {
    const result = await database.executeQuery<ISubscriptionPayment>(
      `SELECT * FROM subscription_payments WHERE razorpay_payment_id = $1`,
      [razorpayPaymentId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get payments by subscription ID
   */
  public static async findBySubscriptionId(subscriptionId: number): Promise<ISubscriptionPayment[]> {
    const result = await database.executeQuery<ISubscriptionPayment>(
      `SELECT * FROM subscription_payments
       WHERE subscription_id = $1
       ORDER BY created_at DESC`,
      [subscriptionId]
    );

    return result.rows;
  }

  /**
   * Get payments by parish ID
   */
  public static async findByParishId(parishId: number, limit: number = 50): Promise<ISubscriptionPayment[]> {
    const result = await database.executeQuery<ISubscriptionPayment>(
      `SELECT * FROM subscription_payments
       WHERE parish_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [parishId, limit]
    );

    return result.rows;
  }

  /**
   * Update payment status
   */
  public static async updateStatus(
    paymentId: number,
    status: PaymentStatus,
    paidOn?: Date,
    failureReason?: string
  ): Promise<void> {
    await database.executeQuery(
      `UPDATE subscription_payments
       SET payment_status = $1,
           paid_on = $2,
           failure_reason = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE payment_id = $4`,
      [status, paidOn || null, failureReason || null, paymentId]
    );
  }
}

// =====================================================
// WEBHOOK LOG MODEL
// =====================================================

export class WebhookLogModel {
  /**
   * Create webhook log
   */
  public static async create(data: {
    event_id?: string;
    event_type: string;
    entity_type: string;
    entity_id: string;
    payload: object;
    parish_id?: number;
    subscription_id?: number;
    payment_id?: number;
  }): Promise<IRazorpayWebhookLog> {
    const result = await database.executeQuery<{ log_id: number }>(
      `INSERT INTO razorpay_webhook_logs (
        event_id, event_type, entity_type, entity_id, payload,
        parish_id, subscription_id, payment_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING log_id`,
      [
        data.event_id || null,
        data.event_type,
        data.entity_type,
        data.entity_id,
        JSON.stringify(data.payload),
        data.parish_id || null,
        data.subscription_id || null,
        data.payment_id || null,
      ]
    );

    const logId = result.rows[0].log_id;
    const log = await this.findById(logId);

    if (!log) {
      throw ApiError.internal('Failed to create webhook log');
    }

    return log;
  }

  /**
   * Find webhook log by ID
   */
  public static async findById(logId: number): Promise<IRazorpayWebhookLog | null> {
    const result = await database.executeQuery<IRazorpayWebhookLog>(
      `SELECT * FROM razorpay_webhook_logs WHERE log_id = $1`,
      [logId]
    );

    return result.rows[0] || null;
  }

  /**
   * Check if event already processed
   */
  public static async isEventProcessed(eventId: string): Promise<boolean> {
    const result = await database.executeQuery<{ count: number }>(
      `SELECT COUNT(*) as count FROM razorpay_webhook_logs
       WHERE event_id = $1 AND processed = TRUE`,
      [eventId]
    );

    return result.rows[0].count > 0;
  }

  /**
   * Mark as processed
   */
  public static async markAsProcessed(logId: number, error?: string): Promise<void> {
    await database.executeQuery(
      `UPDATE razorpay_webhook_logs
       SET processed = $1,
           processing_error = $2,
           processed_at = CURRENT_TIMESTAMP
       WHERE log_id = $3`,
      [error ? false : true, error || null, logId]
    );
  }
}

// =====================================================
// SUBSCRIPTION HISTORY MODEL
// =====================================================

export class SubscriptionHistoryModel {
  /**
   * Create history record
   */
  public static async create(data: {
    subscription_id: number;
    parish_id: number;
    action: SubscriptionAction;
    old_status?: string;
    new_status?: string;
    old_plan_id?: number;
    new_plan_id?: number;
    description?: string;
    metadata?: object;
    performed_by?: number;
  }): Promise<void> {
    await database.executeQuery(
      `INSERT INTO subscription_history (
        subscription_id, parish_id, action, old_status, new_status,
        old_plan_id, new_plan_id, description, metadata, performed_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        data.subscription_id,
        data.parish_id,
        data.action,
        data.old_status || null,
        data.new_status || null,
        data.old_plan_id || null,
        data.new_plan_id || null,
        data.description || null,
        data.metadata ? JSON.stringify(data.metadata) : null,
        data.performed_by || null,
      ]
    );
  }

  /**
   * Get history by subscription ID
   */
  public static async findBySubscriptionId(subscriptionId: number): Promise<ISubscriptionHistory[]> {
    const result = await database.executeQuery<ISubscriptionHistory>(
      `SELECT * FROM subscription_history
       WHERE subscription_id = $1
       ORDER BY performed_at DESC`,
      [subscriptionId]
    );

    return result.rows;
  }
}
