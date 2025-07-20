import { type LoaderFunctionArgs } from "@remix-run/node";
import * as path from "path";
import { getTemplateWatcher, type TemplateChangeEvent } from "~/utils/template-watcher.server";

const THEMES_PATH = path.join(process.cwd(), "../themes");
const DATA_PATH = path.join(process.cwd(), "app/data/themes");

// 연결된 클라이언트들을 저장
const clients = new Set<ReadableStreamDefaultController>();

export async function loader({ request }: LoaderFunctionArgs) {
  // SSE를 위한 응답 스트림 생성
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
      
      // 연결 확인 메시지
      controller.enqueue(
        new TextEncoder().encode(
          `event: connected\ndata: ${JSON.stringify({ 
            message: "Template events stream connected",
            timestamp: new Date().toISOString()
          })}\n\n`
        )
      );
      
      // 템플릿 watcher 가져오기
      const watcher = getTemplateWatcher(THEMES_PATH, DATA_PATH);
      
      // 이벤트 리스너 등록
      const onTemplateChange = (event: TemplateChangeEvent) => {
        if (controller.desiredSize !== null) {
          controller.enqueue(
            new TextEncoder().encode(
              `event: templateChange\ndata: ${JSON.stringify(event)}\n\n`
            )
          );
        }
      };
      
      const onWatchingStarted = (data: any) => {
        if (controller.desiredSize !== null) {
          controller.enqueue(
            new TextEncoder().encode(
              `event: watchingStarted\ndata: ${JSON.stringify(data)}\n\n`
            )
          );
        }
      };
      
      watcher.on('templateChange', onTemplateChange);
      watcher.on('watchingStarted', onWatchingStarted);
      
      // 연결이 끊어지면 정리
      request.signal.addEventListener('abort', () => {
        clients.delete(controller);
        watcher.removeListener('templateChange', onTemplateChange);
        watcher.removeListener('watchingStarted', onWatchingStarted);
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

// 모든 클라이언트에게 메시지 브로드캐스트
export function broadcastToClients(event: string, data: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const encodedMessage = new TextEncoder().encode(message);
  
  clients.forEach(controller => {
    if (controller.desiredSize !== null) {
      try {
        controller.enqueue(encodedMessage);
      } catch (error) {
        // 클라이언트 연결이 끊어진 경우 제거
        clients.delete(controller);
      }
    }
  });
}