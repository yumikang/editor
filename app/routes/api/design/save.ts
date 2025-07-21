import { json, type ActionFunctionArgs } from "@remix-run/node";
import * as path from "path";
import * as fs from "fs/promises";

// 저장 경로
const THEMES_DATA_PATH = path.join(process.cwd(), 'app', 'data', 'themes');

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const templateId = formData.get("templateId") as string;
    const designData = formData.get("design") as string;

    if (!templateId) {
      return json({ error: "Template ID is required" }, { status: 400 });
    }

    if (!designData) {
      return json({ error: "Design data is required" }, { status: 400 });
    }

    // 디자인 데이터 파싱
    let design;
    try {
      design = JSON.parse(designData);
    } catch (e) {
      return json({ error: "Invalid design data format" }, { status: 400 });
    }

    // 저장 디렉토리 생성
    const workingDir = path.join(THEMES_DATA_PATH, templateId, 'working');
    await fs.mkdir(workingDir, { recursive: true });

    // edited-design.json 저장
    const designPath = path.join(workingDir, 'edited-design.json');
    await fs.writeFile(designPath, JSON.stringify(design, null, 2));

    // 히스토리 저장 (향후 구현을 위한 준비)
    const historyPath = path.join(workingDir, 'design-history.json');
    let history = [];
    
    try {
      const existingHistory = await fs.readFile(historyPath, 'utf-8');
      history = JSON.parse(existingHistory);
    } catch {
      // 히스토리 파일이 없으면 새로 시작
    }

    // 히스토리에 현재 상태 추가 (최대 50개 유지)
    history.unshift({
      timestamp: new Date().toISOString(),
      version: design.metadata?.version || 1,
      changes: {
        colors: Object.keys(design.colors || {}).length,
        typography: Object.keys(design.typography || {}).length,
        spacing: Object.keys(design.spacing || {}).length
      }
    });

    history = history.slice(0, 50);
    await fs.writeFile(historyPath, JSON.stringify(history, null, 2));

    return json({ 
      success: true,
      message: "Design saved successfully",
      savedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error saving design:", error);
    return json({ 
      error: "Failed to save design",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};