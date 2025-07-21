import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import type { DesignAnalysisResult } from '~/utils/design-scanner.server';
import pkg from 'lodash';
const { debounce } = pkg;

// 편집된 디자인 데이터 구조
export interface EditedDesign {
  colors: {
    [originalColor: string]: {
      newColor: string;
      usage: string[];
      lastModified: string;
    };
  };
  typography: {
    [key: string]: {
      original: {
        fontFamily: string;
        fontSize: string;
        fontWeight: string;
        lineHeight?: string;
        letterSpacing?: string;
      };
      updates: {
        fontFamily?: string;
        fontSize?: string;
        fontWeight?: string;
        lineHeight?: string;
        letterSpacing?: string;
      };
      lastModified: string;
    };
  };
  spacing: {
    // 향후 구현
  };
  metadata: {
    templateId: string;
    version: number;
    lastSaved: string;
    createdAt: string;
  };
}

interface EditorContextType {
  // 상태
  templateId: string;
  designAnalysis: DesignAnalysisResult | null;
  editedDesign: EditedDesign | null;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  lastSaveTime: Date | null;
  
  // 액션
  updateColor: (originalColor: string, newColor: string, usage: string) => void;
  updateTypography: (original: any, updates: any) => void;
  saveDesign: () => Promise<void>;
  loadDesign: () => Promise<void>;
  resetDesign: () => Promise<void>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

interface EditorProviderProps {
  children: ReactNode;
  templateId: string;
  initialDesignAnalysis?: DesignAnalysisResult | null;
  initialEditedDesign?: EditedDesign | null;
}

export function EditorProvider({
  children,
  templateId,
  initialDesignAnalysis = null,
  initialEditedDesign = null
}: EditorProviderProps) {
  const [designAnalysis] = useState<DesignAnalysisResult | null>(initialDesignAnalysis);
  const [editedDesign, setEditedDesign] = useState<EditedDesign | null>(initialEditedDesign);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  
  const saveFetcher = useFetcher();
  const loadFetcher = useFetcher();
  
  // 디바운스된 저장 함수 (500ms)
  const debouncedSave = useCallback(
    debounce(async (design: EditedDesign) => {
      setIsSaving(true);
      
      const formData = new FormData();
      formData.append('templateId', templateId);
      formData.append('design', JSON.stringify(design));
      
      saveFetcher.submit(formData, {
        method: 'POST',
        action: '/api/design/save'
      });
    }, 500),
    [templateId]
  );
  
  // 색상 업데이트
  const updateColor = useCallback((originalColor: string, newColor: string, usage: string) => {
    setEditedDesign(prev => {
      const newDesign = {
        ...prev,
        colors: {
          ...prev?.colors,
          [originalColor]: {
            newColor,
            usage: prev?.colors?.[originalColor]?.usage || [usage],
            lastModified: new Date().toISOString()
          }
        },
        metadata: {
          ...prev?.metadata,
          templateId,
          version: (prev?.metadata?.version || 0) + 1,
          lastSaved: prev?.metadata?.lastSaved || new Date().toISOString(),
          createdAt: prev?.metadata?.createdAt || new Date().toISOString()
        }
      } as EditedDesign;
      
      // 디바운스된 저장
      debouncedSave(newDesign);
      
      return newDesign;
    });
    
    setHasUnsavedChanges(true);
    
    // 미리보기에 색상 변경 전송
    window.postMessage({
      type: 'UPDATE_COLOR',
      originalColor,
      newColor,
      usage
    }, '*');
  }, [templateId, debouncedSave]);
  
  // 타이포그래피 업데이트
  const updateTypography = useCallback((original: any, updates: any) => {
    const key = `${original.fontFamily}-${original.fontSize}-${original.fontWeight}`;
    
    setEditedDesign(prev => {
      const newDesign = {
        ...prev,
        typography: {
          ...prev?.typography,
          [key]: {
            original,
            updates,
            lastModified: new Date().toISOString()
          }
        },
        metadata: {
          ...prev?.metadata,
          templateId,
          version: (prev?.metadata?.version || 0) + 1,
          lastSaved: prev?.metadata?.lastSaved || new Date().toISOString(),
          createdAt: prev?.metadata?.createdAt || new Date().toISOString()
        }
      } as EditedDesign;
      
      // 디바운스된 저장
      debouncedSave(newDesign);
      
      return newDesign;
    });
    
    setHasUnsavedChanges(true);
    
    // 미리보기에 타이포그래피 변경 전송
    window.postMessage({
      type: 'UPDATE_TYPOGRAPHY',
      original,
      updates
    }, '*');
  }, [templateId, debouncedSave]);
  
  // 디자인 저장
  const saveDesign = useCallback(async () => {
    if (!editedDesign || !hasUnsavedChanges) return;
    
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append('templateId', templateId);
    formData.append('design', JSON.stringify(editedDesign));
    
    saveFetcher.submit(formData, {
      method: 'POST',
      action: '/api/design/save'
    });
  }, [editedDesign, hasUnsavedChanges, templateId]);
  
  // 디자인 불러오기
  const loadDesign = useCallback(async () => {
    loadFetcher.load(`/api/design/load?templateId=${templateId}`);
  }, [templateId]);
  
  // 디자인 초기화
  const resetDesign = useCallback(async () => {
    const formData = new FormData();
    formData.append('templateId', templateId);
    
    saveFetcher.submit(formData, {
      method: 'POST',
      action: '/api/design/reset'
    });
    
    setEditedDesign(null);
    setHasUnsavedChanges(false);
  }, [templateId]);
  
  // 저장 상태 감지
  useEffect(() => {
    if (saveFetcher.state === 'idle' && saveFetcher.data) {
      setIsSaving(false);
      if (saveFetcher.data.success) {
        setHasUnsavedChanges(false);
        setLastSaveTime(new Date());
      }
    }
  }, [saveFetcher.state, saveFetcher.data]);
  
  // 불러오기 상태 감지
  useEffect(() => {
    if (loadFetcher.state === 'idle' && loadFetcher.data?.design) {
      setEditedDesign(loadFetcher.data.design);
    }
  }, [loadFetcher.state, loadFetcher.data]);
  
  const value: EditorContextType = {
    templateId,
    designAnalysis,
    editedDesign,
    hasUnsavedChanges,
    isSaving,
    lastSaveTime,
    updateColor,
    updateTypography,
    saveDesign,
    loadDesign,
    resetDesign
  };
  
  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
}