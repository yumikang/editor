// 컬러 프리셋 API 엔드포인트 - Phase 3
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { PresetManager } from '~/utils/preset-manager';
import type { ColorPreset } from '~/types/color-system';

// 전역 프리셋 관리자 인스턴스
let presetManager: PresetManager | null = null;

async function getPresetManager(): Promise<PresetManager> {
  if (!presetManager) {
    presetManager = new PresetManager();
    await presetManager.initialize();
  }
  return presetManager;
}

// GET: 모든 프리셋 조회
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchQuery = url.searchParams.get('search');
  const presetId = url.searchParams.get('id');
  
  try {
    const manager = await getPresetManager();
    
    // 특정 프리셋 조회
    if (presetId) {
      const preset = manager.getPreset(presetId);
      if (!preset) {
        return json({ error: "Preset not found" }, { status: 404 });
      }
      return json({ success: true, preset });
    }
    
    // 검색 또는 전체 목록
    const presets = searchQuery 
      ? manager.searchPresets(searchQuery)
      : manager.getAllPresets();
    
    return json({ 
      success: true, 
      presets,
      count: presets.length
    });
  } catch (error) {
    console.error('Error loading presets:', error);
    return json({ 
      error: "Failed to load presets", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST: 프리셋 생성/업데이트/삭제
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST' && request.method !== 'DELETE') {
    return json({ error: "Method not allowed" }, { status: 405 });
  }
  
  try {
    const manager = await getPresetManager();
    const formData = await request.formData();
    const operation = formData.get('operation') as string;
    
    switch (operation) {
      case 'create': {
        const presetData = formData.get('preset') as string;
        if (!presetData) {
          return json({ error: "Preset data is required" }, { status: 400 });
        }
        
        const preset = JSON.parse(presetData) as ColorPreset;
        preset.id = `custom-${Date.now()}`;
        preset.createdAt = new Date();
        preset.updatedAt = new Date();
        
        await manager.savePreset(preset);
        
        return json({ 
          success: true, 
          message: "Preset created",
          preset
        });
      }
      
      case 'update': {
        const presetId = formData.get('id') as string;
        const updates = formData.get('updates') as string;
        
        if (!presetId || !updates) {
          return json({ error: "Preset ID and updates are required" }, { status: 400 });
        }
        
        const updateData = JSON.parse(updates) as Partial<ColorPreset>;
        const updated = await manager.updatePreset(presetId, updateData);
        
        return json({ 
          success: true, 
          message: "Preset updated",
          preset: updated
        });
      }
      
      case 'delete': {
        const presetId = formData.get('id') as string;
        if (!presetId) {
          return json({ error: "Preset ID is required" }, { status: 400 });
        }
        
        await manager.deletePreset(presetId);
        
        return json({ 
          success: true, 
          message: "Preset deleted"
        });
      }
      
      case 'duplicate': {
        const presetId = formData.get('id') as string;
        const newName = formData.get('name') as string;
        
        if (!presetId || !newName) {
          return json({ error: "Preset ID and new name are required" }, { status: 400 });
        }
        
        const duplicate = await manager.duplicatePreset(presetId, newName);
        
        return json({ 
          success: true, 
          message: "Preset duplicated",
          preset: duplicate
        });
      }
      
      case 'import': {
        const jsonData = formData.get('data') as string;
        if (!jsonData) {
          return json({ error: "JSON data is required" }, { status: 400 });
        }
        
        const imported = await manager.importPreset(jsonData);
        
        return json({ 
          success: true, 
          message: "Preset imported",
          preset: imported
        });
      }
      
      case 'export': {
        const presetId = formData.get('id') as string;
        if (!presetId) {
          return json({ error: "Preset ID is required" }, { status: 400 });
        }
        
        const exportData = manager.exportPreset(presetId);
        
        return json({ 
          success: true,
          data: exportData
        });
      }
      
      default:
        return json({ error: "Invalid operation" }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing preset operation:', error);
    return json({ 
      error: "Failed to process preset operation", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}