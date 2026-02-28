import type { DetectedBlock, DeviceType, GeneratedCode, ImageInfo } from '../types';
import { MOBILE_BASE_WIDTH } from '../types';

/**
 * 将 RGB 值转为 HEX 颜色
 */
const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
};

/**
 * 将像素值转为 rem（以 375px 为基准，1rem = 基准宽度/10 = 37.5px）
 */
const pxToRem = (px: number): string => {
  const rem = px / (MOBILE_BASE_WIDTH / 10);
  // 保留 4 位小数，去掉末尾零
  return `${parseFloat(rem.toFixed(4))}rem`;
};

/**
 * 从图片中扫描并检测主要的 UI 区块
 * 基于颜色变化和区域连通性分析
 */
const detectBlocks = (imageData: ImageData, imgWidth: number, imgHeight: number): DetectedBlock[] => {
  const { data } = imageData;
  const blocks: DetectedBlock[] = [];

  // 将图片分成网格，每个网格分析主色
  const gridSize = 20;
  const cols = Math.ceil(imgWidth / gridSize);
  const rows = Math.ceil(imgHeight / gridSize);
  const gridColors: string[][] = [];

  for (let gy = 0; gy < rows; gy++) {
    gridColors[gy] = [];
    for (let gx = 0; gx < cols; gx++) {
      // 采样网格中心点颜色
      const cx = Math.min(gx * gridSize + Math.floor(gridSize / 2), imgWidth - 1);
      const cy = Math.min(gy * gridSize + Math.floor(gridSize / 2), imgHeight - 1);
      const idx = (cy * imgWidth + cx) * 4;
      gridColors[gy][gx] = rgbToHex(data[idx], data[idx + 1], data[idx + 2]);
    }
  }

  // 使用简单的连通区域检测：相邻网格颜色相近则合并
  const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
  let blockId = 0;

  const colorDistance = (hex1: string, hex2: string): number => {
    const r1 = parseInt(hex1.slice(1, 3), 16);
    const g1 = parseInt(hex1.slice(3, 5), 16);
    const b1 = parseInt(hex1.slice(5, 7), 16);
    const r2 = parseInt(hex2.slice(1, 3), 16);
    const g2 = parseInt(hex2.slice(3, 5), 16);
    const b2 = parseInt(hex2.slice(5, 7), 16);
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  };

  const floodFill = (startY: number, startX: number, baseColor: string): { minX: number; minY: number; maxX: number; maxY: number } => {
    const queue: [number, number][] = [[startY, startX]];
    visited[startY][startX] = true;
    let minX = startX, maxX = startX, minY = startY, maxY = startY;
    const threshold = 30;

    while (queue.length > 0) {
      const [cy, cx] = queue.shift()!;
      minX = Math.min(minX, cx);
      maxX = Math.max(maxX, cx);
      minY = Math.min(minY, cy);
      maxY = Math.max(maxY, cy);

      const neighbors = [[cy - 1, cx], [cy + 1, cx], [cy, cx - 1], [cy, cx + 1]];
      for (const [ny, nx] of neighbors) {
        if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && !visited[ny][nx]) {
          if (colorDistance(gridColors[ny][nx], baseColor) < threshold) {
            visited[ny][nx] = true;
            queue.push([ny, nx]);
          }
        }
      }
    }

    return { minX, minY, maxX, maxY };
  };

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      if (visited[gy][gx]) continue;

      const baseColor = gridColors[gy][gx];
      const bounds = floodFill(gy, gx, baseColor);

      const blockWidth = (bounds.maxX - bounds.minX + 1) * gridSize;
      const blockHeight = (bounds.maxY - bounds.minY + 1) * gridSize;

      // 过滤太小的区块
      if (blockWidth < 30 || blockHeight < 20) continue;

      const aspectRatio = blockWidth / blockHeight;

      // 推断区块类型
      let type: DetectedBlock['type'] = 'container';
      if (blockHeight < 50 && blockWidth > 80 && blockWidth < 300) {
        type = 'button';
      } else if (blockHeight < 50 && blockWidth > blockHeight * 5) {
        type = 'nav';
      } else if (aspectRatio > 0.8 && aspectRatio < 1.3 && blockWidth < 250) {
        type = 'card';
      } else if (blockHeight < 60 && blockWidth > imgWidth * 0.6) {
        if (bounds.minY * gridSize < imgHeight * 0.15) {
          type = 'header';
        } else if (bounds.maxY * gridSize > imgHeight * 0.85) {
          type = 'footer';
        }
      } else if (blockHeight < 45 && blockWidth > 150 && blockWidth < imgWidth * 0.5) {
        type = 'input';
      }

      blocks.push({
        id: `block-${blockId++}`,
        type,
        x: bounds.minX * gridSize,
        y: bounds.minY * gridSize,
        width: blockWidth,
        height: blockHeight,
        backgroundColor: baseColor,
        borderColor: null,
        children: [],
      });
    }
  }

  // 按位置排序（从上到下，从左到右）
  blocks.sort((a, b) => a.y - b.y || a.x - b.x);

  // 限制区块数量，取最大的几个
  return blocks
    .sort((a, b) => (b.width * b.height) - (a.width * a.height))
    .slice(0, 15)
    .sort((a, b) => a.y - b.y || a.x - b.x);
};

