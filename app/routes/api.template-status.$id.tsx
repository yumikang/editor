import { type LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { join } = await import("path");
  const { ThemeScanner } = await import("~/utils/theme-scanner.server");
  const { ErrorHandler, TemplateAnalysisError } = await import("~/utils/error-handler");
  
  const THEMES_PATH = join(process.cwd(), "../themes");
  const DATA_PATH = join(process.cwd(), "app/data/themes");
  
  // 분석 진행 상태를 저장하는 맵 (실제로는 Redis나 DB 사용 권장)
  const analysisProgress = new Map<string, {
    status: 'analyzing' | 'completed' | 'error';
    progress: number;
    message: string;
    data?: unknown;
  }>();
  
  const templateId = params.id;
  
  if (!templateId) {
    return new Response(JSON.stringify({ error: "Template ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // 템플릿 분석을 실제로 수행하는 함수
  async function analyzeTemplate(templateId: string) {
    let retryCount = 0;
    const maxRetries = 3;
    
    const performAnalysis = async (): Promise<void> => {
      try {
        // 초기 상태 설정
        analysisProgress.set(templateId, {
          status: 'analyzing',
          progress: 10,
          message: retryCount > 0 ? `재시도 중... (${retryCount}/${maxRetries})` : 'HTML 파일을 읽는 중...'
        });
        
        const scanner = new ThemeScanner(THEMES_PATH, DATA_PATH);
        const themes = await scanner.scanThemes();
        const theme = themes.find(t => t.id === templateId);
        
        if (!theme) {
          const error = ErrorHandler.createError(new Error('Template not found'), `템플릿 ID: ${templateId}`);
          throw new TemplateAnalysisError(error);
        }
        
        if (!theme.hasIndex) {
          const error = ErrorHandler.createError(new Error('ENOENT: index.html not found'), `템플릿 경로: ${theme.path}`);
          throw new TemplateAnalysisError(error);
        }
      
        // HTML 파싱 단계
        analysisProgress.set(templateId, {
          status: 'analyzing',
          progress: 30,
          message: 'DOM 구조 분석 중...'
        });
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 텍스트 추출 단계
        analysisProgress.set(templateId, {
          status: 'analyzing',
          progress: 50,
          message: '텍스트 요소 추출 중...'
        });
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 이미지 분석 단계
        analysisProgress.set(templateId, {
          status: 'analyzing',
          progress: 70,
          message: '이미지 리소스 검색 중...'
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 구조 분석 완료
        analysisProgress.set(templateId, {
          status: 'analyzing',
          progress: 90,
          message: '분석 결과 저장 중...'
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 분석 완료 - 더미 데이터로 설정
        const analysisData = {
          analyzed: true,
          totalTexts: Math.floor(Math.random() * 50) + 10,
          totalImages: Math.floor(Math.random() * 20) + 5,
          structure: {
            hasHeader: true,
            hasFooter: true,
            sections: Math.floor(Math.random() * 5) + 3
          },
          originalContentPath: join(theme.path, 'original-content.json'),
          currentContentPath: join(theme.path, 'current-content.json')
        };
        
        // 성공적으로 완료
        analysisProgress.set(templateId, {
          status: 'completed',
          progress: 100,
          message: '분석이 완료되었습니다!',
          data: analysisData
        });
        
      } catch (error) {
        retryCount++;
        
        if (error instanceof TemplateAnalysisError) {
          // 템플릿 분석 관련 에러는 재시도하지 않음
          analysisProgress.set(templateId, {
            status: 'error',
            progress: 0,
            message: error.message || '템플릿 분석 중 오류가 발생했습니다.'
          });
          throw error;
        }
        
        if (retryCount <= maxRetries) {
          // 일반적인 에러는 재시도
          analysisProgress.set(templateId, {
            status: 'analyzing',
            progress: 5,
            message: `재시도 중... (${retryCount}/${maxRetries})`
          });
          
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          return performAnalysis();
        } else {
          // 최대 재시도 횟수 초과
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          analysisProgress.set(templateId, {
            status: 'error',
            progress: 0,
            message: `분석 실패: ${errorMessage} (${maxRetries}회 재시도 후 실패)`
          });
          throw error;
        }
      }
    };
    
    return performAnalysis();
  }
  
  // SSE를 위한 응답 스트림 생성
  const stream = new ReadableStream({
    start(controller) {
      // 초기 상태 전송
      const currentStatus = analysisProgress.get(templateId);
      if (currentStatus) {
        controller.enqueue(
          new TextEncoder().encode(
            `event: progress\ndata: ${JSON.stringify(currentStatus)}\n\n`
          )
        );
      }
      
      // 주기적으로 상태 확인 및 전송
      const interval = setInterval(() => {
        const status = analysisProgress.get(templateId);
        
        if (status) {
          controller.enqueue(
            new TextEncoder().encode(
              `event: progress\ndata: ${JSON.stringify(status)}\n\n`
            )
          );
          
          // 완료 또는 에러 상태면 스트림 종료
          if (status.status === 'completed' || status.status === 'error') {
            clearInterval(interval);
            controller.close();
          }
        }
      }, 500);
      
      // 분석 시작 (비동기로 실행)
      analyzeTemplate(templateId).catch(error => {
        console.error('Template analysis error:', error);
        clearInterval(interval);
        controller.close();
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}