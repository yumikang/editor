// 컬러 시스템 타입 정의 - Phase 2.5

// 기본 컬러 토큰 인터페이스
export interface ColorToken {
  name: string;
  value: string;
  description?: string;
}

// 브랜드 컬러
export interface BrandColors {
  primary: string;
  secondary?: string; // 자동 생성 가능
}

// 시맨틱 컬러
export interface SemanticColors {
  success: string;
  warning: string;
  error: string;
  info: string;
}

// 중성 컬러
export interface NeutralColors {
  textPrimary: string;
  textSecondary: string;
  background: string;
  surface: string;
  border: string;
}

// 상호작용 컬러
export interface InteractionColors {
  hover: string;
  active: string;
  focus: string;
  disabled: string;
}

// 전체 컬러 시스템
export interface ColorSystem {
  brand: BrandColors;
  semantic?: SemanticColors; // Phase 3에서 자동 생성
  neutral?: NeutralColors;
  interaction?: InteractionColors; // Phase 3에서 자동 생성
}

// 컬러 프리셋
export interface ColorPreset {
  id: string;
  name: string;
  colors: ColorSystem;
  createdAt: Date;
  updatedAt: Date;
}

// StyleElement 확장을 위한 타입
export interface ColorTokenReference {
  token: string; // 예: "brand.primary", "neutral.textPrimary"
  fallback?: string; // 토큰이 없을 경우 대체값
}

// 확장된 스타일 속성
export interface ExtendedCSSProperties extends React.CSSProperties {
  // 컬러 토큰 참조를 지원하는 속성들
  color?: string | ColorTokenReference;
  backgroundColor?: string | ColorTokenReference;
  borderColor?: string | ColorTokenReference;
  outlineColor?: string | ColorTokenReference;
  textDecorationColor?: string | ColorTokenReference;
  // 기타 컬러 관련 속성들...
}

// Phase 2.5에서 사용할 간단한 컬러 편집 데이터
export interface ColorEditData {
  selector: string;
  property: 'color' | 'backgroundColor' | 'borderColor';
  value: string;
  tokenRef?: string; // 컬러 토큰 참조
}