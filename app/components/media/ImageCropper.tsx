// Phase 4: 드래그 가능한 이미지 크롭 컴포넌트
import { useState, useRef, useEffect, useCallback } from 'react';
import type { ImageCropData } from '~/types/media';

interface ImageCropperProps {
  imageUrl: string;
  onCropChange: (cropData: ImageCropData) => void;
  aspectRatio?: number; // 1:1 = 1, 16:9 = 16/9, 자유 = undefined
  className?: string;
}

export function ImageCropper({ 
  imageUrl, 
  onCropChange, 
  aspectRatio,
  className = '' 
}: ImageCropperProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'resize' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropData, setCropData] = useState<ImageCropData>({
    x: 50,
    y: 50,
    width: 200,
    height: 200,
  });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // 이미지 로드 시 크기 계산
  useEffect(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;
      
      const imgRect = img.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      setImageSize({ width: imgRect.width, height: imgRect.height });
      setContainerSize({ width: containerRect.width, height: containerRect.height });
      
      // 초기 크롭 영역 설정 (이미지 중앙의 50%)
      const initialWidth = imgRect.width * 0.5;
      const initialHeight = aspectRatio ? initialWidth / aspectRatio : imgRect.height * 0.5;
      
      setCropData({
        x: (imgRect.width - initialWidth) / 2,
        y: (imgRect.height - initialHeight) / 2,
        width: initialWidth,
        height: initialHeight,
      });
    }
  }, [imageUrl, aspectRatio]);

  // 크롭 데이터 변경 시 콜백 호출
  useEffect(() => {
    if (imageSize.width > 0 && imageSize.height > 0) {
      onCropChange(cropData);
    }
  }, [cropData, imageSize, onCropChange]);

  // 마우스 다운 이벤트
  const handleMouseDown = useCallback((e: React.MouseEvent, type: 'move' | 'resize') => {
    e.preventDefault();
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  // 마우스 무브 이벤트
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragType) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setCropData(prev => {
      let newCropData = { ...prev };

      if (dragType === 'move') {
        // 이동
        newCropData.x = Math.max(0, Math.min(prev.x + deltaX, imageSize.width - prev.width));
        newCropData.y = Math.max(0, Math.min(prev.y + deltaY, imageSize.height - prev.height));
      } else if (dragType === 'resize') {
        // 크기 조정
        newCropData.width = Math.max(50, Math.min(prev.width + deltaX, imageSize.width - prev.x));
        
        if (aspectRatio) {
          newCropData.height = newCropData.width / aspectRatio;
        } else {
          newCropData.height = Math.max(50, Math.min(prev.height + deltaY, imageSize.height - prev.y));
        }
        
        // 경계 체크
        if (newCropData.x + newCropData.width > imageSize.width) {
          newCropData.width = imageSize.width - newCropData.x;
          if (aspectRatio) {
            newCropData.height = newCropData.width / aspectRatio;
          }
        }
        if (newCropData.y + newCropData.height > imageSize.height) {
          newCropData.height = imageSize.height - newCropData.y;
          if (aspectRatio) {
            newCropData.width = newCropData.height * aspectRatio;
          }
        }
      }

      return newCropData;
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragType, dragStart, imageSize, aspectRatio]);

  // 마우스 업 이벤트
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
  }, []);

  // 이벤트 리스너 등록
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 비율 프리셋 적용
  const applyAspectRatio = (ratio: number | null) => {
    setCropData(prev => {
      let newWidth = prev.width;
      let newHeight = prev.height;
      
      if (ratio) {
        newHeight = newWidth / ratio;
        
        // 경계 체크
        if (prev.y + newHeight > imageSize.height) {
          newHeight = imageSize.height - prev.y;
          newWidth = newHeight * ratio;
        }
        if (prev.x + newWidth > imageSize.width) {
          newWidth = imageSize.width - prev.x;
          newHeight = newWidth / ratio;
        }
      }
      
      return {
        ...prev,
        width: newWidth,
        height: newHeight,
      };
    });
  };

  return (
    <div className={`relative ${className}`}>
      {/* 비율 프리셋 버튼 */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => applyAspectRatio(null)}
          className={`px-3 py-1 text-sm rounded ${
            !aspectRatio ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          자유
        </button>
        <button
          onClick={() => applyAspectRatio(1)}
          className={`px-3 py-1 text-sm rounded ${
            aspectRatio === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          1:1
        </button>
        <button
          onClick={() => applyAspectRatio(16/9)}
          className={`px-3 py-1 text-sm rounded ${
            aspectRatio === 16/9 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          16:9
        </button>
        <button
          onClick={() => applyAspectRatio(4/3)}
          className={`px-3 py-1 text-sm rounded ${
            aspectRatio === 4/3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          4:3
        </button>
      </div>

      {/* 크롭 영역 */}
      <div
        ref={containerRef}
        className="relative inline-block max-w-full max-h-96 overflow-hidden bg-gray-100 rounded-lg"
        style={{ userSelect: 'none' }}
      >
        {/* 원본 이미지 */}
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Crop source"
          className="max-w-full max-h-96 object-contain"
          draggable={false}
        />

        {/* 크롭 오버레이 */}
        {imageSize.width > 0 && (
          <>
            {/* 어두운 오버레이 */}
            <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none" />
            
            {/* 크롭 영역 (밝은 부분) */}
            <div
              className="absolute border-2 border-white shadow-lg cursor-move"
              style={{
                left: cropData.x,
                top: cropData.y,
                width: cropData.width,
                height: cropData.height,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'brightness(1.2)',
              }}
              onMouseDown={(e) => handleMouseDown(e, 'move')}
            >
              {/* 크롭 영역 내부 격자 */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border border-white opacity-30" style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: `${cropData.width / 3}px ${cropData.height / 3}px`,
                }} />
              </div>

              {/* 리사이즈 핸들 */}
              <div
                className="absolute bottom-0 right-0 w-4 h-4 bg-white border border-gray-400 cursor-nw-resize"
                style={{ transform: 'translate(50%, 50%)' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, 'resize');
                }}
              />
              
              {/* 모서리 핸들들 */}
              <div
                className="absolute top-0 left-0 w-2 h-2 bg-white border border-gray-400 cursor-nw-resize"
                style={{ transform: 'translate(-50%, -50%)' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, 'resize');
                }}
              />
              <div
                className="absolute top-0 right-0 w-2 h-2 bg-white border border-gray-400 cursor-ne-resize"
                style={{ transform: 'translate(50%, -50%)' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, 'resize');
                }}
              />
              <div
                className="absolute bottom-0 left-0 w-2 h-2 bg-white border border-gray-400 cursor-sw-resize"
                style={{ transform: 'translate(-50%, 50%)' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, 'resize');
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* 크롭 정보 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">위치:</span>
            <p className="font-mono">{Math.round(cropData.x)}, {Math.round(cropData.y)}</p>
          </div>
          <div>
            <span className="text-gray-600">크기:</span>
            <p className="font-mono">{Math.round(cropData.width)} × {Math.round(cropData.height)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}