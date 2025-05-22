import { useRef, useEffect, useState } from 'react';
import { ClipSegment, MediaFile } from '@/types';

interface ClipPreviewProps {
  clip: ClipSegment;
  media: MediaFile;
  onClose: () => void;
}

const ClipPreview = ({ clip, media, onClose }: ClipPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(clip.startTime);

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      video.currentTime = clip.startTime;
      
      const handleTimeUpdate = () => {
        if (video.currentTime >= clip.endTime) {
          video.currentTime = clip.startTime;
          setCurrentTime(clip.startTime);
        } else {
          setCurrentTime(video.currentTime);
        }
        updateCanvas();
      };

      const handleLoadedData = () => {
        updateCanvas();
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadeddata', handleLoadedData);

      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadeddata', handleLoadedData);
      };
    }
  }, [clip.startTime, clip.endTime]);

  const updateCanvas = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // 设置canvas尺寸为裁切区域尺寸
    canvas.width = clip.cropArea.width;
    canvas.height = clip.cropArea.height;

    // 直接使用裁剪区域坐标，因为clip.cropArea已经是基于原始视频尺寸的
    const sourceX = Math.max(0, Math.min(clip.cropArea.x, video.videoWidth - 1));
    const sourceY = Math.max(0, Math.min(clip.cropArea.y, video.videoHeight - 1));
    const sourceWidth = Math.min(clip.cropArea.width, video.videoWidth - sourceX);
    const sourceHeight = Math.min(clip.cropArea.height, video.videoHeight - sourceY);

    // 绘制裁切后的视频帧
    try {
      ctx.drawImage(
        video,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );
    } catch (error) {
      console.error('Canvas绘制失败:', error);
      // 如果绘制失败，绘制一个占位符
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('预览不可用', canvas.width / 2, canvas.height / 2);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    if (isPlaying) {
      video.pause();
    } else {
      video.currentTime = clip.startTime;
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">裁切预览</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 原始视频预览 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">原始视频</h4>
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              {media.type === 'video' || media.type === 'gif' ? (
                <video
                  ref={videoRef}
                  src={media.url}
                  className="w-full h-auto object-contain"
                  muted
                  playsInline
                  style={{ pointerEvents: 'none' }}
                />
              ) : (
                <img
                  src={media.url}
                  alt={media.name}
                  className="w-full h-auto object-contain"
                />
              )}
              
              {/* 裁切区域指示 */}
              <div className="absolute inset-0">
                <div
                  className="absolute border-2 border-red-500 bg-red-100 bg-opacity-20"
                  style={{
                    left: `${(clip.cropArea.x / media.dimensions.width) * 100}%`,
                    top: `${(clip.cropArea.y / media.dimensions.height) * 100}%`,
                    width: `${(clip.cropArea.width / media.dimensions.width) * 100}%`,
                    height: `${(clip.cropArea.height / media.dimensions.height) * 100}%`,
                  }}
                >
                  <div className="absolute -top-6 left-0 text-xs text-red-600 bg-white px-1 rounded shadow">
                    裁切区域
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 裁切后效果预览 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">裁切后效果</h4>
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-auto object-contain"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          </div>
        </div>

        {/* 播放控制 */}
        {(media.type === 'video' || media.type === 'gif') && (
          <div className="mt-6">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={togglePlay}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {isPlaying ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>暂停</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    <span>播放片段</span>
                  </>
                )}
              </button>
              
              <div className="text-sm text-gray-600">
                {formatTime(currentTime)} / {formatTime(clip.endTime)}
              </div>
            </div>
          </div>
        )}

        {/* 片段信息 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">片段信息</h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">时间范围:</span> {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
            </div>
            <div>
              <span className="font-medium">时长:</span> {formatTime(clip.endTime - clip.startTime)}
            </div>
            <div>
              <span className="font-medium">裁切尺寸:</span> {Math.round(clip.cropArea.width)} × {Math.round(clip.cropArea.height)}
            </div>
            <div>
              <span className="font-medium">裁切位置:</span> ({Math.round(clip.cropArea.x)}, {Math.round(clip.cropArea.y)})
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClipPreview; 