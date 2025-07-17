import { json, type LoaderFunctionArgs } from "@remix-run/node";
import * as path from "path";
import { VersionManager } from "~/utils/version-manager";

const DATA_PATH = path.join(process.cwd(), "app/data/themes");

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const templateId = url.searchParams.get('templateId');

  if (!templateId) {
    return json({ error: 'Template ID is required' }, { status: 400 });
  }

  try {
    console.log(`[API] Loading version history for template ${templateId}`);

    const versionManager = new VersionManager(templateId, DATA_PATH);
    
    // 버전 관리 시스템 초기화 (처음 사용 시)
    await versionManager.initialize();
    
    // 버전 히스토리 로드
    const history = await versionManager.loadVersionHistory();
    
    // 원본 및 작업 데이터 로드
    const originalData = await versionManager.loadOriginalData();
    const workingData = await versionManager.loadWorkingData();

    return json({ 
      success: true,
      history,
      originalData,
      workingData,
      hasUnsavedChanges: workingData?.isDirty || false
    });

  } catch (error) {
    console.error('[API] Failed to load version history:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return json({ 
      error: errorMessage,
      success: false 
    }, { status: 500 });
  }
}