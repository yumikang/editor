// 프리셋 관리자 - Phase 3
import * as fs from 'fs/promises';
import * as path from 'path';
import type { ColorPreset } from '~/types/color-system';
import { defaultPresets, validatePreset } from './color-presets';

export class PresetManager {
  private presetsPath: string;
  private presets: Map<string, ColorPreset>;

  constructor() {
    this.presetsPath = path.join(
      process.cwd(),
      'app/data/color-presets'
    );
    this.presets = new Map();
  }

  // 프리셋 초기화 및 로드
  async initialize(): Promise<void> {
    // 디렉토리 생성
    await fs.mkdir(this.presetsPath, { recursive: true });
    
    // 🆕 기본 프리셋을 파일로 저장 (없는 경우에만)
    for (const preset of defaultPresets) {
      const filePath = path.join(this.presetsPath, `${preset.id}.json`);
      try {
        await fs.access(filePath);
        // 파일이 이미 존재함
      } catch {
        // 파일이 없으므로 저장
        await fs.writeFile(filePath, JSON.stringify(preset, null, 2));
        console.log(`[PresetManager] Saved default preset to file: ${preset.id}`);
      }
      this.presets.set(preset.id, preset);
    }
    
    // 사용자 프리셋 로드
    await this.loadUserPresets();
  }

  // 사용자 프리셋 로드
  private async loadUserPresets(): Promise<void> {
    try {
      const files = await fs.readdir(this.presetsPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.presetsPath, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const preset = JSON.parse(data) as ColorPreset;
          
          // 날짜 문자열을 Date 객체로 변환
          preset.createdAt = new Date(preset.createdAt);
          preset.updatedAt = new Date(preset.updatedAt);
          
          if (validatePreset(preset)) {
            this.presets.set(preset.id, preset);
          }
        } catch (error) {
          console.error(`Failed to load preset ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to load user presets:', error);
    }
  }

  // 모든 프리셋 가져오기
  getAllPresets(): ColorPreset[] {
    return Array.from(this.presets.values()).sort((a, b) => {
      // 기본 프리셋을 먼저, 그 다음 최신 순
      const aIsDefault = defaultPresets.some(p => p.id === a.id);
      const bIsDefault = defaultPresets.some(p => p.id === b.id);
      
      if (aIsDefault && !bIsDefault) return -1;
      if (!aIsDefault && bIsDefault) return 1;
      
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }

  // 프리셋 가져오기
  getPreset(id: string): ColorPreset | undefined {
    return this.presets.get(id);
  }

  // 프리셋 저장
  async savePreset(preset: ColorPreset): Promise<void> {
    if (!validatePreset(preset)) {
      throw new Error('Invalid preset format');
    }
    
    // 메모리에 저장
    this.presets.set(preset.id, preset);
    
    // 기본 프리셋이 아닌 경우 파일로 저장
    const isDefault = defaultPresets.some(p => p.id === preset.id);
    if (!isDefault) {
      const filePath = path.join(this.presetsPath, `${preset.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(preset, null, 2));
    }
  }

  // 프리셋 삭제
  async deletePreset(id: string): Promise<void> {
    // 기본 프리셋은 삭제 불가
    const isDefault = defaultPresets.some(p => p.id === id);
    if (isDefault) {
      throw new Error('Cannot delete default preset');
    }
    
    // 메모리에서 삭제
    this.presets.delete(id);
    
    // 파일 삭제
    try {
      const filePath = path.join(this.presetsPath, `${id}.json`);
      await fs.unlink(filePath);
    } catch (error) {
      // 파일이 없어도 무시
    }
  }

  // 프리셋 업데이트
  async updatePreset(id: string, updates: Partial<ColorPreset>): Promise<ColorPreset> {
    const existing = this.presets.get(id);
    if (!existing) {
      throw new Error('Preset not found');
    }
    
    const updated: ColorPreset = {
      ...existing,
      ...updates,
      id, // ID는 변경 불가
      updatedAt: new Date()
    };
    
    await this.savePreset(updated);
    return updated;
  }

  // 프리셋 복제
  async duplicatePreset(id: string, newName: string): Promise<ColorPreset> {
    const original = this.presets.get(id);
    if (!original) {
      throw new Error('Preset not found');
    }
    
    const duplicate: ColorPreset = {
      ...original,
      id: `custom-${Date.now()}`,
      name: newName,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await this.savePreset(duplicate);
    return duplicate;
  }

  // 프리셋 내보내기 (JSON)
  exportPreset(id: string): string {
    const preset = this.presets.get(id);
    if (!preset) {
      throw new Error('Preset not found');
    }
    
    return JSON.stringify(preset, null, 2);
  }

  // 프리셋 가져오기 (JSON)
  async importPreset(jsonData: string): Promise<ColorPreset> {
    try {
      const preset = JSON.parse(jsonData) as ColorPreset;
      
      // 새 ID 생성 (중복 방지)
      preset.id = `imported-${Date.now()}`;
      preset.createdAt = new Date();
      preset.updatedAt = new Date();
      
      if (!validatePreset(preset)) {
        throw new Error('Invalid preset format');
      }
      
      await this.savePreset(preset);
      return preset;
    } catch (error) {
      throw new Error('Failed to import preset: ' + (error as Error).message);
    }
  }

  // 프리셋 검색
  searchPresets(query: string): ColorPreset[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllPresets().filter(preset => 
      preset.name.toLowerCase().includes(lowerQuery) ||
      preset.id.toLowerCase().includes(lowerQuery)
    );
  }
}