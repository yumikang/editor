import { useEffect, useState } from "react";
import type { PreviewMessage } from "~/types/editor-types";

interface ElementHighlighterProps {
  selectedElementId: string | null;
  hoveredElementId: string | null;
  onElementSelect?: (elementId: string) => void;
}

export function ElementHighlighter({ 
  selectedElementId, 
  hoveredElementId,
  onElementSelect 
}: ElementHighlighterProps) {
  const [syncEnabled, setSyncEnabled] = useState(true);
  
  // 요소 하이라이트 메시지 전송
  useEffect(() => {
    if (!syncEnabled) return;
    
    const elementId = hoveredElementId || selectedElementId;
    const message: PreviewMessage = {
      type: 'HIGHLIGHT_ELEMENT',
      elementId: elementId || '',
      highlight: !!elementId
    };
    
    window.postMessage(message, '*');
  }, [selectedElementId, hoveredElementId, syncEnabled]);
  
  // TODO: 구현 필요
  // 1. 하이라이트 동기화 토글
  // 2. 하이라이트 스타일 커스터마이징
  // 3. 요소 경로 표시 (breadcrumb)
  // 4. 요소 정보 툴팁
  // 5. 다중 요소 선택 지원
  
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 border-b">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="sync-highlight"
          checked={syncEnabled}
          onChange={(e) => setSyncEnabled(e.target.checked)}
          className="rounded border-gray-300"
        />
        <label htmlFor="sync-highlight" className="text-sm text-gray-700">
          요소 하이라이트 동기화
        </label>
      </div>
      
      {selectedElementId && (
        <div className="text-sm text-gray-600">
          선택된 요소: <code className="px-1 py-0.5 bg-gray-200 rounded">{selectedElementId}</code>
        </div>
      )}
    </div>
  );
}