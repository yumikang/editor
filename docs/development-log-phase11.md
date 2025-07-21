# 개발 로그 - Phase 11: 웹폰트 관리 시스템 구현

## 완료 일자: 2025-01-21

## 1. 개요

눈누(Noonnu) 스타일의 웹폰트 관리 시스템을 구현하여 사용자가 커스텀 폰트를 추가하고 관리할 수 있는 기능을 개발했습니다. 이 시스템은 폰트 추가, 관리, 미리보기, 그리고 타이포그래피 편집기와의 통합을 포함합니다.

## 2. Phase 1: 기초 인프라 구축

### 2.1 폰트 데이터 구조 (`/app/data/global/custom-fonts.json`)
```json
{
  "fonts": [
    {
      "id": "font-1",
      "fontFamily": "Pretendard",
      "displayName": "프리텐다드",
      "cssUrl": "https://cdn.jsdelivr.net/...",
      "parsedData": {
        "fontFamily": "\"Pretendard Variable\", ...",
        "weights": ["100", "200", "300", ...],
        "styles": ["normal"],
        "primaryUrl": "https://...",
        "unicode": "U+AC00-D7A3",
        "display": "swap"
      },
      "metadata": {
        "source": "CDN",
        "license": "OFL",
        "description": "깔끔하고 현대적인 한글 폰트",
        "tags": ["sans-serif", "korean", "variable"],
        "popularity": 95
      },
      "loadStrategy": "immediate",
      "isActive": true,
      "usageCount": 0,
      "lastUsedAt": null,
      "createdAt": "2025-01-21T12:00:00Z"
    }
  ]
}
```

### 2.2 타입 정의 (`/app/types/font-types.ts`)
```typescript
export type FontLoadStrategy = 'immediate' | 'lazy' | 'inactive';

export interface CustomFont {
  id: string;
  fontFamily: string;
  displayName: string;
  cssUrl: string;
  parsedData: FontParsedData;
  metadata: FontMetadata;
  loadStrategy: FontLoadStrategy;
  isActive: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
}
```

### 2.3 폰트 CSS 파서 (`/app/utils/font-parser.ts`)
- `parseFontCSS()`: CSS 파일에서 @font-face 규칙 파싱
- `extractFontData()`: 파싱된 데이터에서 폰트 정보 추출
- `validateFontUrl()`: 폰트 URL 유효성 검사
- `generateFontFaceCSS()`: font-face CSS 생성

### 2.4 전역 스타일 주입기 (`/app/utils/font-injector.ts`)
- `injectFontStyle()`: document.head에 폰트 스타일 주입
- `injectFontToIframe()`: iframe에 폰트 주입
- `updateIframeFonts()`: postMessage로 iframe 폰트 업데이트
- `cleanupInactiveFonts()`: 비활성 폰트 정리

### 2.5 FontProvider Context (`/app/contexts/FontContext.tsx`)
```typescript
interface FontContextType {
  fonts: CustomFont[];
  activeFonts: CustomFont[];
  isLoading: boolean;
  error: string | null;
  
  addFont: (url: string) => Promise<void>;
  removeFont: (fontId: string) => Promise<void>;
  toggleFont: (fontId: string) => Promise<void>;
  updateLoadStrategy: (fontId: string, strategy: FontLoadStrategy) => Promise<void>;
  refreshFonts: () => Promise<void>;
  searchNoonnu: (query: string) => Promise<any[]>;
}
```

### 2.6 API 라우트
- `/api/fonts/load.ts` - 모든 폰트 로드
- `/api/fonts/add.ts` - 새 폰트 추가
- `/api/fonts/remove.ts` - 폰트 삭제
- `/api/fonts/update.ts` - 폰트 정보 업데이트

## 3. Phase 2: UI 컴포넌트 구현

### 3.1 FontManager 컴포넌트 (`/app/components/editor/FontManager.tsx`)
- **폰트 목록 표시**: 활성/비활성 상태, 로드 전략, 사용 횟수
- **폰트 토글**: on/off 스위치로 폰트 활성화
- **로드 전략 변경**: immediate, lazy, inactive 선택
- **폰트 삭제**: 확인 후 삭제

### 3.2 FontAddModal 컴포넌트 (`/app/components/editor/FontAddModal.tsx`)
- **URL 탭**: 직접 CSS URL 입력
- **눈누 검색 탭**: 폰트 검색 기능 (mock 구현)
- **예시 URL 제공**: Google Fonts, 눈누 예시
- **실시간 유효성 검사**: URL 형식 확인

### 3.3 FontPreviewModal 컴포넌트 (`/app/components/editor/FontPreviewModal.tsx`)
- **실시간 미리보기**: 다양한 크기와 굵기
- **프리셋 텍스트**: 한글, 영문, 숫자 등
- **커스텀 텍스트**: 사용자 입력 텍스트
- **폰트 정보 표시**: 라이선스, 태그, 설명

