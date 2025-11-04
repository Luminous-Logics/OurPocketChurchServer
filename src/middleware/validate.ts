import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '../utils/apiError';

/**
 * Middleware to validate request data using Joi schema
 */
export const validate = (schema: {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const validationOptions: Joi.ValidationOptions = {
      abortEarly: false, // Return all errors
      allowUnknown: true, // Allow unknown keys that will be removed
      stripUnknown: true, // Remove unknown keys from the validated data
    };

    const errors: string[] = [];

    // Validate body
    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, validationOptions);
      if (error) {
        error.details.forEach((detail) => errors.push(detail.message));
      } else {
        req.body = value;
      }
    }

    // Validate params
    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, validationOptions);
      if (error) {
        error.details.forEach((detail) => errors.push(detail.message));
      } else {
        req.params = value;
      }
    }

    // Validate query
    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, validationOptions);
      if (error) {
        error.details.forEach((detail) => errors.push(detail.message));
      } else {
        req.query = value;
      }
    }

    // If there are errors, return bad request
    if (errors.length > 0) {
      return next(ApiError.badRequest(errors.join(', ')));
    }

    next();
  };
};

export default validate;
