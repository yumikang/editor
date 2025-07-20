import { json, type ActionFunctionArgs } from "@remix-run/node";
import * as path from "path";
import { VersionManager } from "~/utils/version-manager.server";

const DATA_PATH = path.join(process.cwd(), "app/data/themes");

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'DELETE') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const templateId = formData.get('templateId') as string;
    const version = formData.get('version') as string;

    if (!templateId) {
      return json({ error: 'Template ID is required' }, { status: 400 });
    }

    if (!version) {
      return json({ error: 'Version is required' }, { status: 400 });
    }

    console.log(`[API] Deleting version ${version} for template ${templateId}`);

    const versionManager = new VersionManager(templateId, DATA_PATH);
    
    // 버전 관리 시스템 초기화 (처음 사용 시)
    await versionManager.initialize();
    
    // 버전 삭제
    await versionManager.deleteVersion(version);

    return json({ 
      success: true,
      message: `버전 ${version}이 삭제되었습니다.`,
      deletedVersion: version
    });

  } catch (error) {
    console.error('[API] Failed to delete version:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return json({ 
      error: errorMessage,
      success: false 
    }, { status: 500 });
  }
}