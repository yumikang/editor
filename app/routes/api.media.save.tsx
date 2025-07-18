// Phase 4: 미디어 저장 API
import { json, type ActionFunctionArgs } from '@remix-run/node';
import { promises as fs } from 'fs';
import path from 'path';
import type { ImageAsset, ImageMetadata } from '~/types/media';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const templateId = formData.get('templateId') as string;
    const imageData = formData.get('imageData') as string;
    const thumbnailData = formData.get('thumbnailData') as string;
    const metadata = JSON.parse(formData.get('metadata') as string) as ImageMetadata;
    const imageId = formData.get('imageId') as string;

    if (!templateId || !imageData || !thumbnailData || !metadata || !imageId) {
      return json(
        { error: '필수 데이터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 템플릿별 이미지 디렉토리 경로
    const templateDir = path.join(
      process.cwd(),
      'app/data/themes',
      templateId
    );
    const imagesDir = path.join(templateDir, 'images');
    const thumbnailsDir = path.join(templateDir, 'thumbnails');

    // 디렉토리 생성 (없으면)
    await fs.mkdir(imagesDir, { recursive: true });
    await fs.mkdir(thumbnailsDir, { recursive: true });

    // 파일명 생성
    const safeFileName = generateSafeFileName(metadata.originalName, imageId);
    const imagePath = path.join(imagesDir, safeFileName);
    const thumbnailPath = path.join(thumbnailsDir, `thumb_${safeFileName}`);

    // Base64 데이터를 Buffer로 변환
    const imageBuffer = Buffer.from(imageData.split(',')[1], 'base64');
    const thumbnailBuffer = Buffer.from(thumbnailData.split(',')[1], 'base64');

    // 파일 저장
    await fs.writeFile(imagePath, imageBuffer);
    await fs.writeFile(thumbnailPath, thumbnailBuffer);

    // 이미지 자산 정보 생성
    const imageAsset: ImageAsset = {
      id: imageId,
      fileName: safeFileName,
      originalName: metadata.originalName,
      path: `/api/media/serve/${templateId}/images/${safeFileName}`,
      thumbnailPath: `/api/media/serve/${templateId}/thumbnails/thumb_${safeFileName}`,
      metadata,
      uploadedAt: new Date(),
      usageCount: 0,
    };

    // 미디어 레지스트리 업데이트
    await updateMediaRegistry(templateId, imageAsset);

    return json({
      success: true,
      asset: imageAsset,
    });
  } catch (error) {
    console.error('Error saving media:', error);
    return json(
      { error: '이미지 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 안전한 파일명 생성
function generateSafeFileName(originalName: string, id: string): string {
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
  
  // 특수문자 제거 및 공백을 하이픈으로 변경
  const safeName = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${id}-${safeName}${extension}`;
}

// 미디어 레지스트리 업데이트
async function updateMediaRegistry(templateId: string, asset: ImageAsset) {
  const registryPath = path.join(
    process.cwd(),
    'app/data/themes',
    templateId,
    'media-registry.json'
  );

  let registry: any = {
    templateId,
    images: {},
    totalSize: 0,
    lastUpdated: new Date(),
  };

  // 기존 레지스트리 로드
  try {
    const existingData = await fs.readFile(registryPath, 'utf-8');
    registry = JSON.parse(existingData);
  } catch (error) {
    // 파일이 없으면 새로 생성
  }

  // 이미지 추가
  registry.images[asset.id] = asset;
  registry.totalSize += asset.metadata.fileSize;
  registry.lastUpdated = new Date();

  // 레지스트리 저장
  await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));
}