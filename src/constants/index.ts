import { CropPreset } from '@/types';

// 文件限制常量
export const FILE_CONSTRAINTS = {
  MAX_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_DURATION: 10 * 60, // 10分钟
  SUPPORTED_VIDEO_FORMATS: ['mp4', 'avi', 'mov', 'webm', 'mkv'],
  SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
  SUPPORTED_GIF_FORMATS: ['gif'],
} as const;

// 导出设置常量
export const EXPORT_SETTINGS = {
  QUALITY_PRESETS: {
    high: 100,
    medium: 70,
    low: 40,
  },
  DEFAULT_FPS: {
    mp4: 30,
    gif: 15,
  },
  MAX_GIF_SIZE: 50 * 1024 * 1024, // 50MB GIF限制
} as const;

// 裁剪比例预设
export const CROP_PRESETS: CropPreset[] = [
  { name: 'free', ratio: 0, label: '自由选择' },
  { name: 'square', ratio: 1, label: '1:1 正方形' },
  { name: 'landscape', ratio: 16/9, label: '16:9 横屏' },
  { name: 'portrait', ratio: 9/16, label: '9:16 竖屏' },
  { name: 'classic', ratio: 4/3, label: '4:3 经典' },
  { name: 'wide', ratio: 21/9, label: '21:9 超宽' },
];

// 播放器设置
export const PLAYER_SETTINGS = {
  DEFAULT_VOLUME: 0.8,
  SEEK_STEP: 5, // 秒
  PLAYBACK_RATES: [0.5, 0.75, 1, 1.25, 1.5, 2],
  TIMELINE_PRECISION: 0.1, // 时间轴精度(秒)
} as const;

// UI常量
export const UI_CONSTANTS = {
  MOBILE_BREAKPOINT: 768,
  SIDEBAR_WIDTH: 320,
  HEADER_HEIGHT: 64,
  TIMELINE_HEIGHT: 80,
  PREVIEW_MIN_HEIGHT: 400,
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: '文件大小超过限制(100MB)',
  UNSUPPORTED_FORMAT: '不支持的文件格式',
  UPLOAD_FAILED: '上传失败，请重试',
  PROCESSING_FAILED: '处理失败，请重试',
  NETWORK_ERROR: '网络错误，请检查连接',
  BROWSER_NOT_SUPPORTED: '浏览器不支持此功能',
} as const;

// 本地存储键名
export const STORAGE_KEYS = {
  CLIP_SEGMENTS: 'quickcut_clip_segments',
  USER_PREFERENCES: 'quickcut_preferences',
  RECENT_FILES: 'quickcut_recent_files',
} as const;

// 动画配置
export const ANIMATION_CONFIG = {
  DURATION: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  EASING: {
    easeOut: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  },
} as const; 