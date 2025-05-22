import { ClipSegment, ExportSettings, MediaFile } from '@/types';
import { videoProcessor } from './videoProcessor';

interface ExportProgress {
  clipIndex: number;
  clipTotal: number;
  processingProgress: number;
  status: 'preparing' | 'processing' | 'completed' | 'error';
  message: string;
}

export class ExportHandler {
  private isFFmpegInitialized = false;

  /**
   * 初始化FFmpeg (在第一次导出时调用)
   */
  async initializeFFmpeg(onProgress?: (ratio: number) => void): Promise<void> {
    if (this.isFFmpegInitialized) return;

    try {
      await videoProcessor.initialize(onProgress);
      this.isFFmpegInitialized = true;
    } catch (error) {
      throw new Error(`FFmpeg初始化失败: ${error.message}`);
    }
  }

  /**
   * 导出单个片段
   */
  async exportSingleClip(
    clip: ClipSegment,
    mediaFile: MediaFile,
    settings: ExportSettings,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<void> {
    try {
      // 更新状态：准备中
      onProgress?.({
        clipIndex: 1,
        clipTotal: 1,
        processingProgress: 0,
        status: 'preparing',
        message: '正在初始化视频处理器...'
      });

      // 确保FFmpeg已初始化
      if (!this.isFFmpegInitialized) {
        await this.initializeFFmpeg((ratio) => {
          onProgress?.({
            clipIndex: 1,
            clipTotal: 1,
            processingProgress: ratio * 50, // 初始化占50%进度
            status: 'preparing',
            message: `正在加载视频处理器... ${Math.round(ratio * 100)}%`
          });
        });
      }

      // 更新状态：处理中
      onProgress?.({
        clipIndex: 1,
        clipTotal: 1,
        processingProgress: 0,
        status: 'processing',
        message: '正在处理视频片段...'
      });

      // 处理视频
      const outputBlob = await videoProcessor.processVideoClip(
        mediaFile.file,
        clip,
        settings,
        (progress) => {
          onProgress?.({
            clipIndex: 1,
            clipTotal: 1,
            processingProgress: progress * 100,
            status: 'processing',
            message: `正在处理视频... ${Math.round(progress * 100)}%`
          });
        }
      );

      // 下载文件
      await this.downloadFile(outputBlob, this.generateFileName(clip, settings));

      // 更新状态：完成
      onProgress?.({
        clipIndex: 1,
        clipTotal: 1,
        processingProgress: 100,
        status: 'completed',
        message: '导出完成！'
      });

    } catch (error) {
      console.error('单个片段导出失败:', error);
      onProgress?.({
        clipIndex: 1,
        clipTotal: 1,
        processingProgress: 0,
        status: 'error',
        message: `导出失败: ${error.message}`
      });
      throw error;
    }
  }

  /**
   * 批量导出多个片段
   */
  async exportMultipleClips(
    clips: ClipSegment[],
    mediaFile: MediaFile,
    settings: ExportSettings,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<void> {
    try {
      // 确保FFmpeg已初始化
      if (!this.isFFmpegInitialized) {
        onProgress?.({
          clipIndex: 0,
          clipTotal: clips.length,
          processingProgress: 0,
          status: 'preparing',
          message: '正在初始化视频处理器...'
        });

        await this.initializeFFmpeg((ratio) => {
          onProgress?.({
            clipIndex: 0,
            clipTotal: clips.length,
            processingProgress: ratio * 100,
            status: 'preparing',
            message: `正在加载视频处理器... ${Math.round(ratio * 100)}%`
          });
        });
      }

      // 逐个处理片段
      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        
        onProgress?.({
          clipIndex: i + 1,
          clipTotal: clips.length,
          processingProgress: 0,
          status: 'processing',
          message: `正在处理片段 ${i + 1}/${clips.length}...`
        });

        // 处理单个片段
        const outputBlob = await videoProcessor.processVideoClip(
          mediaFile.file,
          clip,
          settings,
          (progress) => {
            onProgress?.({
              clipIndex: i + 1,
              clipTotal: clips.length,
              processingProgress: progress * 100,
              status: 'processing',
              message: `正在处理片段 ${i + 1}/${clips.length}... ${Math.round(progress * 100)}%`
            });
          }
        );

        // 下载文件
        await this.downloadFile(
          outputBlob, 
          this.generateFileName(clip, settings, i + 1)
        );
      }

      // 全部完成
      onProgress?.({
        clipIndex: clips.length,
        clipTotal: clips.length,
        processingProgress: 100,
        status: 'completed',
        message: `批量导出完成！共处理 ${clips.length} 个片段`
      });

    } catch (error) {
      console.error('批量导出失败:', error);
      onProgress?.({
        clipIndex: 0,
        clipTotal: clips.length,
        processingProgress: 0,
        status: 'error',
        message: `批量导出失败: ${error.message}`
      });
      throw error;
    }
  }

  /**
   * 下载文件到用户设备
   */
  private async downloadFile(blob: Blob, fileName: string): Promise<void> {
    try {
      // 创建下载链接
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 释放内存
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
      
    } catch (error) {
      console.error('文件下载失败:', error);
      throw new Error('文件下载失败');
    }
  }

  /**
   * 生成文件名
   */
  private generateFileName(
    clip: ClipSegment, 
    settings: ExportSettings, 
    index?: number
  ): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:\-]/g, '');
    const duration = Math.round((clip.endTime - clip.startTime) * 100) / 100;
    const quality = settings.quality;
    
    let baseName = `clip_${timestamp}_${duration}s_${quality}q`;
    
    if (index !== undefined) {
      baseName = `clip${index}_${timestamp}_${duration}s_${quality}q`;
    }
    
    const extension = settings.format;
    return `${baseName}.${extension}`;
  }

  /**
   * 生成更好的缩略图（使用FFmpeg）
   */
  async generateThumbnail(
    mediaFile: MediaFile,
    clip: ClipSegment
  ): Promise<string> {
    try {
      if (!this.isFFmpegInitialized) {
        await this.initializeFFmpeg();
      }

      // 使用视频中间时间点作为缩略图时间
      const thumbnailTime = clip.startTime + (clip.endTime - clip.startTime) / 2;
      
      return await videoProcessor.generateThumbnail(
        mediaFile.file,
        thumbnailTime,
        clip.cropArea
      );
    } catch (error) {
      console.error('缩略图生成失败:', error);
      // 回退到默认缩略图
      return '';
    }
  }

  /**
   * 获取预估的文件大小（简化版本）
   */
  getEstimatedFileSize(
    clip: ClipSegment,
    settings: ExportSettings,
    originalFileSize: number
  ): string {
    const duration = clip.endTime - clip.startTime;
    const qualityFactor = settings.quality / 100;
    const cropFactor = (clip.cropArea.width * clip.cropArea.height) / 
                      (1920 * 1080); // 假设基准分辨率
    
    let estimatedSize = originalFileSize * (duration / 60) * qualityFactor * cropFactor;
    
    if (settings.format === 'gif') {
      // GIF通常比MP4小一些，但质量损失更大
      estimatedSize *= 0.7;
    }
    
    // 格式化文件大小
    if (estimatedSize < 1024) {
      return `~${Math.round(estimatedSize)}B`;
    } else if (estimatedSize < 1024 * 1024) {
      return `~${Math.round(estimatedSize / 1024)}KB`;
    } else {
      return `~${Math.round(estimatedSize / (1024 * 1024))}MB`;
    }
  }

  /**
   * 检查是否支持当前格式
   */
  isFormatSupported(format: string): boolean {
    return ['mp4', 'gif'].includes(format.toLowerCase());
  }

  /**
   * 获取FFmpeg状态
   */
  getProcessorStatus(): {
    isInitialized: boolean;
    version?: string;
  } {
    return {
      isInitialized: this.isFFmpegInitialized,
    };
  }
}

// 创建全局单例实例
export const exportHandler = new ExportHandler(); 