### 3.4 TypographyPalette 통합
- **FontContext 연동**: `useFont()` 훅 사용
- **커스텀 폰트 표시**: 드롭다운에 커스텀 폰트 추가
- **폰트 관리 버튼**: FontManager 모달 열기

## 4. 미리보기 통합

### 4.1 preview-injector.js 업데이트
```javascript
case 'UPDATE_FONTS':
  // 폰트 업데이트
  updateFonts(message.fonts);
  break;

function updateFonts(fonts) {
  // 기존 커스텀 폰트 스타일 제거
  document.querySelectorAll('style[data-custom-font]').forEach(el => el.remove());
  
  // 활성화된 폰트만 필터링
  const activeFonts = fonts.filter(font => font.loadStrategy !== 'inactive');
  
  // 각 폰트에 대해 스타일 추가
  activeFonts.forEach(font => {
    const style = document.createElement('style');
    style.setAttribute('data-custom-font', font.id);
    style.textContent = `@import url('${font.cssUrl}');`;
    document.head.appendChild(style);
  });
}
```

## 5. 주요 기능 특징

### 5.1 로드 전략
- **immediate**: 페이지 로드 시 즉시 로드
- **lazy**: 사용 시점에 로드
- **inactive**: 로드하지 않음 (보관용)

### 5.2 사용성 개선
- **드래그 없이 토글**: 간단한 on/off 스위치
- **실시간 미리보기**: 폰트 변경 즉시 반영
- **사용 통계**: 사용 횟수 및 마지막 사용 시간 추적

### 5.3 성능 최적화
- **선택적 로드**: 활성 폰트만 로드
- **캐싱**: 한 번 로드된 폰트는 브라우저 캐시 활용
- **디바운싱**: 빈번한 업데이트 방지

## 6. 기술적 구현 사항

### 6.1 Context API 활용
- 전역 폰트 상태 관리
- 컴포넌트 간 데이터 공유
- 실시간 업데이트 동기화

### 6.2 PostMessage 통신
- iframe과 메인 페이지 간 통신
- 폰트 업데이트 실시간 반영
- 보안을 위한 origin 체크 준비

### 6.3 파일 시스템 기반 저장
- JSON 파일로 폰트 데이터 저장
- 서버 재시작 시에도 데이터 유지
- 향후 DB 마이그레이션 용이

## 7. 향후 개선 사항

### 7.1 눈누 API 통합
- 실제 눈누 API 연동
- 폰트 카테고리별 검색
- 인기도 기반 정렬

### 7.2 폰트 최적화
- 서브셋 폰트 생성
- 가변 폰트 지원 강화
- 폰트 로딩 성능 개선

### 7.3 고급 기능
- 폰트 페어링 추천
- 프로젝트별 폰트 세트
- 폰트 사용 분석

## 8. 파일 구조

```
app/
├── components/
│   └── editor/
│       ├── FontManager.tsx
│       ├── FontAddModal.tsx
│       ├── FontPreviewModal.tsx
│       └── TypographyPalette.tsx (수정)
├── contexts/
│   └── FontContext.tsx
├── data/
│   └── global/
│       └── custom-fonts.json
├── routes/
│   ├── api/
│   │   └── fonts/
│   │       ├── load.ts
│   │       ├── add.ts
│   │       ├── remove.ts
│   │       └── update.ts
│   └── editor.$themeId.tsx (수정)
├── types/
│   └── font-types.ts
└── utils/
    ├── font-parser.ts
    └── font-injector.ts

public/
└── preview-injector.js (수정)
```

## 9. 테스트 시나리오

1. **폰트 추가**
   - URL로 Google Fonts 추가
   - 눈누 스타일 폰트 추가
   - 잘못된 URL 처리

2. **폰트 관리**
   - 폰트 활성/비활성 토글
   - 로드 전략 변경
   - 폰트 삭제

3. **타이포그래피 편집**
   - 커스텀 폰트 선택
   - 실시간 미리보기 확인
   - 폰트 굵기 변경

4. **미리보기 동기화**
   - iframe에 폰트 적용 확인
   - 폰트 변경 시 실시간 반영
   - 비활성 폰트 제거 확인

---

## 완료된 작업 요약
✅ 폰트 데이터 구조 및 타입 정의
✅ 폰트 파싱 및 주입 유틸리티
✅ FontProvider Context 구현
✅ 폰트 관리 UI 컴포넌트
✅ 타이포그래피 편집기 통합
✅ iframe 미리보기 동기화
✅ API 엔드포인트 구현

**다음 단계**: 눈누 API 실제 통합 또는 간격 시스템 편집 기능