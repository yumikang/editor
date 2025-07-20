import type { MetaFunction, LoaderFunction, ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "템플릿 대시보드 - CodeB WebCraft Studio" },
    { name: "description", content: "템플릿 관리 대시보드" },
  ];
};

interface Template {
  id: string;
  name: string;
  status: 'ready' | 'analyzing' | 'error' | 'new' | 'analyzed';
  hasIndex: boolean;
  fileCount?: number;
  totalSize?: string;
  lastScanned?: string;
  lastAnalyzed?: string;
  error?: string;
  hasOriginalContent?: boolean;
}

interface ScanResults {
  lastScan: string;
  templates: Record<string, Template>;
}

export const loader: LoaderFunction = async () => {
  const { promises: fs } = await import("fs");
  const { join, dirname } = await import("path");
  
  // 템플릿 디렉토리 경로
  const TEMPLATES_DIR = join(process.cwd(), 'public', 'templates');
  const SCAN_RESULTS_PATH = join(process.cwd(), 'app', 'data', 'scan-results.json');

  // 파일 크기를 읽기 쉬운 형식으로 변환
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // 디렉토리 크기 계산
  async function getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = join(dirPath, file.name);
        
        if (file.isDirectory()) {
          totalSize += await getDirectorySize(filePath);
        } else {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.error(`Error calculating directory size: ${error}`);
    }
    
    return totalSize;
  }

  // 템플릿 스캔 함수
  async function scanTemplates(): Promise<ScanResults> {
    const results: ScanResults = {
      lastScan: new Date().toISOString(),
      templates: {}
    };

    try {
      // templates 디렉토리 존재 확인
      await fs.access(TEMPLATES_DIR);
      
      // 템플릿 디렉토리 읽기
      const templateDirs = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });
      
      for (const dir of templateDirs) {
        if (!dir.isDirectory()) continue;
        
        const templatePath = join(TEMPLATES_DIR, dir.name);
        const templateId = dir.name;
        
        try {
          // index.html 확인
          const indexPath = join(templatePath, 'index.html');
          let hasIndex = false;
          
          try {
            await fs.access(indexPath);
            hasIndex = true;
          } catch {
            hasIndex = false;
          }
          
          // 파일 개수 세기
          const files = await fs.readdir(templatePath, { recursive: true });
          const fileCount = files.length;
          
          // 디렉토리 크기 계산
          const totalSizeBytes = await getDirectorySize(templatePath);
          const totalSize = formatFileSize(totalSizeBytes);
          
          // original-content.json 확인
          let hasOriginalContent = false;
          try {
            const originalContentPath = join(templatePath, 'original-content.json');
            await fs.access(originalContentPath);
            hasOriginalContent = true;
          } catch {
            hasOriginalContent = false;
          }
          
          results.templates[templateId] = {
            id: templateId,
            name: templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            status: hasOriginalContent ? 'analyzed' : (hasIndex ? 'ready' : 'new'),
            hasIndex,
            fileCount,
            totalSize,
            lastScanned: new Date().toISOString(),
            hasOriginalContent
          };
          
        } catch (error) {
          results.templates[templateId] = {
            id: templateId,
            name: templateId,
            status: 'error',
            hasIndex: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
      
      // 결과 저장
      await fs.mkdir(dirname(SCAN_RESULTS_PATH), { recursive: true });
      await fs.writeFile(SCAN_RESULTS_PATH, JSON.stringify(results, null, 2));
      
    } catch (error) {
      console.error('Template scan error:', error);
    }
    
    return results;
  }

  // 저장된 스캔 결과 불러오기
  async function loadScanResults(): Promise<ScanResults | null> {
    try {
      const data = await fs.readFile(SCAN_RESULTS_PATH, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  
  // 저장된 스캔 결과 불러오기
  let scanResults = await loadScanResults();
  
  // 결과가 없으면 자동 스캔 실행
  if (!scanResults) {
    scanResults = await scanTemplates();
  }
  
  return json({ scanResults });
};

export const action: ActionFunction = async ({ request }) => {
  const { promises: fs } = await import("fs");
  const { join, dirname } = await import("path");
  
  // 템플릿 디렉토리 경로
  const TEMPLATES_DIR = join(process.cwd(), 'public', 'templates');
  const SCAN_RESULTS_PATH = join(process.cwd(), 'app', 'data', 'scan-results.json');

  // 저장된 스캔 결과 불러오기
  async function loadScanResults(): Promise<ScanResults | null> {
    try {
      const data = await fs.readFile(SCAN_RESULTS_PATH, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  // 파일 크기를 읽기 쉬운 형식으로 변환
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // 디렉토리 크기 계산
  async function getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = join(dirPath, file.name);
        
        if (file.isDirectory()) {
          totalSize += await getDirectorySize(filePath);
        } else {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.error(`Error calculating directory size: ${error}`);
    }
    
    return totalSize;
  }

  // 템플릿 스캔 함수
  async function scanTemplates(): Promise<ScanResults> {
    const results: ScanResults = {
      lastScan: new Date().toISOString(),
      templates: {}
    };

    try {
      // templates 디렉토리 존재 확인
      await fs.access(TEMPLATES_DIR);
      
      // 템플릿 디렉토리 읽기
      const templateDirs = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });
      
      for (const dir of templateDirs) {
        if (!dir.isDirectory()) continue;
        
        const templatePath = join(TEMPLATES_DIR, dir.name);
        const templateId = dir.name;
        
        try {
          // index.html 확인
          const indexPath = join(templatePath, 'index.html');
          let hasIndex = false;
          
          try {
            await fs.access(indexPath);
            hasIndex = true;
          } catch {
            hasIndex = false;
          }
          
          // 파일 개수 세기
          const files = await fs.readdir(templatePath, { recursive: true });
          const fileCount = files.length;
          
          // 디렉토리 크기 계산
          const totalSizeBytes = await getDirectorySize(templatePath);
          const totalSize = formatFileSize(totalSizeBytes);
          
          // original-content.json 확인
          let hasOriginalContent = false;
          try {
            const originalContentPath = join(templatePath, 'original-content.json');
            await fs.access(originalContentPath);
            hasOriginalContent = true;
          } catch {
            hasOriginalContent = false;
          }
          
          results.templates[templateId] = {
            id: templateId,
            name: templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            status: hasOriginalContent ? 'analyzed' : (hasIndex ? 'ready' : 'new'),
            hasIndex,
            fileCount,
            totalSize,
            lastScanned: new Date().toISOString(),
            hasOriginalContent
          };
          
        } catch (error) {
          results.templates[templateId] = {
            id: templateId,
            name: templateId,
            status: 'error',
            hasIndex: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
      
      // 결과 저장
      await fs.mkdir(dirname(SCAN_RESULTS_PATH), { recursive: true });
      await fs.writeFile(SCAN_RESULTS_PATH, JSON.stringify(results, null, 2));
      
    } catch (error) {
      console.error('Template scan error:', error);
    }
    
    return results;
  }
  
  const formData = await request.formData();
  const action = formData.get("action");
  
  if (action === "scan") {
    const scanResults = await scanTemplates();
    return json({ scanResults });
  }
  
  if (action === "analyze") {
    const templateId = formData.get("templateId") as string;
    
    if (!templateId) {
      return json({ error: "Template ID is required" }, { status: 400 });
    }
    
    try {
      // HTML 분석기 및 전처리기 import
      const { HtmlAnalyzer } = await import("~/utils/html-analyzer.server");
      const { preprocessTemplate } = await import("~/utils/template-preprocessor.server");
      const { scanTemplateDesign } = await import("~/utils/design-scanner.server");
      
      // 템플릿 경로
      const templatePath = join(TEMPLATES_DIR, templateId);
      const indexPath = join(templatePath, 'index.html');
      
      // index.html 읽기
      const html = await fs.readFile(indexPath, 'utf-8');
      
      // HTML 분석
      const analyzer = new HtmlAnalyzer(html);
      const analysisResult = analyzer.analyze();
      
      // 결과를 original-content.json으로 저장
      const originalContentPath = join(templatePath, 'original-content.json');
      const originalContent = {
        templateId,
        analyzedAt: new Date().toISOString(),
        elements: analysisResult.elements,
        structure: analysisResult.structure,
        totalElements: analysisResult.elements.length
      };
      
      await fs.writeFile(originalContentPath, JSON.stringify(originalContent, null, 2));
      
      // 디자인 요소 스캔
      const designAnalysis = await scanTemplateDesign(templatePath);
      const designPath = join(templatePath, 'design-analysis.json');
      await fs.writeFile(designPath, JSON.stringify(designAnalysis, null, 2));
      
      // 템플릿 전처리 (data 속성 추가)
      await preprocessTemplate(templatePath);
      
      // scan-results.json 업데이트
      let scanResults = await loadScanResults();
      if (scanResults && scanResults.templates[templateId]) {
        scanResults.templates[templateId].status = 'analyzed';
        scanResults.templates[templateId].lastAnalyzed = new Date().toISOString();
        scanResults.templates[templateId].hasOriginalContent = true;
        
        await fs.writeFile(SCAN_RESULTS_PATH, JSON.stringify(scanResults, null, 2));
      }
      
      return json({ 
        success: true, 
        message: `템플릿 ${templateId} 분석 완료`,
        analyzedElements: analysisResult.elements.length,
        designElements: {
          colors: designAnalysis.colors.length,
          typography: designAnalysis.typography.length,
          spacing: designAnalysis.spacing.length
        }
      });
      
    } catch (error) {
      console.error('Template analysis error:', error);
      
      // scan-results.json에 오류 상태 업데이트
      let scanResults = await loadScanResults();
      if (scanResults && scanResults.templates[templateId]) {
        scanResults.templates[templateId].status = 'error';
        scanResults.templates[templateId].error = error instanceof Error ? error.message : 'Unknown error';
        
        await fs.writeFile(SCAN_RESULTS_PATH, JSON.stringify(scanResults, null, 2));
      }
      
      return json({ 
        error: "Analysis failed", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, { status: 500 });
    }
  }
  
  return json({ error: "Unknown action" }, { status: 400 });
};

export default function Dashboard() {
  const { scanResults } = useLoaderData<{ scanResults: ScanResults }>();
  const fetcher = useFetcher();
  const [isScanning, setIsScanning] = useState(false);
  const [analyzingTemplates, setAnalyzingTemplates] = useState<Set<string>>(new Set());
  
  const templates = Object.values(scanResults?.templates || {});
  
  useEffect(() => {
    if (fetcher.state === "submitting") {
      const formData = fetcher.formData;
      const action = formData?.get("action");
      
      if (action === "scan") {
        setIsScanning(true);
      } else if (action === "analyze") {
        const templateId = formData?.get("templateId") as string;
        if (templateId) {
          setAnalyzingTemplates(prev => new Set(prev).add(templateId));
        }
      }
    } else if (fetcher.state === "idle") {
      if (isScanning) {
        setIsScanning(false);
      }
      
      // 분석 완료 시 상태 업데이트
      if (analyzingTemplates.size > 0 && fetcher.data) {
        if ('success' in fetcher.data || 'error' in fetcher.data) {
          setAnalyzingTemplates(new Set());
          // 페이지 새로고침으로 최신 상태 반영
          if ('success' in fetcher.data) {
            window.location.reload();
          }
        }
      }
    }
  }, [fetcher.state, fetcher.data, fetcher.formData, isScanning, analyzingTemplates.size]);

  const getStatusIcon = (status: Template['status']) => {
    switch (status) {
      case 'ready':
        return '📝';
      case 'analyzed':
        return '✅';
      case 'analyzing':
        return '🔄';
      case 'error':
        return '❌';
      case 'new':
        return '🆕';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: Template['status']) => {
    switch (status) {
      case 'ready':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'analyzed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'analyzing':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'new':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              <h1 className="text-xl font-semibold">템플릿 대시보드</h1>
            </div>
            <nav className="flex space-x-4">
              <Link to="/templates" className="text-gray-600 hover:text-gray-900">
                템플릿 선택
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 액션 바 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">템플릿 관리</h2>
            <p className="text-sm text-gray-600 mt-1">
              마지막 스캔: {formatDate(scanResults?.lastScan)}
            </p>
          </div>
          <fetcher.Form method="post">
            <input type="hidden" name="action" value="scan" />
            <button
              type="submit"
              disabled={isScanning}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isScanning
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isScanning ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">🔄</span>
                  스캔 중...
                </span>
              ) : (
                'Scan Folder'
              )}
            </button>
          </fetcher.Form>
        </div>

        {/* 템플릿 리스트 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {templates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg mb-2">템플릿이 없습니다</p>
              <p className="text-sm">public/templates 폴더에 템플릿을 추가하고 스캔해주세요</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {templates.map((template) => (
                <div key={template.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getStatusIcon(template.status)}</span>
                        <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(template.status)}`}>
                          {template.status}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        {template.fileCount !== undefined && (
                          <span>파일: {template.fileCount}개</span>
                        )}
                        {template.totalSize && (
                          <span>크기: {template.totalSize}</span>
                        )}
                        {template.hasIndex && (
                          <span className="text-green-600">✓ index.html</span>
                        )}
                        {template.error && (
                          <span className="text-red-600">오류: {template.error}</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      {template.status === 'analyzed' ? (
                        <Link
                          to={`/editor/${template.id}`}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Edit →
                        </Link>
                      ) : template.status === 'ready' ? (
                        analyzingTemplates.has(template.id) ? (
                          <button
                            disabled
                            className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed font-medium"
                          >
                            <span className="flex items-center">
                              <span className="animate-spin mr-2">🔄</span>
                              분석 중...
                            </span>
                          </button>
                        ) : (
                          <fetcher.Form method="post" style={{ display: 'inline' }}>
                            <input type="hidden" name="action" value="analyze" />
                            <input type="hidden" name="templateId" value={template.id} />
                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                              Analyze
                            </button>
                          </fetcher.Form>
                        )
                      ) : template.status === 'new' ? (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed font-medium"
                        >
                          No index.html
                        </button>
                      ) : template.status === 'error' ? (
                        <fetcher.Form method="post" style={{ display: 'inline' }}>
                          <input type="hidden" name="action" value="analyze" />
                          <input type="hidden" name="templateId" value={template.id} />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors font-medium"
                          >
                            Retry
                          </button>
                        </fetcher.Form>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed font-medium"
                        >
                          Analyzing...
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}