import Joi from 'joi';

export const createWardSchema = {
  body: Joi.object({
    parish_id: Joi.number().integer().positive().required(),
    ward_name: Joi.string().min(2).max(200).required(),
    ward_number: Joi.string().max(50).optional(),
    description: Joi.string().optional(),
    coordinator_id: Joi.number().integer().positive().optional(),
    area_coverage: Joi.string().optional(),
  }),
};

export const updateWardSchema = {
  body: Joi.object({
    ward_name: Joi.string().min(2).max(200).optional(),
    ward_number: Joi.string().max(50).optional(),
    description: Joi.string().optional(),
    coordinator_id: Joi.number().integer().positive().optional().allow(null),
    area_coverage: Joi.string().optional(),
    is_active: Joi.boolean().optional(),
  }).min(1), // At least one field must be provided
};

export const wardIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

export const wardsByParishSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};

export const searchWardSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    q: Joi.string().min(1).required(),
  }),
};

export const updateWardCountsSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
  body: Joi.object({
    total_families: Joi.number().integer().min(0).required(),
    total_members: Joi.number().integer().min(0).required(),
  }),
};
