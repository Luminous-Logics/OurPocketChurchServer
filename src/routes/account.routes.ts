import { Router } from 'express';
import { AccountController } from '../controllers/account.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  categoriesByTypeSchema,
  createAccountSchema,
  updateAccountSchema,
  accountIdSchema,
  accountsByParishSchema,
  accountsByTypeSchema,
  accountsByDateRangeSchema,
  accountsByCategorySchema,
  searchAccountsSchema,
  getSummarySchema,
  exportCSVSchema,
  importCSVSchema,
} from '../validators/account.validator';

const router = Router();

// =====================================================
// ACCOUNT CATEGORIES ROUTES
// =====================================================

/**
 * @swagger
 * /accounts/categories:
 *   get:
 *     summary: Get all global account categories
 *     tags: [Accounts]
 *     description: Retrieve all income and expense categories (shared by all parishes)
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/categories', authenticate, requirePermission('VIEW_ACCOUNTS'), AccountController.getCategories);

/**
 * @swagger
 * /accounts/categories/by-type:
 *   get:
 *     summary: Get global categories by type (income or expense)
 *     tags: [Accounts]
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/categories/by-type', authenticate, requirePermission('VIEW_ACCOUNTS'), validate(categoriesByTypeSchema), AccountController.getCategoriesByType);

/**
 * @swagger
 * /accounts/categories:
 *   post:
 *     summary: Create a new account category
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAccountCategory'
 *     responses:
 *       201:
 *         description: Category created successfully
 */
router.post('/categories', authenticate, requirePermission('MANAGE_ACCOUNTS'), validate(createCategorySchema), AccountController.createCategory);

/**
 * @swagger
 * /accounts/categories/{id}:
 *   put:
 *     summary: Update account category
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAccountCategory'
 *     responses:
 *       200:
 *         description: Category updated successfully
 */
router.put('/categories/:id', authenticate, requirePermission('MANAGE_ACCOUNTS'), validate(categoryIdSchema), validate(updateCategorySchema), AccountController.updateCategory);

/**
 * @swagger
 * /accounts/categories/{id}:
 *   delete:
 *     summary: Delete account category
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Category deleted successfully
 */
router.delete('/categories/:id', authenticate, requirePermission('MANAGE_ACCOUNTS'), validate(categoryIdSchema), AccountController.deleteCategory);

// =====================================================
// ACCOUNT TRANSACTIONS ROUTES
// =====================================================

/**
 * @swagger
 * /accounts/parish/{parishId}/summary:
 *   get:
 *     summary: Get financial summary for a parish
 *     tags: [Accounts]
 *     description: Get total income, total expenses, current balance, and pending transactions
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AccountSummary'
 */
router.get('/parish/:parishId/summary', authenticate, requirePermission('VIEW_FINANCIAL_REPORTS'), validate(getSummarySchema), AccountController.getSummary);

/**
 * @swagger
 * /accounts/parish/{parishId}:
 *   get:
 *     summary: Get all transactions for a parish
 *     tags: [Accounts]
 *     description: Retrieve paginated transaction history
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 */
router.get('/parish/:parishId', authenticate, requirePermission('VIEW_ACCOUNTS'), validate(accountsByParishSchema), AccountController.getTransactions);

/**
 * @swagger
 * /accounts/parish/{parishId}/type:
 *   get:
 *     summary: Get transactions by type (income or expense)
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 */
router.get('/parish/:parishId/type', authenticate, requirePermission('VIEW_ACCOUNTS'), validate(accountsByTypeSchema), AccountController.getByType);

/**
 * @swagger
 * /accounts/parish/{parishId}/date-range:
 *   get:
 *     summary: Get transactions by date range
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 */
router.get('/parish/:parishId/date-range', authenticate, requirePermission('VIEW_ACCOUNTS'), validate(accountsByDateRangeSchema), AccountController.getByDateRange);

/**
 * @swagger
 * /accounts/parish/{parishId}/category:
 *   get:
 *     summary: Get transactions by category
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 */
router.get('/parish/:parishId/category', authenticate, requirePermission('VIEW_ACCOUNTS'), validate(accountsByCategorySchema), AccountController.getByCategory);

/**
 * @swagger
 * /accounts/parish/{parishId}/search:
 *   get:
 *     summary: Search transactions
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
router.get('/parish/:parishId/search', authenticate, requirePermission('VIEW_ACCOUNTS'), validate(searchAccountsSchema), AccountController.search);

/**
 * @swagger
 * /accounts/parish/{parishId}/export-csv:
 *   get:
 *     summary: Export transactions to CSV
 *     tags: [Accounts]
 *     description: Download all transactions as CSV file
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get('/parish/:parishId/export-csv', authenticate, requirePermission('EXPORT_FINANCIAL_DATA'), validate(exportCSVSchema), AccountController.exportCSV);

/**
 * @swagger
 * /accounts/parish/{parishId}/import-csv:
 *   post:
 *     summary: Import transactions from CSV
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     description: Bulk import transactions from CSV data
 *     parameters:
 *       - in: path
 *         name: parishId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               csvData:
 *                 type: string
 *                 description: CSV string or array of objects
 *     responses:
 *       200:
 *         description: Import completed
 */
