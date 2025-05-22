import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import { ClipSegment, ExportSettings } from '@/types';

export class VideoProcessor {
  private ffmpeg: FFmpeg;
  private isLoaded = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  /**
   * 初始化FFmpeg实例
   */
  async initialize(onProgress?: (ratio: number) => void): Promise<void> {
    if (this.isLoaded) return;

    try {
      console.log('开始初始化FFmpeg...');
      
      // 设置加载进度回调
      this.ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg log:', message);
      });

      // 设置进度回调
      this.ffmpeg.on('progress', ({ progress, time }) => {
        console.log('FFmpeg progress:', progress, time);
        if (onProgress) {
          onProgress(progress);
        }
      });

      // 尝试从多个CDN源加载FFmpeg核心文件
      const cdnSources = [
        'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm',
        'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm',
        'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm'
      ];

      let loadSuccess = false;
      for (const baseURL of cdnSources) {
        try {
          console.log(`尝试从 ${baseURL} 加载FFmpeg...`);
          
          if (onProgress) onProgress(0.1);
          
          const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
          if (onProgress) onProgress(0.3);
          
          const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
          if (onProgress) onProgress(0.6);

          await this.ffmpeg.load({
            coreURL,
            wasmURL,
          });
          
          loadSuccess = true;
          if (onProgress) onProgress(1.0);
          break;
        } catch (error) {
          console.warn(`从 ${baseURL} 加载失败:`, error);
          continue;
        }
      }

      if (!loadSuccess) {
        throw new Error('所有CDN源都加载失败');
      }

      this.isLoaded = true;
      console.log('FFmpeg加载成功！');
    } catch (error) {
      console.error('FFmpeg初始化失败:', error);
      throw new Error(`FFmpeg初始化失败: ${error.message}，请检查网络连接或尝试刷新页面`);
    }
  }

  /**
   * 处理视频片段 - 剪辑时间范围并裁剪画面区域
   */
  async processVideoClip(
    videoFile: File,
    clip: ClipSegment,
    settings: ExportSettings,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (!this.isLoaded) {
      throw new Error('FFmpeg未初始化，请先调用initialize()');
    }

    try {
      // 准备输入文件
      const inputFileName = 'input.mp4';
      const outputFileName = `output.${settings.format}`;
      
      await this.ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));

      // 构建FFmpeg命令
      const command = this.buildFFmpegCommand(inputFileName, outputFileName, clip, settings);
      
      console.log('FFmpeg command:', command.join(' '));

      // 设置进度回调
      this.ffmpeg.on('progress', ({ progress }) => {
        if (onProgress) {
          onProgress(progress);
        }
      });

      // 执行视频处理
      await this.ffmpeg.exec(command);

      // 读取输出文件
      const outputData = await this.ffmpeg.readFile(outputFileName);
      
      // 清理临时文件
      await this.ffmpeg.deleteFile(inputFileName);
      await this.ffmpeg.deleteFile(outputFileName);

      // 创建Blob并返回
      const mimeType = settings.format === 'mp4' ? 'video/mp4' : 'image/gif';
      return new Blob([outputData], { type: mimeType });
      
    } catch (error) {
      console.error('视频处理失败:', error);
      throw new Error(`视频处理失败: ${error.message}`);
    }
  }

  /**
   * 构建FFmpeg命令
   */
  private buildFFmpegCommand(
    inputFile: string,
    outputFile: string,
    clip: ClipSegment,
    settings: ExportSettings
  ): string[] {
    const command = ['-i', inputFile];

    // 时间范围裁剪
    command.push('-ss', clip.startTime.toString());
    command.push('-t', (clip.endTime - clip.startTime).toString());

    // 画面区域裁剪
    const cropFilter = `crop=${Math.round(clip.cropArea.width)}:${Math.round(clip.cropArea.height)}:${Math.round(clip.cropArea.x)}:${Math.round(clip.cropArea.y)}`;
    
    // 根据格式设置不同的参数
    if (settings.format === 'mp4') {
      // MP4视频设置
      command.push('-vf', cropFilter);
      command.push('-c:v', 'libx264');
      command.push('-preset', 'fast');
      command.push('-crf', this.qualityToCRF(settings.quality).toString());
      
      // 音频设置（如果有音频）
      command.push('-c:a', 'aac');
      command.push('-b:a', '128k');
      
    } else if (settings.format === 'gif') {
      // GIF动图设置
      const fps = settings.fps || 15;
      const paletteFilter = `${cropFilter},fps=${fps},scale=320:-1:flags=lanczos,palettegen`;
      const gifFilter = `${cropFilter},fps=${fps},scale=320:-1:flags=lanczos[x];[x][1:v]paletteuse`;
      
      // 生成调色板优化GIF质量
      command.push('-vf', paletteFilter);
      command.push('-y', 'palette.png');
      
      // 使用调色板生成GIF
      command.push('-i', 'palette.png');
      command.push('-filter_complex', gifFilter);
      command.push('-loop', '0');
    }

    // 输出文件
    command.push(outputFile);

    return command;
  }

  /**
   * 将画质百分比转换为CRF值 (用于MP4编码)
   * CRF: 0-51, 值越小质量越高
   */
  private qualityToCRF(quality: number): number {
    // 将40-100%的画质映射到28-18的CRF值
    const minCRF = 18; // 高质量
    const maxCRF = 28; // 低质量
    const crf = maxCRF - ((quality - 40) / 60) * (maxCRF - minCRF);
    return Math.round(Math.max(minCRF, Math.min(maxCRF, crf)));
  }

  /**
   * 生成视频缩略图
   */
  async generateThumbnail(
    videoFile: File,
    timeInSeconds: number,
    cropArea?: { x: number; y: number; width: number; height: number }
  ): Promise<string> {
    if (!this.isLoaded) {
      await this.initialize();
    }

    try {
      const inputFileName = 'thumb_input.mp4';
      const outputFileName = 'thumbnail.jpg';
      
      await this.ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));

      const command = [
        '-i', inputFileName,
        '-ss', timeInSeconds.toString(),
        '-vframes', '1',
        '-f', 'image2'
      ];

      // 如果有裁剪区域，应用裁剪
      if (cropArea) {
        const cropFilter = `crop=${Math.round(cropArea.width)}:${Math.round(cropArea.height)}:${Math.round(cropArea.x)}:${Math.round(cropArea.y)}`;
        command.push('-vf', cropFilter);
      }

      command.push(outputFileName);

      await this.ffmpeg.exec(command);
      
      const thumbnailData = await this.ffmpeg.readFile(outputFileName);
      
      // 清理文件
      await this.ffmpeg.deleteFile(inputFileName);
      await this.ffmpeg.deleteFile(outputFileName);

      // 转换为Data URL
      const blob = new Blob([thumbnailData], { type: 'image/jpeg' });
      return URL.createObjectURL(blob);
      
    } catch (error) {
      console.error('缩略图生成失败:', error);
      throw new Error('缩略图生成失败');
    }
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.isLoaded;
  }

  /**
   * 获取FFmpeg版本信息
   */
  async getVersion(): Promise<string> {
    if (!this.isLoaded) {
      throw new Error('FFmpeg未初始化');
    }
    
    await this.ffmpeg.exec(['-version']);
    return 'FFmpeg WebAssembly version';
  }
}

// 创建全局单例实例
export const videoProcessor = new VideoProcessor(); 