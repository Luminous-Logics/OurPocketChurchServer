import Joi from 'joi';

// Account Category Validators
export const createCategorySchema = {
  body: Joi.object({
    category_name: Joi.string().min(1).max(100).required(),
    category_type: Joi.string().valid('income', 'expense').required(),
    description: Joi.string().optional(),
    is_system: Joi.boolean().optional().default(false),
  }),
};

export const updateCategorySchema = {
  body: Joi.object({
    category_name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().optional().allow(null),
    is_active: Joi.boolean().optional(),
  }).min(1),
};

export const categoryIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

export const categoriesByTypeSchema = {
  query: Joi.object({
    type: Joi.string().valid('income', 'expense').required(),
  }),
};

// Account Transaction Validators
export const createAccountSchema = {
  body: Joi.object({
    parish_id: Joi.number().integer().positive().required(),
    transaction_date: Joi.date().required(),
    transaction_type: Joi.string().valid('income', 'expense').required(),
    category_id: Joi.number().integer().positive().required(),
    amount: Joi.number().positive().precision(2).required(),
    description: Joi.string().min(1).required(),
    reference_number: Joi.string().max(100).optional(),
    payment_method: Joi.string()
      .valid('cash', 'check', 'bank_transfer', 'card', 'online', 'other')
      .optional(),
    created_by: Joi.number().integer().positive().optional(),
  }),
};

export const updateAccountSchema = {
  body: Joi.object({
    transaction_date: Joi.date().optional(),
    transaction_type: Joi.string().valid('income', 'expense').optional(),
    category_id: Joi.number().integer().positive().optional(),
    amount: Joi.number().positive().precision(2).optional(),
    description: Joi.string().min(1).optional(),
    reference_number: Joi.string().max(100).optional().allow(null),
    payment_method: Joi.string()
      .valid('cash', 'check', 'bank_transfer', 'card', 'online', 'other')
      .optional()
      .allow(null),
  }).min(1),
};

export const accountIdSchema = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

export const accountsByParishSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};

export const accountsByTypeSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    type: Joi.string().valid('income', 'expense').required(),
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};

export const accountsByDateRangeSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).required(),
  }),
};

export const accountsByCategorySchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    categoryId: Joi.number().integer().positive().required(),
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};

export const searchAccountsSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  query: Joi.object({
    q: Joi.string().min(1).required(),
  }),
};

export const getSummarySchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
};

// CSV Import Validator
export const importCSVSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
  // File upload validation would be handled by multer middleware
};

// CSV Export Validator
export const exportCSVSchema = {
  params: Joi.object({
    parishId: Joi.number().integer().positive().required(),
  }),
};
