import { useState } from "react";
import type { ColorPreset, ColorInfo } from "~/types/editor-types";

interface ColorPresetsProps {
  currentColors: ColorInfo[];
  onApplyPreset: (preset: ColorPreset) => void;
  onSaveAsPreset?: (name: string, colors: ColorInfo[]) => void;
}

// 기본 색상 프리셋
const DEFAULT_PRESETS: ColorPreset[] = [
  {
    id: 'modern-blue',
    name: '모던 블루',
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B',
      neutral: { dark: '#1F2937', light: '#F3F4F6' }
    }
  },
  {
    id: 'elegant-purple',
    name: '엘레강트 퍼플',
    colors: {
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#14B8A6',
      neutral: { dark: '#111827', light: '#F9FAFB' }
    }
  },
  {
    id: 'warm-orange',
    name: '따뜻한 오렌지',
    colors: {
      primary: '#F97316',
      secondary: '#EF4444',
      accent: '#84CC16',
      neutral: { dark: '#292524', light: '#FEF3C7' }
    }
  }
];

export function ColorPresets({ currentColors, onApplyPreset, onSaveAsPreset }: ColorPresetsProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  
  // TODO: 구현 필요
  // 1. 프리셋 썸네일 표시
  // 2. 프리셋 적용 미리보기
  // 3. 커스텀 프리셋 저장
  // 4. 프리셋 가져오기/내보내기
  // 5. AI 기반 색상 조합 추천
  
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">색상 프리셋</h3>
        <button
          onClick={() => setShowSaveDialog(true)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          현재 색상 저장
        </button>
      </div>
      
      {/* 프리셋 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {DEFAULT_PRESETS.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            isSelected={selectedPreset === preset.id}
            onClick={() => {
              setSelectedPreset(preset.id);
              onApplyPreset(preset);
            }}
          />
        ))}
      </div>
      
      {/* 저장 다이얼로그 */}
      {showSaveDialog && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="프리셋 이름"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (presetName && onSaveAsPreset) {
                  onSaveAsPreset(presetName, currentColors);
                  setShowSaveDialog(false);
                  setPresetName("");
                }
              }}
              className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              저장
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setPresetName("");
              }}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PresetCard({ 
  preset, 
  isSelected, 
  onClick 
}: { 
  preset: ColorPreset; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border-2 transition-all ${
        isSelected 
          ? "border-blue-500 bg-blue-50" 
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="text-sm font-medium text-gray-900 mb-2">{preset.name}</div>
      <div className="flex gap-1">
        <div 
          className="w-8 h-8 rounded" 
          style={{ backgroundColor: preset.colors.primary }}
        />
        <div 
          className="w-8 h-8 rounded" 
          style={{ backgroundColor: preset.colors.secondary }}
        />
        {preset.colors.accent && (
          <div 
            className="w-8 h-8 rounded" 
            style={{ backgroundColor: preset.colors.accent }}
          />
        )}
      </div>
    </button>
  );
}