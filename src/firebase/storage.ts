'use client';

import { storage } from './client';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll,
  UploadResult 
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  path: string;
}

/**
 * Upload a file for a patient's appointment
 */
export async function uploadAppointmentFile(
  patientId: string,
  appointmentId: string,
  file: File
): Promise<UploadedFile> {
  const fileId = uuidv4();
  const extension = file.name.split('.').pop() || '';
  const fileName = `${fileId}.${extension}`;
  const path = `patients/${patientId}/appointments/${appointmentId}/${fileName}`;
  
  const storageRef = ref(storage, path);
  const result: UploadResult = await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
    },
  });
  
  const url = await getDownloadURL(result.ref);
  
  return {
    id: fileId,
    name: file.name,
    url,
    type: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    path,
  };
}

/**
 * Upload a file for a patient's general documents
 */
export async function uploadPatientDocument(
  patientId: string,
  file: File
): Promise<UploadedFile> {
  const fileId = uuidv4();
  const extension = file.name.split('.').pop() || '';
  const fileName = `${fileId}.${extension}`;
  const path = `patients/${patientId}/documents/${fileName}`;
  
  const storageRef = ref(storage, path);
  const result = await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
    },
  });
  
  const url = await getDownloadURL(result.ref);
  
  return {
    id: fileId,
    name: file.name,
    url,
    type: file.type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    path,
  };
}

/**
 * Delete a file from storage
 */
export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(storage, path);
  await deleteObject(storageRef);
}

/**
 * Get all files in a directory
 */
export async function listFiles(path: string): Promise<string[]> {
  const storageRef = ref(storage, path);
  const result = await listAll(storageRef);
  
  const urls: string[] = [];
  for (const item of result.items) {
    const url = await getDownloadURL(item);
    urls.push(url);
  }
  
  return urls;
}
