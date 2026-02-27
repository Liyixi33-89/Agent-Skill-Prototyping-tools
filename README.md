# 🎨 Agent Skill Prototyping Tools

> AI 设计/原型工具 —— 集成设计稿像素级对比与截图转代码功能

一款基于 React + TypeScript 的 AI 辅助设计开发工具，提供 **设计稿对比（Image Diff）** 和 **截图转代码（Screenshot → Code）** 两大核心功能，帮助设计师和开发者高效完成 UI 还原与代码生成工作。

---

## ✨ 功能特性

### 🔍 设计稿对比（Image Diff）

- **像素级对比**：基于 Canvas API 对两张图片进行逐像素差异检测
- **多种对比模式**：
  - 📐 **并排对比（Side by Side）**：左右同时展示两张图片
  - 🔄 **叠加对比（Overlay）**：半透明叠加查看差异
  - 📏 **滑块对比（Slider）**：拖动滑块直观切换
  - 🎯 **差异高亮（Diff Highlight）**：以热力图形式标注差异区域
- **差异统计**：展示差异像素数、差异百分比等量化指标
- **可调参数**：支持自定义容差阈值、差异颜色、透明度等

### ⚡ 截图转代码（Screenshot → Code）

支持三种代码生成模式：

| 模式 | 说明 | 特点 |
|------|------|------|
| 🖥 **本地分析** | 基于 Canvas 像素分析 | 无需 API Key，纯浏览器端运行 |
| 🤖 **AI Vision** | 调用 OpenAI GPT-4o 等 Vision API | 高质量代码生成，需配置 API Key |
| 🦙 **Ollama** | 使用本地/云端 Ollama 模型 | 支持 qwen3-vl 等 Vision 模型，免费使用 |

- **生成内容**：同时输出 React（TSX + TailwindCSS）、纯 CSS、纯 HTML 三种代码
- **交互事件生成**：自动为按钮、输入框、链接等可交互元素生成事件处理函数
- **代码预览**：支持代码高亮展示与一键复制
- **拖拽上传**：支持拖拽或点击上传截图

---

## 🛠 技术栈

| 分类 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 6 |
| 样式方案 | TailwindCSS 3 |
| 后端代理 | Node.js + Express |
| 图片对比 | Canvas API（纯浏览器端） |
| AI 集成 | OpenAI Vision API / Ollama API |

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.x
- **npm** >= 9.x
- （可选）**Ollama** —— 如需使用本地 Vision 模型

### 安装依赖

```bash
npm install
```

### 启动项目

#### 方式一：同时启动前端 + 后端代理（推荐）

```bash
npm run dev:all
```

#### 方式二：分别启动

```bash
# 启动后端代理服务（端口 3001）
npm run server

# 启动前端开发服务器（端口 5173）
npm run dev
```

### 构建生产版本

```bash
npm run build
```

---

## 📁 项目结构

```
Agent-Skill-Prototyping-tools/
├── server/                          # 后端代理服务
│   └── index.js                     # Express 服务入口（Ollama API 代理）
├── src/
│   ├── components/
│   │   ├── ImageDiff/               # 设计稿对比模块
│   │   │   ├── ImageDiffPanel.tsx    # 对比主面板
│   │   │   ├── DiffHighlightView.tsx # 差异高亮视图
│   │   │   ├── DiffSettings.tsx      # 对比参数配置
│   │   │   ├── DiffStats.tsx         # 差异统计展示
│   │   │   ├── OverlayView.tsx       # 叠加对比视图
│   │   │   ├── SideBySideView.tsx    # 并排对比视图
│   │   │   └── SliderView.tsx        # 滑块对比视图
│   │   ├── ImageUploader/           # 图片上传组件
│   │   │   └── ImageUploader.tsx
│   │   └── ScreenshotToCode/        # 截图转代码模块
│   │       ├── ScreenshotToCode.tsx  # 截图转代码主面板
│   │       ├── CodePreview.tsx       # 代码预览组件
│   │       ├── ApiKeySettings.tsx    # AI API 配置面板
│   │       └── OllamaSettings.tsx    # Ollama 配置面板
│   ├── types/
│   │   └── index.ts                 # 全局 TypeScript 类型定义
│   ├── utils/
│   │   ├── imageDiff.ts             # 图片对比核心算法
│   │   ├── codeGenerator.ts         # 本地代码生成（Canvas 像素分析）
│   │   ├── aiCodeGenerator.ts       # AI Vision 代码生成
│   │   └── ollamaCodeGenerator.ts   # Ollama 代码生成
│   ├── App.tsx                      # 应用入口组件
│   ├── main.tsx                     # React 挂载入口
│   └── index.css                    # 全局样式
├── index.html                       # HTML 模板
├── package.json
├── vite.config.ts                   # Vite 配置（含 API 代理）
├── tailwind.config.js               # TailwindCSS 配置
├── tsconfig.json                    # TypeScript 配置
└── postcss.config.js                # PostCSS 配置
```

---

## 📡 后端 API 接口

后端 Express 服务运行在 `http://localhost:3001`，作为 Ollama 的代理层：

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 健康检查 |
| `GET` | `/api/ollama/status` | 检测 Ollama 服务状态 |
| `GET` | `/api/ollama/models` | 获取已安装的模型列表 |
| `POST` | `/api/ollama/generate` | 调用 Ollama 生成代码（非流式） |
| `POST` | `/api/ollama/generate-stream` | 流式调用 Ollama 生成代码（SSE） |

> 开发环境中，Vite 已配置 `/api` 路径代理到 `http://localhost:3001`，前端无需关心跨域。

---

## 🔧 使用指南

### 设计稿对比

1. 在顶部导航栏切换到 **设计稿对比** Tab
2. 分别上传「设计稿（原始）」和「实际截图（对比）」
3. 系统自动进行像素级对比，展示差异结果
4. 通过切换对比模式（并排 / 叠加 / 滑块 / 差异高亮）查看不同视角
5. 调整容差阈值等参数微调对比精度

### 截图转代码

1. 在顶部导航栏切换到 **截图转代码** Tab
2. 选择生成模式：
   - **本地分析**：无需任何配置，直接使用
   - **AI Vision**：点击「API 设置」配置 API Key、端点和模型
   - **Ollama**：点击「Ollama 设置」配置服务地址和模型（需先启动后端代理 `npm run server`）
3. 上传 UI 截图（支持 PNG / JPG / WebP）
4. 点击「生成代码」按钮
5. 查看生成的 React / CSS / HTML 代码，支持一键复制

### Ollama 模式配置

1. 安装 [Ollama](https://ollama.com/)
2. 启动后端代理服务：`npm run server`
3. Ollama 支持本地和云端模型，默认使用 `qwen3-vl:235b-cloud` 云端 Vision 模型
4. 在 Ollama 设置面板中可检测服务状态、查看可用模型

---

## 📋 NPM 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 前端开发服务器 |
| `npm run server` | 启动 Node.js 后端代理服务 |
| `npm run dev:all` | 同时启动前端 + 后端 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |

---

## 📄 License

MIT
