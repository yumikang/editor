import { json, type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import { useState, useEffect, useRef } from "react";
import * as path from "path";
import * as fs from "fs/promises";
import { DesignTab } from "~/components/editor/DesignTab";
import { MediaTab } from "~/components/editor/MediaTab";
import type { ColorSystem } from "~/types/color-system";
import { EditorProvider } from "~/contexts/EditorContext";
import type { EditedDesign } from "~/contexts/EditorContext";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `${data?.templateName || 'Template'} Editor - CodeB WebCraft Studio` },
    { name: "description", content: "웹사이트 편집기" },
  ];
};

interface Template {
  id: string;
  name: string;
  path: string;
  hasIndex: boolean;
  analyzedData?: {
    elements: any;
    images: any[];
    analyzedAt: string;
  };
  designAnalysis?: {
    colors: any[];
    typography: any[];
    spacing: any[];
    extractedAt: string;
  };
}

interface EditedData {
  texts?: Record<string, any>;
  images?: Record<string, any>;
  colors?: ColorSystem;
}

interface SmartSection {
  id: string;
  label: string;
  icon: string;
  elements: any[];
  count: number;
  collapsed?: boolean;
}

// 요소를 스마트 섹션으로 그룹화하는 함수
function groupElementsIntoSmartSections(elements: any[]): SmartSection[] {
  const sections: SmartSection[] = [];
  const sectionMap = new Map<string, SmartSection>();
  
  // 섹션 정의와 아이콘
  const sectionConfig: Record<string, { label: string; icon: string; order: number }> = {
    'header': { label: '헤더', icon: '🏛️', order: 1 },
    'navigation': { label: '네비게이션', icon: '🧭', order: 2 },
    'hero': { label: '히어로 섹션', icon: '🚀', order: 3 },
    'services': { label: '서비스', icon: '⚡', order: 4 },
    'features': { label: '특징', icon: '✨', order: 5 },
    'about': { label: '소개', icon: '📖', order: 6 },
    'team': { label: '팀', icon: '👥', order: 7 },
    'portfolio': { label: '포트폴리오', icon: '🎨', order: 8 },
    'gallery': { label: '갤러리', icon: '🖼️', order: 9 },
    'testimonial': { label: '고객 후기', icon: '💬', order: 10 },
    'pricing': { label: '가격', icon: '💰', order: 11 },
    'contact': { label: '연락처', icon: '📞', order: 12 },
    'footer': { label: '푸터', icon: '📍', order: 13 },
    'global': { label: '기타', icon: '🌐', order: 99 }
  };
  
  // 요소 분류
  elements.forEach(element => {
    let sectionId = 'global';
    const selector = element.selector?.toLowerCase() || '';
    const content = element.content?.toLowerCase() || '';
    const elementClass = element.class?.toLowerCase() || '';
    const elementId = element.elementId?.toLowerCase() || '';
    
    // 섹션 자동 감지 로직
    if (selector.includes('header') || elementClass.includes('header') || elementId.includes('header')) {
      sectionId = 'header';
    } else if (selector.includes('nav') || elementClass.includes('nav') || content.includes('menu')) {
      sectionId = 'navigation';
    } else if (selector.includes('hero') || elementClass.includes('hero') || elementClass.includes('banner')) {
      sectionId = 'hero';
    } else if (selector.includes('service') || elementClass.includes('service')) {
      sectionId = 'services';
    } else if (selector.includes('feature') || elementClass.includes('feature')) {
      sectionId = 'features';
    } else if (selector.includes('about') || elementClass.includes('about')) {
      sectionId = 'about';
    } else if (selector.includes('team') || elementClass.includes('team')) {
      sectionId = 'team';
    } else if (selector.includes('portfolio') || elementClass.includes('portfolio') || selector.includes('work')) {
      sectionId = 'portfolio';
    } else if (selector.includes('gallery') || elementClass.includes('gallery')) {
      sectionId = 'gallery';
    } else if (selector.includes('testimonial') || elementClass.includes('testimonial') || selector.includes('review')) {
      sectionId = 'testimonial';
    } else if (selector.includes('pricing') || elementClass.includes('pricing') || selector.includes('price')) {
      sectionId = 'pricing';
    } else if (selector.includes('contact') || elementClass.includes('contact')) {
      sectionId = 'contact';
    } else if (selector.includes('footer') || elementClass.includes('footer')) {
      sectionId = 'footer';
    }
    
    // 기존 섹션이 있는 경우 사용
    if (element.section) {
      sectionId = element.section;
    }
    
    // 섹션에 요소 추가
    if (!sectionMap.has(sectionId)) {
      const config = sectionConfig[sectionId] || sectionConfig['global'];
      sectionMap.set(sectionId, {
        id: sectionId,
        label: config.label,
        icon: config.icon,
        elements: [],
        count: 0
      });
    }
    
    const section = sectionMap.get(sectionId)!;
    section.elements.push(element);
    section.count++;
  });
  
  // 섹션을 순서대로 정렬
  const sortedSections = Array.from(sectionMap.values()).sort((a, b) => {
    const orderA = sectionConfig[a.id]?.order || 99;
    const orderB = sectionConfig[b.id]?.order || 99;
    return orderA - orderB;
  });
  
  return sortedSections;
}

