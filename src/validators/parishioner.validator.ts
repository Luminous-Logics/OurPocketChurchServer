import Joi from 'joi';

export const createParishionerSchema = {
  body: Joi.object({
    // User account fields (password is optional - can be set later by parishioner)
    email: Joi.string().email().max(255).required(),
    password: Joi.string().min(8).optional(),
    first_name: Joi.string().min(2).max(100).required(),
    last_name: Joi.string().min(2).max(100).required(),
    phone: Joi.string().max(20).required(),
    profile_image_url: Joi.string().uri().max(500).optional(),
    // Parishioner fields
    parish_id: Joi.number().integer().positive().required(),
    ward_id: Joi.number().integer().positive().optional().allow(null),
    family_id: Joi.number().integer().positive().optional().allow(null),
    middle_name: Joi.string().max(100).optional(),
    date_of_birth: Joi.date().optional(),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
    marital_status: Joi.string().valid('single', 'married', 'divorced', 'widowed', 'separated').optional(),
    occupation: Joi.string().max(200).optional(),
    baptism_date: Joi.date().optional(),
    first_communion_date: Joi.date().optional(),
    confirmation_date: Joi.date().optional(),
    marriage_date: Joi.date().optional(),
    member_status: Joi.string().valid('active', 'inactive', 'visitor').optional().default('active'),
    photo_url: Joi.string().uri().max(500).optional(),
    address_line1: Joi.string().max(255).optional(),
    address_line2: Joi.string().max(255).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    country: Joi.string().max(100).optional(),
    postal_code: Joi.string().max(20).optional(),
    emergency_contact_name: Joi.string().max(200).optional(),
    emergency_contact_phone: Joi.string().max(20).optional(),
    notes: Joi.string().optional(),
    registration_date: Joi.date().optional(),
  }),
};

export const updateParishionerSchema = {
  body: Joi.object({
    ward_id: Joi.number().integer().positive().optional().allow(null),
    family_id: Joi.number().integer().positive().optional().allow(null),
     email: Joi.string().email().max(255).optional().allow(null),
    phone: Joi.string().max(20),
    profile_image_url: Joi.string().uri().max(500).optional().allow(null),
    middle_name: Joi.string().max(100).optional().allow(null),
    date_of_birth: Joi.date().optional().allow(null),
    gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional().allow(null),
    marital_status: Joi.string().valid('single', 'married', 'divorced', 'widowed', 'separated').optional().allow(null),
    occupation: Joi.string().max(200).optional().allow(null),
    baptism_date: Joi.date().optional().allow(null),
    first_communion_date: Joi.date().optional().allow(null),
    confirmation_date: Joi.date().optional().allow(null),
    marriage_date: Joi.date().optional().allow(null),
    member_status: Joi.string().valid('active', 'inactive', 'visitor').optional(),
    photo_url: Joi.string().uri().max(500).optional().allow(null),
    address_line1: Joi.string().max(255).optional().allow(null),
    address_line2: Joi.string().max(255).optional().allow(null),
    city: Joi.string().max(100).optional().allow(null),
    state: Joi.string().max(100).optional().allow(null),
    country: Joi.string().max(100).optional().allow(null),
    postal_code: Joi.string().max(20).optional().allow(null),
    emergency_contact_name: Joi.string().max(200).optional().allow(null),
    emergency_contact_phone: Joi.string().max(20).optional().allow(null),
    notes: Joi.string().optional().allow(null),
    registration_date: Joi.date().optional().allow(null),
    is_active: Joi.boolean().optional(),
    first_name: Joi.string().min(2).max(100).required(),
    last_name: Joi.string().min(2).max(100).required(),
  }).min(1), // At least one field must be provided
};

export const parishionerIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

export const parishionersByParishSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};

export const parishionersByWardSchema = {
  params: Joi.object({
    wardId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};

export const parishionersByFamilySchema = {
  params: Joi.object({
    familyId: Joi.number().integer().positive().required(),
  }),
};

export const searchParishionerSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    q: Joi.string().min(1).required(),
  }),
};
