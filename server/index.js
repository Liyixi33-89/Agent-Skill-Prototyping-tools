import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));

/**
 * 获取 Ollama 基础 URL（从请求中获取，或使用默认值）
 */
const getOllamaBaseUrl = (req) => {
  return req.body?.baseUrl || req.query?.baseUrl || 'http://localhost:11434';
};

/**
 * GET /api/ollama/status
 * 检测 Ollama 服务是否在线
 */
app.get('/api/ollama/status', async (req, res) => {
  const baseUrl = req.query?.baseUrl || 'http://localhost:11434';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${baseUrl}/api/version`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.json({ online: false, error: `Ollama 返回状态码 ${response.status}` });
    }

    const data = await response.json();
    return res.json({ online: true, version: data.version || 'unknown' });
  } catch (err) {
    return res.json({
      online: false,
      error: err.name === 'AbortError'
        ? '连接超时，请确认 Ollama 服务已启动'
        : `无法连接到 Ollama: ${err.message}`,
    });
  }
});

/**
 * GET /api/ollama/models
 * 获取已安装的 Ollama 模型列表
 */
app.get('/api/ollama/models', async (req, res) => {
  const baseUrl = req.query?.baseUrl || 'http://localhost:11434';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({ error: `Ollama 返回状态码 ${response.status}` });
    }

    const data = await response.json();
    const models = (data.models || []).map((m) => ({
      name: m.name,
      size: m.size,
      modifiedAt: m.modified_at,
      digest: m.digest?.slice(0, 12),
      family: m.details?.family || '',
      parameterSize: m.details?.parameter_size || '',
    }));

    return res.json({ models });
  } catch (err) {
    return res.status(500).json({ error: `获取模型列表失败: ${err.message}` });
  }
});

/**
 * POST /api/ollama/generate
 * 代理调用 Ollama 的 /api/chat 接口（支持 Vision 模型）
 *
 * 请求体:
 * {
 *   baseUrl: string,     // Ollama 服务地址
 *   model: string,       // 模型名称
 *   imageBase64: string,  // 图片 base64 数据（不含 data:image/... 前缀）
 *   prompt: string,      // 用户提示词
 *   systemPrompt: string, // 系统提示词
 *   timeout: number,     // 超时秒数
 * }
 */
app.post('/api/ollama/generate', async (req, res) => {
  const { baseUrl = 'http://localhost:11434', model, imageBase64, prompt, systemPrompt, timeout = 300 } = req.body;

  if (!model) {
    return res.status(400).json({ error: '缺少 model 参数' });
  }
  if (!imageBase64) {
    return res.status(400).json({ error: '缺少 imageBase64 参数' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);

    // 构建 Ollama /api/chat 请求
    const messages = [];

    // 添加系统提示词
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // 添加用户消息（带图片）
    messages.push({
      role: 'user',
      content: prompt || '请分析这张 UI 截图，生成对应的 React 组件代码。',
      images: [imageBase64],
    });

    const requestBody = {
      model,
      messages,
      stream: false, // 使用非流式模式，简化处理
      options: {
        temperature: 0.1,
        num_predict: 8192,
      },
    };

    console.log(`[Ollama] 调用模型: ${model}, 图片大小: ${(imageBase64.length / 1024).toFixed(1)}KB`);

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`[Ollama] 请求失败: ${response.status}`, errorText);
      return res.status(response.status).json({
        error: `Ollama 返回错误 (${response.status}): ${errorText || '未知错误'}`,
      });
    }

    const data = await response.json();
    const content = data.message?.content || '';

    console.log(`[Ollama] 生成完成, 内容长度: ${content.length} 字符`);

    return res.json({
      content,
      model: data.model,
      totalDuration: data.total_duration,
      evalCount: data.eval_count,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(408).json({ error: `生成超时（${timeout}秒），请尝试减小图片尺寸或增加超时时间` });
    }
    console.error('[Ollama] 代理请求异常:', err);
    return res.status(500).json({ error: `代理请求失败: ${err.message}` });
  }
});

/**
 * POST /api/ollama/generate-stream
 * 流式调用 Ollama（用于大文件生成时的实时反馈）
 */
app.post('/api/ollama/generate-stream', async (req, res) => {
  const { baseUrl = 'http://localhost:11434', model, imageBase64, prompt, systemPrompt, timeout = 300 } = req.body;

  if (!model || !imageBase64) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({
      role: 'user',
      content: prompt || '请分析这张 UI 截图，生成对应的 React 组件代码。',
      images: [imageBase64],
    });

    const requestBody = {
      model,
      messages,
      stream: true,
      options: { temperature: 0.1, num_predict: 8192 },
    };

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return res.status(response.status).json({ error: errorText || '请求失败' });
    }

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const readStream = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          res.write('data: [DONE]\n\n');
          res.end();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        // Ollama 流式返回每行是一个 JSON
        const lines = chunk.split('\n').filter((line) => line.trim());
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            const token = parsed.message?.content || '';
            if (token) {
              res.write(`data: ${JSON.stringify({ token })}\n\n`);
            }
            if (parsed.done) {
              res.write(`data: ${JSON.stringify({ done: true, totalDuration: parsed.total_duration })}\n\n`);
              res.write('data: [DONE]\n\n');
              res.end();
              return;
            }
          } catch {
            // 忽略非 JSON 行
          }
        }
      }
    };

    readStream().catch((err) => {
      console.error('[Ollama Stream] 流读取异常:', err);
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      }
    });

    // 客户端断开时取消请求
    req.on('close', () => {
      reader.cancel().catch(() => {});
    });
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message });
    }
  }
});

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Node 代理服务已启动: http://localhost:${PORT}`);
  console.log(`📡 Ollama 代理接口:`);
  console.log(`   GET  /api/ollama/status   - 检测 Ollama 状态`);
  console.log(`   GET  /api/ollama/models   - 获取模型列表`);
  console.log(`   POST /api/ollama/generate - 调用 Ollama 生成代码`);
  console.log(`   POST /api/ollama/generate-stream - 流式调用\n`);
});
