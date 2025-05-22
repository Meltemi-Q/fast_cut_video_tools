import { useState } from 'react';
import { MediaFile, ClipSegment, ExportSettings } from '@/types';
import FileUpload from '@/components/upload/FileUpload';
import VideoPlayer from '@/components/player/VideoPlayer';
import VideoEditor from '@/components/editor/VideoEditor';
import ExportPanel from '@/components/export/ExportPanel';
import ClipPreview from '@/components/clips/ClipPreview';
import { exportHandler } from '@/utils/exportHandler';

function App() {
  const [currentMedia, setCurrentMedia] = useState<MediaFile | null>(null);
  const [clipSegments, setClipSegments] = useState<ClipSegment[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'edit' | 'clips'>('upload');
  const [previewClip, setPreviewClip] = useState<ClipSegment | null>(null);
  
  // 导出状态
  const [exportProgress, setExportProgress] = useState<{
    isExporting: boolean;
    progress: number;
    message: string;
    status: 'preparing' | 'processing' | 'completed' | 'error';
  }>({
    isExporting: false,
    progress: 0,
    message: '',
    status: 'preparing'
  });

  // 处理文件上传成功
  const handleFileSuccess = (media: MediaFile) => {
    setCurrentMedia(media);
    setActiveTab('edit');
  };

  // 添加新的片段到候选区
  const handleAddClip = (clip: ClipSegment) => {
    setClipSegments(prev => [clip, ...prev]);
    setActiveTab('clips');
  };

  // 删除片段
  const handleDeleteClip = (clipId: string) => {
    setClipSegments(prev => prev.filter(clip => clip.id !== clipId));
  };

  // 清空候选区
  const handleClearClips = () => {
    setClipSegments([]);
  };

  // 重新上传文件
  const handleReupload = () => {
    setCurrentMedia(null);
    setActiveTab('upload');
  };

  // 预览片段
  const handlePreviewClip = (clip: ClipSegment) => {
    setPreviewClip(clip);
  };

  // 关闭预览
  const handleClosePreview = () => {
    setPreviewClip(null);
  };

  // 单个片段导出 - 使用真正的视频处理
  const handleSingleExport = async (clip: ClipSegment, settings: ExportSettings) => {
    if (!currentMedia) {
      console.error('没有媒体文件');
      return;
    }

    try {
      setExportProgress({
        isExporting: true,
        progress: 0,
        message: '准备导出...',
        status: 'preparing'
      });

      await exportHandler.exportSingleClip(
        clip,
        currentMedia,
        settings,
        (progress) => {
          setExportProgress({
            isExporting: true,
            progress: progress.processingProgress,
            message: progress.message,
            status: progress.status
          });
        }
      );

      // 导出完成
      setExportProgress({
        isExporting: false,
        progress: 100,
        message: '导出完成！',
        status: 'completed'
      });

      // 3秒后重置状态
      setTimeout(() => {
        setExportProgress({
          isExporting: false,
          progress: 0,
          message: '',
          status: 'preparing'
        });
      }, 3000);

    } catch (error) {
      console.error('导出失败:', error);
      setExportProgress({
        isExporting: false,
        progress: 0,
        message: `导出失败: ${error.message}`,
        status: 'error'
      });

      // 5秒后重置错误状态
      setTimeout(() => {
        setExportProgress({
          isExporting: false,
          progress: 0,
          message: '',
          status: 'preparing'
        });
      }, 5000);
    }
  };

  // 批量导出 - 使用真正的视频处理
  const handleBatchExport = async (clips: ClipSegment[], settings: ExportSettings) => {
    if (!currentMedia || clips.length === 0) {
      console.error('没有媒体文件或候选片段');
      return;
    }

    try {
      setExportProgress({
        isExporting: true,
        progress: 0,
        message: '准备批量导出...',
        status: 'preparing'
      });

      await exportHandler.exportMultipleClips(
        clips,
        currentMedia,
        settings,
        (progress) => {
          setExportProgress({
            isExporting: true,
            progress: progress.processingProgress,
            message: progress.message,
            status: progress.status
          });
        }
      );

      // 导出完成
      setExportProgress({
        isExporting: false,
        progress: 100,
        message: `批量导出完成！共处理 ${clips.length} 个片段`,
        status: 'completed'
      });

      // 3秒后重置状态
      setTimeout(() => {
        setExportProgress({
          isExporting: false,
          progress: 0,
          message: '',
          status: 'preparing'
        });
      }, 3000);

    } catch (error) {
      console.error('批量导出失败:', error);
      setExportProgress({
        isExporting: false,
        progress: 0,
        message: `批量导出失败: ${error.message}`,
        status: 'error'
      });

      // 5秒后重置错误状态
      setTimeout(() => {
        setExportProgress({
          isExporting: false,
          progress: 0,
          message: '',
          status: 'preparing'
        });
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">快剪工具</h1>
            </div>
            
            {currentMedia && (
              <button
                onClick={handleReupload}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                <span>重新上传</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 导出进度提示 */}
      {exportProgress.isExporting && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm font-medium text-blue-800">{exportProgress.message}</span>
              </div>
              <span className="text-sm text-blue-600">{Math.round(exportProgress.progress)}%</span>
            </div>
            <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* 成功/错误提示 */}
      {!exportProgress.isExporting && exportProgress.message && (
        <div className={`border-b ${
          exportProgress.status === 'completed' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-3">
              {exportProgress.status === 'completed' ? (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <span className={`text-sm font-medium ${
                exportProgress.status === 'completed' ? 'text-green-800' : 'text-red-800'
              }`}>
                {exportProgress.message}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentMedia ? (
          /* 文件上传界面 */
          <div className="max-w-2xl mx-auto">
            <FileUpload onFileSelect={handleFileSuccess} />
          </div>
        ) : (
          /* 编辑界面 */
          <div className="space-y-8">
            {/* 标签切换 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('edit')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === 'edit'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    剪辑编辑
                  </button>
                  <button
                    onClick={() => setActiveTab('clips')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === 'clips'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                    候选区 ({clipSegments.length})
                  </button>
                </nav>
              </div>

              {/* 标签内容 */}
              <div className="p-6">
                {activeTab === 'edit' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 视频播放器 */}
                    <div>
                      <VideoPlayer media={currentMedia} />
                    </div>
                    
                    {/* 编辑工具 */}
                    <div>
                      <VideoEditor media={currentMedia} onAddClip={handleAddClip} />
                    </div>
                  </div>
                )}

                {activeTab === 'clips' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 候选区列表 */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                          候选片段 ({clipSegments.length})
                        </h2>
                        {clipSegments.length > 0 && (
                          <button
                            onClick={handleClearClips}
                            className="px-3 py-2 text-sm text-red-600 hover:text-red-700 transition-colors duration-200"
                          >
                            清空全部
                          </button>
                        )}
                      </div>

                      {clipSegments.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <p className="text-lg font-medium mb-2">候选区为空</p>
                          <p className="text-sm">回到编辑页面创建一些片段吧</p>
                          <button
                            onClick={() => setActiveTab('edit')}
                            className="mt-4 btn-primary"
                          >
                            开始编辑
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {clipSegments.map((clip) => (
                            <div key={clip.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                              {/* 缩略图 */}
                              <div className="aspect-video bg-gray-100 relative">
                                <img 
                                  src={clip.thumbnail} 
                                  alt="片段缩略图"
                                  className="w-full h-full object-cover"
                                />
                                {/* 时长标签 */}
                                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                                  {Math.round((clip.endTime - clip.startTime) * 10) / 10}s
                                </div>
                              </div>
                              
                              {/* 片段信息 */}
                              <div className="p-4">
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div>开始: {Math.round(clip.startTime * 10) / 10}s</div>
                                  <div>结束: {Math.round(clip.endTime * 10) / 10}s</div>
                                  <div>尺寸: {Math.round(clip.cropArea.width)} × {Math.round(clip.cropArea.height)}</div>
                                </div>
                                
                                {/* 操作按钮 */}
                                <div className="flex space-x-2 mt-3">
                                  <button 
                                    onClick={() => handlePreviewClip(clip)}
                                    className="flex-1 btn-secondary text-xs py-2"
                                    disabled={exportProgress.isExporting}
                                  >
                                    预览
                                  </button>
                                  <button 
                                    onClick={() => handleSingleExport(clip, { format: 'mp4', quality: 70, preset: 'medium' })}
                                    className="flex-1 btn-primary text-xs py-2"
                                    disabled={exportProgress.isExporting}
                                  >
                                    导出
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteClip(clip.id)}
                                    className="px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
                                    disabled={exportProgress.isExporting}
                                  >
                                    删除
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 导出设置面板 */}
                    <div>
                      <ExportPanel 
                        clips={clipSegments} 
                        onExport={handleSingleExport}
                        onBatchExport={handleBatchExport}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 片段预览模态框 */}
      {previewClip && currentMedia && (
        <ClipPreview 
          clip={previewClip} 
          media={currentMedia} 
          onClose={handleClosePreview} 
        />
      )}
    </div>
  );
}

export default App; 