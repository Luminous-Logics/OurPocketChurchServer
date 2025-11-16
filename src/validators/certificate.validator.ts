import Joi from 'joi';
import { CertificateStatus } from '../types';

/**
 * ============================================
 * CERTIFICATE TYPE VALIDATORS
 * ============================================
 */

/**
 * Validation schema for creating a certificate type
 */
export const createCertificateTypeSchema = {
  body: Joi.object({
    parish_id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Parish ID must be a number',
        'number.positive': 'Parish ID must be positive',
        'any.required': 'Parish ID is required',
      }),
    type_name: Joi.string().min(1).max(100).required()
      .messages({
        'string.empty': 'Type name cannot be empty',
        'string.max': 'Type name cannot exceed 100 characters',
        'any.required': 'Type name is required',
      }),
    type_code: Joi.string().min(1).max(50).required()
      .pattern(/^[A-Z0-9_]+$/)
      .messages({
        'string.empty': 'Type code cannot be empty',
        'string.max': 'Type code cannot exceed 50 characters',
        'string.pattern.base': 'Type code must contain only uppercase letters, numbers, and underscores',
        'any.required': 'Type code is required',
      }),
    description: Joi.string().max(1000).optional().allow('', null)
      .messages({
        'string.max': 'Description cannot exceed 1000 characters',
      }),
    default_template_id: Joi.number().integer().positive().optional().allow(null)
      .messages({
        'number.base': 'Default template ID must be a number',
        'number.positive': 'Default template ID must be positive',
      }),
    requires_approval: Joi.boolean().optional()
      .messages({
        'boolean.base': 'requires_approval must be a boolean',
      }),
    auto_generate_number: Joi.boolean().optional()
      .messages({
        'boolean.base': 'auto_generate_number must be a boolean',
      }),
    number_prefix: Joi.string().max(20).optional().allow('', null)
      .messages({
        'string.max': 'Number prefix cannot exceed 20 characters',
      }),
    number_format: Joi.string().max(50).optional()
      .messages({
        'string.max': 'Number format cannot exceed 50 characters',
      }),
    available_placeholders: Joi.array().items(Joi.string()).optional()
      .messages({
        'array.base': 'Available placeholders must be an array of strings',
      }),
    is_active: Joi.boolean().optional()
      .messages({
        'boolean.base': 'is_active must be a boolean',
      }),
  }),
};

/**
 * Validation schema for updating a certificate type
 */
export const updateCertificateTypeSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Certificate type ID must be a number',
        'number.positive': 'Certificate type ID must be positive',
        'any.required': 'Certificate type ID is required',
      }),
  }),
  body: Joi.object({
    type_name: Joi.string().min(1).max(100).optional()
      .messages({
        'string.empty': 'Type name cannot be empty',
        'string.max': 'Type name cannot exceed 100 characters',
      }),
    type_code: Joi.string().min(1).max(50).optional()
      .pattern(/^[A-Z0-9_]+$/)
      .messages({
        'string.empty': 'Type code cannot be empty',
        'string.max': 'Type code cannot exceed 50 characters',
        'string.pattern.base': 'Type code must contain only uppercase letters, numbers, and underscores',
      }),
    description: Joi.string().max(1000).optional().allow('', null)
      .messages({
        'string.max': 'Description cannot exceed 1000 characters',
      }),
    default_template_id: Joi.number().integer().positive().optional().allow(null)
      .messages({
        'number.base': 'Default template ID must be a number',
        'number.positive': 'Default template ID must be positive',
      }),
    requires_approval: Joi.boolean().optional()
      .messages({
        'boolean.base': 'requires_approval must be a boolean',
      }),
    auto_generate_number: Joi.boolean().optional()
      .messages({
        'boolean.base': 'auto_generate_number must be a boolean',
      }),
    number_prefix: Joi.string().max(20).optional().allow('', null)
      .messages({
        'string.max': 'Number prefix cannot exceed 20 characters',
      }),
    number_format: Joi.string().max(50).optional()
      .messages({
        'string.max': 'Number format cannot exceed 50 characters',
      }),
    available_placeholders: Joi.array().items(Joi.string()).optional()
      .messages({
        'array.base': 'Available placeholders must be an array of strings',
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
 * Validation schema for certificate type ID parameter
 */
export const certificateTypeIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Certificate type ID must be a number',
        'number.positive': 'Certificate type ID must be positive',
        'any.required': 'Certificate type ID is required',
      }),
  }),
};

