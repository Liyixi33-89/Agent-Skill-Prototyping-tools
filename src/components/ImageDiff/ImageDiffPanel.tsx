import { useCallback, useEffect, useState } from 'react';
import type { DiffMode, DiffOptions, DiffResult, ImageInfo } from '../../types';
import { DEFAULT_DIFF_OPTIONS } from '../../types';
import { generateHeatmapDiff, performImageDiff } from '../../utils/imageDiff';
import DiffStats from './DiffStats';
import DiffSettings from './DiffSettings';
import SideBySideView from './SideBySideView';
import OverlayView from './OverlayView';
import SliderView from './SliderView';
import DiffHighlightView from './DiffHighlightView';

interface ImageDiffPanelProps {
  imageA: ImageInfo | null;
  imageB: ImageInfo | null;
}

/** 对比模式选项 */
const DIFF_MODES: { value: DiffMode; label: string; icon: string }[] = [
  { value: 'side-by-side', label: '并排对比', icon: '⊞' },
  { value: 'overlay', label: '叠加对比', icon: '◎' },
  { value: 'slider', label: '滑块对比', icon: '⇔' },
  { value: 'diff-highlight', label: '差异高亮', icon: '△' },
];

/** 图像对比主面板 */
const ImageDiffPanel = ({ imageA, imageB }: ImageDiffPanelProps) => {
  const [diffMode, setDiffMode] = useState<DiffMode>('side-by-side');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [heatmapSrc, setHeatmapSrc] = useState<string | null>(null);
  const [diffOptions, setDiffOptions] = useState<DiffOptions>(DEFAULT_DIFF_OPTIONS);
  const [isComputing, setIsComputing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  /** 执行对比 */
  const runDiff = useCallback(async () => {
    if (!imageA || !imageB) return;

    setIsComputing(true);
    try {
      const [result, heatmap] = await Promise.all([
        performImageDiff(imageA, imageB, diffOptions),
        generateHeatmapDiff(imageA, imageB),
      ]);
      setDiffResult(result);
      setHeatmapSrc(heatmap);
    } catch (error) {
      console.error('对比失败:', error);
    } finally {
      setIsComputing(false);
    }
  }, [imageA, imageB, diffOptions]);

  /** 当图片或设置变化时自动重新对比 */
  useEffect(() => {
    runDiff();
  }, [runDiff]);

  // 两张图片都未上传
  if (!imageA || !imageB) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-500">
        <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm">请上传两张图片以开始对比</p>
        <p className="text-xs text-slate-600 mt-1">
          支持设计稿 vs 实际截图、不同版本对比等场景
        </p>
      </div>
    );
  }

  const handleToggleSettings = () => {
    setShowSettings((prev) => !prev);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 工具栏：模式切换 + 设置按钮 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* 模式切换 */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-800/70 border border-slate-700/50">
          {DIFF_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setDiffMode(mode.value)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                transition-all duration-150
                ${diffMode === mode.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }
              `}
              aria-label={`切换到${mode.label}模式`}
              tabIndex={0}
            >
              <span className="text-sm">{mode.icon}</span>
              {mode.label}
            </button>
          ))}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {isComputing && (
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              对比计算中...
            </div>
          )}
          <button
            type="button"
            onClick={handleToggleSettings}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
              transition-all duration-150 border
              ${showSettings
                ? 'bg-slate-700 text-slate-200 border-slate-600'
                : 'text-slate-400 hover:text-slate-200 border-slate-700 hover:border-slate-600'
              }
            `}
            aria-label="切换对比设置面板"
            tabIndex={0}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            设置
          </button>

          <button
            type="button"
            onClick={runDiff}
            disabled={isComputing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="重新对比"
            tabIndex={0}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            重新对比
          </button>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <DiffSettings options={diffOptions} onChange={setDiffOptions} />
      )}

      {/* 统计信息 */}
      {diffResult && <DiffStats result={diffResult} />}

      {/* 对比视图区域 */}
      <div className="min-h-[300px]">
        {diffMode === 'side-by-side' && (
          <SideBySideView
            imageA={imageA}
            imageB={imageB}
            diffImageSrc={diffResult?.diffImageSrc ?? null}
          />
        )}
        {diffMode === 'overlay' && (
          <OverlayView imageA={imageA} imageB={imageB} />
        )}
        {diffMode === 'slider' && (
          <SliderView imageA={imageA} imageB={imageB} />
        )}
        {diffMode === 'diff-highlight' && (
          <DiffHighlightView
            diffImageSrc={diffResult?.diffImageSrc ?? null}
            heatmapSrc={heatmapSrc}
          />
        )}
      </div>
    </div>
  );
};

export default ImageDiffPanel;
