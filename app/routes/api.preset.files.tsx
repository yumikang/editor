// 프리셋 파일 목록 API - Phase 3 Day 7-3
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import * as fs from 'fs/promises';
import * as path from 'path';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const presetsPath = path.join(
      process.cwd(),
      'app/data/color-presets'
    );
    
    // 디렉토리 존재 확인
    try {
      await fs.access(presetsPath);
    } catch {
      // 디렉토리가 없으면 생성
      await fs.mkdir(presetsPath, { recursive: true });
      return json({ files: [], message: "디렉토리 생성됨" });
    }
    
    // 파일 목록 읽기
    const files = await fs.readdir(presetsPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    // 각 파일의 정보 읽기
    const fileInfos = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(presetsPath, file);
        const stats = await fs.stat(filePath);
        
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const preset = JSON.parse(content);
          
          return {
            filename: file,
            id: preset.id,
            name: preset.name,
            size: stats.size,
            modified: stats.mtime,
            isDefault: file.startsWith('modern-') || 
                      file.startsWith('warm-') || 
                      file.startsWith('forest-') || 
                      file.startsWith('minimal-')
          };
        } catch {
          return {
            filename: file,
            id: null,
            name: 'Invalid JSON',
            size: stats.size,
            modified: stats.mtime,
            isDefault: false
          };
        }
      })
    );
    
    return json({ 
      files: jsonFiles,
      fileInfos,
      totalSize: fileInfos.reduce((sum, f) => sum + f.size, 0),
      directory: presetsPath
    });
  } catch (error) {
    console.error('Error reading preset files:', error);
    return json({ 
      error: "Failed to read preset files", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}