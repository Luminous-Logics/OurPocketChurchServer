import { Request, Response, NextFunction } from 'express';
import { AudiobookModel } from '../models/Audiobook';
import { ApiError } from '../utils/apiError';
import { IAuthRequest } from '../types';

export class AudiobookController {
  /**
   * Get all audiobooks for a parish with pagination
   */
  public static async getByParish(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const audiobooks = await AudiobookModel.findByParishId(parishId, page, limit);
      const totalRecords = await AudiobookModel.countByParishId(parishId);
      const totalPages = Math.ceil(totalRecords / limit);

      res.json({
        success: true,
        data: audiobooks,
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
   * Get audiobook by ID
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const audiobookId = parseInt(req.params.id);

      if (isNaN(audiobookId)) {
        throw ApiError.badRequest('Invalid audiobook ID');
      }

      const audiobook = await AudiobookModel.findById(audiobookId);

      if (!audiobook) {
        throw ApiError.notFound('Audiobook not found');
      }

      res.json({
        success: true,
        data: audiobook,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search audiobooks within a parish
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

      const audiobooks = await AudiobookModel.search(parishId, searchTerm);

      res.json({
        success: true,
        data: audiobooks,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audiobooks by category
   */
  public static async getByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);
      const category = req.query.category as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      if (!category) {
        throw ApiError.badRequest('Category is required');
      }

      const audiobooks = await AudiobookModel.findByCategory(parishId, category, page, limit);

      res.json({
        success: true,
        data: audiobooks,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audiobooks by author
   */
  public static async getByAuthor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);
      const author = req.query.author as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      if (!author) {
        throw ApiError.badRequest('Author is required');
      }

      const audiobooks = await AudiobookModel.findByAuthor(parishId, author, page, limit);

      res.json({
        success: true,
        data: audiobooks,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all categories for a parish
   */
  public static async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const categories = await AudiobookModel.getCategories(parishId);

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new audiobook
   */
  public static async create(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const audiobookData = req.body;

      // Add created_by from authenticated user
      if (req.user) {
        audiobookData.created_by = req.user.user_id;
      }

      const audiobook = await AudiobookModel.create(audiobookData);

      res.status(201).json({
        success: true,
        message: 'Audiobook created successfully',
        data: audiobook,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an audiobook
   */
  public static async update(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const audiobookId = parseInt(req.params.id);

      if (isNaN(audiobookId)) {
        throw ApiError.badRequest('Invalid audiobook ID');
      }

      const updates = req.body;

      const audiobook = await AudiobookModel.update(audiobookId, updates);

      res.json({
        success: true,
        message: 'Audiobook updated successfully',
        data: audiobook,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete an audiobook (soft delete)
   */
  public static async delete(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const audiobookId = parseInt(req.params.id);

      if (isNaN(audiobookId)) {
        throw ApiError.badRequest('Invalid audiobook ID');
      }

      await AudiobookModel.delete(audiobookId);

      res.json({
        success: true,
        message: 'Audiobook deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AudiobookController;
