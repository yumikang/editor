// 컬러 프리셋 시스템 - Phase 3
import type { ColorSystem, ColorPreset } from '~/types/color-system';
import { ColorTheory } from './color-theory';

// 기본 제공 프리셋
export const defaultPresets: ColorPreset[] = [
  {
    id: 'modern-blue',
    name: '모던 블루',
    colors: {
      brand: {
        primary: '#3B82F6',
        secondary: '#8B5CF6'
      },
      semantic: {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6'
      },
      neutral: {
        textPrimary: '#111827',
        textSecondary: '#6B7280',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        border: '#E5E7EB'
      },
      interaction: {
        hover: '#2563EB',
        active: '#1D4ED8',
        focus: '#3B82F633',
        disabled: '#9CA3AF'
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'warm-sunset',
    name: '따뜻한 석양',
    colors: {
      brand: {
        primary: '#F97316',
        secondary: '#EC4899'
      },
      semantic: {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#06B6D4'
      },
      neutral: {
        textPrimary: '#18181B',
        textSecondary: '#71717A',
        background: '#FFFBF5',
        surface: '#FFF7ED',
        border: '#FED7AA'
      },
      interaction: {
        hover: '#EA580C',
        active: '#C2410C',
        focus: '#F9731633',
        disabled: '#FDBA74'
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'forest-green',
    name: '포레스트 그린',
    colors: {
      brand: {
        primary: '#059669',
        secondary: '#0891B2'
      },
      semantic: {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6'
      },
      neutral: {
        textPrimary: '#064E3B',
        textSecondary: '#047857',
        background: '#F0FDF4',
        surface: '#D1FAE5',
        border: '#6EE7B7'
      },
      interaction: {
        hover: '#047857',
        active: '#065F46',
        focus: '#05966933',
        disabled: '#6EE7B7'
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'minimal-gray',
    name: '미니멀 그레이',
    colors: {
      brand: {
        primary: '#374151',
        secondary: '#7C3AED'
      },
      semantic: {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6'
      },
      neutral: {
        textPrimary: '#111827',
        textSecondary: '#6B7280',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        border: '#E5E7EB'
      },
      interaction: {
        hover: '#1F2937',
        active: '#111827',
        focus: '#37415133',
        disabled: '#9CA3AF'
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// 프리셋에서 컬러 시스템 생성
export function createColorSystemFromPrimary(primary: string): ColorSystem {
  const secondary = ColorTheory.generateSecondary(primary);
  const semantic = ColorTheory.generateSemanticColors(primary);
  const brandInteraction = ColorTheory.generateInteractionColors(primary);
  
  // 중성 색상은 primary의 채도를 낮춘 버전으로 생성
  const primaryHsl = ColorTheory.hexToHSL(primary);
  const neutralBase = {
    h: primaryHsl.h,
    s: Math.min(15, primaryHsl.s * 0.2), // 낮은 채도
    l: 0
  };

  const neutral = {
    textPrimary: ColorTheory.hslToHex({ ...neutralBase, l: 10 }),
    textSecondary: ColorTheory.hslToHex({ ...neutralBase, l: 45 }),
    background: '#FFFFFF',
    surface: ColorTheory.hslToHex({ ...neutralBase, l: 98 }),
    border: ColorTheory.hslToHex({ ...neutralBase, l: 90 })
  };

  return {
    brand: {
      primary,
      secondary
    },
    semantic,
    neutral,
    interaction: brandInteraction
  };
}

// 프리셋 검증
export function validatePreset(preset: Partial<ColorPreset>): boolean {
  if (!preset.name || !preset.colors) return false;
  
  const { colors } = preset;
  
  // 필수 색상 확인
  if (!colors.brand?.primary) return false;
  
  // HEX 형식 검증
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  const validateHex = (color: string | undefined) => {
    return !color || hexRegex.test(color) || color.endsWith('33'); // 투명도 포함
  };
  
  // 모든 색상 검증
  const allColors = [
    colors.brand?.primary,
    colors.brand?.secondary,
    ...(Object.values(colors.semantic || {}) as string[]),
    ...(Object.values(colors.neutral || {}) as string[]),
    ...(Object.values(colors.interaction || {}) as string[])
  ];
  
  return allColors.every(validateHex);
}

// 프리셋 병합 (부분 업데이트)
export function mergePreset(
  existing: ColorPreset,
  updates: Partial<ColorPreset>
): ColorPreset {
  return {
    ...existing,
    ...updates,
    colors: {
      brand: {
        ...existing.colors.brand,
        ...(updates.colors?.brand || {})
      },
      semantic: {
        ...existing.colors.semantic,
        ...(updates.colors?.semantic || {})
      },
      neutral: {
        ...existing.colors.neutral,
        ...(updates.colors?.neutral || {})
      },
      interaction: {
        ...existing.colors.interaction,
        ...(updates.colors?.interaction || {})
      }
    },
    updatedAt: new Date()
  };
}

// 프리셋 이름 생성
export function generatePresetName(colors: ColorSystem): string {
  const primary = colors.brand.primary;
  const hsl = ColorTheory.hexToHSL(primary);
  
  // 색조에 따른 이름
  const hueNames: Record<string, string> = {
    '0-30': '빨강',
    '30-60': '주황',
    '60-90': '노랑',
    '90-150': '초록',
    '150-210': '청록',
    '210-270': '파랑',
    '270-330': '보라',
    '330-360': '분홍'
  };
  
  let hueName = '커스텀';
  for (const [range, name] of Object.entries(hueNames)) {
    const [min, max] = range.split('-').map(Number);
    if (hsl.h >= min && hsl.h < max) {
      hueName = name;
      break;
    }
  }
  
  // 명도에 따른 수식어
  const lightnessModifier = hsl.l > 70 ? '밝은 ' : hsl.l < 30 ? '어두운 ' : '';
  
  // 채도에 따른 수식어
  const saturationModifier = hsl.s > 80 ? '선명한 ' : hsl.s < 20 ? '은은한 ' : '';
  
  return `${saturationModifier}${lightnessModifier}${hueName}`;
}