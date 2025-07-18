// 컬러 시스템 패널 (좌측) - Phase 3 Day 5
import { useState, useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import type { ColorSystem, ColorPreset } from '~/types/color-system';
import { ColorTheory } from '~/utils/color-theory';
import { ColorTheoryPanel } from './ColorTheoryPanel';
import { createColorSystemFromPrimary, generatePresetName } from '~/utils/color-presets';

interface ColorSystemPanelProps {
  templateId: string;
  colorSystem: ColorSystem | null;
  onColorSystemChange: (colorSystem: ColorSystem) => void;
}

export function ColorSystemPanel({ 
  templateId, 
  colorSystem, 
  onColorSystemChange 
}: ColorSystemPanelProps) {
  const [presets, setPresets] = useState<ColorPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showPaletteGenerator, setShowPaletteGenerator] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  const fetcher = useFetcher();

  // 프리셋 목록 로드
  useEffect(() => {
    fetcher.load('/api/color/presets');
  }, []);

  useEffect(() => {
    if (fetcher.data?.presets) {
      setPresets(fetcher.data.presets);
    }
    
    // 에러 처리
    if (fetcher.data?.error) {
      setError(fetcher.data.error);
      setTimeout(() => setError(''), 5000);
    }
    
    // 성공 메시지 처리
    if (fetcher.data?.success && fetcher.data?.message) {
      setSuccessMessage(fetcher.data.message);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // 프리셋 목록 재로드
      if (fetcher.data.message.includes('deleted') || fetcher.data.message.includes('created')) {
        fetcher.load('/api/color/presets');
      }
    }
  }, [fetcher.data]);

  // 프리셋 선택 핸들러
  const handlePresetSelect = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setSelectedPresetId(presetId);
      onColorSystemChange(preset.colors);
    }
  };

  // 프리셋 저장 핸들러
  const handleSavePreset = () => {
    if (!colorSystem || !presetName.trim()) {
      setError('프리셋 이름을 입력해주세요.');
      return;
    }

    const newPreset: Partial<ColorPreset> = {
      name: presetName,
      colors: colorSystem
    };

    const formData = new FormData();
    formData.append('operation', 'create');
    formData.append('preset', JSON.stringify(newPreset));

    fetcher.submit(formData, {
      method: 'POST',
      action: '/api/color/presets'
    });

    setShowSaveDialog(false);
    setPresetName('');
  };

  // HEX 색상 검증
  const isValidHexColor = (color: string): boolean => {
    return /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(color);
  };

  // 개별 컬러 변경 핸들러
  const handleColorChange = (
    category: keyof ColorSystem,
    key: string,
    value: string
  ) => {
    if (!colorSystem) return;

    // 색상 검증
    if (!isValidHexColor(value)) {
      // 임시값이 아닌 경우만 검증 (사용자가 입력 중일 수 있음)
      if (value.length === 7 || value.length === 9) {
        return;
      }
    }

    const updatedColorSystem = {
      ...colorSystem,
      [category]: {
        ...colorSystem[category],
        [key]: value
      }
    };

    // 상호작용 색상 자동 업데이트
    if (category === 'brand' && key === 'primary') {
      updatedColorSystem.interaction = ColorTheory.generateInteractionColors(value);
    }

    onColorSystemChange(updatedColorSystem);
  };

  // 프리셋 삭제 핸들러
  const handleDeletePreset = (presetId: string) => {
    if (!confirm('이 프리셋을 삭제하시겠습니까?')) return;

    const formData = new FormData();
    formData.append('operation', 'delete');
    formData.append('id', presetId);

    fetcher.submit(formData, {
      method: 'POST',
      action: '/api/color/presets'
    });

    // 선택된 프리셋이 삭제되면 선택 해제
    if (selectedPresetId === presetId) {
      setSelectedPresetId('');
    }
  };

  // 드래그 시작 핸들러
  const handleDragStart = (e: React.DragEvent, tokenPath: string, color: string) => {
    e.dataTransfer.setData('tokenPath', tokenPath);
    e.dataTransfer.setData('color', color);
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (!colorSystem) {
    return (
      <div className="p-4 text-center text-gray-500">
        컬러 시스템을 로드하는 중...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">컬러 시스템</h3>
      </div>

      {/* 스크롤 가능한 컨텐츠 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* 알림 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {successMessage}
            </div>
          )}
          {/* 프리셋 선택 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">프리셋</label>
              <button
                onClick={() => setShowSaveDialog(true)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                현재 설정 저장
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedPresetId}
                onChange={(e) => handlePresetSelect(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">프리셋 선택...</option>
                {presets.map(preset => {
                  const isDefault = preset.id.startsWith('modern-') || 
                                   preset.id.startsWith('warm-') || 
                                   preset.id.startsWith('forest-') || 
                                   preset.id.startsWith('minimal-');
                  return (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} {isDefault && '(기본)'}
                    </option>
                  );
                })}
              </select>
              {selectedPresetId && !['modern-blue', 'warm-sunset', 'forest-green', 'minimal-gray'].includes(selectedPresetId) && (
                <button
                  onClick={() => handleDeletePreset(selectedPresetId)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 border border-red-300 rounded-md"
                  title="프리셋 삭제"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>

          {/* 브랜드 컬러 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">브랜드 컬러</h4>
            <div className="space-y-3">
              <ColorInput
                label="Primary"
                value={colorSystem.brand.primary}
                onChange={(value) => handleColorChange('brand', 'primary', value)}
                onDragStart={(e) => handleDragStart(e, 'brand.primary', colorSystem.brand.primary)}
                draggable
              />
              <ColorInput
                label="Secondary"
                value={colorSystem.brand.secondary || ''}
                onChange={(value) => handleColorChange('brand', 'secondary', value)}
                onDragStart={(e) => handleDragStart(e, 'brand.secondary', colorSystem.brand.secondary || '')}
                draggable
              />
            </div>
            
            {/* 팔레트 생성기 토글 */}
            <button
              onClick={() => setShowPaletteGenerator(!showPaletteGenerator)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              {showPaletteGenerator ? '팔레트 제안 닫기' : '팔레트 제안 보기'}
            </button>
          </div>

          {/* 팔레트 생성기 */}
          {showPaletteGenerator && (
            <ColorTheoryPanel
              primaryColor={colorSystem.brand.primary}
              onColorSelect={(color) => {
                // Secondary로 적용하거나 새로운 프리셋 생성
                const newSystem = createColorSystemFromPrimary(color);
                onColorSystemChange(newSystem);
              }}
            />
          )}

          {/* 시맨틱 컬러 */}
          {colorSystem.semantic && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">기능 컬러</h4>
              <div className="space-y-3">
                {Object.entries(colorSystem.semantic).map(([key, value]) => (
                  <ColorInput
                    key={key}
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    value={value}
                    onChange={(newValue) => handleColorChange('semantic', key, newValue)}
                    onDragStart={(e) => handleDragStart(e, `semantic.${key}`, value)}
                    draggable
                    readOnly
                  />
                ))}
              </div>
            </div>
          )}

          {/* 중성 컬러 */}
          {colorSystem.neutral && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">중성 컬러</h4>
              <div className="space-y-3">
                {Object.entries(colorSystem.neutral).map(([key, value]) => (
                  <ColorInput
                    key={key}
                    label={formatLabel(key)}
                    value={value}
                    onChange={(newValue) => handleColorChange('neutral', key, newValue)}
                    onDragStart={(e) => handleDragStart(e, `neutral.${key}`, value)}
                    draggable
                  />
                ))}
              </div>
            </div>
          )}

          {/* 상호작용 컬러 */}
          {colorSystem.interaction && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">상호작용 컬러</h4>
              <div className="space-y-3">
                {Object.entries(colorSystem.interaction).map(([key, value]) => (
                  <ColorInput
                    key={key}
                    label={formatLabel(key)}
                    value={value}
                    onChange={(newValue) => handleColorChange('interaction', key, newValue)}
                    onDragStart={(e) => handleDragStart(e, `interaction.${key}`, value)}
                    draggable
                    readOnly
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 프리셋 저장 다이얼로그 */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">프리셋 저장</h3>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="프리셋 이름 입력..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setPresetName('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                취소
              </button>
              <button
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 개별 컬러 입력 컴포넌트
interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onDragStart?: (e: React.DragEvent) => void;
  draggable?: boolean;
  readOnly?: boolean;
}

function ColorInput({ 
  label, 
  value, 
  onChange, 
  onDragStart,
  draggable = false,
  readOnly = false 
}: ColorInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const [showError, setShowError] = useState(false);
  
  useEffect(() => {
    setInputValue(value);
    setIsValid(/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(value));
  }, [value]);

  const handleTextChange = (newValue: string) => {
    setInputValue(newValue);
    setShowError(false);
    
    // 실시간 검증
    const valid = /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(newValue);
    setIsValid(valid);
    
    // 유효한 경우에만 onChange 호출
    if (valid) {
      onChange(newValue);
    }
  };
  
  const handleBlur = () => {
    // 포커스를 잃을 때 유효성 검사
    if (!isValid && inputValue.length > 0) {
      setShowError(true);
    }
  };

  return (
    <div className="relative">
      <div 
        className={`flex items-center gap-3 p-2 rounded-lg ${
          draggable ? 'cursor-move hover:bg-gray-50' : ''
        }`}
        draggable={draggable}
        onDragStart={onDragStart}
      >
        <div className="flex-1">
          <label className="text-sm text-gray-600">{label}</label>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-10 h-10 rounded border shadow-sm ${
              showError ? 'border-red-500' : 'border-gray-300'
            }`}
            style={{ backgroundColor: isValid ? value : '#ffffff' }}
          />
          {!readOnly ? (
            <>
              <input
                type="color"
                value={isValid ? value : '#ffffff'}
                onChange={(e) => onChange(e.target.value)}
                className="w-10 h-10 opacity-0 absolute cursor-pointer"
                disabled={!isValid}
              />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleTextChange(e.target.value)}
                onBlur={handleBlur}
                className={`w-24 px-2 py-1 text-sm border rounded ${
                  showError 
                    ? 'border-red-500 focus:border-red-600' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="#000000"
              />
            </>
          ) : (
            <span className="w-24 px-2 py-1 text-sm text-gray-500">{value}</span>
          )}
        </div>
      </div>
      {showError && (
        <div className="text-xs text-red-600 mt-1 ml-2">
          올바른 HEX 색상을 입력해주세요 (예: #3B82F6)
        </div>
      )}
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
    hover: '호버',
    active: '활성',
    focus: '포커스',
    disabled: '비활성'
  };
  return labels[key] || key;
}