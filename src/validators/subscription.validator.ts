/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from 'joi';
import { BillingCycle } from '../types/subscription.types';

/**
 * Validator for creating a subscription
 */
export const createSubscriptionSchema = Joi.object({
  parish_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Parish ID must be a number',
    'number.integer': 'Parish ID must be an integer',
    'number.positive': 'Parish ID must be positive',
    'any.required': 'Parish ID is required',
  }),

  plan_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Plan ID must be a number',
    'number.integer': 'Plan ID must be an integer',
    'number.positive': 'Plan ID must be positive',
    'any.required': 'Plan ID is required',
  }),

  payment_method: Joi.string().valid('online', 'cash').default('online').messages({
    'string.base': 'Payment method must be a string',
    'any.only': 'Payment method must be either "online" or "cash"',
  }),

  billing_cycle: Joi.string()
    .valid(...Object.values(BillingCycle))
    .required()
    .messages({
      'string.base': 'Billing cycle must be a string',
      'any.only': 'Billing cycle must be one of: monthly, quarterly, yearly',
      'any.required': 'Billing cycle is required',
    }),

  billing_name: Joi.string().min(2).max(100).required().messages({
    'string.base': 'Billing name must be a string',
    'string.min': 'Billing name must be at least 2 characters',
    'string.max': 'Billing name must not exceed 100 characters',
    'any.required': 'Billing name is required',
  }),

  billing_email: Joi.string().email().max(100).required().messages({
    'string.base': 'Billing email must be a string',
    'string.email': 'Billing email must be a valid email address',
    'string.max': 'Billing email must not exceed 100 characters',
    'any.required': 'Billing email is required',
  }),

  billing_phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.base': 'Billing phone must be a string',
      'string.pattern.base': 'Billing phone must be a valid 10-digit Indian mobile number',
      'any.required': 'Billing phone is required',
    }),

  billing_address: Joi.string().min(10).max(500).optional().messages({
    'string.base': 'Billing address must be a string',
    'string.min': 'Billing address must be at least 10 characters',
    'string.max': 'Billing address must not exceed 500 characters',
  }),

  billing_city: Joi.string().min(2).max(100).optional().messages({
    'string.base': 'Billing city must be a string',
    'string.min': 'Billing city must be at least 2 characters',
    'string.max': 'Billing city must not exceed 100 characters',
  }),

  billing_state: Joi.string().min(2).max(100).optional().messages({
    'string.base': 'Billing state must be a string',
    'string.min': 'Billing state must be at least 2 characters',
    'string.max': 'Billing state must not exceed 100 characters',
  }),

  billing_pincode: Joi.string()
    .pattern(/^\d{6}$/)
    .optional()
    .messages({
      'string.base': 'Billing pincode must be a string',
      'string.pattern.base': 'Billing pincode must be a valid 6-digit Indian pincode',
    }),

  billing_country: Joi.string().valid('IN').default('IN').messages({
    'string.base': 'Billing country must be a string',
    'any.only': 'Billing country must be IN (India)',
  }),

  coupon_code: Joi.string().max(50).optional().messages({
    'string.base': 'Coupon code must be a string',
    'string.max': 'Coupon code must not exceed 50 characters',
  }),

  notes: Joi.object().optional().messages({
    'object.base': 'Notes must be an object',
  }),
});

/**
 * Validator for cancellation request
 */
export const cancelSubscriptionSchema = Joi.object({
  cancel_at_cycle_end: Joi.boolean().default(false).messages({
    'boolean.base': 'cancel_at_cycle_end must be a boolean',
  }),

  cancellation_reason: Joi.string().min(10).max(500).required().messages({
    'string.base': 'Cancellation reason must be a string',
    'string.min': 'Cancellation reason must be at least 10 characters',
    'string.max': 'Cancellation reason must not exceed 500 characters',
    'any.required': 'Cancellation reason is required',
  }),
});

/**
 * Validator for pause/resume requests
 */
