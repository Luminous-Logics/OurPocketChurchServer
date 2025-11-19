import { Request, Response, NextFunction } from 'express';
import { CertificateModel } from '../models/Certificate';
import { CertificateTypeModel } from '../models/CertificateType';
import { ParishModel } from '../models/Parish';
import { ApiError } from '../utils/apiError';
import { IAuthRequest, CertificateStatus } from '../types';
import { certificateService } from '../services/certificate.service';

export class CertificateController {
  /**
   * Get all certificates for a specific parish with pagination
   */
  public static async getByParishId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parishId = parseInt(req.params.parishId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as CertificateStatus | undefined;

      if (isNaN(parishId)) {
        throw ApiError.badRequest('Invalid parish ID');
      }

      // Verify parish exists
      const parish = await ParishModel.findById(parishId);
      if (!parish) {
        throw ApiError.notFound('Parish not found');
      }

      const certificates = await CertificateModel.findByParishId(parishId, page, limit, status);
      const totalRecords = await CertificateModel.countByParishId(parishId, status);
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
   * Get certificate by ID
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
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
   * Issue a new certificate
   */
  public static async issue(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        parish_id,
        certificate_type_id,
        parishioner_id,
        placeholder_values,
      } = req.body;

      const userId = req.user?.user_id;

      // Verify parish exists
      const parish = await ParishModel.findById(parish_id);
      if (!parish) {
        throw ApiError.badRequest('Parish not found');
      }

      // Get certificate type with template details
      const certificateType = await CertificateTypeModel.findById(certificate_type_id);
      if (!certificateType) {
        throw ApiError.badRequest('Certificate type not found');
      }

      if (+certificateType.parish_id !== +parish_id) {
        throw ApiError.badRequest('Certificate type does not belong to this parish');
      }

      if (!certificateType.html_content) {
        throw ApiError.badRequest('Certificate type does not have a template');
      }

      // Validate placeholder values
      const placeholders = (certificateType.placeholders as string[]) || [];
      const validation = certificateService.validatePlaceholders(placeholders, placeholder_values);

      if (!validation.valid) {
        throw ApiError.badRequest(`Missing required placeholders: ${validation.missing.join(', ')}`);
      }

      // Generate certificate number
      const certificateNumber = await certificateService.generateCertificateNumber(certificate_type_id);

      // Save certificate to database (PDF will be generated on-demand when downloading)
      const certificate = await CertificateModel.create({
        parish_id,
        certificate_type_id,
        certificate_number: certificateNumber,
        parishioner_id,
        placeholder_values,
        status: 'issued' as CertificateStatus,
        issued_by: userId,
        issued_at: new Date(),
        created_by: userId,
      });

      // Add history entry
      await CertificateModel.addHistory({
        certificate_id: certificate.certificate_id,
        action: 'issued',
        new_status: 'issued' as CertificateStatus,
        performed_by: userId,
        notes: 'Certificate issued',
      });

      res.status(201).json({
        success: true,
        message: 'Certificate issued successfully',
        data: certificate,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download certificate PDF (generates on-demand)
   */
  public static async download(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificateId = parseInt(req.params.id);

      if (isNaN(certificateId)) {
        throw ApiError.badRequest('Invalid certificate ID');
      }

      const certificate = await CertificateModel.findById(certificateId);

      if (!certificate) {
        throw ApiError.notFound('Certificate not found');
      }

      // Get certificate type with template details
      const certificateType = await CertificateTypeModel.findById(certificate.certificate_type_id);

      if (!certificateType || !certificateType.html_content) {
        throw ApiError.badRequest('Certificate template not found');
      }

      // Generate PDF on-demand
      const placeholderValues = certificate.placeholder_values as Record<string, unknown>;
      const pdfBuffer = await certificateService.generateCertificatePdf(
        certificateType.html_content,
        placeholderValues,
        certificate.certificate_number
      );

      // Add history entry for download
      await CertificateModel.addHistory({
        certificate_id: certificateId,
        action: 'downloaded',
        performed_by: req.user?.user_id,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        notes: 'Certificate downloaded',
      });

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${certificate.certificate_number}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke certificate
   */
  public static async revoke(req: IAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificateId = parseInt(req.params.id);
      const { revocation_reason } = req.body;

      if (isNaN(certificateId)) {
        throw ApiError.badRequest('Invalid certificate ID');
      }

      const certificate = await CertificateModel.findById(certificateId);

      if (!certificate) {
        throw ApiError.notFound('Certificate not found');
      }

      if (certificate.status === 'revoked') {
        throw ApiError.badRequest('Certificate is already revoked');
      }

      await CertificateModel.revoke(certificateId, req.user?.user_id || 0, revocation_reason);

      // Add history entry
      await CertificateModel.addHistory({
        certificate_id: certificateId,
        action: 'revoked',
        old_status: certificate.status as CertificateStatus,
        new_status: 'revoked' as CertificateStatus,
        performed_by: req.user?.user_id,
        notes: revocation_reason,
      });

      res.json({
        success: true,
        message: 'Certificate revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get certificate history
   */
  public static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificateId = parseInt(req.params.id);

      if (isNaN(certificateId)) {
        throw ApiError.badRequest('Invalid certificate ID');
      }

      const certificate = await CertificateModel.findById(certificateId);

      if (!certificate) {
        throw ApiError.notFound('Certificate not found');
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
}
