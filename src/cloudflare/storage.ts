/**
 * Cloudflare R2 Storage Utilities
 * 
 * This module provides utilities for working with Cloudflare R2 object storage.
 * R2 is an S3-compatible object storage service.
 * 
 * @see https://developers.cloudflare.com/r2/
 */

import type { R2Bucket, CloudflareContext } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get the R2 bucket instance from the Cloudflare context
 */
export function getStorage(context: CloudflareContext): R2Bucket {
  if (!context?.env?.STORAGE) {
    throw new Error(
      'R2 Storage not available. Make sure you have configured the STORAGE binding in wrangler.toml'
    );
  }
  return context.env.STORAGE;
}

/**
 * Uploaded file metadata
 */
export interface UploadedFile {
  /** Unique file ID */
  id: string;
  /** Original file name */
  name: string;
  /** Full path in R2 bucket */
  path: string;
  /** MIME type of the file */
  type: string;
  /** File size in bytes */
  size: number;
  /** Upload timestamp (ISO string) */
  uploadedAt: string;
  /** ETag for the uploaded object */
  etag: string;
}

/**
 * Upload options
 */
export interface UploadOptions {
  /** Custom metadata to store with the file */
  metadata?: Record<string, string>;
  /** Cache control header */
  cacheControl?: string;
  /** Content disposition header */
  contentDisposition?: string;
}

/**
 * Upload a file to R2 storage
 */
export async function uploadFile(
  bucket: R2Bucket,
  file: File | ArrayBuffer,
  path: string,
  options: UploadOptions = {}
): Promise<UploadedFile> {
  const fileId = uuidv4();
  const timestamp = new Date().toISOString();
  
  const fileName = file instanceof File ? file.name : 'file';
  const fileType = file instanceof File ? file.type : 'application/octet-stream';
  const fileSize = file instanceof File ? file.size : (file as ArrayBuffer).byteLength;
  
  // Get file content as ArrayBuffer
  const content = file instanceof File ? await file.arrayBuffer() : file;
  
  const result = await bucket.put(path, content, {
    httpMetadata: {
      contentType: fileType,
      cacheControl: options.cacheControl,
      contentDisposition: options.contentDisposition,
    },
    customMetadata: {
      originalName: fileName,
      uploadedAt: timestamp,
      fileId: fileId,
      ...options.metadata,
    },
  });
  
  return {
    id: fileId,
    name: fileName,
    path: path,
    type: fileType,
    size: fileSize,
    uploadedAt: timestamp,
    etag: result.etag,
  };
}

/**
 * Generate a storage path for patient appointment files
 */
export function getAppointmentFilePath(
  patientId: string,
  appointmentId: string,
  fileName: string
): string {
  const fileId = uuidv4();
  const extension = fileName.split('.').pop() || '';
  const safeName = `${fileId}.${extension}`;
  return `patients/${patientId}/appointments/${appointmentId}/${safeName}`;
}

/**
 * Generate a storage path for patient documents
 */
export function getPatientDocumentPath(
  patientId: string,
  fileName: string
): string {
  const fileId = uuidv4();
  const extension = fileName.split('.').pop() || '';
  const safeName = `${fileId}.${extension}`;
  return `patients/${patientId}/documents/${safeName}`;
}

/**
 * Generate a storage path for patient photos
 */
export function getPatientPhotoPath(
  patientId: string,
  fileName: string
): string {
  const fileId = uuidv4();
  const extension = fileName.split('.').pop() || '';
  const safeName = `${fileId}.${extension}`;
  return `patients/${patientId}/photos/${safeName}`;
}

/**
 * Upload a file for a patient's appointment
 */
export async function uploadAppointmentFile(
  bucket: R2Bucket,
  patientId: string,
  appointmentId: string,
  file: File,
  options: UploadOptions = {}
): Promise<UploadedFile> {
  const path = getAppointmentFilePath(patientId, appointmentId, file.name);
  return uploadFile(bucket, file, path, options);
}