// 요소에 대한 사용자 친화적인 라벨 생성
function getElementLabel(element: any): string {
  const tag = element.tag || '';
  const elementClass = element.class || '';
  const content = element.content || '';
  
  // 태그별 기본 라벨
  const tagLabels: Record<string, string> = {
    'h1': '제목 1',
    'h2': '제목 2',
    'h3': '제목 3',
    'h4': '제목 4',
    'h5': '제목 5',
    'h6': '제목 6',
    'p': '본문',
    'span': '텍스트',
    'a': '링크',
    'button': '버튼',
    'li': '목록 항목',
    'div': '텍스트 블록'
  };
  
  let label = tagLabels[tag] || '텍스트';
  
  // 클래스명을 기반으로 더 구체적인 라벨 생성
  if (elementClass.includes('title')) label = '제목';
  else if (elementClass.includes('subtitle')) label = '부제목';
  else if (elementClass.includes('description')) label = '설명';
  else if (elementClass.includes('btn') || elementClass.includes('button')) label = '버튼';
  else if (elementClass.includes('link')) label = '링크';
  else if (elementClass.includes('heading')) label = '머리말';
  else if (elementClass.includes('text')) label = '텍스트';
  else if (elementClass.includes('caption')) label = '캡션';
  else if (elementClass.includes('label')) label = '라벨';
  
  // 내용의 앞부분을 미리보기로 추가 (최대 30자)
  const preview = content.length > 30 ? content.substring(0, 30) + '...' : content;
  return `${label}: ${preview}`;
}

// 템플릿 경로
const TEMPLATES_DIR = path.join(process.cwd(), 'public', 'templates');
const EDITED_DATA_PATH = path.join(process.cwd(), 'app', 'data', 'edited');
const EDITED_DESIGN_PATH = path.join(process.cwd(), 'app', 'data', 'themes');

