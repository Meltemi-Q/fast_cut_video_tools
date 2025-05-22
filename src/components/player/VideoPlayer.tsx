import { useState, useRef, useEffect } from 'react';
import { MediaFile } from '@/types';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { formatFileSize } from '@/utils/file';

interface VideoPlayerProps {
  media: MediaFile;
}

const VideoPlayer = ({ media }: VideoPlayerProps) => {
  const {
    videoRef,
    playerState,
    formattedCurrentTime,
    formattedDuration,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleVolumeChange,
    isLoading,
    canPlay,
  } = useVideoPlayer();

  const [isDragging, setIsDragging] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeSliderRef = useRef<HTMLDivElement>(null);

  // 处理进度条拖拽
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !canPlay) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const newTime = percentage * playerState.duration;
    seek(newTime);
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !progressBarRef.current || !canPlay) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percentage * playerState.duration;
    seek(newTime);
  };

  // 处理音量控制
  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeSliderRef.current) return;
    
    const rect = volumeSliderRef.current.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    setVolume(percentage);
  };

  // 计算进度百分比
  const progressPercentage = playerState.duration > 0 
    ? (playerState.currentTime / playerState.duration) * 100 
    : 0;

  // 音量图标
  const VolumeIcon = () => {
    if (playerState.isMuted || playerState.volume === 0) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.766L4.5 13.5H2a1 1 0 01-1-1V7.5a1 1 0 011-1h2.5l3.883-3.266a1 1 0 011.617.766zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      );
    } else if (playerState.volume < 0.5) {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.766L4.5 13.5H2a1 1 0 01-1-1V7.5a1 1 0 011-1h2.5l3.883-3.266a1 1 0 011.617.766zM11.5 13.5a5 5 0 000-7V13.5z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.766L4.5 13.5H2a1 1 0 01-1-1V7.5a1 1 0 011-1h2.5l3.883-3.266a1 1 0 011.617.766zM11.5 15.6V4.4a5 5 0 010 11.2z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  return (
    <div className="card">
      {/* 视频播放区域 */}
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden group">
        {media.type === 'video' || media.type === 'gif' ? (
          <video
            ref={videoRef}
            src={media.url}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onVolumeChange={handleVolumeChange}
            onPlay={() => {}}
            onPause={() => {}}
            playsInline
            preload="metadata"
          />
        ) : (
          <img
            src={media.url}
            alt={media.name}
            className="w-full h-full object-contain"
          />
        )}
        
        {/* 加载状态 */}
        {isLoading && (media.type === 'video' || media.type === 'gif') && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-white border-t-transparent"></div>
          </div>
        )}
        
        {/* 播放按钮覆盖层 */}
        {(media.type === 'video' || media.type === 'gif') && !playerState.isPlaying && canPlay && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer group-hover:bg-opacity-40 transition-all duration-200"
            onClick={togglePlay}
          >
            <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all duration-200">
              <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>
      
      {/* 媒体信息 */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 truncate">{media.name}</h3>
          <span className="text-sm text-gray-500">{formatFileSize(media.size)}</span>
        </div>
        
        {/* 视频尺寸和时长信息 */}
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>{media.dimensions.width} × {media.dimensions.height}</span>
          {media.duration && (
            <span>时长: {formattedDuration}</span>
          )}
          <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
            {media.type.toUpperCase()}
          </span>
        </div>
      </div>

      {/* 播放控制 - 仅视频和GIF显示 */}
      {(media.type === 'video' || media.type === 'gif') && (
        <div className="mt-4 space-y-3">
          {/* 进度条 */}
          <div className="space-y-2">
            <div 
              ref={progressBarRef}
              className="relative bg-gray-200 rounded-full h-2 cursor-pointer"
              onClick={handleProgressClick}
              onMouseMove={handleProgressDrag}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            >
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-100"
                style={{ width: `${progressPercentage}%` }}
              />
              {/* 拖拽手柄 */}
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-primary-600 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ left: `calc(${progressPercentage}% - 8px)` }}
              />
            </div>
            
            {/* 时间显示 */}
            <div className="flex justify-between text-sm text-gray-600">
              <span>{formattedCurrentTime}</span>
              <span>{formattedDuration}</span>
            </div>
          </div>
          
          {/* 控制按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* 播放/暂停按钮 */}
              <button 
                onClick={togglePlay}
                disabled={!canPlay}
                className="w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors duration-200"
              >
                {playerState.isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              {/* 时间显示 */}
              <span className="text-sm text-gray-600 min-w-max">
                {formattedCurrentTime} / {formattedDuration}
              </span>
            </div>
            
            {/* 音量控制 */}
            <div 
              className="flex items-center space-x-2 relative"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button 
                onClick={toggleMute}
                className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <VolumeIcon />
              </button>
              
              {/* 音量滑块 */}
              <div className={`transition-all duration-200 ${showVolumeSlider ? 'w-20 opacity-100' : 'w-0 opacity-0'} overflow-hidden`}>
                <div 
                  ref={volumeSliderRef}
                  className="bg-gray-200 rounded-full h-1 cursor-pointer"
                  onClick={handleVolumeClick}
                >
                  <div 
                    className="bg-primary-600 h-1 rounded-full"
                    style={{ width: `${playerState.volume * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer; 