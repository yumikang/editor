// 스타일 토큰 API 엔드포인트 - Phase 3
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { StyleTokenManager } from '~/utils/style-token-manager';
import type { StyleTokenSystem } from '~/types/style-tokens';

// GET: 현재 스타일 토큰 가져오기
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const templateId = url.searchParams.get('templateId');
  
  if (!templateId) {
    return json({ error: "templateId is required" }, { status: 400 });
  }
  
  try {
    const tokenManager = new StyleTokenManager(templateId);
    const styleTokens = await tokenManager.loadTokens();
    
    return json({ 
      success: true, 
      styleTokens,
      cssVariables: tokenManager.exportAsCSSVariables()
    });
  } catch (error) {
    console.error('Error loading style tokens:', error);
    return json({ 
      error: "Failed to load style tokens", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST: 스타일 토큰 업데이트
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: "Method not allowed" }, { status: 405 });
  }
  
  try {
    const formData = await request.formData();
    const templateId = formData.get('templateId') as string;
    const operation = formData.get('operation') as string;
    
    if (!templateId) {
      return json({ error: "templateId is required" }, { status: 400 });
    }
    
    const tokenManager = new StyleTokenManager(templateId);
    await tokenManager.loadTokens();
    
    switch (operation) {
      case 'update': {
        const category = formData.get('category') as string;
        const subcategory = formData.get('subcategory') as string;
        const key = formData.get('key') as string;
        const value = formData.get('value') as string;
        
        if (!category || !key || !value) {
          return json({ error: "category, key, and value are required" }, { status: 400 });
        }
        
        // 토큰 업데이트
        if (category === 'spacing') {
          tokenManager.updateSpacing(key as any, value);
        } else if (category === 'typography' && subcategory) {
          tokenManager.updateTypography(subcategory as any, key, value);
        } else if (category === 'effects' && subcategory) {
          tokenManager.updateEffects(subcategory as any, key, value);
        } else if (category === 'transitions' && subcategory) {
          tokenManager.updateTransitions(subcategory as any, key, value);
        }
        
        // 저장
        await tokenManager.saveTokens();
        
        return json({ 
          success: true, 
          message: "Style token updated",
          cssVariables: tokenManager.exportAsCSSVariables()
        });
      }
      
      case 'updateAll': {
        const styleTokensData = formData.get('styleTokens') as string;
        if (!styleTokensData) {
          return json({ error: "styleTokens data is required" }, { status: 400 });
        }
        
        const newTokens = JSON.parse(styleTokensData) as Partial<StyleTokenSystem>;
        tokenManager.mergeTokens(newTokens);
        
        // 저장
        await tokenManager.saveTokens();
        
        return json({ 
          success: true, 
          message: "All style tokens updated",
          cssVariables: tokenManager.exportAsCSSVariables()
        });
      }
      
      case 'reset': {
        tokenManager.resetToDefaults();
        await tokenManager.saveTokens();
        
        return json({ 
          success: true, 
          message: "Style tokens reset to defaults",
          cssVariables: tokenManager.exportAsCSSVariables()
        });
      }
      
      case 'generateScale': {
        const scaleType = formData.get('scaleType') as string;
        const baseValue = formData.get('baseValue') as string;
        
        if (!scaleType || !baseValue) {
          return json({ error: "scaleType and baseValue are required" }, { status: 400 });
        }
        
        const base = parseInt(baseValue);
        
        if (scaleType === 'spacing') {
          const spacingScale = StyleTokenManager.generateSpacingScale(base);
          tokenManager.mergeTokens({ spacing: spacingScale });
        } else if (scaleType === 'fontSize') {
          const fontSizeScale = StyleTokenManager.generateFontSizeScale(base);
          tokenManager.mergeTokens({ 
            typography: { 
              ...tokenManager.getTokens().typography,
              fontSize: fontSizeScale 
            } 
          });
        }
        
        await tokenManager.saveTokens();
        
        return json({ 
          success: true, 
          message: `${scaleType} scale generated`,
          cssVariables: tokenManager.exportAsCSSVariables()
        });
      }
      
      default:
        return json({ error: "Invalid operation" }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing style tokens:', error);
    return json({ 
      error: "Failed to process style tokens", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}