// 편집된 데이터 불러오기
async function loadEditedData(templateId: string): Promise<EditedData | null> {
  try {
    const filePath = path.join(EDITED_DATA_PATH, `${templateId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// 편집된 데이터 저장하기
async function saveEditedData(templateId: string, data: EditedData): Promise<void> {
  const filePath = path.join(EDITED_DATA_PATH, `${templateId}.json`);
  await fs.mkdir(EDITED_DATA_PATH, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// 편집된 디자인 데이터 불러오기
async function loadEditedDesign(templateId: string): Promise<EditedDesign | null> {
  try {
    const filePath = path.join(EDITED_DESIGN_PATH, templateId, 'working', 'edited-design.json');
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const templateId = params.themeId;
  
  if (!templateId) {
    throw new Response("Template ID is required", { status: 400 });
  }
  
  // 템플릿 정보 불러오기
  const templatePath = path.join(TEMPLATES_DIR, templateId);
  
  try {
    await fs.access(templatePath);
  } catch {
    throw new Response("Template not found", { status: 404 });
  }
  
  // index.html 확인
  const indexPath = path.join(templatePath, 'index.html');
  let hasIndex = false;
  
  try {
    await fs.access(indexPath);
    hasIndex = true;
  } catch {
    hasIndex = false;
  }
  
  // 편집된 데이터 불러오기
  const editedData = await loadEditedData(templateId);
  
  // 편집된 디자인 데이터 불러오기
  const editedDesign = await loadEditedDesign(templateId);
  
  // 분석 데이터 불러오기 (있다면)
  let analyzedData = null;
  try {
    const analysisPath = path.join(templatePath, 'original-content.json');
    const analysisContent = await fs.readFile(analysisPath, 'utf-8');
    analyzedData = JSON.parse(analysisContent);
  } catch {
    // 분석 데이터가 없어도 괜찮음
  }
  
  // 디자인 분석 데이터 불러오기
  let designAnalysis = null;
  try {
    const designPath = path.join(templatePath, 'design-analysis.json');
    const designContent = await fs.readFile(designPath, 'utf-8');
    designAnalysis = JSON.parse(designContent);
  } catch {
    // 디자인 분석 데이터가 없어도 괜찮음
  }
  
  const template: Template = {
    id: templateId,
    name: templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    path: templatePath,
    hasIndex,
    analyzedData,
    designAnalysis
  };
  
  // 최근 프로젝트 저장을 위한 데이터
  const recentProject = {
    templateId,
    templateName: template.name,
    lastEdited: new Date().toISOString(),
    status: 'editing' as const
  };
  
  return json({ 
    template, 
    editedData,
    editedDesign,
    recentProject
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const templateId = params.themeId;
  
  if (!templateId) {
    return json({ error: "Template ID is required" }, { status: 400 });
  }
  
  const formData = await request.formData();
  const action = formData.get("action");
  
  if (action === "save") {
    const dataString = formData.get("data") as string;
    
    try {
      const data = JSON.parse(dataString);
      await saveEditedData(templateId, data);
      return json({ success: true, message: "저장되었습니다." });
    } catch (error) {
      return json({ error: "저장 실패" }, { status: 500 });
    }
  }
  
  return json({ error: "Unknown action" }, { status: 400 });
};

export default function EditorPage() {
  const { template, editedData, editedDesign, recentProject } = useLoaderData<typeof loader>();
  
  return (
    <EditorProvider 
      templateId={template.id}
      initialDesignAnalysis={template.designAnalysis}
      initialEditedDesign={editedDesign}
    >
      <EditorPageContent 
        template={template}
        editedData={editedData}
        recentProject={recentProject}
      />
    </EditorProvider>
  );
}

function EditorPageContent({ template, editedData, recentProject }: { 
  template: Template;
  editedData: EditedData | null;
  recentProject: any;
}) {
  const fetcher = useFetcher();
  const [activeTab, setActiveTab] = useState<'text' | 'design' | 'media'>('text');
  const [currentData, setCurrentData] = useState<EditedData>(editedData || {});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [panelWidth, setPanelWidth] = useState(40); // 40% for editor
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // 최근 프로젝트 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const recentProjects = JSON.parse(localStorage.getItem('recentProjects') || '[]');
      const otherProjects = recentProjects.filter((p: any) => p.templateId !== recentProject.templateId);
      const updatedProjects = [recentProject, ...otherProjects].slice(0, 10);
      localStorage.setItem('recentProjects', JSON.stringify(updatedProjects));
    }
  }, [recentProject]);
  
  // 자동 저장
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timer = setTimeout(() => {
        handleSave();
      }, 3000); // 3초 후 자동 저장
      
      return () => clearTimeout(timer);
    }
  }, [currentData, hasUnsavedChanges]);
  
  const handleSave = () => {
    fetcher.submit(
      { 
        action: "save", 
        data: JSON.stringify(currentData) 
      },
      { method: "post" }
    );
    setHasUnsavedChanges(false);
  };
  
  const handleDataChange = (newData: Partial<EditedData>) => {
    setCurrentData(prev => ({ ...prev, ...newData }));
    setHasUnsavedChanges(true);
  };
  
  const handleTextChange = (elementId: string, value: string) => {
    setCurrentData(prev => ({
      ...prev,
      texts: {
        ...prev.texts,
        [elementId]: value
      }
    }));
    setHasUnsavedChanges(true);
  };
  
  if (!template.hasIndex) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">템플릿 오류</h1>
          <p className="text-gray-600 mb-6">이 템플릿에는 index.html 파일이 없습니다.</p>
          <Link
            to="/templates"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            템플릿 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/templates" className="text-gray-600 hover:text-gray-900 mr-4">
                ← 템플릿 목록
              </Link>
              <h1 className="text-xl font-semibold">{template.name} 편집기</h1>
            </div>
            <div className="flex items-center space-x-4">
              {hasUnsavedChanges && (
                <span className="text-sm text-orange-600">저장되지 않은 변경사항</span>
              )}
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || fetcher.state !== 'idle'}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  hasUnsavedChanges && fetcher.state === 'idle'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {fetcher.state === 'submitting' ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('text')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'text'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              텍스트 편집
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'design'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              디자인
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'media'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              미디어
            </button>
          </nav>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <main className="h-[calc(100vh-8rem)] bg-gray-50">
        {activeTab === 'text' && (
          <div className="h-full flex">
            {/* 편집 패널 */}
            <div 
              className="bg-white border-r border-gray-200 overflow-hidden flex flex-col"
              style={{ width: showPreview ? `${panelWidth}%` : '100%' }}
            >
              {/* 편집 패널 헤더 */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">📝 텍스트 편집</h2>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {showPreview ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                        미리보기 숨기기
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        미리보기 표시
                      </>
                    )}
                  </button>
                </div>
              </div>
              {/* 편집 컨텐츠 영역 */}
              <div className="flex-1 overflow-y-auto p-6">
                {template.analyzedData ? (() => {
              // 텍스트 요소만 필터링하고 스마트 섹션으로 그룹화
              const textElements = template.analyzedData.elements.filter((element: any) => element.type === 'text');
              const smartSections = groupElementsIntoSmartSections(textElements);
              const filteredSections = smartSections.map(section => ({
                ...section,
                elements: section.elements.filter((element: any) => 
                  searchTerm === '' || 
                  element.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  getElementLabel(element).toLowerCase().includes(searchTerm.toLowerCase())
                )
              })).filter(section => section.elements.length > 0);
              
              const totalFilteredElements = filteredSections.reduce((sum, section) => sum + section.elements.length, 0);
              
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-gray-600">
                        {filteredSections.length}개 섹션에 {totalFilteredElements}개 요소
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        (전체 {textElements.length}개 중)
                      </p>
                    </div>
                    <input
                      type="search"
                      placeholder="텍스트 검색..."
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {/* 스마트 섹션 리스트 */}
                  <div className="space-y-4">
                    {filteredSections.map((section) => {
                      const isCollapsed = collapsedSections.has(section.id);
                      
                      return (
                        <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                          {/* 섹션 헤더 */}
                          <div 
                            className="px-5 py-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => {
                              const newCollapsed = new Set(collapsedSections);
                              if (isCollapsed) {
                                newCollapsed.delete(section.id);
                              } else {
                                newCollapsed.add(section.id);
                              }
                              setCollapsedSections(newCollapsed);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{section.icon}</span>
                                <div>
                                  <h3 className="font-semibold text-gray-900">
                                    {section.label}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {section.elements.length}개 항목
                                  </p>
                                </div>
                              </div>
                              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                {isCollapsed ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                          
                          {/* 섹션 컨텐츠 */}
                          {!isCollapsed && (
                            <div className="divide-y divide-gray-100">
                              {section.elements.map((element: any, index: number) => (
                                <div key={element.id} className="p-5 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-start space-x-4">
                                    <div className="flex-1">
                                      {/* 요소 라벨 */}
                                      <div className="mb-2">
                                        <span className="text-sm font-medium text-gray-700">
                                          {getElementLabel(element)}
                                        </span>
                                        {element.class && (
                                          <span className="ml-2 text-xs text-gray-400">
                                            .{element.class.split(' ')[0]}
                                          </span>
                                        )}
                                      </div>
                                      
                                      {/* 텍스트 편집 영역 */}
                                      <textarea
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all ${
                                          selectedElementId === element.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                        }`}
                                        value={currentData?.texts?.[element.id] || element.content}
                                        onChange={(e) => handleTextChange(element.id, e.target.value)}
                                        onFocus={() => setSelectedElementId(element.id)}
                                        rows={Math.max(2, element.content.split('\n').length)}
                                        placeholder="텍스트를 입력하세요..."
                                      />
                                    </div>
                                    
                                    {/* 원본으로 되돌리기 버튼 */}
                                    {currentData?.texts?.[element.id] && 
                                     currentData.texts[element.id] !== element.content && (
                                      <button
                                        onClick={() => handleTextChange(element.id, element.content)}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                                        title="원본으로 되돌리기"
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {filteredSections.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        "{searchTerm}"에 대한 검색 결과가 없습니다.
                      </p>
                    </div>
                  )}
                </div>
                  );
                })() : (
                  <p className="text-gray-500">
                    이 템플릿은 아직 분석되지 않았습니다. 대시보드에서 분석을 실행해주세요.
                  </p>
                )}
              </div>
            </div>
            
            {/* 리사이저 */}
            {showPreview && (
              <div 
                className="w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize relative group"
                onMouseDown={(e) => {
                  const startX = e.clientX;
                  const startWidth = panelWidth;
                  
                  const handleMouseMove = (e: MouseEvent) => {
                    const deltaX = e.clientX - startX;
                    const containerWidth = e.currentTarget?.parentElement?.offsetWidth || window.innerWidth;
                    const deltaPercent = (deltaX / containerWidth) * 100;
                    const newWidth = Math.max(20, Math.min(80, startWidth + deltaPercent));
                    setPanelWidth(newWidth);
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              >
                <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-blue-500 group-hover:opacity-20" />
              </div>
            )}
            
            {/* 미리보기 패널 */}
            {showPreview && (
              <div 
                className="flex-1 bg-gray-100 overflow-hidden flex flex-col"
                style={{ width: `${100 - panelWidth}%` }}
              >
                {/* 미리보기 헤더 */}
                <div className="bg-white border-b border-gray-200 px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="font-medium">👁️ 실시간 미리보기</h3>
                      <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button
                          onClick={() => setPreviewDevice('desktop')}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            previewDevice === 'desktop' 
                              ? 'bg-white text-blue-600 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          🖥️ 데스크톱
                        </button>
                        <button
                          onClick={() => setPreviewDevice('mobile')}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            previewDevice === 'mobile' 
                              ? 'bg-white text-blue-600 shadow-sm' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          📱 모바일
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {previewDevice === 'mobile' ? '390×844' : '1920×1080'}
                    </div>
                  </div>
                </div>
                
                {/* 미리보기 컨텐츠 */}
                <div className="flex-1 p-4 overflow-auto">
                  <div 
                    className={`mx-auto bg-white shadow-xl transition-all duration-300 ${
                      previewDevice === 'mobile' 
                        ? 'max-w-[390px]' 
                        : 'w-full'
                    }`}
                  >
                    <TemplatePreview
                      templateId={template.id}
                      editedData={currentData}
                      selectedElementId={selectedElementId}
                      device={previewDevice}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'design' && (
          <DesignTab
            templateId={template.id}
            editedData={currentData}
            initialColorSystem={currentData.colors || null}
            initialStyleTokens={null}
            designAnalysis={template.designAnalysis || null}
          />
        )}
        
        {activeTab === 'media' && (
          <div className="p-8">
            <MediaTab
              templateId={template.id}
              onMediaUpdate={(media) => handleDataChange({ images: media })}
            />
          </div>
        )}
      </main>
    </div>
  );
}

// 템플릿 미리보기 컴포넌트
function TemplatePreview({ 
  templateId, 
  editedData, 
  selectedElementId,
  device 
}: { 
  templateId: string;
  editedData: EditedData;
  selectedElementId: string | null;
  device: 'desktop' | 'mobile';
}) {
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 편집 데이터가 변경될 때마다 iframe에 메시지 전송
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      // 300ms 디바운싱
      const timer = setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'UPDATE_CONTENT',
          data: editedData,
          selectedElementId
        }, '*');
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [editedData, selectedElementId]);
  
  // iframe 로드 완료 시 초기 데이터 전송
  const handleIframeLoad = () => {
    setIsLoading(false);
    if (iframeRef.current?.contentWindow) {
      // 약간의 지연 후 데이터 전송
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'INIT_PREVIEW',
          data: editedData,
          selectedElementId
        }, '*');
      }, 100);
    }
  };
  
  // 부모 창에서의 메시지 수신
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'ELEMENT_SELECTED') {
        // 요소 선택 시 편집 패널로 스크롤
        const element = document.querySelector(`[data-element-id="${event.data.elementId}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  return (
    <div className="relative w-full h-full bg-white">
      <iframe
        key={iframeKey}
        ref={iframeRef}
        src={`/templates/${templateId}/index.html`}
        className="w-full h-full border-0"
        onLoad={handleIframeLoad}
        sandbox="allow-scripts allow-same-origin"
        style={{
          minHeight: device === 'mobile' ? '844px' : '600px'
        }}
      />
      
      {/* 로딩 상태 표시 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 pointer-events-none">
          <div className="text-gray-500">
            <svg className="animate-spin h-8 w-8 mx-auto mb-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm">미리보기 로딩 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}