/**
 * Validation schema for getting certificate types by parish ID
 */
export const certificateTypesByParishSchema = {
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
    isActive: Joi.boolean().optional()
      .messages({
        'boolean.base': 'isActive must be a boolean',
      }),
  }),
};

/**
 * ============================================
 * CERTIFICATE VALIDATORS
 * ============================================
 */

/**
 * Validation schema for creating a certificate
 */
export const createCertificateSchema = {
  body: Joi.object({
    parish_id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Parish ID must be a number',
        'number.positive': 'Parish ID must be positive',
        'any.required': 'Parish ID is required',
      }),
    certificate_type_id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Certificate type ID must be a number',
        'number.positive': 'Certificate type ID must be positive',
        'any.required': 'Certificate type ID is required',
      }),
    certificate_number: Joi.string().max(100).optional()
      .messages({
        'string.max': 'Certificate number cannot exceed 100 characters',
      }),
    recipient_parishioner_id: Joi.number().integer().positive().optional().allow(null)
      .messages({
        'number.base': 'Recipient parishioner ID must be a number',
        'number.positive': 'Recipient parishioner ID must be positive',
      }),
    recipient_name: Joi.string().min(1).max(255).required()
      .messages({
        'string.empty': 'Recipient name cannot be empty',
        'string.max': 'Recipient name cannot exceed 255 characters',
        'any.required': 'Recipient name is required',
      }),
    template_id: Joi.number().integer().positive().optional().allow(null)
      .messages({
        'number.base': 'Template ID must be a number',
        'number.positive': 'Template ID must be positive',
      }),
    certificate_data: Joi.object().required()
      .messages({
        'object.base': 'Certificate data must be an object',
        'any.required': 'Certificate data is required',
      }),
    seal_image_url: Joi.string().uri().max(500).optional().allow('', null)
      .messages({
        'string.uri': 'Seal image URL must be a valid URL',
        'string.max': 'Seal image URL cannot exceed 500 characters',
      }),
    signature_image_url: Joi.string().uri().max(500).optional().allow('', null)
      .messages({
        'string.uri': 'Signature image URL must be a valid URL',
        'string.max': 'Signature image URL cannot exceed 500 characters',
      }),
    signed_by: Joi.string().max(255).optional().allow('', null)
      .messages({
        'string.max': 'Signed by cannot exceed 255 characters',
      }),
    signed_by_user_id: Joi.number().integer().positive().optional().allow(null)
      .messages({
        'number.base': 'Signed by user ID must be a number',
        'number.positive': 'Signed by user ID must be positive',
      }),
    issue_date: Joi.date().required()
      .messages({
        'date.base': 'Issue date must be a valid date',
        'any.required': 'Issue date is required',
      }),
    status: Joi.string().valid(...Object.values(CertificateStatus)).optional()
      .messages({
        'any.only': `Status must be one of: ${Object.values(CertificateStatus).join(', ')}`,
      }),
    notes: Joi.string().max(2000).optional().allow('', null)
      .messages({
        'string.max': 'Notes cannot exceed 2000 characters',
      }),
    is_public: Joi.boolean().optional()
      .messages({
        'boolean.base': 'is_public must be a boolean',
      }),
  }),
};

/**
 * Validation schema for updating a certificate
 */
