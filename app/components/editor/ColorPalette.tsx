import { useState, useRef, useEffect } from "react";
import type { ColorInfo } from "~/utils/design-scanner.server";

interface ColorPaletteProps {
  colors: ColorInfo[];
  onColorChange: (originalColor: string, newColor: string, usage: string) => void;
  selectedColor?: string;
}

export function ColorPalette({ colors, onColorChange, selectedColor }: ColorPaletteProps) {
  const [expandedUsage, setExpandedUsage] = useState<string>("all");
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // 용도별로 색상 그룹화
  const groupedColors = colors.reduce((acc, color) => {
    if (!acc[color.usage]) acc[color.usage] = [];
    acc[color.usage].push(color);
    return acc;
  }, {} as Record<string, ColorInfo[]>);
  
  // 검색 필터링
  const filteredColors = expandedUsage === "all" 
    ? colors 
    : groupedColors[expandedUsage] || [];
  
  const searchedColors = filteredColors.filter(color => 
    searchTerm === "" || 
    color.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    color.selectors.some(selector => selector.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // 색상계열별 분류
  const colorsByHue = searchedColors.reduce((acc, color) => {
    const hueRange = Math.floor(color.hue / 60) * 60; // 60도씩 그룹화
    const hueLabel = getHueLabel(hueRange);
    if (!acc[hueLabel]) acc[hueLabel] = [];
    acc[hueLabel].push(color);
    return acc;
  }, {} as Record<string, ColorInfo[]>);
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            🎨 색상 팔레트
            <span className="text-sm text-gray-500">({searchedColors.length}개)</span>
          </h3>
          <button className="text-xs text-gray-500 hover:text-gray-700">
            전체 내보내기
          </button>
        </div>
        
        {/* 검색 */}
        <input
          type="search"
          placeholder="색상 검색..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* 필터 탭 */}
      <div className="px-4 py-2 bg-white border-b border-gray-100">
        <div className="flex gap-1 overflow-x-auto">
          <FilterTab 
            label="전체" 
            count={colors.length}
            active={expandedUsage === "all"}
            onClick={() => setExpandedUsage("all")}
          />
          {Object.entries(groupedColors).map(([usage, usageColors]) => (
            <FilterTab
              key={usage}
              label={getUsageLabel(usage)}
              count={usageColors.length}
              active={expandedUsage === usage}
              onClick={() => setExpandedUsage(usage)}
            />
          ))}
        </div>
      </div>
      
      {/* 색상 리스트 */}
      <div className="max-h-96 overflow-y-auto">
        {Object.entries(colorsByHue).map(([hueLabel, hueColors]) => (
          <div key={hueLabel} className="border-b border-gray-100 last:border-b-0">
            <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-600">
              {hueLabel} ({hueColors.length}개)
            </div>
            <div className="p-4 grid grid-cols-1 gap-3">
              {hueColors.map((color, index) => (
                <ColorItem
                  key={`${color.normalizedHex}-${color.usage}-${index}`}
                  color={color}
                  isSelected={selectedColor === color.value}
                  onColorChange={onColorChange}
                  showPicker={showColorPicker === `${color.normalizedHex}-${color.usage}-${index}`}
                  onTogglePicker={(show) => 
                    setShowColorPicker(show ? `${color.normalizedHex}-${color.usage}-${index}` : null)
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {searchedColors.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <div className="text-4xl mb-2">🔍</div>
          <p>검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}

function FilterTab({ 
  label, 
  count, 
  active, 
  onClick 
}: { 
  label: string; 
  count: number; 
  active: boolean; 
  onClick: () => void; 
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
        active 
          ? "bg-blue-100 text-blue-700" 
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label} ({count})
    </button>
  );
}

function ColorItem({ 
  color, 
  isSelected, 
  onColorChange, 
  showPicker,
  onTogglePicker 
}: {
  color: ColorInfo;
  isSelected: boolean;
  onColorChange: (original: string, newColor: string, usage: string) => void;
  showPicker: boolean;
  onTogglePicker: (show: boolean) => void;
}) {
  const [tempColor, setTempColor] = useState(color.normalizedHex);
  const colorInputRef = useRef<HTMLInputElement>(null);
  
  const handleColorClick = () => {
    onTogglePicker(!showPicker);
  };
  
  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setTempColor(newColor);
    onColorChange(color.value, newColor, color.usage);
  };
  
  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(newColor)) {
      setTempColor(newColor);
      onColorChange(color.value, newColor, color.usage);
    }
  };
  
  return (
    <div className={`group border rounded-lg p-3 transition-all hover:shadow-md ${
      isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
    }`}>
      <div className="flex items-center gap-3">
        {/* 색상 미리보기 */}
        <div className="relative">
          <button
            onClick={handleColorClick}
            className="w-12 h-12 rounded-lg border-2 border-white shadow-md transition-transform hover:scale-105"
            style={{ backgroundColor: tempColor }}
            title={`클릭해서 색상 변경 (${color.frequency}번 사용됨)`}
          />
          {color.frequency > 1 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {color.frequency}
            </span>
          )}
        </div>
        
        {/* 색상 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-medium">{color.value}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              getUsageColor(color.usage)
            }`}>
              {getUsageLabel(color.usage)}
            </span>
          </div>
          
          <div className="text-xs text-gray-500">
            명도: {color.lightness}% • 채도: {color.saturation}%
          </div>
          
          {color.selectors.length > 0 && (
            <div className="text-xs text-gray-400 mt-1 truncate">
              사용: {color.selectors.slice(0, 2).join(", ")}
              {color.selectors.length > 2 && ` +${color.selectors.length - 2}개`}
            </div>
          )}
        </div>
        
        {/* 편집 버튼 */}
        <button
          onClick={handleColorClick}
          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-gray-600 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>
      
      {/* 색상 선택기 */}
      {showPicker && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <input
              ref={colorInputRef}
              type="color"
              value={tempColor}
              onChange={handleColorInputChange}
              className="w-8 h-8 rounded border-0 cursor-pointer"
            />
            <input
              type="text"
              value={tempColor}
              onChange={handleHexInputChange}
              className="flex-1 px-2 py-1 text-sm font-mono border border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
              placeholder="#000000"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => onTogglePicker(false)}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => {
                onColorChange(color.value, tempColor, color.usage);
                onTogglePicker(false);
              }}
              className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getUsageLabel(usage: string): string {
  const labels: Record<string, string> = {
    "text": "텍스트",
    "background": "배경",
    "border": "테두리",
    "other": "기타"
  };
  return labels[usage] || usage;
}

function getUsageColor(usage: string): string {
  const colors: Record<string, string> = {
    "text": "bg-green-100 text-green-700",
    "background": "bg-blue-100 text-blue-700", 
    "border": "bg-orange-100 text-orange-700",
    "other": "bg-gray-100 text-gray-700"
  };
  return colors[usage] || colors.other;
}

function getHueLabel(hue: number): string {
  const labels: Record<number, string> = {
    0: "빨강계열",
    60: "노랑계열",
    120: "초록계열",
    180: "청록계열",
    240: "파랑계열",
    300: "보라계열"
  };
  return labels[hue] || "무채색";
}