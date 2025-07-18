// 프리셋 CRUD 테스트 스크립트 - Phase 3 Day 7-3
import { PresetManager } from '../app/utils/preset-manager';
import type { ColorPreset } from '../app/types/color-system';

async function testPresetCRUD() {
  console.log('=== 프리셋 CRUD 테스트 시작 ===\n');
  
  try {
    const manager = new PresetManager();
    await manager.initialize();
    
    // 1. READ: 기본 프리셋 확인
    console.log('1. 기본 프리셋 로드 확인:');
    const initialPresets = manager.getAllPresets();
    console.log(`   - 로드된 프리셋 수: ${initialPresets.length}`);
    initialPresets.forEach(p => {
      console.log(`   - ${p.name} (${p.id})`);
    });
    
    // 2. CREATE: 새 프리셋 생성
    console.log('\n2. 새 프리셋 생성:');
    const newPreset: ColorPreset = {
      id: `test-${Date.now()}`,
      name: '테스트 프리셋',
      colors: {
        brand: {
          primary: '#FF6B6B',
          secondary: '#4ECDC4'
        },
        semantic: {
          success: '#51CF66',
          warning: '#FFD93D',
          error: '#FF6B6B',
          info: '#339AF0'
        },
        neutral: {
          textPrimary: '#212529',
          textSecondary: '#495057',
          background: '#FFFFFF',
          surface: '#F8F9FA',
          border: '#DEE2E6'
        },
        interaction: {
          hover: '#FF5252',
          active: '#F03E3E',
          focus: '#FF6B6B',
          disabled: '#ADB5BD'
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await manager.savePreset(newPreset);
    console.log(`   - 생성됨: ${newPreset.name} (${newPreset.id})`);
    
    // 3. UPDATE: 프리셋 업데이트
    console.log('\n3. 프리셋 업데이트:');
    const updated = await manager.updatePreset(newPreset.id, {
      name: '업데이트된 테스트 프리셋',
      colors: {
        ...newPreset.colors,
        brand: {
          primary: '#00AAFF',
          secondary: '#FF00AA'
        }
      }
    });
    console.log(`   - 업데이트됨: ${updated.name}`);
    console.log(`   - 새 Primary: ${updated.colors.brand.primary}`);
    
    // 4. DUPLICATE: 프리셋 복제
    console.log('\n4. 프리셋 복제:');
    const duplicated = await manager.duplicatePreset(newPreset.id, '복제된 프리셋');
    console.log(`   - 복제됨: ${duplicated.name} (${duplicated.id})`);
    
    // 5. SEARCH: 프리셋 검색
    console.log('\n5. 프리셋 검색:');
    const searchResults = manager.searchPresets('테스트');
    console.log(`   - "테스트" 검색 결과: ${searchResults.length}개`);
    searchResults.forEach(p => {
      console.log(`     - ${p.name}`);
    });
    
    // 6. DELETE: 프리셋 삭제
    console.log('\n6. 프리셋 삭제:');
    await manager.deletePreset(newPreset.id);
    await manager.deletePreset(duplicated.id);
    console.log('   - 테스트 프리셋 삭제 완료');
    
    // 7. 기본 프리셋 삭제 시도 (실패해야 함)
    console.log('\n7. 기본 프리셋 삭제 시도:');
    try {
      await manager.deletePreset('modern-blue');
      console.log('   - ❌ 기본 프리셋이 삭제됨 (버그!)');
    } catch (error) {
      console.log('   - ✅ 기본 프리셋 삭제 방지됨');
    }
    
    // 8. 최종 상태 확인
    console.log('\n8. 최종 상태:');
    const finalPresets = manager.getAllPresets();
    console.log(`   - 총 프리셋 수: ${finalPresets.length}`);
    
    console.log('\n=== 테스트 완료 ===');
    
  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
  }
}

// 스크립트 실행
testPresetCRUD();