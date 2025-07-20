import { json, type LoaderFunctionArgs, type ActionFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import * as path from "path";
import * as fs from "fs/promises";
import { DesignTab } from "~/components/editor/DesignTab";
import { MediaTab } from "~/components/editor/MediaTab";
import type { ColorSystem } from "~/types/color-system";

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
}

interface EditedData {
  texts?: Record<string, any>;
  images?: Record<string, any>;
  colors?: ColorSystem;
}

// 템플릿 경로
const TEMPLATES_DIR = path.join(process.cwd(), 'public', 'templates');
const EDITED_DATA_PATH = path.join(process.cwd(), 'app', 'data', 'edited');

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
  
  // 분석 데이터 불러오기 (있다면)
  let analyzedData = null;
  try {
    const analysisPath = path.join(process.cwd(), 'app', 'data', 'analysis', `${templateId}.json`);
    const analysisContent = await fs.readFile(analysisPath, 'utf-8');
    analyzedData = JSON.parse(analysisContent);
  } catch {
    // 분석 데이터가 없어도 괜찮음
  }
  
  const template: Template = {
    id: templateId,
    name: templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    path: templatePath,
    hasIndex,
    analyzedData
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
  const { template, editedData, recentProject } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [activeTab, setActiveTab] = useState<'text' | 'design' | 'media'>('text');
  const [currentData, setCurrentData] = useState<EditedData>(editedData || {});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'text' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">텍스트 편집</h2>
            {template.analyzedData ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  총 {Object.keys(template.analyzedData.elements).length}개의 편집 가능한 요소를 찾았습니다.
                </p>
                {/* 텍스트 편집 UI는 추후 구현 */}
                <div className="text-sm text-gray-500">
                  텍스트 편집 기능은 준비 중입니다.
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                이 템플릿은 아직 분석되지 않았습니다. 대시보드에서 분석을 실행해주세요.
              </p>
            )}
          </div>
        )}
        
        {activeTab === 'design' && (
          <DesignTab
            templateId={template.id}
            editedData={currentData}
            initialColorSystem={currentData.colors || null}
            initialStyleTokens={null}
          />
        )}
        
        {activeTab === 'media' && (
          <MediaTab
            templateId={template.id}
            onMediaUpdate={(media) => handleDataChange({ images: media })}
          />
        )}
      </main>
    </div>
  );
}