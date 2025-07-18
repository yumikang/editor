// 컬러 토큰 API 엔드포인트 - Phase 2.5
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import * as fs from 'fs/promises';
import * as path from 'path';
import { ColorTokenManager } from '~/utils/color-token-manager';
import type { ColorSystem } from '~/types/color-system';

// GET: 현재 컬러 토큰 시스템 가져오기
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const templateId = url.searchParams.get('templateId');
  
  if (!templateId) {
    return json({ error: "templateId is required" }, { status: 400 });
  }
  
  try {
    const colorSystemPath = path.join(
      process.cwd(),
      'app/data/themes',
      templateId,
      'working',
      'colors.json'
    );
    
    // 컬러 시스템 파일이 있는지 확인
    try {
      await fs.access(colorSystemPath);
      const colorSystemData = await fs.readFile(colorSystemPath, 'utf-8');
      const colorSystem = JSON.parse(colorSystemData) as ColorSystem;
      
      return json({ 
        success: true, 
        colorSystem,
        cssVariables: new ColorTokenManager(colorSystem).exportAsCSSVariables()
      });
    } catch {
      // 파일이 없으면 기본값 반환
      const tokenManager = new ColorTokenManager();
      return json({ 
        success: true, 
        colorSystem: tokenManager.getColorSystem(),
        cssVariables: tokenManager.exportAsCSSVariables(),
        isDefault: true
      });
    }
  } catch (error) {
    console.error('Error loading color tokens:', error);
    return json({ 
      error: "Failed to load color tokens", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// POST: 컬러 토큰 시스템 업데이트
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
    
    const workingPath = path.join(
      process.cwd(),
      'app/data/themes',
      templateId,
      'working'
    );
    
    // 작업 디렉토리 확인
    await fs.mkdir(workingPath, { recursive: true });
    
    switch (operation) {
      case 'update': {
        const colorSystemData = formData.get('colorSystem') as string;
        if (!colorSystemData) {
          return json({ error: "colorSystem data is required" }, { status: 400 });
        }
        
        const colorSystem = JSON.parse(colorSystemData) as ColorSystem;
        
        // 컬러 시스템 저장
        await fs.writeFile(
          path.join(workingPath, 'colors.json'),
          JSON.stringify(colorSystem, null, 2)
        );
        
        // 🆕 버전 관리 시스템에도 업데이트
        const versionManager = new (await import('~/utils/version-manager')).VersionManager(
          templateId,
          path.join(process.cwd(), 'app/data/themes')
        );
        
        const workingData = await versionManager.loadWorkingData();
        if (workingData) {
          await versionManager.saveWorkingData({
            ...workingData,
            colorSystem
          });
        }
        
        // CSS 변수 생성
        const tokenManager = new ColorTokenManager(colorSystem);
        const cssVariables = tokenManager.exportAsCSSVariables();
        
        return json({ 
          success: true, 
          message: "Color system updated",
          cssVariables
        });
      }
      
      case 'analyze': {
        // 템플릿의 현재 스타일 분석
        const stylesPath = path.join(workingPath, 'styles.json');
        
        try {
          const stylesData = await fs.readFile(stylesPath, 'utf-8');
          const styles = JSON.parse(stylesData);
          
          const tokenManager = new ColorTokenManager();
          const analysis = tokenManager.analyzeTemplateColors(styles);
          
          return json({ 
            success: true, 
            analysis
          });
        } catch {
          return json({ 
            error: "No styles found to analyze" 
          }, { status: 404 });
        }
      }
      
      case 'apply': {
        // 컬러 토큰을 스타일에 적용 (Phase 3에서 완전 구현)
        const tokenPath = formData.get('tokenPath') as string;
        const selector = formData.get('selector') as string;
        const property = formData.get('property') as string;
        
        if (!tokenPath || !selector || !property) {
          return json({ 
            error: "tokenPath, selector, and property are required" 
          }, { status: 400 });
        }
        
        // 간단한 적용 로직 (Phase 2.5)
        return json({ 
          success: true, 
          message: "Token application will be fully implemented in Phase 3",
          preview: {
            selector,
            property,
            tokenPath,
            cssVariable: `var(--color-${tokenPath.replace(/\./g, '-')})`
          }
        });
      }
      
      default:
        return json({ error: "Invalid operation" }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing color tokens:', error);
    return json({ 
      error: "Failed to process color tokens", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}