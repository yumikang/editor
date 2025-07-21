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

    if (!templateId) {
      return json({ error: "Template ID is required" }, { status: 400 });
    }

    // 작업 디렉토리 경로
    const workingDir = path.join(THEMES_DATA_PATH, templateId, 'working');
    
    try {
      // 백업 생성 (edited-design.json.backup)
      const designPath = path.join(workingDir, 'edited-design.json');
      const backupPath = path.join(workingDir, `edited-design.backup.${Date.now()}.json`);
      
      try {
        await fs.copyFile(designPath, backupPath);
      } catch {
        // 원본 파일이 없으면 백업할 필요 없음
      }

      // edited-design.json 삭제
      try {
        await fs.unlink(designPath);
      } catch {
        // 파일이 없어도 성공으로 처리
      }

      // 히스토리 초기화
      const historyPath = path.join(workingDir, 'design-history.json');
      await fs.writeFile(historyPath, JSON.stringify([{
        timestamp: new Date().toISOString(),
        action: 'reset',
        message: 'Design reset to original'
      }], null, 2));

      return json({ 
        success: true,
        message: "Design reset successfully",
        resetAt: new Date().toISOString()
      });

    } catch (error) {
      console.error("Error during reset:", error);
      throw error;
    }

  } catch (error) {
    console.error("Error resetting design:", error);
    return json({ 
      error: "Failed to reset design",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};