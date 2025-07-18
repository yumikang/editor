import { type LoaderFunctionArgs } from "@remix-run/node";
import * as path from "path";
import * as fs from "fs/promises";
import * as cheerio from "cheerio";
import { previewMessageHandler } from "~/components/preview/LivePreview";

const THEMES_PATH = path.join(process.cwd(), "../themes");

export async function loader({ params, request }: LoaderFunctionArgs) {
  const templateId = params.id;
  
  if (!templateId) {
    return new Response("Template ID is required", { status: 400 });
  }
  
  try {
    // 테마 경로 찾기
    const themePath = path.join(THEMES_PATH, templateId);
    const indexPath = await findIndexPath(themePath);
    
    if (!indexPath) {
      return new Response("Template index.html not found", { status: 404 });
    }
    
    // HTML 읽기
    let html = await fs.readFile(indexPath, 'utf-8');
    
    // URL 쿼리 파라미터에서 실시간 콘텐츠 가져오기
    const url = new URL(request.url);
    const updates = url.searchParams.get('updates');
    
    if (updates) {
      try {
        const contentUpdates = JSON.parse(updates);
        html = applyContentUpdates(html, contentUpdates);
      } catch (e) {
        console.error('Failed to parse updates:', e);
      }
    }
    
    // 상대 경로를 절대 경로로 변환 (assets, css, js 등)
    const $ = cheerio.load(html);
    
    // 하위 폴더 경로 계산 (dark/light)
    const relativePath = path.relative(path.join(THEMES_PATH, templateId), path.dirname(indexPath));
    const baseUrl = relativePath ? `/themes/${templateId}/${relativePath}/` : `/themes/${templateId}/`;
    
    // 베이스 태그 추가 (상대 경로 해결용)
    if (!$('base').length) {
      $('head').prepend(`<base href="${baseUrl}">`);
    }
    
    // 절대 경로가 필요한 경우들만 수정
    // 이미지 경로 수정 (src가 /로 시작하는 경우)
    $('img').each((_, elem) => {
      const $elem = $(elem);
      const src = $elem.attr('src');
      if (src && src.startsWith('/') && !src.startsWith('//')) {
        $elem.attr('src', `/themes/${templateId}${src}`);
      }
    });
    
    // CSS 경로 수정 (href가 /로 시작하는 경우)
    $('link[rel="stylesheet"]').each((_, elem) => {
      const $elem = $(elem);
      const href = $elem.attr('href');
      if (href && href.startsWith('/') && !href.startsWith('//')) {
        $elem.attr('href', `/themes/${templateId}${href}`);
      }
    });
    
    // JS 경로 수정 (src가 /로 시작하는 경우)
    $('script[src]').each((_, elem) => {
      const $elem = $(elem);
      const src = $elem.attr('src');
      if (src && src.startsWith('/') && !src.startsWith('//')) {
        $elem.attr('src', `/themes/${templateId}${src}`);
      }
    });
    
    // LivePreview 메시지 핸들러 스크립트 추가
    $('body').append(previewMessageHandler);
    
    return new Response($.html(), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "SAMEORIGIN"
      }
    });
  } catch (error) {
    console.error('Error loading template preview:', error);
    return new Response("Error loading template", { status: 500 });
  }
}

async function findIndexPath(themePath: string): Promise<string | null> {
  // 루트에서 index.html 찾기
  try {
    const rootIndex = path.join(themePath, 'index.html');
    await fs.access(rootIndex);
    return rootIndex;
  } catch {
    // light/dark 폴더에서 찾기
    for (const subDir of ['light', 'dark']) {
      try {
        const subIndex = path.join(themePath, subDir, 'index.html');
        await fs.access(subIndex);
        return subIndex;
      } catch {
        continue;
      }
    }
  }
  return null;
}

function applyContentUpdates(html: string, updates: Record<string, string>): string {
  const $ = cheerio.load(html);
  
  Object.entries(updates).forEach(([selector, newContent]) => {
    const element = $(selector);
    if (element.length) {
      if (element.is('img')) {
        element.attr('src', newContent);
      } else {
        element.text(newContent);
      }
    }
  });
  
  return $.html();
}