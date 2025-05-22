import { useState, useCallback, useRef } from 'react';
import { EditorState, MediaFile, ClipSegment, CropPreset } from '@/types';
import { CROP_PRESETS } from '@/constants';
import { formatDuration } from '@/utils/file';
import { generateVideoThumbnail, generateCroppedThumbnail } from '@/utils/video';

export interface UseVideoEditorReturn {
  // 编辑器状态
  editorState: EditorState;
  
  // 时间段选择
  timeRange: { start: number; end: number };
  setTimeRange: (range: { start: number; end: number }) => void;
  setStartTime: (time: number) => void;
  setEndTime: (time: number) => void;
  
  // 区域裁剪
  cropArea: { x: number; y: number; width: number; height: number } | null;
  setCropArea: (area: { x: number; y: number; width: number; height: number } | null) => void;
  
  // 预设比例
  selectedPreset: CropPreset | null;
  applyPreset: (preset: CropPreset) => void;
  
  // 裁剪交互
  isDragging: boolean;
  dragStart: { x: number; y: number } | null;
  handleMouseDown: (e: React.MouseEvent, containerRect: DOMRect) => void;
  handleMouseMove: (e: React.MouseEvent, containerRect: DOMRect) => void;
  handleMouseUp: () => void;
  
  // 工具方法
  resetSelection: () => void;
  getSelectedDuration: () => number;
  getFormattedRange: () => { start: string; end: string; duration: string };
  canAddToClips: () => boolean;
  
  // 创建片段
  createClipSegment: (media: MediaFile, containerRect?: DOMRect) => Promise<ClipSegment | null>;
}