router.post('/parish/:parishId/import-csv', authenticate, requirePermission('EXPORT_FINANCIAL_DATA'), validate(importCSVSchema), AccountController.importCSV);

/**
 * @swagger
 * /accounts/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 */
router.get('/:id', authenticate, requirePermission('VIEW_ACCOUNTS'), validate(accountIdSchema), AccountController.getTransactionById);

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Create a new transaction (Add Entry)
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAccount'
 *     responses:
 *       201:
 *         description: Transaction created successfully
 */
router.post('/', authenticate, requirePermission('CREATE_TRANSACTION'), validate(createAccountSchema), AccountController.create);

/**
 * @swagger
 * /accounts/{id}:
 *   put:
 *     summary: Update transaction
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAccount'
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 */
router.put('/:id', authenticate, requirePermission('EDIT_TRANSACTION'), validate(accountIdSchema), validate(updateAccountSchema), AccountController.update);

/**
 * @swagger
 * /accounts/{id}:
 *   delete:
 *     summary: Delete transaction
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 */
router.delete('/:id', authenticate, requirePermission('DELETE_TRANSACTION'), validate(accountIdSchema), AccountController.delete);

/**
 * @swagger
 * components:
 *   schemas:
 *     AccountCategory:
 *       type: object
 *       properties:
 *         category_id:
 *           type: integer
 *         category_name:
 *           type: string
 *         category_type:
 *           type: string
 *           enum: [income, expense]
 *         description:
 *           type: string
 *         is_active:
 *           type: boolean
 *         is_system:
 *           type: boolean
 *           description: System categories cannot be deleted or modified
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     CreateAccountCategory:
 *       type: object
 *       required:
 *         - category_name
 *         - category_type
 *       properties:
 *         category_name:
 *           type: string
 *           example: Custom Offering
 *         category_type:
 *           type: string
 *           enum: [income, expense]
 *           example: income
 *         description:
 *           type: string
 *         is_system:
 *           type: boolean
 *           default: false
 *     UpdateAccountCategory:
 *       type: object
 *       properties:
 *         category_name:
 *           type: string
 *         description:
 *           type: string
 *         is_active:
 *           type: boolean
 *     Account:
 *       type: object
 *       properties:
 *         account_id:
 *           type: integer
 *         parish_id:
 *           type: integer
 *         transaction_date:
 *           type: string
 *           format: date
 *         transaction_type:
 *           type: string
 *           enum: [income, expense]
 *         category_id:
 *           type: integer
 *         amount:
 *           type: number
 *           format: decimal
 *         description:
 *           type: string
 *         reference_number:
 *           type: string
 *         payment_method:
 *           type: string
 *         balance_after:
 *           type: number
 *           format: decimal
 *         created_at:
 *           type: string
 *           format: date-time
 *     CreateAccount:
 *       type: object
 *       required:
 *         - parish_id
 *         - transaction_date
 *         - transaction_type
 *         - category_id
 *         - amount
 *         - description
 *       properties:
 *         parish_id:
 *           type: integer
 *         transaction_date:
 *           type: string
 *           format: date
 *           example: 2024-01-15
 *         transaction_type:
 *           type: string
 *           enum: [income, expense]
 *           example: income
 *         category_id:
 *           type: integer
 *           example: 1
 *         amount:
 *           type: number
 *           format: decimal
 *           example: 5000.00
 *         description:
 *           type: string
 *           example: Sunday offering collection
 *         reference_number:
 *           type: string
 *         payment_method:
 *           type: string
 *           enum: [cash, check, bank_transfer, card, online, other]
 *     UpdateAccount:
 *       type: object
 *       properties:
 *         transaction_date:
 *           type: string
 *           format: date
 *         transaction_type:
 *           type: string
 *           enum: [income, expense]
 *         category_id:
 *           type: integer
 *         amount:
 *           type: number
 *           format: decimal
 *         description:
 *           type: string
 *         reference_number:
 *           type: string
 *         payment_method:
 *           type: string
 *     AccountSummary:
 *       type: object
 *       properties:
 *         total_income:
 *           type: number
 *           format: decimal
 *           example: 7000.00
 *         total_expenses:
 *           type: number
 *           format: decimal
 *           example: 2300.00
 *         current_balance:
 *           type: number
 *           format: decimal
 *           example: 4700.00
 */

export default router;
