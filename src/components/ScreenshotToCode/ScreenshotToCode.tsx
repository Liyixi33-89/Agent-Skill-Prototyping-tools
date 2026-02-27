import { useCallback, useState } from 'react';
import type { AiApiConfig, CodeGenMode, DeviceType, GeneratedCode, ImageInfo, OllamaConfig } from '../../types';
import { DEFAULT_AI_CONFIG, DEFAULT_OLLAMA_CONFIG } from '../../types';
import { loadImageFromFile } from '../../utils/imageDiff';
import { generateCodeFromImage } from '../../utils/codeGenerator';
import { generateCodeWithAI } from '../../utils/aiCodeGenerator';
import { generateCodeWithOllama } from '../../utils/ollamaCodeGenerator';
import CodePreview from './CodePreview';
import ApiKeySettings from './ApiKeySettings';
import OllamaSettings from './OllamaSettings';

/** 截图转代码主面板 */
const ScreenshotToCode = () => {
  const [screenshot, setScreenshot] = useState<ImageInfo | null>(null);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genMode, setGenMode] = useState<CodeGenMode>('local');
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [aiConfig, setAiConfig] = useState<AiApiConfig>(DEFAULT_AI_CONFIG);
  const [ollamaConfig, setOllamaConfig] = useState<OllamaConfig>(DEFAULT_OLLAMA_CONFIG);
  const [showOllamaSettings, setShowOllamaSettings] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deviceType, setDeviceType] = useState<DeviceType>('pc');

  /** 处理图片上传 */
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件（PNG、JPG、WebP）');
      return;
    }

    setError(null);
    try {
      const imageInfo = await loadImageFromFile(file);
      setScreenshot(imageInfo);
      setGeneratedCode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片加载失败');
    }
  }, []);

  /** 拖拽处理 */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
      e.target.value = '';
    },
    [handleFileUpload],
  );

  /** 生成代码 */
  const handleGenerate = useCallback(async () => {
    if (!screenshot) return;

    setIsGenerating(true);
    setError(null);

    try {
      let result: GeneratedCode;

      if (genMode === 'ai') {
        result = await generateCodeWithAI(screenshot, aiConfig, deviceType);
      } else if (genMode === 'ollama') {
        result = await generateCodeWithOllama(screenshot, ollamaConfig, deviceType);
      } else {
        result = await generateCodeFromImage(screenshot, deviceType);
      }

      setGeneratedCode(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '代码生成失败');
    } finally {
      setIsGenerating(false);
    }
  }, [screenshot, genMode, aiConfig, ollamaConfig, deviceType]);

  /** 重置 */
  const handleReset = () => {
    setScreenshot(null);
    setGeneratedCode(null);
    setError(null);
  };

  const handleToggleApiSettings = () => {
    setShowApiSettings((prev) => !prev);
  };

  const handleToggleOllamaSettings = () => {
    setShowOllamaSettings((prev) => !prev);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 模式切换 + 操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* 生成模式切换 */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-800/70 border border-slate-700/50">
          <button
            type="button"
            onClick={() => setGenMode('local')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
              transition-all duration-150
              ${genMode === 'local'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }
            `}
            aria-label="使用本地分析模式"
            tabIndex={0}
          >
            <span>🖥</span>
            本地分析
          </button>
          <button
            type="button"
            onClick={() => setGenMode('ai')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
              transition-all duration-150
              ${genMode === 'ai'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }
            `}
            aria-label="使用 AI Vision 模式"
            tabIndex={0}
          >
            <span>🤖</span>
            AI Vision
          </button>
          <button
            type="button"
            onClick={() => setGenMode('ollama')}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
              transition-all duration-150
              ${genMode === 'ollama'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }
            `}
            aria-label="使用本地 Ollama 模式"
            tabIndex={0}
          >
            <span>🦙</span>
            Ollama
          </button>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {/* PC/移动端切换开关 */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-800/70 border border-slate-700/50">
            <button
              type="button"
              onClick={() => setDeviceType('pc')}
              className={`
                flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium
                transition-all duration-150
                ${deviceType === 'pc'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }
              `}
              aria-label="切换为 PC 端模式"
              tabIndex={0}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              PC
            </button>
            <button
              type="button"
              onClick={() => setDeviceType('mobile')}
              className={`
                flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium
                transition-all duration-150
                ${deviceType === 'mobile'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }
              `}
              aria-label="切换为移动端模式（375px 基准 rem）"
              tabIndex={0}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              移动端
            </button>
          </div>

          {deviceType === 'mobile' && (
            <span className="text-[10px] text-orange-400/70 bg-orange-500/10 px-2 py-0.5 rounded">
              基准 375px → rem
            </span>
          )}
          {genMode === 'ai' && (
            <button
              type="button"
              onClick={handleToggleApiSettings}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                transition-all duration-150 border
                ${showApiSettings
                  ? 'bg-slate-700 text-slate-200 border-slate-600'
                  : 'text-slate-400 hover:text-slate-200 border-slate-700 hover:border-slate-600'
                }
              `}
              aria-label="切换 API 配置面板"
              tabIndex={0}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              API 设置
            </button>
          )}
          {genMode === 'ollama' && (
            <button
              type="button"
              onClick={handleToggleOllamaSettings}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                transition-all duration-150 border
                ${showOllamaSettings
                  ? 'bg-slate-700 text-slate-200 border-slate-600'
                  : 'text-slate-400 hover:text-slate-200 border-slate-700 hover:border-slate-600'
                }
              `}
              aria-label="切换 Ollama 配置面板"
              tabIndex={0}
            >
              <span>🦙</span>
              Ollama 设置
            </button>
          )}
          {screenshot && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 transition-all duration-150"
              aria-label="重置截图"
              tabIndex={0}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              重置
            </button>
          )}
        </div>
      </div>

      {/* AI 设置面板 */}
      {genMode === 'ai' && showApiSettings && (
        <ApiKeySettings config={aiConfig} onChange={setAiConfig} />
      )}

      {/* Ollama 设置面板 */}
      {genMode === 'ollama' && showOllamaSettings && (
        <OllamaSettings config={ollamaConfig} onChange={setOllamaConfig} />
      )}

      {/* 上传区域 */}
      {!screenshot && (
        <div
          className={`
            flex flex-col items-center justify-center min-h-[280px] rounded-xl border-2 border-dashed
            transition-all duration-200 cursor-pointer
            ${isDragging
              ? 'border-purple-400 bg-purple-500/10 scale-[1.01]'
              : 'border-slate-600 bg-slate-800/30 hover:border-blue-500 hover:bg-blue-500/5'
            }
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('screenshot-input')?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              document.getElementById('screenshot-input')?.click();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="点击或拖拽上传截图"
        >
          <input
            id="screenshot-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
            aria-hidden="true"
          />

          <div className="flex flex-col items-center gap-4 p-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-300 font-medium">
                上传 UI 截图，自动生成 React 组件代码
              </p>
              <p className="text-xs text-slate-500 mt-1">
                拖拽图片到此处，或 <span className="text-blue-400 underline">点击上传</span>
              </p>
              <p className="text-xs text-slate-600 mt-3 max-w-md">
                {genMode === 'local'
                  ? '本地模式：基于像素分析检测 UI 区块，自动推断布局并生成代码'
                  : genMode === 'ollama'
                    ? 'Ollama 模式：支持本地/云端 Vision 模型分析截图，默认使用 qwen3-vl:235b-cloud 云端模型'
                    : 'AI 模式：使用 Vision LLM 精准识别 UI 元素，生成高质量代码'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 已上传截图预览 + 生成按钮 */}
      {screenshot && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 截图预览 */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                上传的截图
              </h4>
              <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900 relative">
                <img
                  src={screenshot.src}
                  alt={screenshot.name}
                  className="w-full h-auto max-h-[400px] object-contain"
                />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <span className="text-xs text-slate-300 truncate max-w-[60%]">
                    {screenshot.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {screenshot.width} × {screenshot.height}
                  </span>
                </div>
              </div>
            </div>

            {/* 生成控制 */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                代码生成
              </h4>
              <div className="flex-1 rounded-lg border border-slate-700 bg-slate-900/50 p-4 flex flex-col items-center justify-center gap-4">
                {!generatedCode && !isGenerating && (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-300">
                        准备就绪
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {genMode === 'local'
                          ? '使用本地 Canvas 分析生成代码'
                          : genMode === 'ollama'
                            ? `使用 Ollama ${ollamaConfig.model} 模型生成代码`
                            : aiConfig.apiKey
                              ? `使用 ${aiConfig.model} 模型生成代码`
                              : '请先配置 API Key'}
                      </p>
                    </div>
                  </>
                )}

                {isGenerating && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-blue-400">
                      {genMode === 'ai' ? 'AI 正在分析截图...' : genMode === 'ollama' ? 'Ollama 正在分析截图...' : '正在分析像素数据...'}
                    </p>
                  </div>
                )}

                {generatedCode && (
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm text-emerald-400 font-medium">生成完成</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>
                        模式: {generatedCode.mode === 'ai' ? 'AI Vision' : generatedCode.mode === 'ollama' ? 'Ollama' : '本地分析'}
                      </span>
                      <span>·</span>
                      <span>耗时: {generatedCode.duration}ms</span>
                    </div>
                  </div>
                )}

                {/* 生成/重新生成按钮 */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || (genMode === 'ai' && !aiConfig.apiKey) || (genMode === 'ollama' && !ollamaConfig.model)}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200 shadow-lg
                    ${genMode === 'ai'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-500/20'
                      : genMode === 'ollama'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-500/20'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                  `}
                  aria-label={generatedCode ? '重新生成代码' : '开始生成代码'}
                  tabIndex={0}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {generatedCode ? '重新生成' : '生成代码'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 flex items-start gap-2">
          <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* 生成的代码预览 */}
      {generatedCode && (
        <CodePreview
          reactCode={generatedCode.reactCode}
          vueCode={generatedCode.vueCode}
          cssCode={generatedCode.cssCode}
          htmlCode={generatedCode.htmlCode}
          deviceType={generatedCode.deviceType}
        />
      )}
    </div>
  );
};

export default ScreenshotToCode;
