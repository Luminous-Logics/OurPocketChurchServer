import Joi from 'joi';

export const createCertificateTypeSchema = {
  body: Joi.object({
    parish_id: Joi.number().integer().positive().required(),
    template_id: Joi.number().integer().positive().required(),
    type_name: Joi.string().min(2).max(255).required(),
    type_code: Joi.string().min(2).max(100).required()
      .pattern(/^[A-Z0-9_]+$/)
      .messages({
        'string.pattern.base': 'Type code must contain only uppercase letters, numbers, and underscores',
      }),
    description: Joi.string().optional(),
    prefix: Joi.string().max(20).optional()
      .pattern(/^[A-Z0-9]+$/)
      .messages({
        'string.pattern.base': 'Prefix must contain only uppercase letters and numbers',
      }),
  }),
};

export const updateCertificateTypeSchema = {
  body: Joi.object({
    template_id: Joi.number().integer().positive().optional(),
    type_name: Joi.string().min(2).max(255).optional(),
    type_code: Joi.string().min(2).max(100).optional()
      .pattern(/^[A-Z0-9_]+$/)
      .messages({
        'string.pattern.base': 'Type code must contain only uppercase letters, numbers, and underscores',
      }),
    description: Joi.string().optional().allow(null, ''),
    prefix: Joi.string().max(20).optional().allow(null, '')
      .pattern(/^[A-Z0-9]+$/)
      .messages({
        'string.pattern.base': 'Prefix must contain only uppercase letters and numbers',
      }),
    is_active: Joi.boolean().optional(),
  }).min(1), // At least one field must be provided
};

export const certificateTypeIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

export const certificateTypesByParishSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    activeOnly: Joi.boolean().optional().default(true),
  }),
};
