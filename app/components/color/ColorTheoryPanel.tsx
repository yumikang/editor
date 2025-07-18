// 컬러 이론 패널 컴포넌트 - Phase 3
import { useState, useEffect } from 'react';
import { ColorTheory, type ColorPalette } from '~/utils/color-theory';

interface ColorTheoryPanelProps {
  primaryColor: string;
  onColorSelect?: (color: string) => void;
}

export function ColorTheoryPanel({ primaryColor, onColorSelect }: ColorTheoryPanelProps) {
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [contrastCheck, setContrastCheck] = useState<any>(null);

  useEffect(() => {
    // 4가지 팔레트 생성
    const newPalettes = [
      ColorTheory.generateComplementary(primaryColor),
      ColorTheory.generateAnalogous(primaryColor),
      ColorTheory.generateTriadic(primaryColor),
      ColorTheory.generateMonochromatic(primaryColor)
    ];
    setPalettes(newPalettes);

    // 접근성 체크 (흰색/검은색 배경)
    const whiteContrast = ColorTheory.checkWCAGCompliance(primaryColor, '#FFFFFF');
    const blackContrast = ColorTheory.checkWCAGCompliance(primaryColor, '#000000');
    setContrastCheck({ white: whiteContrast, black: blackContrast });
  }, [primaryColor]);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">컬러 팔레트 제안</h4>
        
        {/* 팔레트 목록 */}
        <div className="space-y-4">
          {palettes.map((palette, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-medium text-gray-900">{palette.name}</h5>
                <span className="text-xs text-gray-500">{palette.colors.length}색</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{palette.description}</p>
              
              {/* 색상 칩 */}
              <div className="flex gap-1">
                {palette.colors.map((color, colorIndex) => (
                  <button
                    key={colorIndex}
                    onClick={() => onColorSelect?.(color)}
                    className="relative group flex-1 h-12 rounded transition-transform hover:scale-105"
                    style={{ backgroundColor: color }}
                    title={color}
                  >
                    {/* 호버 시 색상 코드 표시 */}
                    <span className="absolute inset-x-0 -bottom-6 text-xs text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1 py-0.5 rounded shadow-sm">
                      {color}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 접근성 정보 */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">접근성 검사</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">흰색 배경 대비율</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{contrastCheck?.white.ratio}:1</span>
              {contrastCheck?.white.AA && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                  WCAG AA
                </span>
              )}
              {contrastCheck?.white.AAA && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                  AAA
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">검은색 배경 대비율</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{contrastCheck?.black.ratio}:1</span>
              {contrastCheck?.black.AA && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                  WCAG AA
                </span>
              )}
              {contrastCheck?.black.AAA && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                  AAA
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 색상 이론 정보 */}
      <div className="border-t pt-4 text-xs text-gray-500">
        <p className="mb-1">💡 팁: 생성된 색상을 클릭하여 적용할 수 있습니다.</p>
        <p>🎨 Primary 색상을 기반으로 조화로운 팔레트가 자동 생성됩니다.</p>
      </div>
    </div>
  );
}