export const updateCertificateSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Certificate ID must be a number',
        'number.positive': 'Certificate ID must be positive',
        'any.required': 'Certificate ID is required',
      }),
  }),
  body: Joi.object({
    recipient_parishioner_id: Joi.number().integer().positive().optional().allow(null)
      .messages({
        'number.base': 'Recipient parishioner ID must be a number',
        'number.positive': 'Recipient parishioner ID must be positive',
      }),
    recipient_name: Joi.string().min(1).max(255).optional()
      .messages({
        'string.empty': 'Recipient name cannot be empty',
        'string.max': 'Recipient name cannot exceed 255 characters',
      }),
    template_id: Joi.number().integer().positive().optional().allow(null)
      .messages({
        'number.base': 'Template ID must be a number',
        'number.positive': 'Template ID must be positive',
      }),
    certificate_data: Joi.object().optional()
      .messages({
        'object.base': 'Certificate data must be an object',
      }),
    generated_html: Joi.string().optional().allow('', null)
      .messages({
        'string.base': 'Generated HTML must be a string',
      }),
    seal_image_url: Joi.string().uri().max(500).optional().allow('', null)
      .messages({
        'string.uri': 'Seal image URL must be a valid URL',
        'string.max': 'Seal image URL cannot exceed 500 characters',
      }),
    signature_image_url: Joi.string().uri().max(500).optional().allow('', null)
      .messages({
        'string.uri': 'Signature image URL must be a valid URL',
        'string.max': 'Signature image URL cannot exceed 500 characters',
      }),
    signed_by: Joi.string().max(255).optional().allow('', null)
      .messages({
        'string.max': 'Signed by cannot exceed 255 characters',
      }),
    signed_by_user_id: Joi.number().integer().positive().optional().allow(null)
      .messages({
        'number.base': 'Signed by user ID must be a number',
        'number.positive': 'Signed by user ID must be positive',
      }),
    issue_date: Joi.date().optional()
      .messages({
        'date.base': 'Issue date must be a valid date',
      }),
    status: Joi.string().valid(...Object.values(CertificateStatus)).optional()
      .messages({
        'any.only': `Status must be one of: ${Object.values(CertificateStatus).join(', ')}`,
      }),
    notes: Joi.string().max(2000).optional().allow('', null)
      .messages({
        'string.max': 'Notes cannot exceed 2000 characters',
      }),
    is_public: Joi.boolean().optional()
      .messages({
        'boolean.base': 'is_public must be a boolean',
      }),
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update',
  }),
};

/**
 * Validation schema for certificate ID parameter
 */
export const certificateIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Certificate ID must be a number',
        'number.positive': 'Certificate ID must be positive',
        'any.required': 'Certificate ID is required',
      }),
  }),
};

/**
 * Validation schema for certificate number parameter
 */
export const certificateNumberSchema = {
  params: Joi.object({
    certificateNumber: Joi.string().min(1).max(100).required()
      .messages({
        'string.empty': 'Certificate number cannot be empty',
        'string.max': 'Certificate number cannot exceed 100 characters',
        'any.required': 'Certificate number is required',
      }),
  }),
};

/**
 * Validation schema for getting certificates by parish ID
 */
export const certificatesByParishSchema = {
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
    certificateTypeId: Joi.number().integer().positive().optional()
      .messages({
        'number.base': 'Certificate type ID must be a number',
        'number.positive': 'Certificate type ID must be positive',
      }),
    status: Joi.string().valid(...Object.values(CertificateStatus)).optional()
      .messages({
        'any.only': `Status must be one of: ${Object.values(CertificateStatus).join(', ')}`,
      }),
    recipientName: Joi.string().max(255).optional()
      .messages({
        'string.max': 'Recipient name cannot exceed 255 characters',
      }),
    issueDateFrom: Joi.date().optional()
      .messages({
        'date.base': 'Issue date from must be a valid date',
      }),
    issueDateTo: Joi.date().optional()
      .messages({
        'date.base': 'Issue date to must be a valid date',
      }),
  }),
};

/**
 * Validation schema for approving a certificate
 */
export const approveCertificateSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Certificate ID must be a number',
        'number.positive': 'Certificate ID must be positive',
        'any.required': 'Certificate ID is required',
      }),
  }),
};

/**
 * Validation schema for revoking a certificate
 */
export const revokeCertificateSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({
        'number.base': 'Certificate ID must be a number',
        'number.positive': 'Certificate ID must be positive',
        'any.required': 'Certificate ID is required',
      }),
  }),
  body: Joi.object({
    reason: Joi.string().min(1).max(1000).required()
      .messages({
        'string.empty': 'Revocation reason cannot be empty',
        'string.max': 'Revocation reason cannot exceed 1000 characters',
        'any.required': 'Revocation reason is required',
      }),
  }),
};
