import { useState, useCallback } from 'react';
import { MediaFile, UploadProgress } from '@/types';
import { createMediaFile } from '@/utils/file';

export interface UseFileUploadReturn {
  isUploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
  uploadFile: (file: File) => Promise<MediaFile | null>;
  uploadFiles: (files: FileList) => Promise<MediaFile[]>;
  clearError: () => void;
  reset: () => void;
}

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(null);
    setError(null);
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<MediaFile | null> => {
    setIsUploading(true);
    setError(null);
    
    const fileId = Date.now().toString();
    
    // 初始化进度
    setProgress({
      fileId,
      progress: 0,
      status: 'uploading',
    });

    try {
      // 模拟上传进度
      setProgress(prev => prev ? { ...prev, progress: 25 } : null);
      
      // 处理文件
      setProgress(prev => prev ? { ...prev, progress: 50, status: 'processing' } : null);
      
      const mediaFile = await createMediaFile(file);
      
      // 完成上传
      setProgress(prev => prev ? { ...prev, progress: 100, status: 'completed' } : null);
      
      // 短暂延迟后清除进度
      setTimeout(() => {
        setProgress(null);
        setIsUploading(false);
      }, 500);
      
      return mediaFile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '上传失败';
      setError(errorMessage);
      setProgress(prev => prev ? { ...prev, status: 'error', error: errorMessage } : null);
      setIsUploading(false);
      return null;
    }
  }, []);

  const uploadFiles = useCallback(async (files: FileList): Promise<MediaFile[]> => {
    const fileArray = Array.from(files);
    const results: MediaFile[] = [];
    
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const mediaFile = await uploadFile(file);
        if (mediaFile) {
          results.push(mediaFile);
        }
      } catch (err) {
        console.error(`Failed to upload file ${file.name}:`, err);
      }
    }
    
    return results;
  }, [uploadFile]);

  return {
    isUploading,
    progress,
    error,
    uploadFile,
    uploadFiles,
    clearError,
    reset,
  };
} 