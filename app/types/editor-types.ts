// ============================================
// 에디터 관련 모든 타입 정의
// ============================================

// 1. 템플릿 분석 데이터 구조
// ============================================

// 1-1. 텍스트 요소 분석
export interface TextElement {
  id: string;
  content: string;
  tag: string;
  selector: string;
  class?: string;
  elementId?: string;
  section?: string;
  location?: string;
  type: 'text';
}

// 1-2. 이미지 요소 분석
export interface ImageElement {
  id: string;
  src: string;
  alt?: string;
  selector: string;
  class?: string;
  elementId?: string;
  type: 'image';
}

// 1-3. 템플릿 분석 결과
export interface TemplateAnalysisResult {
  elements: TextElement[];
  images: ImageElement[];
  analyzedAt: string;
  version: string;
}

// 2. 디자인 분석 데이터 구조
// ============================================

// 2-1. 색상 정보
export interface ColorInfo {
  value: string;           // #000000 or rgba()
  normalizedHex: string;   // 항상 #000000 형태
  usage: 'text' | 'background' | 'border' | 'other';
  frequency: number;
  selectors: string[];
  hue: number;            // 0-360
  saturation: number;     // 0-100
  lightness: number;      // 0-100
}

// 2-2. 타이포그래피 정보
export interface TypographyInfo {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textAlign: string;
  frequency: number;
  elements: string[];     // h1, h2, p 등
  selectors: string[];
}

// 2-3. 간격 정보
export interface SpacingInfo {
  type: 'margin' | 'padding' | 'gap';
  value: string;
  side?: 'top' | 'right' | 'bottom' | 'left' | 'all';
  frequency: number;
  selectors: string[];
}

// 2-4. 디자인 분석 결과
export interface DesignAnalysisResult {
  colors: ColorInfo[];
  typography: TypographyInfo[];
  spacing: SpacingInfo[];
  cssVariables?: Record<string, string>;
  extractedAt: string;
}

// 3. 편집된 데이터 구조
// ============================================

// 3-1. 편집된 색상
export interface EditedColor {
  originalColor: string;
  newColor: string;
  usage: string[];
  lastModified: string;
}

// 3-2. 편집된 타이포그래피
export interface EditedTypography {
  original: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight?: string;
    letterSpacing?: string;
  };
  updates: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
  };
  lastModified: string;
}

// 3-3. 편집된 간격
export interface EditedSpacing {
  original: {
    type: string;
    value: string;
    side?: string;
  };
  updates: {
    value: string;
  };
  lastModified: string;
}

// 3-4. 편집된 디자인 데이터
export interface EditedDesign {
  colors: Record<string, EditedColor>;
  typography: Record<string, EditedTypography>;
  spacing: Record<string, EditedSpacing>;
  metadata: {
    templateId: string;
    version: number;
    lastSaved: string;
    createdAt: string;
  };
}

// 3-5. 편집된 텍스트/이미지 데이터
export interface EditedContent {
  texts?: Record<string, string>;
  images?: Record<string, string>;
}

// 4. 컴포넌트 Props 타입
// ============================================

// 4-1. 색상 팔레트
export interface ColorPaletteProps {
  colors: ColorInfo[];
  onColorChange?: (originalColor: string, newColor: string, usage: string) => void;
  selectedColor?: string;
}

// 4-2. 타이포그래피 팔레트
export interface TypographyPaletteProps {
  typography: TypographyInfo[];
  onTypographyChange?: (original: TypographyInfo, updates: Partial<TypographyInfo>) => void;
  selectedFont?: string;
}

// 4-3. 간격 편집기
export interface SpacingEditorProps {
  spacing: SpacingInfo[];
  onSpacingChange?: (original: SpacingInfo, newValue: string) => void;
  selectedSpacing?: string;
}

// 4-4. 라이브 프리뷰
export interface LivePreviewProps {
  templateId: string;
  previewUrl: string;
  editedData?: EditedContent;
  editedDesign?: EditedDesign;
  previewSize: 'mobile' | 'desktop' | 'tablet' | 'custom';
  customWidth?: number;
  className?: string;
}

// 5. API 응답 타입
// ============================================

