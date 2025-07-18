// 컬러 토큰 관리 유틸리티 - Phase 2.5
import type { ColorSystem, ColorTokenReference, ExtendedCSSProperties } from '~/types/color-system';
import type { ExtendedStyleElement, ColorAnalysisResult } from '~/types/editor-extended';

export class ColorTokenManager {
  private colorSystem: ColorSystem;

  constructor(colorSystem?: ColorSystem) {
    this.colorSystem = colorSystem || this.getDefaultColorSystem();
  }

  // 기본 컬러 시스템 생성
  private getDefaultColorSystem(): ColorSystem {
    return {
      brand: {
        primary: '#3B82F6', // 기본 파란색
        secondary: '#8B5CF6', // 기본 보라색
      },
      neutral: {
        textPrimary: '#111827',
        textSecondary: '#6B7280',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        border: '#E5E7EB',
      },
    };
  }

  // 토큰 경로로 색상 값 가져오기
  getTokenValue(tokenPath: string): string | undefined {
    const parts = tokenPath.split('.');
    let value: any = this.colorSystem;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return typeof value === 'string' ? value : undefined;
  }

  // ColorTokenReference를 실제 색상 값으로 변환
  resolveColorValue(value: string | ColorTokenReference | undefined): string | undefined {
    if (!value) return undefined;
    
    if (typeof value === 'string') {
      return value;
    }
    
    const resolvedValue = this.getTokenValue(value.token);
    return resolvedValue || value.fallback;
  }

  // ExtendedCSSProperties를 일반 CSSProperties로 변환 (하위 호환성)
  resolveStyles(styles: ExtendedCSSProperties): React.CSSProperties {
    const resolved: React.CSSProperties = {};
    
    for (const [key, value] of Object.entries(styles)) {
      if (key === 'color' || key === 'backgroundColor' || key === 'borderColor' || 
          key === 'outlineColor' || key === 'textDecorationColor') {
        const resolvedValue = this.resolveColorValue(value as string | ColorTokenReference);
        if (resolvedValue) {
          resolved[key as keyof React.CSSProperties] = resolvedValue as any;
        }
      } else {
        resolved[key as keyof React.CSSProperties] = value as any;
      }
    }
    
    return resolved;
  }

  // CSS 변수로 내보내기
  exportAsCSSVariables(): string {
    const cssVars: string[] = [];
    
    const addVars = (obj: any, prefix: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          const varName = prefix ? `--color-${prefix}-${key}` : `--color-${key}`;
          cssVars.push(`  ${varName}: ${value};`);
        } else if (typeof value === 'object' && value !== null) {
          addVars(value, prefix ? `${prefix}-${key}` : key);
        }
      }
    };
    
    addVars(this.colorSystem);
    
    return `:root {\n${cssVars.join('\n')}\n}`;
  }

  // 템플릿의 색상 분석
  analyzeTemplateColors(styles: Record<string, ExtendedStyleElement>): ColorAnalysisResult {
    const detectedColors: ColorAnalysisResult['detectedColors'] = [];
    const colorGroups: ColorAnalysisResult['colorGroups'] = {};
    
    // 모든 스타일에서 색상 추출
    for (const [id, element] of Object.entries(styles)) {
      const checkStyles = (styleObj: ExtendedCSSProperties, responsive?: string) => {
        const colorProps = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'textDecorationColor'];
        
        for (const prop of colorProps) {
          const value = styleObj[prop as keyof ExtendedCSSProperties];
          if (value && typeof value === 'string') {
            detectedColors.push({
              selector: element.selector,
              property: prop,
              value: value,
              suggestedToken: this.suggestToken(prop, value),
            });
            
            // 색상 그룹화
            if (!colorGroups[value]) {
              colorGroups[value] = { selectors: [], count: 0 };
            }
            colorGroups[value].selectors.push(element.selector);
            colorGroups[value].count++;
          }
        }
      };
      
      checkStyles(element.styles);
      
      // 반응형 스타일도 검사
      for (const [breakpoint, responsiveStyles] of Object.entries(element.responsive || {})) {
        checkStyles(responsiveStyles, breakpoint);
      }
    }
    
    // 추천 색상 도출
    const recommendations = this.generateRecommendations(colorGroups);
    
    return {
      detectedColors,
      colorGroups,
      recommendations,
    };
  }

  // 속성과 값에 따른 토큰 추천
  private suggestToken(property: string, value: string): string | undefined {
    // 간단한 추천 로직 (Phase 3에서 개선 예정)
    if (property === 'color') {
      if (value === '#111827' || value === '#000000') return 'neutral.textPrimary';
      if (value === '#6B7280' || value === '#666666') return 'neutral.textSecondary';
    }
    if (property === 'backgroundColor') {
      if (value === '#FFFFFF' || value === 'white') return 'neutral.background';
      if (value === '#F9FAFB' || value === '#F5F5F5') return 'neutral.surface';
    }
    if (property === 'borderColor') {
      if (value === '#E5E7EB' || value === '#DDDDDD') return 'neutral.border';
    }
    return undefined;
  }

  // 색상 그룹에서 추천 생성
  private generateRecommendations(colorGroups: ColorAnalysisResult['colorGroups']): ColorAnalysisResult['recommendations'] {
    // 가장 많이 사용된 색상들 찾기
    const sortedColors = Object.entries(colorGroups)
      .sort(([, a], [, b]) => b.count - a.count)
      .map(([color]) => color);
    
    const recommendations: ColorAnalysisResult['recommendations'] = {};
    
    // Primary 색상 추천 (가장 많이 사용된 브랜드 색상)
    const brandColors = sortedColors.filter(color => 
      !['#000000', '#FFFFFF', '#111827', '#6B7280', '#E5E7EB', '#F9FAFB'].includes(color.toUpperCase())
    );
    if (brandColors[0]) {
      recommendations.primary = brandColors[0];
    }
    
    return recommendations;
  }

  // 컬러 시스템 업데이트
  updateColorSystem(updates: Partial<ColorSystem>): void {
    this.colorSystem = {
      ...this.colorSystem,
      ...updates,
      brand: {
        ...this.colorSystem.brand,
        ...(updates.brand || {}),
      },
      neutral: {
        ...this.colorSystem.neutral,
        ...(updates.neutral || {}),
      },
    };
  }

  getColorSystem(): ColorSystem {
    return this.colorSystem;
  }
}