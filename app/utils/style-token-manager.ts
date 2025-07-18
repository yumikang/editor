// 스타일 토큰 관리자 - Phase 3
import type { StyleTokenSystem } from '~/types/style-tokens';
import { defaultStyleTokens, tokensToCSSVariables } from '~/types/style-tokens';
import * as fs from 'fs/promises';
import * as path from 'path';

export class StyleTokenManager {
  private styleTokens: StyleTokenSystem;
  private templateId: string;
  private tokensPath: string;

  constructor(templateId: string, initialTokens?: StyleTokenSystem) {
    this.templateId = templateId;
    this.styleTokens = initialTokens || defaultStyleTokens;
    this.tokensPath = path.join(
      process.cwd(),
      'app/data/themes',
      templateId,
      'working',
      'style-tokens.json'
    );
  }

  // 스타일 토큰 로드
  async loadTokens(): Promise<StyleTokenSystem> {
    try {
      const data = await fs.readFile(this.tokensPath, 'utf-8');
      this.styleTokens = JSON.parse(data);
      return this.styleTokens;
    } catch {
      // 파일이 없으면 기본값 사용
      this.styleTokens = defaultStyleTokens;
      return this.styleTokens;
    }
  }

  // 스타일 토큰 저장
  async saveTokens(): Promise<void> {
    const dir = path.dirname(this.tokensPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      this.tokensPath,
      JSON.stringify(this.styleTokens, null, 2)
    );
  }

  // 간격 토큰 업데이트
  updateSpacing(key: keyof StyleTokenSystem['spacing'], value: string) {
    this.styleTokens.spacing[key] = value;
  }

  // 타이포그래피 토큰 업데이트
  updateTypography(
    category: keyof StyleTokenSystem['typography'],
    key: string,
    value: string
  ) {
    (this.styleTokens.typography[category] as any)[key] = value;
  }

  // 효과 토큰 업데이트
  updateEffects(
    category: keyof StyleTokenSystem['effects'],
    key: string,
    value: string
  ) {
    (this.styleTokens.effects[category] as any)[key] = value;
  }

  // 전환 토큰 업데이트
  updateTransitions(
    category: keyof StyleTokenSystem['transitions'],
    key: string,
    value: string
  ) {
    (this.styleTokens.transitions[category] as any)[key] = value;
  }

  // 토큰 값 가져오기
  getTokenValue(category: string, subcategory: string, key: string): string | undefined {
    try {
      if (category === 'spacing') {
        return this.styleTokens.spacing[key as keyof StyleTokenSystem['spacing']];
      }
      
      const categoryObj = this.styleTokens[category as keyof StyleTokenSystem] as any;
      if (categoryObj && categoryObj[subcategory]) {
        return categoryObj[subcategory][key];
      }
      
      return undefined;
    } catch {
      return undefined;
    }
  }

  // 모든 토큰 가져오기
  getTokens(): StyleTokenSystem {
    return this.styleTokens;
  }

  // CSS 변수로 내보내기
  exportAsCSSVariables(): string {
    return tokensToCSSVariables(this.styleTokens);
  }

  // 토큰 리셋
  resetToDefaults() {
    this.styleTokens = defaultStyleTokens;
  }

  // 토큰 병합 (부분 업데이트)
  mergeTokens(partialTokens: Partial<StyleTokenSystem>) {
    this.styleTokens = {
      ...this.styleTokens,
      ...partialTokens,
      spacing: {
        ...this.styleTokens.spacing,
        ...(partialTokens.spacing || {})
      },
      typography: {
        ...this.styleTokens.typography,
        ...(partialTokens.typography || {}),
        fontSize: {
          ...this.styleTokens.typography.fontSize,
          ...(partialTokens.typography?.fontSize || {})
        },
        lineHeight: {
          ...this.styleTokens.typography.lineHeight,
          ...(partialTokens.typography?.lineHeight || {})
        },
        fontWeight: {
          ...this.styleTokens.typography.fontWeight,
          ...(partialTokens.typography?.fontWeight || {})
        },
        letterSpacing: {
          ...this.styleTokens.typography.letterSpacing,
          ...(partialTokens.typography?.letterSpacing || {})
        }
      },
      effects: {
        ...this.styleTokens.effects,
        ...(partialTokens.effects || {}),
        borderRadius: {
          ...this.styleTokens.effects.borderRadius,
          ...(partialTokens.effects?.borderRadius || {})
        },
        shadow: {
          ...this.styleTokens.effects.shadow,
          ...(partialTokens.effects?.shadow || {})
        },
        blur: {
          ...this.styleTokens.effects.blur,
          ...(partialTokens.effects?.blur || {})
        }
      },
      transitions: {
        ...this.styleTokens.transitions,
        ...(partialTokens.transitions || {}),
        duration: {
          ...this.styleTokens.transitions.duration,
          ...(partialTokens.transitions?.duration || {})
        },
        timing: {
          ...this.styleTokens.transitions.timing,
          ...(partialTokens.transitions?.timing || {})
        }
      }
    };
  }

  // 스케일 생성 유틸리티
  static generateSpacingScale(base: number = 8): StyleTokenSystem['spacing'] {
    return {
      xs: `${base * 0.5}px`,
      sm: `${base}px`,
      md: `${base * 2}px`,
      lg: `${base * 3}px`,
      xl: `${base * 4}px`,
      xxl: `${base * 6}px`,
      xxxl: `${base * 8}px`
    };
  }

  static generateFontSizeScale(base: number = 16): StyleTokenSystem['typography']['fontSize'] {
    return {
      xs: `${Math.round(base * 0.75)}px`,
      sm: `${Math.round(base * 0.875)}px`,
      base: `${base}px`,
      lg: `${Math.round(base * 1.125)}px`,
      xl: `${Math.round(base * 1.5)}px`,
      xxl: `${Math.round(base * 2)}px`,
      xxxl: `${Math.round(base * 3)}px`,
      display: `${Math.round(base * 4)}px`
    };
  }
}