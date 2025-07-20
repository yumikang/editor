# CodeB WebCraft Studio - 전체 프로젝트 문서

## 프로젝트 개요

CodeB WebCraft Studio는 AI 기반 통합 웹사이트 에디터로, 템플릿 자동 감지, 버전 관리, 디자인 토큰 기반 색상 시스템, 브라우저 기반 이미지 처리 등의 기능을 제공합니다.

## 개발 타임라인

### 2024년 7월 17일 - 프로젝트 시작
- Phase 1: 기본 에디터 (텍스트 편집, 실시간 프리뷰) ✅
- Phase 2: 버전 관리 시스템 ✅

### 2024년 7월 18일
- Phase 2.5: 색상 시스템 기초 ✅
- Phase 3: 디자인 토큰 기반 색상 시스템 시작

### 2024년 7월 19일 - 25일
- Phase 3: 완전한 색상 시스템 구현 ✅
  - 3-패널 레이아웃
  - 드래그 앤 드롭 색상 매핑
  - 색상 이론 기반 팔레트 생성
  - 프리셋 시스템

### 2024년 7월 26일 이후
- Phase 4: 브라우저 기반 이미지 처리 시스템 ✅
  - Canvas API 활용
  - 드래그 크롭 기능
  - 라운딩 기능
  - 필터 및 변환 기능

### 계획 중 (18일 예정)
- Phase 5: 템플릿 스캔 시스템 📋
  - 홈페이지 개선 (3일)
  - 대시보드 구축 (5일)
  - 템플릿 선택 페이지 통합 (3일)
  - 분석 엔진 구현 (5일)
  - 통합 테스트 및 마무리 (2일)

---

## Phase 1: 기본 에디터 구현

### 주요 기능
- 텍스트 편집 기능
- 실시간 프리뷰
- 기본 파일 구조 설정

### 기술 스택
- Remix 프레임워크
- React 18
- TypeScript
- Tailwind CSS

---

## Phase 2: 버전 관리 시스템

### 폴더 구조
```
themes/{theme-name}/
├── original/      # 원본 템플릿 (불변)
├── working/       # 작업 중인 파일
└── versions/      # 버전 기록
    ├── version-history.json
    └── v1_2024-07-17_12-00-00/
```

### 핵심 컴포넌트

#### VersionManager 클래스
```typescript
class VersionManager {
  createVersion(name: string, description: string): Version
  listVersions(): Version[]
  restoreVersion(versionId: string): void
  deleteVersion(versionId: string): void
  compareVersions(versionId1: string, versionId2: string): Comparison
}
```

### API 엔드포인트
1. `POST /api/version/create` - 새 버전 생성
2. `GET /api/version/list` - 버전 목록 조회
3. `POST /api/version/restore` - 버전 복원
4. `DELETE /api/version/delete` - 버전 삭제
5. `GET /api/version/compare` - 버전 비교
6. `POST /api/version/reset` - 원본으로 리셋

### UI 컴포넌트
- VersionControl: 버전 관리 UI
  - 버전 목록 표시
  - 새 버전 생성 폼
  - 버전 복원/삭제 기능
  - 원본 리셋 기능

---

## Phase 2.5: 색상 시스템 기초

### 타입 정의
```typescript
interface ColorSystem {
  primary: string;
  secondary: string;
  accent: string;
  neutral: {
    50: string;
    100: string;
    // ... 900까지
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}
```

### ColorTokenManager
- 색상 토큰 CRUD 작업
- CSS 변수 생성
- 실시간 업데이트

---

## Phase 3: 디자인 토큰 기반 색상 시스템

### 3-패널 레이아웃
1. **ColorSystemPanel** - 색상 편집
   - 색상 피커
   - 프리셋 관리
   - 색상 이론 도구

2. **LivePreview** - 실시간 프리뷰
   - CSS 변수 주입
   - 즉각적인 변경 반영

3. **ComponentMappingPanel** - 컴포넌트 매핑
   - 드래그 앤 드롭 인터페이스
   - HTML 요소 자동 감지
   - 매핑 관리

