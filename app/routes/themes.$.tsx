import { type LoaderFunctionArgs } from "@remix-run/node";
import { promises as fs } from 'fs';
import { join } from 'path';
import { JsonStorage } from "~/utils/json-storage.server";
import * as cheerio from 'cheerio';
import { ThemeInitializer } from "~/utils/theme-initializer.server";

const THEMES_PATH = join(process.cwd(), "../themes");
const ACTIVE_JSON_PATH = join(process.cwd(), "../website-texts-active.json"); // 작업용 파일 사용

export async function loader({ params }: LoaderFunctionArgs) {
  // params["*"]에 전체 경로가 들어옴 (예: "agency-redox/light/index.html")
  const fullPath = params["*"] || "";
  const pathParts = fullPath.split('/');
  const theme = pathParts[0];
  const filePath = pathParts.slice(1).join('/');
  
  console.log('[themes.loader] Full path:', fullPath, 'Theme:', theme, 'File:', filePath);
  
  if (!theme || !filePath) {
    return new Response("Not Found", { status: 404 });
  }
  
  // 테마 초기화 (필요한 파일들이 없으면 자동 생성)
  const initializer = new ThemeInitializer(THEMES_PATH);
  await initializer.initializeTheme(theme);
  
  try {
    const absolutePath = join(THEMES_PATH, theme, filePath);
    console.log('[themes.loader] Absolute path:', absolutePath);
    
    // HTML 파일인 경우 텍스트 치환
    if (filePath.endsWith('.html')) {
      let htmlContent = await fs.readFile(absolutePath, 'utf-8');
      
      // JSON 데이터 로드 (작업용 파일에서)
      const storage = new JsonStorage(ACTIVE_JSON_PATH);
      const textData = await storage.read();
      const websiteTexts = textData.website_texts || textData || {};
      
      console.log('[themes.loader] Loaded text data sections:', Object.keys(websiteTexts));
      
      // Cheerio로 HTML 파싱
      const $ = cheerio.load(htmlContent);
      let replacementCount = 0;
      
      // 각 섹션의 텍스트 치환
      Object.entries(websiteTexts).forEach(([section, items]) => {
        Object.entries(items as any).forEach(([key, value]: [string, any]) => {
          if (value.location && (value.applied || value.korean)) {
            // location으로 요소 찾아서 텍스트 변경
            const elements = $(value.location);
            const textToApply = value.applied || value.korean;
            console.log(`[themes.loader] Trying to replace ${value.location}: "${value.originalContent}" -> "${textToApply}" (found ${elements.length} elements)`);
            
            if (elements.length > 0) {
              elements.each((_, el) => {
                const $el = $(el);
                // 텍스트만 있는 요소인 경우
                if ($el.children().length === 0) {
                  $el.text(textToApply);
                } else {
                  // 자식 요소가 있는 경우 첫 번째 텍스트 노드만 변경
                  const firstTextNode = $el.contents().filter(function() {
                    return this.type === 'text';
                  }).first();
                  if (firstTextNode.length > 0) {
                    firstTextNode.replaceWith(textToApply);
                  }
                }
                replacementCount++;
              });
            }
          }
        });
      });
      
      console.log(`[themes.loader] Replaced ${replacementCount} text elements`);
      
      // 커스텀 스타일 시트 추가 (테마별)
      try {
        const customStylePath = join(THEMES_PATH, theme, "custom-styles.css");
        await fs.access(customStylePath);
        $('head').append(`<link rel="stylesheet" href="/themes/${theme}/custom-styles.css">`);
        console.log(`[themes.loader] Custom styles added for theme: ${theme}`);
      } catch {
        // 커스텀 스타일이 없으면 무시
      }
      
      // 수정된 HTML 반환
      return new Response($.html(), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }
    
    // 다른 파일들은 그대로 반환
    const fileContent = await fs.readFile(absolutePath);
    
    // MIME 타입 설정
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.otf': 'font/otf',
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    return new Response(fileContent, {
      headers: {
        "Content-Type": contentType,
      },
    });
    
  } catch (error) {
    console.error('[themes.loader] Error serving theme file:', error);
    return new Response("Not Found", { status: 404 });
  }
}