// 기본 컬러 편집기 컴포넌트 - Phase 2.5
import { useState, useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import type { ColorSystem } from '~/types/color-system';

interface BasicColorEditorProps {
  templateId: string;
  onColorChange?: (colorSystem: ColorSystem) => void;
}

export function BasicColorEditor({ templateId, onColorChange }: BasicColorEditorProps) {
  const [colorSystem, setColorSystem] = useState<ColorSystem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetcher = useFetcher();

  // 초기 컬러 시스템 로드
  useEffect(() => {
    fetcher.load(`/api/style/tokens?templateId=${templateId}`);
  }, [templateId]);

  useEffect(() => {
    if (fetcher.data && fetcher.state === 'idle') {
      if ('colorSystem' in fetcher.data) {
        setColorSystem(fetcher.data.colorSystem);
        setIsLoading(false);
      }
    }
  }, [fetcher.data, fetcher.state]);

  // 컬러 변경 핸들러
  const handleColorChange = (category: keyof ColorSystem, key: string, value: string) => {
    if (!colorSystem) return;

    const updatedColorSystem = {
      ...colorSystem,
      [category]: {
        ...colorSystem[category],
        [key]: value,
      },
    };

    setColorSystem(updatedColorSystem);
    onColorChange?.(updatedColorSystem);

    // API로 업데이트 전송
    const formData = new FormData();
    formData.append('templateId', templateId);
    formData.append('operation', 'update');
    formData.append('colorSystem', JSON.stringify(updatedColorSystem));
    
    fetcher.submit(formData, {
      method: 'POST',
      action: '/api/style/tokens',
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        컬러 시스템 로딩 중...
      </div>
    );
  }

  if (!colorSystem) {
    return (
      <div className="p-4 text-center text-red-500">
        컬러 시스템을 로드할 수 없습니다.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">기본 컬러 편집</h3>
      
      {/* 브랜드 컬러 섹션 */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700">브랜드 컬러</h4>
        <div className="space-y-3">
          <ColorInput
            label="Primary"
            value={colorSystem.brand.primary}
            onChange={(value) => handleColorChange('brand', 'primary', value)}
          />
          {colorSystem.brand.secondary && (
            <ColorInput
              label="Secondary"
              value={colorSystem.brand.secondary}
              onChange={(value) => handleColorChange('brand', 'secondary', value)}
            />
          )}
        </div>
      </div>

      {/* 중성 컬러 섹션 */}
      {colorSystem.neutral && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">중성 컬러</h4>
          <div className="space-y-3">
            {Object.entries(colorSystem.neutral).map(([key, value]) => (
              <ColorInput
                key={key}
                label={formatLabel(key)}
                value={value}
                onChange={(newValue) => handleColorChange('neutral', key, newValue)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 저장 상태 표시 */}
      {fetcher.state === 'submitting' && (
        <div className="text-sm text-blue-600">저장 중...</div>
      )}
      {fetcher.state === 'idle' && fetcher.data?.success && (
        <div className="text-sm text-green-600">저장되었습니다!</div>
      )}
    </div>
  );
}

// 개별 컬러 입력 컴포넌트
interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="flex-1 text-sm text-gray-600">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

// 라벨 포매팅 헬퍼
function formatLabel(key: string): string {
  const labels: Record<string, string> = {
    textPrimary: '주요 텍스트',
    textSecondary: '보조 텍스트',
    background: '배경',
    surface: '표면',
    border: '테두리',
  };
  return labels[key] || key;
}