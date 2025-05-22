import { useState } from 'react';
import { ClipSegment, ExportSettings } from '@/types';
import { EXPORT_SETTINGS } from '@/constants';

interface ExportPanelProps {
  clips: ClipSegment[];
  onExport?: (clip: ClipSegment, settings: ExportSettings) => void;
  onBatchExport?: (clips: ClipSegment[], settings: ExportSettings) => void;
}

const ExportPanel = ({ clips, onExport, onBatchExport }: ExportPanelProps) => {
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'mp4',
    quality: EXPORT_SETTINGS.QUALITY_PRESETS.medium,
    preset: 'medium',
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // 处理单个片段导出
  const handleSingleExport = async (clip: ClipSegment) => {
    if (!onExport) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      await onExport(clip, exportSettings);
      setExportProgress(100);
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(0), 2000);
    }
  };

  // 处理批量导出
  const handleBatchExport = async () => {
    if (!onBatchExport || clips.length === 0) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      await onBatchExport(clips, exportSettings);
      setExportProgress(100);
    } catch (error) {
      console.error('批量导出失败:', error);
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(0), 2000);
    }
  };

  // 处理格式变化
  const handleFormatChange = (format: 'mp4' | 'gif') => {
    setExportSettings(prev => ({
      ...prev,
      format,
      fps: format === 'gif' ? EXPORT_SETTINGS.DEFAULT_FPS.gif : EXPORT_SETTINGS.DEFAULT_FPS.mp4,
    }));
  };

  // 处理画质预设变化
  const handlePresetChange = (preset: 'high' | 'medium' | 'low') => {
    setExportSettings(prev => ({
      ...prev,
      preset,
      quality: EXPORT_SETTINGS.QUALITY_PRESETS[preset],
    }));
  };

  // 处理自定义画质变化
  const handleQualityChange = (quality: number) => {
    setExportSettings(prev => ({
      ...prev,
      quality,
      preset: undefined, // 清除预设，使用自定义
    }));
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">导出设置</h3>
      
      {/* 格式选择 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          导出格式
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleFormatChange('mp4')}
            className={`p-3 rounded-lg border-2 transition-colors duration-200 ${
              exportSettings.format === 'mp4'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <div className="font-medium">MP4</div>
              <div className="text-xs opacity-75">视频格式</div>
            </div>
          </button>
          
          <button
            onClick={() => handleFormatChange('gif')}
            className={`p-3 rounded-lg border-2 transition-colors duration-200 ${
              exportSettings.format === 'gif'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
              </svg>
              <div className="font-medium">GIF</div>
              <div className="text-xs opacity-75">动图格式</div>
            </div>
          </button>
        </div>
      </div>

      {/* 画质选择 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          画质设置
        </label>
        
        {/* 预设画质 */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {Object.entries(EXPORT_SETTINGS.QUALITY_PRESETS).map(([key, value]) => (
            <button
              key={key}
              onClick={() => handlePresetChange(key as 'high' | 'medium' | 'low')}
              className={`py-2 px-3 text-xs rounded transition-colors duration-200 ${
                exportSettings.preset === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {key === 'high' && '高画质'}
              {key === 'medium' && '中画质'}
              {key === 'low' && '低画质'}
              <div className="text-xs opacity-75">({value}%)</div>
            </button>
          ))}
        </div>

        {/* 自定义画质滑块 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>自定义画质</span>
            <span>{exportSettings.quality}%</span>
          </div>
          <input
            type="range"
            min="40"
            max="100"
            value={exportSettings.quality}
            onChange={(e) => handleQualityChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* GIF专用设置 */}
      {exportSettings.format === 'gif' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GIF设置
          </label>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>帧率 (FPS)</span>
              <span>{exportSettings.fps}</span>
            </div>
            <input
              type="range"
              min="10"
              max="30"
              value={exportSettings.fps || EXPORT_SETTINGS.DEFAULT_FPS.gif}
              onChange={(e) => setExportSettings(prev => ({ ...prev, fps: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      )}

      {/* 导出按钮 */}
      <div className="space-y-3">
        {/* 批量导出 */}
        {clips.length > 1 && (
          <button
            onClick={handleBatchExport}
            disabled={isExporting || clips.length === 0}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
              isExporting || clips.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            {isExporting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>导出中... {exportProgress}%</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>批量导出 ({clips.length} 个片段)</span>
              </div>
            )}
          </button>
        )}

        {/* 导出进度条 */}
        {exportProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            ></div>
          </div>
        )}
      </div>

      {/* 导出信息 */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>导出格式:</span>
            <span className="font-medium">{exportSettings.format.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>画质:</span>
            <span className="font-medium">{exportSettings.quality}%</span>
          </div>
          {exportSettings.format === 'gif' && (
            <div className="flex justify-between">
              <span>帧率:</span>
              <span className="font-medium">{exportSettings.fps} FPS</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>候选片段:</span>
            <span className="font-medium">{clips.length} 个</span>
          </div>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">导出提示：</p>
            <ul className="text-xs space-y-1">
              <li>• MP4适合视频分享，文件较小</li>
              <li>• GIF适合网络传播，支持动画</li>
              <li>• 高画质文件较大，处理时间较长</li>
              <li>• 处理在本地进行，保护隐私</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPanel; 