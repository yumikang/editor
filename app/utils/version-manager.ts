import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';

export interface VersionMetadata {
  id: string;
  version: string;
  timestamp: Date;
  description: string;
  changes: {
    texts: number;
    styles: number;
    media: number;
  };
  checksum: string;
  parentVersion?: string;
}

export interface VersionHistory {
  templateId: string;
  versions: VersionMetadata[];
  currentVersion: string | null;
  originalBackupDate: Date;
  latestVersion: string;
}

export interface WorkingData {
  templateId: string;
  lastModified: Date;
  texts: Record<string, string>;
  images: Record<string, string>;
  styles?: Record<string, unknown>;
  isDirty: boolean;
}

export interface OriginalData {
  templateId: string;
  analyzedAt: Date;
  htmlFile: string;
  texts: Array<{
    id: string;
    selector: string;
    originalContent: string;
    section: string;
    context: string;
  }>;
  images: Array<{
    id: string;
    selector: string;
    originalPath: string;
    section: string;
    attributes: Record<string, string>;
  }>;
  checksum: string;
}

export class VersionManager {
  private templateId: string;
  private basePath: string;
  private originalPath: string;
  private workingPath: string;
  private versionsPath: string;
  private historyPath: string;

  constructor(templateId: string, basePath: string) {
    this.templateId = templateId;
    this.basePath = basePath;
    this.originalPath = path.join(basePath, templateId, 'original');
    this.workingPath = path.join(basePath, templateId, 'working');
    this.versionsPath = path.join(basePath, templateId, 'versions');
    this.historyPath = path.join(this.versionsPath, 'version-history.json');
  }

  // 초기화: 폴더 구조 생성 및 원본 백업
  async initialize(): Promise<void> {
    console.log(`[VersionManager] Initializing version management for ${this.templateId}`);
    
    // 필요한 폴더들 생성
    await fs.mkdir(this.originalPath, { recursive: true });
    await fs.mkdir(this.workingPath, { recursive: true });
    await fs.mkdir(this.versionsPath, { recursive: true });
    
    // 기존 original-content.json을 original 폴더로 이동
    const legacyOriginalPath = path.join(this.basePath, this.templateId, 'original-content.json');
    const newOriginalPath = path.join(this.originalPath, 'content.json');
    
    try {
      await fs.access(legacyOriginalPath);
      await fs.copyFile(legacyOriginalPath, newOriginalPath);
      console.log(`[VersionManager] Migrated original content to ${newOriginalPath}`);
    } catch (error) {
      console.log(`[VersionManager] No legacy original content found for ${this.templateId}`);
    }
    
    // 기존 current-content.json을 working 폴더로 이동
    const legacyCurrentPath = path.join(this.basePath, this.templateId, 'current-content.json');
    const newWorkingPath = path.join(this.workingPath, 'content.json');
    
    try {
      await fs.access(legacyCurrentPath);
      await fs.copyFile(legacyCurrentPath, newWorkingPath);
      console.log(`[VersionManager] Migrated working content to ${newWorkingPath}`);
    } catch (error) {
      // working 파일이 없으면 original에서 복사
      try {
        await fs.copyFile(newOriginalPath, newWorkingPath);
        console.log(`[VersionManager] Initialized working content from original`);
      } catch (error) {
        console.error(`[VersionManager] Failed to initialize working content:`, error);
      }
    }
    
    // 버전 히스토리 초기화
    await this.initializeVersionHistory();
  }

  // 버전 히스토리 초기화
  private async initializeVersionHistory(): Promise<void> {
    try {
      await fs.access(this.historyPath);
      console.log(`[VersionManager] Version history already exists for ${this.templateId}`);
    } catch (error) {
      // 히스토리 파일이 없으면 생성
      const initialHistory: VersionHistory = {
        templateId: this.templateId,
        versions: [],
        currentVersion: null,
        originalBackupDate: new Date(),
        latestVersion: '0.0.0'
      };
      
      await fs.writeFile(
        this.historyPath,
        JSON.stringify(initialHistory, null, 2),
        'utf-8'
      );
      
      console.log(`[VersionManager] Created initial version history for ${this.templateId}`);
    }
  }

