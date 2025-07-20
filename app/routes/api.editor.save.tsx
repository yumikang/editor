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
    const section = formData.get('section') as string;
    const key = formData.get('key') as string;
    const korean = formData.get('korean') as string;
    const english = formData.get('english') as string;
    const location = formData.get('location') as string;
    const type = formData.get('type') as string;

    if (!templateId) {
      return json({ error: 'Template ID is required' }, { status: 400 });
    }

    console.log(`[API] Saving editor data for template ${templateId}, section: ${section}, key: ${key}`);

    const versionManager = new VersionManager(templateId, DATA_PATH);
    
    // 버전 관리 시스템 초기화 (처음 사용 시)
    await versionManager.initialize();
    
    // 현재 작업 데이터 로드
    let workingData = await versionManager.loadWorkingData();
    
    if (!workingData) {
      // 작업 데이터가 없으면 초기화
      workingData = {
        templateId,
        lastModified: new Date(),
        texts: {},
        images: {},
        isDirty: false
      };
    }

    // 텍스트 데이터 업데이트
    const textKey = `${section}_${key}`;
    
    // 기존 구조와 호환성을 위해 적절한 값 저장
    if (korean !== undefined || english !== undefined) {
      workingData.texts = workingData.texts || {};
      
      // 한국어나 영어 중 하나라도 있으면 저장
      const content = korean || english || '';
      workingData.texts[textKey] = content;
    }

    // 이미지나 기타 미디어 데이터 처리
    if (type === 'image' && location) {
      workingData.images = workingData.images || {};
      workingData.images[textKey] = location;
    }

    // 작업 데이터 저장
    await versionManager.saveWorkingData(workingData);

    return json({ 
      success: true,
      message: '변경사항이 저장되었습니다.',
      isDirty: true
    });

  } catch (error) {
    console.error('[API] Failed to save editor data:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return json({ 
      error: errorMessage,
      success: false 
    }, { status: 500 });
  }
}