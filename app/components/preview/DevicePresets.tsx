import { useState } from "react";
import { DEVICE_PRESETS, type DevicePreset } from "~/types/editor-types";

interface DevicePresetsProps {
  currentDevice: string;
  onDeviceChange: (device: string, preset: DevicePreset) => void;
  customWidth?: number;
  onCustomWidthChange?: (width: number) => void;
}

export function DevicePresets({ 
  currentDevice, 
  onDeviceChange, 
  customWidth = 1200,
  onCustomWidthChange 
}: DevicePresetsProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [tempCustomWidth, setTempCustomWidth] = useState(customWidth.toString());
  
  // TODO: 구현 필요
  // 1. 디바이스 프리셋 버튼 UI
  // 2. 커스텀 너비 입력
  // 3. 화면 회전 토글
  // 4. 줌 레벨 조정
  // 5. 디바이스 프레임 표시 옵션
  
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
      {/* 프리셋 버튼들 */}
      <div className="flex items-center gap-1">
        {Object.entries(DEVICE_PRESETS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => onDeviceChange(key, preset)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              currentDevice === key
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {preset.name === 'Mobile' && '📱'}
            {preset.name === 'Tablet' && '📱'}
            {preset.name === 'Desktop' && '💻'}
            {preset.name !== 'Mobile' && preset.name !== 'Tablet' && preset.name !== 'Desktop' && '📱'}
            <span className="ml-1">{preset.name}</span>
          </button>
        ))}
        
        {/* 커스텀 버튼 */}
        <button
          onClick={() => setShowCustomInput(!showCustomInput)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            currentDevice === 'custom'
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          ⚙️ 커스텀
        </button>
      </div>
      
      {/* 커스텀 너비 입력 */}
      {showCustomInput && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={tempCustomWidth}
            onChange={(e) => setTempCustomWidth(e.target.value)}
            onBlur={() => {
              const width = parseInt(tempCustomWidth);
              if (!isNaN(width) && width > 0) {
                onCustomWidthChange?.(width);
              }
            }}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
            placeholder="너비"
          />
          <span className="text-sm text-gray-500">px</span>
        </div>
      )}
    </div>
  );
}