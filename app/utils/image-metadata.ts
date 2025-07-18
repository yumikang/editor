// Phase 4: 이미지 메타데이터 유틸리티
import type { ImageMetadata } from '~/types/media';
import { BrowserImageProcessor } from './browser-image-processor';

export class ImageMetadataExtractor {
  private processor: BrowserImageProcessor;

  constructor() {
    this.processor = new BrowserImageProcessor();
  }

  // 메타데이터 추출
  async extractMetadata(file: File): Promise<ImageMetadata> {
    const dimensions = await this.getImageDimensions(file);
    
    return {
      originalName: file.name,
      dimensions,
      fileSize: file.size,
      format: this.getFormatFromMimeType(file.type),
      quality: 100, // 원본 파일은 100%
      processedAt: new Date(),
    };
  }

  // 고유 ID 생성
  generateId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `img_${timestamp}_${random}`;
  }

  // 파일명 생성 (안전한 파일명)
  generateSafeFileName(originalName: string, id: string): string {
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

  // 썸네일 메타데이터 생성
  createThumbnailMetadata(
    originalMetadata: ImageMetadata,
    thumbnailSize: number
  ): Partial<ImageMetadata> {
    const aspectRatio = 
      originalMetadata.dimensions.width / originalMetadata.dimensions.height;
    
    let thumbnailWidth = thumbnailSize;
    let thumbnailHeight = thumbnailSize;

    if (aspectRatio > 1) {
      thumbnailHeight = Math.round(thumbnailSize / aspectRatio);
    } else {
      thumbnailWidth = Math.round(thumbnailSize * aspectRatio);
    }

    return {
      thumbnailDimensions: {
        width: thumbnailWidth,
        height: thumbnailHeight,
      },
    };
  }

  // 이미지 치수 가져오기
  private async getImageDimensions(
    file: File
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src); // 메모리 정리
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
        URL.revokeObjectURL(img.src);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // MIME 타입에서 포맷 추출
  private getFormatFromMimeType(mimeType: string): 'jpeg' | 'png' | 'webp' | 'gif' {
    const typeMap: Record<string, 'jpeg' | 'png' | 'webp' | 'gif'> = {
      'image/jpeg': 'jpeg',
      'image/jpg': 'jpeg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };

    return typeMap[mimeType] || 'jpeg';
  }

  // 파일 크기를 읽기 쉬운 형태로 변환
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 이미지 정보 요약 생성
  generateImageSummary(metadata: ImageMetadata): string {
    const { dimensions, fileSize, format } = metadata;
    const sizeStr = this.formatFileSize(fileSize);
    
    return `${dimensions.width}×${dimensions.height} • ${sizeStr} • ${format.toUpperCase()}`;
  }

  // EXIF 데이터 추출 (기본적인 정보만)
  async extractBasicExif(file: File): Promise<{
    orientation?: number;
    dateTime?: Date;
  }> {
    // 기본적인 EXIF 정보는 브라우저 API로는 제한적
    // 추후 필요시 exif-js 같은 라이브러리 사용 고려
    return {
      dateTime: new Date(file.lastModified),
    };
  }

  // 이미지 파일 정보 검증
  isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    return validTypes.includes(file.type);
  }

  // 메타데이터 병합
  mergeMetadata(
    original: ImageMetadata,
    updates: Partial<ImageMetadata>
  ): ImageMetadata {
    return {
      ...original,
      ...updates,
      processedAt: new Date(), // 항상 현재 시간으로 업데이트
    };
  }
}