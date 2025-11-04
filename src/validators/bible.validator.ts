import Joi from 'joi';

// Daily Reading Validators
export const createDailyReadingSchema = {
  body: Joi.object({
    parish_id: Joi.number().integer().positive().required(),
    reading_date: Joi.date().required(),
    book_name: Joi.string().min(1).max(100).required(),
    chapter: Joi.number().integer().min(1).required(),
    verse_start: Joi.number().integer().min(1).optional(),
    verse_end: Joi.number().integer().min(1).optional(),
    translation: Joi.string().max(20).optional().default('kjv'),
  }),
};

export const parishIdSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
};

// Bookmark Validators
export const createBookmarkSchema = {
  body: Joi.object({
    book_name: Joi.string().min(1).max(100).required(),
    chapter: Joi.number().integer().min(1).required(),
    verse_start: Joi.number().integer().min(1).optional(),
    verse_end: Joi.number().integer().min(1).optional(),
    translation: Joi.string().max(20).optional().default('kjv'),
    note: Joi.string().optional(),
    highlight_color: Joi.string().valid('yellow', 'green', 'blue', 'red', 'purple').optional(),
    is_favorite: Joi.boolean().optional().default(false),
  }),
};

export const bookmarkIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

// Reading History Validators
export const recordReadingSchema = {
  body: Joi.object({
    book_name: Joi.string().min(1).max(100).required(),
    chapter: Joi.number().integer().min(1).required(),
    verse_start: Joi.number().integer().min(1).optional(),
    verse_end: Joi.number().integer().min(1).optional(),
    translation: Joi.string().max(20).optional().default('kjv'),
    reading_duration_seconds: Joi.number().integer().min(0).optional(),
    completed: Joi.boolean().optional().default(true),
  }),
};

