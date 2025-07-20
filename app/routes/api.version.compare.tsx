import { json, type LoaderFunctionArgs } from "@remix-run/node";
import * as path from "path";
import { VersionManager } from "~/utils/version-manager.server";

const DATA_PATH = path.join(process.cwd(), "app/data/themes");

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const templateId = url.searchParams.get('templateId');
  const version1 = url.searchParams.get('version1');
  const version2 = url.searchParams.get('version2');

  if (!templateId) {
    return json({ error: 'Template ID is required' }, { status: 400 });
  }

  if (!version1 || !version2) {
    return json({ error: 'Both version1 and version2 are required' }, { status: 400 });
  }

  try {
    console.log(`[API] Comparing versions ${version1} and ${version2} for template ${templateId}`);

    const versionManager = new VersionManager(templateId, DATA_PATH);
    
    // 버전 관리 시스템 초기화 (처음 사용 시)
    await versionManager.initialize();
    
    // 버전 비교
    const comparison = await versionManager.compareVersions(version1, version2);

    return json({ 
      success: true,
      comparison,
      version1,
      version2,
      templateId
    });

  } catch (error) {
    console.error('[API] Failed to compare versions:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return json({ 
      error: errorMessage,
      success: false 
    }, { status: 500 });
  }
}