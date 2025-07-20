import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { ThemeScanner } from './theme-scanner.server';

export interface TemplateChangeEvent {
  type: 'added' | 'removed' | 'modified';
  templateId: string;
  path: string;
  timestamp: Date;
}

export class TemplateWatcher extends EventEmitter {
  private themesPath: string;
  private dataPath: string;
  private scanner: ThemeScanner;
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private knownTemplates: Set<string> = new Set();
  private isWatching = false;

  constructor(themesPath: string, dataPath: string) {
    super();
    this.themesPath = themesPath;
    this.dataPath = dataPath;
    this.scanner = new ThemeScanner(themesPath, dataPath);
  }

  async startWatching(): Promise<void> {
    if (this.isWatching) {
      return;
    }

    console.log('[TemplateWatcher] Starting template folder monitoring...');
    
    try {
      // 초기 템플릿 목록 로드
      await this.loadInitialTemplates();
      
      // 메인 themes 폴더 감시
      await this.watchThemesDirectory();
      
      this.isWatching = true;
      console.log(`[TemplateWatcher] Now watching ${this.themesPath} for changes`);
      
      this.emit('watchingStarted', {
        path: this.themesPath,
        knownTemplates: Array.from(this.knownTemplates)
      });
    } catch (error) {
      console.error('[TemplateWatcher] Failed to start watching:', error);
      throw error;
    }
  }

  stopWatching(): void {
    if (!this.isWatching) {
      return;
    }

    console.log('[TemplateWatcher] Stopping template folder monitoring...');
    
    // 모든 watcher 정리
    this.watchers.forEach((watcher, path) => {
      watcher.close();
      console.log(`[TemplateWatcher] Stopped watching: ${path}`);
    });
    
    this.watchers.clear();
    this.isWatching = false;
    
    this.emit('watchingStopped');
  }

  private async loadInitialTemplates(): Promise<void> {
    try {
      const themes = await this.scanner.scanThemes();
      themes.forEach(theme => {
        this.knownTemplates.add(theme.id);
      });
      
      console.log(`[TemplateWatcher] Loaded ${this.knownTemplates.size} existing templates`);
    } catch (error) {
      console.error('[TemplateWatcher] Error loading initial templates:', error);
    }
  }

