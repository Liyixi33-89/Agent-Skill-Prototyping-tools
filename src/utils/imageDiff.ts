import type { ImageInfo, DiffResult, DiffOptions } from '../types';
import { DEFAULT_DIFF_OPTIONS } from '../types';

/**
 * 将图片文件加载为 ImageInfo 对象
 */
export const loadImageFromFile = (file: File): Promise<ImageInfo> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        resolve({
          name: file.name,
          src: reader.result as string,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.onerror = () => reject(new Error(`无法加载图片: ${file.name}`));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error(`无法读取文件: ${file.name}`));
    reader.readAsDataURL(file);
  });
};

/**
 * 将图片绘制到指定尺寸的 Canvas 上，返回 ImageData
 */
const getImageData = (
  imageSrc: string,
  targetWidth: number,
  targetHeight: number,
): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法获取 Canvas 2D 上下文'));
        return;
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      resolve(ctx.getImageData(0, 0, targetWidth, targetHeight));
    };
    img.onerror = () => reject(new Error('无法加载图片进行对比'));
    img.src = imageSrc;
  });
};

/**
 * 核心对比函数：对两张图片进行像素级对比
 * 使用纯 Canvas API 实现，不依赖 pixelmatch 的 Node 版本
 */
export const performImageDiff = async (
  imageA: ImageInfo,
  imageB: ImageInfo,
  options: DiffOptions = DEFAULT_DIFF_OPTIONS,
): Promise<DiffResult> => {
  // 统一到相同尺寸（取两张图片的最大宽高）
  const width = Math.max(imageA.width, imageB.width);
  const height = Math.max(imageA.height, imageB.height);

  // 获取两张图片的像素数据
  const [dataA, dataB] = await Promise.all([
    getImageData(imageA.src, width, height),
    getImageData(imageB.src, width, height),
  ]);

  // 创建输出差异图
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const diffCtx = diffCanvas.getContext('2d');
  if (!diffCtx) {
    throw new Error('无法创建差异图 Canvas 上下文');
  }

  const diffImageData = diffCtx.createImageData(width, height);
  const pixelsA = dataA.data;
  const pixelsB = dataB.data;
  const diffPixels = diffImageData.data;

  const { threshold, diffColor, alpha } = options;
  const [diffR, diffG, diffB] = diffColor;

  let diffPixelCount = 0;
  const totalPixels = width * height;

  // 逐像素对比
  for (let i = 0; i < totalPixels; i++) {
    const offset = i * 4;

    const rA = pixelsA[offset];
    const gA = pixelsA[offset + 1];
    const bA = pixelsA[offset + 2];
    const aA = pixelsA[offset + 3];

    const rB = pixelsB[offset];
    const gB = pixelsB[offset + 1];
    const bB = pixelsB[offset + 2];
    const aB = pixelsB[offset + 3];

    // 计算颜色差异（归一化到 0-1 范围）
    const maxColorDiff = 255;
    const colorDiff =
      (Math.abs(rA - rB) +
        Math.abs(gA - gB) +
        Math.abs(bA - bB) +
        Math.abs(aA - aB)) /
      (maxColorDiff * 4);

    if (colorDiff > threshold) {
      // 像素有差异 — 标记为差异颜色
      diffPixels[offset] = diffR;
      diffPixels[offset + 1] = diffG;
      diffPixels[offset + 2] = diffB;
      diffPixels[offset + 3] = 255;
      diffPixelCount++;
    } else {
      // 像素相同 — 使用原始图片的灰度 + 透明度
      const gray = (rA * 0.299 + gA * 0.587 + bA * 0.114) | 0;
      diffPixels[offset] = gray;
      diffPixels[offset + 1] = gray;
      diffPixels[offset + 2] = gray;
      diffPixels[offset + 3] = Math.round(255 * alpha + 255 * (1 - alpha) * (aA / 255));
    }
  }

  diffCtx.putImageData(diffImageData, 0, 0);

  const diffPercentage = totalPixels > 0
    ? Number(((diffPixelCount / totalPixels) * 100).toFixed(2))
    : 0;

  return {
    diffImageSrc: diffCanvas.toDataURL('image/png'),
    diffPixelCount,
    totalPixels,
    diffPercentage,
    width,
    height,
  };
};

/**
 * 生成热力图版本的差异图（按差异程度着色）
 */
export const generateHeatmapDiff = async (
  imageA: ImageInfo,
  imageB: ImageInfo,
): Promise<string> => {
  const width = Math.max(imageA.width, imageB.width);
  const height = Math.max(imageA.height, imageB.height);

  const [dataA, dataB] = await Promise.all([
    getImageData(imageA.src, width, height),
    getImageData(imageB.src, width, height),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建热力图 Canvas');

  const output = ctx.createImageData(width, height);
  const pixelsA = dataA.data;
  const pixelsB = dataB.data;
  const outData = output.data;

  for (let i = 0; i < width * height; i++) {
    const offset = i * 4;

    // 计算差异程度 (0-1)
    const diff =
      (Math.abs(pixelsA[offset] - pixelsB[offset]) +
        Math.abs(pixelsA[offset + 1] - pixelsB[offset + 1]) +
        Math.abs(pixelsA[offset + 2] - pixelsB[offset + 2])) /
      (255 * 3);

    // 热力图配色：绿(无差异) → 黄(轻微) → 红(严重)
    if (diff < 0.01) {
      // 几乎无差异 — 暗灰
      outData[offset] = 30;
      outData[offset + 1] = 30;
      outData[offset + 2] = 30;
    } else if (diff < 0.2) {
      // 轻微差异 — 绿色到黄色
      const t = diff / 0.2;
      outData[offset] = Math.round(34 + t * (250 - 34));
      outData[offset + 1] = Math.round(197 + t * (204 - 197));
      outData[offset + 2] = Math.round(94 - t * 94);
    } else {
      // 较大差异 — 黄色到红色
      const t = Math.min((diff - 0.2) / 0.8, 1);
      outData[offset] = Math.round(250 + t * (239 - 250));
      outData[offset + 1] = Math.round(204 - t * 136);
      outData[offset + 2] = Math.round(t * 68);
    }
    outData[offset + 3] = 255;
  }

  ctx.putImageData(output, 0, 0);
  return canvas.toDataURL('image/png');
};
