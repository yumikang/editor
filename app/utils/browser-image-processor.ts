// Phase 4: 브라우저 기반 이미지 처리 유틸리티
import type { 
  ImageProcessingOptions, 
  ProcessedImage, 
  ImageMetadata,
  ImageCropData,
  ImageFilterOptions 
} from '~/types/media';

export class BrowserImageProcessor {
  // 이미지 리사이징
  async resizeImage(
    file: File,
    options: ImageProcessingOptions = {}
  ): Promise<Blob> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.85,
      format = 'webp',
      maintainAspectRatio = true,
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        const { width, height } = this.calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight,
          maintainAspectRatio
        );

        canvas.width = width;
        canvas.height = height;

        // 고품질 이미지 스케일링 설정
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // WebP 변환
  async convertToWebP(file: File, quality = 0.85): Promise<Blob> {
    return this.resizeImage(file, {
      maxWidth: Infinity,
      maxHeight: Infinity,
      quality,
      format: 'webp',
    });
  }

  // 썸네일 생성
  async generateThumbnail(
    file: File,
    size = 200,
    quality = 0.8
  ): Promise<Blob> {
    return this.resizeImage(file, {
      maxWidth: size,
      maxHeight: size,
      quality,
      format: 'webp',
      maintainAspectRatio: true,
    });
  }

  // 이미지 크롭
  async cropImage(
    file: File,
    cropData: ImageCropData,
    format: 'jpeg' | 'png' | 'webp' = 'webp',
    quality = 0.85
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        canvas.width = cropData.width;
        canvas.height = cropData.height;

        ctx.drawImage(
          img,
          cropData.x,
          cropData.y,
          cropData.width,
          cropData.height,
          0,
          0,
          cropData.width,
          cropData.height
        );

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // 이미지 압축
  async compressImage(
    file: File,
    targetQuality = 0.7,
    format?: 'jpeg' | 'png' | 'webp'
  ): Promise<Blob> {
    const outputFormat = format || this.getFormatFromMimeType(file.type);
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          `image/${outputFormat}`,
          targetQuality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // 필터 적용
  async applyFilters(
    file: File,
    filters: ImageFilterOptions,
    format = 'webp',
    quality = 0.85
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // CSS 필터 문자열 생성
        const filterString = this.buildFilterString(filters);
        ctx.filter = filterString;
        
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // 이미지 회전
  async rotateImage(
    file: File,
    degrees: number,
    format = 'webp',
    quality = 0.85
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        const radians = (degrees * Math.PI) / 180;
        const sin = Math.abs(Math.sin(radians));
        const cos = Math.abs(Math.cos(radians));

        // 회전 후 캔버스 크기 계산
        canvas.width = img.width * cos + img.height * sin;
        canvas.height = img.width * sin + img.height * cos;

        // 중심점으로 이동 후 회전
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(radians);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // 메타데이터 추출
  async extractMetadata(file: File): Promise<Partial<ImageMetadata>> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          originalName: file.name,
          dimensions: {
            width: img.width,
            height: img.height,
          },
          fileSize: file.size,
          format: this.getFormatFromMimeType(file.type),
          processedAt: new Date(),
        });
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Helper: 치수 계산
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    maintainAspectRatio: boolean
  ): { width: number; height: number } {
    if (!maintainAspectRatio) {
      return {
        width: Math.min(originalWidth, maxWidth),
        height: Math.min(originalHeight, maxHeight),
      };
    }

    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }

    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  // Helper: MIME 타입에서 포맷 추출
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

  // Helper: 필터 문자열 생성
  private buildFilterString(filters: ImageFilterOptions): string {
    const filterParts: string[] = [];

    if (filters.brightness !== undefined) {
      filterParts.push(`brightness(${100 + filters.brightness}%)`);
    }
    if (filters.contrast !== undefined) {
      filterParts.push(`contrast(${100 + filters.contrast}%)`);
    }
    if (filters.saturate !== undefined) {
      filterParts.push(`saturate(${filters.saturate}%)`);
    }
    if (filters.blur !== undefined) {
      filterParts.push(`blur(${filters.blur}px)`);
    }
    if (filters.grayscale) {
      filterParts.push('grayscale(100%)');
    }
    if (filters.sepia) {
      filterParts.push('sepia(100%)');
    }

    return filterParts.join(' ');
  }

  // 이미지 파일을 Base64 URL로 변환
  async fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Blob을 File로 변환
  blobToFile(blob: Blob, fileName: string): File {
    return new File([blob], fileName, { type: blob.type });
  }
}