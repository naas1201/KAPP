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