### 색상 이론 기능
```typescript
class ColorTheory {
  generateComplementary(baseColor: string): string
  generateTriadic(baseColor: string): string[]
  generateAnalogous(baseColor: string): string[]
  generateMonochromatic(baseColor: string): string[]
}
```

### 프리셋 시스템
#### 기본 프리셋
1. **Modern Blue** - 전문적이고 신뢰감 있는 색상
2. **Warm Sunset** - 따뜻하고 친근한 색상
3. **Forest Green** - 자연스럽고 차분한 색상
4. **Minimal Gray** - 미니멀하고 세련된 색상

#### 프리셋 구조
```typescript
interface ColorPreset {
  id: string;
  name: string;
  description: string;
  colorSystem: ColorSystem;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 버전 관리 통합
- colorSystem과 componentMappings를 WorkingData에 추가
- 버전 생성 시 색상 정보 포함
- 버전 복원 시 색상 설정도 복원

---

## Phase 4: 브라우저 기반 이미지 처리

### 아키텍처 결정
- Sharp 대신 Canvas API 사용 (Vercel 호환성)
- 클라이언트 사이드 처리
- 서버 부하 감소

### BrowserImageProcessor 클래스
```typescript
class BrowserImageProcessor {
  async process(file: File, operations: ImageOperation[]): Promise<Blob>
  private applyResize(canvas: HTMLCanvasElement, options: ResizeOptions)
  private applyFilter(canvas: HTMLCanvasElement, filter: FilterType)
  private applyTransform(canvas: HTMLCanvasElement, transform: TransformOptions)
  private applyCrop(canvas: HTMLCanvasElement, crop: CropOptions)
  private applyRounding(canvas: HTMLCanvasElement, radius: number)
}
```

### 주요 컴포넌트

#### MediaUploadZone
- 드래그 앤 드롭 지원
- 파일 검증
- 업로드 진행률 표시

#### ImageEditor
- 필터 적용 (grayscale, sepia, blur 등)
- 변환 기능 (회전, 뒤집기)
- 크기 조정

#### ImageCropper (고급 기능)
- 드래그 가능한 크롭 영역
- 실시간 프리뷰
- 종횡비 유지 옵션

#### AdvancedImageEditor
- 4-탭 구조
  1. 크롭 & 라운딩
  2. 필터
  3. 변환
  4. 크기 조정
- Canvas 체인 시스템으로 순차 처리

### 이미지 처리 파이프라인
1. 파일 업로드 → 검증
2. Canvas에 로드
3. 작업 체인 생성
4. 순차적 처리 적용
5. 최종 결과 다운로드/저장

---

## Phase 5: 템플릿 스캔 시스템 (계획)

### 🎯 Phase 5-1: 홈페이지 개선 (3일)

#### Day 1: 기본 UI 구현
- 중앙 정렬 타이틀 "CodeB WebCraft Studio"
- Start 버튼 구현
- 버튼 클릭 시 옵션 표시 애니메이션
- 상태 관리 (showOptions, recentProjects)

#### Day 2: 최근 작업 데이터 연동
- localStorage에서 최근 작업 불러오기
- 시간순 정렬 (최신순)
- 최대 3개만 표시
- 데이터 구조:
```typescript
{
  recentProjects: [
    {
      templateId: "corporate-landing",
      templateName: "Corporate Landing",
      lastEdited: "2025-07-20T10:30:00Z",
      status: "editing" | "completed",
      thumbnail: "/thumbnails/corporate-landing.png"
    }
  ]
}
```

#### Day 3: 네비게이션 연결
- [템플릿 관리] → /dashboard
- [바로 편집하기] → /templates
- [Continue →] → /editor/{templateId}
- 페이드 인/아웃 전환 효과

### 🔍 Phase 5-2: 대시보드 구축 (5일)

#### Day 4-5: 폴더 스캔 기능
- templates/ 폴더 자동 읽기
- 하위 폴더 검증 및 index.html 확인
- 스캔 트리거: 수동([Scan Folder] 버튼) 및 자동(페이지 로드)
- 진행 표시 및 토스트 메시지
- scan-results.json에 결과 저장:
```typescript
{
  lastScan: "2025-07-20T10:30:00Z",
  templates: {
    "corporate-landing": {
      status: "ready",
      hasIndex: true,
      fileCount: 23,
      totalSize: "15.2MB"
    }
  }
}
```

#### Day 6: 템플릿 상태 표시
- ✅ ready: 녹색, [Edit →] 버튼 활성화
- 🔄 analyzing: 주황색, 진행률 표시
- ❌ error: 빨간색, [Retry] 버튼
- 🆕 new: 파란색, [Analyze] 버튼

#### Day 7-8: 대시보드 UI 완성
- TemplateList 컴포넌트 (상태별 렌더링)
- ScanButton 컴포넌트
- NavigationBar 컴포넌트

### 📝 Phase 5-3: 템플릿 선택 페이지 통합 (3일)

#### Day 9: 기존 페이지 수정
- 상단 네비게이션 추가
- 필터 기능 (분석 완료만 보기/전체 보기)
- 최근 프로젝트 섹션 추가

#### Day 10: 데이터 연동
- scan-results.json 읽기
- 분석 완료 템플릿만 활성화
- 미완료 템플릿은 흐리게 표시

#### Day 11: 양방향 네비게이션
- 페이지 간 상태 유지
- 스크롤 위치 저장
- 필터 상태 유지

### 🔧 Phase 5-4: 분석 엔진 구현 (5일)

#### Day 12-13: HTML 파싱 로직
1. 파일 구조 분석
   - 전체 파일 목록
   - 폴더 구조 매핑
   - 총 크기 계산

2. HTML 분석
   - DOM 파싱
   - 텍스트 요소 추출
   - 이미지 경로 수집
   - CSS 파일 연결 확인

3. 결과 생성
   - analysis-result.json 생성
   - 편집 가능 요소 목록화

#### Day 14: 오류 처리
- 오류 케이스별 대응
  - 파일 없음: "index.html not found"
  - 권한 오류: "Permission denied"
  - 파싱 실패: "Invalid HTML structure"
  - 타임아웃: "Analysis timeout"
- 부분 성공 시 가능한 데이터만 저장
- 사용자 친화적 메시지 표시

#### Day 15-16: 백그라운드 처리
- 분석 작업 큐 관리
- 진행률 실시간 업데이트
- 동시 분석 개수 제한 (최대 3개)
- 취소 기능

### 🎨 Phase 5-5: 통합 테스트 및 마무리 (2일)

#### Day 17: 전체 플로우 테스트
1. 신규 템플릿 추가 → 스캔 → 분석 → 편집
2. 오류 템플릿 → 재시도 → 성공 → 편집
3. 최근 작업 → Continue → 편집 재개
4. 페이지 간 네비게이션 검증

#### Day 18: 최적화 및 버그 수정
- 대용량 템플릿 처리
- 메모리 사용량 최적화
- 로딩 속도 개선
- 에러 핸들링 강화

---

## 🏠 업데이트된 홈페이지 디자인

### 홈페이지 UI 상태

#### 상태 1: 초기 화면
```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│        CodeB WebCraft Studio                │
│                                             │
│            [🚀 Start]                       │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

