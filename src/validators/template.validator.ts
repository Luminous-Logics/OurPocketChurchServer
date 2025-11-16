import Joi from 'joi';

/**
 * Validation schema for creating a template
 */
export const createTemplateSchema = {
  body: Joi.object({
    parish_id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Parish ID must be a number',
        'number.positive': 'Parish ID must be positive',
        'any.required': 'Parish ID is required',
      }),
    template_name: Joi.string().min(1).max(255).required()
      .messages({
        'string.empty': 'Template name cannot be empty',
        'string.max': 'Template name cannot exceed 255 characters',
        'any.required': 'Template name is required',
      }),
    template_code: Joi.string().min(1).max(100).required()
      .pattern(/^[A-Z0-9_]+$/)
      .messages({
        'string.empty': 'Template code cannot be empty',
        'string.max': 'Template code cannot exceed 100 characters',
        'string.pattern.base': 'Template code must contain only uppercase letters, numbers, and underscores',
        'any.required': 'Template code is required',
      }),
    description: Joi.string().max(1000).optional().allow('', null)
      .messages({
        'string.max': 'Description cannot exceed 1000 characters',
      }),
    html_content: Joi.string().min(1).required()
      .messages({
        'string.empty': 'HTML content cannot be empty',
        'any.required': 'HTML content is required',
      }),
    category: Joi.string().max(50).optional().allow('', null)
      .messages({
        'string.max': 'Category cannot exceed 50 characters',
      }),
    is_active: Joi.boolean().optional()
      .messages({
        'boolean.base': 'is_active must be a boolean',
      }),
  }),
};

/**
 * Validation schema for updating a template
 */
export const updateTemplateSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Template ID must be a number',
        'number.positive': 'Template ID must be positive',
        'any.required': 'Template ID is required',
      }),
  }),
  body: Joi.object({
    template_name: Joi.string().min(1).max(255).optional()
      .messages({
        'string.empty': 'Template name cannot be empty',
        'string.max': 'Template name cannot exceed 255 characters',
      }),
    template_code: Joi.string().min(1).max(100).optional()
      .pattern(/^[A-Z0-9_]+$/)
      .messages({
        'string.empty': 'Template code cannot be empty',
        'string.max': 'Template code cannot exceed 100 characters',
        'string.pattern.base': 'Template code must contain only uppercase letters, numbers, and underscores',
      }),
    description: Joi.string().max(1000).optional().allow('', null)
      .messages({
        'string.max': 'Description cannot exceed 1000 characters',
      }),
    html_content: Joi.string().min(1).optional()
      .messages({
        'string.empty': 'HTML content cannot be empty',
      }),
    category: Joi.string().max(50).optional().allow('', null)
      .messages({
        'string.max': 'Category cannot exceed 50 characters',
      }),
    is_active: Joi.boolean().optional()
      .messages({
        'boolean.base': 'is_active must be a boolean',
      }),
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update',
  }),
};

/**
 * Validation schema for template ID parameter
 */
export const templateIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Template ID must be a number',
        'number.positive': 'Template ID must be positive',
        'any.required': 'Template ID is required',
      }),
  }),
};

/**
 * Validation schema for getting templates by parish ID
 */
export const templatesByParishSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Parish ID must be a number',
        'number.positive': 'Parish ID must be positive',
        'any.required': 'Parish ID is required',
      }),
  }),
  query: Joi.object({
    page: Joi.number().integer().positive().optional()
      .messages({
        'number.base': 'Page must be a number',
        'number.positive': 'Page must be positive',
      }),
    limit: Joi.number().integer().positive().max(100).optional()
      .messages({
        'number.base': 'Limit must be a number',
        'number.positive': 'Limit must be positive',
        'number.max': 'Limit cannot exceed 100',
      }),
    category: Joi.string().max(50).optional()
      .messages({
        'string.max': 'Category cannot exceed 50 characters',
      }),
    isActive: Joi.boolean().optional()
      .messages({
        'boolean.base': 'isActive must be a boolean',
      }),
  }),
};

/**
 * Validation schema for searching templates
 */
export const searchTemplatesSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Parish ID must be a number',
        'number.positive': 'Parish ID must be positive',
        'any.required': 'Parish ID is required',
      }),
  }),
  query: Joi.object({
    q: Joi.string().min(1).max(100).required()
      .messages({
        'string.empty': 'Search query cannot be empty',
        'string.max': 'Search query cannot exceed 100 characters',
        'any.required': 'Search query is required',
      }),
    page: Joi.number().integer().positive().optional()
      .messages({
        'number.base': 'Page must be a number',
        'number.positive': 'Page must be positive',
      }),
    limit: Joi.number().integer().positive().max(100).optional()
      .messages({
        'number.base': 'Limit must be a number',
        'number.positive': 'Limit must be positive',
        'number.max': 'Limit cannot exceed 100',
      }),
  }),
};

/**
 * Validation schema for getting template categories
 */
export const templateCategoriesSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Parish ID must be a number',
        'number.positive': 'Parish ID must be positive',
        'any.required': 'Parish ID is required',
      }),
  }),
};
