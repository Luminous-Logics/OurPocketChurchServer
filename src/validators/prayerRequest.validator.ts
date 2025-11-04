import Joi from 'joi';

export const createPrayerRequestSchema = {
  body: Joi.object({
    parish_id: Joi.number().integer().positive().required(),
    requested_by: Joi.number().integer().positive().optional(),
    requester_name: Joi.string().min(1).max(255).required(),
    subject: Joi.string().min(1).max(255).required(),
    description: Joi.string().min(1).required(),
    booking_date: Joi.date().min('now').optional().allow(null), // Optional - only if "Book a prayer slot" is checked
    booking_time: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional()
      .allow(null)
      .messages({
        'string.pattern.base': 'Time must be in HH:MM format (e.g., 09:30, 14:00)',
      }),
    is_anonymous: Joi.boolean().optional().default(false),
    is_urgent: Joi.boolean().optional().default(false),
    is_public: Joi.boolean().optional().default(true),
  }),
};

export const parishIdSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
};

export const updatePrayerRequestSchema = {
  body: Joi.object({
    requester_name: Joi.string().min(1).max(255).optional(),
    subject: Joi.string().min(1).max(255).optional(),
    description: Joi.string().min(1).optional(),
    booking_date: Joi.date().optional(),
    booking_time: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional()
      .messages({
        'string.pattern.base': 'Time must be in HH:MM format (e.g., 09:30, 14:00)',
      }),
    is_anonymous: Joi.boolean().optional(),
    is_urgent: Joi.boolean().optional(),
    is_public: Joi.boolean().optional(),
  }).min(1), // At least one field must be provided
};

export const updateStatusSchema = {
  body: Joi.object({
    status: Joi.string()
      .valid('pending', 'confirmed', 'completed', 'cancelled')
      .required(),
    approved_by: Joi.number().integer().positive().optional(),
    notes: Joi.string().optional(),
  }),
};

export const prayerRequestIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

export const prayerRequestsByParishSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};

export const prayerRequestsByStatusSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    status: Joi.string()
      .valid('pending', 'confirmed', 'completed', 'cancelled')
      .required(),
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};

export const prayerRequestsByDateSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    date: Joi.date().required(),
  }),
};

export const prayerRequestsByDateRangeSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).required(),
  }),
};

export const prayerRequestsByParishionerSchema = {
  params: Joi.object({
    parishionerId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};

export const searchPrayerRequestSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    q: Joi.string().min(1).required(),
  }),
};

export const checkSlotAvailabilitySchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    date: Joi.date().required(),
    time: Joi.string()
      .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required()
      .messages({
        'string.pattern.base': 'Time must be in HH:MM format (e.g., 09:30, 14:00)',
      }),
  }),
};

export const getUpcomingSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    limit: Joi.number().integer().min(1).max(50).optional().default(10),
  }),
};

export const getStatsSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
};
