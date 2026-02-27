interface DiffHighlightViewProps {
  diffImageSrc: string | null;
  heatmapSrc: string | null;
}

/** 差异高亮视图：展示像素差异图和热力图 */
const DiffHighlightView = ({ diffImageSrc, heatmapSrc }: DiffHighlightViewProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 像素差异图 */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          像素差异图
        </h4>
        <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
          {diffImageSrc ? (
            <img
              src={diffImageSrc}
              alt="像素差异图"
              className="w-full h-auto object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
              计算中...
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500">
          粉红色区域表示存在像素差异的位置
        </p>
      </div>

      {/* 热力图 */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          差异热力图
        </h4>
        <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
          {heatmapSrc ? (
            <img
              src={heatmapSrc}
              alt="差异热力图"
              className="w-full h-auto object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
              计算中...
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-[#1e1e1e]" />
            无差异
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-[#22c55e]" />
            轻微
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-[#facc15]" />
            中等
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-[#ef4444]" />
            严重
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiffHighlightView;
