import { useState, useEffect } from 'react';
import type { CustomFont } from '~/types/font-types';

interface FontPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  font: CustomFont;
}

const PREVIEW_TEXTS = {
  korean: '가나다라마바사아자차카타파하 0123456789',
  pangram: 'The quick brown fox jumps over the lazy dog',
  mixed: '안녕하세요! Hello World! 1234567890',
  sentence: '좋은 디자인은 명확하고 아름답습니다.',
  alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789 !@#$%^&*()_+-=[]{}|;:,.<>?'
};

export function FontPreviewModal({ isOpen, onClose, font }: FontPreviewModalProps) {
  const [previewText, setPreviewText] = useState(PREVIEW_TEXTS.mixed);
  const [fontSize, setFontSize] = useState(24);
  const [fontWeight, setFontWeight] = useState('400');
  const [isCustomText, setIsCustomText] = useState(false);
  
  useEffect(() => {
    if (font.parsedData.weights.length > 0 && !font.parsedData.weights.includes(fontWeight)) {
      setFontWeight(font.parsedData.weights[0]);
    }
  }, [font, fontWeight]);
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* 모달 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{font.displayName} 미리보기</h2>
                <p className="text-sm text-gray-500 mt-1">{font.fontFamily}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* 컨트롤 */}
          <div className="px-6 py-4 border-b border-gray-200 space-y-4">
            <div className="flex flex-wrap gap-4">
              {/* 글자 크기 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  글자 크기
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-600 w-12">{fontSize}px</span>
                </div>
              </div>
              
              {/* 굵기 */}
              {font.parsedData.weights.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    굵기
                  </label>
                  <select
                    value={fontWeight}
                    onChange={(e) => setFontWeight(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {font.parsedData.weights.map(weight => (
                      <option key={weight} value={weight}>
                        {weight} {getWeightName(weight)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {/* 프리셋 텍스트 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                미리보기 텍스트
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PREVIEW_TEXTS).map(([key, text]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setPreviewText(text);
                      setIsCustomText(false);
                    }}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      !isCustomText && previewText === text
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getPresetLabel(key)}
                  </button>
                ))}
                <button
                  onClick={() => setIsCustomText(true)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    isCustomText
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  사용자 정의
                </button>
              </div>
              
              {isCustomText && (
                <textarea
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="미리보기할 텍스트를 입력하세요"
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              )}
            </div>
          </div>
          
          {/* 미리보기 영역 */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="min-h-[200px] p-8 bg-gray-50 rounded-lg">
              <style dangerouslySetInnerHTML={{ __html: `@import url('${font.cssUrl}');` }} />
              <p
                style={{
                  fontFamily: font.parsedData.fontFamily,
                  fontSize: `${fontSize}px`,
                  fontWeight: fontWeight,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}
                className="text-gray-900"
              >
                {previewText}
              </p>
            </div>
            
            {/* 폰트 정보 */}
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">폰트 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="폰트명" value={font.displayName} />
                <InfoItem label="Font Family" value={font.fontFamily} />
                <InfoItem label="출처" value={font.metadata.source} />
                <InfoItem label="라이선스" value={font.metadata.license} />
                <InfoItem label="사용 가능한 굵기" value={font.parsedData.weights.join(', ')} />
                <InfoItem label="로드 전략" value={getLoadStrategyLabel(font.loadStrategy)} />
              </div>
              
              {font.metadata.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">설명</h4>
                  <p className="text-sm text-gray-600">{font.metadata.description}</p>
                </div>
              )}
              
              {font.metadata.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">태그</h4>
                  <div className="flex flex-wrap gap-2">
                    {font.metadata.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 하단 버튼 */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 mt-1">{value}</dd>
    </div>
  );
}

function getWeightName(weight: string): string {
  const weightNames: Record<string, string> = {
    '100': 'Thin',
    '200': 'Extra Light',
    '300': 'Light',
    '400': 'Regular',
    '500': 'Medium',
    '600': 'Semi Bold',
    '700': 'Bold',
    '800': 'Extra Bold',
    '900': 'Black'
  };
  return weightNames[weight] || '';
}

function getPresetLabel(key: string): string {
  const labels: Record<string, string> = {
    korean: '한글',
    pangram: 'Pangram',
    mixed: '한영 혼용',
    sentence: '문장',
    alphabet: '알파벳',
    numbers: '숫자/특수문자'
  };
  return labels[key] || key;
}

function getLoadStrategyLabel(strategy: string): string {
  const labels: Record<string, string> = {
    immediate: '즉시 로드',
    lazy: '지연 로드',
    inactive: '비활성'
  };
  return labels[strategy] || strategy;
}