// 통합 라이브 프리뷰 컴포넌트 - Phase 3
import { useRef, useEffect, useState } from 'react';
import { useFetcher } from '@remix-run/react';
import type { ColorSystem } from '~/types/color-system';
import { useEditor } from '~/contexts/EditorContext';

interface LivePreviewProps {
  templateId: string;
  previewUrl: string;
  editedData?: any; // 텍스트 데이터
  colorSystem?: ColorSystem; // 컬러 시스템
  styleTokens?: any; // 확장된 스타일 토큰
  previewSize: 'mobile' | 'desktop' | 'custom';
  customWidth?: number;
  className?: string;
}

export function LivePreview({ 
  templateId,
  previewUrl, 
  editedData, 
  colorSystem,
  styleTokens,
  previewSize, 
  customWidth = 1200,
  className = '' 
}: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [updateKey, setUpdateKey] = useState(0);
  const { editedDesign } = useEditor();
  
  // 프리뷰 너비 계산
  const getPreviewWidth = () => {
    switch (previewSize) {
      case 'mobile':
        return '375px';
      case 'desktop':
        return '1920px';
      case 'custom':
        return `${customWidth}px`;
      default:
        return '100%';
    }
  };

  // CSS 변수 문자열 생성
  const generateCSSVariables = () => {
    if (!colorSystem) return '';
    
    const cssVars: string[] = [];
    
    // 컬러 시스템을 CSS 변수로 변환
    const addVars = (obj: any, prefix: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          const varName = prefix ? `--color-${prefix}-${key}` : `--color-${key}`;
          cssVars.push(`${varName}: ${value}`);
        } else if (typeof value === 'object' && value !== null) {
          addVars(value, prefix ? `${prefix}-${key}` : key);
        }
      }
    };
    
    addVars(colorSystem);
    
    // 스타일 토큰 추가 (간격, 타이포그래피 등)
    if (styleTokens) {
      if (styleTokens.spacing) {
        Object.entries(styleTokens.spacing).forEach(([key, value]) => {
          cssVars.push(`--spacing-${key}: ${value}`);
        });
      }
      if (styleTokens.typography?.fontSize) {
        Object.entries(styleTokens.typography.fontSize).forEach(([key, value]) => {
          cssVars.push(`--font-size-${key}: ${value}`);
        });
      }
      // 추가 토큰들...
    }
    
    return cssVars.join('; ');
  };

  // iframe 로드 완료 처리
  const handleIframeLoad = () => {
    setIsLoaded(true);
    // 초기 데이터 전송
    sendAllUpdates();
  };

  // 모든 업데이트 전송
  const sendAllUpdates = () => {
    if (!iframeRef.current?.contentWindow || !isLoaded) return;

    const iframe = iframeRef.current;
    
    // 1. CSS 변수 업데이트
    const cssVariables = generateCSSVariables();
    if (cssVariables) {
      iframe.contentWindow.postMessage({
        type: 'style-update',
        cssVariables: cssVariables
      }, '*');
    }

    // 2. 텍스트 콘텐츠 업데이트
    if (editedData) {
      Object.entries(editedData).forEach(([section, items]) => {
        Object.entries(items as any).forEach(([key, item]: [string, any]) => {
          if (item.location) {
            const content = item.applied || item.korean || "";
            if (content) {
              iframe.contentWindow.postMessage({
                type: 'content-update',
                selector: item.location,
                content: content
              }, '*');
            }
          }
        });
      });
    }
  };

  // 데이터 변경 감지 및 업데이트
  useEffect(() => {
    if (isLoaded) {
      // 디바운싱을 위한 타이머
      const timer = setTimeout(() => {
        sendAllUpdates();
      }, 200); // 200ms 디바운싱

      return () => clearTimeout(timer);
    }
  }, [editedData, colorSystem, styleTokens, isLoaded]);

  // 프리뷰 크기 변경 시 강제 새로고침
  useEffect(() => {
    setUpdateKey(prev => prev + 1);
  }, [previewSize, customWidth]);

  // EditorContext에서 보낸 메시지 수신 및 전달
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!iframeRef.current?.contentWindow || !isLoaded) return;
      
      // UPDATE_COLOR, UPDATE_TYPOGRAPHY 등의 메시지를 iframe으로 전달
      if (event.data.type === 'UPDATE_COLOR' || 
          event.data.type === 'UPDATE_TYPOGRAPHY' ||
          event.data.type === 'INIT_PREVIEW' ||
          event.data.type === 'UPDATE_CONTENT' ||
          event.data.type === 'HIGHLIGHT_ELEMENT') {
        iframeRef.current.contentWindow.postMessage(event.data, '*');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isLoaded]);

  return (
    <div className={`relative bg-gray-100 ${className}`}>
      {/* 로딩 인디케이터 */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="text-gray-500">미리보기 로딩 중...</div>
        </div>
      )}
      
      {/* iframe 미리보기 */}
      <iframe
        key={updateKey}
        ref={iframeRef}
        src={previewUrl}
        onLoad={handleIframeLoad}
        className="transition-all duration-300"
        style={{
          width: getPreviewWidth(),
          maxWidth: '100%',
          height: '100%',
          minHeight: '600px',
          border: '1px solid #e5e7eb',
          backgroundColor: 'white',
          margin: '0 auto',
          display: 'block'
        }}
        title="Template Preview"
      />
      
      {/* 프리뷰 정보 표시 */}
      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
        {previewSize === 'mobile' && '375px'}
        {previewSize === 'desktop' && '1920px'}
        {previewSize === 'custom' && `${customWidth}px`}
      </div>
    </div>
  );
}

// 프리뷰 메시지 핸들러 (템플릿 HTML에 삽입될 스크립트)
export const previewMessageHandler = `
<script>
  // LivePreview 메시지 수신 및 처리
  window.addEventListener('message', function(event) {
    // 스타일 업데이트 처리
    if (event.data.type === 'style-update' && event.data.cssVariables) {
      // CSS 변수를 :root에 적용
      const root = document.documentElement;
      const vars = event.data.cssVariables.split('; ');
      vars.forEach(varDeclaration => {
        const [name, value] = varDeclaration.split(': ');
        if (name && value) {
          root.style.setProperty(name, value);
        }
      });
    }
    
    // 콘텐츠 업데이트 처리
    if (event.data.type === 'content-update') {
      const elements = document.querySelectorAll(event.data.selector);
      elements.forEach(element => {
        if (element) {
          element.textContent = event.data.content;
        }
      });
    }
    
    // 컴포넌트 스타일 직접 업데이트 (드래그앤드롭 적용)
    if (event.data.type === 'component-style-update') {
      const elements = document.querySelectorAll(event.data.selector);
      elements.forEach(element => {
        if (element && event.data.property && event.data.value) {
          element.style[event.data.property] = event.data.value;
        }
      });
    }
    
    // 컴포넌트 하이라이트 (드래그 오버 시각적 피드백)
    if (event.data.type === 'highlight-component') {
      const elements = document.querySelectorAll(event.data.selector);
      elements.forEach(element => {
        if (element) {
          if (event.data.highlight) {
            element.classList.add('preview-highlight');
            element.style.outline = '2px dashed #3B82F6';
            element.style.outlineOffset = '2px';
            element.style.transition = 'all 0.2s ease';
          } else {
            element.classList.remove('preview-highlight');
            element.style.outline = '';
            element.style.outlineOffset = '';
          }
        }
      });
    }
  });
  
  // 초기 로드 완료 신호
  window.parent.postMessage({ type: 'preview-ready' }, '*');
</script>
`;