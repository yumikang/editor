import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ColorInfo {
  value: string;          // #FF0000, rgba(255,0,0,1)
  normalizedHex: string;  // #ff0000 (정규화된 hex)
  type: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'named' | 'var';
  usage: 'text' | 'background' | 'border' | 'other';
  frequency: number;      // 사용 빈도
  selectors: string[];    // 어떤 선택자에서 사용되는지
  lightness: number;      // 0-100 (명도)
  hue: number;           // 0-360 (색상)
  saturation: number;    // 0-100 (채도)
}

export interface TypographyInfo {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textAlign: string;
  frequency: number;
  elements: string[];     // h1, h2, p, span 등
  selectors: string[];
}

export interface SpacingInfo {
  property: 'margin' | 'padding' | 'gap';
  value: string;
  normalizedPx: number;   // px로 정규화된 값
  frequency: number;
  selectors: string[];
  context: 'component' | 'section' | 'global';
}

export interface DesignAnalysisResult {
  colors: ColorInfo[];
  typography: TypographyInfo[];
  spacing: SpacingInfo[];
  cssVariables: Record<string, string>;
  extractedAt: string;
}

export class DesignScanner {
  private $: cheerio.CheerioAPI;
  private colors: Map<string, ColorInfo> = new Map();
  private typography: Map<string, TypographyInfo> = new Map();
  private spacing: Map<string, SpacingInfo> = new Map();
  private cssVariables: Map<string, string> = new Map();

  constructor(private html: string, private cssContent: string[] = []) {
    this.$ = cheerio.load(html);
  }

  async scan(): Promise<DesignAnalysisResult> {
    // CSS 변수 추출
    await this.extractCSSVariables();
    
    // CSS 파일에서 스타일 추출
    for (const css of this.cssContent) {
      await this.parseCSSContent(css);
    }
    
    // HTML 인라인 스타일 추출
    await this.extractInlineStyles();
    
    // 계산된 스타일 추출 (브라우저에서만 가능하므로 기본값 사용)
    await this.extractComputedStyles();
    
    return {
      colors: Array.from(this.colors.values()).sort((a, b) => b.frequency - a.frequency),
      typography: Array.from(this.typography.values()).sort((a, b) => b.frequency - a.frequency),
      spacing: Array.from(this.spacing.values()).sort((a, b) => b.frequency - a.frequency),
      cssVariables: Object.fromEntries(this.cssVariables),
      extractedAt: new Date().toISOString()
    };
  }

  private async extractCSSVariables() {
    // CSS 변수 패턴 매칭
    const cssVarPattern = /--([\w-]+):\s*([^;]+)/g;
    
    for (const css of this.cssContent) {
      let match;
      while ((match = cssVarPattern.exec(css)) !== null) {
        const varName = match[1];
        const varValue = match[2].trim();
        this.cssVariables.set(`--${varName}`, varValue);
        
        // 색상 변수인 경우 색상으로도 추가
        if (this.isColorValue(varValue)) {
          this.addColor(varValue, 'var', 'other', `--${varName}`);
        }
      }
    }
  }

  private async parseCSSContent(css: string) {
    // CSS 선택자와 속성 파싱
    const selectorPattern = /([^{]+)\{([^}]+)\}/g;
    let match;
    
    while ((match = selectorPattern.exec(css)) !== null) {
      const selector = match[1].trim();
      const properties = match[2];
      
      this.parseProperties(properties, selector);
    }
  }

  private parseProperties(properties: string, selector: string) {
    const propPattern = /([\w-]+):\s*([^;]+)/g;
    let match;
    
    while ((match = propPattern.exec(properties)) !== null) {
      const property = match[1].trim();
      const value = match[2].trim();
      
      // 색상 속성 처리
      if (this.isColorProperty(property)) {
        const usage = this.getColorUsage(property);
        this.addColor(value, this.getColorType(value), usage, selector);
      }
      
      // 타이포그래피 속성 처리
      if (this.isTypographyProperty(property)) {
        this.addTypography(property, value, selector);
      }
      
      // 간격 속성 처리
      if (this.isSpacingProperty(property)) {
        this.addSpacing(property as any, value, selector);
      }
    }
  }

  private async extractInlineStyles() {
    this.$('*[style]').each((_, element) => {
      const $element = this.$(element);
      const style = $element.attr('style') || '';
      const selector = this.getElementSelector(element);
      
      this.parseProperties(style, selector);
    });
  }

  private async extractComputedStyles() {
    // 일반적인 HTML 요소들의 기본 스타일 추출
    const commonElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'button'];
    
