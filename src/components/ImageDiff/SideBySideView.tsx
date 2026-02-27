import type { ImageInfo } from '../../types';

interface SideBySideViewProps {
  imageA: ImageInfo;
  imageB: ImageInfo;
  diffImageSrc: string | null;
}

/** 并排对比视图 */
const SideBySideView = ({ imageA, imageB, diffImageSrc }: SideBySideViewProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 原始设计稿 */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          设计稿 (原始)
        </h4>
        <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
          <img
            src={imageA.src}
            alt="设计稿"
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* 实际截图 */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          实际截图
        </h4>
        <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
          <img
            src={imageB.src}
            alt="实际截图"
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* 差异图 */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          差异对比
        </h4>
        <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
          {diffImageSrc ? (
            <img
              src={diffImageSrc}
              alt="差异图"
              className="w-full h-auto object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
              计算中...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SideBySideView;
