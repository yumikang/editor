// Phase 4: 고급 이미지 편집기 - 크롭 + 라운딩 + Canvas 체인
import { useState, useEffect, useRef } from 'react';
import { BrowserImageProcessor } from '~/utils/browser-image-processor';
import { ImageMetadataExtractor } from '~/utils/image-metadata';
import { ImageCropper } from './ImageCropper';
import type { 
  ProcessedImage, 
  ImageFilterOptions, 
  ImageCropData 
} from '~/types/media';

interface AdvancedImageEditorProps {
  image: ProcessedImage;
  onSave: (editedImage: ProcessedImage) => void;
  onCancel: () => void;
}

interface EditingState {
  cropData: ImageCropData | null;
  borderRadius: number;
  filters: ImageFilterOptions;
  rotation: number;
  dimensions: { width: number; height: number };
}

export function AdvancedImageEditor({ image, onSave, onCancel }: AdvancedImageEditorProps) {
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'crop' | 'round' | 'adjust' | 'filter'>('crop');
  
  // 편집 상태
  const [editingState, setEditingState] = useState<EditingState>({
    cropData: null,
    borderRadius: 0,
    filters: {
      brightness: 0,
      contrast: 0,
      saturate: 100,
      blur: 0,
      grayscale: false,
      sepia: false,
    },
    rotation: 0,
    dimensions: image.metadata.dimensions,
  });

  // 실시간 미리보기 Blob
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  
  const processor = new BrowserImageProcessor();
  const metadataExtractor = new ImageMetadataExtractor();

  // 초기 URL 설정
  useEffect(() => {
    const originalImageUrl = URL.createObjectURL(image.originalFile);
    const previewImageUrl = URL.createObjectURL(image.processedBlob);
    
    setOriginalUrl(originalImageUrl);
    setPreviewUrl(previewImageUrl);
    setPreviewBlob(image.processedBlob);

    return () => {
      URL.revokeObjectURL(originalImageUrl);
      URL.revokeObjectURL(previewImageUrl);
    };
  }, [image]);

  // 실시간 미리보기 업데이트
  useEffect(() => {
    const updatePreview = async () => {
      if (!editingState.cropData && 
          editingState.borderRadius === 0 && 
          editingState.rotation === 0 &&
          JSON.stringify(editingState.filters) === JSON.stringify({
            brightness: 0, contrast: 0, saturate: 100, blur: 0, grayscale: false, sepia: false
          })) {
        // 변경사항이 없으면 원본 사용
        setPreviewUrl(URL.createObjectURL(image.processedBlob));
        setPreviewBlob(image.processedBlob);
        return;
      }

      setIsProcessing(true);
      
      try {
        // Canvas 체인 작업 정의
        const operations: Array<{
          type: 'crop' | 'round' | 'filter' | 'resize' | 'rotate';
          params: any;
        }> = [];

        // 크롭 먼저
        if (editingState.cropData) {
          operations.push({
            type: 'crop',
            params: editingState.cropData,
          });
        }

        // 회전
        if (editingState.rotation !== 0) {
          operations.push({
            type: 'rotate',
            params: { degrees: editingState.rotation },
          });
        }

        // 필터 적용
        const hasFilters = editingState.filters.brightness !== 0 ||
                          editingState.filters.contrast !== 0 ||
                          editingState.filters.saturate !== 100 ||
                          editingState.filters.blur !== 0 ||
                          editingState.filters.grayscale ||
                          editingState.filters.sepia;

        if (hasFilters) {
          operations.push({
            type: 'filter',
            params: editingState.filters,
          });
        }

        // 라운딩은 마지막
        if (editingState.borderRadius > 0) {
          operations.push({
            type: 'round',
            params: { borderRadius: editingState.borderRadius },
          });
        }

        // Canvas 체인 실행
        const resultBlob = await processor.processImageChain(
          image.originalFile,
          operations,
          'webp',
          0.85
        );

        // 미리보기 업데이트
        const newPreviewUrl = URL.createObjectURL(resultBlob);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(newPreviewUrl);
        setPreviewBlob(resultBlob);
        
      } catch (error) {
        console.error('Error updating preview:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    // 디바운싱 (500ms)
    const timeoutId = setTimeout(updatePreview, 500);
    return () => clearTimeout(timeoutId);
  }, [editingState, image.originalFile, processor]);

  // 크롭 데이터 변경
  const handleCropChange = (cropData: ImageCropData) => {
    setEditingState(prev => ({ ...prev, cropData }));
  };

  // 라운딩 변경
  const handleBorderRadiusChange = (borderRadius: number) => {
    setEditingState(prev => ({ ...prev, borderRadius }));
  };

  // 필터 변경
  const handleFilterChange = (filterKey: keyof ImageFilterOptions, value: any) => {
    setEditingState(prev => ({
      ...prev,
      filters: { ...prev.filters, [filterKey]: value }
    }));
  };

  // 회전 변경
  const handleRotationChange = (degrees: number) => {
    setEditingState(prev => ({ ...prev, rotation: degrees }));
  };

  // 저장 처리
  const handleSave = async () => {
    if (!previewBlob) return;

    setIsProcessing(true);
    
    try {
      // 새로운 메타데이터 생성
      const newMetadata = await metadataExtractor.extractMetadata(
        processor.blobToFile(previewBlob, image.metadata.originalName)
      );

      // 새로운 썸네일 생성
      const thumbnailBlob = await processor.generateThumbnail(
        processor.blobToFile(previewBlob, image.metadata.originalName),
        200,
        0.8
      );

      const editedImage: ProcessedImage = {
        ...image,
        processedBlob: previewBlob,
        thumbnail: thumbnailBlob,
        metadata: {
          ...image.metadata,
          ...newMetadata,
          fileSize: previewBlob.size,
          processedAt: new Date(),
        },
      };

      onSave(editedImage);
    } catch (error) {
      console.error('Error saving image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 초기화
  const handleReset = () => {
    setEditingState({
      cropData: null,
      borderRadius: 0,
      filters: {
        brightness: 0,
        contrast: 0,
        saturate: 100,
        blur: 0,
        grayscale: false,
        sepia: false,
      },
      rotation: 0,
      dimensions: image.metadata.dimensions,
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* 헤더 */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">고급 이미지 편집</h3>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="px-3 py-1 text-sm text-gray-300 hover:text-white disabled:opacity-50"
            >
              초기화
            </button>
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="px-3 py-1 text-sm text-gray-300 hover:text-white disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isProcessing ? '처리 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className="bg-gray-800 px-4 border-b border-gray-700">
        <div className="flex gap-4">
          {(['crop', 'round', 'adjust', 'filter'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-white border-blue-500'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              {tab === 'crop' && '🖼️ 크롭'}
              {tab === 'round' && '🔄 라운딩'}
              {tab === 'adjust' && '⚙️ 조정'}
              {tab === 'filter' && '🎨 필터'}
            </button>
          ))}
        </div>
      </div>

      {/* 메인 영역 */}
      <div className="flex-1 flex">
        {/* 미리보기 영역 */}
        <div className="flex-1 p-4 flex items-center justify-center bg-gray-800 relative">
          {previewUrl && (
            <div className="relative max-w-full max-h-full">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          )}
          
          {isProcessing && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>처리 중...</p>
              </div>
            </div>
          )}
        </div>

        {/* 컨트롤 패널 */}
        <div className="w-96 bg-gray-900 border-l border-gray-700 p-4 overflow-y-auto">
          {/* 크롭 탭 */}
          {activeTab === 'crop' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">이미지 크롭</h4>
              {originalUrl && (
                <ImageCropper
                  imageUrl={originalUrl}
                  onCropChange={handleCropChange}
                  className="w-full"
                />
              )}
            </div>
          )}

          {/* 라운딩 탭 */}
          {activeTab === 'round' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">라운딩 처리</h4>
              
              {/* 라운딩 슬라이더 */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  모서리 둥글기: {editingState.borderRadius}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={editingState.borderRadius}
                  onChange={(e) => handleBorderRadiusChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* 미리보기 */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center">
                  <div
                    className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600"
                    style={{ borderRadius: `${editingState.borderRadius}px` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  미리보기 (실제 이미지에 적용됨)
                </p>
              </div>

              {/* 빠른 설정 */}
              <div className="grid grid-cols-2 gap-2">
                {[0, 8, 16, 24, 32, 50].map((radius) => (
                  <button
                    key={radius}
                    onClick={() => handleBorderRadiusChange(radius)}
                    className={`py-2 px-3 text-xs rounded transition-colors ${
                      editingState.borderRadius === radius
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {radius}px
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 조정 탭 */}
          {activeTab === 'adjust' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">기본 조정</h4>
              
              {/* 회전 */}
              <div>
                <h5 className="text-xs text-gray-400 mb-2">회전</h5>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRotationChange(editingState.rotation + 90)}
                    className="flex-1 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    90° ↻
                  </button>
                  <button
                    onClick={() => handleRotationChange(editingState.rotation - 90)}
                    className="flex-1 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    90° ↺
                  </button>
                  <button
                    onClick={() => handleRotationChange(editingState.rotation + 180)}
                    className="flex-1 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    180°
                  </button>
                </div>
              </div>

              {/* 현재 회전 각도 */}
              <div className="text-xs text-gray-400">
                현재 회전: {editingState.rotation}°
              </div>
            </div>
          )}

          {/* 필터 탭 */}
          {activeTab === 'filter' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">필터 효과</h4>
              
              {/* 밝기 */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  밝기: {editingState.filters.brightness}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={editingState.filters.brightness}
                  onChange={(e) => handleFilterChange('brightness', Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* 대비 */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  대비: {editingState.filters.contrast}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={editingState.filters.contrast}
                  onChange={(e) => handleFilterChange('contrast', Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* 채도 */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  채도: {editingState.filters.saturate}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={editingState.filters.saturate}
                  onChange={(e) => handleFilterChange('saturate', Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* 블러 */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">
                  블러: {editingState.filters.blur}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={editingState.filters.blur}
                  onChange={(e) => handleFilterChange('blur', Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* 효과 */}
              <div className="space-y-2">
                <label className="flex items-center text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={editingState.filters.grayscale}
                    onChange={(e) => handleFilterChange('grayscale', e.target.checked)}
                    className="mr-2"
                  />
                  흑백
                </label>
                <label className="flex items-center text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={editingState.filters.sepia}
                    onChange={(e) => handleFilterChange('sepia', e.target.checked)}
                    className="mr-2"
                  />
                  세피아
                </label>
              </div>
            </div>
          )}

          {/* 정보 */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-2">이미지 정보</h4>
            <div className="text-xs text-gray-500 space-y-1">
              <p>{image.metadata.originalName}</p>
              <p>원본: {image.metadata.dimensions.width} × {image.metadata.dimensions.height}px</p>
              <p>용량: {metadataExtractor.formatFileSize(image.metadata.fileSize)}</p>
              {previewBlob && (
                <p>미리보기: {metadataExtractor.formatFileSize(previewBlob.size)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}