import database from '../config/database';
import {
  ICertificate,
  ICertificateInput,
  ICertificateUpdate,
  CertificateStatus,
  ICertificateHistory,
} from '../types';

export class CertificateModel {
  /**
   * Get all certificates for a parish with pagination
   */
  public static async findByParishId(
    parishId: number,
    page: number = 1,
    limit: number = 50,
    status?: CertificateStatus
  ): Promise<ICertificate[]> {
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        c.*,
        ct.type_name,
        ct.prefix,
        p.first_name,
        p.last_name
      FROM certificates c
      LEFT JOIN certificate_types ct ON c.certificate_type_id = ct.certificate_type_id
      LEFT JOIN parishioners p ON c.parishioner_id = p.parishioner_id
      WHERE c.parish_id = @parishId
    `;

    const params: Record<string, any> = {
      parishId,
      limit,
      offset,
    };

    if (status) {
      query += ' AND c.status = @status';
      params.status = status;
    }

    query += ' ORDER BY c.created_at DESC LIMIT @limit OFFSET @offset';

    const result = await database.executeQuery<ICertificate>(query, params);
    return result.rows;
  }

  /**
   * Count certificates for a parish
   */
  public static async countByParishId(parishId: number, status?: CertificateStatus): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM certificates WHERE parish_id = @parishId';
    const params: Record<string, any> = { parishId };

    if (status) {
      query += ' AND status = @status';
      params.status = status;
    }

    const result = await database.executeQuery<{ count: string }>(query, params);
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  /**
   * Get certificate by ID
   */
  public static async findById(certificateId: number): Promise<ICertificate | null> {
    const result = await database.executeQuery<ICertificate>(
      `SELECT
        c.*,
        ct.type_name,
        ct.prefix,
        t.template_name,
        t.html_content,
        t.placeholders,
        p.first_name,
        p.last_name
       FROM certificates c
       LEFT JOIN certificate_types ct ON c.certificate_type_id = ct.certificate_type_id
       LEFT JOIN templates t ON ct.template_id = t.template_id
       LEFT JOIN parishioners p ON c.parishioner_id = p.parishioner_id
       WHERE c.certificate_id = @certificateId`,
      { certificateId }
    );

    return result.rows[0] || null;
  }

  /**
   * Get certificate by certificate number
   */
  public static async findByCertificateNumber(certificateNumber: string): Promise<ICertificate | null> {
    const result = await database.executeQuery<ICertificate>(
      `SELECT
        c.*,
        ct.type_name,
        ct.prefix,
        p.first_name,
        p.last_name
       FROM certificates c
       LEFT JOIN certificate_types ct ON c.certificate_type_id = ct.certificate_type_id
       LEFT JOIN parishioners p ON c.parishioner_id = p.parishioner_id
       WHERE c.certificate_number = @certificateNumber`,
      { certificateNumber }
    );

    return result.rows[0] || null;
  }

  /**
   * Create new certificate
   */
  public static async create(certificateData: ICertificateInput): Promise<ICertificate> {
    const result = await database.executeQuery<ICertificate>(
      `INSERT INTO certificates (
        parish_id, certificate_type_id, certificate_number, parishioner_id,
        placeholder_values, pdf_url, pdf_key, status,
        issued_by, issued_at, created_by
      )
      VALUES (
        @parishId, @certificateTypeId, @certificateNumber, @parishionerId,
        @placeholderValues::jsonb, @pdfUrl, @pdfKey, @status::certificate_status_enum,
        @issuedBy, @issuedAt, @createdBy
      )
      RETURNING *`,
      {
        parishId: certificateData.parish_id,
        certificateTypeId: certificateData.certificate_type_id,
        certificateNumber: certificateData.certificate_number,
        parishionerId: certificateData.parishioner_id || null,
        placeholderValues: JSON.stringify(certificateData.placeholder_values),
        pdfUrl: certificateData.pdf_url || null,
        pdfKey: certificateData.pdf_key || null,
        status: certificateData.status || 'issued',
        issuedBy: certificateData.issued_by || null,
        issuedAt: certificateData.issued_at || new Date(),
        createdBy: certificateData.created_by || null,
      }
    );

    return result.rows[0];
  }

  /**
   * Update certificate
   */
  public static async update(certificateId: number, updates: ICertificateUpdate): Promise<ICertificate> {
    const setClauses: string[] = [];
    const params: Record<string, any> = { certificateId };

    if (updates.status !== undefined) {
      setClauses.push('status = @status::certificate_status_enum');
      params.status = updates.status;
    }
    if (updates.placeholder_values !== undefined) {
      setClauses.push('placeholder_values = @placeholderValues::jsonb');
      params.placeholderValues = JSON.stringify(updates.placeholder_values);
    }
    if (updates.pdf_url !== undefined) {
      setClauses.push('pdf_url = @pdfUrl');
      params.pdfUrl = updates.pdf_url;
    }
    if (updates.pdf_key !== undefined) {
      setClauses.push('pdf_key = @pdfKey');
      params.pdfKey = updates.pdf_key;
    }
    if (updates.notes !== undefined) {
      setClauses.push('notes = @notes');
      params.notes = updates.notes;
    }
    if (updates.approved_by !== undefined) {
      setClauses.push('approved_by = @approvedBy, approved_at = NOW()');
      params.approvedBy = updates.approved_by;
    }

    if (setClauses.length === 0) {
      return this.findById(certificateId) as Promise<ICertificate>;
    }

    setClauses.push('updated_at = NOW()');

    const result = await database.executeQuery<ICertificate>(
      `UPDATE certificates
       SET ${setClauses.join(', ')}
       WHERE certificate_id = @certificateId
       RETURNING *`,
      params
    );

    if (!result.rows[0]) {
      throw new Error('Certificate not found');
    }

    return result.rows[0];
  }

  /**
   * Revoke certificate
   */
  public static async revoke(
    certificateId: number,
    revokedBy: number,
    revocationReason: string
  ): Promise<void> {
    await database.executeQuery(
      `UPDATE certificates
       SET status = 'revoked'::certificate_status_enum,
           revoked_by = @revokedBy,
           revoked_at = NOW(),
           revocation_reason = @revocationReason,
           updated_at = NOW()
       WHERE certificate_id = @certificateId`,
      { certificateId, revokedBy, revocationReason }
    );
  }

  /**
   * Add certificate history entry
   */
  public static async addHistory(historyData: {
    certificate_id: number;
    action: string;
    old_status?: CertificateStatus;
    new_status?: CertificateStatus;
    changes?: Record<string, any>;
    performed_by?: number;
    ip_address?: string;
    user_agent?: string;
    notes?: string;
  }): Promise<ICertificateHistory> {
    const result = await database.executeQuery<ICertificateHistory>(
      `INSERT INTO certificate_history (
        certificate_id, action, old_status, new_status, changes,
        performed_by, ip_address, user_agent, notes
      )
      VALUES (
        @certificateId, @action, @oldStatus::certificate_status_enum, @newStatus::certificate_status_enum,
        @changes::jsonb, @performedBy, @ipAddress, @userAgent, @notes
      )
      RETURNING *`,
      {
        certificateId: historyData.certificate_id,
        action: historyData.action,
        oldStatus: historyData.old_status || null,
        newStatus: historyData.new_status || null,
        changes: historyData.changes ? JSON.stringify(historyData.changes) : null,
        performedBy: historyData.performed_by || null,
        ipAddress: historyData.ip_address || null,
        userAgent: historyData.user_agent || null,
        notes: historyData.notes || null,
      }
    );

    return result.rows[0];
  }

  /**
   * Get certificate history
   */
  public static async getHistory(certificateId: number): Promise<ICertificateHistory[]> {
    const result = await database.executeQuery<ICertificateHistory>(
      `SELECT
        ch.*,
        u.first_name,
        u.last_name
       FROM certificate_history ch
       LEFT JOIN users u ON ch.performed_by = u.user_id
       WHERE ch.certificate_id = @certificateId
       ORDER BY ch.performed_at DESC`,
      { certificateId }
    );

    return result.rows;
  }
}
