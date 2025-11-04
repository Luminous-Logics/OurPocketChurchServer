import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  connectionTimeoutMillis: number;
  idleTimeoutMillis: number;
  max: number;
  min: number;
}

interface JwtConfig {
  secret: string;
  expiresIn: string;
}

interface CorsConfig {
  origin: string | string[];
  credentials: boolean;
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

interface UploadConfig {
  maxFileSize: number;
  uploadPath: string;
  allowedMimeTypes: string[];
}

interface LoggingConfig {
  level: string;
  filePath: string;
}

interface PaginationConfig {
  defaultPageSize: number;
  maxPageSize: number;
}

interface EmailConfig {
  host?: string;
  port: number;
  user?: string;
  password?: string;
  from?: string;
}

interface Config {
  env: string;
  port: number;
  apiVersion: string;
  database: DatabaseConfig;
  jwt: JwtConfig;
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
  upload: UploadConfig;
  logging: LoggingConfig;
  pagination: PaginationConfig;
  email: EmailConfig;
}

const config: Config = {
  // Server configuration
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiVersion: process.env.API_VERSION || 'v1',

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'ParishNexusFlow',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    max: 10,
    min: 0,
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d', // 3 minutes for testing (change back to '30d' for production)
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN?.includes(',')
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : (process.env.CORS_ORIGIN || '*'),
    credentials: true,
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },

  // Pagination
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
  },

  // Email configuration
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  },
};

export default config;
