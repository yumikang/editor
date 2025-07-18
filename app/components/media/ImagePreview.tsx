// Phase 4: 이미지 미리보기 컴포넌트
import { useState, useEffect } from 'react';
import { BrowserImageProcessor } from '~/utils/browser-image-processor';
import { ImageMetadataExtractor } from '~/utils/image-metadata';
import type { ProcessedImage, ImageProcessingOptions } from '~/types/media';

interface ImagePreviewProps {
  image: ProcessedImage;
  onUpdate: (updatedImage: ProcessedImage) => void;
  onRemove: () => void;
  showControls?: boolean;
  className?: string;
}

export function ImagePreview({
  image,
  onUpdate,
  onRemove,
  showControls = true,
  className = '',
}: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [quality, setQuality] = useState(image.metadata.quality || 85);
  const [format, setFormat] = useState(image.metadata.format);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const processor = new BrowserImageProcessor();
  const metadataExtractor = new ImageMetadataExtractor();

  // URL 생성 및 정리
  useEffect(() => {
    const url = URL.createObjectURL(image.processedBlob);
    const thumbUrl = URL.createObjectURL(image.thumbnail);
    
    setPreviewUrl(url);
    setThumbnailUrl(thumbUrl);

    return () => {
      URL.revokeObjectURL(url);
      URL.revokeObjectURL(thumbUrl);
    };
  }, [image.processedBlob, image.thumbnail]);

  // 품질 변경 처리
  const handleQualityChange = async (newQuality: number) => {
    setQuality(newQuality);
    await reprocessImage({ quality: newQuality / 100 });
  };

  // 포맷 변경 처리
  const handleFormatChange = async (newFormat: 'jpeg' | 'png' | 'webp') => {
    setFormat(newFormat);
    await reprocessImage({ format: newFormat });
  };

  // 이미지 재처리
  const reprocessImage = async (options: Partial<ImageProcessingOptions>) => {
    setIsProcessing(true);

    try {
      const processedBlob = await processor.resizeImage(image.originalFile, {
        maxWidth: image.metadata.dimensions.width,
        maxHeight: image.metadata.dimensions.height,
        quality: options.quality || quality / 100,
        format: options.format || format,
        maintainAspectRatio: true,
      });

      const updatedMetadata = {
        ...image.metadata,
        quality: (options.quality || quality / 100) * 100,
        format: options.format || format,
        fileSize: processedBlob.size,
      };

      const updatedImage: ProcessedImage = {
        ...image,
        processedBlob,
        metadata: updatedMetadata,
      };

      onUpdate(updatedImage);
    } catch (error) {
      console.error('Error reprocessing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Alt 텍스트 업데이트
  const handleAltTextChange = (altText: string) => {
    const updatedImage: ProcessedImage = {
      ...image,
      metadata: {
        ...image.metadata,
        altText,
      },
    };
    onUpdate(updatedImage);
  };

  // 캡션 업데이트
  const handleCaptionChange = (caption: string) => {
    const updatedImage: ProcessedImage = {
      ...image,
      metadata: {
        ...image.metadata,
        caption,
      },
    };
    onUpdate(updatedImage);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* 이미지 영역 */}
      <div className="relative group">
        <img
          src={previewUrl}
          alt={image.metadata.altText || image.metadata.originalName}
          className="w-full h-48 object-cover"
        />
        
        {/* 오버레이 컨트롤 */}
        {showControls && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onRemove}
                className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                title="삭제"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* 처리 중 표시 */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* 정보 및 컨트롤 */}
      <div className="p-4">
        {/* 기본 정보 */}
        <div className="mb-3">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {image.metadata.originalName}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {metadataExtractor.generateImageSummary(image.metadata)}
          </p>
        </div>

        {/* 컨트롤 영역 */}
        {showControls && (
          <>
            {/* 품질 조정 */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                품질: {quality}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={quality}
                onChange={(e) => handleQualityChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* 포맷 선택 */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                형식
              </label>
              <div className="flex gap-1">
                {(['webp', 'jpeg', 'png'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => handleFormatChange(f)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      format === f
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* 상세 정보 토글 */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              {showDetails ? '간단히 보기' : '상세 정보'}
            </button>
          </>
        )}

        {/* 상세 정보 */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
            {/* Alt 텍스트 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                대체 텍스트
              </label>
              <input
                type="text"
                value={image.metadata.altText || ''}
                onChange={(e) => handleAltTextChange(e.target.value)}
                placeholder="이미지 설명 입력..."
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 캡션 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                캡션
              </label>
              <textarea
                value={image.metadata.caption || ''}
                onChange={(e) => handleCaptionChange(e.target.value)}
                placeholder="캡션 입력..."
                rows={2}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 추가 정보 */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>원본: {image.metadata.dimensions.width} × {image.metadata.dimensions.height}px</p>
              <p>크기: {metadataExtractor.formatFileSize(image.metadata.fileSize)}</p>
              <p>처리: {new Date(image.metadata.processedAt).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}