export function useVideoEditor(videoDuration: number = 0): UseVideoEditorReturn {
  const [editorState, setEditorState] = useState<EditorState>({
    selectedTimeRange: videoDuration > 0 ? { start: 0, end: Math.min(videoDuration, 10) } : null,
    selectedCropArea: null,
    isSelecting: false,
    previewMode: 'original',
  });

  const [selectedPreset, setSelectedPreset] = useState<CropPreset | null>(CROP_PRESETS[0]); // 默认自由选择
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // 时间段选择
  const timeRange = editorState.selectedTimeRange || { start: 0, end: videoDuration };

  const setTimeRange = useCallback((range: { start: number; end: number }) => {
    setEditorState(prev => ({
      ...prev,
      selectedTimeRange: {
        start: Math.max(0, Math.min(range.start, videoDuration)),
        end: Math.max(range.start, Math.min(range.end, videoDuration)),
      },
    }));
  }, [videoDuration]);

  const setStartTime = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, timeRange.end - 0.1));
    setTimeRange({ start: clampedTime, end: timeRange.end });
  }, [timeRange.end, setTimeRange]);

  const setEndTime = useCallback((time: number) => {
    const clampedTime = Math.max(timeRange.start + 0.1, Math.min(time, videoDuration));
    setTimeRange({ start: timeRange.start, end: clampedTime });
  }, [timeRange.start, videoDuration, setTimeRange]);

  // 区域裁剪
  const cropArea = editorState.selectedCropArea;

  const setCropArea = useCallback((area: { x: number; y: number; width: number; height: number } | null) => {
    setEditorState(prev => ({
      ...prev,
      selectedCropArea: area,
    }));
  }, []);

  // 预设比例应用
  const applyPreset = useCallback((preset: CropPreset) => {
    setSelectedPreset(preset);
    if (preset.ratio === 0) {
      // 自由选择，不自动设置区域
      return;
    }
    // 这里可以根据预设比例自动计算裁剪区域
    // 暂时先清空，让用户手动选择
    setCropArea(null);
  }, [setCropArea]);

  // 裁剪区域拖拽交互
  const handleMouseDown = useCallback((e: React.MouseEvent, containerRect: DOMRect) => {
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    
    setIsDragging(true);
    setDragStart({ x, y });
    setEditorState(prev => ({ ...prev, isSelecting: true }));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent, containerRect: DOMRect) => {
    if (!isDragging || !dragStart) return;

    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    const left = Math.min(dragStart.x, x);
    const top = Math.min(dragStart.y, y);
    const width = Math.abs(x - dragStart.x);
    const height = Math.abs(y - dragStart.y);

    // 如果有预设比例，按比例调整
    let finalWidth = width;
    let finalHeight = height;

    if (selectedPreset && selectedPreset.ratio > 0) {
      const ratio = selectedPreset.ratio;
      if (width / height > ratio) {
        finalWidth = height * ratio;
      } else {
        finalHeight = width / ratio;
      }
    }

    // 确保不超出容器边界
    const maxWidth = containerRect.width - left;
    const maxHeight = containerRect.height - top;
    finalWidth = Math.min(finalWidth, maxWidth);
    finalHeight = Math.min(finalHeight, maxHeight);

    setCropArea({
      x: left,
      y: top,
      width: finalWidth,
      height: finalHeight,
    });
  }, [isDragging, dragStart, selectedPreset, setCropArea]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
    setEditorState(prev => ({ ...prev, isSelecting: false }));
  }, []);

  // 重置选择
  const resetSelection = useCallback(() => {
    setTimeRange({ start: 0, end: Math.min(videoDuration, 10) });
    setCropArea(null);
    setSelectedPreset(CROP_PRESETS[0]);
  }, [videoDuration, setTimeRange, setCropArea]);

  // 工具方法
  const getSelectedDuration = useCallback(() => {
    return timeRange.end - timeRange.start;
  }, [timeRange]);

  const getFormattedRange = useCallback(() => {
    return {
      start: formatDuration(timeRange.start),
      end: formatDuration(timeRange.end),
      duration: formatDuration(getSelectedDuration()),
    };
  }, [timeRange, getSelectedDuration]);

  const canAddToClips = useCallback(() => {
    return getSelectedDuration() > 0.1; // 至少0.1秒
  }, [getSelectedDuration]);

  // 创建片段
  const createClipSegment = useCallback(async (media: MediaFile, containerRect?: DOMRect): Promise<ClipSegment | null> => {
    if (!canAddToClips()) return null;

    let finalCropArea = {
      x: 0,
      y: 0,
      width: media.dimensions.width,
      height: media.dimensions.height,
    };

    // 如果有裁剪区域，需要将容器坐标转换为视频坐标
    if (cropArea && containerRect) {
      // 计算视频在容器中的实际显示尺寸（考虑object-contain）
      const containerAspect = containerRect.width / containerRect.height;
      const videoAspect = media.dimensions.width / media.dimensions.height;
      
      let displayWidth, displayHeight, offsetX, offsetY;
      
      if (videoAspect > containerAspect) {
        // 视频更宽，以宽度为准
        displayWidth = containerRect.width;
        displayHeight = containerRect.width / videoAspect;
        offsetX = 0;
        offsetY = (containerRect.height - displayHeight) / 2;
      } else {
        // 视频更高，以高度为准
        displayWidth = containerRect.height * videoAspect;
        displayHeight = containerRect.height;
        offsetX = (containerRect.width - displayWidth) / 2;
        offsetY = 0;
      }
      
      // 转换坐标：从容器坐标到视频坐标
      const scaleX = media.dimensions.width / displayWidth;
      const scaleY = media.dimensions.height / displayHeight;
      
      finalCropArea = {
        x: Math.max(0, (cropArea.x - offsetX) * scaleX),
        y: Math.max(0, (cropArea.y - offsetY) * scaleY),
        width: Math.min(cropArea.width * scaleX, media.dimensions.width),
        height: Math.min(cropArea.height * scaleY, media.dimensions.height),
      };
      
      // 确保裁剪区域不超出视频边界
      if (finalCropArea.x + finalCropArea.width > media.dimensions.width) {
        finalCropArea.width = media.dimensions.width - finalCropArea.x;
      }
      if (finalCropArea.y + finalCropArea.height > media.dimensions.height) {
        finalCropArea.height = media.dimensions.height - finalCropArea.y;
      }
    }

    let thumbnail = media.url; // 默认使用原图

    try {
      // 为视频生成缩略图
      if (media.type === 'video' || media.type === 'gif') {
        const thumbnailTime = timeRange.start + (timeRange.end - timeRange.start) / 2; // 取中间时间点
        
        if (cropArea) {
          // 如果有裁剪区域，生成裁剪后的缩略图
          thumbnail = await generateCroppedThumbnail(
            media.url,
            thumbnailTime,
            finalCropArea,
            320,
            180
          );
        } else {
          // 否则生成普通缩略图
          thumbnail = await generateVideoThumbnail(
            media.url,
            thumbnailTime,
            320,
            180
          );
        }
      }
    } catch (error) {
      console.warn('生成缩略图失败，使用默认图片:', error);
      // 如果生成缩略图失败，继续使用原图
    }

    return {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      mediaId: media.id,
      startTime: timeRange.start,
      endTime: timeRange.end,
      cropArea: finalCropArea,
      thumbnail,
      createdAt: new Date(),
    };
  }, [timeRange, cropArea, canAddToClips]);

  return {
    editorState,
    timeRange,
    setTimeRange,
    setStartTime,
    setEndTime,
    cropArea,
    setCropArea,
    selectedPreset,
    applyPreset,
    isDragging,
    dragStart,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetSelection,
    getSelectedDuration,
    getFormattedRange,
    canAddToClips,
    createClipSegment,
  };
} 