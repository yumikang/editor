// Phase 4: 미디어 업로드 존 컴포넌트
import { useState, useCallback, useRef } from 'react';
import { ImageValidator } from '~/utils/image-validator';
import { BrowserImageProcessor } from '~/utils/browser-image-processor';
import { ImageMetadataExtractor } from '~/utils/image-metadata';
import type { ProcessedImage, ImageProcessingOptions } from '~/types/media';

interface MediaUploadZoneProps {
  onUpload: (images: ProcessedImage[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // MB
  acceptedFormats?: string[];
  processingOptions?: ImageProcessingOptions;
  className?: string;
}

export function MediaUploadZone({
  onUpload,
  maxFiles = 10,
  maxFileSize = 10,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  processingOptions = {},
  className = '',
}: MediaUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const validator = new ImageValidator({
    maxFileSize: maxFileSize * 1024 * 1024,
    allowedFormats: acceptedFormats,
  });
  
  const processor = new BrowserImageProcessor();
  const metadataExtractor = new ImageMetadataExtractor();

  // 드래그 이벤트 핸들러
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 자식 요소로 이동하는 경우 무시
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, []);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  }, []);

  // 파일 처리
  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;
    
    if (files.length > maxFiles) {
      setErrors([`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`]);
      return;
    }

    setIsProcessing(true);
    setErrors([]);
    setProgress(0);

    const processedImages: ProcessedImage[] = [];
    const processingErrors: string[] = [];

    // 각 파일 검증 및 처리
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(Math.round(((i + 1) / files.length) * 100));

      try {
        // 1. 파일 검증
        const validation = await validator.validateImage(file);
        if (!validation.valid) {
          processingErrors.push(`${file.name}: ${validation.errors.join(', ')}`);
          continue;
        }

        // 2. 메타데이터 추출
        const metadata = await metadataExtractor.extractMetadata(file);
        const id = metadataExtractor.generateId();

        // 3. 이미지 처리 (리사이징, WebP 변환)
        const processedBlob = await processor.resizeImage(file, {
          ...processingOptions,
          format: 'webp',
          quality: processingOptions.quality || 0.85,
        });

        // 4. 썸네일 생성
        const thumbnail = await processor.generateThumbnail(
          file,
          processingOptions.thumbnailSize || 200,
          0.8
        );

        // 5. ProcessedImage 객체 생성
        const processedImage: ProcessedImage = {
          id,
          originalFile: file,
          processedBlob,
          thumbnail,
          metadata: {
            ...metadata,
            quality: processingOptions.quality || 85,
          },
        };

        processedImages.push(processedImage);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        processingErrors.push(`${file.name}: 처리 중 오류가 발생했습니다.`);
      }
    }

    setIsProcessing(false);
    setProgress(0);

    if (processingErrors.length > 0) {
      setErrors(processingErrors);
    }

    if (processedImages.length > 0) {
      onUpload(processedImages);
    }
  };

  // 클릭으로 파일 선택
  const handleZoneClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      {/* 업로드 영역 */}
      <div
        className={`
          relative overflow-hidden rounded-lg border-2 border-dashed
          transition-all duration-200 cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }
          ${isProcessing ? 'pointer-events-none opacity-60' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleZoneClick}
      >
        <div className="p-8 text-center">
          {/* 아이콘 */}
          <div className="mb-4">
            <svg
              className={`mx-auto h-12 w-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {/* 텍스트 */}
          <p className="mb-2 text-sm text-gray-700">
            {isDragging ? (
              <span className="font-semibold text-blue-600">파일을 놓으세요</span>
            ) : (
              <>
                <span className="font-semibold">클릭하여 업로드</span> 또는 
                파일을 드래그하세요
              </>
            )}
          </p>
          <p className="text-xs text-gray-500">
            {acceptedFormats.map(f => f.replace('image/', '').toUpperCase()).join(', ')} • 
            최대 {maxFileSize}MB • 
            최대 {maxFiles}개
          </p>
        </div>

        {/* 진행률 표시 */}
        {isProcessing && (
          <div className="absolute inset-x-0 bottom-0 bg-white bg-opacity-90">
            <div className="px-4 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">처리 중...</span>
                <span className="text-sm text-gray-700">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 에러 메시지 */}
      {errors.length > 0 && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm font-medium text-red-800 mb-1">업로드 오류</p>
          <ul className="text-xs text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 도움말 */}
      <div className="mt-3 text-xs text-gray-500">
        <p>• 이미지는 자동으로 최적화되어 WebP 형식으로 변환됩니다</p>
        <p>• 큰 이미지는 자동으로 리사이징됩니다</p>
      </div>
    </div>
  );
}