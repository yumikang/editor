import { useState } from 'react';
import { useFont } from '~/contexts/FontContext';
import { FontAddModal } from './FontAddModal';
import { FontPreviewModal } from './FontPreviewModal';
import type { CustomFont, FontLoadStrategy } from '~/types/font-types';

export function FontManager() {
  const { fonts, activeFonts, isLoading, error, toggleFont, updateLoadStrategy, removeFont } = useFont();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFont, setSelectedFont] = useState<CustomFont | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const handleLoadStrategyChange = (fontId: string, strategy: FontLoadStrategy) => {
    updateLoadStrategy(fontId, strategy);
  };
  
  return (
    <div className="font-manager bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">폰트 관리</h3>
            <p className="text-sm text-gray-500 mt-1">
              활성 폰트: {activeFonts.length}개 / 전체: {fonts.length}개
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            폰트 추가
          </button>
        </div>
      </div>
      
      {/* 에러 메시지 */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {/* 폰트 리스트 */}
      <div className="divide-y divide-gray-200">
        {fonts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium mb-1">폰트가 없습니다</p>
            <p className="text-sm">새 폰트를 추가하여 시작하세요</p>
          </div>
        ) : (
          fonts.map(font => (
            <FontItem
              key={font.id}
              font={font}
              onToggle={() => toggleFont(font.id)}
              onLoadStrategyChange={(strategy) => handleLoadStrategyChange(font.id, strategy)}
              onRemove={() => removeFont(font.id)}
              onPreview={() => {
                setSelectedFont(font);
                setShowPreview(true);
              }}
            />
          ))
        )}
      </div>
      
      {/* 로딩 오버레이 */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">처리 중...</span>
          </div>
        </div>
      )}
      
      {/* 모달 */}
      <FontAddModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />
      
      {selectedFont && (
        <FontPreviewModal
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setSelectedFont(null);
          }}
          font={selectedFont}
        />
      )}
    </div>
  );
}

interface FontItemProps {
  font: CustomFont;
  onToggle: () => void;
  onLoadStrategyChange: (strategy: FontLoadStrategy) => void;
  onRemove: () => void;
  onPreview: () => void;
}

function FontItem({ font, onToggle, onLoadStrategyChange, onRemove, onPreview }: FontItemProps) {
  const [showActions, setShowActions] = useState(false);
  
  const loadStrategyLabels = {
    immediate: '즉시 로드',
    lazy: '지연 로드',
    inactive: '비활성'
  };
  
  const loadStrategyColors = {
    immediate: 'bg-green-100 text-green-700',
    lazy: 'bg-yellow-100 text-yellow-700',
    inactive: 'bg-gray-100 text-gray-700'
  };
  
  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* 활성화 토글 */}
          <button
            onClick={onToggle}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              font.isActive ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                font.isActive ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
          
          {/* 폰트 정보 */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h4 className="font-medium text-gray-900">{font.displayName}</h4>
              <span className="text-sm text-gray-500 font-mono">{font.fontFamily}</span>
              {font.metadata.source && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {font.metadata.source}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-gray-500">
                {font.parsedData.weights.length}개 굵기
              </span>
              <span className={`text-xs px-2 py-0.5 rounded ${loadStrategyColors[font.loadStrategy]}`}>
                {loadStrategyLabels[font.loadStrategy]}
              </span>
              {font.usageCount > 0 && (
                <span className="text-sm text-gray-500">
                  {font.usageCount}회 사용
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* 액션 버튼 */}
        <div className="flex items-center gap-2">
          {/* 미리보기 */}
          <button
            onClick={onPreview}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="미리보기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          
          {/* 설정 메뉴 */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {/* 드롭다운 메뉴 */}
            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActions(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    로드 전략
                  </div>
                  {(['immediate', 'lazy', 'inactive'] as FontLoadStrategy[]).map(strategy => (
                    <button
                      key={strategy}
                      onClick={() => {
                        onLoadStrategyChange(strategy);
                        setShowActions(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                        font.loadStrategy === strategy ? 'bg-gray-50' : ''
                      }`}
                    >
                      <span>{loadStrategyLabels[strategy]}</span>
                      {font.loadStrategy === strategy && (
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                  <div className="border-t border-gray-200 mt-1 pt-1">
                    <button
                      onClick={() => {
                        if (confirm(`"${font.displayName}" 폰트를 삭제하시겠습니까?`)) {
                          onRemove();
                        }
                        setShowActions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      폰트 삭제
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}