// Phase 4: 미디어 서빙 API
import { type LoaderFunctionArgs } from '@remix-run/node';
import { promises as fs } from 'fs';
import path from 'path';

export async function loader({ params }: LoaderFunctionArgs) {
  const { templateId, type, fileName } = params;

  if (!templateId || !type || !fileName) {
    return new Response('Not Found', { status: 404 });
  }

  try {
    // 파일 경로 구성
    const filePath = path.join(
      process.cwd(),
      'app/data/themes',
      templateId,
      type, // 'images' or 'thumbnails'
      fileName
    );

    // 보안: 디렉토리 탐색 방지
    const normalizedPath = path.normalize(filePath);
    const baseDir = path.join(process.cwd(), 'app/data/themes', templateId);
    
    if (!normalizedPath.startsWith(baseDir)) {
      return new Response('Forbidden', { status: 403 });
    }

    // 파일 읽기
    const fileBuffer = await fs.readFile(filePath);

    // MIME 타입 결정
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };

    const ext = path.extname(fileName).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    // 캐시 헤더 설정
    const headers = new Headers({
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': fileBuffer.length.toString(),
    });

    return new Response(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error serving media:', error);
    return new Response('Not Found', { status: 404 });
  }
}