/**
 * Upload a patient document
 */
export async function uploadPatientDocument(
  bucket: R2Bucket,
  patientId: string,
  file: File,
  options: UploadOptions = {}
): Promise<UploadedFile> {
  const path = getPatientDocumentPath(patientId, file.name);
  return uploadFile(bucket, file, path, options);
}

/**
 * Upload a patient photo
 */
export async function uploadPatientPhoto(
  bucket: R2Bucket,
  patientId: string,
  file: File,
  options: UploadOptions = {}
): Promise<UploadedFile> {
  const path = getPatientPhotoPath(patientId, file.name);
  return uploadFile(bucket, file, path, options);
}

/**
 * Delete a file from R2 storage
 */
export async function deleteFile(
  bucket: R2Bucket,
  path: string
): Promise<void> {
  await bucket.delete(path);
}

/**
 * Delete multiple files from R2 storage
 */
export async function deleteFiles(
  bucket: R2Bucket,
  paths: string[]
): Promise<void> {
  await bucket.delete(paths);
}

/**
 * Get a file from R2 storage
 */
export async function getFile(
  bucket: R2Bucket,
  path: string
): Promise<{ data: ArrayBuffer; metadata: UploadedFile } | null> {
  const object = await bucket.get(path);
  if (!object) {
    return null;
  }
  
  const data = await object.arrayBuffer();
  const customMetadata = object.customMetadata || {};
  
  return {
    data,
    metadata: {
      id: customMetadata.fileId || path,
      name: customMetadata.originalName || path.split('/').pop() || path,
      path: path,
      type: object.httpMetadata?.contentType || 'application/octet-stream',
      size: object.size,
      uploadedAt: customMetadata.uploadedAt || object.uploaded.toISOString(),
      etag: object.etag,
    },
  };
}

/**
 * Check if a file exists in R2 storage
 */
export async function fileExists(
  bucket: R2Bucket,
  path: string
): Promise<boolean> {
  const object = await bucket.head(path);
  return object !== null;
}

/**
 * List files in a directory
 */
export async function listFiles(
  bucket: R2Bucket,
  prefix: string,
  limit = 100
): Promise<UploadedFile[]> {
  const result = await bucket.list({
    prefix,
    limit,
  });
  
  return result.objects.map((obj) => ({
    id: obj.customMetadata?.fileId || obj.key,
    name: obj.customMetadata?.originalName || obj.key.split('/').pop() || obj.key,
    path: obj.key,
    type: obj.httpMetadata?.contentType || 'application/octet-stream',
    size: obj.size,
    uploadedAt: obj.customMetadata?.uploadedAt || obj.uploaded.toISOString(),
    etag: obj.etag,
  }));
}

/**
 * List all files for a patient
 */
export async function listPatientFiles(
  bucket: R2Bucket,
  patientId: string,
  limit = 100
): Promise<UploadedFile[]> {
  return listFiles(bucket, `patients/${patientId}/`, limit);
}

/**
 * List all files for an appointment
 */
export async function listAppointmentFiles(
  bucket: R2Bucket,
  patientId: string,
  appointmentId: string,
  limit = 100
): Promise<UploadedFile[]> {
  return listFiles(bucket, `patients/${patientId}/appointments/${appointmentId}/`, limit);
}

/**
 * Validate file type (for security)
 */
export function isAllowedFileType(
  file: File,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate file size (for security)
 */
export function isAllowedFileSize(
  file: File,
  maxSizeMB = 10
): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Validate a file before upload
 */
export function validateFile(
  file: File,
  options: {
    allowedTypes?: string[];
    maxSizeMB?: number;
  } = {}
): { valid: boolean; error?: string } {
  const {
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
    maxSizeMB = 10,
  } = options;
  
  if (!isAllowedFileType(file, allowedTypes)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }
  
  if (!isAllowedFileSize(file, maxSizeMB)) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }
  
  return { valid: true };
}
