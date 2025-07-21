import { useState, useEffect } from "react";
import type { TypographyInfo } from "~/utils/design-scanner.server";
import { useEditor } from "~/contexts/EditorContext";

interface TypographyPaletteProps {
  typography: TypographyInfo[];
  onTypographyChange?: (original: TypographyInfo, updates: Partial<TypographyInfo>) => void;
  selectedFont?: string;
}

export function TypographyPalette({ typography, onTypographyChange, selectedFont }: TypographyPaletteProps) {
  const { updateTypography } = useEditor();
  const [expandedElement, setExpandedElement] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 타이포그래피 변경 핸들러 - EditorContext의 updateTypography 사용
  const handleTypographyChange = (original: TypographyInfo, updates: Partial<TypographyInfo>) => {
    if (onTypographyChange) {
      onTypographyChange(original, updates);
    } else {
      updateTypography(original, updates);
    }
  };
  
  // 요소별로 타이포그래피 그룹화
  const groupedTypography = typography.reduce((acc, typo) => {
    typo.elements.forEach(element => {
      if (!acc[element]) acc[element] = [];
      acc[element].push(typo);
    });
    return acc;
  }, {} as Record<string, TypographyInfo[]>);
  
  // 검색 필터링
  const filteredTypography = expandedElement === "all" 
    ? typography 
    : groupedTypography[expandedElement] || [];
  
  const searchedTypography = filteredTypography.filter(typo => 
    searchTerm === "" || 
    typo.fontFamily.toLowerCase().includes(searchTerm.toLowerCase()) ||
    typo.selectors.some(selector => selector.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // 폰트 크기별 정렬
  const sortedTypography = [...searchedTypography].sort((a, b) => {
    const sizeA = parseFloat(a.fontSize);
    const sizeB = parseFloat(b.fontSize);
    return sizeB - sizeA; // 큰 크기부터
  });
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            ✏️ 타이포그래피
            <span className="text-sm text-gray-500">({searchedTypography.length}개)</span>
          </h3>
          <button className="text-xs text-gray-500 hover:text-gray-700">
            폰트 관리
          </button>
        </div>
        
        {/* 검색 */}
        <input
          type="search"
          placeholder="폰트 또는 선택자 검색..."
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
            count={typography.length}
            active={expandedElement === "all"}
            onClick={() => setExpandedElement("all")}
          />
          {Object.entries(groupedTypography).map(([element, typefaces]) => (
            <FilterTab
              key={element}
              label={getElementLabel(element)}
              count={typefaces.length}
              active={expandedElement === element}
              onClick={() => setExpandedElement(element)}
            />
          ))}
        </div>
      </div>
      
      {/* 타이포그래피 리스트 */}
      <div className="max-h-96 overflow-y-auto">
        {sortedTypography.map((typo, index) => (
          <TypographyItem
            key={`${typo.fontFamily}-${typo.fontSize}-${index}`}
            typography={typo}
            isEditing={editingId === `${typo.fontFamily}-${typo.fontSize}-${index}`}
            onEdit={(editing) => 
              setEditingId(editing ? `${typo.fontFamily}-${typo.fontSize}-${index}` : null)
            }
            onChange={handleTypographyChange}
          />
        ))}
      </div>
      
      {searchedTypography.length === 0 && (
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

function TypographyItem({ 
  typography, 
  isEditing, 
  onEdit,
  onChange 
}: {
  typography: TypographyInfo;
  isEditing: boolean;
  onEdit: (editing: boolean) => void;
  onChange: (original: TypographyInfo, updates: Partial<TypographyInfo>) => void;
}) {
  const [tempValues, setTempValues] = useState({
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize,
    fontWeight: typography.fontWeight,
    lineHeight: typography.lineHeight,
    letterSpacing: typography.letterSpacing
  });
  
  // 폰트 패밀리 목록 (실제로는 시스템 폰트나 Google Fonts API에서 가져올 수 있음)
  const fontFamilies = [
    "Arial, sans-serif",
    "Helvetica, sans-serif", 
    "Georgia, serif",
    "Times New Roman, serif",
    "Courier New, monospace",
    "Verdana, sans-serif",
    "Roboto, sans-serif",
    "Open Sans, sans-serif",
    "Lato, sans-serif",
    "Montserrat, sans-serif"
  ];
  
  const handleSave = () => {
    onChange(typography, tempValues);
    onEdit(false);
  };
  
  const handleCancel = () => {
    setTempValues({
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      lineHeight: typography.lineHeight,
      letterSpacing: typography.letterSpacing
    });
    onEdit(false);
  };
  
  return (
    <div className={`group border-b border-gray-100 last:border-b-0 p-4 hover:bg-gray-50 ${
      isEditing ? "bg-blue-50" : ""
    }`}>
      <div className="flex items-start gap-4">
        {/* 미리보기 */}
        <div className="flex-1 min-w-0">
          <div 
            className="mb-2 truncate"
            style={{
              fontFamily: tempValues.fontFamily,
              fontSize: tempValues.fontSize,
              fontWeight: tempValues.fontWeight,
              lineHeight: tempValues.lineHeight,
              letterSpacing: tempValues.letterSpacing
            }}
          >
            가나다라 ABC 123
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-mono">{typography.fontSize}</span>
            <span>•</span>
            <span>{typography.fontWeight}</span>
            <span>•</span>
            <span>사용: {typography.frequency}회</span>
          </div>
          
          {typography.elements.length > 0 && (
            <div className="flex gap-1 mt-1">
              {typography.elements.map(element => (
                <span 
                  key={element}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {element}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* 편집 버튼 */}
        <button
          onClick={() => onEdit(!isEditing)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>
      
      {/* 편집 폼 */}
      {isEditing && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* 폰트 패밀리 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                폰트 패밀리
              </label>
              <select
                value={tempValues.fontFamily}
                onChange={(e) => setTempValues({ ...tempValues, fontFamily: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value={typography.fontFamily}>{typography.fontFamily}</option>
                {fontFamilies.map(font => (
                  <option key={font} value={font}>{font}</option>
                ))}
              </select>
            </div>
            
            {/* 폰트 크기 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                크기
              </label>
              <input
                type="text"
                value={tempValues.fontSize}
                onChange={(e) => setTempValues({ ...tempValues, fontSize: e.target.value })}
                className="w-full px-2 py-1 text-sm font-mono border border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="16px"
              />
            </div>
            
            {/* 폰트 굵기 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                굵기
              </label>
              <select
                value={tempValues.fontWeight}
                onChange={(e) => setTempValues({ ...tempValues, fontWeight: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
              >
                <option value="100">100 - Thin</option>
                <option value="200">200 - Extra Light</option>
                <option value="300">300 - Light</option>
                <option value="400">400 - Normal</option>
                <option value="500">500 - Medium</option>
                <option value="600">600 - Semi Bold</option>
                <option value="700">700 - Bold</option>
                <option value="800">800 - Extra Bold</option>
                <option value="900">900 - Black</option>
              </select>
            </div>
            
            {/* 줄 높이 */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                줄 높이
              </label>
              <input
                type="text"
                value={tempValues.lineHeight}
                onChange={(e) => setTempValues({ ...tempValues, lineHeight: e.target.value })}
                className="w-full px-2 py-1 text-sm font-mono border border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="1.5"
              />
            </div>
            
            {/* 자간 */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                자간
              </label>
              <input
                type="text"
                value={tempValues.letterSpacing}
                onChange={(e) => setTempValues({ ...tempValues, letterSpacing: e.target.value })}
                className="w-full px-2 py-1 text-sm font-mono border border-gray-200 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="0px"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
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

function getElementLabel(element: string): string {
  const labels: Record<string, string> = {
    "h1": "제목 1",
    "h2": "제목 2", 
    "h3": "제목 3",
    "h4": "제목 4",
    "h5": "제목 5",
    "h6": "제목 6",
    "p": "본문",
    "span": "텍스트",
    "a": "링크",
    "button": "버튼",
    "label": "라벨",
    "li": "목록"
  };
  return labels[element] || element;
}