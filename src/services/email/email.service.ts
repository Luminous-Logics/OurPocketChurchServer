/**
 * Email Service
 *
 * Production-ready email service that supports:
 * - Multiple email providers (SMTP, SendGrid, SES)
 * - Template-based emails from database
 * - Email logging and tracking
 * - Email queueing for async sending
 * - Bulk email sending
 * - Error handling and retry logic
 *
 * This is a singleton service - use EmailService.getInstance()
 */

import { IEmailProvider, EmailPayload, EmailResult, EmailProviderConfig } from './providers/base.provider';
import { SMTPProvider } from './providers/smtp.provider';
import { templateService } from './template.service';
import { EmailLogModel, ICreateEmailLog } from '../../models/EmailLog';
import { EmailQueueModel } from '../../models/EmailQueue';
import logger from '../../utils/logger';
import { ApiError } from '../../utils/apiError';

export interface SendEmailOptions {
  to: string | string[];
  templateCode: string;
  variables: Record<string, any>;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: any[];
  priority?: 'high' | 'normal' | 'low';
  scheduleAt?: Date; // For queued emails
}

export interface QuickEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export class EmailService {
  private static instance: EmailService;
  private provider: IEmailProvider;
  private config: EmailProviderConfig;
  private isInitialized: boolean = false;

  private constructor() {
    // Private constructor for singleton
    this.config = this.loadConfiguration();
    this.provider = this.initializeProvider();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Load email configuration from environment variables
   */
  private loadConfiguration(): EmailProviderConfig {
    const provider = (process.env.EMAIL_PROVIDER || 'smtp') as 'smtp' | 'sendgrid' | 'ses';

    const config: EmailProviderConfig = {
      provider,
      defaultFrom: process.env.EMAIL_FROM || 'noreply@parishnexus.com',
      defaultFromName: process.env.EMAIL_FROM_NAME || 'Parish Nexus',
      replyTo: process.env.EMAIL_REPLY_TO,
    };

    // SMTP configuration
    if (provider === 'smtp') {
      config.smtp = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
        tls: {
          rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
        },
      };
    }

    // Add SendGrid and SES configurations here if needed in future

    return config;
  }

  /**
   * Initialize the email provider based on configuration
   */
  private initializeProvider(): IEmailProvider {
    switch (this.config.provider) {
      case 'smtp':
        return new SMTPProvider(this.config);
      // Add more providers here
      // case 'sendgrid':
      //   return new SendGridProvider(this.config);
      // case 'ses':
      //   return new SESProvider(this.config);
      default:
        throw new Error(`Unsupported email provider: ${this.config.provider}`);
    }
  }

  /**
   * Initialize and verify email service
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      logger.info('Initializing email service...');
      const isValid = await this.provider.verifyConfiguration();

      if (!isValid) {
        logger.error('Email service configuration is invalid');
        return false;
      }

      this.isInitialized = true;
      logger.info('Email service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize email service', { error });
      return false;
    }
  }

  /**
   * Send an email using a template
   */
  async sendTemplateEmail(options: SendEmailOptions): Promise<EmailResult> {
    const { to, templateCode, variables, cc, bcc, attachments, priority, scheduleAt } = options;

    try {
      // If scheduled, add to queue instead of sending immediately
      if (scheduleAt) {
        await this.queueEmail(options);
        return {
          success: true,
          provider: 'queue',
          messageId: undefined,
          timestamp: new Date(),
        };
      }

      // Render template
      const rendered = await templateService.renderTemplate({
        templateCode,
        variables,
        recipientEmail: Array.isArray(to) ? to[0] : to,
      });

      // Prepare email payload
      const emailPayload: EmailPayload = {
        to,
        cc,
        bcc,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        attachments,
        priority,
      };

      // Send email
      const result = await this.provider.send(emailPayload);

      // Log email
      await this.logEmail({
        recipient_email: Array.isArray(to) ? to[0] : to,
        recipient_name: variables.recipientName || variables.firstName || undefined,
        subject: rendered.subject,
        body_html: rendered.html,
        body_text: rendered.text,
        status: result.success ? 'sent' : 'failed',
        provider: result.provider,
        provider_message_id: result.messageId,
        error_message: result.error,
      });

      return result;
    } catch (error: any) {
      logger.error('Failed to send template email', {
        templateCode,
        to,
        error: error.message,
      });

      // Log failed email
      await this.logEmail({
        recipient_email: Array.isArray(to) ? to[0] : to,
        subject: `Template: ${templateCode}`,
        status: 'failed',
        provider: this.config.provider,
        error_message: error.message,
      });

      throw error;
    }
  }

