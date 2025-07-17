import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import type { VersionMetadata, VersionHistory } from "~/utils/version-manager";

interface VersionControlProps {
  templateId: string;
  onVersionChange?: (version: string | null) => void;
}

interface VersionListData {
  success: boolean;
  history?: VersionHistory;
  hasUnsavedChanges?: boolean;
  error?: string;
}

interface VersionActionData {
  success?: boolean;
  message?: string;
  error?: string;
  restoredVersion?: string;
}

export default function VersionControl({ templateId, onVersionChange }: VersionControlProps) {
  const listFetcher = useFetcher<VersionListData>();
  const createFetcher = useFetcher<VersionActionData>();
  const restoreFetcher = useFetcher<VersionActionData>();
  const resetFetcher = useFetcher<VersionActionData>();
  const deleteFetcher = useFetcher<VersionActionData>();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newVersionDescription, setNewVersionDescription] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // 버전 히스토리 로드
  useEffect(() => {
    if (templateId) {
      listFetcher.load(`/api/version/list?templateId=${templateId}`);
    }
  }, [templateId]);

  // 액션 완료 후 새로고침
  useEffect(() => {
    if (createFetcher.data?.success || restoreFetcher.data?.success || 
        resetFetcher.data?.success || deleteFetcher.data?.success) {
      listFetcher.load(`/api/version/list?templateId=${templateId}`);
      setShowCreateDialog(false);
      setNewVersionDescription("");
      setShowDeleteConfirm(null);
      
      // 부모 컴포넌트에 변경사항 알림
      if (onVersionChange) {
        if (restoreFetcher.data?.restoredVersion) {
          onVersionChange(restoreFetcher.data.restoredVersion);
        } else if (resetFetcher.data?.success) {
          onVersionChange(null);
        }
      }
    }
  }, [createFetcher.data, restoreFetcher.data, resetFetcher.data, deleteFetcher.data, templateId, onVersionChange]);

  const history = listFetcher.data?.history;
  const hasUnsavedChanges = listFetcher.data?.hasUnsavedChanges || false;

  const handleCreateVersion = () => {
    if (!newVersionDescription.trim()) return;
    
    const formData = new FormData();
    formData.append('templateId', templateId);
    formData.append('description', newVersionDescription.trim());
    
    createFetcher.submit(formData, {
      method: 'POST',
      action: '/api/version/create'
    });
  };

  const handleRestoreVersion = (version: string) => {
    const formData = new FormData();
    formData.append('templateId', templateId);
    formData.append('version', version);
    
    restoreFetcher.submit(formData, {
      method: 'POST',
      action: '/api/version/restore'
    });
  };

  const handleResetToOriginal = () => {
    const formData = new FormData();
    formData.append('templateId', templateId);
    
    resetFetcher.submit(formData, {
      method: 'POST',
      action: '/api/version/reset'
    });
  };

  const handleDeleteVersion = (version: string) => {
    const formData = new FormData();
    formData.append('templateId', templateId);
    formData.append('version', version);
    
    deleteFetcher.submit(formData, {
      method: 'DELETE',
      action: '/api/version/delete'
    });
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChangesSummary = (changes: { texts: number; styles: number; media: number }) => {
    const parts = [];
    if (changes.texts > 0) parts.push(`텍스트 ${changes.texts}개`);
    if (changes.styles > 0) parts.push(`스타일 ${changes.styles}개`);
    if (changes.media > 0) parts.push(`미디어 ${changes.media}개`);
    return parts.join(', ') || '변경사항 없음';
  };

  if (listFetcher.state === 'loading') {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (listFetcher.data?.error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-semibold mb-2">오류</h3>
          <p>{listFetcher.data.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">버전 관리</h3>
        <div className="flex gap-2">
          {hasUnsavedChanges && (
            <button
              onClick={() => setShowCreateDialog(true)}
              disabled={createFetcher.state === 'submitting'}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {createFetcher.state === 'submitting' ? '저장 중...' : '버전 저장'}
            </button>
          )}
          <button
            onClick={handleResetToOriginal}
            disabled={resetFetcher.state === 'submitting'}
            className="px-4 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 disabled:opacity-50"
          >
            {resetFetcher.state === 'submitting' ? '리셋 중...' : '원본으로 리셋'}
          </button>
        </div>
      </div>

      {/* 현재 상태 표시 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">
              현재 상태: {history?.currentVersion ? `버전 ${history.currentVersion}` : '원본'}
            </div>
            {hasUnsavedChanges && (
              <div className="text-sm text-orange-600 mt-1">
                ⚠️ 저장되지 않은 변경사항이 있습니다
              </div>
            )}
          </div>
          {history?.originalBackupDate && (
            <div className="text-sm text-gray-500">
              원본 백업: {formatDate(history.originalBackupDate)}
            </div>
          )}
        </div>
      </div>

      {/* 버전 목록 */}
      <div className="space-y-3">
        {history?.versions && history.versions.length > 0 ? (
          history.versions
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((version) => (
              <div
                key={version.id}
                className={`border rounded-lg p-4 ${
                  history.currentVersion === version.version 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">버전 {version.version}</span>
                      {history.currentVersion === version.version && (
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                          현재
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        {formatDate(version.timestamp)}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-2">{version.description}</p>
                    
                    <div className="text-sm text-gray-500">
                      변경사항: {getChangesSummary(version.changes)}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {history.currentVersion !== version.version && (
                      <button
                        onClick={() => handleRestoreVersion(version.version)}
                        disabled={restoreFetcher.state === 'submitting'}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        복원
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowDeleteConfirm(version.version)}
                      disabled={deleteFetcher.state === 'submitting'}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>저장된 버전이 없습니다.</p>
            <p className="text-sm mt-1">변경사항을 만든 후 "버전 저장" 버튼을 클릭하세요.</p>
          </div>
        )}
      </div>

      {/* 버전 생성 다이얼로그 */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold mb-4">새 버전 저장</h4>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                변경사항 설명
              </label>
              <textarea
                id="description"
                value={newVersionDescription}
                onChange={(e) => setNewVersionDescription(e.target.value)}
                placeholder="이번 변경사항에 대해 설명해주세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewVersionDescription("");
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleCreateVersion}
                disabled={!newVersionDescription.trim() || createFetcher.state === 'submitting'}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {createFetcher.state === 'submitting' ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold mb-4">버전 삭제 확인</h4>
            
            <p className="text-gray-700 mb-6">
              버전 {showDeleteConfirm}을(를) 정말 삭제하시겠습니까?<br />
              <span className="text-red-600 text-sm">이 작업은 되돌릴 수 없습니다.</span>
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => {
                  handleDeleteVersion(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                disabled={deleteFetcher.state === 'submitting'}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                {deleteFetcher.state === 'submitting' ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 성공/에러 메시지 */}
      {(createFetcher.data?.message || restoreFetcher.data?.message || 
        resetFetcher.data?.message || deleteFetcher.data?.message) && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm">
            {createFetcher.data?.message || restoreFetcher.data?.message || 
             resetFetcher.data?.message || deleteFetcher.data?.message}
          </p>
        </div>
      )}

      {(createFetcher.data?.error || restoreFetcher.data?.error || 
        resetFetcher.data?.error || deleteFetcher.data?.error) && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">
            {createFetcher.data?.error || restoreFetcher.data?.error || 
             resetFetcher.data?.error || deleteFetcher.data?.error}
          </p>
        </div>
      )}
    </div>
  );
}