    commonElements.forEach(tag => {
      this.$(tag).each((_, element) => {
        const selector = this.getElementSelector(element);
        
        // 기본 타이포그래피 정보 추가 (실제로는 computed style에서 가져와야 함)
        this.addDefaultTypography(tag, selector);
      });
    });
  }

  private addColor(value: string, type: ColorInfo['type'], usage: ColorInfo['usage'], selector: string) {
    if (!this.isColorValue(value)) return;
    
    const normalizedHex = this.normalizeColor(value);
    const key = `${normalizedHex}-${usage}`;
    
    if (this.colors.has(key)) {
      const existing = this.colors.get(key)!;
      existing.frequency++;
      if (!existing.selectors.includes(selector)) {
        existing.selectors.push(selector);
      }
    } else {
      const hsl = this.hexToHsl(normalizedHex);
      this.colors.set(key, {
        value,
        normalizedHex,
        type,
        usage,
        frequency: 1,
        selectors: [selector],
        lightness: hsl.l,
        hue: hsl.h,
        saturation: hsl.s
      });
    }
  }

  private addTypography(property: string, value: string, selector: string) {
    // 선택자별로 타이포그래피 정보 그룹화
    const key = selector;
    
    if (this.typography.has(key)) {
      const existing = this.typography.get(key)!;
      existing.frequency++;
      // 속성별로 값 업데이트
      switch (property) {
        case 'font-family':
          existing.fontFamily = value;
          break;
        case 'font-size':
          existing.fontSize = value;
          break;
        case 'font-weight':
          existing.fontWeight = value;
          break;
        case 'line-height':
          existing.lineHeight = value;
          break;
        case 'letter-spacing':
          existing.letterSpacing = value;
          break;
        case 'text-align':
          existing.textAlign = value;
          break;
      }
    } else {
      this.typography.set(key, {
        fontFamily: property === 'font-family' ? value : '',
        fontSize: property === 'font-size' ? value : '',
        fontWeight: property === 'font-weight' ? value : '',
        lineHeight: property === 'line-height' ? value : '',
        letterSpacing: property === 'letter-spacing' ? value : '',
        textAlign: property === 'text-align' ? value : '',
        frequency: 1,
        elements: this.getElementTypes(selector),
        selectors: [selector]
      });
    }
  }

  private addSpacing(property: 'margin' | 'padding' | 'gap', value: string, selector: string) {
    const normalizedPx = this.normalizeToPx(value);
    const key = `${property}-${normalizedPx}`;
    
    if (this.spacing.has(key)) {
      const existing = this.spacing.get(key)!;
      existing.frequency++;
      if (!existing.selectors.includes(selector)) {
        existing.selectors.push(selector);
      }
    } else {
      this.spacing.set(key, {
        property,
        value,
        normalizedPx,
        frequency: 1,
        selectors: [selector],
        context: this.getSpacingContext(selector)
      });
    }
  }

  private addDefaultTypography(tag: string, selector: string) {
    // HTML 요소별 기본 타이포그래피 정보
    const defaults: Record<string, Partial<TypographyInfo>> = {
      'h1': { fontSize: '2em', fontWeight: 'bold' },
      'h2': { fontSize: '1.5em', fontWeight: 'bold' },
      'h3': { fontSize: '1.17em', fontWeight: 'bold' },
      'h4': { fontSize: '1em', fontWeight: 'bold' },
      'h5': { fontSize: '0.83em', fontWeight: 'bold' },
      'h6': { fontSize: '0.67em', fontWeight: 'bold' },
      'p': { fontSize: '1em', fontWeight: 'normal' },
      'span': { fontSize: '1em', fontWeight: 'normal' },
      'a': { fontSize: '1em', fontWeight: 'normal' },
      'button': { fontSize: '1em', fontWeight: 'normal' }
    };
    
    const defaultInfo = defaults[tag];
    if (defaultInfo) {
      Object.entries(defaultInfo).forEach(([prop, val]) => {
        this.addTypography(prop, val as string, selector);
      });
    }
  }

  // 유틸리티 메서드들
  private isColorProperty(property: string): boolean {
    return ['color', 'background-color', 'border-color', 'outline-color', 'text-decoration-color'].includes(property);
  }

  private isTypographyProperty(property: string): boolean {
    return ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align'].includes(property);
  }

  private isSpacingProperty(property: string): boolean {
    return ['margin', 'padding', 'gap', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
            'padding-top', 'padding-bottom', 'padding-left', 'padding-right'].includes(property);
  }

  private isColorValue(value: string): boolean {
    return /^(#[\da-f]{3,8}|rgb|hsl|rgba|hsla|var\(--[\w-]+\))|(transparent|black|white|red|green|blue|yellow|orange|purple|gray|grey)/i.test(value);
  }

  private getColorType(value: string): ColorInfo['type'] {
    if (value.startsWith('#')) return 'hex';
    if (value.startsWith('rgb(')) return 'rgb';
    if (value.startsWith('rgba(')) return 'rgba';
    if (value.startsWith('hsl(')) return 'hsl';
    if (value.startsWith('hsla(')) return 'hsla';
    if (value.startsWith('var(')) return 'var';
    return 'named';
  }

  private getColorUsage(property: string): ColorInfo['usage'] {
    if (property === 'color') return 'text';
    if (property.includes('background')) return 'background';
    if (property.includes('border') || property.includes('outline')) return 'border';
    return 'other';
  }

  private normalizeColor(value: string): string {
    // 색상을 hex로 정규화 (간단한 변환만)
    if (value.startsWith('#')) {
      return value.toLowerCase();
    }
    
    // RGB to hex 변환 (기본적인 것만)
    const rgbMatch = value.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
      const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
      const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    
    // 기본값 반환
    return value.toLowerCase();
  }

  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    // Hex to HSL 변환 (간단한 구현)
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const add = max + min;
    const l = add * 0.5;
    
    let h = 0;
    let s = 0;
    
    if (diff !== 0) {
      s = l < 0.5 ? diff / add : diff / (2 - add);
      
      switch (max) {
        case r:
          h = ((g - b) / diff) + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / diff + 2;
          break;
        case b:
          h = (r - g) / diff + 4;
          break;
      }
      h /= 6;
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  private normalizeToPx(value: string): number {
    // 간단한 px 변환
    if (value.endsWith('px')) {
      return parseFloat(value);
    }
    if (value.endsWith('em')) {
      return parseFloat(value) * 16; // 기본 16px 가정
    }
    if (value.endsWith('rem')) {
      return parseFloat(value) * 16;
    }
    return 0;
  }

  private getElementSelector(element: cheerio.Element): string {
    const $element = this.$(element);
    const id = $element.attr('id');
    const classes = $element.attr('class');
    const tag = element.tagName.toLowerCase();
    
    if (id) return `#${id}`;
    if (classes) return `.${classes.split(' ')[0]}`;
    return tag;
  }

  private getElementTypes(selector: string): string[] {
    // 선택자에서 HTML 태그 추출
    const tags = selector.match(/\b(h[1-6]|p|span|div|a|button|li|td|th)\b/g) || [];
    return [...new Set(tags)];
  }

  private getSpacingContext(selector: string): 'component' | 'section' | 'global' {
    if (selector.includes('section') || selector.includes('header') || selector.includes('footer')) {
      return 'section';
    }
    if (selector.includes('btn') || selector.includes('card') || selector.includes('nav')) {
      return 'component';
    }
    return 'global';
  }
}

// 템플릿 디자인 스캔 함수
export async function scanTemplateDesign(templatePath: string): Promise<DesignAnalysisResult> {
  try {
    // HTML 파일 읽기
    const indexPath = path.join(templatePath, 'index.html');
    const html = await fs.readFile(indexPath, 'utf-8');
    
    // CSS 파일들 수집
    const cssContents: string[] = [];
    
    // CSS 파일 찾기
    const $ = cheerio.load(html);
    
    // link 태그에서 CSS 파일 찾기
    $('link[rel="stylesheet"]').each(async (_, element) => {
      const href = $(element).attr('href');
      if (href && !href.startsWith('http')) {
        try {
          const cssPath = path.join(templatePath, href);
          const cssContent = await fs.readFile(cssPath, 'utf-8');
          cssContents.push(cssContent);
        } catch (error) {
          console.log(`CSS file not found: ${href}`);
        }
      }
    });
    
    // style 태그 내용 추가
    $('style').each((_, element) => {
      const styleContent = $(element).html() || '';
      cssContents.push(styleContent);
    });
    
    // 기본 CSS 파일들도 확인
    const commonCssFiles = ['style.css', 'styles.css', 'main.css', 'app.css'];
    for (const cssFile of commonCssFiles) {
      try {
        const cssPath = path.join(templatePath, cssFile);
        const cssContent = await fs.readFile(cssPath, 'utf-8');
        cssContents.push(cssContent);
      } catch {
        // 파일이 없으면 무시
      }
    }
    
    // 디자인 스캐너 실행
    const scanner = new DesignScanner(html, cssContents);
    return await scanner.scan();
    
  } catch (error) {
    console.error(`Error scanning template design: ${error}`);
    throw error;
  }
}