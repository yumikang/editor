export interface AnalysisError {
  code: string;
  message: string;
  category: 'file_system' | 'html_parsing' | 'asset_validation' | 'permission' | 'encoding' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  suggestions: string[];
  technicalDetails?: string;
}

export class TemplateAnalysisError extends Error {
  public readonly analysisError: AnalysisError;
  
  constructor(analysisError: AnalysisError) {
    super(analysisError.message);
    this.name = 'TemplateAnalysisError';
    this.analysisError = analysisError;
  }
}

export class ErrorHandler {
  static createError(error: any, context?: string): AnalysisError {
    // Node.js 파일 시스템 오류
    if (error.code) {
      switch (error.code) {
        case 'ENOENT':
          return this.handleFileNotFound(error, context);
        case 'EACCES':
        case 'EPERM':
          return this.handlePermissionError(error, context);
        case 'EMFILE':
        case 'ENFILE':
          return this.handleTooManyFiles(error, context);
        case 'ENOTDIR':
          return this.handleNotDirectory(error, context);
        default:
          return this.handleGenericFileSystemError(error, context);
      }
    }

    // HTML 파싱 오류
    if (error.message?.includes('parse') || error.message?.includes('DOM')) {
      return this.handleHtmlParsingError(error, context);
    }

    // 인코딩 오류
    if (error.message?.includes('encoding') || error.message?.includes('charset')) {
      return this.handleEncodingError(error, context);
    }

    // 일반 오류
    return this.handleUnknownError(error, context);
  }

  private static handleFileNotFound(error: any, context?: string): AnalysisError {
    const isIndexHtml = error.path?.endsWith('index.html');
    const isThemeJson = error.path?.endsWith('theme.json');
    
    return {
      code: 'FILE_NOT_FOUND',
      message: isIndexHtml ? 
        'index.html 파일을 찾을 수 없습니다' : 
        isThemeJson ? 
        'theme.json 파일을 찾을 수 없습니다' :
        '필요한 파일을 찾을 수 없습니다',
      category: 'file_system',
      severity: isIndexHtml ? 'critical' : isThemeJson ? 'low' : 'medium',
      recoverable: true,
      suggestions: isIndexHtml ? [
        '템플릿 폴더에 index.html 파일이 있는지 확인하세요',
        'light/ 또는 dark/ 하위 폴더에 index.html이 있는지 확인하세요',
        '파일명의 대소문자가 정확한지 확인하세요'
      ] : isThemeJson ? [
        'theme.json 파일은 선택사항입니다',
        '템플릿 메타데이터를 추가하려면 theme.json을 생성하세요'
      ] : [
        '파일 경로를 확인하세요',
        '파일이 실제로 존재하는지 확인하세요'
      ],
      technicalDetails: `File path: ${error.path}`
    };
  }

  private static handlePermissionError(error: any, context?: string): AnalysisError {
    return {
      code: 'PERMISSION_DENIED',
      message: '파일에 대한 읽기 권한이 없습니다',
      category: 'permission',
      severity: 'high',
      recoverable: true,
      suggestions: [
        '파일/폴더의 읽기 권한을 확인하세요',
        'chmod 명령어로 권한을 수정할 수 있습니다',
        '관리자 권한으로 실행해보세요'
      ],
      technicalDetails: `Path: ${error.path}, Code: ${error.code}`
    };
  }

  private static handleTooManyFiles(error: any, context?: string): AnalysisError {
    return {
      code: 'TOO_MANY_FILES',
      message: '동시에 열 수 있는 파일 수를 초과했습니다',
      category: 'file_system',
      severity: 'medium',
      recoverable: true,
      suggestions: [
        '시스템의 파일 디스크립터 제한을 확인하세요',
        '템플릿을 개별적으로 분석해보세요',
        '서버를 재시작해보세요'
      ],
      technicalDetails: `Error code: ${error.code}`
    };
  }

  private static handleNotDirectory(error: any, context?: string): AnalysisError {
    return {
      code: 'NOT_DIRECTORY',
      message: '디렉토리가 아닌 파일을 디렉토리로 처리하려고 했습니다',
      category: 'file_system',
      severity: 'medium',
      recoverable: true,
      suggestions: [
        '템플릿 폴더 구조를 확인하세요',
        '템플릿 이름과 동일한 파일이 있는지 확인하세요'
      ],
      technicalDetails: `Path: ${error.path}`
    };
  }

