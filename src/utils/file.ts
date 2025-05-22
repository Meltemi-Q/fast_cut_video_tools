import { MediaFile } from '@/types';
import { FILE_CONSTRAINTS, ERROR_MESSAGES } from '@/constants';

/**
 * 验证文件类型是否支持
 */
export function validateFileType(file: File): { isValid: boolean; error?: string } {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (!extension) {
    return { isValid: false, error: ERROR_MESSAGES.UNSUPPORTED_FORMAT };
  }

  const allSupportedFormats = [
    ...FILE_CONSTRAINTS.SUPPORTED_VIDEO_FORMATS,
    ...FILE_CONSTRAINTS.SUPPORTED_IMAGE_FORMATS,
    ...FILE_CONSTRAINTS.SUPPORTED_GIF_FORMATS,
  ];

  if (!allSupportedFormats.includes(extension)) {
    return { isValid: false, error: ERROR_MESSAGES.UNSUPPORTED_FORMAT };
  }

  return { isValid: true };
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File): { isValid: boolean; error?: string } {
  if (file.size > FILE_CONSTRAINTS.MAX_SIZE) {
    return { isValid: false, error: ERROR_MESSAGES.FILE_TOO_LARGE };
  }
  return { isValid: true };
}

/**
 * 获取文件类型
 */
export function getFileType(file: File): 'video' | 'image' | 'gif' {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension && FILE_CONSTRAINTS.SUPPORTED_VIDEO_FORMATS.includes(extension)) {
    return 'video';
  }
  if (extension && FILE_CONSTRAINTS.SUPPORTED_GIF_FORMATS.includes(extension)) {
    return 'gif';
  }
  return 'image';
}

/**
 * 获取媒体文件的尺寸和时长信息
 */
export function getMediaInfo(file: File): Promise<{
  dimensions: { width: number; height: number };
  duration?: number;
}> {
  return new Promise((resolve, reject) => {
    const fileType = getFileType(file);
    const url = URL.createObjectURL(file);

    if (fileType === 'video' || fileType === 'gif') {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        resolve({
          dimensions: {
            width: video.videoWidth,
            height: video.videoHeight,
          },
          duration: video.duration,
        });
        URL.revokeObjectURL(url);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video metadata'));
      };
      
      video.src = url;
    } else {
      // 图片文件
      const img = new Image();
      
      img.onload = () => {
        resolve({
          dimensions: {
            width: img.naturalWidth,
            height: img.naturalHeight,
          },
        });
        URL.revokeObjectURL(url);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    }
  });
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化时长（秒转换为 mm:ss 格式）
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * 创建MediaFile对象
 */
export async function createMediaFile(file: File): Promise<MediaFile> {
  // 验证文件
  const typeValidation = validateFileType(file);
  if (!typeValidation.isValid) {
    throw new Error(typeValidation.error);
  }
  
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.isValid) {
    throw new Error(sizeValidation.error);
  }

  try {
    const mediaInfo = await getMediaInfo(file);
    
    return {
      id: generateId(),
      name: file.name,
      type: getFileType(file),
      file,
      url: URL.createObjectURL(file),
      duration: mediaInfo.duration,
      dimensions: mediaInfo.dimensions,
      size: file.size,
      createdAt: new Date(),
    };
  } catch (error) {
    throw new Error('Failed to process media file');
  }
}

/**
 * 生成唯一ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
} 