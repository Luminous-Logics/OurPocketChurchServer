/**
 * OTP Validators
 *
 * Validation schemas for OTP-related requests
 */

import Joi from 'joi';

/**
 * Request login OTP
 */
export const requestLoginOTPSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .trim()
    .lowercase()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
});

/**
 * Verify login OTP
 */
export const verifyLoginOTPSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .trim()
    .lowercase()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  otp_code: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'OTP must be 6 digits',
      'string.pattern.base': 'OTP must contain only numbers',
      'any.required': 'OTP code is required',
    }),
});

/**
 * Request password reset OTP
 */
export const requestPasswordResetOTPSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .trim()
    .lowercase()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
});

/**
 * Verify password reset OTP
 */
export const verifyPasswordResetOTPSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .trim()
    .lowercase()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  otp_code: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'OTP must be 6 digits',
      'string.pattern.base': 'OTP must contain only numbers',
      'any.required': 'OTP code is required',
    }),
});

/**
 * Resend OTP
 */
export const resendOTPSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .trim()
    .lowercase()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
  otp_type: Joi.string()
    .valid('login', 'password_reset')
    .required()
    .messages({
      'any.only': 'OTP type must be either "login" or "password_reset"',
      'any.required': 'OTP type is required',
    }),
});
