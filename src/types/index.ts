/** 对比模式 */
export type DiffMode = 'side-by-side' | 'overlay' | 'slider' | 'diff-highlight';

/** 应用功能 Tab */
export type AppTab = 'image-diff' | 'screenshot-to-code';

/** 单张图片信息 */
export interface ImageInfo {
  /** 图片文件名 */
  name: string;
  /** base64 或 object URL */
  src: string;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
}

/** 对比结果 */
export interface DiffResult {
  /** 差异图片 data URL */
  diffImageSrc: string;
  /** 不同像素数 */
  diffPixelCount: number;
  /** 总像素数 */
  totalPixels: number;
  /** 差异百分比 (0-100) */
  diffPercentage: number;
  /** 对比使用的宽高 */
  width: number;
  height: number;
}

/** 对比配置 */
export interface DiffOptions {
  /** pixelmatch 容差阈值 (0-1)，默认 0.1 */
  threshold: number;
  /** 是否包含抗锯齿像素对比 */
  includeAA: boolean;
  /** 差异颜色 [R, G, B] */
  diffColor: [number, number, number];
  /** 透明度 (0-1) */
  alpha: number;
}

/** 默认对比配置 */
export const DEFAULT_DIFF_OPTIONS: DiffOptions = {
  threshold: 0.1,
  includeAA: false,
  diffColor: [255, 0, 110],
  alpha: 0.1,
};

/** ========== 截图转代码相关类型 ========== */

/** 代码生成模式 */
export type CodeGenMode = 'local' | 'ai' | 'ollama';

/** 检测到的 UI 区块 */
export interface DetectedBlock {
  /** 区块 ID */
  id: string;
  /** 区块类型推断 */
  type: 'container' | 'text' | 'button' | 'image' | 'input' | 'card' | 'nav' | 'header' | 'footer' | 'unknown';
  /** 位置坐标 */
  x: number;
  y: number;
  /** 宽高 */
  width: number;
  height: number;
  /** 背景颜色 (hex) */
  backgroundColor: string;
  /** 边框颜色 */
  borderColor: string | null;
  /** 子区块 */
  children: DetectedBlock[];
}

/** 生成的代码结果 */
export interface GeneratedCode {
  /** React 组件代码 (JSX + TailwindCSS) */
  reactCode: string;
  /** Vue 组件代码 (SFC + TailwindCSS) */
  vueCode: string;
  /** 纯 CSS 版本 */
  cssCode: string;
  /** HTML 结构 */
  htmlCode: string;
  /** 生成模式 */
  mode: CodeGenMode;
  /** 生成耗时 (ms) */
  duration: number;
}

/** AI API 配置 */
export interface AiApiConfig {
  /** API Key */
  apiKey: string;
  /** API 端点 URL */
  endpoint: string;
  /** 模型名称 */
  model: string;
  /** 自定义提示词 */
  customPrompt: string;
}

/** 默认 AI 配置 */
export const DEFAULT_AI_CONFIG: AiApiConfig = {
  apiKey: '',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4o',
  customPrompt: '',
};

/** Ollama 配置 */
export interface OllamaConfig {
  /** Ollama 服务地址 */
  baseUrl: string;
  /** 模型名称 (需要支持 Vision，如 llava, bakllava, llava-llama3 等) */
  model: string;
  /** 自定义提示词 */
  customPrompt: string;
  /** 生成超时时间 (秒) */
  timeout: number;
}

/** 默认 Ollama 配置 */
export const DEFAULT_OLLAMA_CONFIG: OllamaConfig = {
  baseUrl: 'http://localhost:11434',
  model: 'qwen3-vl:235b-cloud',
  customPrompt: '',
  timeout: 300,
};
