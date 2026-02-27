import { useCallback, useEffect, useState } from 'react';
import type { OllamaConfig } from '../../types';
import { DEFAULT_OLLAMA_CONFIG } from '../../types';
import { checkOllamaStatus, getOllamaModels } from '../../utils/ollamaCodeGenerator';
import type { OllamaModelInfo } from '../../utils/ollamaCodeGenerator';

interface OllamaSettingsProps {
  config: OllamaConfig;
  onChange: (config: OllamaConfig) => void;
}

/** Ollama 配置面板 */
const OllamaSettings = ({ config, onChange }: OllamaSettingsProps) => {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle');
  const [ollamaVersion, setOllamaVersion] = useState<string>('');
  const [statusError, setStatusError] = useState<string>('');
  const [models, setModels] = useState<OllamaModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string>('');

  const handleFieldChange = (field: keyof OllamaConfig, value: string | number) => {
    onChange({ ...config, [field]: value });
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_OLLAMA_CONFIG });
    setConnectionStatus('idle');
    setModels([]);
  };

  /** 检测 Ollama 连接状态 */
  const handleCheckConnection = useCallback(async () => {
    setConnectionStatus('checking');
    setStatusError('');

    const result = await checkOllamaStatus(config.baseUrl);

    if (result.online) {
      setConnectionStatus('online');
      setOllamaVersion(result.version || '');
      // 连接成功后自动拉取模型列表
      handleFetchModels();
    } else {
      setConnectionStatus('offline');
      setStatusError(result.error || '连接失败');
    }
  }, [config.baseUrl]);

  /** 获取模型列表 */
  const handleFetchModels = useCallback(async () => {
    setIsLoadingModels(true);
    setModelError('');
    try {
      const result = await getOllamaModels(config.baseUrl);
      setModels(result);
    } catch (err) {
      setModelError(err instanceof Error ? err.message : '获取模型失败');
    } finally {
      setIsLoadingModels(false);
    }
  }, [config.baseUrl]);

  /** 选择模型 */
  const handleSelectModel = (modelName: string) => {
    onChange({ ...config, model: modelName });
  };

  /** 格式化文件大小 */
  const formatSize = (bytes: number): string => {
    if (!bytes) return '';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  /** 组件挂载时自动检测连接 */
  useEffect(() => {
    handleCheckConnection();
  }, []);

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span className="text-lg">🦙</span>
          Ollama 配置
          {/* 连接状态指示灯 */}
          {connectionStatus === 'online' && (
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-normal">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              在线 {ollamaVersion && `(v${ollamaVersion})`}
            </span>
          )}
          {connectionStatus === 'offline' && (
            <span className="flex items-center gap-1 text-xs text-red-400 font-normal">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              离线
            </span>
          )}
        </h3>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="重置为默认配置"
          tabIndex={0}
        >
          重置默认
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Ollama 服务地址 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400" htmlFor="ollama-base-url">
            服务地址
          </label>
          <div className="flex gap-2">
            <input
              id="ollama-base-url"
              type="text"
              value={config.baseUrl}
              onChange={(e) => handleFieldChange('baseUrl', e.target.value)}
              placeholder="http://localhost:11434"
              className="flex-1 h-9 bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Ollama 服务地址"
            />
            <button
              type="button"
              onClick={handleCheckConnection}
              disabled={connectionStatus === 'checking'}
              className="h-9 px-3 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
              aria-label="测试连接"
              tabIndex={0}
            >
              {connectionStatus === 'checking' ? (
                <>
                  <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  检测中
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  测试连接
                </>
              )}
            </button>
          </div>
          {/* 连接错误提示 */}
          {connectionStatus === 'offline' && statusError && (
            <p className="text-xs text-red-400 mt-0.5">{statusError}</p>
          )}
        </div>

        {/* 模型选择 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400" htmlFor="ollama-model">
            模型名称 <span className="text-slate-600">(需要支持 Vision)</span>
          </label>
          <div className="flex gap-2">
            <input
              id="ollama-model"
              type="text"
              value={config.model}
              onChange={(e) => handleFieldChange('model', e.target.value)}
              placeholder="llava"
              className="flex-1 h-9 bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="模型名称"
            />
            <button
              type="button"
              onClick={handleFetchModels}
              disabled={isLoadingModels || connectionStatus !== 'online'}
              className="h-9 px-3 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
              aria-label="刷新模型列表"
              tabIndex={0}
            >
              {isLoadingModels ? (
                <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              刷新
            </button>
          </div>
        </div>

        {/* 已安装模型列表 */}
        {models.length > 0 && (
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs text-slate-400">
              已安装模型 <span className="text-slate-600">({models.length} 个)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {models.map((m) => {
                const isSelected = config.model === m.name;
                // 推荐支持 Vision 的模型高亮
                const isVisionModel = /llava|bakllava|llava-llama3|moondream|cogvlm|minicpm-v|qwen.*vl|qwen3-vl|qwen2\.5-vl/i.test(m.name);
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => handleSelectModel(m.name)}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                      transition-all duration-150 border
                      ${isSelected
                        ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                        : isVisionModel
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                      }
                    `}
                    aria-label={`选择模型 ${m.name}`}
                    tabIndex={0}
                  >
                    {isVisionModel && <span title="支持 Vision">👁</span>}
                    <span>{m.name}</span>
                    {m.parameterSize && (
                      <span className="text-[10px] text-slate-500">{m.parameterSize}</span>
                    )}
                    {m.size > 0 && (
                      <span className="text-[10px] text-slate-600">{formatSize(m.size)}</span>
                    )}
                  </button>
                );
              })}
            </div>
            {modelError && <p className="text-xs text-red-400">{modelError}</p>}
          </div>
        )}

        {/* 超时时间 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400" htmlFor="ollama-timeout">
            生成超时 <span className="text-slate-600">(秒)</span>
          </label>
          <input
            id="ollama-timeout"
            type="number"
            min={30}
            max={600}
            step={10}
            value={config.timeout}
            onChange={(e) => handleFieldChange('timeout', Number(e.target.value))}
            className="w-full h-9 bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="超时时间（秒）"
          />
        </div>

        {/* 自定义提示词 */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-xs text-slate-400" htmlFor="ollama-custom-prompt">
            自定义提示词 <span className="text-slate-600">(可选)</span>
          </label>
          <textarea
            id="ollama-custom-prompt"
            value={config.customPrompt}
            onChange={(e) => handleFieldChange('customPrompt', e.target.value)}
            placeholder="例如：请使用 Ant Design 组件库的风格..."
            rows={2}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            aria-label="自定义提示词"
          />
        </div>
      </div>

      {/* 提示信息 */}
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-start gap-2 text-xs text-slate-500">
          <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p>
              需要本地安装并运行 Ollama，且需要支持图片输入的 Vision 模型。支持本地模型（如 <code className="text-purple-400">llava</code>、<code className="text-purple-400">moondream</code>）和云端模型（如 <code className="text-purple-400">qwen3-vl:235b-cloud</code>）。
            </p>
            <p className="mt-1 text-slate-600">
              云端模型（推荐）: <code className="text-blue-400">qwen3-vl:235b-cloud</code> · 
              本地模型: <code className="text-blue-400">ollama pull llava</code> · 
              启动代理: <code className="text-blue-400">npm run server</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OllamaSettings;
