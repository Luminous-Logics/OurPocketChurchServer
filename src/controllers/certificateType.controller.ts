import { Request, Response, NextFunction } from 'express';
import { CertificateTypeModel } from '../models/CertificateType';
import { TemplateModel } from '../models/Template';
import { ParishModel } from '../models/Parish';
import { ApiError } from '../utils/apiError';
import { IAuthRequest } from '../types';

export class CertificateTypeController {
  /**
   * Get all certificate types for a specific parish with pagination
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

      const certificateTypes = await CertificateTypeModel.findByParishId(parishId, page, limit, activeOnly);
      const totalRecords = await CertificateTypeModel.countByParishId(parishId, activeOnly);
      const totalPages = Math.ceil(totalRecords / limit);

      res.json({
        success: true,
        data: certificateTypes,
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
   * Get certificate type by ID
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificateTypeId = parseInt(req.params.id);

      if (isNaN(certificateTypeId)) {
        throw ApiError.badRequest('Invalid certificate type ID');
      }

      const certificateType = await CertificateTypeModel.findById(certificateTypeId);

      if (!certificateType) {
        throw ApiError.notFound('Certificate type not found');
      }

      res.json({
        success: true,
        data: certificateType,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new certificate type
   */
  public static async create(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const certTypeData = req.body;

      // Add created_by from authenticated user
      certTypeData.created_by = req.user?.user_id;

      // Verify parish exists
      const parish = await ParishModel.findById(certTypeData.parish_id);
      if (!parish) {
        throw ApiError.badRequest('Parish not found');
      }

      // Verify template exists and belongs to the same parish
      const template = await TemplateModel.findById(certTypeData.template_id);
      if (!template) {
        throw ApiError.badRequest('Template not found');
      }
      if (Number(template.parish_id) !== Number(certTypeData.parish_id)) {
        throw ApiError.badRequest('Template must belong to the same parish');
      }

      // Check if type code already exists for this parish
      const codeExists = await CertificateTypeModel.codeExists(certTypeData.parish_id, certTypeData.type_code);
      if (codeExists) {
        throw ApiError.badRequest(`Certificate type code '${certTypeData.type_code}' already exists for this parish`);
      }

      const certificateType = await CertificateTypeModel.create(certTypeData);

      res.status(201).json({
        success: true,
        message: 'Certificate type created successfully',
        data: certificateType,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update certificate type
   */
  public static async update(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificateTypeId = parseInt(req.params.id);
      const updates = req.body;

      if (isNaN(certificateTypeId)) {
        throw ApiError.badRequest('Invalid certificate type ID');
      }

      // Verify certificate type exists
      const existingCertType = await CertificateTypeModel.findById(certificateTypeId);
      if (!existingCertType) {
        throw ApiError.notFound('Certificate type not found');
      }

      // If updating template, verify it exists and belongs to the same parish
      if (updates.template_id) {
        const template = await TemplateModel.findById(updates.template_id);
        if (!template) {
          throw ApiError.badRequest('Template not found');
        }
        if (template.parish_id !== existingCertType.parish_id) {
          throw ApiError.badRequest('Template must belong to the same parish');
        }
      }

      // If updating type code, check if new code already exists
      if (updates.type_code && updates.type_code !== existingCertType.type_code) {
        const codeExists = await CertificateTypeModel.codeExists(
          existingCertType.parish_id,
          updates.type_code,
          certificateTypeId
        );
        if (codeExists) {
          throw ApiError.badRequest(`Certificate type code '${updates.type_code}' already exists for this parish`);
        }
      }

      const certificateType = await CertificateTypeModel.update(certificateTypeId, updates);

      res.json({
        success: true,
        message: 'Certificate type updated successfully',
        data: certificateType,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete certificate type (soft delete)
   */
  public static async delete(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificateTypeId = parseInt(req.params.id);

      if (isNaN(certificateTypeId)) {
        throw ApiError.badRequest('Invalid certificate type ID');
      }

      // Verify certificate type exists
      const certificateType = await CertificateTypeModel.findById(certificateTypeId);
      if (!certificateType) {
        throw ApiError.notFound('Certificate type not found');
      }

      await CertificateTypeModel.delete(certificateTypeId);

      res.json({
        success: true,
        message: 'Certificate type deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
