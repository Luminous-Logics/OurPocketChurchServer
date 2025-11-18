import Joi from 'joi';

export const createParishSchema = {
  body: Joi.object({
    // Parish fields
    parish_name: Joi.string().min(2).max(200).required(),
    diocese: Joi.string().max(200).optional(),
    address_line1: Joi.string().max(200).optional(),
    address_line2: Joi.string().max(200).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    country: Joi.string().max(100).optional(),
    postal_code: Joi.string().max(20).optional(),
    phone: Joi.string().max(20).optional(),
    email: Joi.string().email().optional(),
    website_url: Joi.string().uri().optional(),
    established_date: Joi.date().optional(),
    patron_saint: Joi.string().max(200).optional(),
    timezone: Joi.string().max(50).optional().default('UTC'),

    // Optional Church Admin user fields
    admin_email: Joi.string().email().optional(),
    admin_password: Joi.string().min(8).optional(),
    admin_first_name: Joi.string().min(2).max(100).optional(),
    admin_last_name: Joi.string().min(2).max(100).optional(),
    admin_phone: Joi.string().optional(),
    admin_role: Joi.string().max(100).optional(),
    admin_department: Joi.string().max(100).optional(),

    // Optional Subscription fields (if provided, subscription is created automatically)
    plan_id: Joi.number().integer().positive().optional(),
    payment_method: Joi.string().valid('online', 'cash').default('online').optional(),
    billing_cycle: Joi.string().valid('monthly', 'quarterly', 'yearly').optional(),
    billing_name: Joi.string().min(2).max(100).optional(),
    billing_email: Joi.string().email().max(100).optional(),
    billing_phone: Joi.string().pattern(/^[6-9]\d{9}$/).optional(),
    billing_address: Joi.string().max(500).optional(),
    billing_city: Joi.string().max(100).optional(),
    billing_state: Joi.string().min(2).max(100).optional(),
    billing_pincode: Joi.string().pattern(/^\d{6}$/).optional(),
    billing_country: Joi.string().valid('IN').default('IN').optional(),
  })
    .and('admin_email', 'admin_password', 'admin_first_name', 'admin_last_name') // If any admin field is provided, all required admin fields must be provided
    .and('plan_id', 'billing_cycle', 'billing_name', 'billing_email', 'billing_phone'), // If subscription fields provided, all required
};

export const updateParishSchema = {
  body: Joi.object({
    parish_name: Joi.string().min(2).max(200).optional(),
    diocese: Joi.string().max(200).optional(),
    address_line1: Joi.string().max(200).optional(),
    address_line2: Joi.string().max(200).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    country: Joi.string().max(100).optional(),
    postal_code: Joi.string().max(20).optional(),
    phone: Joi.string().max(20).optional(),
    email: Joi.string().email().optional(),
    website_url: Joi.string().uri().optional(),
    established_date: Joi.date().optional(),
    patron_saint: Joi.string().max(200).optional(),
    timezone: Joi.string().max(50).optional(),

    // Razorpay subscription fields (read-only - managed via subscription endpoints)
    // subscription_status: Updated via webhooks and subscription service
    // current_plan_id: Updated via subscription creation
    // is_subscription_managed: Should not be changed after creation

    is_active: Joi.boolean().optional(),
  }).min(1), // At least one field must be provided
};

export const parishIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

export const paginationSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};

export const searchParishSchema = {
  query: Joi.object({
    q: Joi.string().min(1).required(),
  }),
};
