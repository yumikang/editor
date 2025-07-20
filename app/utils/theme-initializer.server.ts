import * as fs from 'fs/promises';
import * as path from 'path';

export interface ThemeStyleConfig {
  fonts: any[];
  fontAssignments: Record<string, string>;
  customCSS: string;
}

export class ThemeInitializer {
  private themesPath: string;

  constructor(themesPath: string) {
    this.themesPath = themesPath;
  }

  /**
   * 테마 초기화 - 필요한 파일들이 없으면 자동 생성
   */
  async initializeTheme(themeName: string): Promise<void> {
    const themePath = path.join(this.themesPath, themeName);
    const styleConfigPath = path.join(themePath, 'style-config.json');
    const customStylesPath = path.join(themePath, 'custom-styles.css');

    // 테마 디렉토리가 존재하는지 확인
    try {
      await fs.access(themePath);
    } catch {
      console.error(`Theme directory not found: ${themeName}`);
      return;
    }

    // style-config.json 파일이 없으면 생성
    try {
      await fs.access(styleConfigPath);
    } catch {
      const defaultConfig: ThemeStyleConfig = {
        fonts: [],
        fontAssignments: {},
        customCSS: ""
      };
      await fs.writeFile(styleConfigPath, JSON.stringify(defaultConfig, null, 2));
      console.log(`Created style-config.json for theme: ${themeName}`);
    }

    // custom-styles.css 파일이 없으면 생성
    try {
      await fs.access(customStylesPath);
    } catch {
      const defaultCSS = `/* 자동 생성된 스타일 시트 - ${themeName} */\n\n`;
      await fs.writeFile(customStylesPath, defaultCSS);
      console.log(`Created custom-styles.css for theme: ${themeName}`);
    }
  }

  /**
   * 모든 테마 스캔 및 초기화
   */
  async initializeAllThemes(): Promise<string[]> {
    const themes: string[] = [];
    
    try {
      const entries = await fs.readdir(this.themesPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          themes.push(entry.name);
          await this.initializeTheme(entry.name);
        }
      }
    } catch (error) {
      console.error('Error scanning themes:', error);
    }

    return themes;
  }

  /**
   * 새 테마 추가 시 스타일 설정 복사 (선택적)
   */
  async copyStyleConfig(sourceTheme: string, targetTheme: string): Promise<void> {
    const sourceConfigPath = path.join(this.themesPath, sourceTheme, 'style-config.json');
    const targetConfigPath = path.join(this.themesPath, targetTheme, 'style-config.json');
    
    try {
      const sourceConfig = await fs.readFile(sourceConfigPath, 'utf-8');
      await fs.writeFile(targetConfigPath, sourceConfig);
      console.log(`Copied style config from ${sourceTheme} to ${targetTheme}`);
    } catch (error) {
      console.error(`Error copying style config: ${error}`);
    }
  }
}