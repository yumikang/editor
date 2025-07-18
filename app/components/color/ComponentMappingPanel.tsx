// 컴포넌트 매핑 패널 (우측) - Phase 3 Day 6
import { useState, useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import type { ColorSystem } from '~/types/color-system';

interface ComponentMappingPanelProps {
  templateId: string;
  colorSystem: ColorSystem | null;
  onMappingChange?: (componentId: string, tokenPath: string) => void;
}

interface TemplateComponent {
  id: string;
  selector: string;
  name: string;
  type: 'text' | 'background' | 'border' | 'button' | 'card' | 'header';
  currentColor?: string;
  appliedToken?: string;
}

interface ComponentGroup {
  name: string;
  components: TemplateComponent[];
}

export function ComponentMappingPanel({ 
  templateId, 
  colorSystem,
  onMappingChange 
}: ComponentMappingPanelProps) {
  const [componentGroups, setComponentGroups] = useState<ComponentGroup[]>([]);
  const [dragOverComponent, setDragOverComponent] = useState<string>('');
  const [previewComponent, setPreviewComponent] = useState<string>('');
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [hoveredComponent, setHoveredComponent] = useState<string>('');
  
  const fetcher = useFetcher();

  // 템플릿 컴포넌트 로드
  useEffect(() => {
    // 실제로는 API에서 로드하겠지만, 현재는 하드코딩
    const mockComponents: ComponentGroup[] = [
      {
        name: '텍스트',
        components: [
          { id: 'heading-1', selector: 'h1', name: '제목 1', type: 'text', currentColor: '#111827' },
          { id: 'heading-2', selector: 'h2', name: '제목 2', type: 'text', currentColor: '#111827' },
          { id: 'paragraph', selector: 'p', name: '본문 텍스트', type: 'text', currentColor: '#6B7280' },
          { id: 'link', selector: 'a', name: '링크', type: 'text', currentColor: '#3B82F6' },
        ]
      },
      {
        name: '배경',
        components: [
          { id: 'body-bg', selector: 'body', name: '페이지 배경', type: 'background', currentColor: '#FFFFFF' },
          { id: 'card-bg', selector: '.card', name: '카드 배경', type: 'background', currentColor: '#F9FAFB' },
          { id: 'header-bg', selector: '.header', name: '헤더 배경', type: 'background', currentColor: '#111827' },
        ]
      },
      {
        name: '버튼',
        components: [
          { id: 'btn-primary', selector: '.btn-primary', name: 'Primary 버튼', type: 'button', currentColor: '#3B82F6' },
          { id: 'btn-secondary', selector: '.btn-secondary', name: 'Secondary 버튼', type: 'button', currentColor: '#8B5CF6' },
          { id: 'btn-danger', selector: '.btn-danger', name: 'Danger 버튼', type: 'button', currentColor: '#EF4444' },
        ]
      },
      {
        name: '테두리',
        components: [
          { id: 'card-border', selector: '.card', name: '카드 테두리', type: 'border', currentColor: '#E5E7EB' },
          { id: 'input-border', selector: 'input', name: '입력 필드 테두리', type: 'border', currentColor: '#D1D5DB' },
          { id: 'divider', selector: '.divider', name: '구분선', type: 'border', currentColor: '#E5E7EB' },
        ]
      }
    ];

    setComponentGroups(mockComponents);
  }, [templateId]);

  // 드래그 오버 핸들러
  const handleDragOver = (e: React.DragEvent, component: TemplateComponent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverComponent(component.id);
    
    // 미리보기에 하이라이트 전송
    sendHighlightMessage(component.selector, true);
  };

  // 드래그 리브 핸들러
  const handleDragLeave = (component: TemplateComponent) => {
    setDragOverComponent('');
    
    // 하이라이트 제거
    sendHighlightMessage(component.selector, false);
  };
  
  // 컴포넌트 호버 핸들러
  const handleComponentHover = (component: TemplateComponent | null) => {
    if (component) {
      setHoveredComponent(component.id);
      sendHighlightMessage(component.selector, true);
    } else {
      setHoveredComponent('');
      // 모든 하이라이트 제거
      const allSelectors = componentGroups.flatMap(g => g.components.map(c => c.selector));
      allSelectors.forEach(selector => sendHighlightMessage(selector, false));
    }
  };
  
  // 미리보기로 하이라이트 메시지 전송
  const sendHighlightMessage = (selector: string, highlight: boolean) => {
    const iframe = document.querySelector('iframe');
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'highlight-component',
        selector,
        highlight
      }, '*');
    }
  };

  // 드롭 핸들러
  const handleDrop = (e: React.DragEvent, component: TemplateComponent) => {
    e.preventDefault();
    
    const tokenPath = e.dataTransfer.getData('tokenPath');
    const color = e.dataTransfer.getData('color');
    
    if (!tokenPath || !color) return;

    // 매핑 업데이트
    const newMappings = {
      ...mappings,
      [component.id]: tokenPath
    };
    setMappings(newMappings);

    // 시각적 피드백
    setPreviewComponent(component.id);
    setTimeout(() => setPreviewComponent(''), 2000);

    // 즉시 미리보기 업데이트
    sendStyleUpdateMessage(component.selector, getPropertyByType(component.type), color);

    // 콜백 호출
    onMappingChange?.(component.id, tokenPath);

    // API 호출 (실제 스타일 업데이트)
    const formData = new FormData();
    formData.append('templateId', templateId);
    formData.append('componentId', component.id);
    formData.append('selector', component.selector);
    formData.append('tokenPath', tokenPath);
    formData.append('property', getPropertyByType(component.type));

    fetcher.submit(formData, {
      method: 'POST',
      action: '/api/style/component-mapping'
    });

    setDragOverComponent('');
    sendHighlightMessage(component.selector, false);
  };
  
  // 미리보기로 스타일 업데이트 메시지 전송
  const sendStyleUpdateMessage = (selector: string, property: string, value: string) => {
    const iframe = document.querySelector('iframe');
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'component-style-update',
        selector,
        property,
        value
      }, '*');
    }
  };

  // 컴포넌트 타입에 따른 CSS 속성 결정
  const getPropertyByType = (type: string): string => {
    switch (type) {
      case 'text': return 'color';
      case 'background': return 'backgroundColor';
      case 'border': return 'borderColor';
      case 'button': return 'backgroundColor';
      default: return 'color';
    }
  };

  // 토큰 경로를 읽기 쉬운 이름으로 변환
  const formatTokenPath = (path: string): string => {
    const parts = path.split('.');
    const labels: Record<string, string> = {
      brand: '브랜드',
      semantic: '기능',
      neutral: '중성',
      interaction: '상호작용',
      primary: 'Primary',
      secondary: 'Secondary',
      textPrimary: '주요 텍스트',
      textSecondary: '보조 텍스트',
      background: '배경',
      surface: '표면',
      border: '테두리',
      success: '성공',
      warning: '경고',
      error: '오류',
      info: '정보',
      hover: '호버',
      active: '활성',
      focus: '포커스',
      disabled: '비활성'
    };
    
    return parts.map(part => labels[part] || part).join(' > ');
  };

  // 매핑 제거
  const handleRemoveMapping = (componentId: string) => {
    const newMappings = { ...mappings };
    delete newMappings[componentId];
    setMappings(newMappings);

    // API 호출
    const formData = new FormData();
    formData.append('templateId', templateId);
    formData.append('componentId', componentId);
    formData.append('operation', 'remove');

    fetcher.submit(formData, {
      method: 'POST',
      action: '/api/style/component-mapping'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">컴포넌트 매핑</h3>
        <p className="text-sm text-gray-600 mt-1">
          좌측 컬러를 드래그하여 컴포넌트에 적용하세요
        </p>
      </div>

      {/* 스크롤 가능한 컴포넌트 목록 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {componentGroups.map((group) => (
            <div key={group.name}>
              <h4 className="text-sm font-medium text-gray-700 mb-3">{group.name}</h4>
              <div className="space-y-2">
                {group.components.map((component) => {
                  const isActive = dragOverComponent === component.id;
                  const isPreview = previewComponent === component.id;
                  const hasMapping = !!mappings[component.id];
                  
                  return (
                    <div
                      key={component.id}
                      className={`
                        relative rounded-lg border-2 transition-all duration-200
                        ${isActive ? 'border-blue-400 bg-blue-50 scale-105' : 'border-gray-200'}
                        ${isPreview ? 'animate-pulse bg-green-50' : ''}
                        ${hasMapping ? 'bg-gray-50' : 'bg-white'}
                        ${hoveredComponent === component.id ? 'shadow-lg' : ''}
                      `}
                      onDragOver={(e) => handleDragOver(e, component)}
                      onDragLeave={() => handleDragLeave(component)}
                      onDrop={(e) => handleDrop(e, component)}
                      onMouseEnter={() => handleComponentHover(component)}
                      onMouseLeave={() => handleComponentHover(null)}
                    >
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* 현재 색상 미리보기 */}
                            <div
                              className="w-8 h-8 rounded border shadow-sm"
                              style={{ 
                                backgroundColor: component.type === 'text' || component.type === 'border' 
                                  ? 'white' 
                                  : component.currentColor,
                                borderColor: component.type === 'border' ? component.currentColor : '#e5e7eb',
                                color: component.type === 'text' ? component.currentColor : 'transparent'
                              }}
                            >
                              {component.type === 'text' && 'A'}
                            </div>
                            
                            <div>
                              <div className="font-medium text-sm">{component.name}</div>
                              <div className="text-xs text-gray-500">{component.selector}</div>
                            </div>
                          </div>

                          {/* 매핑된 토큰 표시 */}
                          {hasMapping && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                {formatTokenPath(mappings[component.id])}
                              </span>
                              <button
                                onClick={() => handleRemoveMapping(component.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                                title="매핑 제거"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 드래그 오버 시 힌트 */}
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm shadow-lg">
                              여기에 놓기
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 정보 */}
      <div className="p-4 border-t bg-gray-50">
        <div className="text-xs text-gray-600 space-y-1">
          <p>💡 드래그앤드롭으로 컬러 토큰을 적용할 수 있습니다</p>
          <p>🎨 적용된 토큰은 실시간으로 미리보기에 반영됩니다</p>
        </div>
      </div>
    </div>
  );
}