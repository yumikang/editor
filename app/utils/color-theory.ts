// 컬러 이론 및 팔레트 생성 클래스 - Phase 3
import type { ColorSystem, SemanticColors, InteractionColors } from '~/types/color-system';

// HSL 색상 타입
interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

// RGB 색상 타입
interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

// 팔레트 타입
export interface ColorPalette {
  name: string;
  description: string;
  colors: string[];
}

export class ColorTheory {
  // HEX to HSL 변환
  static hexToHSL(hex: string): HSL {
    const rgb = this.hexToRGB(hex);
    return this.rgbToHSL(rgb);
  }

  // HSL to HEX 변환
  static hslToHex(hsl: HSL): string {
    const rgb = this.hslToRGB(hsl);
    return this.rgbToHex(rgb);
  }

  // HEX to RGB 변환
  private static hexToRGB(hex: string): RGB {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }

  // RGB to HEX 변환
  private static rgbToHex(rgb: RGB): string {
    const toHex = (n: number) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  // RGB to HSL 변환
  private static rgbToHSL(rgb: RGB): HSL {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / delta + 2) / 6;
          break;
        case b:
          h = ((r - g) / delta + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  // HSL to RGB 변환
  private static hslToRGB(hsl: HSL): RGB {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  // 1. 보색 생성 (Complementary)
  static generateComplementary(primary: string): ColorPalette {
    const hsl = this.hexToHSL(primary);
    const complementary = {
      h: (hsl.h + 180) % 360,
      s: hsl.s,
      l: hsl.l
    };

    return {
      name: '보색 조합',
      description: '색상환에서 정반대에 위치한 색상 조합',
      colors: [
        primary,
        this.hslToHex(complementary)
      ]
    };
  }

  // 2. 유사색 생성 (Analogous)
  static generateAnalogous(primary: string): ColorPalette {
    const hsl = this.hexToHSL(primary);
    const angle = 30; // 30도 간격

    return {
      name: '유사색 조합',
      description: '인접한 색상들의 조화로운 조합',
      colors: [
        this.hslToHex({ ...hsl, h: (hsl.h - angle + 360) % 360 }),
        primary,
        this.hslToHex({ ...hsl, h: (hsl.h + angle) % 360 })
      ]
    };
  }

  // 3. 3색 조화 생성 (Triadic)
  static generateTriadic(primary: string): ColorPalette {
    const hsl = this.hexToHSL(primary);

    return {
      name: '3색 조합',
      description: '색상환에서 120도 간격의 균형잡힌 조합',
      colors: [
        primary,
        this.hslToHex({ ...hsl, h: (hsl.h + 120) % 360 }),
        this.hslToHex({ ...hsl, h: (hsl.h + 240) % 360 })
      ]
    };
  }

  // 4. 단색 조화 생성 (Monochromatic)
  static generateMonochromatic(primary: string): ColorPalette {
    const hsl = this.hexToHSL(primary);

    return {
      name: '단색 조합',
      description: '같은 색상의 명도와 채도 변화',
      colors: [
        this.hslToHex({ h: hsl.h, s: Math.max(10, hsl.s - 30), l: Math.min(95, hsl.l + 40) }),
        this.hslToHex({ h: hsl.h, s: Math.max(10, hsl.s - 15), l: Math.min(90, hsl.l + 20) }),
        primary,
        this.hslToHex({ h: hsl.h, s: Math.min(100, hsl.s + 10), l: Math.max(20, hsl.l - 20) }),
        this.hslToHex({ h: hsl.h, s: Math.min(100, hsl.s + 20), l: Math.max(10, hsl.l - 40) })
      ]
    };
  }

  // Secondary 색상 자동 생성
  static generateSecondary(primary: string): string {
    const hsl = this.hexToHSL(primary);
    
    // 따뜻한 색상 (0-60, 300-360) vs 차가운 색상 (120-240)
    const isWarm = hsl.h <= 60 || hsl.h >= 300;
    
    if (isWarm) {
      // 따뜻한 색 → 차가운 보색 계열
      return this.hslToHex({
        h: (hsl.h + 180 + (Math.random() * 40 - 20)) % 360, // ±20도 변화
        s: Math.max(30, Math.min(80, hsl.s - 10)),
        l: Math.max(30, Math.min(70, hsl.l))
      });
    } else {
      // 차가운 색 → 따뜻한 보색 계열
      return this.hslToHex({
        h: (hsl.h + 180 + (Math.random() * 40 - 20)) % 360,
        s: Math.max(40, Math.min(90, hsl.s + 10)),
        l: Math.max(40, Math.min(80, hsl.l))
      });
    }
  }

  // 시맨틱 컬러 자동 생성
  static generateSemanticColors(primary: string): SemanticColors {
    const primaryHsl = this.hexToHSL(primary);
    
    // 각 시맨틱 컬러의 기본 색조
    const semanticHues = {
      success: 120,  // 녹색
      warning: 45,   // 주황색  
      error: 0,      // 빨간색
      info: 210      // 파란색
    };

    // Primary 색상의 채도를 기준으로 조정
    const baseSaturation = Math.max(60, primaryHsl.s);
    const baseLightness = 45; // 적당한 명도

    return {
      success: this.hslToHex({
        h: semanticHues.success,
        s: baseSaturation,
        l: baseLightness
      }),
      warning: this.hslToHex({
        h: semanticHues.warning,
        s: baseSaturation + 10,
        l: baseLightness + 5
      }),
      error: this.hslToHex({
        h: semanticHues.error,
        s: baseSaturation + 5,
        l: baseLightness
      }),
      info: this.hslToHex({
        h: semanticHues.info,
        s: baseSaturation - 10,
        l: baseLightness
      })
    };
  }

  // 상호작용 색상 생성
  static generateInteractionColors(base: string): InteractionColors {
    const hsl = this.hexToHSL(base);

    return {
      hover: this.hslToHex({
        h: hsl.h,
        s: hsl.s,
        l: Math.max(0, hsl.l - 10) // 10% 어둡게
      }),
      active: this.hslToHex({
        h: hsl.h,
        s: hsl.s,
        l: Math.max(0, hsl.l - 20) // 20% 어둡게
      }),
      focus: `${base}33`, // 20% 투명도 (hex + alpha)
      disabled: this.hslToHex({
        h: hsl.h,
        s: Math.max(0, hsl.s - 50), // 채도 50% 감소
        l: Math.min(100, hsl.l + 30) // 명도 30% 증가
      })
    };
  }

  // 접근성: 대비율 계산
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRGB(color1);
    const rgb2 = this.hexToRGB(color2);

    const getLuminance = (rgb: RGB) => {
      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const lum1 = getLuminance(rgb1);
    const lum2 = getLuminance(rgb2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }

  // 접근성: WCAG 기준 체크
  static checkWCAGCompliance(foreground: string, background: string): {
    ratio: number;
    AA: boolean;
    AAA: boolean;
    AALarge: boolean;
    AAALarge: boolean;
  } {
    const ratio = this.getContrastRatio(foreground, background);

    return {
      ratio: Math.round(ratio * 100) / 100,
      AA: ratio >= 4.5,        // 일반 텍스트 AA
      AAA: ratio >= 7,         // 일반 텍스트 AAA
      AALarge: ratio >= 3,     // 큰 텍스트 AA
      AAALarge: ratio >= 4.5   // 큰 텍스트 AAA
    };
  }

  // 색상 조정: 대비율 맞추기
  static adjustForContrast(
    foreground: string, 
    background: string, 
    targetRatio: number = 4.5
  ): string {
    let currentRatio = this.getContrastRatio(foreground, background);
    if (currentRatio >= targetRatio) return foreground;

    const fgHsl = this.hexToHSL(foreground);
    const bgHsl = this.hexToHSL(background);
    const bgIsLight = bgHsl.l > 50;

    // 배경이 밝으면 전경을 어둡게, 배경이 어두우면 전경을 밝게
    let adjustedHsl = { ...fgHsl };
    let step = bgIsLight ? -5 : 5;
    let iterations = 0;
    const maxIterations = 20;

    while (currentRatio < targetRatio && iterations < maxIterations) {
      adjustedHsl.l = Math.max(0, Math.min(100, adjustedHsl.l + step));
      const adjustedHex = this.hslToHex(adjustedHsl);
      currentRatio = this.getContrastRatio(adjustedHex, background);
      iterations++;
    }

    return this.hslToHex(adjustedHsl);
  }
}