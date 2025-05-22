import { useRef, useEffect, useState } from 'react';
import { MediaFile, ClipSegment } from '@/types';
import { useVideoEditor } from '@/hooks/useVideoEditor';
import { CROP_PRESETS } from '@/constants';
import TimeRangeSlider from '@/components/ui/TimeRangeSlider';

interface VideoEditorProps {
  media: MediaFile;
  onAddClip?: (clip: ClipSegment) => void;
}

const VideoEditor = ({ media, onAddClip }: VideoEditorProps) => {
  const videoDuration = media.duration || 0;
  const videoAreaRef = useRef<HTMLDivElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [lastTimeUpdate, setLastTimeUpdate] = useState(0); // 用于跟踪时间变化
  
  const {
    timeRange,
    setStartTime,
    setEndTime,
    cropArea,
    selectedPreset,
    applyPreset,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetSelection,
    getFormattedRange,
    canAddToClips,
    createClipSegment,
  } = useVideoEditor(videoDuration);

  // 同步时间滑块与视频预览
  useEffect(() => {
    if (previewVideoRef.current && (media.type === 'video' || media.type === 'gif')) {
      const video = previewVideoRef.current;
      
      // 默认显示开始时间的帧
      const targetTime = timeRange.start;
      
      // 只有当时间确实改变时才更新
      if (Math.abs(video.currentTime - targetTime) > 0.1) {
        video.currentTime = targetTime;
        setLastTimeUpdate(targetTime);
      }
    }
  }, [timeRange.start, media.type]);

  // 处理时间滑块变化时的视频同步
  const handleTimeRangeChange = (newStart: number, newEnd: number) => {
    // 确定哪个时间点发生了变化
    let targetTime = newStart;
    if (Math.abs(newEnd - timeRange.end) > Math.abs(newStart - timeRange.start)) {
      targetTime = newEnd; // 如果结束时间变化更大，显示结束时间的帧
    }

    // 更新时间范围
    if (newStart !== timeRange.start) {
      setStartTime(newStart);
    }
    if (newEnd !== timeRange.end) {
      setEndTime(newEnd);
    }

    // 同步视频预览
    if (previewVideoRef.current && (media.type === 'video' || media.type === 'gif')) {
      const video = previewVideoRef.current;
      video.currentTime = targetTime;
      setLastTimeUpdate(targetTime);
    }
  };

  // 处理开始时间变化
  const handleStartTimeChange = (time: number) => {
    setStartTime(time);
    if (previewVideoRef.current && (media.type === 'video' || media.type === 'gif')) {
      previewVideoRef.current.currentTime = time;
      setLastTimeUpdate(time);
    }
  };

  // 处理结束时间变化
  const handleEndTimeChange = (time: number) => {
    setEndTime(time);
    if (previewVideoRef.current && (media.type === 'video' || media.type === 'gif')) {
      previewVideoRef.current.currentTime = time;
      setLastTimeUpdate(time);
    }
  };

  // 处理裁剪区域拖拽
  const handleCropMouseDown = (e: React.MouseEvent) => {
    if (!videoAreaRef.current) return;
    const rect = videoAreaRef.current.getBoundingClientRect();
    handleMouseDown(e, rect);
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!videoAreaRef.current || !isDragging) return;
    const rect = videoAreaRef.current.getBoundingClientRect();
    handleMouseMove(e, rect);
  };

  // 添加到候选区
  const handleAddToClips = async () => {
    try {
      const containerRect = videoAreaRef.current?.getBoundingClientRect();
      const clip = await createClipSegment(media, containerRect);
      if (clip && onAddClip) {
        onAddClip(clip);
        resetSelection(); // 重置选择以便继续编辑
      }
    } catch (error) {
      console.error('创建片段失败:', error);
    }
  };

  const formattedRange = getFormattedRange();

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">剪辑工具</h3>
      
      {/* 裁剪预览区域 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          画面裁剪 - 在下方拖拽选择区域
        </label>
        <div 
          ref={videoAreaRef}
          className="relative bg-gray-900 rounded-lg overflow-hidden cursor-crosshair"
          style={{ aspectRatio: `${media.dimensions.width} / ${media.dimensions.height}` }}
          onMouseDown={handleCropMouseDown}
          onMouseMove={handleCropMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* 视频/图片内容显示 */}
          {media.type === 'video' || media.type === 'gif' ? (
            <video
              ref={previewVideoRef}
              src={media.url}
              className="w-full h-full object-contain"
              muted
              playsInline
              preload="metadata"
              style={{ pointerEvents: 'none' }}
            />
          ) : (
            <img
              src={media.url}
              alt={media.name}
              className="w-full h-full object-contain"
              style={{ pointerEvents: 'none' }}
            />
          )}
          
          {/* 裁剪选择框 */}
          {cropArea && (
            <div
              className="absolute border-2 border-primary-500 bg-primary-100 bg-opacity-30"
              style={{
                left: `${cropArea.x}px`,
                top: `${cropArea.y}px`,
                width: `${cropArea.width}px`,
                height: `${cropArea.height}px`,
              }}
            >
              {/* 选择框角落拖拽点 */}
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary-600 rounded-full"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-600 rounded-full"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary-600 rounded-full"></div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary-600 rounded-full"></div>
              
              {/* 尺寸显示 */}
              <div className="absolute -top-6 left-0 text-xs text-primary-600 bg-white px-1 rounded shadow">
                {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
              </div>
            </div>
          )}
          
          {/* 拖拽提示覆盖层 */}
          {!cropArea && (
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <div className="text-center text-white">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2-5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p className="text-sm">拖拽选择裁剪区域</p>
                <p className="text-xs mt-1 opacity-75">选择您要保留的画面部分</p>
              </div>
            </div>
          )}

          {/* 当前时间显示 */}
          {(media.type === 'video' || media.type === 'gif') && (
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              当前: {Math.floor(lastTimeUpdate / 60)}:{(Math.floor(lastTimeUpdate % 60)).toString().padStart(2, '0')}
            </div>
          )}
        </div>
      </div>
      
      {/* 预设比例选择 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          裁剪比例
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CROP_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={`text-xs py-2 px-3 rounded transition-colors duration-200 ${
                selectedPreset?.name === preset.name
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {cropArea && (
          <div className="mt-2 text-xs text-gray-600">
            当前选区: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
          </div>
        )}
      </div>

      {/* 时间段选择 */}
      {(media.type === 'video' || media.type === 'gif') && videoDuration > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择时间段 <span className="text-xs text-gray-500">(拖动滑块查看对应帧)</span>
          </label>
          
          <TimeRangeSlider
            min={0}
            max={videoDuration}
            startValue={timeRange.start}
            endValue={timeRange.end}
            onStartChange={handleStartTimeChange}
            onEndChange={handleEndTimeChange}
            step={0.1}
          />
          
          <div className="flex justify-between text-sm text-gray-600 mt-3">
            <span>开始: {formattedRange.start}</span>
            <span>时长: {formattedRange.duration}</span>
            <span>结束: {formattedRange.end}</span>
          </div>
        </div>
      )}
      
      {/* 操作按钮 */}
      <div className="flex space-x-3">
        <button 
          onClick={handleAddToClips}
          disabled={!canAddToClips()}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
            canAddToClips()
              ? 'bg-primary-600 hover:bg-primary-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          添加到候选区
        </button>
        
        <button 
          onClick={resetSelection}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors duration-200"
        >
          <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          重置
        </button>
      </div>

      {/* 选择信息提示 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">使用提示：</p>
            <ul className="text-xs space-y-1">
              <li>• 拖动时间滑块实时预览对应的视频帧</li>
              <li>• 在视频预览区域拖拽选择裁剪范围</li>
              <li>• 选择预设比例或自由裁剪</li>
              <li>• 点击"添加到候选区"保存当前选择</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor; 