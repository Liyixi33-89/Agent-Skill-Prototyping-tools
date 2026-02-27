import { useState } from 'react';
import type { ImageInfo } from '../../types';

interface OverlayViewProps {
  imageA: ImageInfo;
  imageB: ImageInfo;
}

/** 叠加透明度对比视图 */
const OverlayView = ({ imageA, imageB }: OverlayViewProps) => {
  const [opacity, setOpacity] = useState(0.5);

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOpacity(Number(e.target.value));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 透明度控制 */}
      <div className="flex items-center gap-4 px-2">
        <span className="text-xs text-slate-400 w-16">设计稿</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={opacity}
          onChange={handleOpacityChange}
          className="flex-1"
          aria-label="调整叠加透明度"
        />
        <span className="text-xs text-slate-400 w-16 text-right">实际截图</span>
      </div>

      {/* 叠加预览 */}
      <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
        <img
          src={imageA.src}
          alt="设计稿"
          className="w-full h-auto object-contain"
          style={{ opacity: 1 - opacity }}
        />
        <img
          src={imageB.src}
          alt="实际截图"
          className="absolute inset-0 w-full h-auto object-contain"
          style={{ opacity }}
        />
      </div>

      <div className="text-center text-xs text-slate-500">
        当前透明度: {Math.round(opacity * 100)}% 实际截图 / {Math.round((1 - opacity) * 100)}% 设计稿
      </div>
    </div>
  );
};

export default OverlayView;
