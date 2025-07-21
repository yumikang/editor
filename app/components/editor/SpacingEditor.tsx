import { useState, useEffect } from "react";
import type { SpacingInfo } from "~/types/editor-types";
import { useEditor } from "~/contexts/EditorContext";

interface SpacingEditorProps {
  spacing: SpacingInfo[];
  onSpacingChange?: (original: SpacingInfo, newValue: string) => void;
  selectedSpacing?: string;
}

export function SpacingEditor({ spacing, onSpacingChange, selectedSpacing }: SpacingEditorProps) {
  const { updateSpacing } = useEditor();
  const [expandedType, setExpandedType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // 간격 변경 핸들러
  const handleSpacingChange = (original: SpacingInfo, newValue: string) => {
    if (onSpacingChange) {
      onSpacingChange(original, newValue);
    } else {
      updateSpacing(original, newValue);
    }
  };
  
  // TODO: 구현 필요
  // 1. 타입별 그룹화 (margin, padding, gap)
  // 2. 검색 및 필터링
  // 3. 시각적 간격 표시
  // 4. 값 편집 UI
  // 5. 단위 변환 도구
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            📐 간격 시스템
            <span className="text-sm text-gray-500">({spacing.length}개)</span>
          </h3>
        </div>
        
        {/* 검색 */}
        <input
          type="search"
          placeholder="간격 검색..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* 필터 탭 */}
      <div className="px-4 py-2 bg-white border-b border-gray-100">
        <div className="flex gap-1 overflow-x-auto">
          <FilterTab label="전체" active={expandedType === "all"} onClick={() => setExpandedType("all")} />
          <FilterTab label="여백" active={expandedType === "margin"} onClick={() => setExpandedType("margin")} />
          <FilterTab label="패딩" active={expandedType === "padding"} onClick={() => setExpandedType("padding")} />
          <FilterTab label="간격" active={expandedType === "gap"} onClick={() => setExpandedType("gap")} />
        </div>
      </div>
      
      {/* 간격 리스트 */}
      <div className="max-h-96 overflow-y-auto p-4">
        <div className="text-center text-gray-500">
          간격 편집 기능 구현 예정
        </div>
      </div>
    </div>
  );
}

function FilterTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
        active 
          ? "bg-blue-100 text-blue-700" 
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}