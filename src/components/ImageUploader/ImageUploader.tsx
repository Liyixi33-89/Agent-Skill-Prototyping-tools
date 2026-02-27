import { useCallback, useRef, useState } from 'react';
import type { ImageInfo } from '../../types';
import { loadImageFromFile } from '../../utils/imageDiff';

interface ImageUploaderProps {
  /** 标签文本 */
  label: string;
  /** 上传成功回调 */
  onImageLoaded: (image: ImageInfo) => void;
  /** 当前已加载的图片 */
  currentImage: ImageInfo | null;
}

const ImageUploader = ({ label, onImageLoaded, currentImage }: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('请上传图片文件（PNG、JPG、WebP 等）');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const imageInfo = await loadImageFromFile(file);
        onImageLoaded(imageInfo);
      } catch (err) {
        setError(err instanceof Error ? err.message : '图片加载失败');
      } finally {
        setIsLoading(false);
      }
    },
    [onImageLoaded],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // 重置 input 以允许重复上传同一文件
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
        {label}
      </span>

      <div
        role="button"
        tabIndex={0}
        aria-label={`点击或拖拽上传${label}`}
        className={`
          relative flex flex-col items-center justify-center
          min-h-[200px] rounded-xl border-2 border-dashed
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-blue-400 bg-blue-500/10 scale-[1.02]'
            : currentImage
              ? 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
              : 'border-slate-600 bg-slate-800/30 hover:border-blue-500 hover:bg-blue-500/5'
          }
        `}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
          aria-hidden="true"
        />

        {isLoading && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400">加载中...</span>
          </div>
        )}

        {!isLoading && !currentImage && (
          <div className="flex flex-col items-center gap-3 p-6">
            <svg
              className="w-12 h-12 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            <div className="text-center">
              <p className="text-sm text-slate-400">
                拖拽图片到此处，或 <span className="text-blue-400 underline">点击上传</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">支持 PNG、JPG、WebP 格式</p>
            </div>
          </div>
        )}

        {!isLoading && currentImage && (
          <div className="relative w-full p-2">
            <img
              src={currentImage.src}
              alt={currentImage.name}
              className="w-full h-auto max-h-[300px] object-contain rounded-lg"
            />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <span className="text-xs text-slate-300 truncate max-w-[60%]">
                {currentImage.name}
              </span>
              <span className="text-xs text-slate-400">
                {currentImage.width} × {currentImage.height}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
