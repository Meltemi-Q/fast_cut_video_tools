import { useRef, useState } from 'react';
import { MediaFile, DragEvent, ChangeEvent } from '@/types';
import { useFileUpload } from '@/hooks/useFileUpload';
import { formatFileSize } from '@/utils/file';

interface FileUploadProps {
  onFileSelect: (media: MediaFile) => void;
}

const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, progress, error, uploadFile, clearError } = useFileUpload();

  // 处理拖拽事件
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  // 处理点击上传
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = async (e: ChangeEvent) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
    // 重置input值，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    clearError();
    const mediaFile = await uploadFile(file);
    if (mediaFile) {
      onFileSelect(mediaFile);
    }
  };

  // 渲染上传进度
  const renderProgress = () => {
    if (!progress) return null;

    const { progress: percent, status, error: progressError } = progress;
    
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>
            {status === 'uploading' && '上传中...'}
            {status === 'processing' && '处理中...'}
            {status === 'completed' && '完成'}
            {status === 'error' && '失败'}
          </span>
          <span>{percent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              status === 'error' ? 'bg-red-500' : 
              status === 'completed' ? 'bg-green-500' : 'bg-primary-600'
            }`}
            style={{ width: `${percent}%` }}
          ></div>
        </div>
        {progressError && (
          <p className="text-red-600 text-sm mt-2">{progressError}</p>
        )}
      </div>
    );
  };

  // 渲染错误信息
  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-700 text-sm">{error}</span>
        </div>
        <button 
          onClick={clearError}
          className="text-red-600 text-sm underline mt-2"
        >
          重试
        </button>
      </div>
    );
  };

  return (
    <div className="card">
      <div 
        className={`upload-zone ${isDragOver ? 'dragover' : ''} ${isUploading ? 'opacity-75' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="space-y-4">
          {/* 上传图标 */}
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200 ${
            isDragOver ? 'bg-primary-200' : 'bg-primary-100'
          }`}>
            {isUploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
            ) : (
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>
          
          {/* 文本内容 */}
          <div className="text-center">
            <h3 className={`text-lg font-semibold mb-2 transition-colors duration-200 ${
              isDragOver ? 'text-primary-700' : 'text-gray-900'
            }`}>
              {isDragOver ? '松开鼠标上传文件' : '拖拽文件到此处或点击上传'}
            </h3>
            <p className="text-gray-600 mb-4">
              支持 MP4, AVI, MOV, GIF, JPG, PNG 格式，最大 100MB
            </p>
            
            {/* 上传按钮 */}
            <button 
              className={`btn-primary ${isUploading ? 'opacity-75 cursor-not-allowed' : ''}`}
              disabled={isUploading}
            >
              {isUploading ? '处理中...' : '选择文件'}
            </button>
          </div>
        </div>
        
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp4,.avi,.mov,.webm,.mkv,.gif,.jpg,.jpeg,.png,.webp"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
      
      {/* 进度显示 */}
      {renderProgress()}
      
      {/* 错误显示 */}
      {renderError()}
      
      {/* 提示信息 */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>💡 提示：视频文件会自动获取时长和尺寸信息</p>
        <p>🔒 所有文件都在本地处理，不会上传到服务器</p>
      </div>
    </div>
  );
};

export default FileUpload; 