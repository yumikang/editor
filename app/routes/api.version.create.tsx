import { json, type ActionFunctionArgs } from "@remix-run/node";
import * as path from "path";
import { VersionManager } from "~/utils/version-manager";

const DATA_PATH = path.join(process.cwd(), "app/data/themes");

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const templateId = formData.get('templateId') as string;
    const description = formData.get('description') as string;

    if (!templateId) {
      return json({ error: 'Template ID is required' }, { status: 400 });
    }

    if (!description) {
      return json({ error: 'Version description is required' }, { status: 400 });
    }

    console.log(`[API] Creating version for template ${templateId}: ${description}`);

    const versionManager = new VersionManager(templateId, DATA_PATH);
    
    // 버전 관리 시스템 초기화 (처음 사용 시)
    await versionManager.initialize();
    
    // 새 버전 생성
    const versionMetadata = await versionManager.createVersion(description);

    return json({ 
      success: true, 
      version: versionMetadata,
      message: `버전 ${versionMetadata.version}이 생성되었습니다.`
    });

  } catch (error) {
    console.error('[API] Failed to create version:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return json({ 
      error: errorMessage,
      success: false 
    }, { status: 500 });
  }
}