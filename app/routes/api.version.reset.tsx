import { json, type ActionFunctionArgs } from "@remix-run/node";
import * as path from "path";
import { VersionManager } from "~/utils/version-manager.server";

const DATA_PATH = path.join(process.cwd(), "app/data/themes");

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const templateId = formData.get('templateId') as string;

    if (!templateId) {
      return json({ error: 'Template ID is required' }, { status: 400 });
    }

    console.log(`[API] Resetting template ${templateId} to original`);

    const versionManager = new VersionManager(templateId, DATA_PATH);
    
    // 버전 관리 시스템 초기화 (처음 사용 시)
    await versionManager.initialize();
    
    // 원본으로 리셋
    await versionManager.resetToOriginal();

    return json({ 
      success: true,
      message: '원본 상태로 리셋되었습니다.',
      currentVersion: null
    });

  } catch (error) {
    console.error('[API] Failed to reset to original:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return json({ 
      error: errorMessage,
      success: false 
    }, { status: 500 });
  }
}