import Joi from 'joi';

export const createAudiobookSchema = {
  body: Joi.object({
    parish_id: Joi.number().integer().positive().required(),
    title: Joi.string().min(1).max(255).required(),
    author: Joi.string().min(1).max(255).required(),
    narrator: Joi.string().max(255).optional(),
    description: Joi.string().optional(),
    thumbnail_url: Joi.string().uri().max(500).optional(),
    audio_file_url: Joi.string().uri().max(500).optional(),
    duration_minutes: Joi.number().integer().min(0).optional(),
    file_size_mb: Joi.number().min(0).optional(),
    category: Joi.string().max(100).optional(),
    language: Joi.string().max(50).optional().default('English'),
    publication_year: Joi.number().integer().min(1000).max(new Date().getFullYear() + 1).optional(),
    created_by: Joi.number().integer().positive().optional(),
  }),
};

export const updateAudiobookSchema = {
  body: Joi.object({
    title: Joi.string().min(1).max(255).optional(),
    author: Joi.string().min(1).max(255).optional(),
    narrator: Joi.string().max(255).optional().allow(null),
    description: Joi.string().optional().allow(null),
    thumbnail_url: Joi.string().uri().max(500).optional().allow(null),
    audio_file_url: Joi.string().uri().max(500).optional().allow(null),
    duration_minutes: Joi.number().integer().min(0).optional().allow(null),
    file_size_mb: Joi.number().min(0).optional().allow(null),
    category: Joi.string().max(100).optional().allow(null),
    language: Joi.string().max(50).optional(),
    publication_year: Joi.number().integer().min(1000).max(new Date().getFullYear() + 1).optional().allow(null),
    is_active: Joi.boolean().optional(),
  }).min(1), // At least one field must be provided
};

export const audiobookIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

export const audiobooksByParishSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};

export const searchAudiobookSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    q: Joi.string().min(1).required(),
  }),
};

export const audiobooksByCategorySchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    category: Joi.string().min(1).required(),
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};

export const audiobooksByAuthorSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    author: Joi.string().min(1).required(),
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};

export const getCategoriesSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
};
