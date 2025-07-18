// Phase 4: 이미지 검증 유틸리티
import type { ImageValidationOptions } from '~/types/media';

export class ImageValidator {
  private defaultOptions: ImageValidationOptions = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    maxWidth: 4096,
    maxHeight: 4096,
    minWidth: 10,
    minHeight: 10,
  };

  constructor(private options: ImageValidationOptions = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  // 파일 타입 검증
  validateFileType(file: File): { valid: boolean; error?: string } {
    const { allowedFormats } = this.options;
    
    if (!allowedFormats?.includes(file.type)) {
      return {
        valid: false,
        error: `지원하지 않는 파일 형식입니다. 지원 형식: ${allowedFormats?.join(', ')}`,
      };
    }

    return { valid: true };
  }

  // 파일 크기 검증
  validateFileSize(file: File): { valid: boolean; error?: string } {
    const { maxFileSize } = this.options;
    
    if (maxFileSize && file.size > maxFileSize) {
      const maxSizeMB = (maxFileSize / 1024 / 1024).toFixed(1);
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      return {
        valid: false,
        error: `파일 크기가 너무 큽니다. 최대 ${maxSizeMB}MB까지 가능합니다. (현재: ${fileSizeMB}MB)`,
      };
    }

    return { valid: true };
  }

  // 이미지 치수 검증
  async validateDimensions(file: File): Promise<{ valid: boolean; error?: string }> {
    const { maxWidth, maxHeight, minWidth, minHeight } = this.options;

    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        const { width, height } = img;

        if (maxWidth && width > maxWidth) {
          resolve({
            valid: false,
            error: `이미지 너비가 너무 큽니다. 최대 ${maxWidth}px까지 가능합니다. (현재: ${width}px)`,
          });
          return;
        }

        if (maxHeight && height > maxHeight) {
          resolve({
            valid: false,
            error: `이미지 높이가 너무 큽니다. 최대 ${maxHeight}px까지 가능합니다. (현재: ${height}px)`,
          });
          return;
        }

        if (minWidth && width < minWidth) {
          resolve({
            valid: false,
            error: `이미지 너비가 너무 작습니다. 최소 ${minWidth}px 이상이어야 합니다. (현재: ${width}px)`,
          });
          return;
        }

        if (minHeight && height < minHeight) {
          resolve({
            valid: false,
            error: `이미지 높이가 너무 작습니다. 최소 ${minHeight}px 이상이어야 합니다. (현재: ${height}px)`,
          });
          return;
        }

        resolve({ valid: true });
      };

      img.onerror = () => {
        resolve({
          valid: false,
          error: '이미지를 로드할 수 없습니다.',
        });
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // 전체 검증
  async validateImage(file: File): Promise<{
    valid: boolean;
    errors: string[];
    dimensions?: { width: number; height: number };
  }> {
    const errors: string[] = [];
    let dimensions: { width: number; height: number } | undefined;

    // 파일 타입 검증
    const typeValidation = this.validateFileType(file);
    if (!typeValidation.valid && typeValidation.error) {
      errors.push(typeValidation.error);
    }

    // 파일 크기 검증
    const sizeValidation = this.validateFileSize(file);
    if (!sizeValidation.valid && sizeValidation.error) {
      errors.push(sizeValidation.error);
    }

    // 치수 검증
    const dimensionValidation = await this.validateDimensions(file);
    if (!dimensionValidation.valid && dimensionValidation.error) {
      errors.push(dimensionValidation.error);
    } else {
      // 치수 정보 추출
      dimensions = await this.getImageDimensions(file);
    }

    return {
      valid: errors.length === 0,
      errors,
      dimensions,
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
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // 여러 파일 검증
  async validateMultipleImages(
    files: File[]
  ): Promise<Array<{
    file: File;
    valid: boolean;
    errors: string[];
    dimensions?: { width: number; height: number };
  }>> {
    const validations = await Promise.all(
      files.map(async (file) => {
        const result = await this.validateImage(file);
        return {
          file,
          ...result,
        };
      })
    );

    return validations;
  }

  // 옵션 업데이트
  updateOptions(options: Partial<ImageValidationOptions>): void {
    this.options = { ...this.options, ...options };
  }

  // 파일 확장자 검증
  validateFileExtension(fileName: string): boolean {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return allowedExtensions.includes(extension);
  }

  // 이미지 비율 검증
  validateAspectRatio(
    width: number,
    height: number,
    targetRatio: number,
    tolerance = 0.01
  ): boolean {
    const actualRatio = width / height;
    const difference = Math.abs(actualRatio - targetRatio);
    return difference <= tolerance;
  }
}