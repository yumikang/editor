// 프리셋 시스템 테스트 페이지 - Phase 3 Day 7-3
import { useState, useEffect } from 'react';
import { PresetManager } from '~/utils/preset-manager.server';
import type { ColorPreset } from '~/types/color-system';

export default function TestPresetSystem() {
  const [presets, setPresets] = useState<ColorPreset[]>([]);
  const [fileList, setFileList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    testPresetSystem();
  }, []);

  const testPresetSystem = async () => {
    try {
      setLoading(true);
      
      // PresetManager 초기화
      const manager = new PresetManager();
      await manager.initialize();
      
      // 모든 프리셋 가져오기
      const allPresets = manager.getAllPresets();
      setPresets(allPresets);
      
      // 파일 시스템 확인
      const response = await fetch('/api/preset/files');
      const data = await response.json();
      if (data.files) {
        setFileList(data.files);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
      setLoading(false);
    }
  };

  const testCreatePreset = async () => {
    try {
      const manager = new PresetManager();
      await manager.initialize();
      
      const testPreset: ColorPreset = {
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
      
      await manager.savePreset(testPreset);
      testPresetSystem(); // 리로드
    } catch (err) {
      setError(err instanceof Error ? err.message : '프리셋 생성 실패');
    }
  };

  const testDeletePreset = async (id: string) => {
    try {
      const manager = new PresetManager();
      await manager.initialize();
      
      await manager.deletePreset(id);
      testPresetSystem(); // 리로드
    } catch (err) {
      setError(err instanceof Error ? err.message : '프리셋 삭제 실패');
    }
  };

  if (loading) return <div className="p-8">로딩 중...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">프리셋 시스템 테스트</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-8">
        {/* 메모리 내 프리셋 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">메모리 내 프리셋 ({presets.length}개)</h2>
          <div className="space-y-3">
            {presets.map(preset => (
              <div key={preset.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{preset.name}</h3>
                    <p className="text-sm text-gray-600">ID: {preset.id}</p>
                  </div>
                  {!preset.id.startsWith('modern-') && 
                   !preset.id.startsWith('warm-') && 
                   !preset.id.startsWith('forest-') && 
                   !preset.id.startsWith('minimal-') && (
                    <button
                      onClick={() => testDeletePreset(preset.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: preset.colors.brand.primary }}
                    title="Primary"
                  />
                  <div 
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: preset.colors.brand.secondary }}
                    title="Secondary"
                  />
                  {preset.colors.semantic && (
                    <>
                      <div 
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: preset.colors.semantic.success }}
                        title="Success"
                      />
                      <div 
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: preset.colors.semantic.error }}
                        title="Error"
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={testCreatePreset}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            테스트 프리셋 생성
          </button>
        </div>
        
        {/* 파일 시스템 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">파일 시스템 ({fileList.length}개 파일)</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">
              경로: app/data/color-presets/
            </p>
            {fileList.length > 0 ? (
              <ul className="space-y-1">
                {fileList.map(file => (
                  <li key={file} className="text-sm font-mono">
                    📄 {file}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">파일 없음</p>
            )}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium mb-2">프리셋 저장 위치 결정</h3>
            <div className="space-y-2 text-sm">
              <div>
                <strong>현재:</strong> 글로벌 (app/data/color-presets/)
              </div>
              <div>
                <strong>장점:</strong> 모든 템플릿에서 프리셋 공유 가능
              </div>
              <div>
                <strong>대안:</strong> 템플릿별 (app/data/themes/{id}/presets/)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}