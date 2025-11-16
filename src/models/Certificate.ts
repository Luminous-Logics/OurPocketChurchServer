import database from '../config/database';
import {
  ICertificate,
  ICertificateInput,
  ICertificateUpdate,
  CertificateStatus,
} from '../types';
import { ApiError } from '../utils/apiError';

/**
 * Certificate Model
 * Handles all database operations for certificates
 */
export class CertificateModel {
  /**
   * Replace placeholders in template HTML with actual values
   */
  private static replacePlaceholders(
    htmlContent: string,
    placeholderData: Record<string, any>
  ): string {
    let result = htmlContent;

    // Replace all {{placeholder}} with actual values
    Object.entries(placeholderData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value || ''));
    });

    return result;
  }

  /**
   * Generate certificate number
   */
  private static async generateCertificateNumber(
    parishId: number,
    certificateTypeId: number
  ): Promise<string> {
    try {
      const result = await database.executeQuery<{ generate_certificate_number: string }>(
        `SELECT generate_certificate_number(@parishId, @certificateTypeId) as generate_certificate_number`,
        { parishId, certificateTypeId }
      );

      const certNumber = result.rows[0]?.generate_certificate_number;

      if (!certNumber) {
        throw new Error('Failed to generate certificate number');
      }

      return certNumber;
    } catch (error) {
      console.error('Error generating certificate number:', error);
      throw ApiError.internal('Failed to generate certificate number');
    }
  }

  /**
   * Log certificate history
   */
  private static async logHistory(
    certificateId: number,
    action: string,
    performedBy: number | undefined,
    oldStatus?: string,
    newStatus?: string,
    changedFields?: string[],
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    reason?: string
  ): Promise<void> {
    try {
      const params: Record<string, any> = {
        certificateId,
        action,
        oldStatus: oldStatus || null,
        newStatus: newStatus || null,
        changedFields: changedFields ? JSON.stringify(changedFields) : null,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        performedBy: performedBy || null,
        reason: reason || null,
      };

      await database.executeQuery(
        `INSERT INTO certificate_history
         (certificate_id, action, old_status, new_status, changed_fields, old_values, new_values, performed_by, reason)
         VALUES (@certificateId, @action, @oldStatus, @newStatus, @changedFields, @oldValues, @newValues, @performedBy, @reason)`,
        params
      );
    } catch (error) {
      console.error('Error logging certificate history:', error);
      // Don't throw - logging failure shouldn't stop the operation
    }
  }

  /**
   * Find a certificate by ID
   */
  public static async findById(certificateId: number): Promise<ICertificate | null> {
    try {
      const result = await database.executeQuery<ICertificate>(
        `SELECT c.*,
                ct.type_name as certificate_type_name,
                t.template_name
         FROM certificates c
         LEFT JOIN certificate_types ct ON c.certificate_type_id = ct.certificate_type_id
         LEFT JOIN templates t ON c.template_id = t.template_id
         WHERE c.certificate_id = @certificateId`,
        { certificateId }
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding certificate by ID:', error);
      throw ApiError.internal('Failed to retrieve certificate');
    }
  }

  /**
   * Find certificates by parish ID
   */
  public static async findByParishId(
    parishId: number,
    page: number = 1,
    limit: number = 20,
    filters?: {
      certificateTypeId?: number;
      status?: CertificateStatus;
      recipientName?: string;
      issueDateFrom?: Date;
      issueDateTo?: Date;
    }
  ): Promise<ICertificate[]> {
    try {
      const offset = (page - 1) * limit;

      let query = `
        SELECT c.*,
               ct.type_name as certificate_type_name,
               t.template_name,
               u.first_name || ' ' || u.last_name as issued_by_name
        FROM certificates c
        LEFT JOIN certificate_types ct ON c.certificate_type_id = ct.certificate_type_id
        LEFT JOIN templates t ON c.template_id = t.template_id
        LEFT JOIN users u ON c.issued_by = u.user_id
        WHERE c.parish_id = @parishId
      `;

      const params: Record<string, any> = { parishId, limit, offset };

      if (filters?.certificateTypeId) {
        query += ` AND c.certificate_type_id = @certificateTypeId`;
        params.certificateTypeId = filters.certificateTypeId;
      }

      if (filters?.status) {
        query += ` AND c.status = @status`;
        params.status = filters.status;
      }

      if (filters?.recipientName) {
        query += ` AND c.recipient_name ILIKE @recipientName`;
        params.recipientName = `%${filters.recipientName}%`;
      }

      if (filters?.issueDateFrom) {
        query += ` AND c.issue_date >= @issueDateFrom`;
        params.issueDateFrom = filters.issueDateFrom;
      }

      if (filters?.issueDateTo) {
        query += ` AND c.issue_date <= @issueDateTo`;
        params.issueDateTo = filters.issueDateTo;
      }

      query += ` ORDER BY c.created_at DESC LIMIT @limit OFFSET @offset`;

      const result = await database.executeQuery<ICertificate>(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error finding certificates by parish ID:', error);
      throw ApiError.internal('Failed to retrieve certificates');
    }
  }

  /**
   * Count certificates for a parish
   */
  public static async countByParishId(
    parishId: number,
    filters?: {
      certificateTypeId?: number;
      status?: CertificateStatus;
      recipientName?: string;
      issueDateFrom?: Date;
      issueDateTo?: Date;
    }
  ): Promise<number> {
    try {
      let query = `
        SELECT COUNT(*) as count
        FROM certificates
        WHERE parish_id = @parishId
      `;

      const params: Record<string, any> = { parishId };

      if (filters?.certificateTypeId) {
        query += ` AND certificate_type_id = @certificateTypeId`;
        params.certificateTypeId = filters.certificateTypeId;
      }

      if (filters?.status) {
        query += ` AND status = @status`;
        params.status = filters.status;
      }

      if (filters?.recipientName) {
        query += ` AND recipient_name ILIKE @recipientName`;
        params.recipientName = `%${filters.recipientName}%`;
      }

      if (filters?.issueDateFrom) {
        query += ` AND issue_date >= @issueDateFrom`;
        params.issueDateFrom = filters.issueDateFrom;
      }

      if (filters?.issueDateTo) {
        query += ` AND issue_date <= @issueDateTo`;
        params.issueDateTo = filters.issueDateTo;
      }

      const result = await database.executeQuery<{ count: string }>(query, params);
      return parseInt(result.rows[0]?.count || '0', 10);
    } catch (error) {
      console.error('Error counting certificates:', error);
      throw ApiError.internal('Failed to count certificates');
    }
  }

  /**
   * Find certificate by certificate number
   */
  public static async findByNumber(certificateNumber: string): Promise<ICertificate | null> {
    try {
      const result = await database.executeQuery<ICertificate>(
        `SELECT c.*,
                ct.type_name as certificate_type_name,
                t.template_name
         FROM certificates c
         LEFT JOIN certificate_types ct ON c.certificate_type_id = ct.certificate_type_id
         LEFT JOIN templates t ON c.template_id = t.template_id
         WHERE c.certificate_number = @certificateNumber`,
        { certificateNumber }
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding certificate by number:', error);
      throw ApiError.internal('Failed to retrieve certificate');
    }
  }

  /**
   * Create a new certificate
   */
  public static async create(certificateData: ICertificateInput): Promise<ICertificate> {
    try {
      // Validate parish exists
      const parishExists = await database.executeQuery(
        `SELECT parish_id FROM parishes WHERE parish_id = @parishId`,
        { parishId: certificateData.parish_id }
      );

      if (parishExists.rows.length === 0) {
        throw ApiError.notFound('Parish not found');
      }

      // Validate certificate type exists and belongs to parish
      const certTypeResult = await database.executeQuery(
        `SELECT * FROM certificate_types
         WHERE certificate_type_id = @typeId AND parish_id = @parishId`,
        { typeId: certificateData.certificate_type_id, parishId: certificateData.parish_id }
      );

      if (certTypeResult.rows.length === 0) {
        throw ApiError.notFound('Certificate type not found or does not belong to this parish');
      }

      const certType = certTypeResult.rows[0];

      // Generate or validate certificate number
      let certificateNumber = certificateData.certificate_number;
      if (!certificateNumber) {
        if (certType.auto_generate_number) {
          certificateNumber = await this.generateCertificateNumber(
            certificateData.parish_id,
            certificateData.certificate_type_id
          );
        } else {
          throw ApiError.badRequest('Certificate number is required');
        }
      } else {
        // Check if certificate number already exists
        const existingCert = await this.findByNumber(certificateNumber);
        if (existingCert) {
          throw ApiError.conflict('Certificate number already exists');
        }
      }

      // Get template HTML if template_id is provided
      let generatedHtml: string | undefined;
      if (certificateData.template_id) {
        const templateResult = await database.executeQuery(
          `SELECT html_content FROM templates
           WHERE template_id = @templateId AND parish_id = @parishId`,
          { templateId: certificateData.template_id, parishId: certificateData.parish_id }
        );

        if (templateResult.rows.length === 0) {
          throw ApiError.notFound('Template not found or does not belong to this parish');
        }

        // Replace placeholders in template
        const htmlContent = templateResult.rows[0].html_content;
        generatedHtml = this.replacePlaceholders(htmlContent, {
          ...certificateData.certificate_data,
          certificate_number: certificateNumber,
          recipient_name: certificateData.recipient_name,
        });
      }

      // Build insert query
      const fields: string[] = [
        'parish_id',
        'certificate_type_id',
        'certificate_number',
        'recipient_name',
        'certificate_data',
        'issue_date',
      ];

      const params: Record<string, any> = {
        parish_id: certificateData.parish_id,
        certificate_type_id: certificateData.certificate_type_id,
        certificate_number: certificateNumber,
        recipient_name: certificateData.recipient_name,
        certificate_data: JSON.stringify(certificateData.certificate_data),
        issue_date: certificateData.issue_date,
      };

      if (certificateData.recipient_parishioner_id) {
        fields.push('recipient_parishioner_id');
        params.recipient_parishioner_id = certificateData.recipient_parishioner_id;
      }

      if (certificateData.template_id) {
        fields.push('template_id');
        params.template_id = certificateData.template_id;
      }

      if (generatedHtml) {
        fields.push('generated_html');
        params.generated_html = generatedHtml;
      }

      if (certificateData.seal_image_url) {
        fields.push('seal_image_url');
        params.seal_image_url = certificateData.seal_image_url;
      }

      if (certificateData.signature_image_url) {
        fields.push('signature_image_url');
        params.signature_image_url = certificateData.signature_image_url;
      }

      if (certificateData.signed_by) {
        fields.push('signed_by');
        params.signed_by = certificateData.signed_by;
      }

      if (certificateData.signed_by_user_id) {
        fields.push('signed_by_user_id');
        params.signed_by_user_id = certificateData.signed_by_user_id;
      }

      if (certificateData.issued_by) {
        fields.push('issued_by');
        params.issued_by = certificateData.issued_by;
      }

      if (certificateData.status) {
        fields.push('status');
        params.status = certificateData.status;
      }

      if (certificateData.notes) {
        fields.push('notes');
        params.notes = certificateData.notes;
      }

      if (certificateData.is_public !== undefined) {
        fields.push('is_public');
        params.is_public = certificateData.is_public;
      }

      const fieldNames = fields.join(', ');
      const fieldPlaceholders = fields.map(f => `@${f}`).join(', ');

      const query = `
        INSERT INTO certificates (${fieldNames})
        VALUES (${fieldPlaceholders})
        RETURNING *
      `;

      const result = await database.executeQuery<ICertificate>(query, params);
      const newCertificate = result.rows[0];

      // Log history
      await this.logHistory(
        newCertificate.certificate_id,
        'created',
        certificateData.issued_by,
        undefined,
        newCertificate.status
      );

      return newCertificate;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error creating certificate:', error);
      throw ApiError.internal('Failed to create certificate');
    }
  }

  /**
   * Update a certificate
   */
  public static async update(
    certificateId: number,
    updateData: ICertificateUpdate,
    userId?: number
  ): Promise<ICertificate> {
    try {
      const existingCert = await this.findById(certificateId);
      if (!existingCert) {
        throw ApiError.notFound('Certificate not found');
      }

      // Prevent updating issued or revoked certificates without proper workflow
      if (
        existingCert.status === CertificateStatus.ISSUED ||
        existingCert.status === CertificateStatus.REVOKED
      ) {
        if (
          updateData.status &&
          updateData.status !== existingCert.status &&
          updateData.status !== CertificateStatus.REVOKED
        ) {
          throw ApiError.badRequest(
            'Cannot update issued or revoked certificates. Please use revoke endpoint instead.'
          );
        }
      }

      const updateFields: string[] = [];
      const params: Record<string, any> = { certificateId };
      const changedFields: string[] = [];
      const oldValues: Record<string, any> = {};
      const newValues: Record<string, any> = {};

      // Track changes for history
      const trackChange = (field: string, oldValue: any, newValue: any) => {
        changedFields.push(field);
        oldValues[field] = oldValue;
        newValues[field] = newValue;
      };

      if (updateData.recipient_parishioner_id !== undefined) {
        updateFields.push('recipient_parishioner_id = @recipient_parishioner_id');
        params.recipient_parishioner_id = updateData.recipient_parishioner_id;
        trackChange(
          'recipient_parishioner_id',
          existingCert.recipient_parishioner_id,
          updateData.recipient_parishioner_id
        );
      }

      if (updateData.recipient_name !== undefined) {
        updateFields.push('recipient_name = @recipient_name');
        params.recipient_name = updateData.recipient_name;
        trackChange('recipient_name', existingCert.recipient_name, updateData.recipient_name);
      }

      if (updateData.template_id !== undefined) {
        updateFields.push('template_id = @template_id');
        params.template_id = updateData.template_id;
        trackChange('template_id', existingCert.template_id, updateData.template_id);
      }

      if (updateData.certificate_data !== undefined) {
        updateFields.push('certificate_data = @certificate_data');
        params.certificate_data = JSON.stringify(updateData.certificate_data);
        trackChange('certificate_data', existingCert.certificate_data, updateData.certificate_data);

        // Regenerate HTML if template exists
        if (existingCert.template_id || updateData.template_id) {
          const templateId = updateData.template_id || existingCert.template_id;
          const templateResult = await database.executeQuery(
            `SELECT html_content FROM templates WHERE template_id = @templateId`,
            { templateId }
          );

          if (templateResult.rows.length > 0) {
            const generatedHtml = this.replacePlaceholders(templateResult.rows[0].html_content, {
              ...updateData.certificate_data,
              certificate_number: existingCert.certificate_number,
              recipient_name: updateData.recipient_name || existingCert.recipient_name,
            });

            updateFields.push('generated_html = @generated_html');
            params.generated_html = generatedHtml;
          }
        }
      }

      if (updateData.generated_html !== undefined) {
        updateFields.push('generated_html = @generated_html');
        params.generated_html = updateData.generated_html;
      }

      if (updateData.seal_image_url !== undefined) {
        updateFields.push('seal_image_url = @seal_image_url');
        params.seal_image_url = updateData.seal_image_url;
        trackChange('seal_image_url', existingCert.seal_image_url, updateData.seal_image_url);
      }

      if (updateData.signature_image_url !== undefined) {
        updateFields.push('signature_image_url = @signature_image_url');
        params.signature_image_url = updateData.signature_image_url;
        trackChange(
          'signature_image_url',
          existingCert.signature_image_url,
          updateData.signature_image_url
        );
      }

      if (updateData.signed_by !== undefined) {
        updateFields.push('signed_by = @signed_by');
        params.signed_by = updateData.signed_by;
        trackChange('signed_by', existingCert.signed_by, updateData.signed_by);
      }

      if (updateData.signed_by_user_id !== undefined) {
        updateFields.push('signed_by_user_id = @signed_by_user_id');
        params.signed_by_user_id = updateData.signed_by_user_id;
        trackChange('signed_by_user_id', existingCert.signed_by_user_id, updateData.signed_by_user_id);
      }

      if (updateData.issue_date !== undefined) {
        updateFields.push('issue_date = @issue_date');
        params.issue_date = updateData.issue_date;
        trackChange('issue_date', existingCert.issue_date, updateData.issue_date);
      }

      if (updateData.status !== undefined) {
        updateFields.push('status = @status');
        params.status = updateData.status;
        trackChange('status', existingCert.status, updateData.status);
      }

      if (updateData.notes !== undefined) {
        updateFields.push('notes = @notes');
        params.notes = updateData.notes;
        trackChange('notes', existingCert.notes, updateData.notes);
      }

      if (updateData.is_public !== undefined) {
        updateFields.push('is_public = @is_public');
        params.is_public = updateData.is_public;
        trackChange('is_public', existingCert.is_public, updateData.is_public);
      }

      if (updateFields.length === 0) {
        throw ApiError.badRequest('No fields to update');
      }

      const query = `
        UPDATE certificates
        SET ${updateFields.join(', ')}
        WHERE certificate_id = @certificateId
        RETURNING *
      `;

      const result = await database.executeQuery<ICertificate>(query, params);
      const updatedCertificate = result.rows[0];

      // Log history
      await this.logHistory(
        certificateId,
        'updated',
        userId,
        existingCert.status,
        updatedCertificate.status,
        changedFields,
        oldValues,
        newValues
      );

      return updatedCertificate;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error updating certificate:', error);
      throw ApiError.internal('Failed to update certificate');
    }
  }

  /**
   * Approve a certificate
   */
  public static async approve(
    certificateId: number,
    approvedBy: number
  ): Promise<ICertificate> {
    try {
      const existingCert = await this.findById(certificateId);
      if (!existingCert) {
        throw ApiError.notFound('Certificate not found');
      }

      if (existingCert.status !== CertificateStatus.PENDING_APPROVAL) {
        throw ApiError.badRequest('Only pending certificates can be approved');
      }

      const query = `
        UPDATE certificates
        SET status = @status,
            approved_by = @approvedBy,
            approved_at = CURRENT_TIMESTAMP
        WHERE certificate_id = @certificateId
        RETURNING *
      `;

      const result = await database.executeQuery<ICertificate>(query, {
        certificateId,
        status: CertificateStatus.APPROVED,
        approvedBy,
      });

      // Log history
      await this.logHistory(
        certificateId,
        'approved',
        approvedBy,
        existingCert.status,
        CertificateStatus.APPROVED
      );

      return result.rows[0];
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error approving certificate:', error);
      throw ApiError.internal('Failed to approve certificate');
    }
  }

  /**
   * Revoke a certificate
   */
  public static async revoke(
    certificateId: number,
    revokedBy: number,
    reason: string
  ): Promise<ICertificate> {
    try {
      const existingCert = await this.findById(certificateId);
      if (!existingCert) {
        throw ApiError.notFound('Certificate not found');
      }

      if (existingCert.status === CertificateStatus.REVOKED) {
        throw ApiError.badRequest('Certificate is already revoked');
      }

      const query = `
        UPDATE certificates
        SET status = @status,
            revoked_by = @revokedBy,
            revoked_at = CURRENT_TIMESTAMP,
            revocation_reason = @reason
        WHERE certificate_id = @certificateId
        RETURNING *
      `;

      const result = await database.executeQuery<ICertificate>(query, {
        certificateId,
        status: CertificateStatus.REVOKED,
        revokedBy,
        reason,
      });

      // Log history
      await this.logHistory(
        certificateId,
        'revoked',
        revokedBy,
        existingCert.status,
        CertificateStatus.REVOKED,
        undefined,
        undefined,
        undefined,
        reason
      );

      return result.rows[0];
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error revoking certificate:', error);
      throw ApiError.internal('Failed to revoke certificate');
    }
  }

  /**
   * Get certificate history
   */
  public static async getHistory(certificateId: number): Promise<any[]> {
    try {
      const result = await database.executeQuery(
        `SELECT ch.*,
                u.first_name || ' ' || u.last_name as performed_by_name
         FROM certificate_history ch
         LEFT JOIN users u ON ch.performed_by = u.user_id
         WHERE ch.certificate_id = @certificateId
         ORDER BY ch.performed_at DESC`,
        { certificateId }
      );

      return result.rows;
    } catch (error) {
      console.error('Error getting certificate history:', error);
      throw ApiError.internal('Failed to retrieve certificate history');
    }
  }

  /**
   * Delete a certificate (hard delete - only for drafts)
   */
  public static async delete(certificateId: number): Promise<void> {
    try {
      const existingCert = await this.findById(certificateId);
      if (!existingCert) {
        throw ApiError.notFound('Certificate not found');
      }

      if (existingCert.status !== CertificateStatus.DRAFT) {
        throw ApiError.badRequest('Only draft certificates can be deleted');
      }

      await database.executeQuery(
        `DELETE FROM certificates WHERE certificate_id = @certificateId`,
        { certificateId }
      );
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error('Error deleting certificate:', error);
      throw ApiError.internal('Failed to delete certificate');
    }
  }
}
