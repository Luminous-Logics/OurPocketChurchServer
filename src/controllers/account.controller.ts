/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import { AccountModel } from '../models/Account';
import { AccountCategoryModel } from '../models/AccountCategory';
import { ApiError } from '../utils/apiError';
import { IAuthRequest } from '../types';
import Papa from 'papaparse';

export class AccountController {
  // =====================================================
  // ACCOUNT CATEGORIES
  // =====================================================

  /**
   * Get all global categories
   */
  public static async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await AccountCategoryModel.findAll();

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get global categories by type (income or expense)
   */
  public static async getCategoriesByType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query.type as 'income' | 'expense';

      if (!type || (type !== 'income' && type !== 'expense')) {
        throw ApiError.badRequest('Invalid type. Must be "income" or "expense"');
      }

      const categories = await AccountCategoryModel.findByType(type);

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new category
   */
  public static async createCategory(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryData = req.body;

      const category = await AccountCategoryModel.create(categoryData);

      res.status(201).json({
        success: true,
        message: 'Account category created successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a category
   */
  public static async updateCategory(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = parseInt(req.params.id);

      if (isNaN(categoryId)) {
        throw ApiError.badRequest('Invalid category ID');
      }

      const updates = req.body;

      const category = await AccountCategoryModel.update(categoryId, updates);

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a category
   */
  public static async deleteCategory(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const categoryId = parseInt(req.params.id);

      if (isNaN(categoryId)) {
        throw ApiError.badRequest('Invalid category ID');
      }

      await AccountCategoryModel.delete(categoryId);

      res.json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // =====================================================
  // ACCOUNT TRANSACTIONS
  // =====================================================

  /**
   * Get all transactions for a parish with pagination
   */
  public static async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const transactions = await AccountModel.findByParishId(parishId, page, limit);
      const totalRecords = await AccountModel.countByParishId(parishId);
      const totalPages = Math.ceil(totalRecords / limit);

      res.json({
        success: true,
        data: transactions,
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalRecords,
          totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction by ID
   */
  public static async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountId = parseInt(req.params.id);

      if (isNaN(accountId)) {
        throw ApiError.badRequest('Invalid account ID');
      }

      const transaction = await AccountModel.findById(accountId);

      if (!transaction) {
        throw ApiError.notFound('Transaction not found');
      }

      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get account summary (total income, expenses, balance)
   */
  public static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const summary = await AccountModel.getSummary(parishId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transactions by type (income or expense)
   */
  public static async getByType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);
      const type = req.query.type as 'income' | 'expense';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const transactions = await AccountModel.findByType(parishId, type, page, limit);

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transactions by date range
   */
  public static async getByDateRange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const transactions = await AccountModel.findByDateRange(parishId, startDate, endDate);

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transactions by category
   */
  public static async getByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);
      const categoryId = parseInt(req.query.categoryId as string);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (isNaN(parishId) || isNaN(categoryId)) {
        throw ApiError.badRequest('Invalid parish ID or category ID');
      }

      const transactions = await AccountModel.findByCategory(parishId, categoryId, page, limit);

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }


  /**
   * Search transactions
   */
  public static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);
      const searchTerm = req.query.q as string;

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      if (!searchTerm) {
        throw ApiError.badRequest('Search term is required');
      }

      const transactions = await AccountModel.search(parishId, searchTerm);

      res.json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new transaction
   */
  public static async create(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const transactionData = req.body;

      // Add created_by from authenticated user
      if (req.user) {
        transactionData.created_by = req.user.user_id;
      }

      const transaction = await AccountModel.create(transactionData);

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a transaction
   */
  public static async update(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountId = parseInt(req.params.id);

      if (isNaN(accountId)) {
        throw ApiError.badRequest('Invalid account ID');
      }

      const updates = req.body;

      const transaction = await AccountModel.update(accountId, updates);

      res.json({
        success: true,
        message: 'Transaction updated successfully',
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }


  /**
   * Delete a transaction
   */
  public static async delete(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const accountId = parseInt(req.params.id);

      if (isNaN(accountId)) {
        throw ApiError.badRequest('Invalid account ID');
      }

      await AccountModel.delete(accountId);

      res.json({
        success: true,
        message: 'Transaction deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // =====================================================
  // CSV IMPORT/EXPORT
  // =====================================================

  /**
   * Export transactions to CSV
   */
  public static async exportCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const transactions = await AccountModel.getAllForExport(parishId);

      // Convert to CSV format
      const csvData = transactions.map((t: any) => ({
        Date: t.transaction_date,
        Type: t.transaction_type,
        Category: t.category_name,
        Amount: t.amount,
        Description: t.description,
        Reference: t.reference_number || '',
        'Payment Method': t.payment_method || '',
        Balance: t.balance_after || '',
      }));

      const csv = Papa.unparse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=accounts_${parishId}_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Import transactions from CSV
   */
  public static async importCSV(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      // Expected CSV columns: Date, Type, Category, Amount, Description, Reference, Payment Method
      // This would require multer middleware for file upload
      // For now, accept CSV data in request body as string or array

      const csvData = req.body.csvData; // Array of objects or CSV string

      if (!csvData) {
        throw ApiError.badRequest('CSV data is required');
      }

      // Parse CSV if string
      let parsedData: any[] = csvData;
      if (typeof csvData === 'string') {
        const parseResult = Papa.parse(csvData, { header: true });
        parsedData = parseResult.data;
      }

      // Get all global categories for mapping
      const categories = await AccountCategoryModel.findAll();
      const categoryMap = new Map(
        categories.map((c) => [`${c.category_name.toLowerCase()}_${c.category_type}`, c.category_id])
      );

      // Transform and validate data
      const transactions = parsedData
        .filter((row: any) => row.Date && row.Type && row.Category && row.Amount)
        .map((row: any) => {
          const categoryKey = `${row.Category.toLowerCase()}_${row.Type.toLowerCase()}`;
          const categoryId = categoryMap.get(categoryKey);

          if (!categoryId) {
            throw ApiError.badRequest(`Category "${row.Category}" of type "${row.Type}" not found`);
          }

          return {
            transaction_date: new Date(row.Date),
            transaction_type: row.Type.toLowerCase() as 'income' | 'expense',
            category_id: categoryId,
            amount: parseFloat(row.Amount),
            description: row.Description || '',
            reference_number: row.Reference,
            payment_method: row['Payment Method'],
          };
        });

      const result = await AccountModel.bulkImport(parishId, transactions, req.user?.user_id);

      res.json({
        success: true,
        message: 'CSV import completed',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AccountController;
