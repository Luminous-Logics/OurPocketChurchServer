import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';
import { CertificateTypeModel } from '../models/CertificateType';
import { ApiError } from '../utils/apiError';

/**
 * Certificate Type Controller
 * Handles all certificate type-related HTTP requests
 */
export class CertificateTypeController {
  /**
   * Get all certificate types for a parish
   * GET /api/certificates/types/parish/:parishId
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
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      // Get certificate types and total count
      const certificateTypes = await CertificateTypeModel.findByParishId(
        parishId,
        page,
        limit,
        isActive
      );

      const totalRecords = await CertificateTypeModel.countByParishId(parishId, isActive);
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
   * Get a single certificate type by ID
   * GET /api/certificates/types/:id
   */
  public static async getById(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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
   * POST /api/certificates/types
   */
  public static async create(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const certificateTypeData = {
        ...req.body,
        created_by: req.user?.user_id,
      };

      const newCertificateType = await CertificateTypeModel.create(certificateTypeData);

      res.status(201).json({
        success: true,
        message: 'Certificate type created successfully',
        data: newCertificateType,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a certificate type
   * PUT /api/certificates/types/:id
   */
  public static async update(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const certificateTypeId = parseInt(req.params.id);

      if (isNaN(certificateTypeId)) {
        throw ApiError.badRequest('Invalid certificate type ID');
      }

      const updatedCertificateType = await CertificateTypeModel.update(
        certificateTypeId,
        req.body
      );

      res.json({
        success: true,
        message: 'Certificate type updated successfully',
        data: updatedCertificateType,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a certificate type (soft delete)
   * DELETE /api/certificates/types/:id
   */
  public static async delete(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const certificateTypeId = parseInt(req.params.id);

      if (isNaN(certificateTypeId)) {
        throw ApiError.badRequest('Invalid certificate type ID');
      }

      await CertificateTypeModel.softDelete(certificateTypeId);

      res.json({
        success: true,
        message: 'Certificate type deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Permanently delete a certificate type
   * DELETE /api/certificates/types/:id/permanent
   */
  public static async hardDelete(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const certificateTypeId = parseInt(req.params.id);

      if (isNaN(certificateTypeId)) {
        throw ApiError.badRequest('Invalid certificate type ID');
      }

      await CertificateTypeModel.hardDelete(certificateTypeId);

      res.json({
        success: true,
        message: 'Certificate type permanently deleted',
      });
    } catch (error) {
      next(error);
    }
  }
}
