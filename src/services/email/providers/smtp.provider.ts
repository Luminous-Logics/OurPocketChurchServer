/**
 * SMTP Email Provider
 *
 * Production-ready SMTP email provider using nodemailer.
 * Supports all standard SMTP servers (Gmail, Outlook, custom SMTP, etc.)
 */

import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';
import {
  IEmailProvider,
  EmailPayload,
  EmailResult,
  BulkEmailResult,
  EmailProviderConfig,
} from './base.provider';
import logger from '../../../utils/logger';

export class SMTPProvider implements IEmailProvider {
  private transporter: Transporter | null = null;
  private config: EmailProviderConfig;

  constructor(config: EmailProviderConfig) {
    this.config = config;
    this.initializeTransporter();
  }

  /**
   * Initialize nodemailer transporter
   */
  private initializeTransporter(): void {
    if (!this.config.smtp) {
      throw new Error('SMTP configuration is required for SMTPProvider');
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.smtp.host,
        port: this.config.smtp.port,
        secure: this.config.smtp.secure, // true for 465, false for other ports
        auth: {
          user: this.config.smtp.auth.user,
          pass: this.config.smtp.auth.pass,
        },
        tls: this.config.smtp.tls || {
          rejectUnauthorized: false, // Accept self-signed certificates
        },
      });

      logger.info('SMTP transporter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SMTP transporter', { error });
      throw error;
    }
  }

  /**
   * Send a single email via SMTP
   */
  async send(email: EmailPayload): Promise<EmailResult> {
    if (!this.transporter) {
      return {
        success: false,
        provider: 'smtp',
        error: 'SMTP transporter not initialized',
        timestamp: new Date(),
      };
    }

    try {
      // Prepare email options
      const mailOptions = {
        from: email.from || `${this.config.defaultFromName || 'Parish Nexus'} <${this.config.defaultFrom}>`,
        to: Array.isArray(email.to) ? email.to.join(', ') : email.to,
        cc: email.cc ? (Array.isArray(email.cc) ? email.cc.join(', ') : email.cc) : undefined,
        bcc: email.bcc ? (Array.isArray(email.bcc) ? email.bcc.join(', ') : email.bcc) : undefined,
        replyTo: email.replyTo || this.config.replyTo,
        subject: email.subject,
        html: email.html,
        text: email.text,
        attachments: email.attachments,
        headers: email.headers,
        priority: email.priority || 'normal',
      };

      // Send email
      const info: SentMessageInfo = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully via SMTP', {
        messageId: info.messageId,
        to: email.to,
        subject: email.subject,
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: 'smtp',
        response: info,
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error('Failed to send email via SMTP', {
        error: error.message,
        to: email.to,
        subject: email.subject,
      });

      return {
        success: false,
        provider: 'smtp',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Send multiple emails in bulk
   */
  async sendBulk(emails: EmailPayload[]): Promise<BulkEmailResult> {
    const results: EmailResult[] = [];
    let successful = 0;
    let failed = 0;

    logger.info(`Starting bulk email send: ${emails.length} emails`);

    for (const email of emails) {
      const result = await this.send(email);
      results.push(result);

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Add small delay to avoid overwhelming the SMTP server
      await this.delay(100);
    }

    logger.info('Bulk email send completed', {
      total: emails.length,
      successful,
      failed,
    });

    return {
      total: emails.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Verify SMTP configuration
   */
  async verifyConfiguration(): Promise<boolean> {
    if (!this.transporter) {
      logger.error('SMTP transporter not initialized');
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('SMTP configuration verified successfully');
      return true;
    } catch (error: any) {
      logger.error('SMTP configuration verification failed', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'smtp';
  }

  /**
   * Close the SMTP connection
   */
  close(): void {
    if (this.transporter) {
      this.transporter.close();
      logger.info('SMTP transporter closed');
    }
  }

  /**
   * Delay helper for bulk sending
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