  private async watchThemesDirectory(): Promise<void> {
    try {
      // themes 디렉토리가 존재하는지 확인
      await fs.promises.access(this.themesPath);
    } catch (error) {
      console.warn(`[TemplateWatcher] Themes directory does not exist: ${this.themesPath}`);
      return;
    }

    const watcher = fs.watch(this.themesPath, { recursive: false }, async (eventType, filename) => {
      if (!filename) return;

      const fullPath = path.join(this.themesPath, filename);
      
      try {
        const stats = await fs.promises.stat(fullPath);
        
        if (stats.isDirectory()) {
          await this.handleDirectoryChange(eventType, filename, fullPath);
        }
      } catch (error) {
        // 파일/폴더가 삭제된 경우
        if (eventType === 'rename') {
          await this.handleTemplateRemoved(filename);
        }
      }
    });

    this.watchers.set(this.themesPath, watcher);

    // 기존 템플릿 폴더들도 개별적으로 감시
    const entries = await fs.promises.readdir(this.themesPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await this.watchTemplateDirectory(entry.name);
      }
    }
  }

  private async watchTemplateDirectory(templateId: string): Promise<void> {
    const templatePath = path.join(this.themesPath, templateId);
    
    try {
      const watcher = fs.watch(templatePath, { recursive: true }, async (eventType, filename) => {
        if (!filename) return;

        // index.html이나 theme.json 변경 시 재분석 트리거
        if (filename === 'index.html' || filename === 'theme.json') {
          console.log(`[TemplateWatcher] Key file changed in ${templateId}: ${filename}`);
          
          await this.handleTemplateModified(templateId, templatePath);
        }
      });

      this.watchers.set(templatePath, watcher);
      console.log(`[TemplateWatcher] Started watching template directory: ${templateId}`);
    } catch (error) {
      console.error(`[TemplateWatcher] Failed to watch template directory ${templateId}:`, error);
    }
  }

  private async handleDirectoryChange(eventType: string, dirname: string, fullPath: string): Promise<void> {
    console.log(`[TemplateWatcher] Directory change detected: ${eventType} - ${dirname}`);

    if (eventType === 'rename') {
      try {
        // 디렉토리가 새로 생성되었는지 확인
        await fs.promises.access(fullPath);
        
        if (!this.knownTemplates.has(dirname)) {
          await this.handleTemplateAdded(dirname, fullPath);
        }
      } catch (error) {
        // 디렉토리가 삭제된 경우
        if (this.knownTemplates.has(dirname)) {
          await this.handleTemplateRemoved(dirname);
        }
      }
    }
  }

  private async handleTemplateAdded(templateId: string, templatePath: string): Promise<void> {
    console.log(`[TemplateWatcher] New template detected: ${templateId}`);
    
    // 잠시 대기 (파일 복사가 완료될 때까지)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // 템플릿 정보 스캔
      const themeInfo = await this.scanner.scanTheme(templateId);
      
      if (themeInfo) {
        this.knownTemplates.add(templateId);
        
        // 새 템플릿 디렉토리 감시 시작
        await this.watchTemplateDirectory(templateId);
        
        const event: TemplateChangeEvent = {
          type: 'added',
          templateId,
          path: templatePath,
          timestamp: new Date()
        };
        
        this.emit('templateAdded', event);
        this.emit('templateChange', event);
        
        console.log(`[TemplateWatcher] Template added and now being watched: ${templateId}`);
      }
    } catch (error) {
      console.error(`[TemplateWatcher] Error processing new template ${templateId}:`, error);
    }
  }

  private async handleTemplateRemoved(templateId: string): Promise<void> {
    console.log(`[TemplateWatcher] Template removed: ${templateId}`);
    
    if (this.knownTemplates.has(templateId)) {
      this.knownTemplates.delete(templateId);
      
      // 해당 템플릿의 watcher 정리
      const templatePath = path.join(this.themesPath, templateId);
      const watcher = this.watchers.get(templatePath);
      if (watcher) {
        watcher.close();
        this.watchers.delete(templatePath);
      }
      
      const event: TemplateChangeEvent = {
        type: 'removed',
        templateId,
        path: templatePath,
        timestamp: new Date()
      };
      
      this.emit('templateRemoved', event);
      this.emit('templateChange', event);
      
      console.log(`[TemplateWatcher] Template watcher removed: ${templateId}`);
    }
  }

  private async handleTemplateModified(templateId: string, templatePath: string): Promise<void> {
    console.log(`[TemplateWatcher] Template modified: ${templateId}`);
    
    const event: TemplateChangeEvent = {
      type: 'modified',
      templateId,
      path: templatePath,
      timestamp: new Date()
    };
    
    this.emit('templateModified', event);
    this.emit('templateChange', event);
  }

  // 현재 감시 상태 조회
  getWatchingStatus() {
    return {
      isWatching: this.isWatching,
      knownTemplates: Array.from(this.knownTemplates),
      watchedPaths: Array.from(this.watchers.keys())
    };
  }

  // 특정 템플릿 강제 재스캔
  async forceRescan(templateId?: string): Promise<void> {
    if (templateId) {
      console.log(`[TemplateWatcher] Force rescanning template: ${templateId}`);
      const themeInfo = await this.scanner.scanTheme(templateId);
      if (themeInfo) {
        await this.handleTemplateModified(templateId, themeInfo.path);
      }
    } else {
      console.log('[TemplateWatcher] Force rescanning all templates');
      await this.loadInitialTemplates();
      
      // 모든 알려진 템플릿에 대해 변경 이벤트 발생
      for (const templateId of this.knownTemplates) {
        const templatePath = path.join(this.themesPath, templateId);
        await this.handleTemplateModified(templateId, templatePath);
      }
    }
  }
}

// 글로벌 watcher 인스턴스 (싱글톤)
let globalWatcher: TemplateWatcher | null = null;

export function getTemplateWatcher(themesPath: string, dataPath: string): TemplateWatcher {
  if (!globalWatcher) {
    globalWatcher = new TemplateWatcher(themesPath, dataPath);
  }
  return globalWatcher;
}

export function stopGlobalWatcher(): void {
  if (globalWatcher) {
    globalWatcher.stopWatching();
    globalWatcher = null;
  }
}