// 5-1. 기본 응답
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 5-2. 템플릿 목록 응답
export interface TemplateListResponse {
  templates: {
    id: string;
    name: string;
    status: 'new' | 'ready' | 'analyzing' | 'error';
    hasAnalysis: boolean;
    hasDesignAnalysis: boolean;
    lastModified?: string;
  }[];
}

// 5-3. 디자인 저장 응답
export interface DesignSaveResponse {
  success: boolean;
  savedAt: string;
  version: number;
}

// 5-4. 디자인 불러오기 응답
export interface DesignLoadResponse {
  success: boolean;
  design: EditedDesign | null;
  loadedAt: string;
}

// 6. 컨텍스트 타입
// ============================================

// 6-1. 에디터 컨텍스트
export interface EditorContextType {
  templateId: string;
  designAnalysis: DesignAnalysisResult | null;
  editedDesign: EditedDesign | null;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  lastSaveTime: Date | null;
  
  // 액션
  updateColor: (originalColor: string, newColor: string, usage: string) => void;
  updateTypography: (original: any, updates: any) => void;
  updateSpacing: (original: any, newValue: string) => void;
  saveDesign: () => Promise<void>;
  loadDesign: () => Promise<void>;
  resetDesign: () => Promise<void>;
}

// 6-2. 프리뷰 컨텍스트
export interface PreviewContextType {
  isLoaded: boolean;
  device: 'mobile' | 'desktop' | 'tablet';
  scale: number;
  
  // 액션
  sendMessage: (message: any) => void;
  highlightElement: (elementId: string) => void;
  updatePreviewDevice: (device: 'mobile' | 'desktop' | 'tablet') => void;
}

// 7. 메시지 타입 (PostMessage 통신)
// ============================================

export type PreviewMessage = 
  | { type: 'INIT_PREVIEW'; data: EditedContent; selectedElementId?: string }
  | { type: 'UPDATE_CONTENT'; data: EditedContent; selectedElementId?: string }
  | { type: 'UPDATE_COLOR'; originalColor: string; newColor: string; usage: string }
  | { type: 'UPDATE_TYPOGRAPHY'; original: any; updates: any }
  | { type: 'UPDATE_SPACING'; selector: string; property: string; value: string }
  | { type: 'HIGHLIGHT_ELEMENT'; elementId: string; highlight: boolean }
  | { type: 'ELEMENT_SELECTED'; elementId: string }
  | { type: 'PREVIEW_READY' };

// 8. 유틸리티 타입
// ============================================

// 8-1. 디바이스 프리셋
export interface DevicePreset {
  name: string;
  width: number;
  height: number;
  scale?: number;
  userAgent?: string;
}

// 8-2. 색상 프리셋
export interface ColorPreset {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
    neutral?: {
      dark: string;
      light: string;
    };
  };
}

// 8-3. 폰트 프리셋
export interface FontPreset {
  id: string;
  name: string;
  fonts: {
    heading: string;
    body: string;
    mono?: string;
  };
}

// 9. 에러 타입
// ============================================

export class EditorError extends Error {
  code: string;
  details?: any;
  
  constructor(message: string, code: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

// 10. 상수 정의
// ============================================

export const DEVICE_PRESETS: Record<string, DevicePreset> = {
  mobile: { name: 'Mobile', width: 375, height: 812 },
  tablet: { name: 'Tablet', width: 768, height: 1024 },
  desktop: { name: 'Desktop', width: 1920, height: 1080 },
  'iphone-14': { name: 'iPhone 14', width: 390, height: 844 },
  'ipad-pro': { name: 'iPad Pro', width: 1024, height: 1366 },
};

export const DEFAULT_FONTS = [
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Courier New, monospace',
  'Verdana, sans-serif',
  'Roboto, sans-serif',
  'Open Sans, sans-serif',
  'Lato, sans-serif',
  'Montserrat, sans-serif',
  'Playfair Display, serif',
  'Poppins, sans-serif',
];

export const SPACING_UNITS = ['px', 'rem', 'em', '%', 'vh', 'vw'];

export const FONT_WEIGHTS = [
  { value: '100', label: 'Thin' },
  { value: '200', label: 'Extra Light' },
  { value: '300', label: 'Light' },
  { value: '400', label: 'Normal' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
  { value: '900', label: 'Black' },
];