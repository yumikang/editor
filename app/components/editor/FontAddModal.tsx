import { useState } from 'react';
import { useFont } from '~/contexts/FontContext';

interface FontAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FontAddModal({ isOpen, onClose }: FontAddModalProps) {
  const { addFont, searchNoonnu } = useFont();
  const [activeTab, setActiveTab] = useState<'url' | 'noonnu'>('url');
  const [fontUrl, setFontUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  
  if (!isOpen) return null;
  
  const handleAddFromUrl = async () => {
    if (!fontUrl.trim()) {
      setError('폰트 CSS URL을 입력해주세요.');
      return;
    }
    
    setIsAdding(true);
    setError('');
    
    try {
      await addFont(fontUrl.trim());
      setFontUrl('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '폰트 추가에 실패했습니다.');
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError('');
    
    try {
      const results = await searchNoonnu(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setError('검색에 실패했습니다.');
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleAddFromNoonnu = async (font: any) => {
    setIsAdding(true);
    setError('');
    
    try {
      await addFont(font.cssUrl);
      onClose();
    } catch (err) {
      setError('폰트 추가에 실패했습니다.');
    } finally {
      setIsAdding(false);
    }
  };
  
  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* 모달 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">폰트 추가</h2>
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
          
          {/* 탭 */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'url'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              URL로 추가
            </button>
            <button
              onClick={() => setActiveTab('noonnu')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'noonnu'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              눈누에서 검색
            </button>
          </div>
          
          {/* 내용 */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            {activeTab === 'url' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    폰트 CSS URL
                  </label>
                  <input
                    type="url"
                    value={fontUrl}
                    onChange={(e) => setFontUrl(e.target.value)}
                    placeholder="https://fonts.googleapis.com/css2?family=..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Google Fonts, 눈누, 또는 다른 웹폰트 서비스의 CSS URL을 입력하세요.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">예시</h3>
                  <div className="space-y-2">
                    <ExampleUrl
                      name="Google Fonts - Noto Sans KR"
                      url="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap"
                      onUse={setFontUrl}
                    />
                    <ExampleUrl
                      name="눈누 - 마포꽃섬"
                      url="https://hangeul.pstatic.net/hangeul_static/css/mpo-flower-island.css"
                      onUse={setFontUrl}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    폰트 검색
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="폰트 이름을 입력하세요"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isSearching ? '검색 중...' : '검색'}
                    </button>
                  </div>
                </div>
                
                {/* 검색 결과 */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">
                      검색 결과 ({searchResults.length}개)
                    </h3>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {searchResults.map((font, index) => (
                        <div
                          key={index}
                          className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{font.name}</h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {font.category} · {font.weights.length}개 굵기 · {font.license}
                              </p>
                            </div>
                            <button
                              onClick={() => handleAddFromNoonnu(font)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              추가
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {searchResults.length === 0 && searchQuery && !isSearching && (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>검색 결과가 없습니다.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 하단 버튼 */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              취소
            </button>
            {activeTab === 'url' && (
              <button
                onClick={handleAddFromUrl}
                disabled={!fontUrl.trim() || isAdding}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isAdding ? '추가 중...' : '폰트 추가'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ExampleUrl({ name, url, onUse }: { name: string; url: string; onUse: (url: string) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <p className="text-xs text-gray-500 truncate mt-1">{url}</p>
      </div>
      <button
        onClick={() => onUse(url)}
        className="ml-3 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        사용
      </button>
    </div>
  );
}