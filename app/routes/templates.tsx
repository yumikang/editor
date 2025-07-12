import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useFetcher, useRevalidator } from "@remix-run/react";
import * as path from "path";
import { ThemeScanner } from "~/utils/theme-scanner";
import { useState, useEffect } from "react";
import { analyzeTemplate } from "./api.template-status.$id";

const THEMES_PATH = path.join(process.cwd(), "../themes");
const DATA_PATH = path.join(process.cwd(), "app/data/themes");

interface TemplateStatus {
  id: string;
  status: 'new' | 'analyzing' | 'completed' | 'error';
  progress?: number;
  message?: string;
  analyzedAt?: string;
  totalTexts?: number;
  totalImages?: number;
}

interface Template {
  id: string;
  name: string;
  path: string;
  hasIndex: boolean;
  hasConfig: boolean;
  preview?: string;
  indexPath?: string;
  metadata?: any;
  status: TemplateStatus;
  hasAnalysis?: boolean;
  hasPreview?: boolean;
}

// 템플릿 분석 상태 저장 (실제로는 DB나 파일 시스템 사용)
const analysisStatus = new Map<string, TemplateStatus>();

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const scanner = new ThemeScanner(THEMES_PATH, DATA_PATH);
    const scannedThemes = await scanner.scanThemes();
    
    const templates: Template[] = await Promise.all(
      scannedThemes.map(async (theme) => {
        // 분석 데이터 존재 여부 확인
        const hasAnalysis = await scanner.isThemeAnalyzed(theme.id);
        let analysisData = null;
        
        if (hasAnalysis) {
          analysisData = await scanner.loadAnalysisData(theme.id);
        }
        
        // 상태 확인
        let status = analysisStatus.get(theme.id) || {
          id: theme.id,
          status: hasAnalysis ? 'completed' : 'new'
        };
        
        if (hasAnalysis && analysisData) {
          status = {
            ...status,
            status: 'completed',
            analyzedAt: analysisData.analyzedAt,
            totalTexts: Object.keys(analysisData.elements).reduce((acc, section) => 
              acc + Object.keys(analysisData.elements[section]).filter(key => 
                analysisData.elements[section][key].type === 'text'
              ).length, 0
            ),
            totalImages: Object.keys(analysisData.elements).reduce((acc, section) => 
              acc + Object.keys(analysisData.elements[section]).filter(key => 
                analysisData.elements[section][key].type === 'image'
              ).length, 0
            )
          };
        }
        
        return {
          id: theme.id,
          name: theme.metadata?.name || theme.id,
          path: theme.path,
          hasIndex: theme.hasIndex,
          hasConfig: theme.hasConfig,
          hasPreview: theme.hasPreview,
          preview: theme.hasPreview ? `/themes/${theme.id}/preview.png` : undefined,
          indexPath: theme.indexPath,
          metadata: theme.metadata,
          status,
          hasAnalysis
        };
      })
    );
    
    return json({ templates });
  } catch (error) {
    console.error("Error loading templates:", error);
    return json({ templates: [] });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("action");
  const templateId = formData.get("templateId") as string;
  
  if (action === "scan") {
    // 전체 스캔 시작
    const scanner = new ThemeScanner(THEMES_PATH, DATA_PATH);
    await scanner.scanThemes();
    return json({ success: true, message: "스캔이 완료되었습니다." });
  }
  
  if (action === "analyze" && templateId) {
    // 개별 템플릿 분석 시작
    analysisStatus.set(templateId, {
      id: templateId,
      status: 'analyzing',
      progress: 0,
      message: 'HTML 파일을 읽는 중...'
    });
    
    // 실제 분석 작업 (비동기로 처리)
    analyzeTemplate(templateId).catch(console.error);
    
    return json({ success: true, message: "분석을 시작했습니다." });
  }
  
  return json({ success: false, message: "알 수 없는 액션입니다." });
}