  private static handleGenericFileSystemError(error: any, context?: string): AnalysisError {
    return {
      code: 'FILE_SYSTEM_ERROR',
      message: `파일 시스템 오류: ${error.message}`,
      category: 'file_system',
      severity: 'medium',
      recoverable: true,
      suggestions: [
        '파일 시스템 상태를 확인하세요',
        '디스크 공간이 충분한지 확인하세요',
        '파일이 다른 프로세스에서 사용 중인지 확인하세요'
      ],
      technicalDetails: `Code: ${error.code}, Message: ${error.message}`
    };
  }

  private static handleHtmlParsingError(error: any, context?: string): AnalysisError {
    return {
      code: 'HTML_PARSING_ERROR',
      message: 'HTML 파일의 구문이 올바르지 않습니다',
      category: 'html_parsing',
      severity: 'high',
      recoverable: false,
      suggestions: [
        'HTML 구문 오류를 수정하세요',
        'HTML 유효성 검사기를 사용해보세요',
        '닫히지 않은 태그가 있는지 확인하세요',
        '특수문자가 올바르게 인코딩되었는지 확인하세요'
      ],
      technicalDetails: error.message
    };
  }

  private static handleEncodingError(error: any, context?: string): AnalysisError {
    return {
      code: 'ENCODING_ERROR',
      message: '파일 인코딩을 처리할 수 없습니다',
      category: 'encoding',
      severity: 'medium',
      recoverable: true,
      suggestions: [
        '파일이 UTF-8로 인코딩되어 있는지 확인하세요',
        'BOM(Byte Order Mark)을 제거해보세요',
        '다른 인코딩으로 저장된 파일을 UTF-8로 변환하세요'
      ],
      technicalDetails: error.message
    };
  }

  private static handleUnknownError(error: any, context?: string): AnalysisError {
    return {
      code: 'UNKNOWN_ERROR',
      message: `알 수 없는 오류가 발생했습니다: ${error.message || error}`,
      category: 'unknown',
      severity: 'medium',
      recoverable: true,
      suggestions: [
        '템플릿 구조를 다시 확인하세요',
        '분석을 다시 시도해보세요',
        '개발자에게 문의하세요'
      ],
      technicalDetails: error.stack || error.toString()
    };
  }

  // 오류 복구 전략 제안
  static getRecoveryStrategy(analysisError: AnalysisError): {
    canRetry: boolean;
    retryDelay: number;
    maxRetries: number;
    partialRecovery: boolean;
  } {
    switch (analysisError.category) {
      case 'file_system':
        return {
          canRetry: true,
          retryDelay: 2000,
          maxRetries: 3,
          partialRecovery: analysisError.code !== 'FILE_NOT_FOUND'
        };
      case 'permission':
        return {
          canRetry: false,
          retryDelay: 0,
          maxRetries: 0,
          partialRecovery: false
        };
      case 'html_parsing':
        return {
          canRetry: false,
          retryDelay: 0,
          maxRetries: 0,
          partialRecovery: true
        };
      case 'encoding':
        return {
          canRetry: true,
          retryDelay: 1000,
          maxRetries: 2,
          partialRecovery: true
        };
      default:
        return {
          canRetry: true,
          retryDelay: 3000,
          maxRetries: 2,
          partialRecovery: true
        };
    }
  }

  // 사용자 친화적 메시지 생성
  static getUserFriendlyMessage(analysisError: AnalysisError): string {
    const baseMessage = analysisError.message;
    const suggestions = analysisError.suggestions.slice(0, 2); // 상위 2개 제안만
    
    return `${baseMessage}\n\n해결 방법:\n${suggestions.map(s => `• ${s}`).join('\n')}`;
  }

  // 개발자용 상세 정보
  static getDetailedError(analysisError: AnalysisError): string {
    return JSON.stringify({
      code: analysisError.code,
      category: analysisError.category,
      severity: analysisError.severity,
      recoverable: analysisError.recoverable,
      technicalDetails: analysisError.technicalDetails
    }, null, 2);
  }
}