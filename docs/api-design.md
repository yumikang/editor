# API 설계 문서

## 1. 디자인 관련 API

### 1.1 디자인 저장
- **엔드포인트**: `POST /api/design/save`
- **설명**: 편집된 디자인 데이터 저장
- **요청**:
  ```typescript
  {
    templateId: string;
    design: EditedDesign;
  }
  ```
- **응답**:
  ```typescript
  {
    success: boolean;
    savedAt: string;
    version: number;
  }
  ```

### 1.2 디자인 불러오기
- **엔드포인트**: `GET /api/design/load?templateId={id}`
- **설명**: 저장된 디자인 데이터 불러오기
- **응답**:
  ```typescript
  {
    success: boolean;
    design: EditedDesign | null;
    loadedAt: string;
  }
  ```

### 1.3 디자인 초기화
- **엔드포인트**: `POST /api/design/reset`
- **설명**: 디자인을 원본 상태로 초기화
- **요청**:
  ```typescript
  {
    templateId: string;
  }
  ```

### 1.4 디자인 히스토리
- **엔드포인트**: `GET /api/design/history?templateId={id}`
- **설명**: 디자인 변경 이력 조회
- **응답**:
  ```typescript
  {
    history: Array<{
      timestamp: string;
      version: number;
      changes: object;
    }>;
  }
  ```

## 2. 간격 시스템 API

### 2.1 간격 업데이트
- **엔드포인트**: `POST /api/spacing/update`
- **설명**: 간격 값 업데이트
- **요청**:
  ```typescript
  {
    templateId: string;
    selector: string;
    property: string; // margin-top, padding-left 등
    value: string;
  }
  ```

### 2.2 간격 프리셋 저장
- **엔드포인트**: `POST /api/spacing/preset/save`
- **설명**: 커스텀 간격 프리셋 저장
- **요청**:
  ```typescript
  {
    name: string;
    spacingSystem: Record<string, string>;
  }
  ```

## 3. 색상 프리셋 API

### 3.1 색상 프리셋 목록
- **엔드포인트**: `GET /api/color/presets`
- **설명**: 사용 가능한 색상 프리셋 목록 조회
- **응답**:
  ```typescript
  {
    presets: ColorPreset[];
    custom: ColorPreset[];
  }
  ```

### 3.2 색상 프리셋 저장
- **엔드포인트**: `POST /api/color/preset/save`
- **설명**: 커스텀 색상 프리셋 저장
- **요청**:
  ```typescript
  {
    name: string;
    colors: ColorInfo[];
    templateId?: string;
  }
  ```

### 3.3 색상 프리셋 적용
- **엔드포인트**: `POST /api/color/preset/apply`
- **설명**: 프리셋을 템플릿에 적용
- **요청**:
  ```typescript
  {
    templateId: string;
    presetId: string;
  }
  ```

## 4. 내보내기 API

### 4.1 HTML 내보내기
- **엔드포인트**: `POST /api/export/html`
- **설명**: 편집된 템플릿을 HTML로 내보내기
- **요청**:
  ```typescript
  {
    templateId: string;
    editedContent: EditedContent;
    editedDesign: EditedDesign;
    options: {
      minify: boolean;
      inlineStyles: boolean;
    };
  }
  ```

### 4.2 CSS 내보내기
- **엔드포인트**: `POST /api/export/css`
- **설명**: 커스텀 CSS 파일 생성
- **요청**:
  ```typescript
  {
    templateId: string;
    editedDesign: EditedDesign;
    format: 'css' | 'scss' | 'sass';
  }
  ```

### 4.3 프로젝트 내보내기
- **엔드포인트**: `POST /api/export/project`
- **설명**: 전체 프로젝트를 ZIP으로 내보내기
- **요청**:
  ```typescript
  {
    templateId: string;
    includeAssets: boolean;
    includeSourceFiles: boolean;
  }
  ```

### 4.4 배포 준비
- **엔드포인트**: `POST /api/export/deploy`
- **설명**: Vercel/Netlify 배포를 위한 빌드
- **요청**:
  ```typescript
  {
    templateId: string;
    platform: 'vercel' | 'netlify' | 'github-pages';
    config: object;
  }
  ```

## 5. 템플릿 분석 API (업데이트)

### 5.1 재분석 트리거
- **엔드포인트**: `POST /api/template/reanalyze`
- **설명**: 템플릿 재분석 실행
- **요청**:
  ```typescript
  {
    templateId: string;
    force: boolean;
  }
  ```

### 5.2 분석 상태 스트리밍
- **엔드포인트**: `GET /api/template/analysis-status?templateId={id}`
- **설명**: Server-Sent Events로 분석 진행상황 스트리밍
- **응답**: EventStream
  ```typescript
  data: {
    status: 'analyzing' | 'completed' | 'error';
    progress: number; // 0-100
    message: string;
  }
  ```

## 6. 미디어 관리 API

### 6.1 이미지 업로드
- **엔드포인트**: `POST /api/media/upload`
- **설명**: 이미지 파일 업로드
- **요청**: FormData with file
- **응답**:
  ```typescript
  {
    url: string;
    width: number;
    height: number;
    size: number;
  }
  ```

### 6.2 이미지 최적화
- **엔드포인트**: `POST /api/media/optimize`
- **설명**: 이미지 크기/품질 최적화
- **요청**:
  ```typescript
  {
    imageUrl: string;
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'jpg' | 'png';
    };
  }
  ```

## 7. 협업 기능 API (향후 확장)

### 7.1 프로젝트 공유
- **엔드포인트**: `POST /api/share/create`
- **설명**: 공유 링크 생성
- **요청**:
  ```typescript
  {
    templateId: string;
    permissions: 'view' | 'edit';
    expiresIn?: number; // hours
  }
  ```

### 7.2 실시간 동기화
- **엔드포인트**: `WS /api/realtime/{templateId}`
- **설명**: WebSocket을 통한 실시간 편집 동기화
- **메시지 타입**:
  ```typescript
  type RealtimeMessage = 
    | { type: 'cursor'; userId: string; position: object }
    | { type: 'edit'; userId: string; changes: object }
    | { type: 'presence'; users: string[] };
  ```

## 8. 에러 응답 형식

모든 API는 다음 형식의 에러 응답을 반환:

```typescript
{
  success: false;
  error: {
    code: string;      // 에러 코드 (예: 'TEMPLATE_NOT_FOUND')
    message: string;   // 사용자 친화적 메시지
    details?: any;     // 디버깅용 추가 정보
  };
}
```

## 9. 인증 및 권한

### 헤더
```
Authorization: Bearer {token}
X-Template-ID: {templateId}
```

### 권한 레벨
- `read`: 템플릿 읽기
- `write`: 템플릿 편집
- `admin`: 템플릿 삭제/공유 관리

## 10. Rate Limiting

- 일반 API: 100 requests/minute
- 내보내기 API: 10 requests/minute
- 업로드 API: 20 requests/minute
- WebSocket: 1000 messages/minute

## 11. 캐싱 전략

### 캐시 헤더
```
Cache-Control: public, max-age=3600  // 정적 리소스
Cache-Control: no-cache              // 동적 데이터
ETag: {hash}                         // 조건부 요청
```

### 캐시 무효화
- 디자인 저장 시 관련 캐시 무효화
- 템플릿 재분석 시 전체 캐시 삭제