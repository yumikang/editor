// Phase 4: 미디어 처리 테스트 페이지
import { useState } from 'react';
import { MediaUploadZone } from '~/components/media/MediaUploadZone';
import { ImagePreview } from '~/components/media/ImagePreview';
import { ImageEditor } from '~/components/media/ImageEditor';
import { AdvancedImageEditor } from '~/components/media/AdvancedImageEditor';
import type { ProcessedImage } from '~/types/media';

export default function TestMedia() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${result}`]);
  };

  const handleImageUpload = (uploadedImages: ProcessedImage[]) => {
    setImages(prev => [...prev, ...uploadedImages]);
    addTestResult(`✅ ${uploadedImages.length}개 이미지 업로드 완료`);
    
    // 첫 번째 이미지 테스트
    if (uploadedImages.length > 0) {
      const firstImage = uploadedImages[0];
      addTestResult(`📊 첫 번째 이미지 정보: ${firstImage.metadata.originalName}`);
      addTestResult(`📐 크기: ${firstImage.metadata.dimensions.width}x${firstImage.metadata.dimensions.height}`);
      addTestResult(`📦 용량: ${(firstImage.metadata.fileSize / 1024 / 1024).toFixed(2)}MB`);
      addTestResult(`🎨 포맷: ${firstImage.metadata.format}`);
    }
  };

  const handleImageUpdate = (updatedImage: ProcessedImage) => {
    setImages(prev => 
      prev.map(img => img.id === updatedImage.id ? updatedImage : img)
    );
    addTestResult(`🔄 이미지 업데이트: ${updatedImage.metadata.originalName}`);
  };

  const handleImageRemove = (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    setImages(prev => prev.filter(img => img.id !== imageId));
    addTestResult(`🗑️ 이미지 삭제: ${image?.metadata.originalName}`);
    
    if (selectedImage?.id === imageId) {
      setSelectedImage(null);
    }
  };

  const handleEditorSave = (editedImage: ProcessedImage) => {
    handleImageUpdate(editedImage);
    setShowEditor(false);
    addTestResult(`💾 기본 편집 완료: ${editedImage.metadata.originalName}`);
  };

  const handleAdvancedEditorSave = (editedImage: ProcessedImage) => {
    handleImageUpdate(editedImage);
    setShowAdvancedEditor(false);
    addTestResult(`🎨 고급 편집 완료: ${editedImage.metadata.originalName}`);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Phase 4 미디어 처리 테스트</h1>
            <p className="text-sm text-gray-600 mt-1">
              이미지 업로드, 처리, 편집 기능을 테스트합니다.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              업로드된 이미지: {images.length}개
            </span>
            <button
              onClick={clearTestResults}
              className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              로그 초기화
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* 좌측: 업로드 및 이미지 목록 */}
        <div className="w-[350px] bg-white border-r flex flex-col">
          {/* 업로드 영역 */}
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold mb-3">이미지 업로드</h2>
            <MediaUploadZone
              onUpload={handleImageUpload}
              maxFiles={10}
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
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-3">업로드된 이미지</h2>
              <div className="space-y-3">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`cursor-pointer border rounded-lg transition-colors ${
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
                      showControls={false}
                    />
                    <div className="p-3 border-t">
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(image);
                              setShowEditor(true);
                            }}
                            className="flex-1 py-1 px-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                          >
                            기본
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage(image);
                              setShowAdvancedEditor(true);
                            }}
                            className="flex-1 py-1 px-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            고급
                          </button>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageRemove(image.id);
                          }}
                          className="w-full py-1 px-2 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 중앙: 선택된 이미지 상세 */}
        <div className="flex-1 bg-gray-100 flex flex-col">
          <div className="bg-white border-b p-4">
            <h2 className="text-lg font-semibold">
              {selectedImage ? '선택된 이미지' : '이미지를 선택하세요'}
            </h2>
          </div>

          <div className="flex-1 p-4">
            {selectedImage ? (
              <div className="h-full flex flex-col">
                {/* 이미지 미리보기 */}
                <div className="flex-1 bg-white rounded-lg p-4 mb-4">
                  <div className="h-full flex items-center justify-center">
                    <img
                      src={URL.createObjectURL(selectedImage.processedBlob)}
                      alt={selectedImage.metadata.altText || 'Selected image'}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    />
                  </div>
                </div>

                {/* 이미지 정보 */}
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold mb-2">이미지 정보</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">파일명:</span>
                      <p className="font-mono">{selectedImage.metadata.originalName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">크기:</span>
                      <p>{selectedImage.metadata.dimensions.width} × {selectedImage.metadata.dimensions.height}px</p>
                    </div>
                    <div>
                      <span className="text-gray-600">용량:</span>
                      <p>{(selectedImage.metadata.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div>
                      <span className="text-gray-600">포맷:</span>
                      <p>{selectedImage.metadata.format.toUpperCase()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">품질:</span>
                      <p>{selectedImage.metadata.quality}%</p>
                    </div>
                    <div>
                      <span className="text-gray-600">처리 시간:</span>
                      <p>{new Date(selectedImage.metadata.processedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">🖼️</div>
                  <p>좌측에서 이미지를 선택하면 여기에 표시됩니다.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 테스트 로그 */}
        <div className="w-[300px] bg-white border-l flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">테스트 로그</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="text-xs p-2 bg-gray-50 rounded font-mono"
                >
                  {result}
                </div>
              ))}
              {testResults.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-sm">아직 테스트 로그가 없습니다.</p>
                  <p className="text-xs">이미지를 업로드하면 로그가 표시됩니다.</p>
                </div>
              )}
            </div>
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