  // 원본 데이터 로드
  async loadOriginalData(): Promise<OriginalData | null> {
    try {
      const originalPath = path.join(this.originalPath, 'content.json');
      const content = await fs.readFile(originalPath, 'utf-8');
      const data = JSON.parse(content);
      
      // 체크섬 계산
      const checksum = this.calculateChecksum(data);
      
      return {
        ...data,
        analyzedAt: new Date(data.analyzedAt),
        checksum
      };
    } catch (error) {
      console.error(`[VersionManager] Failed to load original data for ${this.templateId}:`, error);
      return null;
    }
  }

  // 작업 데이터 로드
  async loadWorkingData(): Promise<WorkingData | null> {
    try {
      const workingPath = path.join(this.workingPath, 'content.json');
      const content = await fs.readFile(workingPath, 'utf-8');
      const data = JSON.parse(content);
      
      return {
        ...data,
        lastModified: new Date(data.lastModified),
        isDirty: true // 로드 시점에서는 항상 dirty로 간주
      };
    } catch (error) {
      console.error(`[VersionManager] Failed to load working data for ${this.templateId}:`, error);
      return null;
    }
  }

  // 작업 데이터 저장
  async saveWorkingData(data: Partial<WorkingData>): Promise<void> {
    try {
      const workingPath = path.join(this.workingPath, 'content.json');
      const currentData = await this.loadWorkingData() || {
        templateId: this.templateId,
        lastModified: new Date(),
        texts: {},
        images: {},
        isDirty: false
      };
      
      const updatedData: WorkingData = {
        ...currentData,
        ...data,
        lastModified: new Date(),
        isDirty: true
      };
      
      await fs.writeFile(
        workingPath,
        JSON.stringify(updatedData, null, 2),
        'utf-8'
      );
      
      console.log(`[VersionManager] Saved working data for ${this.templateId}`);
    } catch (error) {
      console.error(`[VersionManager] Failed to save working data for ${this.templateId}:`, error);
      throw error;
    }
  }

  // 버전 히스토리 로드
  async loadVersionHistory(): Promise<VersionHistory> {
    try {
      const content = await fs.readFile(this.historyPath, 'utf-8');
      const history = JSON.parse(content);
      
      // Date 객체로 변환
      history.originalBackupDate = new Date(history.originalBackupDate);
      history.versions = history.versions.map((v: VersionMetadata) => ({
        ...v,
        timestamp: new Date(v.timestamp)
      }));
      
      return history;
    } catch (error) {
      console.error(`[VersionManager] Failed to load version history for ${this.templateId}:`, error);
      throw error;
    }
  }

  // 새 버전 생성
  async createVersion(description: string): Promise<VersionMetadata> {
    console.log(`[VersionManager] Creating new version for ${this.templateId}: ${description}`);
    
    const history = await this.loadVersionHistory();
    const workingData = await this.loadWorkingData();
    const originalData = await this.loadOriginalData();
    
    if (!workingData) {
      throw new Error('Working data not found');
    }
    
    // 새 버전 번호 생성
    const newVersion = this.incrementVersion(history.latestVersion);
    
    // 변경사항 계산
    const changes = this.calculateChanges(workingData, originalData);
    
    // 체크섬 계산
    const checksum = this.calculateChecksum(workingData);
    
    // 버전 메타데이터 생성
    const versionMetadata: VersionMetadata = {
      id: `${this.templateId}_${newVersion}`,
      version: newVersion,
      timestamp: new Date(),
      description,
      changes,
      checksum,
      parentVersion: history.currentVersion || undefined
    };
    
    // 버전 폴더 생성 및 데이터 저장
    const versionFolderPath = path.join(this.versionsPath, `v${newVersion}`);
    await fs.mkdir(versionFolderPath, { recursive: true });
    
    await fs.writeFile(
      path.join(versionFolderPath, 'content.json'),
      JSON.stringify(workingData, null, 2),
      'utf-8'
    );
    
    await fs.writeFile(
      path.join(versionFolderPath, 'metadata.json'),
      JSON.stringify(versionMetadata, null, 2),
      'utf-8'
    );
    
    // 히스토리 업데이트
    history.versions.push(versionMetadata);
    history.currentVersion = newVersion;
    history.latestVersion = newVersion;
    
    await fs.writeFile(
      this.historyPath,
      JSON.stringify(history, null, 2),
      'utf-8'
    );
    
    // 작업 데이터를 clean 상태로 마크
    workingData.isDirty = false;
    await this.saveWorkingData(workingData);
    
    console.log(`[VersionManager] Created version ${newVersion} for ${this.templateId}`);
    return versionMetadata;
  }

