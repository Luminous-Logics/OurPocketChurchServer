import multer from 'multer';
import { Request } from 'express';

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  audio: 50 * 1024 * 1024, // 50MB for audio files
  photos: 10 * 1024 * 1024, // 10MB for images
  pdfs: 20 * 1024 * 1024, // 20MB for PDFs
};

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a'],
  photos: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  pdfs: ['application/pdf'],
};

// File filter function
const fileFilter = (category: 'audio' | 'photos' | 'pdfs') => {
  return (_req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
    const allowedTypes = ALLOWED_MIME_TYPES[category];

    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error(`Invalid file type. Only ${allowedTypes.join(', ')} are allowed for ${category}.`));
    }
  };
};

// General file filter for mixed uploads (auto-detect category)
const generalFileFilter = (_req: Request, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
  const allAllowedTypes = [
    ...ALLOWED_MIME_TYPES.audio,
    ...ALLOWED_MIME_TYPES.photos,
    ...ALLOWED_MIME_TYPES.pdfs,
  ];

  if (allAllowedTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error(`Invalid file type. Allowed types: audio, images, or PDFs.`));
  }
};

// Configure multer for memory storage (we'll upload to R2 from memory)
const createUploader = (category: 'audio' | 'photos' | 'pdfs' | 'general') => {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: category === 'general'
        ? Math.max(...Object.values(FILE_SIZE_LIMITS))
        : FILE_SIZE_LIMITS[category as keyof typeof FILE_SIZE_LIMITS],
    },
    fileFilter: category === 'general' ? generalFileFilter : fileFilter(category as 'audio' | 'photos' | 'pdfs'),
  });
};

// Export individual uploaders
export const uploadAudio = createUploader('audio');
export const uploadPhoto = createUploader('photos');
export const uploadPDF = createUploader('pdfs');
export const uploadGeneral = createUploader('general');

// Export for single and multiple files
export const uploadSingleAudio = uploadAudio.single('audio');
export const uploadSinglePhoto = uploadPhoto.single('photo');
export const uploadSinglePDF = uploadPDF.single('pdf');
export const uploadSingleFile = uploadGeneral.single('file');

export const uploadMultipleAudios = uploadAudio.array('audios', 10);
export const uploadMultiplePhotos = uploadPhoto.array('photos', 10);
export const uploadMultiplePDFs = uploadPDF.array('pdfs', 10);
export const uploadMultipleFiles = uploadGeneral.array('files', 10);

// Export file size limits for validation
export { FILE_SIZE_LIMITS, ALLOWED_MIME_TYPES };
