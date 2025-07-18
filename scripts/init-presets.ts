// 프리셋 초기화 스크립트 - Phase 3 Day 7-3
import { PresetManager } from '../app/utils/preset-manager';

async function initializePresets() {
  console.log('프리셋 시스템 초기화 시작...');
  
  try {
    const manager = new PresetManager();
    await manager.initialize();
    
    console.log('프리셋 초기화 완료!');
    
    // 생성된 프리셋 확인
    const allPresets = manager.getAllPresets();
    console.log(`\n총 ${allPresets.length}개의 프리셋이 로드되었습니다:`);
    
    allPresets.forEach(preset => {
      console.log(`- ${preset.name} (${preset.id})`);
    });
    
  } catch (error) {
    console.error('프리셋 초기화 실패:', error);
  }
}

// 스크립트 실행
initializePresets();