import { useState, useCallback } from 'react';

/** 代码 Tab 类型 */
type CodeTab = 'react' | 'vue' | 'css' | 'html';

interface CodePreviewProps {
  reactCode: string;
  vueCode: string;
  cssCode: string;
  htmlCode: string;
}

/** 代码预览/复制面板 */
const CodePreview = ({ reactCode, vueCode, cssCode, htmlCode }: CodePreviewProps) => {
  const [activeTab, setActiveTab] = useState<CodeTab>('react');
  const [copied, setCopied] = useState(false);

  const CODE_TABS: { value: CodeTab; label: string; icon: string }[] = [
    { value: 'react', label: 'React + Tailwind', icon: '⚛' },
    { value: 'vue', label: 'Vue 3 + Tailwind', icon: '🟢' },
    { value: 'css', label: 'CSS', icon: '🎨' },
    { value: 'html', label: 'HTML', icon: '📄' },
  ];

  const currentCode = activeTab === 'react' ? reactCode : activeTab === 'vue' ? vueCode : activeTab === 'css' ? cssCode : htmlCode;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 回退方案
      const textarea = document.createElement('textarea');
      textarea.value = currentCode;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [currentCode]);

  const handleDownload = useCallback(() => {
    const extensions: Record<CodeTab, string> = {
      react: 'tsx',
      vue: 'vue',
      css: 'css',
      html: 'html',
    };
    const ext = extensions[activeTab];
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-component.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentCode, activeTab]);

  if (!reactCode && !vueCode && !cssCode && !htmlCode) {
    return null;
  }

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
      {/* Tab 栏 */}
      <div className="flex items-center justify-between border-b border-slate-700/50 px-2 py-1">
        <div className="flex items-center gap-1">
          {CODE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                transition-all duration-150
                ${activeTab === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }
              `}
              aria-label={`查看 ${tab.label} 代码`}
              tabIndex={0}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
            aria-label="复制代码"
            tabIndex={0}
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-400">已复制</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                复制
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
            aria-label="下载代码文件"
            tabIndex={0}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            下载
          </button>
        </div>
      </div>

      {/* 代码区域 */}
      <div className="relative max-h-[500px] overflow-auto">
        <pre className="p-4 text-sm leading-relaxed">
          <code className="text-slate-300 whitespace-pre font-mono text-xs">
            {currentCode || '// 暂无代码'}
          </code>
        </pre>
      </div>

      {/* 代码行数统计 */}
      <div className="border-t border-slate-700/50 px-4 py-1.5 flex items-center justify-between">
        <span className="text-[10px] text-slate-600">
          {currentCode.split('\n').length} 行
        </span>
        <span className="text-[10px] text-slate-600">
          {(new Blob([currentCode]).size / 1024).toFixed(1)} KB
        </span>
      </div>
    </div>
  );
};

export default CodePreview;