/**
 * 根据检测到的区块生成 React + 纯 CSS 代码
 */
const generateReactCode = (blocks: DetectedBlock[], imgWidth: number, imgHeight: number): string => {
  const indent = (level: number) => '  '.repeat(level);

  const blockToJsx = (block: DetectedBlock, level: number, index: number): string => {
    const className = `block-${block.type}-${index}`;

    switch (block.type) {
      case 'header':
        return `${indent(level)}<header className="${className}">\n${indent(level + 1)}<h1>Header</h1>\n${indent(level)}</header>`;

      case 'footer':
        return `${indent(level)}<footer className="${className}">\n${indent(level + 1)}<p>Footer Content</p>\n${indent(level)}</footer>`;

      case 'nav':
        return `${indent(level)}<nav className="${className}">\n${indent(level + 1)}<a href="#">链接1</a>\n${indent(level + 1)}<a href="#">链接2</a>\n${indent(level + 1)}<a href="#">链接3</a>\n${indent(level)}</nav>`;

      case 'button':
        return `${indent(level)}<button\n${indent(level + 1)}type="button"\n${indent(level + 1)}className="${className}"\n${indent(level + 1)}onClick={handleClick}\n${indent(level)}>\n${indent(level + 1)}按钮\n${indent(level)}</button>`;

      case 'card':
        return `${indent(level)}<div className="${className}">\n${indent(level + 1)}<div className="card-image" />\n${indent(level + 1)}<h3>卡片标题</h3>\n${indent(level + 1)}<p>卡片描述内容</p>\n${indent(level)}</div>`;

      case 'input':
        return `${indent(level)}<input\n${indent(level + 1)}type="text"\n${indent(level + 1)}placeholder="请输入..."\n${indent(level + 1)}className="${className}"\n${indent(level)}/>`;

      case 'image':
        return `${indent(level)}<div className="${className}">\n${indent(level + 1)}<span>Image Placeholder</span>\n${indent(level)}</div>`;

      default:
        return `${indent(level)}<div className="${className}" />`;
    }
  };

  const bodyLines = blocks.map((block, index) => blockToJsx(block, 2, index));

  // 生成 CSS styles 对象
  let stylesCode = `\nconst styles: Record<string, React.CSSProperties> = {\n`;
  stylesCode += `  container: {\n    position: 'relative',\n    width: '100%',\n    maxWidth: '${imgWidth}px',\n    minHeight: '${imgHeight}px',\n    margin: '0 auto',\n    background: '#ffffff',\n    display: 'flex',\n    flexDirection: 'column',\n    alignItems: 'center',\n    gap: '16px',\n    padding: '16px',\n  },\n`;

  blocks.forEach((block, index) => {
    const key = `block_${block.type}_${index}`;
    stylesCode += `  '${key}': {\n`;
    stylesCode += `    width: '${block.width}px',\n`;
    stylesCode += `    height: '${block.height}px',\n`;
    stylesCode += `    backgroundColor: '${block.backgroundColor}',\n`;
    stylesCode += `    borderRadius: '8px',\n`;

    switch (block.type) {
      case 'header':
      case 'footer':
      case 'nav':
        stylesCode += `    width: '100%',\n`;
        stylesCode += `    display: 'flex',\n`;
        stylesCode += `    alignItems: 'center',\n`;
        stylesCode += `    padding: '0 24px',\n`;
        break;
      case 'button':
        stylesCode += `    cursor: 'pointer',\n`;
        stylesCode += `    display: 'flex',\n`;
        stylesCode += `    alignItems: 'center',\n`;
        stylesCode += `    justifyContent: 'center',\n`;
        stylesCode += `    fontWeight: 500,\n`;
        stylesCode += `    fontSize: '14px',\n`;
        stylesCode += `    border: 'none',\n`;
        break;
      case 'card':
        stylesCode += `    padding: '16px',\n`;
        stylesCode += `    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',\n`;
        break;
      case 'input':
        stylesCode += `    border: '1px solid #d1d5db',\n`;
        stylesCode += `    padding: '0 12px',\n`;
        stylesCode += `    fontSize: '14px',\n`;
        stylesCode += `    outline: 'none',\n`;
        break;
    }

    stylesCode += `  },\n`;
  });
  stylesCode += `};`;

  const hasButton = blocks.some((b) => b.type === 'button');

  return `import React from 'react';\n\n/**\n * 由截图自动生成的 React 组件\n * 原始尺寸: ${imgWidth} x ${imgHeight}\n */\nconst GeneratedComponent = () => {\n${hasButton ? '  const handleClick = () => {\n    console.log(\'按钮被点击\');\n  };\n\n' : ''}  return (\n    <div style={styles.container}>\n${bodyLines.join('\n\n')}\n    </div>\n  );\n};\n${stylesCode}\n\nexport default GeneratedComponent;\n`;
};

