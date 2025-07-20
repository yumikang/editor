import * as fs from 'fs/promises';
import * as path from 'path';

export interface TextData {
  [section: string]: {
    [key: string]: {
      korean: string;
      english: string;
      location?: string;
    };
  };
}

export class JsonStorage {
  private dataPath: string;
  private cache: TextData | null = null;

  constructor(dataPath: string) {
    this.dataPath = dataPath;
  }

  async read(): Promise<TextData> {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      const parsed = JSON.parse(data);
      this.cache = parsed;
      return parsed;
    } catch (error) {
      console.error(`Failed to read JSON file at ${this.dataPath}:`, error);
      // 파일이 없으면 빈 객체 반환
      return {};
    }
  }

  async write(data: TextData, createVersion: boolean = false): Promise<void> {
    this.cache = data;
    const jsonStr = JSON.stringify(data, null, 2);
    
    // 백업 생성
    try {
      await fs.copyFile(this.dataPath, `${this.dataPath}.backup`);
    } catch {
      // 백업 실패해도 계속 진행
    }
    
    // 버전 생성 (선택적)
    if (createVersion) {
      await this.createVersion(data);
    }
    
    await fs.writeFile(this.dataPath, jsonStr, 'utf-8');
  }

  async update(section: string, key: string, value: Partial<TextData[string][string]>): Promise<void> {
    const data = await this.read();
    
    if (!data[section]) {
      data[section] = {};
    }
    
    if (!data[section][key]) {
      data[section][key] = {
        korean: '',
        english: '',
      };
    }
    
    data[section][key] = {
      ...data[section][key],
      ...value,
    };
    
    await this.write(data);
  }

  async updateBatch(updates: Array<{
    section: string;
    key: string;
    value: Partial<TextData[string][string]>;
  }>): Promise<void> {
    const data = await this.read();
    
    for (const update of updates) {
      if (!data[update.section]) {
        data[update.section] = {};
      }
      
      if (!data[update.section][update.key]) {
        data[update.section][update.key] = {
          korean: '',
          english: '',
        };
      }
      
      data[update.section][update.key] = {
        ...data[update.section][update.key],
        ...update.value,
      };
    }
    
    await this.write(data);
  }

  async getSection(section: string): Promise<TextData[string] | null> {
    const data = await this.read();
    return data[section] || null;
  }

  async getSectionKeys(section: string): Promise<string[]> {
    const sectionData = await this.getSection(section);
    return sectionData ? Object.keys(sectionData) : [];
  }

  // 버전 생성
  async createVersion(data: TextData): Promise<string> {
    const versionsDir = path.join(path.dirname(this.dataPath), 'versions');
    
    // versions 디렉토리 생성
    try {
      await fs.mkdir(versionsDir, { recursive: true });
    } catch {
      // 이미 존재하면 무시
    }
    
    // 타임스탬프 생성
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const versionFileName = `version-${timestamp}.json`;
    const versionPath = path.join(versionsDir, versionFileName);
    
    // 버전 데이터 저장
    const versionData = {
      timestamp: new Date().toISOString(),
      data: data,
      metadata: {
        totalSections: Object.keys(data).length,
        totalItems: Object.values(data).reduce((sum, section) => sum + Object.keys(section).length, 0)
      }
    };
    
    await fs.writeFile(versionPath, JSON.stringify(versionData, null, 2));
    
    return versionFileName;
  }
  
  // 버전 목록 가져오기
  async getVersions(): Promise<Array<{
    filename: string;
    timestamp: string;
    metadata: any;
  }>> {
    const versionsDir = path.join(path.dirname(this.dataPath), 'versions');
    
    try {
      const files = await fs.readdir(versionsDir);
      const versions = [];
      
      for (const file of files) {
        if (file.startsWith('version-') && file.endsWith('.json')) {
          try {
            const content = await fs.readFile(path.join(versionsDir, file), 'utf-8');
            const data = JSON.parse(content);
            versions.push({
              filename: file,
              timestamp: data.timestamp,
              metadata: data.metadata
            });
          } catch {
            // 파일 읽기 실패 시 무시
          }
        }
      }
      
      // 최신 순으로 정렬
      return versions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      return [];
    }
  }
  
  // 특정 버전 로드
  async loadVersion(filename: string): Promise<TextData | null> {
    const versionsDir = path.join(path.dirname(this.dataPath), 'versions');
    const versionPath = path.join(versionsDir, filename);
    
    try {
      const content = await fs.readFile(versionPath, 'utf-8');
      const versionData = JSON.parse(content);
      return versionData.data;
    } catch {
      return null;
    }
  }
  
  // 변경 이력 추적
  async saveHistory(change: any): Promise<void> {
    const historyPath = `${this.dataPath}.history`;
    const timestamp = new Date().toISOString();
    const entry = { timestamp, ...change };
    
    try {
      const existing = await fs.readFile(historyPath, 'utf-8');
      const history = JSON.parse(existing);
      history.push(entry);
      
      // 최근 100개만 유지
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
      
      await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
    } catch {
      // 히스토리 파일이 없으면 새로 생성
      await fs.writeFile(historyPath, JSON.stringify([entry], null, 2));
    }
  }
}

// 싱글톤 인스턴스
let storageInstance: JsonStorage | null = null;

export function getJsonStorage(dataPath: string): JsonStorage {
  // 매번 새로운 인스턴스를 생성하여 캐시 문제 방지
  return new JsonStorage(dataPath);
}