#### 상태 2: Start 클릭 후
```
┌─────────────────────────────────────────────┐
│                                             │
│        CodeB WebCraft Studio                │
│                                             │
│            [🚀 Start]                       │
│                                             │
│    [📊 템플릿 관리]  [📝 바로 편집하기]      │
│       (대시보드)        (템플릿 선택)         │
│                                             │
└─────────────────────────────────────────────┘
```

#### 상태 3: 최근 작업이 있을 때
```
┌─────────────────────────────────────────────┐
│        CodeB WebCraft Studio                │
│                                             │
│            [🚀 Start]                       │
│                                             │
│    [📊 템플릿 관리]  [📝 바로 편집하기]      │
│                                             │
│ 최근 작업:                                   │
│ • corporate-landing (10분 전) [Continue →]   │
└─────────────────────────────────────────────┘
```

### 타이틀 스타일링
```css
/* 심플 버전 */
.title {
  font-size: 32px;
  font-weight: bold;
  text-align: center;
}

/* 스타일리시 버전 */
.title {
  font-size: 36px;
  font-weight: 300;
  letter-spacing: 2px;
  text-align: center;
  
  /* CodeB 부분만 강조 */
  .brand {
    font-weight: 700;
    color: #2563eb; /* 파란색 */
  }
}
```

