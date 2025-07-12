import * as fs from 'fs/promises';
import * as path from 'path';
import { analyzeHtmlFile, type AnalysisResult } from './html-analyzer';

export interface ThemeInfo {
  id: string;
  name: string;
  path: string;
  hasIndex: boolean;
  hasConfig: boolean;
  htmlFiles: string[];
  analysis?: AnalysisResult;
  metadata?: ThemeMetadata;
  jsonPath?: string;
  indexPath?: string;
}

export interface ThemeMetadata {
  name: string;
  version?: string;
  description?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ThemeAnalysisData {
  themeId: string;
  themeName: string;
  analyzedAt: string;
  elements: Record<string, any>;
  structure: any;
}

export class ThemeScanner {
  private themesPath: string;
  private dataPath: string;

  constructor(themesPath: string, dataPath: string) {
    this.themesPath = themesPath;
    this.dataPath = dataPath;
  }

  // 모든 테마 스캔
  async scanThemes(): Promise<ThemeInfo[]> {
    try {
      console.log(`[ThemeScanner] Starting theme scan from: ${this.themesPath}`);
      console.log(`[ThemeScanner] Data path: ${this.dataPath}`);
      
      await fs.mkdir(this.dataPath, { recursive: true });
      
      const entries = await fs.readdir(this.themesPath, { withFileTypes: true });
      console.log(`[ThemeScanner] Found ${entries.length} entries in themes directory`);
      
      const themes: ThemeInfo[] = [];

      for (const entry of entries) {
        console.log(`[ThemeScanner] Processing entry: ${entry.name}, isDirectory: ${entry.isDirectory()}`);
        if (entry.isDirectory()) {
          const themeInfo = await this.scanTheme(entry.name);
          if (themeInfo) {
            themes.push(themeInfo);
            console.log(`[ThemeScanner] Successfully added theme: ${entry.name}`);
          } else {
            console.log(`[ThemeScanner] Failed to scan theme: ${entry.name}`);
          }
        }
      }

      console.log(`[ThemeScanner] Total themes scanned: ${themes.length}`);
      return themes;
    } catch (error) {
      console.error('Error scanning themes:', error);
      return [];
    }
  }

  // 개별 테마 스캔
  async scanTheme(themeName: string): Promise<ThemeInfo | null> {
    try {
      const themePath = path.join(this.themesPath, themeName);
      console.log(`[ThemeScanner] Scanning theme: ${themeName} at path: ${themePath}`);
      
      const files = await fs.readdir(themePath);
      console.log(`[ThemeScanner] Files found in ${themeName}:`, files);
      
      // HTML 파일 찾기 (루트 및 서브폴더)
      let htmlFiles = files.filter(file => file.endsWith('.html'));
      let hasIndex = htmlFiles.includes('index.html');
      let indexPath = hasIndex ? 'index.html' : null;
      console.log(`[ThemeScanner] Root HTML files: ${htmlFiles.length}, hasIndex: ${hasIndex}`);
      
      // 루트에 index.html이 없으면 light/dark 폴더 확인
      if (!hasIndex) {
        const subDirs = ['light', 'dark'];
        for (const subDir of subDirs) {
          try {
            const subPath = path.join(themePath, subDir);
            console.log(`[ThemeScanner] Checking subdirectory: ${subPath}`);
            const subFiles = await fs.readdir(subPath);
            const subHtmlFiles = subFiles.filter(file => file.endsWith('.html'));
            console.log(`[ThemeScanner] HTML files in ${subDir}: ${subHtmlFiles.length}`);
            
            if (subHtmlFiles.includes('index.html')) {
              hasIndex = true;
              indexPath = `${subDir}/index.html`;
              htmlFiles = [...htmlFiles, ...subHtmlFiles.map(f => `${subDir}/${f}`)];
              console.log(`[ThemeScanner] Found index.html in ${subDir}, indexPath: ${indexPath}`);
              break;
            }
          } catch (error) {
            console.log(`[ThemeScanner] Error checking subdirectory ${subDir}:`, error);
            // 서브 디렉토리가 없으면 무시
          }
        }
      }
      
      // 설정 파일 확인
      const hasConfig = files.includes('theme.json');
      console.log(`[ThemeScanner] Has theme.json: ${hasConfig}`);
      
      // 메타데이터 읽기
      let metadata: ThemeMetadata | undefined;
      if (hasConfig) {
        try {
          const configPath = path.join(themePath, 'theme.json');
          const configContent = await fs.readFile(configPath, 'utf-8');
          metadata = JSON.parse(configContent);
          console.log(`[ThemeScanner] Loaded metadata for ${themeName}:`, metadata.name);
        } catch (error) {
          console.error(`Error reading theme.json for ${themeName}:`, error);
        }
      }

      // 분석 데이터 경로
      const jsonPath = path.join(this.dataPath, `${themeName}-analysis.json`);

      const themeInfo = {
        id: themeName,
        name: metadata?.name || themeName,
        path: themePath,
        hasIndex,
        hasConfig,
        htmlFiles,
        metadata,
        jsonPath,
        indexPath
      };
      
      console.log(`[ThemeScanner] Final theme info for ${themeName}:`, {
        id: themeInfo.id,
        name: themeInfo.name,
        hasIndex: themeInfo.hasIndex,
        hasConfig: themeInfo.hasConfig,
        indexPath: themeInfo.indexPath,
        htmlFilesCount: themeInfo.htmlFiles.length
      });

      return themeInfo;
    } catch (error) {
      console.error(`Error scanning theme ${themeName}:`, error);
      return null;
    }
  }

