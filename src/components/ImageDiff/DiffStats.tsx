import type { DiffResult } from '../../types';

interface DiffStatsProps {
  result: DiffResult;
}

/** 对比统计信息面板 */
const DiffStats = ({ result }: DiffStatsProps) => {
  const { diffPixelCount, totalPixels, diffPercentage, width, height } = result;
  const matchPercentage = (100 - diffPercentage).toFixed(2);

  /** 根据差异百分比确定状态等级 */
  const getStatusLevel = (): { label: string; color: string; bgColor: string } => {
    if (diffPercentage === 0) {
      return { label: '完全一致', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' };
    }
    if (diffPercentage < 1) {
      return { label: '高度匹配', color: 'text-green-400', bgColor: 'bg-green-500/10' };
    }
    if (diffPercentage < 5) {
      return { label: '轻微差异', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' };
    }
    if (diffPercentage < 15) {
      return { label: '中等差异', color: 'text-orange-400', bgColor: 'bg-orange-500/10' };
    }
    return { label: '差异较大', color: 'text-red-400', bgColor: 'bg-red-500/10' };
  };

  const status = getStatusLevel();

  return (
    <div className={`rounded-xl p-4 ${status.bgColor} border border-slate-700/50`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* 匹配度圆环 */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="35"
                fill="none"
                stroke="#334155"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="35"
                fill="none"
                stroke={diffPercentage === 0 ? '#22c55e' : diffPercentage < 5 ? '#eab308' : '#ef4444'}
                strokeWidth="6"
                strokeDasharray={`${(Number(matchPercentage) / 100) * 220} 220`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold ${status.color}`}>
                {matchPercentage}%
              </span>
            </div>
          </div>

          <div>
            <div className={`text-lg font-bold ${status.color}`}>
              {status.label}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              匹配度 {matchPercentage}%
            </div>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">差异像素</span>
            <span className="text-sm font-semibold text-slate-200">
              {diffPixelCount.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">总像素</span>
            <span className="text-sm font-semibold text-slate-200">
              {totalPixels.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">差异占比</span>
            <span className="text-sm font-semibold text-slate-200">
              {diffPercentage}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500">对比尺寸</span>
            <span className="text-sm font-semibold text-slate-200">
              {width} × {height}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiffStats;
