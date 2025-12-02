# Firebase Storage Setup Guide

This guide explains how to set up Firebase Storage for the KAPP medical booking application to enable file uploads (medical documents, photos, etc.).

## Overview

Firebase Storage is used to securely store:
- Patient medical documents (PDF, images)
- Photos for consultations
- Medical records and test results

## Quick Setup

### 1. Enable Firebase Storage

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Build** → **Storage**
4. Click **Get Started**
5. Choose your security rules mode:
   - **Production mode** (recommended for production)
   - **Test mode** (for development only)

### 2. Configure Storage Rules

Replace the default rules with secure rules. In the Firebase Console, go to **Storage** → **Rules** and add:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Maximum file size (10MB)
    function isValidSize() {
      return request.resource.size < 10 * 1024 * 1024;
    }
    
    // Allowed file types
    function isValidContentType() {
      return request.resource.contentType.matches('image/.*') ||
             request.resource.contentType == 'application/pdf';
    }
    
    // Patient appointment attachments
    // Path: patients/{patientId}/appointments/{appointmentId}/{fileName}
    match /patients/{patientId}/appointments/{appointmentId}/{fileName} {
      // Only the patient who owns the data can read/write
      allow read: if isSignedIn() && isOwner(patientId);
      allow create: if isSignedIn() && isOwner(patientId) && isValidSize() && isValidContentType();
      allow delete: if isSignedIn() && isOwner(patientId);
    }
    
    // Patient profile documents
    // Path: patients/{patientId}/documents/{fileName}
    match /patients/{patientId}/documents/{fileName} {
      allow read: if isSignedIn() && isOwner(patientId);
      allow create: if isSignedIn() && isOwner(patientId) && isValidSize() && isValidContentType();
      allow delete: if isSignedIn() && isOwner(patientId);
    }
    
    // Patient profile photos
    // Path: patients/{patientId}/photos/{fileName}
    match /patients/{patientId}/photos/{fileName} {
      allow read: if isSignedIn() && isOwner(patientId);
      allow create: if isSignedIn() && isOwner(patientId) && isValidSize() && isValidContentType();
      allow delete: if isSignedIn() && isOwner(patientId);
    }
  }
}
```

### 3. Install Firebase Storage SDK

The Firebase SDK is already included in the project. Storage is part of the `firebase` package.

### 4. Initialize Storage in Client

Update `/src/firebase/client.ts` to include Storage:

```typescript
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';  // Add this import
import { firebaseConfig } from './config';

// Initialize Firebase
let firebaseApp: FirebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);  // Add this line

export { firebaseApp, auth, firestore, storage };  // Export storage
```

### 5. Create Storage Utilities

Create a new file `/src/firebase/storage.ts`:

```typescript
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
```

### 6. Add uuid Package

Install the uuid package for generating unique file IDs:

```bash
npm install uuid
npm install --save-dev @types/uuid
```

### 7. Create Upload Component

Create a reusable upload component `/src/components/FileUpload.tsx`:

```typescript
'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, File, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadAppointmentFile, UploadedFile } from '@/firebase/storage';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  patientId: string;
  appointmentId: string;
  onUploadComplete: (file: UploadedFile) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}

export function FileUpload({
  patientId,
  appointmentId,
  onUploadComplete,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = ['image/*', 'application/pdf'],
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: `Maximum file size is ${maxSizeMB}MB.`,
      });
      return;
    }
    
    // Validate file type
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });
    
    if (!isValidType) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload an image or PDF file.',
      });
      return;
    }
    
    setIsUploading(true);
    setProgress(0);
    
    try {
      // Simulate progress (Firebase Storage doesn't provide upload progress easily)
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);
      
      const uploadedFile = await uploadAppointmentFile(patientId, appointmentId, file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      onUploadComplete(uploadedFile);
      
      toast({
        title: 'File uploaded',
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Failed to upload file. Please try again.',
      });
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [patientId, appointmentId, maxSizeMB, acceptedTypes, onUploadComplete, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 bg-muted/30',
        isUploading && 'pointer-events-none opacity-50'
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-primary/10">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        
        {isUploading ? (
          <div className="w-full max-w-xs space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
            <Progress value={progress} />
          </div>
        ) : (
          <>
            <div>
              <h4 className="font-medium mb-1">Upload Files</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop files here, or click to browse
              </p>
              <label>
                <input
                  type="file"
                  className="sr-only"
                  accept={acceptedTypes.join(',')}
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Browse Files
                  </span>
                </Button>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Supported formats: JPG, PNG, PDF (max {maxSizeMB}MB each)
            </p>
          </>
        )}
      </div>
    </div>
  );
}
```

## Usage Example

In your appointment page component:

```typescript
import { FileUpload } from '@/components/FileUpload';
import { UploadedFile } from '@/firebase/storage';

// Inside your component:
const [attachments, setAttachments] = useState<UploadedFile[]>([]);

const handleFileUpload = async (file: UploadedFile) => {
  // Add to local state
  setAttachments(prev => [...prev, file]);
  
  // Update Firestore with the new attachment
  await updateDoc(appointmentRef, {
    attachments: arrayUnion({
      id: file.id,
      name: file.name,
      url: file.url,
      type: file.type,
      uploadedAt: file.uploadedAt,
    }),
    updatedAt: serverTimestamp(),
  });
};

// In your JSX:
<FileUpload
  patientId={user.uid}
  appointmentId={appointmentId as string}
  onUploadComplete={handleFileUpload}
/>
```

## Security Best Practices

1. **Always validate file types** - Only allow specific file types (images, PDFs)
2. **Limit file sizes** - Set maximum file size (default: 10MB)
3. **Use authenticated uploads** - Files should only be uploaded by authenticated users
4. **Restrict access** - Users should only access their own files
5. **Scan for viruses** - Consider using Cloud Functions to scan uploaded files

## Environment Variables

No additional environment variables are needed for Storage if you're using the same Firebase project.

## Troubleshooting

### "Permission denied" error

- Check that Storage rules are correctly configured
- Verify the user is authenticated
- Ensure the file path matches the rules

### File uploads failing

- Check file size is within limits
- Verify file type is allowed
- Check browser console for detailed errors

### Files not displaying

- Verify the download URL is being stored correctly
- Check CORS configuration if accessing from different domain

## CORS Configuration

If you need to access Storage from different domains, configure CORS:

1. Create a `cors.json` file:
```json
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

2. Apply CORS configuration:
```bash
gsutil cors set cors.json gs://studio-8822072999-a4137.firebasestorage.app
```

## Support

- **Firebase Storage Documentation**: https://firebase.google.com/docs/storage
- **Firebase Console**: https://console.firebase.google.com/

---

**Note**: This guide assumes you already have Firebase configured for your project. If not, please complete the Firebase setup first before configuring Storage.

## Storage Bucket Configuration

The Firebase Storage bucket for this project is:
- **Bucket URL**: `gs://studio-8822072999-a4137.firebasestorage.app`

This is already configured in `src/firebase/config.ts`.