/**
 * 根据检测到的区块生成 Vue 3 SFC + 纯 CSS 代码
 */
const generateVueCode = (blocks: DetectedBlock[], imgWidth: number, imgHeight: number): string => {
  const indent = (level: number) => '  '.repeat(level);

  const blockToTemplate = (block: DetectedBlock, level: number, index: number): string => {
    const className = `block-${block.type}-${index}`;

    switch (block.type) {
      case 'header':
        return `${indent(level)}<header class="${className}">\n${indent(level + 1)}<h1>Header</h1>\n${indent(level)}</header>`;

      case 'footer':
        return `${indent(level)}<footer class="${className}">\n${indent(level + 1)}<p>Footer Content</p>\n${indent(level)}</footer>`;

      case 'nav':
        return `${indent(level)}<nav class="${className}">\n${indent(level + 1)}<a href="#">链接1</a>\n${indent(level + 1)}<a href="#">链接2</a>\n${indent(level + 1)}<a href="#">链接3</a>\n${indent(level)}</nav>`;

      case 'button':
        return `${indent(level)}<button\n${indent(level + 1)}type="button"\n${indent(level + 1)}class="${className}"\n${indent(level + 1)}@click="handleClick"\n${indent(level)}>\n${indent(level + 1)}按钮\n${indent(level)}</button>`;

      case 'card':
        return `${indent(level)}<div class="${className}">\n${indent(level + 1)}<div class="card-image" />\n${indent(level + 1)}<h3>卡片标题</h3>\n${indent(level + 1)}<p>卡片描述内容</p>\n${indent(level)}</div>`;

      case 'input':
        return `${indent(level)}<input\n${indent(level + 1)}type="text"\n${indent(level + 1)}placeholder="请输入..."\n${indent(level + 1)}v-model="inputValue"\n${indent(level + 1)}class="${className}"\n${indent(level)}/>`;

      case 'image':
        return `${indent(level)}<div class="${className}">\n${indent(level + 1)}<span>Image Placeholder</span>\n${indent(level)}</div>`;

      default:
        return `${indent(level)}<div class="${className}" />`;
    }
  };

  const templateLines = blocks.map((block, index) => blockToTemplate(block, 2, index));

  const hasButton = blocks.some((b) => b.type === 'button');
  const hasInput = blocks.some((b) => b.type === 'input');

  // 生成 <script setup>
  let scriptContent = '';
  const imports: string[] = [];
  const refs: string[] = [];
  const handlers: string[] = [];

  if (hasInput) {
    imports.push('ref');
    refs.push(`const inputValue = ref('')`);
    handlers.push(`const handleInput = (e: Event) => {\n  console.log('输入值:', inputValue.value)\n}`);
  }
  if (hasButton) {
    handlers.push(`const handleClick = () => {\n  console.log('按钮被点击')\n}`);
  }

  if (imports.length > 0 || handlers.length > 0) {
    scriptContent = `\n\n<script setup lang="ts">\n`;
    if (imports.length > 0) {
      scriptContent += `import { ${imports.join(', ')} } from 'vue'\n\n`;
    }
    if (refs.length > 0) {
      scriptContent += refs.join('\n') + '\n\n';
    }
    if (handlers.length > 0) {
      scriptContent += handlers.join('\n\n') + '\n';
    }
    scriptContent += `</script>`;
  }

  // 生成 <style scoped>
  let styleContent = `\n\n<style scoped>\n`;
  styleContent += `.container {\n  position: relative;\n  width: 100%;\n  max-width: ${imgWidth}px;\n  min-height: ${imgHeight}px;\n  margin: 0 auto;\n  background: #ffffff;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 16px;\n  padding: 16px;\n}\n\n`;

  blocks.forEach((block, index) => {
    const className = `block-${block.type}-${index}`;
    styleContent += `.${className} {\n`;
    styleContent += `  width: ${block.width}px;\n`;
    styleContent += `  height: ${block.height}px;\n`;
    styleContent += `  background-color: ${block.backgroundColor};\n`;
    styleContent += `  border-radius: 8px;\n`;

    switch (block.type) {
      case 'header':
      case 'footer':
      case 'nav':
        styleContent += `  width: 100%;\n`;
        styleContent += `  display: flex;\n`;
        styleContent += `  align-items: center;\n`;
        styleContent += `  padding: 0 24px;\n`;
        break;
      case 'button':
        styleContent += `  cursor: pointer;\n`;
        styleContent += `  display: flex;\n`;
        styleContent += `  align-items: center;\n`;
        styleContent += `  justify-content: center;\n`;
        styleContent += `  font-weight: 500;\n`;
        styleContent += `  font-size: 14px;\n`;
        styleContent += `  border: none;\n`;
        break;
      case 'card':
        styleContent += `  padding: 16px;\n`;
        styleContent += `  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);\n`;
        break;
      case 'input':
        styleContent += `  border: 1px solid #d1d5db;\n`;
        styleContent += `  padding: 0 12px;\n`;
        styleContent += `  font-size: 14px;\n`;
        styleContent += `  outline: none;\n`;
        break;
    }

    styleContent += `}\n\n`;
  });

  styleContent += `</style>`;

  return `<template>\n  <div class="container">\n${templateLines.join('\n\n')}\n  </div>\n</template>${scriptContent}${styleContent}\n`;
};

