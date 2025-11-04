import database from '../config/database';

export interface IEmailLog {
  log_id: number;
  template_id?: number;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  body_html?: string;
  body_text?: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  provider?: string;
  provider_message_id?: string;
  error_message?: string;
  sent_at?: Date;
  delivered_at?: Date;
  opened_at?: Date;
  clicked_at?: Date;
  variables?: string; // JSON string
  retry_count: number;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface ICreateEmailLog {
  template_id?: number;
  recipient_email: string;
  recipient_name?: string;
  subject: string;
  body_html?: string;
  body_text?: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  provider?: string;
  provider_message_id?: string;
  error_message?: string;
  variables?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export class EmailLogModel {
  /**
   * Create email log entry
   */
  public static async create(log: ICreateEmailLog): Promise<IEmailLog> {
    const variablesJson = log.variables ? JSON.stringify(log.variables) : null;

    const result = await database.executeQuery<IEmailLog>(
      `INSERT INTO email_logs (
          template_id, recipient_email, recipient_name, subject, body_html, body_text,
          status, provider, provider_message_id, error_message, variables, ip_address, user_agent
        )
        VALUES (
          @templateId, @recipientEmail, @recipientName, @subject, @bodyHtml, @bodyText,
          @status, @provider, @providerMessageId, @errorMessage, @variables, @ipAddress, @userAgent
        )
        RETURNING *`,
      {
        templateId: log.template_id || null,
        recipientEmail: log.recipient_email,
        recipientName: log.recipient_name || null,
        subject: log.subject,
        bodyHtml: log.body_html || null,
        bodyText: log.body_text || null,
        status: log.status,
        provider: log.provider || null,
        providerMessageId: log.provider_message_id || null,
        errorMessage: log.error_message || null,
        variables: variablesJson,
        ipAddress: log.ip_address || null,
        userAgent: log.user_agent || null
      }
    );

    return result.rows[0];
  }

  /**
   * Update email log status
   */
  public static async updateStatus(
    logId: number,
    status: 'sent' | 'failed' | 'bounced',
    errorMessage?: string,
    providerMessageId?: string
  ): Promise<void> {
    const setClauses = ['status = @status'];
    const params: Record<string, any> = { logId, status };

    if (status === 'sent') {
      setClauses.push('sent_at = NOW()');
    }

    if (errorMessage) {
      setClauses.push('error_message = @errorMessage');
      params.errorMessage = errorMessage;
    }

    if (providerMessageId) {
      setClauses.push('provider_message_id = @providerMessageId');
      params.providerMessageId = providerMessageId;
    }

    await database.executeQuery(
      `UPDATE email_logs
      SET ${setClauses.join(', ')}
      WHERE log_id = @logId`,
      params
    );
  }

  /**
   * Increment retry count
   */
  public static async incrementRetryCount(logId: number): Promise<void> {
    await database.executeQuery(
      'UPDATE email_logs SET retry_count = retry_count + 1 WHERE log_id = @logId',
      { logId }
    );
  }

  /**
   * Get email logs with pagination
   */
  public static async getAll(
    page: number = 1,
    limit: number = 50,
    status?: string
  ): Promise<{ logs: IEmailLog[]; total: number }> {
    const offset = (page - 1) * limit;

    const whereClause = status ? 'WHERE status = @status' : '';
    const params: Record<string, any> = { limit, offset };

    if (status) {
      params.status = status;
    }

    const [logsResult, countResult] = await Promise.all([
      database.executeQuery<IEmailLog>(
        `SELECT * FROM email_logs
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT @limit OFFSET @offset`,
        params
      ),
      database.executeQuery<{ count: number }>(
        `SELECT COUNT(*) as count FROM email_logs ${whereClause}`,
        status ? { status } : {}
      )
    ]);

    return {
      logs: logsResult.rows,
      total: parseInt(countResult.rows[0].count as any, 10)
    };
  }

  /**
   * Get logs by email address
   */
  public static async getByEmail(email: string, limit: number = 10): Promise<IEmailLog[]> {
    const result = await database.executeQuery<IEmailLog>(
      `SELECT * FROM email_logs
        WHERE recipient_email = @email
        ORDER BY created_at DESC
        LIMIT @limit`,
      { email, limit }
    );

    return result.rows;
  }

  /**
   * Get email statistics
   */
  public static async getStats(days: number = 7): Promise<any> {
    const result = await database.executeQuery(
      `SELECT
          COUNT(*) as total_emails,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
          SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced_count,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
        FROM email_logs
        WHERE created_at >= NOW() - INTERVAL '@days days'`,
      { days }
    );

    return result.rows[0];
  }

  /**
   * Clean up old logs (older than X days)
   */
  public static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const result = await database.executeQuery(
      `DELETE FROM email_logs
        WHERE created_at < NOW() - INTERVAL '@daysToKeep days'`,
      { daysToKeep }
    );

    return result.rowCount || 0;
  }
}
