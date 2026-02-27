import type { DiffOptions } from '../../types';

interface DiffSettingsProps {
  options: DiffOptions;
  onChange: (options: DiffOptions) => void;
}

/** 对比设置面板 */
const DiffSettings = ({ options, onChange }: DiffSettingsProps) => {
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...options, threshold: Number(e.target.value) });
  };

  const handleAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...options, alpha: Number(e.target.value) });
  };

  const handleIncludeAAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...options, includeAA: e.target.checked });
  };

  const handleDiffColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    onChange({ ...options, diffColor: [r, g, b] });
  };

  const diffColorHex = `#${options.diffColor.map((c) => c.toString(16).padStart(2, '0')).join('')}`;

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
      <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        对比设置
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 容差阈值 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400" htmlFor="threshold-input">
            容差阈值
            <span className="ml-1 text-blue-400 font-mono">{options.threshold.toFixed(2)}</span>
          </label>
          <input
            id="threshold-input"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={options.threshold}
            onChange={handleThresholdChange}
            aria-label="容差阈值"
          />
          <span className="text-[10px] text-slate-500">值越小越敏感，越大越宽松</span>
        </div>

        {/* 背景透明度 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400" htmlFor="alpha-input">
            背景透明度
            <span className="ml-1 text-blue-400 font-mono">{options.alpha.toFixed(2)}</span>
          </label>
          <input
            id="alpha-input"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={options.alpha}
            onChange={handleAlphaChange}
            aria-label="背景透明度"
          />
          <span className="text-[10px] text-slate-500">未变化区域的可见程度</span>
        </div>

        {/* 差异颜色 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400" htmlFor="diff-color-input">
            差异标记颜色
          </label>
          <div className="flex items-center gap-2">
            <input
              id="diff-color-input"
              type="color"
              value={diffColorHex}
              onChange={handleDiffColorChange}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
              aria-label="差异标记颜色"
            />
            <span className="text-xs text-slate-400 font-mono">{diffColorHex}</span>
          </div>
        </div>

        {/* 抗锯齿 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-slate-400">高级选项</span>
          <label
            className="flex items-center gap-2 cursor-pointer"
            htmlFor="include-aa-input"
          >
            <input
              id="include-aa-input"
              type="checkbox"
              checked={options.includeAA}
              onChange={handleIncludeAAChange}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
            />
            <span className="text-xs text-slate-300">包含抗锯齿像素</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default DiffSettings;