---

## 프로젝트 구조

```
editor-app-second/
├── app/
│   ├── components/
│   │   ├── color/          # 색상 시스템 컴포넌트
│   │   ├── editor/         # 에디터 탭
│   │   ├── media/          # 이미지 처리 컴포넌트
│   │   ├── preview/        # 프리뷰 컴포넌트
│   │   └── version/        # 버전 관리 컴포넌트
│   ├── routes/             # API 및 페이지 라우트
│   ├── types/              # TypeScript 타입 정의
│   └── utils/              # 유틸리티 함수
├── public/                 # 정적 파일
├── scripts/                # 초기화 및 마이그레이션 스크립트
└── build/                  # 빌드 출력
```

## API 엔드포인트 목록

### 색상 시스템
- `GET /api/color/presets` - 프리셋 목록
- `GET /api/style/tokens` - 색상 토큰 조회
- `POST /api/style/tokens` - 색상 토큰 저장
- `POST /api/style/component-mapping` - 컴포넌트 매핑 저장

### 미디어 처리
- `POST /api/media/save` - 이미지 저장
- `GET /api/media/serve/:id/:type/:fileName` - 이미지 제공

### 버전 관리
- `POST /api/version/create` - 버전 생성
- `GET /api/version/list` - 버전 목록
- `POST /api/version/restore` - 버전 복원
- `DELETE /api/version/delete` - 버전 삭제
- `GET /api/version/compare` - 버전 비교
- `POST /api/version/reset` - 원본 리셋

### 템플릿 관리
- `GET /api/template-preview/:id` - 템플릿 프리뷰
- `GET /api/template-status/:id` - 템플릿 상태
- `POST /api/editor/save` - 편집 내용 저장

---

## 향후 고려사항

### 성능 최적화
- 대용량 이미지 처리 시 Web Worker 활용
- 버전 관리 시 증분 저장
- 색상 변경 시 디바운싱 적용

### 확장성
- 플러그인 시스템 고려
- 다중 사용자 협업 기능
- 클라우드 저장소 연동

### 보안
- 파일 업로드 검증 강화
- XSS 방지 조치
- API 인증 시스템

---

## 개발 및 배포

### 개발 환경 설정
```bash
npm install
npm run dev
```

### 빌드 및 배포
```bash
npm run build
npm start
```

### 환경 요구사항
- Node.js >= 20.0.0
- npm 또는 yarn
- 모던 브라우저 (Canvas API 지원)

---

## 프로젝트 완성도

### 완료된 기능
- ✅ 기본 텍스트 편집 및 실시간 프리뷰
- ✅ 완전한 버전 관리 시스템
- ✅ 디자인 토큰 기반 색상 시스템
- ✅ 드래그 앤 드롭 색상 매핑
- ✅ 색상 프리셋 시스템
- ✅ 브라우저 기반 이미지 처리
- ✅ 드래그 크롭 및 라운딩 기능

### 계획 중인 기능
- 📋 템플릿 스캔 시스템 (Phase 5)
- ❌ AI 기반 자동 편집 제안
- ❌ 다중 사용자 협업
- ❌ 고급 CSS 편집기
- ❌ 컴포넌트 라이브러리

---

이 문서는 CodeB WebCraft Studio의 전체 개발 과정과 현재 상태를 종합적으로 정리한 것입니다. 각 Phase별 상세 구현 내용과 기술적 결정사항을 포함하고 있으며, 향후 개발 방향에 대한 가이드라인도 제시하고 있습니다.