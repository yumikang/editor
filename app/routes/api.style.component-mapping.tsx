// 컴포넌트 매핑 API 엔드포인트 - Phase 3 Day 6
import { json, type ActionFunctionArgs } from "@remix-run/node";
import * as fs from 'fs/promises';
import * as path from 'path';
import type { ExtendedStyleElement, ColorTokenReference } from '~/types/editor-extended';

interface ComponentMapping {
  componentId: string;
  selector: string;
  tokenPath: string;
  property: string;
}

// POST: 컴포넌트와 컬러 토큰 매핑
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: "Method not allowed" }, { status: 405 });
  }
  
  try {
    const formData = await request.formData();
    const templateId = formData.get('templateId') as string;
    const componentId = formData.get('componentId') as string;
    const operation = formData.get('operation') as string;
    
    if (!templateId || !componentId) {
      return json({ error: "templateId and componentId are required" }, { status: 400 });
    }
    
    const workingPath = path.join(
      process.cwd(),
      'app/data/themes',
      templateId,
      'working'
    );
    
    const stylesPath = path.join(workingPath, 'styles.json');
    const mappingsPath = path.join(workingPath, 'component-mappings.json');
    
    // 현재 매핑 로드
    let currentMappings: Record<string, ComponentMapping> = {};
    try {
      const mappingsData = await fs.readFile(mappingsPath, 'utf-8');
      currentMappings = JSON.parse(mappingsData);
    } catch {
      // 파일이 없으면 빈 객체로 시작
    }
    
    if (operation === 'remove') {
      // 매핑 제거
      delete currentMappings[componentId];
      
      // 스타일에서도 토큰 참조 제거 (원래 색상으로 복원)
      await revertComponentStyle(stylesPath, componentId);
    } else {
      // 매핑 추가/업데이트
      const selector = formData.get('selector') as string;
      const tokenPath = formData.get('tokenPath') as string;
      const property = formData.get('property') as string;
      
      if (!selector || !tokenPath || !property) {
        return json({ 
          error: "selector, tokenPath, and property are required for mapping" 
        }, { status: 400 });
      }
      
      currentMappings[componentId] = {
        componentId,
        selector,
        tokenPath,
        property
      };
      
      // 스타일 파일 업데이트
      await updateComponentStyle(stylesPath, componentId, selector, tokenPath, property);
    }
    
    // 매핑 저장
    await fs.writeFile(
      mappingsPath,
      JSON.stringify(currentMappings, null, 2)
    );
    
    return json({ 
      success: true, 
      message: operation === 'remove' ? "Mapping removed" : "Mapping updated",
      mappings: currentMappings
    });
    
  } catch (error) {
    console.error('Error processing component mapping:', error);
    return json({ 
      error: "Failed to process component mapping", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// 컴포넌트 스타일에 토큰 적용
async function updateComponentStyle(
  stylesPath: string,
  componentId: string,
  selector: string,
  tokenPath: string,
  property: string
) {
  try {
    // 현재 스타일 로드
    const stylesData = await fs.readFile(stylesPath, 'utf-8');
    const styles = JSON.parse(stylesData) as Record<string, ExtendedStyleElement>;
    
    // 해당 셀렉터 찾기 또는 생성
    let targetElement = Object.values(styles).find(el => el.selector === selector);
    
    if (!targetElement) {
      // 새로운 스타일 요소 생성
      styles[componentId] = {
        selector,
        styles: {},
        responsive: {}
      };
      targetElement = styles[componentId];
    }
    
    // 토큰 참조로 속성 업데이트
    const tokenReference: ColorTokenReference = {
      token: tokenPath,
      fallback: targetElement.styles[property as keyof typeof targetElement.styles] as string || '#000000'
    };
    
    // 스타일 업데이트
    (targetElement.styles as any)[property] = tokenReference;
    
    // 파일 저장
    await fs.writeFile(stylesPath, JSON.stringify(styles, null, 2));
    
  } catch (error) {
    console.error('Error updating component style:', error);
    throw error;
  }
}

// 컴포넌트 스타일 원래대로 복원
async function revertComponentStyle(
  stylesPath: string,
  componentId: string
) {
  try {
    const stylesData = await fs.readFile(stylesPath, 'utf-8');
    const styles = JSON.parse(stylesData) as Record<string, ExtendedStyleElement>;
    
    const element = styles[componentId];
    if (!element) return;
    
    // 토큰 참조를 원래 색상으로 복원
    const colorProps = ['color', 'backgroundColor', 'borderColor', 'outlineColor'];
    
    for (const prop of colorProps) {
      const value = element.styles[prop as keyof typeof element.styles];
      if (value && typeof value === 'object' && 'token' in value && 'fallback' in value) {
        // ColorTokenReference를 fallback 값으로 교체
        (element.styles as any)[prop] = value.fallback;
      }
    }
    
    await fs.writeFile(stylesPath, JSON.stringify(styles, null, 2));
    
  } catch (error) {
    console.error('Error reverting component style:', error);
    throw error;
  }
}