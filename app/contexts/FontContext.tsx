import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useFetcher } from '@remix-run/react';
import type { CustomFont, FontContextType, FontLoadStrategy } from '~/types/font-types';
import { parseFontCSS, extractFontData, validateFontUrl, extractFontName } from '~/utils/font-parser';
import { injectAllActiveFonts, cleanupInactiveFonts, injectFontStyle, removeFontStyle, updateIframeFonts } from '~/utils/font-injector';

const FontContext = createContext<FontContextType | null>(null);

export function useFont() {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error('useFont must be used within FontProvider');
  }
  return context;
}

interface FontProviderProps {
  children: ReactNode;
  initialFonts?: CustomFont[];
}

export function FontProvider({ children, initialFonts = [] }: FontProviderProps) {
  const [fonts, setFonts] = useState<CustomFont[]>(initialFonts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetcher = useFetcher();

  // Get active fonts
  const activeFonts = fonts.filter(f => f.isActive);

  // Inject fonts on mount and when fonts change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      injectAllActiveFonts(fonts);
      cleanupInactiveFonts(fonts);
      updateIframeFonts(fonts);
    }
  }, [fonts]);

  // Load fonts from storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && initialFonts.length === 0) {
      refreshFonts();
    }
  }, []);

  const refreshFonts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/fonts/load');
      const data = await response.json();
      
      if (data.success) {
        setFonts(data.fonts);
      } else {
        setError(data.error || 'Failed to load fonts');
      }
    } catch (err) {
      setError('Failed to load fonts');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addFont = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate URL
      if (!validateFontUrl(url)) {
        throw new Error('Invalid font URL. Please provide a valid CSS file URL.');
      }
      
      // Parse CSS
      const parsed = await parseFontCSS(url);
      const fontData = extractFontData(parsed);
      
      // Create new font object
      const newFont: CustomFont = {
        id: `font-${Date.now()}`,
        fontFamily: fontData.fontFamily,
        displayName: extractFontName(url, fontData.fontFamily),
        cssUrl: url,
        parsedData: fontData,
        metadata: {
          source: 'Custom',
          license: 'Unknown',
          description: 'Custom font',
          tags: [],
          popularity: 0
        },
        loadStrategy: 'immediate' as FontLoadStrategy,
        isActive: true,
        usageCount: 0,
        lastUsedAt: null,
        createdAt: new Date().toISOString()
      };
      
      // Save to server
      const formData = new FormData();
      formData.append('font', JSON.stringify(newFont));
      
      fetcher.submit(formData, {
        method: 'POST',
        action: '/api/fonts/add'
      });
      
      // Update local state
      setFonts(prev => [...prev, newFont]);
      
      // Inject immediately
      injectFontStyle(newFont);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add font');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher]);

  const removeFont = useCallback(async (fontId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Remove from server
      const formData = new FormData();
      formData.append('fontId', fontId);
      
      fetcher.submit(formData, {
        method: 'POST',
        action: '/api/fonts/remove'
      });
      
      // Update local state
      setFonts(prev => prev.filter(f => f.id !== fontId));
      
      // Remove style
      removeFontStyle(fontId);
      
    } catch (err) {
      setError('Failed to remove font');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher]);

  const toggleFont = useCallback(async (fontId: string) => {
    const font = fonts.find(f => f.id === fontId);
    if (!font) return;
    
    const updatedFont = {
      ...font,
      isActive: !font.isActive,
      lastUsedAt: !font.isActive ? new Date().toISOString() : font.lastUsedAt
    };
    
    // Update server
    const formData = new FormData();
    formData.append('font', JSON.stringify(updatedFont));
    
    fetcher.submit(formData, {
      method: 'POST',
      action: '/api/fonts/update'
    });
    
    // Update local state
    setFonts(prev => prev.map(f => f.id === fontId ? updatedFont : f));
    
    // Update styles
    if (updatedFont.isActive) {
      injectFontStyle(updatedFont);
    } else {
      removeFontStyle(fontId);
    }
  }, [fonts, fetcher]);

  const updateLoadStrategy = useCallback(async (fontId: string, strategy: FontLoadStrategy) => {
    const font = fonts.find(f => f.id === fontId);
    if (!font) return;
    
    const updatedFont = {
      ...font,
      loadStrategy: strategy
    };
    
    // Update server
    const formData = new FormData();
    formData.append('font', JSON.stringify(updatedFont));
    
    fetcher.submit(formData, {
      method: 'POST',
      action: '/api/fonts/update'
    });
    
    // Update local state
    setFonts(prev => prev.map(f => f.id === fontId ? updatedFont : f));
    
    // Update styles based on strategy
    if (strategy === 'inactive') {
      removeFontStyle(fontId);
    } else if (font.isActive) {
      injectFontStyle(updatedFont);
    }
  }, [fonts, fetcher]);

  const searchNoonnu = useCallback(async (query: string) => {
    try {
      // This would typically call a Noonnu API endpoint
      // For now, return mock data
      return [
        {
          id: 'noonnu-1',
          name: '마포꽃섬',
          nameEn: 'MapoFlowerIsland',
          cssUrl: 'https://hangeul.pstatic.net/hangeul_static/css/mpo-flower-island.css',
          category: 'display',
          weights: ['400'],
          license: 'OFL',
          source: 'Noonnu',
          tags: ['display', 'korean']
        }
      ];
    } catch (err) {
      console.error('Search error:', err);
      return [];
    }
  }, []);

  const value: FontContextType = {
    fonts,
    activeFonts,
    isLoading,
    error,
    addFont,
    removeFont,
    toggleFont,
    updateLoadStrategy,
    refreshFonts,
    searchNoonnu
  };

  return (
    <FontContext.Provider value={value}>
      {children}
    </FontContext.Provider>
  );
}