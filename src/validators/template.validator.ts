import Joi from 'joi';

export const createTemplateSchema = {
  body: Joi.object({
    parish_id: Joi.number().integer().positive().required(),
    template_name: Joi.string().min(2).max(255).required(),
    template_code: Joi.string().min(2).max(100).required()
      .pattern(/^[A-Z0-9_]+$/)
      .messages({
        'string.pattern.base': 'Template code must contain only uppercase letters, numbers, and underscores',
      }),
    description: Joi.string().optional(),
    html_content: Joi.string().required().min(1),
    category: Joi.string().max(100).optional(),
  }),
};

export const updateTemplateSchema = {
  body: Joi.object({
    template_name: Joi.string().min(2).max(255).optional(),
    template_code: Joi.string().min(2).max(100).optional()
      .pattern(/^[A-Z0-9_]+$/)
      .messages({
        'string.pattern.base': 'Template code must contain only uppercase letters, numbers, and underscores',
      }),
    description: Joi.string().optional().allow(null, ''),
    html_content: Joi.string().optional().min(1),
    category: Joi.string().max(100).optional().allow(null, ''),
    is_active: Joi.boolean().optional(),
  }).min(1), // At least one field must be provided
};

export const templateIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

export const templatesByParishSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    activeOnly: Joi.boolean().optional().default(true),
  }),
};

export const templatesByCategorySchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
    category: Joi.string().min(1).max(100).required(),
  }),
};
