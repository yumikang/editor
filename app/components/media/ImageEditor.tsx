// Phase 4: 이미지 편집기 컴포넌트
import { useState, useEffect, useRef } from 'react';
import { BrowserImageProcessor } from '~/utils/browser-image-processor';
import { ImageMetadataExtractor } from '~/utils/image-metadata';
import type { 
  ProcessedImage, 
  ImageFilterOptions, 
  ImageCropData,
  ImageProcessingOptions 
} from '~/types/media';

interface ImageEditorProps {
  image: ProcessedImage;
  onSave: (editedImage: ProcessedImage) => void;
  onCancel: () => void;
}

export function ImageEditor({ image, onSave, onCancel }: ImageEditorProps) {
  const [editedImage, setEditedImage] = useState<ProcessedImage>(image);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'adjust' | 'crop' | 'filter'>('adjust');
  
  // 필터 상태
  const [filters, setFilters] = useState<ImageFilterOptions>({
    brightness: 0,
    contrast: 0,
    saturate: 100,
    blur: 0,
    grayscale: false,
    sepia: false,
  });

  // 크롭 상태
  const [cropMode, setCropMode] = useState(false);
  const [cropData, setCropData] = useState<ImageCropData | null>(null);
  
  // 크기 조정 상태
  const [dimensions, setDimensions] = useState({
    width: image.metadata.dimensions.width,
    height: image.metadata.dimensions.height,
    maintainRatio: true,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processor = new BrowserImageProcessor();
  const metadataExtractor = new ImageMetadataExtractor();

  // 미리보기 URL 생성
  useEffect(() => {
    const url = URL.createObjectURL(editedImage.processedBlob);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [editedImage.processedBlob]);

  // 필터 적용
  const applyFilters = async () => {
    setIsProcessing(true);

    try {
      const filteredBlob = await processor.applyFilters(
        image.originalFile,
        filters,
        'webp',
        0.85
      );

      const updatedImage: ProcessedImage = {
        ...editedImage,
        processedBlob: filteredBlob,
        metadata: {
          ...editedImage.metadata,
          fileSize: filteredBlob.size,
        },
      };

      setEditedImage(updatedImage);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 크기 조정
  const handleResize = async () => {
    setIsProcessing(true);

    try {
      const resizedBlob = await processor.resizeImage(image.originalFile, {
        maxWidth: dimensions.width,
        maxHeight: dimensions.height,
        maintainAspectRatio: dimensions.maintainRatio,
        format: 'webp',
        quality: 0.85,
      });

      const newMetadata = await metadataExtractor.extractMetadata(
        processor.blobToFile(resizedBlob, image.metadata.originalName)
      );

      const updatedImage: ProcessedImage = {
        ...editedImage,
        processedBlob: resizedBlob,
        metadata: {
          ...editedImage.metadata,
          ...newMetadata,
          fileSize: resizedBlob.size,
        },
      };

      setEditedImage(updatedImage);
    } catch (error) {
      console.error('Error resizing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 크롭 적용
  const applyCrop = async () => {
    if (!cropData) return;

    setIsProcessing(true);

    try {
      const croppedBlob = await processor.cropImage(
        editedImage.originalFile,
        cropData,
        'webp',
        0.85
      );

      const newMetadata = await metadataExtractor.extractMetadata(
        processor.blobToFile(croppedBlob, image.metadata.originalName)
      );

      const updatedImage: ProcessedImage = {
        ...editedImage,
        processedBlob: croppedBlob,
        metadata: {
          ...editedImage.metadata,
          ...newMetadata,
          fileSize: croppedBlob.size,
        },
      };

      setEditedImage(updatedImage);
      setCropMode(false);
      setCropData(null);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 회전
  const handleRotate = async (degrees: number) => {
    setIsProcessing(true);

    try {
      const rotatedBlob = await processor.rotateImage(
        editedImage.originalFile,
        degrees,
        'webp',
        0.85
      );

      const newMetadata = await metadataExtractor.extractMetadata(
        processor.blobToFile(rotatedBlob, image.metadata.originalName)
      );

      const updatedImage: ProcessedImage = {
        ...editedImage,
        processedBlob: rotatedBlob,
        metadata: {
          ...editedImage.metadata,
          ...newMetadata,
          fileSize: rotatedBlob.size,
        },
      };

      setEditedImage(updatedImage);
    } catch (error) {
      console.error('Error rotating image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 초기화
  const handleReset = () => {
    setEditedImage(image);
    setFilters({
      brightness: 0,
      contrast: 0,
      saturate: 100,
      blur: 0,
      grayscale: false,
      sepia: false,
    });
    setDimensions({
      width: image.metadata.dimensions.width,
      height: image.metadata.dimensions.height,
      maintainRatio: true,
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* 헤더 */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">이미지 편집</h3>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm text-gray-300 hover:text-white"
            >
              초기화
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1 text-sm text-gray-300 hover:text-white"
            >
              취소
            </button>
            <button
              onClick={() => onSave(editedImage)}
              className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-gray-800 px-4 border-b border-gray-700">
        <div className="flex gap-4">
          {(['adjust', 'crop', 'filter'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-white border-blue-500'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              {tab === 'adjust' && '조정'}
              {tab === 'crop' && '자르기'}
              {tab === 'filter' && '필터'}
            </button>
          ))}
        </div>
      </div>

      {/* 메인 영역 */}
      <div className="flex-1 flex">
        {/* 미리보기 영역 */}
        <div className="flex-1 p-4 flex items-center justify-center bg-gray-800">
          <div className="relative max-w-full max-h-full">
            <img
              src={previewUrl}
              alt={editedImage.metadata.altText || 'Preview'}
              className="max-w-full max-h-full object-contain"
              style={{
                filter: activeTab === 'filter' 
                  ? `brightness(${100 + filters.brightness}%) contrast(${100 + filters.contrast}%) saturate(${filters.saturate}%) blur(${filters.blur}px) ${filters.grayscale ? 'grayscale(100%)' : ''} ${filters.sepia ? 'sepia(100%)' : ''}`
                  : undefined,
              }}
            />
            
            {isProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        </div>

        {/* 컨트롤 패널 */}
        <div className="w-80 bg-gray-900 border-l border-gray-700 p-4 overflow-y-auto">
          {/* 조정 탭 */}
          {activeTab === 'adjust' && (
            <div className="space-y-4">
              {/* 크기 조정 */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">크기 조정</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400">너비</label>
                    <input
                      type="number"
                      value={dimensions.width}
                      onChange={(e) => setDimensions({
                        ...dimensions,
                        width: Number(e.target.value),
                      })}
                      className="w-full px-3 py-1 bg-gray-800 text-white border border-gray-700 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">높이</label>
                    <input
                      type="number"
                      value={dimensions.height}
                      onChange={(e) => setDimensions({
                        ...dimensions,
                        height: Number(e.target.value),
                      })}
                      className="w-full px-3 py-1 bg-gray-800 text-white border border-gray-700 rounded"
                    />
                  </div>
                  <label className="flex items-center text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={dimensions.maintainRatio}
                      onChange={(e) => setDimensions({
                        ...dimensions,
                        maintainRatio: e.target.checked,
                      })}
                      className="mr-2"
                    />
                    비율 유지
                  </label>
                  <button
                    onClick={handleResize}
                    className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    크기 적용
                  </button>
                </div>
              </div>

              {/* 회전 */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-3">회전</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRotate(90)}
                    className="flex-1 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    90° ↻
                  </button>
                  <button
                    onClick={() => handleRotate(-90)}
                    className="flex-1 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    90° ↺
                  </button>
                  <button
                    onClick={() => handleRotate(180)}
                    className="flex-1 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    180°
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 필터 탭 */}
          {activeTab === 'filter' && (
            <div className="space-y-4">
              {/* 밝기 */}
              <div>
                <label className="text-xs text-gray-400">
                  밝기: {filters.brightness}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={filters.brightness}
                  onChange={(e) => setFilters({
                    ...filters,
                    brightness: Number(e.target.value),
                  })}
                  className="w-full"
                />
              </div>

              {/* 대비 */}
              <div>
                <label className="text-xs text-gray-400">
                  대비: {filters.contrast}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={filters.contrast}
                  onChange={(e) => setFilters({
                    ...filters,
                    contrast: Number(e.target.value),
                  })}
                  className="w-full"
                />
              </div>

              {/* 채도 */}
              <div>
                <label className="text-xs text-gray-400">
                  채도: {filters.saturate}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.saturate}
                  onChange={(e) => setFilters({
                    ...filters,
                    saturate: Number(e.target.value),
                  })}
                  className="w-full"
                />
              </div>

              {/* 블러 */}
              <div>
                <label className="text-xs text-gray-400">
                  블러: {filters.blur}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={filters.blur}
                  onChange={(e) => setFilters({
                    ...filters,
                    blur: Number(e.target.value),
                  })}
                  className="w-full"
                />
              </div>

              {/* 효과 */}
              <div className="space-y-2">
                <label className="flex items-center text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={filters.grayscale}
                    onChange={(e) => setFilters({
                      ...filters,
                      grayscale: e.target.checked,
                    })}
                    className="mr-2"
                  />
                  흑백
                </label>
                <label className="flex items-center text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={filters.sepia}
                    onChange={(e) => setFilters({
                      ...filters,
                      sepia: e.target.checked,
                    })}
                    className="mr-2"
                  />
                  세피아
                </label>
              </div>

              <button
                onClick={applyFilters}
                className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                필터 적용
              </button>
            </div>
          )}

          {/* 정보 */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-2">이미지 정보</h4>
            <div className="text-xs text-gray-500 space-y-1">
              <p>{editedImage.metadata.originalName}</p>
              <p>{editedImage.metadata.dimensions.width} × {editedImage.metadata.dimensions.height}px</p>
              <p>{metadataExtractor.formatFileSize(editedImage.metadata.fileSize)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}