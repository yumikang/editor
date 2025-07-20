// 버전 관리 dirty 상태 API - Phase 3 Day 7
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { VersionManager } from '~/utils/version-manager.server';
import * as path from 'path';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: "Method not allowed" }, { status: 405 });
  }
  
  try {
    const formData = await request.formData();
    const templateId = formData.get('templateId') as string;
    const operation = formData.get('operation') as string;
    const changeType = formData.get('changeType') as string;
    
    if (!templateId) {
      return json({ error: "templateId is required" }, { status: 400 });
    }
    
    const versionManager = new VersionManager(
      templateId,
      path.join(process.cwd(), 'app/data/themes')
    );
    
    switch (operation) {
      case 'markDirty': {
        // 현재 작업 데이터를 로드하고 isDirty를 true로 설정
        const workingData = await versionManager.loadWorkingData();
        if (!workingData) {
          return json({ error: "Working data not found" }, { status: 404 });
        }
        
        // isDirty 상태 업데이트
        await versionManager.saveWorkingData({
          ...workingData,
          isDirty: true
        });
        
        console.log(`[DirtyState] Marked ${templateId} as dirty (${changeType})`);
        
        return json({ 
          success: true, 
          message: "Marked as dirty",
          changeType
        });
      }
      
      case 'markClean': {
        // 버전 생성 후 호출됨
        const workingData = await versionManager.loadWorkingData();
        if (!workingData) {
          return json({ error: "Working data not found" }, { status: 404 });
        }
        
        await versionManager.saveWorkingData({
          ...workingData,
          isDirty: false
        });
        
        console.log(`[DirtyState] Marked ${templateId} as clean`);
        
        return json({ 
          success: true, 
          message: "Marked as clean"
        });
      }
      
      case 'checkDirty': {
        // isDirty 상태 확인
        const workingData = await versionManager.loadWorkingData();
        if (!workingData) {
          return json({ error: "Working data not found" }, { status: 404 });
        }
        
        return json({ 
          success: true,
          isDirty: workingData.isDirty,
          lastModified: workingData.lastModified
        });
      }
      
      default:
        return json({ error: "Invalid operation" }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating dirty state:', error);
    return json({ 
      error: "Failed to update dirty state", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}