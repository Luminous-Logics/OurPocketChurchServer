import Joi from 'joi';

export const deleteFileSchema = {
  body: Joi.object({
    key: Joi.string().required().messages({
      'string.empty': 'File key is required',
      'any.required': 'File key is required',
    }),
  }),
};

export const deleteMultipleFilesSchema = {
  body: Joi.object({
    keys: Joi.array()
      .items(Joi.string())
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one file key is required',
        'any.required': 'File keys are required',
      }),
  }),
};

export const getPresignedUrlSchema = {
  body: Joi.object({
    key: Joi.string().required().messages({
      'string.empty': 'File key is required',
      'any.required': 'File key is required',
    }),
    expiresIn: Joi.number().integer().min(60).max(86400).optional().default(3600).messages({
      'number.min': 'Expiration time must be at least 60 seconds',
      'number.max': 'Expiration time must not exceed 24 hours (86400 seconds)',
    }),
  }),
};
