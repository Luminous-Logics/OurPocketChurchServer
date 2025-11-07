/* eslint-disable @typescript-eslint/no-explicit-any */
// Razorpay Subscription Types
// Created: 2025-01-04

export enum SubscriptionStatus {
  CREATED = 'created',
  AUTHENTICATED = 'authenticated',
  ACTIVE = 'active',
  PAUSED = 'paused',
  HALTED = 'halted',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

export enum PaymentStatus {
  CREATED = 'created',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PENDING = 'pending',
}

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  QUARTERLY = 'quarterly',
}

export enum PlanTier {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

export enum PaymentMethod {
  ONLINE = 'online',
  CASH = 'cash',
}

export enum SubscriptionAction {
  CREATED = 'created',
  ACTIVATED = 'activated',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PLAN_CHANGED = 'plan_changed',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_SUCCEEDED = 'payment_succeeded',
}

// Subscription Plan
export interface ISubscriptionPlan {
  plan_id: number;
  plan_name: string;
  plan_code: string;
  tier: PlanTier;
  razorpay_plan_id?: string;
  description?: string;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle;
  features?: string | object; // JSON array of features
  max_parishioners: number;
  max_families: number;
  max_wards?: number;
  max_admins: number;
  max_users?: number;
  max_storage_gb: number;
  trial_period_days: number;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

// Parish Subscription
export interface IParishSubscription {
  subscription_id: number;
  parish_id: number;
  plan_id: number;
  payment_method: PaymentMethod;
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
  subscription_status: SubscriptionStatus;
  start_date: Date;
  trial_start_date?: Date;
  trial_end_date?: Date;
  current_period_start?: Date;
  current_period_end?: Date;
  next_billing_date?: Date;
  last_payment_date?: Date;
  cancellation_date?: Date;
  expiry_date?: Date;
  cancellation_reason?: string;
  cancelled_by?: number;
  auto_renewal: boolean;
  payment_failed_count: number;
  total_paid: number;
  total_invoices: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Subscription Payment
export interface ISubscriptionPayment {
  payment_id: number;
  subscription_id: number;
  parish_id: number;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_invoice_id?: string;
  amount: number;
  currency: string;
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
  refund_amount?: number;
  refund_date?: Date;
  refund_reason?: string;
  created_at: Date;
  updated_at: Date;
}

// Razorpay Webhook Log
export interface IRazorpayWebhookLog {
  log_id: number;
  event_id?: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  payload: object;
  processed: boolean;
  processing_error?: string;
  retry_count: number;
  parish_id?: number;
  subscription_id?: number;
  payment_id?: number;
  created_at: Date;
  processed_at?: Date;
}

// Subscription History
export interface ISubscriptionHistory {
  history_id: number;
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
  performed_at: Date;
}

// DTOs for API requests/responses
export interface ICreateSubscriptionDTO {
  parish_id: number;
  plan_id: number;
  payment_method?: PaymentMethod;
  billing_cycle?: string;
  billing_name?: string;
  billing_email: string;
  billing_phone?: string;
  billing_address?: string | {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  billing_city?: string;
  billing_state?: string;
  billing_pincode?: string;
  billing_country?: string;
  tax_identification_number?: string;
  company_name?: string;
}

export interface IUpdateSubscriptionDTO {
  plan_id?: number;
  billing_email?: string;
  billing_phone?: string;
  billing_address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
  };
  auto_renewal?: boolean;
  notes?: string;
}

export interface ICancelSubscriptionDTO {
  cancellation_reason: string;
  cancel_at_cycle_end?: boolean;
}

export interface ISubscriptionWithPlan extends IParishSubscription {
  plan: ISubscriptionPlan;
}

export interface IPaymentWithSubscription extends ISubscriptionPayment {
  subscription: IParishSubscription;
}

// Razorpay webhook event types
export type RazorpayWebhookEvent =
  | 'subscription.activated'
  | 'subscription.charged'
  | 'subscription.completed'
  | 'subscription.updated'
  | 'subscription.pending'
  | 'subscription.halted'
  | 'subscription.cancelled'
  | 'subscription.paused'
  | 'subscription.resumed'
  | 'payment.authorized'
  | 'payment.captured'
  | 'payment.failed'
  | 'invoice.paid'
  | 'invoice.partially_paid'
  | 'invoice.expired';

export interface IRazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: RazorpayWebhookEvent;
  contains: string[];
  payload: {
    subscription?: {
      entity: any;
    };
    payment?: {
      entity: any;
    };
    invoice?: {
      entity: any;
    };
  };
  created_at: number;
}

// Feature limits for checking subscription
export interface IFeatureLimits {
  max_parishioners?: number;
  max_families?: number;
  max_wards?: number;
  max_users?: number;
  max_storage_gb?: number;
}

export interface ISubscriptionUsage {
  current_parishioners: number;
  current_families: number;
  current_wards: number;
  current_users: number;
  current_storage_gb: number;
}

export interface IFeatureAccess {
  can_add_parishioner: boolean;
  can_add_family: boolean;
  can_add_ward: boolean;
  can_add_user: boolean;
  can_upload_file: boolean;
  remaining_parishioners?: number;
  remaining_families?: number;
  remaining_wards?: number;
  remaining_users?: number;
  remaining_storage_gb?: number;
}
