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
    subscription_plan: Joi.string().max(50).optional(),
    subscription_expiry: Joi.date().optional(),
    // Optional Church Admin user fields
    admin_email: Joi.string().email().optional(),
    admin_password: Joi.string().min(8).optional(),
    admin_first_name: Joi.string().min(2).max(100).optional(),
    admin_last_name: Joi.string().min(2).max(100).optional(),
    admin_phone: Joi.string().optional(),
    admin_role: Joi.string().max(100).optional(),
    admin_department: Joi.string().max(100).optional(),
  }).and('admin_email', 'admin_password', 'admin_first_name', 'admin_last_name'), // If any admin field is provided, all required admin fields must be provided
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
    subscription_plan: Joi.string().max(50).optional(),
    subscription_expiry: Joi.date().optional(),
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
