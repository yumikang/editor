import { json, type ActionFunctionArgs } from "@remix-run/node";
import * as path from "path";
import * as fs from "fs/promises";
import type { EditedDesign, EditedContent } from "~/types/editor-types";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const templateId = formData.get("templateId") as string;
    const format = formData.get("format") as string;
    const includeAssets = formData.get("includeAssets") === "true";
    const minifyCode = formData.get("minifyCode") === "true";
    
    const editedContentStr = formData.get("editedContent") as string;
    const editedDesignStr = formData.get("editedDesign") as string;
    
    let editedContent: EditedContent | null = null;
    let editedDesign: EditedDesign | null = null;
    
    try {
      if (editedContentStr) editedContent = JSON.parse(editedContentStr);
      if (editedDesignStr) editedDesign = JSON.parse(editedDesignStr);
    } catch (e) {
      return json({ error: "Invalid JSON data" }, { status: 400 });
    }

    // TODO: 실제 내보내기 로직 구현
    switch (format) {
      case 'html':
        // HTML 내보내기 로직
        return json({ 
          success: true, 
          message: "HTML export completed",
          downloadUrl: `/downloads/${templateId}.html`
        });
        
      case 'css':
        // CSS 내보내기 로직
        return json({ 
          success: true,
          message: "CSS export completed",
          downloadUrl: `/downloads/${templateId}.css`
        });
        
      case 'json':
        // JSON 내보내기 로직
        return json({ 
          success: true,
          message: "JSON export completed",
          data: { editedContent, editedDesign }
        });
        
      case 'zip':
        // ZIP 내보내기 로직
        return json({ 
          success: true,
          message: "ZIP export completed",
          downloadUrl: `/downloads/${templateId}.zip`
        });
        
      default:
        return json({ error: "Invalid export format" }, { status: 400 });
    }

  } catch (error) {
    console.error("Export error:", error);
    return json({ 
      error: "Export failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};