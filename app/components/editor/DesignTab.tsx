// 디자인 탭 - 3패널 레이아웃 - Phase 3 Day 5-6
import { useState, useEffect, useCallback } from 'react';
import { useFetcher } from '@remix-run/react';
import { ColorSystemPanel } from '~/components/color/ColorSystemPanel';
import { ComponentMappingPanel } from '~/components/color/ComponentMappingPanel';
import { LivePreview } from '~/components/preview/LivePreview';
import { ColorTokenManager } from '~/utils/color-token-manager';
import type { ColorSystem } from '~/types/color-system';
import type { StyleTokenSystem } from '~/types/style-tokens';
import { debounce } from 'lodash';

interface DesignTabProps {
  templateId: string;
  editedData: any; // 텍스트 데이터
  initialColorSystem?: ColorSystem | null;
  initialStyleTokens?: StyleTokenSystem | null;
}

export function DesignTab({ 
  templateId, 
  editedData,
  initialColorSystem,
  initialStyleTokens
}: DesignTabProps) {
  const [colorSystem, setColorSystem] = useState<ColorSystem | null>(initialColorSystem || null);
  const [styleTokens, setStyleTokens] = useState<StyleTokenSystem | null>(initialStyleTokens || null);
  const [previewSize, setPreviewSize] = useState<'mobile' | 'desktop'>('desktop');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [componentMappings, setComponentMappings] = useState<Record<string, any>>({});
  
  const colorFetcher = useFetcher();
  const styleFetcher = useFetcher();
  const versionFetcher = useFetcher();
  
  // ColorTokenManager 인스턴스
  const [tokenManager] = useState(() => new ColorTokenManager(colorSystem));

  // 초기 데이터 로드
  useEffect(() => {
    if (!colorSystem) {
      colorFetcher.load(`/api/style/tokens?templateId=${templateId}`);
    }
    if (!styleTokens) {
      styleFetcher.load(`/api/style/tokens/style?templateId=${templateId}`);
    }
  }, [templateId]);

  // 데이터 로드 완료 처리
  useEffect(() => {
    if (colorFetcher.data?.colorSystem) {
      setColorSystem(colorFetcher.data.colorSystem);
    }
  }, [colorFetcher.data]);

  useEffect(() => {
    if (styleFetcher.data?.styleTokens) {
      setStyleTokens(styleFetcher.data.styleTokens);
    }
  }, [styleFetcher.data]);

  // 디바운싱된 저장 함수 (200ms)
  const debouncedSave = useCallback(
    debounce((newColorSystem: ColorSystem, newMappings?: Record<string, any>) => {
      setIsSaving(true);
      
      const formData = new FormData();
      formData.append('templateId', templateId);
      formData.append('operation', 'update');
      formData.append('colorSystem', JSON.stringify(newColorSystem));

      colorFetcher.submit(formData, {
        method: 'POST',
        action: '/api/style/tokens'
      });
      
      // 🆕 버전 관리 시스템에 isDirty 상태 업데이트
      const versionFormData = new FormData();
      versionFormData.append('templateId', templateId);
      versionFormData.append('operation', 'markDirty');
      versionFormData.append('changeType', 'color');
      
      versionFetcher.submit(versionFormData, {
        method: 'POST',
        action: '/api/version/dirty-state'
      });
    }, 200),
    [templateId]
  );

  // 컬러 시스템 변경 핸들러
  const handleColorSystemChange = (newColorSystem: ColorSystem) => {
    // 입력 검증
    if (!validateColorSystem(newColorSystem)) {
      console.error('Invalid color system');
      return;
    }

    // 상태 업데이트
    setColorSystem(newColorSystem);
    setHasUnsavedChanges(true);
    
    // TokenManager 업데이트
    tokenManager.updateColorSystem(newColorSystem);

    // 디바운싱된 저장
    debouncedSave(newColorSystem);
  };

  // 컬러 시스템 검증
  const validateColorSystem = (system: ColorSystem): boolean => {
    const hexRegex = /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/;
    
    // 브랜드 컬러 검증
    if (!hexRegex.test(system.brand.primary)) return false;
    if (system.brand.secondary && !hexRegex.test(system.brand.secondary)) return false;
    
    // 다른 컬러들도 검증
    const validateColors = (colors: Record<string, string> | undefined) => {
      if (!colors) return true;
      return Object.values(colors).every(color => hexRegex.test(color));
    };
    
    return validateColors(system.semantic as any) && 
           validateColors(system.neutral as any) && 
           validateColors(system.interaction as any);
  };

  // fetcher 상태 감지
  useEffect(() => {
    if (colorFetcher.state === 'idle' && colorFetcher.data) {
      setIsSaving(false);
      if (colorFetcher.data.success) {
        setHasUnsavedChanges(false);
        setLastSaveTime(new Date());
      }
    }
  }, [colorFetcher.state, colorFetcher.data]);

  return (
    <div className="h-full flex">
      {/* 좌측 패널: 컬러 시스템 (300px) */}
      <div className="w-[300px] border-r bg-white">
        <ColorSystemPanel
          templateId={templateId}
          colorSystem={colorSystem}
          onColorSystemChange={handleColorSystemChange}
        />
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

                {/* 상태 표시 */}
                <div className="flex items-center gap-2 text-sm">
                  {isSaving && (
                    <span className="text-blue-600">저장 중...</span>
                  )}
                  {!isSaving && hasUnsavedChanges && (
                    <span className="text-orange-500">저장되지 않은 변경사항</span>
                  )}
                  {!isSaving && !hasUnsavedChanges && lastSaveTime && (
                    <span className="text-green-600">
                      저장됨 ({new Date(lastSaveTime).toLocaleTimeString()})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 미리보기 영역 */}
          <div className="flex-1 p-4">
            <LivePreview
              templateId={templateId}
              previewUrl={`/api/template-preview/${templateId}`}
              editedData={editedData}
              colorSystem={colorSystem}
              styleTokens={styleTokens}
              previewSize={previewSize}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* 우측 패널: 컴포넌트 매핑 (350px) */}
      <div className="w-[350px] border-l bg-white">
        <ComponentMappingPanel
          templateId={templateId}
          colorSystem={colorSystem}
          onMappingChange={(componentId, tokenPath) => {
            console.log(`Mapped ${componentId} to ${tokenPath}`);
            
            // 🆕 매핑 상태 업데이트
            const newMappings = {
              ...componentMappings,
              [componentId]: tokenPath
            };
            setComponentMappings(newMappings);
            setHasUnsavedChanges(true);
            
            // 🆕 버전 관리 시스템에 알림
            const formData = new FormData();
            formData.append('templateId', templateId);
            formData.append('operation', 'markDirty');
            formData.append('changeType', 'mapping');
            
            versionFetcher.submit(formData, {
              method: 'POST',
              action: '/api/version/dirty-state'
            });
          }}
        />
      </div>
    </div>
  );
}