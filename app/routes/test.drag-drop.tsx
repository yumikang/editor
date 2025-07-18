// 드래그앤드롭 테스트 페이지 - Phase 3 Day 6
import { useState } from 'react';
import { DesignTab } from '~/components/editor/DesignTab';
import type { ColorSystem } from '~/types/color-system';

export default function TestDragDrop() {
  const [editedData] = useState({
    header: {
      title: { korean: "웹사이트 제목", location: "h1" },
      subtitle: { korean: "부제목입니다", location: "h2" }
    },
    content: {
      paragraph: { korean: "본문 내용입니다.", location: "p" },
      link: { korean: "링크 텍스트", location: "a" }
    }
  });

  const initialColorSystem: ColorSystem = {
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
      focus: '#3B82F6',
      disabled: '#9CA3AF'
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b px-4 py-3">
        <h1 className="text-xl font-semibold">드래그앤드롭 테스트</h1>
        <p className="text-sm text-gray-600">좌측 컬러를 드래그하여 우측 컴포넌트에 놓으세요</p>
      </div>
      
      <div className="flex-1">
        <DesignTab
          templateId="test-template"
          editedData={editedData}
          initialColorSystem={initialColorSystem}
        />
      </div>
    </div>
  );
}