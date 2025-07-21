import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import type { EditedDesign, EditedContent } from "~/types/editor-types";

interface ExportPanelProps {
  templateId: string;
  editedContent?: EditedContent;
  editedDesign?: EditedDesign;
}

export function ExportPanel({ templateId, editedContent, editedDesign }: ExportPanelProps) {
  const [exportFormat, setExportFormat] = useState<'html' | 'css' | 'json' | 'zip'>('html');
  const [includeAssets, setIncludeAssets] = useState(true);
  const [minifyCode, setMinifyCode] = useState(false);
  const fetcher = useFetcher();
  
  const handleExport = () => {
    const formData = new FormData();
    formData.append('templateId', templateId);
    formData.append('format', exportFormat);
    formData.append('includeAssets', includeAssets.toString());
    formData.append('minifyCode', minifyCode.toString());
    
    if (editedContent) {
      formData.append('editedContent', JSON.stringify(editedContent));
    }
    if (editedDesign) {
      formData.append('editedDesign', JSON.stringify(editedDesign));
    }
    
    fetcher.submit(formData, {
      method: 'POST',
      action: '/api/export'
    });
  };
  
  // TODO: 구현 필요
  // 1. 내보내기 형식 선택
  // 2. 내보내기 옵션 설정
  // 3. 미리보기 기능
  // 4. 다운로드 진행률 표시
  // 5. 배포 연동 (Vercel, Netlify 등)
  
  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">내보내기</h3>
      
      {/* 형식 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          내보내기 형식
        </label>
        <div className="grid grid-cols-2 gap-2">
          <FormatOption
            value="html"
            label="HTML"
            description="편집된 HTML 파일"
            selected={exportFormat === 'html'}
            onChange={() => setExportFormat('html')}
          />
          <FormatOption
            value="css"
            label="CSS"
            description="커스텀 스타일시트"
            selected={exportFormat === 'css'}
            onChange={() => setExportFormat('css')}
          />
          <FormatOption
            value="json"
            label="JSON"
            description="편집 데이터"
            selected={exportFormat === 'json'}
            onChange={() => setExportFormat('json')}
          />
          <FormatOption
            value="zip"
            label="ZIP"
            description="전체 프로젝트"
            selected={exportFormat === 'zip'}
            onChange={() => setExportFormat('zip')}
          />
        </div>
      </div>
      
      {/* 옵션 */}
      <div className="space-y-3 mb-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeAssets}
            onChange={(e) => setIncludeAssets(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">이미지 및 폰트 포함</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={minifyCode}
            onChange={(e) => setMinifyCode(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">코드 압축 (minify)</span>
        </label>
      </div>
      
      {/* 내보내기 버튼 */}
      <button
        onClick={handleExport}
        disabled={fetcher.state !== 'idle'}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {fetcher.state === 'submitting' ? '내보내기 중...' : '내보내기'}
      </button>
      
      {/* 상태 메시지 */}
      {fetcher.data?.success && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
          내보내기가 완료되었습니다!
        </div>
      )}
    </div>
  );
}

function FormatOption({ 
  value, 
  label, 
  description, 
  selected, 
  onChange 
}: {
  value: string;
  label: string;
  description: string;
  selected: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className={`p-3 rounded-lg border-2 text-left transition-all ${
        selected 
          ? "border-blue-500 bg-blue-50" 
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="font-medium text-gray-900">{label}</div>
      <div className="text-xs text-gray-500">{description}</div>
    </button>
  );
}