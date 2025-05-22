// 视频处理工具函数

/**
 * 从视频中生成缩略图
 * @param videoUrl 视频URL
 * @param currentTime 截取时间点（秒）
 * @param width 缩略图宽度
 * @param height 缩略图高度
 * @returns Promise<string> 返回缩略图的data URL
 */
export function generateVideoThumbnail(
  videoUrl: string,
  currentTime: number = 0,
  width: number = 320,
  height: number = 180
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('无法获取Canvas上下文'));
      return;
    }

    video.addEventListener('loadedmetadata', () => {
      // 设置canvas尺寸
      canvas.width = width;
      canvas.height = height;
      
      // 设置视频播放时间
      video.currentTime = Math.min(currentTime, video.duration);
    });

    video.addEventListener('seeked', () => {
      try {
        // 绘制视频帧到canvas
        ctx.drawImage(video, 0, 0, width, height);
        
        // 获取缩略图数据URL
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailDataUrl);
      } catch (error) {
        reject(error);
      }
    });

    video.addEventListener('error', () => {
      reject(new Error('视频加载失败'));
    });

    // 设置视频属性
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.src = videoUrl;
  });
}

/**
 * 从视频中生成裁剪区域的缩略图
 * @param videoUrl 视频URL
 * @param currentTime 截取时间点（秒）
 * @param cropArea 裁剪区域 {x, y, width, height}
 * @param outputWidth 输出宽度
 * @param outputHeight 输出高度
 * @returns Promise<string> 返回裁剪缩略图的data URL
 */
export function generateCroppedThumbnail(
  videoUrl: string,
  currentTime: number,
  cropArea: { x: number; y: number; width: number; height: number },
  outputWidth: number = 320,
  outputHeight: number = 180
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('无法获取Canvas上下文'));
      return;
    }

    video.addEventListener('loadedmetadata', () => {
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      video.currentTime = Math.min(currentTime, video.duration);
    });

    video.addEventListener('seeked', () => {
      try {
        // 计算原始视频在canvas中的实际尺寸和位置
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvas.width / canvas.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (videoAspect > canvasAspect) {
          drawHeight = canvas.height;
          drawWidth = drawHeight * videoAspect;
          offsetX = (canvas.width - drawWidth) / 2;
          offsetY = 0;
        } else {
          drawWidth = canvas.width;
          drawHeight = drawWidth / videoAspect;
          offsetX = 0;
          offsetY = (canvas.height - drawHeight) / 2;
        }

        // 计算裁剪区域在实际视频中的比例
        const scaleX = video.videoWidth / drawWidth;
        const scaleY = video.videoHeight / drawHeight;
        
        const sourceX = (cropArea.x - offsetX) * scaleX;
        const sourceY = (cropArea.y - offsetY) * scaleY;
        const sourceWidth = cropArea.width * scaleX;
        const sourceHeight = cropArea.height * scaleY;

        // 绘制裁剪后的视频帧
        ctx.drawImage(
          video,
          Math.max(0, sourceX),
          Math.max(0, sourceY),
          Math.min(sourceWidth, video.videoWidth - sourceX),
          Math.min(sourceHeight, video.videoHeight - sourceY),
          0,
          0,
          outputWidth,
          outputHeight
        );

        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailDataUrl);
      } catch (error) {
        reject(error);
      }
    });

    video.addEventListener('error', () => {
      reject(new Error('视频加载失败'));
    });

    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.src = videoUrl;
  });
}

/**
 * 获取视频信息
 * @param file 视频文件
 * @returns Promise<{width: number, height: number, duration: number}> 
 */
export function getVideoInfo(file: File): Promise<{
  width: number;
  height: number;
  duration: number;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    video.addEventListener('loadedmetadata', () => {
      const info = {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      };
      
      URL.revokeObjectURL(url);
      resolve(info);
    });

    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法加载视频信息'));
    });

    video.src = url;
  });
}

/**
 * 检查浏览器是否支持视频格式
 * @param mimeType MIME类型，如 'video/mp4'
 * @returns boolean
 */
export function isVideoFormatSupported(mimeType: string): boolean {
  const video = document.createElement('video');
  return video.canPlayType(mimeType) !== '';
}

/**
 * 将时间戳转换为HH:MM:SS格式
 * @param seconds 秒数
 * @returns string 格式化的时间字符串
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
} 