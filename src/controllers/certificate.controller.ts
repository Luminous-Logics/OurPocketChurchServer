import { Response, NextFunction } from 'express';
import { IAuthRequest, CertificateStatus } from '../types';
import { CertificateModel } from '../models/Certificate';
import { ApiError } from '../utils/apiError';

/**
 * Certificate Controller
 * Handles all certificate-related HTTP requests
 */
export class CertificateController {
  /**
   * Get all certificates for a parish
   * GET /api/certificates/parish/:parishId
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

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      // Build filters
      const filters: any = {};

      if (req.query.certificateTypeId) {
        filters.certificateTypeId = parseInt(req.query.certificateTypeId as string);
      }

      if (req.query.status) {
        filters.status = req.query.status as CertificateStatus;
      }

      if (req.query.recipientName) {
        filters.recipientName = req.query.recipientName as string;
      }

      if (req.query.issueDateFrom) {
        filters.issueDateFrom = new Date(req.query.issueDateFrom as string);
      }

      if (req.query.issueDateTo) {
        filters.issueDateTo = new Date(req.query.issueDateTo as string);
      }

      // Get certificates and total count
      const certificates = await CertificateModel.findByParishId(
        parishId,
        page,
        limit,
        filters
      );

      const totalRecords = await CertificateModel.countByParishId(parishId, filters);
      const totalPages = Math.ceil(totalRecords / limit);

      res.json({
        success: true,
        data: certificates,
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
   * Get a single certificate by ID
   * GET /api/certificates/:id
   */
  public static async getById(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const certificateId = parseInt(req.params.id);

      if (isNaN(certificateId)) {
        throw ApiError.badRequest('Invalid certificate ID');
      }

      const certificate = await CertificateModel.findById(certificateId);

      if (!certificate) {
        throw ApiError.notFound('Certificate not found');
      }

      res.json({
        success: true,
        data: certificate,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a certificate by certificate number
   * GET /api/certificates/number/:certificateNumber
   */
  public static async getByNumber(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const certificateNumber = req.params.certificateNumber;

      const certificate = await CertificateModel.findByNumber(certificateNumber);

      if (!certificate) {
        throw ApiError.notFound('Certificate not found');
      }

      res.json({
        success: true,
        data: certificate,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new certificate
   * POST /api/certificates
   */
  public static async create(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const certificateData = {
        ...req.body,
        issued_by: req.user?.user_id,
      };

      const newCertificate = await CertificateModel.create(certificateData);

      res.status(201).json({
        success: true,
        message: 'Certificate created successfully',
        data: newCertificate,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a certificate
   * PUT /api/certificates/:id
   */
  public static async update(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const certificateId = parseInt(req.params.id);

      if (isNaN(certificateId)) {
        throw ApiError.badRequest('Invalid certificate ID');
      }

      const updatedCertificate = await CertificateModel.update(
        certificateId,
        req.body,
        req.user?.user_id
      );

      res.json({
        success: true,
        message: 'Certificate updated successfully',
        data: updatedCertificate,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve a certificate
   * POST /api/certificates/:id/approve
   */
  public static async approve(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const certificateId = parseInt(req.params.id);

      if (isNaN(certificateId)) {
        throw ApiError.badRequest('Invalid certificate ID');
      }

      if (!req.user?.user_id) {
        throw ApiError.unauthorized('User not authenticated');
      }

      const approvedCertificate = await CertificateModel.approve(
        certificateId,
        req.user.user_id
      );

      res.json({
        success: true,
        message: 'Certificate approved successfully',
        data: approvedCertificate,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke a certificate
   * POST /api/certificates/:id/revoke
   */
  public static async revoke(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const certificateId = parseInt(req.params.id);
      const { reason } = req.body;

      if (isNaN(certificateId)) {
        throw ApiError.badRequest('Invalid certificate ID');
      }

      if (!req.user?.user_id) {
        throw ApiError.unauthorized('User not authenticated');
      }

      const revokedCertificate = await CertificateModel.revoke(
        certificateId,
        req.user.user_id,
        reason
      );

      res.json({
        success: true,
        message: 'Certificate revoked successfully',
        data: revokedCertificate,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get certificate history
   * GET /api/certificates/:id/history
   */
  public static async getHistory(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const certificateId = parseInt(req.params.id);

      if (isNaN(certificateId)) {
        throw ApiError.badRequest('Invalid certificate ID');
      }

      const history = await CertificateModel.getHistory(certificateId);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a certificate (only drafts)
   * DELETE /api/certificates/:id
   */
  public static async delete(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const certificateId = parseInt(req.params.id);

      if (isNaN(certificateId)) {
        throw ApiError.badRequest('Invalid certificate ID');
      }

      await CertificateModel.delete(certificateId);

      res.json({
        success: true,
        message: 'Certificate deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
