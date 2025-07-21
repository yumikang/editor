import { json, type LoaderFunctionArgs } from "@remix-run/node";
import type { ColorPreset } from "~/types/editor-types";

// 기본 색상 프리셋
const DEFAULT_PRESETS: ColorPreset[] = [
  {
    id: 'modern-blue',
    name: '모던 블루',
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      accent: '#F59E0B',
      neutral: { dark: '#1F2937', light: '#F3F4F6' }
    }
  },
  {
    id: 'elegant-purple',
    name: '엘레강트 퍼플',
    colors: {
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#14B8A6',
      neutral: { dark: '#111827', light: '#F9FAFB' }
    }
  },
  {
    id: 'warm-orange',
    name: '따뜻한 오렌지',
    colors: {
      primary: '#F97316',
      secondary: '#EF4444',
      accent: '#84CC16',
      neutral: { dark: '#292524', light: '#FEF3C7' }
    }
  },
  {
    id: 'minimalist',
    name: '미니멀리스트',
    colors: {
      primary: '#000000',
      secondary: '#666666',
      accent: '#0066FF',
      neutral: { dark: '#000000', light: '#FFFFFF' }
    }
  },
  {
    id: 'nature-green',
    name: '자연의 초록',
    colors: {
      primary: '#10B981',
      secondary: '#065F46',
      accent: '#F59E0B',
      neutral: { dark: '#064E3B', light: '#ECFDF5' }
    }
  }
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // TODO: 사용자 커스텀 프리셋 로드
    const customPresets: ColorPreset[] = [];
    
    return json({
      success: true,
      presets: DEFAULT_PRESETS,
      custom: customPresets
    });
  } catch (error) {
    console.error("Error loading color presets:", error);
    return json({
      success: false,
      error: "Failed to load color presets",
      presets: DEFAULT_PRESETS,
      custom: []
    }, { status: 500 });
  }
};