export const pauseSubscriptionSchema = Joi.object({
  resume_at: Joi.date().greater('now').optional().messages({
    'date.base': 'Resume date must be a valid date',
    'date.greater': 'Resume date must be in the future',
  }),

  reason: Joi.string().min(10).max(500).optional().messages({
    'string.base': 'Reason must be a string',
    'string.min': 'Reason must be at least 10 characters',
    'string.max': 'Reason must not exceed 500 characters',
  }),
});

/**
 * Validator for updating billing details
 */
export const updateBillingDetailsSchema = Joi.object({
  billing_name: Joi.string().min(2).max(100).optional().messages({
    'string.base': 'Billing name must be a string',
    'string.min': 'Billing name must be at least 2 characters',
    'string.max': 'Billing name must not exceed 100 characters',
  }),

  billing_email: Joi.string().email().max(100).optional().messages({
    'string.base': 'Billing email must be a string',
    'string.email': 'Billing email must be a valid email address',
    'string.max': 'Billing email must not exceed 100 characters',
  }),

  billing_phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional()
    .messages({
      'string.base': 'Billing phone must be a string',
      'string.pattern.base': 'Billing phone must be a valid 10-digit Indian mobile number',
    }),

  billing_address: Joi.string().min(10).max(500).optional().messages({
    'string.base': 'Billing address must be a string',
    'string.min': 'Billing address must be at least 10 characters',
    'string.max': 'Billing address must not exceed 500 characters',
  }),

  billing_city: Joi.string().min(2).max(100).optional().messages({
    'string.base': 'Billing city must be a string',
    'string.min': 'Billing city must be at least 2 characters',
    'string.max': 'Billing city must not exceed 100 characters',
  }),

  billing_state: Joi.string().min(2).max(100).optional().messages({
    'string.base': 'Billing state must be a string',
    'string.min': 'Billing state must be at least 2 characters',
    'string.max': 'Billing state must not exceed 100 characters',
  }),

  billing_pincode: Joi.string()
    .pattern(/^\d{6}$/)
    .optional()
    .messages({
      'string.base': 'Billing pincode must be a string',
      'string.pattern.base': 'Billing pincode must be a valid 6-digit Indian pincode',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Validator for plan query parameters
 */
export const getPlanQuerySchema = Joi.object({
  billing_cycle: Joi.string()
    .valid(...Object.values(BillingCycle))
    .optional()
    .messages({
      'string.base': 'Billing cycle must be a string',
      'any.only': 'Billing cycle must be one of: monthly, quarterly, yearly',
    }),

  is_active: Joi.boolean().optional().messages({
    'boolean.base': 'is_active must be a boolean',
  }),

  is_public: Joi.boolean().optional().messages({
    'boolean.base': 'is_public must be a boolean',
  }),
});

/**
 * Validator for payment history query parameters
 */
export const getPaymentHistoryQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 100',
  }),

  offset: Joi.number().integer().min(0).default(0).messages({
    'number.base': 'Offset must be a number',
    'number.integer': 'Offset must be an integer',
    'number.min': 'Offset must be at least 0',
  }),

  status: Joi.string().optional().messages({
    'string.base': 'Status must be a string',
  }),
});

/**
 * Validator for feature limit check
 */
export const checkFeatureLimitSchema = Joi.object({
  feature: Joi.string()
    .valid('max_parishioners', 'max_families', 'max_storage_mb', 'max_admins')
    .required()
    .messages({
      'string.base': 'Feature must be a string',
      'any.only': 'Feature must be one of: max_parishioners, max_families, max_storage_mb, max_admins',
      'any.required': 'Feature is required',
    }),
});

/**
 * Middleware to validate request body against a schema
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errorMessage,
        fields: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Middleware to validate query parameters against a schema
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errorMessage,
        fields: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }

    req.query = value;
    next();
  };
};

/**
 * Middleware to validate route parameters against a schema
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errorMessage,
        fields: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }

    req.params = value;
    next();
  };
};
