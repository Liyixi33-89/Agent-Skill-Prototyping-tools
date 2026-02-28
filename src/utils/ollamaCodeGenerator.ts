import type { DeviceType, GeneratedCode, ImageInfo, OllamaConfig } from '../types';
import { MOBILE_BASE_WIDTH } from '../types';

/** 代理服务基础地址（开发环境通过 Vite proxy 转发，生产环境需配置实际地址） */
const PROXY_BASE = '';

/**
 * 构建发送给 Ollama Vision 模型的系统提示词
 */
const buildSystemPrompt = (customPrompt: string, deviceType: DeviceType): string => {
  const deviceHint = deviceType === 'mobile'
    ? `

**重要：这是移动端设计稿，基准宽度为 ${MOBILE_BASE_WIDTH}px。**
- CSS 代码中所有尺寸单位必须使用 rem（基准: 1rem = ${MOBILE_BASE_WIDTH / 10}px，即设计稿 px 值 / ${MOBILE_BASE_WIDTH / 10}）
- CSS 开头必须包含: html { font-size: ${(100 / MOBILE_BASE_WIDTH * 10).toFixed(6)}vw; } 和 @media screen and (min-width: 750px) { html { font-size: 75px; } }
- HTML 代码中的内联样式也使用 rem
- React/Vue 代码中的 CSS 样式也全部使用 rem 单位`
    : '\n\n这是 PC 端设计稿，使用 px 作为尺寸单位。';

  const base = `你是一个专业的前端开发工程师。用户将给你一张 UI 截图，你需要分析截图中的界面布局、颜色、排版和所有交互元素，并生成对应的**功能完备、可交互**的代码。${deviceHint}

请严格按照以下 JSON 格式返回结果，不要包含其他内容：
{
  "reactCode": "完整的 React 组件代码（使用纯 CSS 进行样式处理，CSS 写在组件文件内，使用内联 style 对象或 CSS-in-JS 方式）",
  "vueCode": "完整的 Vue 3 SFC 单文件组件代码（样式写在 <style scoped> 中，使用纯 CSS）",
  "cssCode": "等效的纯 CSS 代码",
  "htmlCode": "等效的纯 HTML 代码"
}

要求：
1. React 代码使用函数式组件 + TypeScript，样式使用内联 style 对象（CSSProperties）或在组件底部定义 styles 对象，不要使用 TailwindCSS
2. Vue 代码使用 Vue 3 Composition API + <script setup lang="ts"> 语法，单文件组件（SFC）格式，包含 <template>、<script setup lang="ts">、<style scoped> 三个部分，样式写在 <style scoped> 中，使用纯 CSS class，不要使用 TailwindCSS
3. React 和 Vue 代码中禁止使用 TailwindCSS 类名，所有样式必须使用纯 CSS
4. 保持代码简洁、语义化
4. 尽量还原截图中的布局结构、颜色和间距
5. 为交互元素添加合适的无障碍属性（tabIndex、aria-label 等）
6. CSS 代码应是独立可用的，不依赖 Tailwind
7. **重要：为截图中识别到的所有可交互元素（按钮、链接、输入框、开关、下拉菜单、选项卡等）生成对应的事件处理函数**，使用 handle 前缀命名，例如：
   - "取消"按钮 → const handleCancel = () => { ... }
   - "确认/提交"按钮 → const handleSubmit = () => { ... }
   - "删除"按钮 → const handleDelete = () => { ... }
   - "关闭"按钮 → const handleClose = () => { ... }
   - "搜索"输入框 → const handleSearch = (e) => { ... }
   - 选项卡切换 → const handleTabChange = (tab) => { ... }
   - 下拉选择 → const handleSelect = (value) => { ... }
8. 事件处理函数中应包含合理的默认行为（如 console.log 提示、状态切换、弹窗提示等），而非空函数
8. Vue 代码中使用 ref/reactive 管理状态，使用 @click、@input 等 Vue 事件绑定语法
9. **重要：为截图中识别到的所有可交互元素（按钮、链接、输入框、开关、下拉菜单、选项卡等）生成对应的事件处理函数**，使用 handle 前缀命名，例如：
   - "取消"按钮 → const handleCancel = () => { ... }
   - "确认/提交"按钮 → const handleSubmit = () => { ... }
   - "删除"按钮 → const handleDelete = () => { ... }
   - "关闭"按钮 → const handleClose = () => { ... }
   - "搜索"输入框 → const handleSearch = (e) => { ... }
   - 选项卡切换 → const handleTabChange = (tab) => { ... }
   - 下拉选择 → const handleSelect = (value) => { ... }
10. 事件处理函数中应包含合理的默认行为（如 console.log 提示、状态切换、弹窗提示等），而非空函数
11. 如果截图中有表单，React 使用 useState、Vue 使用 ref 管理表单状态，并绑定对应的事件
12. 如果截图中有列表数据，使用状态初始化模拟数据并通过 map（React）或 v-for（Vue）渲染
13. HTML 和 CSS 版本中也要为按钮等元素添加 onclick 事件处理
14. Vue 代码中事件函数同样使用 handle 前缀命名，与 React 版本保持一致的业务逻辑
15. 只返回 JSON，不要包含任何 markdown 标记或其他解释文字`;

  if (customPrompt.trim()) {
    return base + `\n\n额外要求：\n${customPrompt}`;
  }
  return base;
};

