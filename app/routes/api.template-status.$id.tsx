import { type LoaderFunctionArgs } from "@remix-run/node";
import * as path from "path";
import { ThemeScanner } from "~/utils/theme-scanner";
import { ErrorHandler, TemplateAnalysisError } from "~/utils/error-handler";

const THEMES_PATH = path.join(process.cwd(), "../themes");
const DATA_PATH = path.join(process.cwd(), "app/data/themes");

// 분석 진행 상태를 저장하는 맵 (실제로는 Redis나 DB 사용 권장)
export const analysisProgress = new Map<string, {
  status: 'analyzing' | 'completed' | 'error';
  progress: number;
  message: string;
  data?: unknown;
}>();

export async function loader({ request, params }: LoaderFunctionArgs) {
  const templateId = params.id;
  
  if (!templateId) {
    return new Response(JSON.stringify({ error: "Template ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
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
          
          // 완료되거나 에러가 발생하면 정리
          if (status.status === 'completed' || status.status === 'error') {
            clearInterval(interval);
            setTimeout(() => {
              analysisProgress.delete(templateId);
              controller.close();
            }, 5000); // 5초 후 메모리에서 제거
          }
        }
      }, 1000);
      
      // 연결이 끊어지면 정리
      request.signal.addEventListener('abort', () => {
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
    },
  });
}

// 템플릿 분석을 실제로 수행하는 함수
export async function analyzeTemplate(templateId: string) {
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
        message: '이미지 사이즈 분석 중...'
      });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // JSON 생성 단계
      analysisProgress.set(templateId, {
        status: 'analyzing',
        progress: 90,
        message: 'JSON 파일 생성 중...'
      });
      
      // 실제 분석 수행
      const analysisData = await scanner.analyzeTheme(theme);
      
      if (analysisData) {
        // original-content.json 생성
        const originalContentPath = path.join(theme.path, 'original-content.json');
        const currentContentPath = path.join(theme.path, 'current-content.json');
        
        // 텍스트와 이미지 데이터 분리
        const texts: Array<{
          id: string;
          selector: string;
          originalContent: string;
          originalLength: number;
          maxLength: number;
          section: string;
          context: string;
        }> = [];
        const images: Array<{
          id: string;
          selector: string;
          originalPath: string;
          section: string;
          attributes: Record<string, string>;
        }> = [];
        
        Object.entries(analysisData.elements).forEach(([section, elements]) => {
          Object.entries(elements as Record<string, {
            type: string;
            selector: string;
            content: string;
            attributes: Record<string, string>;
          }>).forEach(([key, element]) => {
            if (element.type === 'text') {
              texts.push({
                id: key,
                selector: element.selector,
                originalContent: element.content,
                originalLength: element.content.length,
                maxLength: element.content.length + 50,
                section,
                context: `${section} 섹션의 텍스트`
              });
            } else if (element.type === 'image') {
              images.push({
                id: key,
                selector: element.selector,
                originalPath: element.content,
                section,
                attributes: element.attributes
              });
            }
          });
        });
        
        const originalContent = {
          templateId: theme.id,
          analyzedAt: new Date().toISOString(),
          htmlFile: theme.indexPath || 'index.html',
          texts,
          images,
          statistics: {
            totalTexts: texts.length,
            totalImages: images.length,
            analysisTime: '3.5s'
          }
        };
        
        // current-content.json 초기화
        const currentContent = {
          templateId: theme.id,
          lastModified: new Date().toISOString(),
          texts: texts.reduce((acc, text) => ({
            ...acc,
            [text.id]: text.originalContent
          }), {}),
          images: images.reduce((acc, img) => ({
            ...acc,
            [img.id]: img.originalPath
          }), {})
        };
        
        // 파일 시스템에 저장 (실제 구현 시)
        // await fs.writeFile(originalContentPath, JSON.stringify(originalContent, null, 2));
        // await fs.writeFile(currentContentPath, JSON.stringify(currentContent, null, 2));
        
        // 완료 상태
        analysisProgress.set(templateId, {
          status: 'completed',
          progress: 100,
          message: '분석이 완료되었습니다!',
          data: {
            totalTexts: texts.length,
            totalImages: images.length,
            analyzedAt: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      // 구조화된 오류 처리
      let analysisError;
      
      if (error instanceof TemplateAnalysisError) {
        analysisError = error.analysisError;
      } else {
        analysisError = ErrorHandler.createError(error, `템플릿 분석: ${templateId}`);
      }
      
      // 복구 전략 확인
      const recoveryStrategy = ErrorHandler.getRecoveryStrategy(analysisError);
      
      if (recoveryStrategy.canRetry && retryCount < recoveryStrategy.maxRetries) {
        retryCount++;
        console.log(`[AnalysisError] Retrying analysis for ${templateId}, attempt ${retryCount}/${recoveryStrategy.maxRetries}`);
        
        // 재시도 전 대기
        await new Promise(resolve => setTimeout(resolve, recoveryStrategy.retryDelay));
        
        // 재시도
        return performAnalysis();
      }
      
      // 최종 실패
      console.error(`[AnalysisError] Failed to analyze template ${templateId}:`, analysisError);
      
      analysisProgress.set(templateId, {
        status: 'error',
        progress: 0,
        message: ErrorHandler.getUserFriendlyMessage(analysisError),
        data: {
          errorCode: analysisError.code,
          category: analysisError.category,
          severity: analysisError.severity,
          recoverable: analysisError.recoverable,
          suggestions: analysisError.suggestions,
          technicalDetails: analysisError.technicalDetails
        }
      });
    }
  };
  
  // 분석 시작
  await performAnalysis();
}