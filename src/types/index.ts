// 媒体文件接口
export interface MediaFile {
  id: string;
  name: string;
  type: 'video' | 'image' | 'gif';
  file: File;
  url: string;
  duration?: number; // 视频/GIF时长(秒)
  dimensions: { width: number; height: number };
  size: number; // 文件大小(字节)
  createdAt: Date;
}

// 剪辑片段接口
export interface ClipSegment {
  id: string;
  mediaId: string;
  startTime: number;  // 开始时间(秒)
  endTime: number;    // 结束时间(秒)
  cropArea: {         // 裁剪区域
    x: number;
    y: number; 
    width: number;
    height: number;
  };
  thumbnail: string;  // 缩略图URL
  createdAt: Date;
}

// 导出设置接口
export interface ExportSettings {
  format: 'mp4' | 'gif';
  quality: number;    // 画质百分比 (40-100)
  fps?: number;       // 帧率 (GIF导出)
  preset?: 'high' | 'medium' | 'low'; // 预设画质
}

// 上传进度接口
export interface UploadProgress {
  fileId: string;
  progress: number;   // 0-100
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

// 播放器状态接口
export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
}

// 编辑器状态接口  
export interface EditorState {
  selectedTimeRange: {
    start: number;
    end: number;
  } | null;
  selectedCropArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  isSelecting: boolean;
  previewMode: 'original' | 'cropped';
}

// 预设裁剪比例
export interface CropPreset {
  name: string;
  ratio: number; // width/height
  label: string;
}

// 应用状态接口
export interface AppState {
  currentMedia: MediaFile | null;
  clipSegments: ClipSegment[];
  isProcessing: boolean;
  error: string | null;
}

// 事件处理器类型
export type FileUploadHandler = (files: FileList) => void;
export type ClipSelectHandler = (segment: ClipSegment) => void;
export type ExportHandler = (settings: ExportSettings) => void;

// 常用的DOM事件类型
export type DragEvent = React.DragEvent<HTMLDivElement>;
export type ChangeEvent = React.ChangeEvent<HTMLInputElement>;
export type MouseEvent = React.MouseEvent<HTMLElement>;
export type TouchEvent = React.TouchEvent<HTMLElement>; 