import Joi from 'joi';

export const issueCertificateSchema = {
  body: Joi.object({
    parish_id: Joi.number().integer().positive().required(),
    certificate_type_id: Joi.number().integer().positive().required(),
    parishioner_id: Joi.number().integer().positive().optional().allow(null),
    placeholder_values: Joi.object().required()
      .description('Key-value pairs for template placeholders (e.g., {"name": "John Doe", "date": "2024-01-15"})'),
  }),
};

export const revokeCertificateSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    revocation_reason: Joi.string().min(5).max(1000).required(),
  }),
};

export const certificateIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

export const certificatesByParishSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    status: Joi.string()
      .valid('draft', 'pending_approval', 'approved', 'issued', 'revoked', 'cancelled')
      .optional(),
  }),
};
