export type FontLoadStrategy = 'immediate' | 'lazy' | 'inactive';

export interface FontParsedData {
  fontFamily: string;
  weights: string[];
  styles: string[];
  primaryUrl: string;
  unicode: string | null;
  display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}

export interface FontMetadata {
  source: string;
  license: string;
  description: string;
  tags: string[];
  popularity: number;
}

export interface CustomFont {
  id: string;
  fontFamily: string;
  displayName: string;
  cssUrl: string;
  parsedData: FontParsedData;
  metadata: FontMetadata;
  loadStrategy: FontLoadStrategy;
  isActive: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface FontCollection {
  fonts: CustomFont[];
  metadata: {
    version: number;
    lastUpdated: string;
    totalFonts: number;
  };
}

export interface FontFace {
  fontFamily: string;
  src: string;
  fontWeight?: string;
  fontStyle?: string;
  fontDisplay?: string;
  unicodeRange?: string;
}

export interface ParsedFontCSS {
  fontFaces: FontFace[];
  imports: string[];
  variables: Record<string, string>;
}

export interface FontContextType {
  fonts: CustomFont[];
  activeFonts: CustomFont[];
  isLoading: boolean;
  error: string | null;
  
  addFont: (url: string) => Promise<void>;
  removeFont: (fontId: string) => Promise<void>;
  toggleFont: (fontId: string) => Promise<void>;
  updateLoadStrategy: (fontId: string, strategy: FontLoadStrategy) => Promise<void>;
  refreshFonts: () => Promise<void>;
  searchNoonnu: (query: string) => Promise<any[]>;
}

export interface NoonnuFont {
  id: string;
  name: string;
  nameEn: string;
  cssUrl: string;
  category: string;
  weights: string[];
  license: string;
  source: string;
  tags: string[];
}