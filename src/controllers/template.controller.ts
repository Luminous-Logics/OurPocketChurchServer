import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';
import { TemplateModel } from '../models/Template';
import { ApiError } from '../utils/apiError';

/**
 * Template Controller
 * Handles all template-related HTTP requests
 */
export class TemplateController {
  /**
   * Get all templates for a parish
   * GET /api/templates/parish/:parishId
   */
  public static async getByParishId(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string | undefined;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      // Get templates and total count
      const templates = await TemplateModel.findByParishId(
        parishId,
        page,
        limit,
        category,
        isActive
      );

      const totalRecords = await TemplateModel.countByParishId(
        parishId,
        category,
        isActive
      );

      const totalPages = Math.ceil(totalRecords / limit);

      res.json({
        success: true,
        data: templates,
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
   * Get a single template by ID
   * GET /api/templates/:id
   */
  public static async getById(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const templateId = parseInt(req.params.id);

      if (isNaN(templateId)) {
        throw ApiError.badRequest('Invalid template ID');
      }

      const template = await TemplateModel.findById(templateId);

      if (!template) {
        throw ApiError.notFound('Template not found');
      }

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new template
   * POST /api/templates
   */
  public static async create(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const templateData = {
        ...req.body,
        created_by: req.user?.user_id,
      };

      const newTemplate = await TemplateModel.create(templateData);

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: newTemplate,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a template
   * PUT /api/templates/:id
   */
  public static async update(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const templateId = parseInt(req.params.id);

      if (isNaN(templateId)) {
        throw ApiError.badRequest('Invalid template ID');
      }

      const updatedTemplate = await TemplateModel.update(templateId, req.body);

      res.json({
        success: true,
        message: 'Template updated successfully',
        data: updatedTemplate,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a template (soft delete)
   * DELETE /api/templates/:id
   */
  public static async delete(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const templateId = parseInt(req.params.id);

      if (isNaN(templateId)) {
        throw ApiError.badRequest('Invalid template ID');
      }

      await TemplateModel.softDelete(templateId);

      res.json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Permanently delete a template
   * DELETE /api/templates/:id/permanent
   */
  public static async hardDelete(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const templateId = parseInt(req.params.id);

      if (isNaN(templateId)) {
        throw ApiError.badRequest('Invalid template ID');
      }

      await TemplateModel.hardDelete(templateId);

      res.json({
        success: true,
        message: 'Template permanently deleted',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search templates
   * GET /api/templates/parish/:parishId/search
   */
  public static async search(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);
      const searchTerm = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      if (!searchTerm) {
        throw ApiError.badRequest('Search query is required');
      }

      const templates = await TemplateModel.search(
        parishId,
        searchTerm,
        page,
        limit
      );

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all template categories for a parish
   * GET /api/templates/parish/:parishId/categories
   */
  public static async getCategories(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      const categories = await TemplateModel.getCategories(parishId);

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }
}
