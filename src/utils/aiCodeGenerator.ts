import type { AiApiConfig, GeneratedCode, ImageInfo } from '../types';

/**
 * 构建发送给 Vision LLM 的系统提示词
 */
const buildSystemPrompt = (customPrompt: string): string => {
  const base = `你是一个专业的前端开发工程师。用户将给你一张 UI 截图，你需要分析截图中的界面布局、颜色、排版和所有交互元素，并生成对应的**功能完备、可交互**的代码。

请严格按照以下 JSON 格式返回结果，不要包含其他内容：
{
  "reactCode": "完整的 React 组件代码（使用 TailwindCSS 进行样式处理）",
  "cssCode": "等效的纯 CSS 代码",
  "htmlCode": "等效的纯 HTML 代码"
}

要求：
1. React 代码使用函数式组件 + TypeScript
2. 样式优先使用 TailwindCSS 类名
3. 保持代码简洁、语义化
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
9. 如果截图中有表单，需使用 useState 管理表单状态，并为每个输入项绑定 onChange 事件
10. 如果截图中有列表数据，使用 useState 初始化模拟数据并通过 map 渲染
11. HTML 和 CSS 版本中也要为按钮等元素添加 onclick 事件处理`;

  if (customPrompt.trim()) {
    return base + `\n\n额外要求：\n${customPrompt}`;
  }
  return base;
};

/**
 * 将图片转为 base64 data URL（去除前缀部分，只保留纯 base64）
 */
const extractBase64Data = (dataUrl: string): string => {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) return dataUrl;
  return dataUrl.slice(commaIndex + 1);
};

/**
 * 检测图片的 MIME 类型
 */
const detectMimeType = (dataUrl: string): string => {
  if (dataUrl.startsWith('data:image/png')) return 'image/png';
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'image/jpeg';
  if (dataUrl.startsWith('data:image/webp')) return 'image/webp';
  return 'image/png';
};

/**
 * 解析 LLM 返回的 JSON 内容
 */
const parseLLMResponse = (content: string): { reactCode: string; cssCode: string; htmlCode: string } => {
  // 尝试直接 JSON.parse
  try {
    const parsed = JSON.parse(content);
    return {
      reactCode: parsed.reactCode || '',
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
          cssCode: parsed.cssCode || '',
          htmlCode: parsed.htmlCode || '',
        };
      } catch {
        // 继续尝试其他方式
      }
    }

    // 尝试提取各个代码块
    const reactMatch = content.match(/```(?:tsx?|jsx?|react)\s*([\s\S]*?)```/);
    const cssMatch = content.match(/```css\s*([\s\S]*?)```/);
    const htmlMatch = content.match(/```html\s*([\s\S]*?)```/);

    return {
      reactCode: reactMatch?.[1]?.trim() || content,
      cssCode: cssMatch?.[1]?.trim() || '',
      htmlCode: htmlMatch?.[1]?.trim() || '',
    };
  }
};

/**
 * 通过 AI Vision API 生成代码
 */
export const generateCodeWithAI = async (
  image: ImageInfo,
  config: AiApiConfig,
): Promise<GeneratedCode> => {
  const startTime = performance.now();

  if (!config.apiKey) {
    throw new Error('请先配置 API Key');
  }

  const base64Data = extractBase64Data(image.src);
  const mimeType = detectMimeType(image.src);

  const requestBody = {
    model: config.model,
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt(config.customPrompt),
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `请分析这张 UI 截图（${image.width}x${image.height}），生成对应的 React 组件代码、CSS 代码和 HTML 代码。`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Data}`,
              detail: 'high',
            },
          },
        ],
      },
    ],
    max_tokens: 4096,
    temperature: 0.1,
  };

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.error?.message || `API 请求失败 (${response.status})`;
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('AI 返回内容为空');
  }

  const { reactCode, cssCode, htmlCode } = parseLLMResponse(content);
  const duration = Math.round(performance.now() - startTime);

  return {
    reactCode,
    cssCode,
    htmlCode,
    mode: 'ai',
    duration,
  };
};