  // 테마 HTML 분석 및 JSON 생성
  async analyzeTheme(themeInfo: ThemeInfo): Promise<ThemeAnalysisData | null> {
    try {
      if (!themeInfo.hasIndex || !themeInfo.indexPath) {
        throw new Error('No index.html found in theme');
      }

      const indexPath = path.join(themeInfo.path, themeInfo.indexPath);
      const analysis = await analyzeHtmlFile(indexPath);

      // 분석 결과를 구조화된 데이터로 변환
      const analysisData: ThemeAnalysisData = {
        themeId: themeInfo.id,
        themeName: themeInfo.name,
        analyzedAt: new Date().toISOString(),
        elements: this.groupElementsBySection(analysis.elements),
        structure: analysis.structure
      };

      // JSON 파일로 저장
      if (themeInfo.jsonPath) {
        await fs.writeFile(
          themeInfo.jsonPath,
          JSON.stringify(analysisData, null, 2),
          'utf-8'
        );
      }

      // original-content.json 생성
      await this.generateOriginalContent(themeInfo, analysisData);
      
      // current-content.json 생성
      await this.generateCurrentContent(themeInfo, analysisData);

      return analysisData;
    } catch (error) {
      console.error(`Error analyzing theme ${themeInfo.id}:`, error);
      return null;
    }
  }

  // original-content.json 생성
  private async generateOriginalContent(themeInfo: ThemeInfo, analysisData: ThemeAnalysisData) {
    const texts: any[] = [];
    const images: any[] = [];
    
    Object.entries(analysisData.elements).forEach(([section, elements]) => {
      Object.entries(elements).forEach(([key, element]: [string, any]) => {
        if (element.type === 'text') {
          texts.push({
            id: key,
            selector: element.selector,
            originalContent: element.content,
            originalLength: element.content.length,
            maxLength: element.content.length + 50,
            section,
            context: `${section} 섹션의 텍스트`
          });
        } else if (element.type === 'image') {
          images.push({
            id: key,
            selector: element.selector,
            originalPath: element.content,
            section,
            attributes: element.attributes,
            originalSize: { width: 0, height: 0 }, // 실제로는 이미지 크기 분석 필요
            format: element.content.split('.').pop()?.toUpperCase() || 'UNKNOWN'
          });
        }
      });
    });
    
    const originalContent = {
      templateId: themeInfo.id,
      analyzedAt: new Date().toISOString(),
      htmlFile: themeInfo.indexPath || 'index.html',
      texts,
      images,
      statistics: {
        totalTexts: texts.length,
        totalImages: images.length,
        analysisTime: '3.5s'
      }
    };
    
    const originalContentPath = path.join(themeInfo.path, 'original-content.json');
    await fs.writeFile(
      originalContentPath,
      JSON.stringify(originalContent, null, 2),
      'utf-8'
    );
  }

  // current-content.json 생성
  private async generateCurrentContent(themeInfo: ThemeInfo, analysisData: ThemeAnalysisData) {
    const texts: Record<string, string> = {};
    const images: Record<string, string> = {};
    
    Object.entries(analysisData.elements).forEach(([section, elements]) => {
      Object.entries(elements).forEach(([key, element]: [string, any]) => {
        if (element.type === 'text') {
          texts[key] = element.content;
        } else if (element.type === 'image') {
          images[key] = element.content;
        }
      });
    });
    
    const currentContent = {
      templateId: themeInfo.id,
      lastModified: new Date().toISOString(),
      texts,
      images
    };
    
    const currentContentPath = path.join(themeInfo.path, 'current-content.json');
    
    // current-content.json이 이미 존재하면 덮어쓰지 않음
    try {
      await fs.access(currentContentPath);
      console.log(`[ThemeScanner] current-content.json already exists for ${themeInfo.id}, skipping...`);
    } catch {
      // 파일이 없으면 생성
      await fs.writeFile(
        currentContentPath,
        JSON.stringify(currentContent, null, 2),
        'utf-8'
      );
    }
  }

  // 섹션별로 요소 그룹화
  private groupElementsBySection(elements: any[]): Record<string, any> {
    const grouped: Record<string, any> = {};

    elements.forEach(element => {
      const section = element.section || 'global';
      
      if (!grouped[section]) {
        grouped[section] = {};
      }

      // 요소 ID를 키로 사용
      const key = `${element.type}_${element.id}`;
      grouped[section][key] = {
        type: element.type,
        selector: element.selector,
        content: element.content,
        attributes: element.attributes,
        editable: true
      };
    });

    return grouped;
  }

  // 기존 분석 데이터 로드
  async loadAnalysisData(themeId: string): Promise<ThemeAnalysisData | null> {
    try {
      const jsonPath = path.join(this.dataPath, `${themeId}-analysis.json`);
      const content = await fs.readFile(jsonPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  // 모든 테마 분석 (배치)
  async analyzeAllThemes(): Promise<Record<string, ThemeAnalysisData>> {
    const themes = await this.scanThemes();
    const results: Record<string, ThemeAnalysisData> = {};

    for (const theme of themes) {
      if (theme.hasIndex) {
        const analysis = await this.analyzeTheme(theme);
        if (analysis) {
          results[theme.id] = analysis;
        }
      }
    }

    return results;
  }

  // 테마가 이미 분석되었는지 확인
  async isThemeAnalyzed(themeId: string): Promise<boolean> {
    const jsonPath = path.join(this.dataPath, `${themeId}-analysis.json`);
    try {
      await fs.access(jsonPath);
      return true;
    } catch {
      return false;
    }
  }

  // 분석 데이터 삭제
  async deleteAnalysisData(themeId: string): Promise<void> {
    const jsonPath = path.join(this.dataPath, `${themeId}-analysis.json`);
    try {
      await fs.unlink(jsonPath);
    } catch (error) {
      console.error(`Error deleting analysis data for ${themeId}:`, error);
    }
  }
}