  // 특정 버전으로 복원
  async restoreVersion(version: string): Promise<void> {
    console.log(`[VersionManager] Restoring version ${version} for ${this.templateId}`);
    
    const versionFolderPath = path.join(this.versionsPath, `v${version}`);
    const versionContentPath = path.join(versionFolderPath, 'content.json');
    
    try {
      // 버전 데이터 로드
      const content = await fs.readFile(versionContentPath, 'utf-8');
      const versionData = JSON.parse(content);
      
      // working 폴더로 복사
      const workingPath = path.join(this.workingPath, 'content.json');
      await fs.writeFile(workingPath, content, 'utf-8');
      
      // 히스토리 업데이트
      const history = await this.loadVersionHistory();
      history.currentVersion = version;
      
      await fs.writeFile(
        this.historyPath,
        JSON.stringify(history, null, 2),
        'utf-8'
      );
      
      console.log(`[VersionManager] Restored version ${version} for ${this.templateId}`);
    } catch (error) {
      console.error(`[VersionManager] Failed to restore version ${version} for ${this.templateId}:`, error);
      throw error;
    }
  }

  // 원본으로 리셋
  async resetToOriginal(): Promise<void> {
    console.log(`[VersionManager] Resetting to original for ${this.templateId}`);
    
    const originalPath = path.join(this.originalPath, 'content.json');
    const workingPath = path.join(this.workingPath, 'content.json');
    
    try {
      await fs.copyFile(originalPath, workingPath);
      
      // 히스토리 업데이트
      const history = await this.loadVersionHistory();
      history.currentVersion = null;
      
      await fs.writeFile(
        this.historyPath,
        JSON.stringify(history, null, 2),
        'utf-8'
      );
      
      console.log(`[VersionManager] Reset to original for ${this.templateId}`);
    } catch (error) {
      console.error(`[VersionManager] Failed to reset to original for ${this.templateId}:`, error);
      throw error;
    }
  }

