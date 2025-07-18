// 기존 타입을 확장한 Editor 타입 정의 - Phase 2.5
import type { ExtendedCSSProperties, ColorSystem } from './color-system';

// 확장된 StyleElement (하위 호환성 유지)
export interface ExtendedStyleElement {
  id: string;
  selector: string;
  styles: ExtendedCSSProperties; // 기존 CSSProperties와 호환
  responsive: Record<string, ExtendedCSSProperties>;
  // Phase 2.5 추가 속성
  colorTokens?: Record<string, string>; // 이 요소가 사용하는 컬러 토큰 매핑
}

// 확장된 EditorState
export interface ExtendedEditorState {
  texts: Record<string, string>;
  styles: Record<string, ExtendedStyleElement>; // StyleElement → ExtendedStyleElement
  media: Record<string, any>; // MediaElement는 그대로 유지
  metadata: {
    lastModified: Date;
    isDirty: boolean;
  };
  // Phase 2.5 추가
  colorSystem?: ColorSystem; // 현재 템플릿의 컬러 시스템
}

// 컬러 토큰 적용 결과
export interface ColorTokenApplication {
  selector: string;
  property: string;
  originalValue: string;
  tokenValue: string;
  tokenPath: string; // 예: "brand.primary"
}

// 컬러 토큰 분석 결과
export interface ColorAnalysisResult {
  detectedColors: {
    selector: string;
    property: string;
    value: string;
    suggestedToken?: string; // 추천 토큰
  }[];
  colorGroups: {
    [color: string]: {
      selectors: string[];
      count: number;
    };
  };
  recommendations: {
    primary?: string;
    secondary?: string;
    neutrals?: Partial<Record<keyof import('./color-system').NeutralColors, string>>;
  };
}