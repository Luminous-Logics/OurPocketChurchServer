/**
 * Base Email Provider Interface
 *
 * This interface defines the contract that all email providers must implement.
 * Supports SMTP, SendGrid, AWS SES, or any custom email service.
 */

export interface EmailPayload {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
  priority?: 'high' | 'normal' | 'low';
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  cid?: string; // Content-ID for embedding images
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
  response?: any;
  timestamp: Date;
}

export interface BulkEmailResult {
  total: number;
  successful: number;
  failed: number;
  results: EmailResult[];
}

export interface EmailProviderConfig {
  provider: 'smtp' | 'sendgrid' | 'ses' | 'custom';
  defaultFrom: string;
  defaultFromName?: string;
  replyTo?: string;

  // SMTP specific
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    tls?: {
      rejectUnauthorized?: boolean;
    };
  };

  // SendGrid specific
  sendgrid?: {
    apiKey: string;
  };

  // AWS SES specific
  ses?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/**
 * Base interface that all email providers must implement
 */
export interface IEmailProvider {
  /**
   * Send a single email
   */
  send(email: EmailPayload): Promise<EmailResult>;

  /**
   * Send multiple emails
   */
  sendBulk(emails: EmailPayload[]): Promise<BulkEmailResult>;

  /**
   * Verify that the provider is configured correctly
   */
  verifyConfiguration(): Promise<boolean>;

  /**
   * Get the provider name
   */
  getProviderName(): string;
}
