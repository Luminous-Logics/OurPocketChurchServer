import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import logger from '../utils/logger';

interface UploadResult {
  url: string;
  key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

class CloudflareService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    // Cloudflare R2 uses S3-compatible API
    this.s3Client = new S3Client({
      region: 'auto', // R2 uses 'auto' for region
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || '', // e.g., https://<account-id>.r2.cloudflarestorage.com
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
      },
    });

    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || '';
    this.publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || ''; // Your custom domain or R2 public URL
  }

  /**
   * Upload file to Cloudflare R2
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: 'audio' | 'photos' | 'pdfs' = 'photos'
  ): Promise<UploadResult> {
    try {
      // Generate unique file name
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const key = `${folder}/${fileName}`;

      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      // Construct public URL
      const url = `${this.publicUrl}/${key}`;

      logger.info(`File uploaded successfully: ${key}`);

      return {
        url,
        key,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      logger.error('Error uploading file to Cloudflare R2:', error);
      throw new Error('Failed to upload file to cloud storage');
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: 'audio' | 'photos' | 'pdfs' = 'photos'
  ): Promise<UploadResult[]> {
    try {
      const uploadPromises = files.map((file) => this.uploadFile(file, folder));
      return await Promise.all(uploadPromises);
    } catch (error) {
      logger.error('Error uploading multiple files:', error);
      throw new Error('Failed to upload files to cloud storage');
    }
  }

  /**
   * Delete file from Cloudflare R2
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      logger.info(`File deleted successfully: ${key}`);
    } catch (error) {
      logger.error('Error deleting file from Cloudflare R2:', error);
      throw new Error('Failed to delete file from cloud storage');
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(keys: string[]): Promise<void> {
    try {
      const deletePromises = keys.map((key) => this.deleteFile(key));
      await Promise.all(deletePromises);
    } catch (error) {
      logger.error('Error deleting multiple files:', error);
      throw new Error('Failed to delete files from cloud storage');
    }
  }

  /**
   * Generate presigned URL for temporary access (optional - for private files)
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  /**
   * Validate file type
   */
  isValidFileType(mimetype: string, category: 'audio' | 'photos' | 'pdfs'): boolean {
    const validTypes: Record<string, string[]> = {
      audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a'],
      photos: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      pdfs: ['application/pdf'],
    };

    return validTypes[category]?.includes(mimetype) || false;
  }

  /**
   * Get file category from mimetype
   */
  getFileCategory(mimetype: string): 'audio' | 'photos' | 'pdfs' | null {
    if (mimetype.startsWith('audio/')) return 'audio';
    if (mimetype.startsWith('image/')) return 'photos';
    if (mimetype === 'application/pdf') return 'pdfs';
    return null;
  }
}

export default new CloudflareService();