export default function Templates() {
  const { templates } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const [isScanning, setIsScanning] = useState(false);
  const [templateProgress, setTemplateProgress] = useState<Record<string, any>>({});
  
  // SSE를 통한 실시간 진행률 업데이트
  useEffect(() => {
    const analyzingTemplates = templates.filter(t => t.status.status === 'analyzing');
    const eventSources: EventSource[] = [];
    
    analyzingTemplates.forEach(template => {
      const eventSource = new EventSource(`/api/template-status/${template.id}`);
      
      eventSource.addEventListener('progress', (event) => {
        const data = JSON.parse(event.data);
        setTemplateProgress(prev => ({
          ...prev,
          [template.id]: data
        }));
        
        if (data.status === 'completed' || data.status === 'error') {
          eventSource.close();
          setTimeout(() => {
            revalidator.revalidate();
          }, 1000);
        }
      });
      
      eventSources.push(eventSource);
    });
    
    return () => {
      eventSources.forEach(es => es.close());
    };
  }, [templates, revalidator]);
  
  const handleScan = () => {
    setIsScanning(true);
    fetcher.submit({ action: "scan" }, { method: "post" });
    setTimeout(() => {
      setIsScanning(false);
      revalidator.revalidate();
    }, 2000);
  };
  
  const handleAnalyze = (templateId: string) => {
    fetcher.submit({ action: "analyze", templateId }, { method: "post" });
  };
  
  // 통계 계산
  const stats = {
    total: templates.length,
    completed: templates.filter(t => t.status.status === 'completed').length,
    analyzing: templates.filter(t => t.status.status === 'analyzing').length,
    error: templates.filter(t => t.status.status === 'error').length,
    new: templates.filter(t => t.status.status === 'new').length
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Template Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={handleScan}
              disabled={isScanning}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                isScanning 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isScanning ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">🔄</span> 스캔 중...
                </span>
              ) : (
                '🔄 폴더 스캔'
              )}
            </button>
            <Link
              to="/debug-logs"
              target="_blank"
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
            >
              디버그 로그
            </Link>
            <Link
              to="/"
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              홈으로
            </Link>
          </div>
        </div>

        {/* 요약 정보 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">📊 요약 정보</h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
              <div className="text-sm text-gray-500">총 템플릿</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-500">분석 완료</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.analyzing}</div>
              <div className="text-sm text-gray-500">분석 중</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.new}</div>
              <div className="text-sm text-gray-500">대기 중</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.error}</div>
              <div className="text-sm text-gray-500">오류</div>
            </div>
          </div>
        </div>

        {/* 템플릿 목록 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">📁 templates/ 폴더 내용</h2>
          
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">사용 가능한 템플릿이 없습니다.</p>
              <p className="text-sm text-gray-400 mt-2">
                themes 폴더에 템플릿을 추가해주세요.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    {/* 미리보기 이미지 */}
                    {template.hasPreview && (
                      <div className="w-32 h-20 mr-4 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                        <img 
                          src={`/themes/${template.id}/preview.png`}
                          alt={`${template.name} preview`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {/* 상태 아이콘 */}
                        {template.status.status === 'completed' && (
                          <span className="text-green-500 text-xl">✅</span>
                        )}
                        {template.status.status === 'analyzing' && (
                          <span className="text-blue-500 text-xl animate-spin">🔄</span>
                        )}
                        {template.status.status === 'new' && (
                          <span className="text-yellow-500 text-xl">🆕</span>
                        )}
                        {template.status.status === 'error' && (
                          <span className="text-red-500 text-xl">❌</span>
                        )}
                        
                        <h3 className="text-lg font-semibold">{template.name}</h3>
                      </div>
                      
                      {/* 상태별 정보 표시 */}
                      {template.status.status === 'completed' && (
                        <div className="text-sm text-gray-600 ml-9">
                          📝 {template.status.totalTexts || 0}개 텍스트 | 
                          🖼️ {template.status.totalImages || 0}개 이미지 | 
                          📅 분석완료: {template.status.analyzedAt ? 
                            new Date(template.status.analyzedAt).toLocaleString('ko-KR') : 
                            '알 수 없음'}
                        </div>
                      )}
                      
                      {template.status.status === 'analyzing' && (
                        <div className="ml-9">
                          <div className="text-sm text-blue-600 mb-1">
                            {templateProgress[template.id]?.message || template.status.message || '분석 중...'} 
                            {templateProgress[template.id]?.progress || template.status.progress || 0}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${templateProgress[template.id]?.progress || template.status.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {template.status.status === 'new' && (
                        <div className="text-sm text-gray-500 ml-9">
                          새로 감지된 템플릿 - 분석 대기 중
                        </div>
                      )}
                      
                      {template.status.status === 'error' && (
                        <div className="text-sm text-red-600 ml-9">
                          오류: {template.status.message || 'index.html을 찾을 수 없습니다'}
                        </div>
                      )}
                    </div>
                    
                    {/* 액션 버튼 */}
                    <div className="flex gap-2 ml-4">
                      {template.status.status === 'completed' && template.hasIndex && (
                        <>
                          <Link
                            to={`/editor?theme=${template.id}`}
                            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                          >
                            편집하기
                          </Link>
                          <button
                            onClick={() => handleAnalyze(template.id)}
                            className="px-4 py-2 bg-gray-200 text-sm rounded-md hover:bg-gray-300"
                          >
                            재분석
                          </button>
                        </>
                      )}
                      
                      {template.status.status === 'new' && template.hasIndex && (
                        <button
                          onClick={() => handleAnalyze(template.id)}
                          className="px-4 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600"
                        >
                          분석 시작
                        </button>
                      )}
                      
                      {template.status.status === 'error' && (
                        <button
                          onClick={() => handleAnalyze(template.id)}
                          className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600"
                        >
                          분석 재시도
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 템플릿 추가 가이드 */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">새 템플릿 추가하기</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>themes 폴더에 새 폴더를 생성합니다</li>
            <li>index.html 파일을 추가합니다</li>
            <li>필요한 CSS, JS, 이미지 파일을 추가합니다</li>
            <li>선택적으로 theme.json 파일을 추가하여 메타데이터를 정의합니다</li>
            <li>폴더 스캔 버튼을 클릭하여 템플릿을 감지합니다</li>
          </ol>
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <code className="text-xs">
              {`{
  "name": "템플릿 이름",
  "version": "1.0.0",
  "description": "템플릿 설명",
  "author": "작성자"
}`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}