  // 버전 번호 증가
  private incrementVersion(currentVersion: string): string {
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  // 변경사항 계산
  private calculateChanges(workingData: WorkingData, originalData: OriginalData | null): {
    texts: number;
    styles: number;
    media: number;
  } {
    if (!originalData) {
      return {
        texts: Object.keys(workingData.texts || {}).length,
        styles: Object.keys(workingData.styles || {}).length,
        media: Object.keys(workingData.images || {}).length
      };
    }
    
    const originalTexts = originalData.texts.reduce((acc, text) => {
      acc[text.id] = text.originalContent;
      return acc;
    }, {} as Record<string, string>);
    
    const originalImages = originalData.images.reduce((acc, img) => {
      acc[img.id] = img.originalPath;
      return acc;
    }, {} as Record<string, string>);
    
    let textChanges = 0;
    let mediaChanges = 0;
    
    // 텍스트 변경사항 계산
    Object.entries(workingData.texts || {}).forEach(([id, content]) => {
      if (originalTexts[id] !== content) {
        textChanges++;
      }
    });
    
    // 이미지 변경사항 계산
    Object.entries(workingData.images || {}).forEach(([id, path]) => {
      if (originalImages[id] !== path) {
        mediaChanges++;
      }
    });
    
    return {
      texts: textChanges,
      styles: Object.keys(workingData.styles || {}).length,
      media: mediaChanges
    };
  }

  // 체크섬 계산
  private calculateChecksum(data: unknown): string {
    const content = JSON.stringify(data, Object.keys(data as object).sort());
    return createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  // 버전 삭제
  async deleteVersion(version: string): Promise<void> {
    console.log(`[VersionManager] Deleting version ${version} for ${this.templateId}`);
    
    const versionFolderPath = path.join(this.versionsPath, `v${version}`);
    
    try {
      await fs.rm(versionFolderPath, { recursive: true, force: true });
      
      // 히스토리에서 제거
      const history = await this.loadVersionHistory();
      history.versions = history.versions.filter(v => v.version !== version);
      
      // 현재 버전이 삭제된 버전이면 null로 설정
      if (history.currentVersion === version) {
        history.currentVersion = null;
      }
      
      await fs.writeFile(
        this.historyPath,
        JSON.stringify(history, null, 2),
        'utf-8'
      );
      
      console.log(`[VersionManager] Deleted version ${version} for ${this.templateId}`);
    } catch (error) {
      console.error(`[VersionManager] Failed to delete version ${version} for ${this.templateId}:`, error);
      throw error;
    }
  }

  // 버전 비교
  async compareVersions(version1: string, version2: string): Promise<{
    differences: {
      texts: { id: string; before: string; after: string; }[];
      images: { id: string; before: string; after: string; }[];
    };
  }> {
    const v1Data = await this.loadVersionData(version1);
    const v2Data = await this.loadVersionData(version2);
    
    if (!v1Data || !v2Data) {
      throw new Error('Version data not found');
    }
    
    const textDifferences: { id: string; before: string; after: string; }[] = [];
    const imageDifferences: { id: string; before: string; after: string; }[] = [];
    
    // 텍스트 차이점 찾기
    const allTextIds = new Set([
      ...Object.keys(v1Data.texts || {}),
      ...Object.keys(v2Data.texts || {})
    ]);
    
    allTextIds.forEach(id => {
      const before = v1Data.texts?.[id] || '';
      const after = v2Data.texts?.[id] || '';
      if (before !== after) {
        textDifferences.push({ id, before, after });
      }
    });
    
    // 이미지 차이점 찾기
    const allImageIds = new Set([
      ...Object.keys(v1Data.images || {}),
      ...Object.keys(v2Data.images || {})
    ]);
    
    allImageIds.forEach(id => {
      const before = v1Data.images?.[id] || '';
      const after = v2Data.images?.[id] || '';
      if (before !== after) {
        imageDifferences.push({ id, before, after });
      }
    });
    
    return {
      differences: {
        texts: textDifferences,
        images: imageDifferences
      }
    };
  }

  // 특정 버전 데이터 로드
  private async loadVersionData(version: string): Promise<WorkingData | null> {
    try {
      if (version === 'original') {
        const originalData = await this.loadOriginalData();
        if (!originalData) return null;
        
        return {
          templateId: this.templateId,
          lastModified: originalData.analyzedAt,
          texts: originalData.texts.reduce((acc, text) => {
            acc[text.id] = text.originalContent;
            return acc;
          }, {} as Record<string, string>),
          images: originalData.images.reduce((acc, img) => {
            acc[img.id] = img.originalPath;
            return acc;
          }, {} as Record<string, string>),
          isDirty: false
        };
      }
      
      if (version === 'working') {
        return await this.loadWorkingData();
      }
      
      const versionPath = path.join(this.versionsPath, `v${version}`, 'content.json');
      const content = await fs.readFile(versionPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`[VersionManager] Failed to load version data for ${version}:`, error);
      return null;
    }
  }
}