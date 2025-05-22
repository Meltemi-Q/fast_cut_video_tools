import { useRef, useState, useCallback, useEffect } from 'react';

interface TimeRangeSliderProps {
  min: number;
  max: number;
  startValue: number;
  endValue: number;
  onStartChange: (value: number) => void;
  onEndChange: (value: number) => void;
  step?: number;
  disabled?: boolean;
}

const TimeRangeSlider = ({
  min,
  max,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  step = 0.1,
  disabled = false,
}: TimeRangeSliderProps) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

  // 将值转换为百分比位置
  const getPercentage = useCallback((value: number) => {
    return ((value - min) / (max - min)) * 100;
  }, [min, max]);

  // 将位置转换为值
  const getValue = useCallback((clientX: number) => {
    if (!sliderRef.current) return min;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + percentage * (max - min);
    
    // 按步长对齐
    return Math.round(rawValue / step) * step;
  }, [min, max, step]);

  // 处理拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'start' | 'end') => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDragging(type);
  }, [disabled]);

  // 处理拖拽
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || disabled) return;
    
    const newValue = getValue(e.clientX);
    
    if (isDragging === 'start') {
      const clampedValue = Math.min(newValue, endValue - step);
      onStartChange(Math.max(min, clampedValue));
    } else {
      const clampedValue = Math.max(newValue, startValue + step);
      onEndChange(Math.min(max, clampedValue));
    }
  }, [isDragging, disabled, getValue, startValue, endValue, min, max, step, onStartChange, onEndChange]);

  // 处理拖拽结束
  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // 处理点击轨道
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (disabled || isDragging) return;
    
    const newValue = getValue(e.clientX);
    const startDistance = Math.abs(newValue - startValue);
    const endDistance = Math.abs(newValue - endValue);
    
    // 移动最近的滑块
    if (startDistance < endDistance) {
      const clampedValue = Math.min(newValue, endValue - step);
      onStartChange(Math.max(min, clampedValue));
    } else {
      const clampedValue = Math.max(newValue, startValue + step);
      onEndChange(Math.min(max, clampedValue));
    }
  }, [disabled, isDragging, getValue, startValue, endValue, min, max, step, onStartChange, onEndChange]);

  // 全局事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const startPercentage = getPercentage(startValue);
  const endPercentage = getPercentage(endValue);

  return (
    <div className="relative">
      {/* 轨道 */}
      <div
        ref={sliderRef}
        className={`relative h-3 bg-gray-200 rounded-full cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={handleTrackClick}
      >
        {/* 选中区域 */}
        <div
          className="absolute top-0 h-3 bg-primary-500 rounded-full"
          style={{
            left: `${startPercentage}%`,
            width: `${endPercentage - startPercentage}%`,
          }}
        />
        
        {/* 开始滑块 */}
        <div
          className={`absolute top-1/2 w-5 h-5 bg-primary-600 border-2 border-white rounded-full shadow-lg transform -translate-y-1/2 cursor-grab ${
            isDragging === 'start' ? 'cursor-grabbing scale-110' : ''
          } ${disabled ? 'cursor-not-allowed' : 'hover:scale-105'} transition-transform duration-150`}
          style={{ left: `calc(${startPercentage}% - 10px)` }}
          onMouseDown={(e) => handleMouseDown(e, 'start')}
        >
          {/* 拖拽指示器 */}
          <div className="absolute inset-1 bg-white rounded-full" />
        </div>
        
        {/* 结束滑块 */}
        <div
          className={`absolute top-1/2 w-5 h-5 bg-primary-600 border-2 border-white rounded-full shadow-lg transform -translate-y-1/2 cursor-grab ${
            isDragging === 'end' ? 'cursor-grabbing scale-110' : ''
          } ${disabled ? 'cursor-not-allowed' : 'hover:scale-105'} transition-transform duration-150`}
          style={{ left: `calc(${endPercentage}% - 10px)` }}
          onMouseDown={(e) => handleMouseDown(e, 'end')}
        >
          {/* 拖拽指示器 */}
          <div className="absolute inset-1 bg-white rounded-full" />
        </div>
      </div>
      
      {/* 时间刻度 */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>0:00</span>
        <span>{Math.floor(max / 60)}:{(Math.floor(max % 60)).toString().padStart(2, '0')}</span>
      </div>
    </div>
  );
};

export default TimeRangeSlider; 