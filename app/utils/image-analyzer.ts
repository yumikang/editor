import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface ImageInfo {
  width: number;
  height: number;
  format?: string;
  size?: number;
}

export async function getImageInfo(imagePath: string): Promise<ImageInfo | null> {
  try {
    // 절대 경로인지 확인
    const fullPath = path.isAbsolute(imagePath) ? imagePath : path.join(process.cwd(), imagePath);
    
    // 파일 존재 확인
    try {
      await fs.access(fullPath);
    } catch {
      console.log(`Image not found: ${fullPath}`);
      return null;
    }
    
    // Sharp로 이미지 메타데이터 읽기
    const metadata = await sharp(fullPath).metadata();
    const stats = await fs.stat(fullPath);
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format,
      size: stats.size
    };
  } catch (error) {
    console.error(`Error analyzing image ${imagePath}:`, error);
    return null;
  }
}

export async function analyzeThemeImages(themePath: string, imagePaths: string[]): Promise<Record<string, ImageInfo>> {
  const imageInfoMap: Record<string, ImageInfo> = {};
  
  for (const imagePath of imagePaths) {
    // 상대 경로를 절대 경로로 변환
    const fullPath = path.join(themePath, imagePath);
    const info = await getImageInfo(fullPath);
    
    if (info) {
      imageInfoMap[imagePath] = info;
    }
  }
  
  return imageInfoMap;
}