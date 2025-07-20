import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { useState, useEffect } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "템플릿 선택 - CodeB WebCraft Studio" },
    { name: "description", content: "편집할 템플릿을 선택하세요" },
  ];
};

interface Template {
  id: string;
  name: string;
  status: 'ready' | 'analyzing' | 'error' | 'new';
  hasIndex: boolean;
  fileCount?: number;
  totalSize?: string;
  lastScanned?: string;
  totalTexts?: number;
  totalImages?: number;
  analyzedAt?: string;
  thumbnail?: string;
}

interface RecentProject {
  templateId: string;
  templateName: string;
  lastEdited: string;
  status: 'editing' | 'completed';
  thumbnail?: string;
}

export const loader: LoaderFunctionArgs = async () => {
  const { promises: fs } = await import("fs");
  const { join } = await import("path");
  
  // 템플릿 디렉토리 경로
  const TEMPLATES_DIR = join(process.cwd(), 'public', 'templates');
  const SCAN_RESULTS_PATH = join(process.cwd(), 'app', 'data', 'scan-results.json');
  
  // 스캔 결과 불러오기
  async function loadScanResults() {
    try {
      const data = await fs.readFile(SCAN_RESULTS_PATH, 'utf-8');
      const scanResults = JSON.parse(data);
      return Object.values(scanResults.templates || {}) as Template[];
    } catch {
      return [];
    }
  }
  
  const templates = await loadScanResults();
  return json({ templates });
};

export default function Templates() {
  const { templates } = useLoaderData<typeof loader>();
  const [filter, setFilter] = useState<'all' | 'ready'>('all');
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  
  useEffect(() => {
    // localStorage에서 최근 프로젝트 불러오기
    if (typeof window !== 'undefined') {
      const recent = localStorage.getItem('recentProjects');
      if (recent) {
        const projects = JSON.parse(recent);
        const sortedProjects = projects
          .sort((a: RecentProject, b: RecentProject) => 
            new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime()
          )
          .slice(0, 3);
        setRecentProjects(sortedProjects);
      }
    }
  }, []);

  // 필터된 템플릿
  const filteredTemplates = templates.filter(template => {
    if (filter === 'ready') {
      return template.status === 'ready';
    }
    return true;
  });

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}시간 전`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}일 전`;
    }
  };

  const handleTemplateClick = (template: Template) => {
    if (template.status !== 'ready') {
      alert('이 템플릿은 아직 분석이 완료되지 않았습니다.\n대시보드에서 분석을 완료해주세요.');
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-gray-600 hover:text-gray-900 mr-4">
                ← Home
              </Link>
              <h1 className="text-xl font-semibold">템플릿 선택</h1>
            </div>
            <nav className="flex space-x-4">
              <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                ← Template Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 최근 프로젝트 */}
        {recentProjects.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">최근 작업</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentProjects.map((project) => (
                <Link
                  key={project.templateId}
                  to={`/editor/${project.templateId}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{project.templateName}</h3>
                    <span className="text-xs text-blue-600 font-medium">Continue →</span>
                  </div>
                  <p className="text-sm text-gray-500">{getTimeAgo(project.lastEdited)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 필터 옵션 */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">템플릿 목록</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              전체 보기
            </button>
            <button
              onClick={() => setFilter('ready')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'ready'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              분석 완료만 보기
            </button>
          </div>
        </div>

        {/* 템플릿 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">표시할 템플릿이 없습니다.</p>
              {filter === 'ready' && (
                <p className="text-sm text-gray-400 mt-2">
                  분석이 완료된 템플릿이 없습니다. 전체 보기를 선택하세요.
                </p>
              )}
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className={`relative bg-white rounded-lg shadow-sm border ${
                  template.status === 'ready' 
                    ? 'border-gray-200 hover:shadow-md cursor-pointer' 
                    : 'border-gray-300 opacity-60 cursor-not-allowed'
                } transition-all`}
                onClick={() => handleTemplateClick(template)}
              >
                {/* 썸네일 영역 */}
                <div className="h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                  {template.thumbnail ? (
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-6xl">📄</span>
                    </div>
                  )}
                </div>

                {/* 정보 영역 */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                  
                  {/* 상태 표시 */}
                  <div className="flex items-center space-x-2 mb-3">
                    {template.status === 'ready' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ 분석 완료
                      </span>
                    )}
                    {template.status === 'analyzing' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        🔄 분석 중
                      </span>
                    )}
                    {template.status === 'new' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        🆕 미분석
                      </span>
                    )}
                    {template.status === 'error' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ❌ 오류
                      </span>
                    )}
                  </div>

                  {/* 상세 정보 */}
                  {template.status === 'ready' && (
                    <div className="text-sm text-gray-600 space-y-1">
                      {template.totalTexts !== undefined && (
                        <p>📝 텍스트: {template.totalTexts}개</p>
                      )}
                      {template.totalImages !== undefined && (
                        <p>🖼️ 이미지: {template.totalImages}개</p>
                      )}
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  {template.status === 'ready' && (
                    <Link
                      to={`/editor/${template.id}`}
                      className="mt-4 block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      편집하기
                    </Link>
                  )}
                  
                  {template.status !== 'ready' && (
                    <div className="mt-4 text-center text-sm text-gray-500">
                      대시보드에서 분석을 완료해주세요
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 도움말 */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">💡 사용 안내</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• 분석이 완료된 템플릿만 편집할 수 있습니다.</li>
            <li>• 새 템플릿을 추가하려면 <Link to="/dashboard" className="text-blue-600 hover:underline">대시보드</Link>에서 스캔하세요.</li>
            <li>• 템플릿 분석은 대시보드에서 진행할 수 있습니다.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}