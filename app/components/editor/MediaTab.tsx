// Phase 4: 미디어 편집 탭 - 통합 테스트용
import { useState } from 'react';
import { MediaUploadZone } from '~/components/media/MediaUploadZone';
import { ImagePreview } from '~/components/media/ImagePreview';
import { ImageEditor } from '~/components/media/ImageEditor';
import { AdvancedImageEditor } from '~/components/media/AdvancedImageEditor';
import { LivePreview } from '~/components/preview/LivePreview';
import type { ProcessedImage } from '~/types/media';

interface MediaTabProps {
  templateId: string;
  editedData: any;
}

export function MediaTab({ templateId, editedData }: MediaTabProps) {
  const [uploadedImages, setUploadedImages] = useState<ProcessedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [previewSize, setPreviewSize] = useState<'mobile' | 'desktop'>('desktop');

  // 이미지 업로드 핸들러
  const handleImageUpload = (images: ProcessedImage[]) => {
    setUploadedImages(prev => [...prev, ...images]);
    console.log('업로드된 이미지:', images);
  };

  // 이미지 업데이트 핸들러
  const handleImageUpdate = (updatedImage: ProcessedImage) => {
    setUploadedImages(prev => 
      prev.map(img => img.id === updatedImage.id ? updatedImage : img)
    );
    setSelectedImage(updatedImage);
  };

  // 이미지 제거 핸들러
  const handleImageRemove = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    if (selectedImage?.id === imageId) {
      setSelectedImage(null);
    }
  };

  // 편집기 저장 핸들러
  const handleEditorSave = (editedImage: ProcessedImage) => {
    handleImageUpdate(editedImage);
    setShowEditor(false);
  };

  // 고급 편집기 저장 핸들러
  const handleAdvancedEditorSave = (editedImage: ProcessedImage) => {
    handleImageUpdate(editedImage);
    setShowAdvancedEditor(false);
  };

  // 편집기 열기
  const handleEditImage = (image: ProcessedImage) => {
    setSelectedImage(image);
    setShowEditor(true);
  };

  // 고급 편집기 열기
  const handleAdvancedEditImage = (image: ProcessedImage) => {
    setSelectedImage(image);
    setShowAdvancedEditor(true);
  };

  return (
    <div className="h-full flex">
      {/* 좌측 패널: 미디어 라이브러리 (300px) */}
      <div className="w-[300px] border-r bg-white">
        <div className="h-full flex flex-col">
          {/* 헤더 */}
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">미디어 라이브러리</h3>
          </div>

          {/* 업로드 영역 */}
          <div className="p-4 border-b">
            <MediaUploadZone
              onUpload={handleImageUpload}
              maxFiles={5}
              maxFileSize={10}
              processingOptions={{
                maxWidth: 1920,
                maxHeight: 1080,
                quality: 0.85,
                generateThumbnail: true,
                thumbnailSize: 200,
              }}
              className="h-32"
            />
          </div>

          {/* 이미지 목록 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {uploadedImages.map((image) => (
                <div
                  key={image.id}
                  className={`cursor-pointer rounded-lg border-2 transition-colors ${
                    selectedImage?.id === image.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedImage(image)}
                >
                  <ImagePreview
                    image={image}
                    onUpdate={handleImageUpdate}
                    onRemove={() => handleImageRemove(image.id)}
                    showControls={true}
                    className="border-none"
                  />
                  
                  {/* 편집 버튼 */}
                  <div className="p-2 border-t">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditImage(image);
                        }}
                        className="flex-1 py-1 px-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        기본 편집
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdvancedEditImage(image);
                        }}
                        className="flex-1 py-1 px-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        고급 편집
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {uploadedImages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">업로드된 이미지가 없습니다.</p>
                  <p className="text-xs">위의 업로드 영역을 사용하세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 중앙 패널: 실시간 미리보기 (flex-1) */}
      <div className="flex-1 bg-gray-100">
        <div className="h-full flex flex-col">
          {/* 미리보기 헤더 */}
          <div className="bg-white border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">실시간 미리보기</h3>
              <div className="flex items-center gap-4">
                {/* 디바이스 토글 */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setPreviewSize('desktop')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      previewSize === 'desktop' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    💻 데스크톱
                  </button>
                  <button
                    onClick={() => setPreviewSize('mobile')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      previewSize === 'mobile' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📱 모바일
                  </button>
                </div>

                {/* 선택된 이미지 정보 */}
                {selectedImage && (
                  <div className="text-sm text-gray-600">
                    선택: {selectedImage.metadata.originalName}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 미리보기 영역 */}
          <div className="flex-1 p-4">
            <LivePreview
              templateId={templateId}
              previewUrl={`/api/template-preview/${templateId}`}
              editedData={editedData}
              previewSize={previewSize}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* 우측 패널: 이미지 속성 (350px) */}
      <div className="w-[350px] border-l bg-white">
        <div className="h-full flex flex-col">
          {/* 헤더 */}
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">이미지 속성</h3>
          </div>

          {/* 내용 */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedImage ? (
              <div className="space-y-4">
                {/* 선택된 이미지 미리보기 */}
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(selectedImage.processedBlob)}
                    alt={selectedImage.metadata.altText || selectedImage.metadata.originalName}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* 이미지 정보 */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">이미지 정보</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>파일명: {selectedImage.metadata.originalName}</p>
                    <p>크기: {selectedImage.metadata.dimensions.width} × {selectedImage.metadata.dimensions.height}px</p>
                    <p>용량: {(selectedImage.metadata.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    <p>형식: {selectedImage.metadata.format.toUpperCase()}</p>
                    <p>품질: {selectedImage.metadata.quality}%</p>
                  </div>
                </div>

                {/* 편집 액션 */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">편집 액션</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => handleAdvancedEditImage(selectedImage)}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      🖼️ 고급 편집 (크롭/라운딩)
                    </button>
                    <button
                      onClick={() => handleEditImage(selectedImage)}
                      className="w-full py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      ⚙️ 기본 편집
                    </button>
                    <button
                      onClick={() => handleImageRemove(selectedImage.id)}
                      className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                </div>

                {/* 사용 통계 */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">사용 통계</h4>
                  <div className="text-sm text-gray-600">
                    <p>업로드: {new Date(selectedImage.metadata.processedAt).toLocaleString()}</p>
                    <p>사용 횟수: 0회</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">이미지를 선택하세요.</p>
                <p className="text-xs">좌측에서 이미지를 클릭하면 속성을 확인할 수 있습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 기본 이미지 편집기 모달 */}
      {showEditor && selectedImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75">
          <ImageEditor
            image={selectedImage}
            onSave={handleEditorSave}
            onCancel={() => setShowEditor(false)}
          />
        </div>
      )}

      {/* 고급 이미지 편집기 모달 */}
      {showAdvancedEditor && selectedImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75">
          <AdvancedImageEditor
            image={selectedImage}
            onSave={handleAdvancedEditorSave}
            onCancel={() => setShowAdvancedEditor(false)}
          />
        </div>
      )}
    </div>
  );
}