/**
 * 从 data URL 中提取纯 base64 数据（去除 data:image/xxx;base64, 前缀）
 */
const extractBase64Data = (dataUrl: string): string => {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) return dataUrl;
  return dataUrl.slice(commaIndex + 1);
};

/**
 * 解析 LLM 返回的 JSON 内容
 */
const parseLLMResponse = (content: string): { reactCode: string; vueCode: string; cssCode: string; htmlCode: string } => {
  // 尝试直接 JSON.parse
  try {
    const parsed = JSON.parse(content);
    return {
      reactCode: parsed.reactCode || '',
      vueCode: parsed.vueCode || '',
      cssCode: parsed.cssCode || '',
      htmlCode: parsed.htmlCode || '',
    };
  } catch {
    // 尝试从 markdown 代码块中提取 JSON
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        return {
          reactCode: parsed.reactCode || '',
          vueCode: parsed.vueCode || '',
          cssCode: parsed.cssCode || '',
          htmlCode: parsed.htmlCode || '',
        };
      } catch {
        // 继续尝试其他方式
      }
    }

    // 尝试从内容中找到 JSON 对象
    const jsonObjMatch = content.match(/\{[\s\S]*"reactCode"[\s\S]*\}/);
    if (jsonObjMatch) {
      try {
        const parsed = JSON.parse(jsonObjMatch[0]);
        return {
          reactCode: parsed.reactCode || '',
          vueCode: parsed.vueCode || '',
          cssCode: parsed.cssCode || '',
          htmlCode: parsed.htmlCode || '',
        };
      } catch {
        // 继续尝试
      }
    }

    // 尝试提取各个代码块
    const reactMatch = content.match(/```(?:tsx?|jsx?|react)\s*([\s\S]*?)```/);
    const vueMatch = content.match(/```(?:vue)\s*([\s\S]*?)```/);
    const cssMatch = content.match(/```css\s*([\s\S]*?)```/);
    const htmlMatch = content.match(/```html\s*([\s\S]*?)```/);

    return {
      reactCode: reactMatch?.[1]?.trim() || content,
      vueCode: vueMatch?.[1]?.trim() || '',
      cssCode: cssMatch?.[1]?.trim() || '',
      htmlCode: htmlMatch?.[1]?.trim() || '',
    };
  }
};

/**
 * 检测 Ollama 服务状态
 */
export const checkOllamaStatus = async (baseUrl: string): Promise<{ online: boolean; version?: string; error?: string }> => {
  try {
    const response = await fetch(`${PROXY_BASE}/api/ollama/status?baseUrl=${encodeURIComponent(baseUrl)}`);
    return await response.json();
  } catch (err) {
    return {
      online: false,
      error: `无法连接到代理服务 (${PROXY_BASE})，请确认 Node 服务已启动: npm run server`,
    };
  }
};

/**
 * 获取 Ollama 已安装模型列表
 */
export interface OllamaModelInfo {
  name: string;
  size: number;
  modifiedAt: string;
  digest: string;
  family: string;
  parameterSize: string;
}

export const getOllamaModels = async (baseUrl: string): Promise<OllamaModelInfo[]> => {
  try {
    const response = await fetch(`${PROXY_BASE}/api/ollama/models?baseUrl=${encodeURIComponent(baseUrl)}`);
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }
    const data = await response.json();
    return data.models || [];
  } catch (err) {
    throw new Error(
      err instanceof Error
        ? err.message
        : '获取模型列表失败，请确认 Node 代理服务已启动',
    );
  }
};

/**
 * 通过 Ollama Vision 模型生成代码（经过 Node 代理服务）
 */
export const generateCodeWithOllama = async (
  image: ImageInfo,
  config: OllamaConfig,
  deviceType: DeviceType = 'pc',
): Promise<GeneratedCode> => {
  const startTime = performance.now();

  const imageBase64 = extractBase64Data(image.src);
  const systemPrompt = buildSystemPrompt(config.customPrompt, deviceType);
  const userPrompt = `请分析这张 UI 截图（${image.width}x${image.height}），这是${deviceType === 'mobile' ? '移动端（基准宽度 ' + MOBILE_BASE_WIDTH + 'px）' : 'PC 端'}设计稿，生成对应的 React 组件代码、Vue 3 组件代码、CSS 代码和 HTML 代码。请严格按照 JSON 格式返回。`;

  const requestBody = {
    baseUrl: config.baseUrl,
    model: config.model,
    imageBase64,
    prompt: userPrompt,
    systemPrompt,
    timeout: config.timeout,
  };

  const response = await fetch(`${PROXY_BASE}/api/ollama/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.error || `代理服务请求失败 (${response.status})`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const content = data.content;

  if (!content) {
    throw new Error('Ollama 返回内容为空，请确认所选模型支持图片输入（Vision）');
  }

  const { reactCode, vueCode, cssCode, htmlCode } = parseLLMResponse(content);
  const duration = Math.round(performance.now() - startTime);

  return {
    reactCode,
    vueCode,
    cssCode,
    htmlCode,
    mode: 'ollama',
    deviceType,
    duration,
  };
};
