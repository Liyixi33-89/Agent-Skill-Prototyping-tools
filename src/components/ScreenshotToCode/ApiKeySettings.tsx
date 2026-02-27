import { useState } from 'react';
import type { AiApiConfig } from '../../types';
import { DEFAULT_AI_CONFIG } from '../../types';

interface ApiKeySettingsProps {
  config: AiApiConfig;
  onChange: (config: AiApiConfig) => void;
}

/** AI API 配置面板 */
const ApiKeySettings = ({ config, onChange }: ApiKeySettingsProps) => {
  const [showKey, setShowKey] = useState(false);

  const handleFieldChange = (field: keyof AiApiConfig, value: string) => {
    onChange({ ...config, [field]: value });
  };

  const handleToggleKeyVisibility = () => {
    setShowKey((prev) => !prev);
  };

  const handleReset = () => {
    onChange({ ...DEFAULT_AI_CONFIG });
  };

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          AI API 配置
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
        {/* API Key */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-xs text-slate-400" htmlFor="api-key-input">
            API Key
          </label>
          <div className="relative">
            <input
              id="api-key-input"
              type={showKey ? 'text' : 'password'}
              value={config.apiKey}
              onChange={(e) => handleFieldChange('apiKey', e.target.value)}
              placeholder="sk-..."
              className="w-full h-9 bg-slate-900 border border-slate-700 rounded-lg px-3 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="API Key"
            />
            <button
              type="button"
              onClick={handleToggleKeyVisibility}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              aria-label={showKey ? '隐藏 API Key' : '显示 API Key'}
              tabIndex={0}
            >
              {showKey ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* API Endpoint */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400" htmlFor="api-endpoint-input">
            API 端点
          </label>
          <input
            id="api-endpoint-input"
            type="text"
            value={config.endpoint}
            onChange={(e) => handleFieldChange('endpoint', e.target.value)}
            placeholder="https://api.openai.com/v1/chat/completions"
            className="w-full h-9 bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="API 端点"
          />
        </div>

        {/* 模型名称 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400" htmlFor="model-input">
            模型名称
          </label>
          <input
            id="model-input"
            type="text"
            value={config.model}
            onChange={(e) => handleFieldChange('model', e.target.value)}
            placeholder="gpt-4o"
            className="w-full h-9 bg-slate-900 border border-slate-700 rounded-lg px-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="模型名称"
          />
        </div>

        {/* 自定义提示词 */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-xs text-slate-400" htmlFor="custom-prompt-input">
            自定义提示词 <span className="text-slate-600">(可选)</span>
          </label>
          <textarea
            id="custom-prompt-input"
            value={config.customPrompt}
            onChange={(e) => handleFieldChange('customPrompt', e.target.value)}
            placeholder="例如：请使用 Shadcn UI 组件库..."
            rows={2}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            aria-label="自定义提示词"
          />
        </div>
      </div>

      {/* 提示 */}
      <div className="mt-3 flex items-start gap-2 text-xs text-slate-500">
        <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <p>
          支持 OpenAI、Azure OpenAI 及所有兼容 API 格式的服务。需要支持 Vision（图片输入）的模型，如 GPT-4o、Claude 3.5 等。
          API Key 仅保存在浏览器本地，不会上传到任何服务器。
        </p>
      </div>
    </div>
  );
};

export default ApiKeySettings;
