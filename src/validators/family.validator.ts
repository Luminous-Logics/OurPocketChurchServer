import Joi from 'joi';

export const createFamilySchema = {
  body: Joi.object({
    parish_id: Joi.number().integer().positive().required(),
    ward_id: Joi.number().integer().positive().optional().allow(null),
    family_name: Joi.string().min(2).max(200).required(),
    primary_contact_id: Joi.number().integer().positive().optional().allow(null),
    home_phone: Joi.string().max(20).optional(),
    registration_date: Joi.date().optional(),
    head_of_family: Joi.string().max(200).optional(),
    address_line1: Joi.string().max(200).optional(),
    address_line2: Joi.string().max(200).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    country: Joi.string().max(100).optional(),
    postal_code: Joi.string().max(20).optional(),
  }),
};

export const updateFamilySchema = {
  body: Joi.object({
    ward_id: Joi.number().integer().positive().optional().allow(null),
    family_name: Joi.string().min(2).max(200).optional(),
    primary_contact_id: Joi.number().integer().positive().optional().allow(null),
    home_phone: Joi.string().max(20).optional().allow(null),
    registration_date: Joi.date().optional(),
    is_active: Joi.boolean().optional(),
    address_line1: Joi.string().max(200).optional(),
    address_line2: Joi.string().max(200).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    country: Joi.string().max(100).optional(),
    postal_code: Joi.string().max(20).optional(),
  }).min(1), // At least one field must be provided
};

export const familyIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

export const familiesByParishSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};

export const familiesByWardSchema = {
  params: Joi.object({
    wardId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};

export const searchFamilySchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    q: Joi.string().min(1).required(),
  }),
};

export const bulkCreateSchema = {
  body: Joi.object({
    parish_id: Joi.number().integer().positive().required(),
    ward: Joi.object({
      ward_id: Joi.number().integer().positive().optional(),
      ward_name: Joi.string().min(2).max(200).optional(),
      ward_number: Joi.string().max(50).optional(),
      description: Joi.string().max(500).optional(),
      coordinator_id: Joi.number().integer().positive().optional(),
      area_coverage: Joi.string().max(500).optional(),
    })
      .optional()
      .custom((value, helpers) => {
        // Validate that either ward_id OR ward_name is provided, not both
        if (value.ward_id && value.ward_name) {
          return helpers.error('object.xor', { peers: ['ward_id', 'ward_name'] });
        }
        return value;
      }),
    family: Joi.object({
      family_id: Joi.number().integer().positive().optional(),
      family_name: Joi.string().min(2).max(200).optional(),
      home_phone: Joi.string().max(20).optional(),
      registration_date: Joi.date().optional(),
      update_ward: Joi.boolean().optional(),
      update_primary_contact: Joi.boolean().optional(),
    })
      .required()
      .custom((value, helpers) => {
        // Validate that either family_id OR family_name is provided
        if (!value.family_id && !value.family_name) {
          return helpers.error('object.missing', {
            message: 'Either family_id (existing) or family_name (new) is required',
          });
        }
        if (value.family_id && value.family_name) {
          return helpers.error('object.xor', { peers: ['family_id', 'family_name'] });
        }
        // If using existing family (family_id), family_name and registration_date should not be provided
        if (value.family_id && (value.family_name || value.registration_date)) {
          return helpers.error('object.conflict', {
            message:
              'When using existing family (family_id), do not provide family_name or registration_date',
          });
        }
        return value;
      }),
    members: Joi.array()
      .items(
        Joi.object({
          first_name: Joi.string().min(1).max(100).required(),
          last_name: Joi.string().min(1).max(100).required(),
          email: Joi.string().email().required(),
          password: Joi.string().min(8).optional(),
          phone: Joi.string().max(20).optional(),
          middle_name: Joi.string().max(100).optional(),
          date_of_birth: Joi.date().optional(),
          gender: Joi.string().valid('male', 'female', 'other').optional(),
          marital_status: Joi.string()
            .valid('single', 'married', 'widowed', 'divorced', 'separated')
            .optional(),
          occupation: Joi.string().max(200).optional(),
          baptism_date: Joi.date().optional(),
          first_communion_date: Joi.date().optional(),
          confirmation_date: Joi.date().optional(),
          marriage_date: Joi.date().optional(),
          member_status: Joi.string()
            .valid('active', 'inactive', 'moved', 'deceased')
            .optional()
            .default('active'),
          photo_url: Joi.string().uri().optional(),
          profile_image_url: Joi.string().uri().optional(),
          address_line1: Joi.string().max(200).optional(),
          address_line2: Joi.string().max(200).optional(),
          city: Joi.string().max(100).optional(),
          state: Joi.string().max(100).optional(),
          country: Joi.string().max(100).optional(),
          postal_code: Joi.string().max(20).optional(),
          emergency_contact_name: Joi.string().max(200).optional(),
          emergency_contact_phone: Joi.string().max(20).optional(),
          notes: Joi.string().max(1000).optional(),
          registration_date: Joi.date().optional(),
          is_primary_contact: Joi.boolean().optional(),
        })
      )
      .min(1)
      .required(),
  }),
};
