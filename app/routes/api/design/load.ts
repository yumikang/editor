import { json, type LoaderFunctionArgs } from "@remix-run/node";
import * as path from "path";
import * as fs from "fs/promises";

// 저장 경로
const THEMES_DATA_PATH = path.join(process.cwd(), 'app', 'data', 'themes');

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const templateId = url.searchParams.get("templateId");

  if (!templateId) {
    return json({ error: "Template ID is required" }, { status: 400 });
  }

  try {
    // edited-design.json 불러오기
    const designPath = path.join(THEMES_DATA_PATH, templateId, 'working', 'edited-design.json');
    
    try {
      const designData = await fs.readFile(designPath, 'utf-8');
      const design = JSON.parse(designData);
      
      return json({ 
        success: true,
        design,
        loadedAt: new Date().toISOString()
      });
    } catch (e) {
      // 파일이 없는 경우 빈 디자인 반환
      return json({ 
        success: true,
        design: null,
        message: "No saved design found"
      });
    }

  } catch (error) {
    console.error("Error loading design:", error);
    return json({ 
      error: "Failed to load design",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};