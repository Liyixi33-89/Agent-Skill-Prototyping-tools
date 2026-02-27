import { useCallback, useState } from 'react';
import type { AppTab, ImageInfo } from './types';
import ImageUploader from './components/ImageUploader';
import { ImageDiffPanel } from './components/ImageDiff';
import { ScreenshotToCode } from './components/ScreenshotToCode';

/** 功能 Tab 配置 */
const APP_TABS: { value: AppTab; label: string; icon: string; desc: string }[] = [
  { value: 'image-diff', label: '设计稿对比', icon: '🔍', desc: 'Image Diff' },
  { value: 'screenshot-to-code', label: '截图转代码', icon: '⚡', desc: 'Screenshot → Code' },
];

const App = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('screenshot-to-code');
  const [imageA, setImageA] = useState<ImageInfo | null>(null);
  const [imageB, setImageB] = useState<ImageInfo | null>(null);

  const handleImageALoaded = useCallback((image: ImageInfo) => {
    setImageA(image);
  }, []);

  const handleImageBLoaded = useCallback((image: ImageInfo) => {
    setImageB(image);
  }, []);

  const handleReset = () => {
    setImageA(null);
    setImageB(null);
  };

  const hasImages = imageA !== null || imageB !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/20">
              AI
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">
                AI 设计工具
              </h1>
              <p className="text-[10px] text-slate-500 -mt-0.5">
                设计稿对比 · 截图转代码
              </p>
            </div>
          </div>

          {/* Tab 切换 */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-800/70 border border-slate-700/50">
            {APP_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                  transition-all duration-150
                  ${activeTab === tab.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }
                `}
                aria-label={`切换到${tab.label}`}
                tabIndex={0}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* 重置按钮（仅 Image Diff 模式下显示） */}
          {activeTab === 'image-diff' && hasImages && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 transition-all duration-150"
              aria-label="重置所有图片"
              tabIndex={0}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              重置
            </button>
          )}

          {/* 占位，保持布局 */}
          {(activeTab === 'screenshot-to-code' || !hasImages) && <div />}
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ===== Image Diff Tab ===== */}
        {activeTab === 'image-diff' && (
          <div className="flex flex-col gap-6">
            {/* 图片上传区域 */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageUploader
                  label="设计稿 (原始)"
                  onImageLoaded={handleImageALoaded}
                  currentImage={imageA}
                />
                <ImageUploader
                  label="实际截图 (对比)"
                  onImageLoaded={handleImageBLoaded}
                  currentImage={imageB}
                />
              </div>
            </section>

            {/* 分隔线 */}
            {imageA && imageB && (
              <div className="border-t border-slate-800" />
            )}

            {/* 对比结果面板 */}
            <section>
              <ImageDiffPanel imageA={imageA} imageB={imageB} />
            </section>
          </div>
        )}

        {/* ===== Screenshot to Code Tab ===== */}
        {activeTab === 'screenshot-to-code' && (
          <ScreenshotToCode />
        )}
      </main>

      {/* 底部信息 */}
      <footer className="border-t border-slate-800 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <p className="text-xs text-slate-600">
            AI 设计/原型工具 · Agent Skill Prototyping
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span>纯浏览器端处理</span>
            <span>·</span>
            <span>支持 PNG / JPG / WebP</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
