import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigation, Link, useSubmit, useFetcher } from "@remix-run/react";
import { useState, useEffect, useRef } from "react";
import * as path from "path";
import * as fs from "fs/promises";
import { getJsonStorage } from "~/utils/json-storage";
import { ThemeScanner } from "~/utils/theme-scanner";
import VersionControl from "~/components/version/VersionControl";
import { BasicColorEditor } from "~/components/color/BasicColorEditor";
import { DesignTab } from "~/components/editor/DesignTab";
import { LivePreview } from "~/components/preview/LivePreview";
import { ColorTokenManager } from "~/utils/color-token-manager";
import { StyleTokenManager } from "~/utils/style-token-manager";
import type { ColorSystem } from "~/types/color-system";
import type { StyleTokenSystem } from "~/types/style-tokens";

// JSON 파일 경로 설정
const ACTIVE_JSON_PATH = path.join(process.cwd(), "../website-texts-active.json");
const THEMES_PATH = path.join(process.cwd(), "../themes");
const DATA_PATH = path.join(process.cwd(), "app/data/themes");

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const theme = url.searchParams.get("theme") || "";
  const version = url.searchParams.get("version") || "";
  
  let textData = {};
  let analysisData = null;
  let availableThemes = [];
  let versions = [];
  
  try {
    // JSON 데이터 로드
    const storage = getJsonStorage(ACTIVE_JSON_PATH);
    
    // 버전 지정시 해당 버전 로드
    if (version) {
      const versionData = await storage.loadVersion(version);
      if (versionData) {
        textData = versionData;
      }
    } else {
      textData = await storage.read();
    }
    
    // 버전 목록 가져오기
    versions = await storage.getVersions();
    
    // 테마 스캐너
    const scanner = new ThemeScanner(THEMES_PATH, DATA_PATH);
    availableThemes = await scanner.scanThemes();
    
    // 선택된 테마의 분석 데이터 로드
    if (theme) {
      analysisData = await scanner.loadAnalysisData(theme);
    }
  } catch (error) {
    console.error("Error loading data:", error);
  }
  
  return json({ 
    textData: textData || {}, 
    theme,
    analysisData,
    availableThemes,
    versions,
    currentVersion: version
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("action") as string;
  
  // 초기화 액션 처리
  if (action === "reset") {
    const ORIGINAL_JSON_PATH = path.join(process.cwd(), "../website-texts-original.json");
    
    try {
      // 백업 생성
      const activeData = await fs.readFile(ACTIVE_JSON_PATH, 'utf-8');
      const backupPath = ACTIVE_JSON_PATH.replace('.json', `-backup-${Date.now()}.json`);
      await fs.writeFile(backupPath, activeData);
      
      // 원본 파일 복사
      const originalData = await fs.readFile(ORIGINAL_JSON_PATH, 'utf-8');
      await fs.writeFile(ACTIVE_JSON_PATH, originalData);
      
      return json({ success: true, message: "원본으로 초기화되었습니다." });
    } catch (error) {
      console.error("Reset error:", error);
      return json({ success: false, error: "초기화 실패" }, { status: 500 });
    }
  }
  
  // 버전 생성 액션 처리
  if (action === "createVersion") {
    const storage = getJsonStorage(ACTIVE_JSON_PATH);
    
    try {
      const currentData = await storage.read();
      const versionName = await storage.createVersion(currentData);
      return json({ success: true, message: "버전이 생성되었습니다.", versionName });
    } catch (error) {
      console.error("Version creation error:", error);
      return json({ success: false, error: "버전 생성 실패" }, { status: 500 });
    }
  }
  
  // 기존 업데이트 로직
  const section = formData.get("section") as string;
  const key = formData.get("key") as string;
  const field = formData.get("field") as string;
  const value = formData.get("value") as string;
  const location = formData.get("location") as string;
  const originalContent = formData.get("originalContent") as string;
  const type = formData.get("type") as string;
  
  const storage = getJsonStorage(ACTIVE_JSON_PATH);
  
  // 현재 데이터 읽기
  const currentData = await storage.read();
  const currentItem = currentData[section]?.[key] || {};
  
  // 필요한 모든 필드를 포함하여 업데이트
  const updateData: any = { [field]: value };
  
  // location이 있으면 항상 포함
  if (location || currentItem.location) {
    updateData.location = location || currentItem.location;
  }
  
  // originalContent가 있으면 항상 포함
  if (originalContent || currentItem.originalContent) {
    updateData.originalContent = originalContent || currentItem.originalContent;
  }
  
  // type이 있으면 항상 포함
  if (type || currentItem.type) {
    updateData.type = type || currentItem.type;
  }
  
  await storage.update(section, key, updateData);
  
  return json({ success: true });
}

export default function Editor() {
  const { textData, theme, analysisData, availableThemes, versions, currentVersion } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submit = useSubmit();
  
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [editedData, setEditedData] = useState<any>({});
  const [iframeKey, setIframeKey] = useState(0);
  const [previewSize, setPreviewSize] = useState<'desktop' | 'tablet' | 'mobile' | 'custom'>('desktop');
  const [customWidth, setCustomWidth] = useState(1200);
  const [autoPreview, setAutoPreview] = useState(true);  // 자동저장 -> 자동 미리보기로 변경
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({});
  const [sidebarTab, setSidebarTab] = useState<'sections' | 'versions' | 'colors'>('sections');
  const [colorSystem, setColorSystem] = useState<ColorSystem | null>(null);
  const [styleTokens, setStyleTokens] = useState<StyleTokenSystem | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  
  // 초기 데이터 설정
  useEffect(() => {
    if (analysisData && textData) {
      const mergedData: any = {};
      const visibility: Record<string, boolean> = {};
      
      Object.entries(analysisData.elements).forEach(([section, elements]) => {
        mergedData[section] = {};
        visibility[section] = true; // 기본적으로 모든 섹션 표시
        
        Object.entries(elements as any).forEach(([key, element]: [string, any]) => {
          mergedData[section][key] = {
            korean: textData[section]?.[key]?.korean || "",
            english: textData[section]?.[key]?.english || element.content || "",
            applied: textData[section]?.[key]?.applied || "",
            location: element.selector,
            type: element.type,
            originalContent: element.content
          };
        });
      });
      
      setEditedData(mergedData);
      setSectionVisibility(visibility);
    }
  }, [analysisData, textData]);
  
  // 텍스트 변경 핸들러
  const handleTextChange = (section: string, key: string, field: "korean" | "english" | "applied", value: string) => {
    setEditedData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: {
          ...prev[section]?.[key],
          [field]: value
        }
      }
    }));
    
    setHasUnsavedChanges(true);
    
    // 자동 미리보기가 켜져있을 때는 미리보기만 업데이트 (파일 저장 X)
    if (autoPreview) {
      // 미리보기 업데이트를 위한 트리거만 실행
      // 실제 파일 저장은 하지 않음
    }
  };
  
  // 실제 파일에 저장하는 함수
  const handleSave = async (createVersion: boolean = false) => {
    if (!theme) return;
    
    // 모든 변경사항을 새로운 버전 관리 API로 저장
    const savePromises: Promise<Response>[] = [];
    
    Object.entries(editedData).forEach(([section, items]) => {
      Object.entries(items as Record<string, any>).forEach(([key, item]) => {
        // 각 항목에 대해 저장 API 호출
        const formData = new FormData();
        formData.append("templateId", theme);
        formData.append("section", section);
        formData.append("key", key);
        
        // 텍스트 데이터
        if (item.korean !== undefined) formData.append("korean", item.korean || "");
        if (item.english !== undefined) formData.append("english", item.english || "");
        
        // 메타데이터
        if (item.location) formData.append("location", item.location);
        if (item.type) formData.append("type", item.type);
        
        savePromises.push(
          fetch('/api/editor/save', {
            method: 'POST',
            body: formData
          })
        );
      });
    });
    
    try {
      // 모든 저장 작업 완료 대기
      await Promise.all(savePromises);
      setHasUnsavedChanges(false);
      
      console.log('All changes saved successfully');
      
      // 버전 생성은 VersionControl 컴포넌트에서 처리하므로 여기서는 제거
    } catch (error) {
      console.error('Failed to save changes:', error);
      // 에러 처리 (토스트 메시지 등)
    }
    // 저장 완료 처리
    console.log('Save completed');
  };
  
  // 원본으로 초기화하는 함수
  const handleReset = () => {
    const formData = new FormData();
    formData.append("action", "reset");
    submit(formData, { method: "post" });
    setShowResetDialog(false);
    setHasUnsavedChanges(false);
    
    // 페이지 새로고침으로 데이터 다시 로드
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };
  
  // 섹션 토글 함수
  const toggleSection = (section: string) => {
    setSectionVisibility(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // 컬러 시스템 변경 핸들러
  const handleColorSystemChange = (newColorSystem: ColorSystem) => {
    setColorSystem(newColorSystem);
    setHasUnsavedChanges(true);
  };
  
  const sections = analysisData ? Object.keys(analysisData.elements) : [];
  const isSaving = navigation.state === "submitting";
  
  // 테마 선택 화면
  if (!theme) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <h1 className="text-2xl font-bold mb-6">테마를 선택하세요</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableThemes.map((themeInfo: any) => (
              <Link
                key={themeInfo.id}
                to={`/editor?theme=${themeInfo.id}`}
                className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <h3 className="font-semibold">{themeInfo.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {themeInfo.htmlFiles.length} HTML 파일
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // 분석 데이터가 없는 경우
  if (!analysisData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">테마 분석이 필요합니다</h2>
          <p className="text-gray-600 mb-6">
            선택한 테마 ({theme})의 HTML 분석이 필요합니다.
          </p>
          <Link
            to="/editor"
            className="inline-block px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            다른 테마 선택
          </Link>
        </div>
      </div>
    );
  }
  
  // 컬러 탭이 선택된 경우 DesignTab 레이아웃 사용
  if (sidebarTab === 'colors' && theme) {
    return (
      <div className="min-h-screen bg-gray-50 h-screen flex flex-col">
        {/* 헤더 */}
        <header className="bg-white shadow-sm border-b px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">웹사이트 에디터</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSidebarTab('sections')}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  ← 섹션 편집으로
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {hasUnsavedChanges && (
                <span className="text-sm text-orange-500">저장되지 않은 변경사항</span>
              )}
            </div>
          </div>
        </header>

        {/* DesignTab - 3패널 레이아웃 */}
        <div className="flex-1">
          <DesignTab
            templateId={theme}
            editedData={editedData}
            initialColorSystem={colorSystem}
            initialStyleTokens={styleTokens}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 초기화 확인 다이얼로그 */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-bold mb-4">원본으로 초기화</h3>
            <p className="text-gray-600 mb-6">
              모든 변경사항이 삭제되고 원본 데이터로 복원됩니다.<br/>
              이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetDialog(false)}
                className="px-4 py-2 rounded border hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 버전 관리 다이얼로그 */}
      {showVersionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold mb-4">버전 관리</h3>
            {currentVersion && (
              <div className="mb-4 p-3 bg-yellow-100 rounded">
                <p className="text-sm">현재 버전 모드로 보고 있습니다: {currentVersion}</p>
                <Link 
                  to={`/editor?theme=${theme}`}
                  className="text-blue-500 hover:underline text-sm"
                >
                  현재 버전으로 돌아가기
                </Link>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {versions && versions.length > 0 ? (
                <div className="space-y-2">
                  {versions.map((version) => (
                    <div key={version.filename} className="border rounded p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{new Date(version.timestamp).toLocaleString('ko-KR')}</p>
                          <p className="text-sm text-gray-600">
                            섹션: {version.metadata?.totalSections || 0}개, 
                            항목: {version.metadata?.totalItems || 0}개
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            to={`/editor?theme=${theme}&version=${version.filename}`}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            불러오기
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">저장된 버전이 없습니다.</p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowVersionDialog(false)}
                className="px-4 py-2 rounded border hover:bg-gray-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex h-screen">
        {/* 사이드바 - 섹션 목록 & 버전 관리 */}
        <div className="w-80 bg-white shadow-lg flex flex-col">
          {/* 탭 헤더 */}
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setSidebarTab('sections')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                  sidebarTab === 'sections'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                📝 섹션 편집
              </button>
              <button
                onClick={() => setSidebarTab('versions')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                  sidebarTab === 'versions'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                🕒 버전 관리
              </button>
              <button
                onClick={() => setSidebarTab('colors')}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                  sidebarTab === 'colors'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                🎨 컬러
              </button>
            </div>
          </div>
          
          {/* 탭 콘텐츠 */}
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === 'sections' && (
              <div>
                <div className="p-4">
                  {sections.map(section => (
                    <div key={section} className="mb-2">
                      <button
                        onClick={() => setSelectedSection(section)}
                        className={`w-full text-left px-3 py-2 rounded transition-colors flex items-center justify-between ${
                          selectedSection === section
                            ? "bg-blue-500 text-white"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <span>{section}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSection(section);
                          }}
                          className={`ml-2 px-2 py-1 text-xs rounded ${
                            sectionVisibility[section]
                              ? "bg-green-500 text-white"
                              : "bg-gray-300 text-gray-600"
                          }`}
                        >
                          {sectionVisibility[section] ? "ON" : "OFF"}
                        </button>
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 border-t">
                  <Link
                    to="/editor"
                    className="block text-center px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    테마 변경
                  </Link>
                </div>
              </div>
            )}
            
            {sidebarTab === 'versions' && theme && (
              <div className="p-4">
                <VersionControl 
                  templateId={theme}
                  onVersionChange={(version) => {
                    // 버전 변경 시 페이지 새로고침
                    if (version) {
                      window.location.href = `/editor?theme=${theme}&version=${version}`;
                    } else {
                      window.location.href = `/editor?theme=${theme}`;
                    }
                  }}
                />
              </div>
            )}
            
            {sidebarTab === 'colors' && theme && (
              <div className="overflow-hidden">
                <BasicColorEditor 
                  templateId={theme}
                  onColorChange={handleColorSystemChange}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* 메인 컨텐츠 */}
        <div className="flex-1 flex flex-col">
          {/* 헤더 */}
          <header className="bg-white shadow-sm border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">웹사이트 에디터</h1>
              <div className="flex items-center gap-4">
                {/* 스타일가이드 링크 */}
                <Link
                  to={`/style-guide${theme ? `?theme=${theme}` : ''}`}
                  className="px-4 py-2 rounded text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                >
                  스타일가이드
                </Link>
                {/* 자동 미리보기 토글 */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoPreview}
                    onChange={(e) => setAutoPreview(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">실시간 미리보기</span>
                </label>
                
                {/* 저장 버튼 (항상 표시) */}
                <button
                  onClick={() => handleSave(false)}
                  disabled={!hasUnsavedChanges || isSaving}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    hasUnsavedChanges && !isSaving
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  저장
                </button>
                
                {/* 버전 저장 버튼 */}
                <button
                  onClick={() => handleSave(true)}
                  disabled={!hasUnsavedChanges || isSaving}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    hasUnsavedChanges && !isSaving
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  버전 저장
                </button>
                
                {/* 버전 관리 버튼 */}
                <button
                  onClick={() => setShowVersionDialog(true)}
                  className="px-4 py-2 rounded text-sm font-medium bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                >
                  버전 관리
                </button>
                
                {/* 초기화 버튼 */}
                <button
                  onClick={() => setShowResetDialog(true)}
                  className="px-4 py-2 rounded text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  원본으로 초기화
                </button>
                
                {/* 상태 표시 */}
                {isSaving && <span className="text-sm text-gray-500">저장 중...</span>}
                {!isSaving && !hasUnsavedChanges && <span className="text-sm text-green-500">저장됨</span>}
                {hasUnsavedChanges && <span className="text-sm text-orange-500">저장되지 않은 변경사항</span>}
              </div>
            </div>
          </header>
          
          <div className="flex-1 flex">
            {/* 편집 영역 */}
            <div className="w-1/2 p-6 overflow-y-auto bg-white">
              {selectedSection ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                    <span>{selectedSection} 섹션</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      sectionVisibility[selectedSection] 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {sectionVisibility[selectedSection] ? "편집 가능" : "편집 잠김"}
                    </span>
                  </h3>
                  
                  {!sectionVisibility[selectedSection] ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>이 섹션은 현재 편집이 잠겨있습니다.</p>
                      <p className="text-sm mt-2">좌측 메뉴에서 토글 버튼을 눌러 활성화하세요.</p>
                    </div>
                  ) : editedData[selectedSection] && Object.entries(editedData[selectedSection]).map(([key, item]: [string, any]) => (
                    <div key={key} className="mb-6 p-4 border rounded-lg">
                      <div className="mb-2">
                        <span className="text-sm text-gray-500">Key: {key}</span>
                        {item.location && (
                          <span className="text-sm text-gray-400 ml-2">({item.location})</span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">한국어</label>
                          <textarea
                            value={item.korean || ""}
                            onChange={(e) => handleTextChange(selectedSection, key, "korean", e.target.value)}
                            className="w-full p-2 border rounded resize-none"
                            rows={3}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">English</label>
                          <textarea
                            value={item.english || ""}
                            onChange={(e) => handleTextChange(selectedSection, key, "english", e.target.value)}
                            className="w-full p-2 border rounded resize-none"
                            rows={3}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">적용 텍스트</label>
                          <textarea
                            value={item.applied || ""}
                            onChange={(e) => handleTextChange(selectedSection, key, "applied", e.target.value)}
                            className="w-full p-2 border rounded resize-none"
                            rows={3}
                            placeholder="실제 적용될 텍스트를 입력하세요"
                          />
                        </div>
                      </div>
                      
                      {item.originalContent && (
                        <div className="mt-2 text-xs text-gray-400">
                          원본: {item.originalContent}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-20">
                  왼쪽에서 섹션을 선택하세요
                </div>
              )}
            </div>
            
            {/* 미리보기 영역 */}
            <div className="w-1/2 bg-gray-100 border-l">
              <div className="h-full flex flex-col">
                {/* 미리보기 컨트롤 바 */}
                <div className="bg-white border-b px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">미리보기</h3>
                    <div className="flex items-center gap-2">
                      {/* 화면 크기 선택 */}
                      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setPreviewSize('desktop')}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            previewSize === 'desktop' 
                              ? 'bg-white text-blue-600 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                          title="데스크톱 (100%)"
                        >
                          💻
                        </button>
                        <button
                          onClick={() => setPreviewSize('tablet')}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            previewSize === 'tablet' 
                              ? 'bg-white text-blue-600 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                          title="태블릿 (768px)"
                        >
                          📱
                        </button>
                        <button
                          onClick={() => setPreviewSize('mobile')}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            previewSize === 'mobile' 
                              ? 'bg-white text-blue-600 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                          title="모바일 (375px)"
                        >
                          📲
                        </button>
                        <button
                          onClick={() => setPreviewSize('custom')}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            previewSize === 'custom' 
                              ? 'bg-white text-blue-600 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                          title="사용자 정의"
                        >
                          ⚙️
                        </button>
                      </div>
                      
                      {/* 사용자 정의 너비 입력 */}
                      {previewSize === 'custom' && (
                        <input
                          type="number"
                          value={customWidth}
                          onChange={(e) => setCustomWidth(Number(e.target.value))}
                          className="w-20 px-2 py-1 text-sm border rounded"
                          placeholder="너비"
                          min="320"
                          max="2560"
                        />
                      )}
                      
                      {/* 액션 버튼들 */}
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => {
                            setIframeKey(Date.now());
                          }}
                          className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
                          title="새로고침"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => {
                            window.open(`/api/template-preview/${theme}`, '_blank');
                          }}
                          className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
                          title="새 창에서 열기"
                        >
                          🔗
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* 현재 크기 표시 */}
                  <div className="mt-2 text-xs text-gray-500">
                    {previewSize === 'desktop' && '100% 너비'}
                    {previewSize === 'tablet' && '768px 너비'}
                    {previewSize === 'mobile' && '375px 너비'}
                    {previewSize === 'custom' && `${customWidth}px 너비`}
                  </div>
                </div>
                
                {/* LivePreview 컨테이너 */}
                <div className="flex-1 overflow-auto bg-gray-200">
                  <LivePreview
                    templateId={theme}
                    previewUrl={`/api/template-preview/${theme}`}
                    editedData={editedData}
                    colorSystem={colorSystem}
                    styleTokens={styleTokens}
                    previewSize={previewSize === 'tablet' ? 'desktop' : previewSize as 'mobile' | 'desktop' | 'custom'}
                    customWidth={customWidth}
                    className="h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}