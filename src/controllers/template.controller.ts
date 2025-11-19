import { Request, Response, NextFunction } from 'express';
import { TemplateModel } from '../models/Template';
import { ParishModel } from '../models/Parish';
import { ApiError } from '../utils/apiError';
import { IAuthRequest } from '../types';

export class TemplateController {
  /**
   * Get all templates for a specific parish with pagination
   */
  public static async getByParishId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const activeOnly = req.query.activeOnly === 'false' ? false : true;

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      // Verify parish exists
      const parish = await ParishModel.findById(parishId);
      if (!parish) {
        throw ApiError.notFound('Parish not found');
      }

      const templates = await TemplateModel.findByParishId(parishId, page, limit, activeOnly);
      const totalRecords = await TemplateModel.countByParishId(parishId, activeOnly);
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
   * Get template by ID
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
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
   * Get templates by category
   */
  public static async getByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);
      const category = req.params.category;

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      if (!category) {
        throw ApiError.badRequest('Category is required');
      }

      const templates = await TemplateModel.findByCategory(parishId, category);

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new template
   */
  public static async create(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const templateData = req.body;

      // Add created_by from authenticated user
      templateData.created_by = req.user?.user_id;

      // Verify parish exists
      const parish = await ParishModel.findById(templateData.parish_id);
      if (!parish) {
        throw ApiError.badRequest('Parish not found');
      }

      // Check if template code already exists for this parish
      const codeExists = await TemplateModel.codeExists(templateData.parish_id, templateData.template_code);
      if (codeExists) {
        throw ApiError.badRequest(`Template code '${templateData.template_code}' already exists for this parish`);
      }

      const template = await TemplateModel.create(templateData);

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update template
   */
  public static async update(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const templateId = parseInt(req.params.id);
      const updates = req.body;

      if (isNaN(templateId)) {
        throw ApiError.badRequest('Invalid template ID');
      }

      // Verify template exists
      const existingTemplate = await TemplateModel.findById(templateId);
      if (!existingTemplate) {
        throw ApiError.notFound('Template not found');
      }

      // If updating template code, check if new code already exists
      if (updates.template_code && updates.template_code !== existingTemplate.template_code) {
        const codeExists = await TemplateModel.codeExists(
          existingTemplate.parish_id,
          updates.template_code,
          templateId
        );
        if (codeExists) {
          throw ApiError.badRequest(`Template code '${updates.template_code}' already exists for this parish`);
        }
      }

      const template = await TemplateModel.update(templateId, updates);

      res.json({
        success: true,
        message: 'Template updated successfully',
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete template (soft delete)
   */
  public static async delete(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const templateId = parseInt(req.params.id);

      if (isNaN(templateId)) {
        throw ApiError.badRequest('Invalid template ID');
      }

      // Verify template exists
      const template = await TemplateModel.findById(templateId);
      if (!template) {
        throw ApiError.notFound('Template not found');
      }

      await TemplateModel.delete(templateId);

      res.json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