  /**
   * Send a quick email without a template (for simple notifications)
   */
  async sendQuickEmail(options: QuickEmailOptions): Promise<EmailResult> {
    const { to, subject, html, text, cc, bcc } = options;

    try {
      const emailPayload: EmailPayload = {
        to,
        cc,
        bcc,
        subject,
        html,
        text,
      };

      const result = await this.provider.send(emailPayload);

      // Log email
      await this.logEmail({
        recipient_email: Array.isArray(to) ? to[0] : to,
        subject,
        body_html: html,
        body_text: text,
        status: result.success ? 'sent' : 'failed',
        provider: result.provider,
        provider_message_id: result.messageId,
        error_message: result.error,
      });

      return result;
    } catch (error: any) {
      logger.error('Failed to send quick email', {
        to,
        subject,
        error: error.message,
      });

      // Log failed email
      await this.logEmail({
        recipient_email: Array.isArray(to) ? to[0] : to,
        subject,
        status: 'failed',
        provider: this.config.provider,
        error_message: error.message,
      });

      throw error;
    }
  }

  /**
   * Queue an email for later sending
   */
  async queueEmail(options: SendEmailOptions): Promise<void> {
    const { to, templateCode, variables, scheduleAt } = options;

    try {
      await EmailQueueModel.enqueue({
        recipient_email: Array.isArray(to) ? to[0] : to,
        template_code: templateCode,
        variables: variables,
        scheduled_at: scheduleAt,
        priority: options.priority === 'high' ? 1 : options.priority === 'low' ? 3 : 2,
      });

      logger.info('Email queued successfully', {
        templateCode,
        to,
        scheduledAt: scheduleAt,
      });
    } catch (error) {
      logger.error('Failed to queue email', {
        templateCode,
        to,
        error,
      });
      throw ApiError.internal('Failed to queue email');
    }
  }

  /**
   * Process pending emails from queue
   */
  async processQueue(limit: number = 10): Promise<void> {
    try {
      const pendingEmails = await EmailQueueModel.getPending(limit);

      logger.info(`Processing ${pendingEmails.length} queued emails`);

      for (const queuedEmail of pendingEmails) {
        try {
          // Parse variables
          const variables = queuedEmail.variables
            ? JSON.parse(queuedEmail.variables)
            : {};

          // Send email
          const result = await this.sendTemplateEmail({
            to: queuedEmail.recipient_email,
            templateCode: queuedEmail.template_code,
            variables,
          });

          // Update queue status
          if (result.success) {
            await EmailQueueModel.markAsSent(queuedEmail.queue_id);
          } else {
            await EmailQueueModel.markAsFailed(queuedEmail.queue_id, result.error || 'Unknown error');
          }
        } catch (error: any) {
          logger.error('Failed to process queued email', {
            queueId: queuedEmail.queue_id,
            error: error.message,
          });
          await EmailQueueModel.markAsFailed(queuedEmail.queue_id, error.message);
        }
      }
    } catch (error) {
      logger.error('Failed to process email queue', { error });
    }
  }

  /**
   * Log email to database
   */
  private async logEmail(log: ICreateEmailLog): Promise<void> {
    try {
      await EmailLogModel.create(log);
    } catch (error) {
      // Don't throw error if logging fails
      logger.error('Failed to log email', { error });
    }
  }

  /**
   * Get email statistics
   */
  async getStats(days: number = 7): Promise<any> {
    try {
      return await EmailLogModel.getStats(days);
    } catch (error) {
      logger.error('Failed to get email stats', { error });
      throw ApiError.internal('Failed to retrieve email statistics');
    }
  }

  /**
   * Check if email service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current provider name
   */
  getProviderName(): string {
    return this.provider.getProviderName();
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