/**
 * 根据检测到的区块生成纯 CSS + HTML
 */
const generateCssCode = (blocks: DetectedBlock[], imgWidth: number, imgHeight: number, deviceType: DeviceType): { html: string; css: string } => {
  const isMobile = deviceType === 'mobile';
  const unit = (px: number) => isMobile ? pxToRem(px) : `${px}px`;

  let css = '';

  // 移动端添加 html font-size 设置和响应式基准
  if (isMobile) {
    css += `/* 移动端 rem 基准设置（设计稿基准宽度: ${MOBILE_BASE_WIDTH}px） */
/* 1rem = ${MOBILE_BASE_WIDTH / 10}px */
html {
  font-size: ${(100 / MOBILE_BASE_WIDTH * 10).toFixed(6)}vw; /* 动态计算，保证任何屏幕宽度下 1rem 始终等于屏幕宽度/10 */
}

@media screen and (min-width: 750px) {
  html {
    font-size: 75px; /* 限制最大宽度 */
  }
}

`;
  }

  css += `.generated-container {
  position: relative;
  width: 100%;
  max-width: ${isMobile ? pxToRem(imgWidth) : `${imgWidth}px`};
  min-height: ${isMobile ? pxToRem(imgHeight) : `${imgHeight}px`};
  margin: 0 auto;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${unit(16)};
  padding: ${unit(16)};
}

`;

  let html = '<div class="generated-container">\n';

  blocks.forEach((block, index) => {
    const className = `block-${block.type}-${index}`;

    css += `.${className} {\n`;
    css += `  width: ${unit(block.width)};\n`;
    css += `  height: ${unit(block.height)};\n`;
    css += `  background-color: ${block.backgroundColor};\n`;
    css += `  border-radius: ${unit(8)};\n`;

    switch (block.type) {
      case 'header':
      case 'footer':
      case 'nav':
        css += `  width: 100%;\n`;
        css += `  display: flex;\n`;
        css += `  align-items: center;\n`;
        css += `  padding: 0 ${unit(24)};\n`;
        break;
      case 'button':
        css += `  cursor: pointer;\n`;
        css += `  display: flex;\n`;
        css += `  align-items: center;\n`;
        css += `  justify-content: center;\n`;
        css += `  font-weight: 500;\n`;
        css += `  font-size: ${unit(14)};\n`;
        css += `  transition: opacity 0.2s;\n`;
        break;
      case 'card':
        css += `  padding: ${unit(16)};\n`;
        css += `  box-shadow: 0 ${unit(4)} ${unit(6)} -${unit(1)} rgba(0, 0, 0, 0.1);\n`;
        break;
      case 'input':
        css += `  border: 1px solid #d1d5db;\n`;
        css += `  padding: 0 ${unit(12)};\n`;
        css += `  font-size: ${unit(14)};\n`;
        css += `  outline: none;\n`;
        break;
    }

    css += `}\n\n`;

    switch (block.type) {
      case 'header':
        html += `  <header class="${className}">\n    <h1>Header</h1>\n  </header>\n`;
        break;
      case 'footer':
        html += `  <footer class="${className}">\n    <p>Footer Content</p>\n  </footer>\n`;
        break;
      case 'nav':
        html += `  <nav class="${className}">\n    <a href="#">链接1</a>\n    <a href="#">链接2</a>\n    <a href="#">链接3</a>\n  </nav>\n`;
        break;
      case 'button':
        html += `  <button class="${className}">按钮</button>\n`;
        break;
      case 'card':
        html += `  <div class="${className}">\n    <h3>卡片标题</h3>\n    <p>卡片描述内容</p>\n  </div>\n`;
        break;
      case 'input':
        html += `  <input class="${className}" type="text" placeholder="请输入..." />\n`;
        break;
      default:
        html += `  <div class="${className}"></div>\n`;
    }
  });

  html += '</div>';

  return { html, css };
};

/**
 * 从上传的图片中分析并生成代码（本地模式）
 */
export const generateCodeFromImage = async (image: ImageInfo, deviceType: DeviceType = 'pc'): Promise<GeneratedCode> => {
  const startTime = performance.now();

  // 将图片绘制到 Canvas 获取像素数据
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建 Canvas 上下文');

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = image.src;
  });

  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // 检测 UI 区块
  const blocks = detectBlocks(imageData, canvas.width, canvas.height);

  // 生成代码
  const reactCode = generateReactCode(blocks, canvas.width, canvas.height);
  const vueCode = generateVueCode(blocks, canvas.width, canvas.height);
  const { html, css } = generateCssCode(blocks, canvas.width, canvas.height, deviceType);

  const duration = Math.round(performance.now() - startTime);

  return {
    reactCode,
    vueCode,
    cssCode: css,
    htmlCode: html,
    mode: 'local',
    deviceType,
    duration,
  };
};
