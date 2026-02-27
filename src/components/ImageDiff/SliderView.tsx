import { useCallback, useRef, useState } from 'react';
import type { ImageInfo } from '../../types';

interface SliderViewProps {
  imageA: ImageInfo;
  imageB: ImageInfo;
}

/** 滑块对比视图：左右拖动滑块查看差异 */
const SliderView = ({ imageA, imageB }: SliderViewProps) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updateSliderPosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      updateSliderPosition(e.clientX);
    },
    [updateSliderPosition],
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      updateSliderPosition(e.clientX);
    },
    [updateSliderPosition],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      if (touch) updateSliderPosition(touch.clientX);
    },
    [updateSliderPosition],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-2">
        <span className="text-xs text-blue-400 font-medium">← 设计稿</span>
        <span className="text-xs text-emerald-400 font-medium">实际截图 →</span>
      </div>

      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900 cursor-col-resize select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onTouchMove={handleTouchMove}
        role="slider"
        aria-label="拖动滑块对比两张图片"
        aria-valuenow={Math.round(sliderPosition)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
      >
        {/* 底层：实际截图（右侧完整显示） */}
        <img
          src={imageB.src}
          alt="实际截图"
          className="w-full h-auto object-contain"
          draggable={false}
        />

        {/* 上层：设计稿（被裁切） */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={imageA.src}
            alt="设计稿"
            className="h-full object-contain"
            style={{ width: containerRef.current?.offsetWidth || '100%' }}
            draggable={false}
          />
        </div>

        {/* 滑块线 */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          {/* 滑块手柄 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SliderView;
