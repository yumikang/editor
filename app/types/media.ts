// Phase 4: 미디어 처리 타입 정의
export interface ProcessedImage {
  id: string;
  originalFile: File;
  processedBlob: Blob;
  thumbnail: Blob;
  metadata: ImageMetadata;
}

export interface ImageMetadata {
  originalName: string;
  dimensions: {
    width: number;
    height: number;
  };
  fileSize: number;
  format: 'jpeg' | 'png' | 'webp' | 'gif';
  quality: number;
  altText?: string;
  caption?: string;
  processedAt: Date;
  thumbnailDimensions?: {
    width: number;
    height: number;
  };
}

export interface MediaRegistry {
  templateId: string;
  images: Record<string, ImageAsset>;
  totalSize: number;
  lastUpdated: Date;
}

export interface ImageAsset {
  id: string;
  fileName: string;
  originalName: string;
  path: string;
  thumbnailPath?: string;
  metadata: ImageMetadata;
  uploadedAt: Date;
  usageCount: number;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface ImageValidationOptions {
  maxFileSize?: number; // in bytes
  allowedFormats?: string[];
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

export interface ImageCropData {
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio?: number;
}

export interface ImageFilterOptions {
  brightness?: number;    // -100 to 100
  contrast?: number;      // -100 to 100
  saturate?: number;      // 0 to 200
  blur?: number;          // 0 to 10
  grayscale?: boolean;
  sepia?: boolean;
}