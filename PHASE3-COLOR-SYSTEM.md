# Phase 3: 디자인 토큰 기반 컬러 편집기 - 개발 계획서

## 📋 프로젝트 개요
**시작 예정**: 2024-07-18  
**예상 기간**: 1-2주  
**상태**: 📋 재설계 완료  
**기반 PRD**: 0718-prd.md (디자인 토큰 기반 템플릿 컬러 편집기)

## 🎯 핵심 목표 변경
**기존**: 일반적인 CSS 편집기 (색상, 폰트, 레이아웃)  
**변경**: 디자인 토큰 기반 컬러 시스템 전문 편집기

## 🏗️ 기존 Phase 2 기반 활용

### 활용 가능한 기능
1. **버전 관리 시스템** ✅
   - 컬러 프리셋도 버전 관리 가능
   - 변경사항 추적 및 복원

2. **에디터 탭 시스템** ✅
   - [📝 섹션] [🕒 버전] [🎨 컬러] 구조로 확장

3. **실시간 미리보기** ✅
   - 기존 iframe 시스템 활용
   - 모바일/데스크톱 프리뷰 재사용

4. **데이터 저장 구조** ✅
   - working/colors.json 추가
   - 프리셋은 app/data/color-presets/ 폴더에 저장

## 📐 3패널 레이아웃 설계

```
┌─────────────────────────────────────────────────────────────────┐
│ [📝 섹션 편집] [🕒 버전 관리] [🎨 컬러 시스템] ← 새 탭          │
├─────────────────────────────────────────────────────────────────┤
│ 좌측 패널 (300px)     │ 중앙 패널 (flex)   │ 우측 패널 (350px) │
├───────────────────────┼───────────────────┼───────────────────┤
│ 🎨 컬러 프리셋        │ 📱💻 미리보기      │ 🔗 컴포넌트 매핑   │
│ ┌───────────────────┐ │ ┌───────────────┐ │ ┌───────────────┐ │
│ │ + 새 프리셋 만들기 │ │ │               │ │ │ Header         │ │
│ │ ───────────────── │ │ │               │ │ │ ├─ Logo       │ │
│ │ ▼ 내 프리셋      │ │ │               │ │ │ └─ Nav        │ │
│ │   • 브랜드 A     │ │ │   실시간      │ │ │                │ │
│ │   • 여름 테마    │ │ │   템플릿      │ │ │ Button         │ │
│ │   • 미니멀       │ │ │   미리보기    │ │ │ ├─ Primary    │ │
│ └───────────────────┘ │ │               │ │ │ └─ Secondary  │ │
│                       │ │               │ │ │                │ │
│ 🎨 컬러 시스템        │ │               │ │ │ Content        │ │
│ ┌───────────────────┐ │ └───────────────┘ │ │ ├─ Heading    │ │
│ │ 브랜드 컬러       │ │                   │ │ └─ Body       │ │
│ │ Primary: [🟦]     │ │ ┌───────────────┐ │ └───────────────┘ │
│ │ Secondary: [자동] │ │ │ [Desktop/Mobile]│ │                   │
│ │                   │ │ │ [↗️ 새 창 보기] │ │ 📊 접근성 검사    │
│ │ 🎨 팔레트 제안    │ │ └───────────────┘ │ ┌───────────────┐ │
│ │ • 보색 조합      │ │                   │ │ WCAG AA: ✅    │ │
│ │ • 3색 조합       │ │                   │ │ 대비율: 4.5:1  │ │
│ │ • 유사색         │ │                   │ └───────────────┘ │
│ │ • 단색 조합      │ │                   │                   │
│ └───────────────────┘ │                   │                   │
└───────────────────────┴───────────────────┴───────────────────┘
```

## 🎨 컬러 토큰 시스템 설계

### 1. 토큰 구조
```typescript
interface ColorSystem {
  brand: {
    primary: string;      // 사용자 입력
    secondary: string;    // 자동 생성
  };
  
  semantic: {
    success: string;      // 자동 생성
    warning: string;      // 자동 생성
    error: string;        // 자동 생성
    info: string;         // 자동 생성
  };
  
  neutral: {
    textPrimary: string;
    textSecondary: string;
    background: string;
    surface: string;
    border: string;
  };
  
  interaction: {
    hover: string;        // primary -10% 명도
    active: string;       // primary -20% 명도
    focus: string;        // primary + 20% 투명도
    disabled: string;     // -50% 채도, +30% 명도
  };
}

interface ColorPreset {
  id: string;
  name: string;
  colors: ColorSystem;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. 컬러 이론 알고리즘
```typescript
// app/utils/color-theory.ts
export class ColorTheory {
  // HSL 기반 색상 조작
  static generateSecondary(primary: string): string;
  static generateComplementary(primary: string): string;
  static generateTriadic(primary: string): string[];
  static generateAnalogous(primary: string): string[];
  static generateMonochromatic(primary: string): string[];
  
  // 상호작용 상태 생성
  static generateHover(base: string): string;
  static generateActive(base: string): string;
  static generateFocus(base: string): string;
  static generateDisabled(base: string): string;
  
  // 시맨틱 컬러 생성
  static generateSemanticColors(primary: string): {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // 접근성 검증
  static checkContrast(fg: string, bg: string): {
    ratio: number;
    AA: boolean;
    AAA: boolean;
  };
}
```

## 🔧 구현 계획

### Phase 3-1: 컬러 시스템 코어 (3일)

#### Day 1: 컬러 이론 엔진
- [ ] ColorTheory 클래스 구현
- [ ] HSL/RGB 변환 유틸리티
- [ ] 컬러 팔레트 생성 알고리즘
- [ ] 접근성 검증 함수

#### Day 2: 데이터 구조 및 API
- [ ] ColorSystem 타입 정의
- [ ] ColorPreset 관리 시스템
- [ ] API 엔드포인트 구현
  - `/api/color/presets` - 프리셋 CRUD
  - `/api/color/generate` - 팔레트 생성
  - `/api/color/apply` - 템플릿 적용

#### Day 3: 기본 UI 구조
- [ ] 3패널 레이아웃 구현
- [ ] 컬러 피커 컴포넌트
- [ ] 프리셋 선택기
- [ ] 에디터 탭에 컬러 시스템 추가

### Phase 3-2: 시각적 편집기 (3일)

#### Day 4: 좌측 패널 - 컬러 시스템
- [ ] 브랜드 컬러 섹션
- [ ] 팔레트 제안 UI
- [ ] 중성/시맨틱 컬러 표시
- [ ] 실시간 컬러 업데이트

#### Day 5: 우측 패널 - 컴포넌트 매핑
- [ ] 템플릿 요소 자동 감지
- [ ] 드래그앤드롭 시스템
- [ ] 컴포넌트 트리 뷰
- [ ] 접근성 검사 표시

#### Day 6: 중앙 패널 - 통합
- [ ] 실시간 CSS 변수 주입
- [ ] 미리보기 새로고침
- [ ] 모바일/데스크톱 토글
- [ ] 전체화면 미리보기 연동

### Phase 3-3: 고급 기능 (2일)

#### Day 7: 프리셋 시스템
- [ ] 프리셋 저장/불러오기
- [ ] 프리셋 관리 UI
- [ ] 템플릿 독립적 적용
- [ ] 버전 관리 통합

#### Day 8: 최적화 및 완성
- [ ] 성능 최적화
- [ ] 오류 처리
- [ ] 사용자 가이드
- [ ] 전체 통합 테스트

## 🏗️ 컴포넌트 구조

```
app/components/color/
├── ColorEditor.tsx              // 메인 컬러 편집기
├── ColorSystemPanel/            // 좌측 패널
│   ├── PresetSelector.tsx       // 프리셋 관리
│   ├── BrandColors.tsx          // Primary/Secondary
│   ├── PaletteGenerator.tsx     // 팔레트 제안
│   └── NeutralColors.tsx        // 중성 컬러
├── ComponentMappingPanel/       // 우측 패널
│   ├── ComponentTree.tsx        // 요소 트리
│   ├── DragDropZone.tsx         // 드래그앤드롭
│   └── AccessibilityChecker.tsx // 접근성 검사
├── ColorPicker/                 // 컬러 피커
│   ├── ColorPicker.tsx          // 메인 피커
│   ├── ColorInput.tsx           // HEX/RGB/HSL 입력
│   └── ColorPreview.tsx         // 미리보기
└── utils/
    ├── color-theory.ts          // 컬러 이론
    ├── css-variables.ts         // CSS 변수 관리
    └── template-analyzer.ts     // 템플릿 분석
```

## 📊 CSS 변수 매핑 전략

```css
:root {
  /* 브랜드 컬러 */
  --color-primary: #3B82F6;
  --color-secondary: #auto-generated;
  
  /* 시맨틱 컬러 */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* 중성 컬러 */
  --color-text-primary: #111827;
  --color-text-secondary: #6B7280;
  --color-background: #FFFFFF;
  --color-surface: #F9FAFB;
  --color-border: #E5E7EB;
  
  /* 상호작용 상태 */
  --color-hover: #2563EB;
  --color-active: #1D4ED8;
  --color-focus: rgba(59, 130, 246, 0.2);
  --color-disabled: #9CA3AF;
}
```

## 🎯 성공 지표

### 기능적 목표
- [ ] Primary 색상 하나로 전체 컬러 시스템 생성
- [ ] 4가지 팔레트 제안 정확도 95% 이상
- [ ] 모든 템플릿에 프리셋 적용 가능
- [ ] WCAG AA 기준 자동 달성

### 성능 목표
- [ ] 컬러 변경 → 미리보기 반영: < 200ms
- [ ] 팔레트 생성 시간: < 100ms
- [ ] 템플릿 분석 시간: < 1초
- [ ] 프리셋 적용 시간: < 500ms

### 사용성 목표
- [ ] 5분 내 기본 사용법 습득
- [ ] 드래그앤드롭으로 직관적 매핑
- [ ] 컬러 이론 지식 없이도 전문적 결과

## 🔄 기존 시스템과의 통합

### 버전 관리 연동
```typescript
// 컬러 변경도 버전으로 저장
interface ColorVersion extends VersionMetadata {
  colorSystem: ColorSystem;
  presetId?: string;
}
```

### 데이터 저장 구조
```
app/data/themes/{theme-id}/
├── working/
│   ├── content.json    (기존)
│   └── colors.json     (신규)
└── versions/
    └── v0.0.3/
        ├── content.json
        └── colors.json

app/data/color-presets/
├── preset-001.json
├── preset-002.json
└── preset-003.json
```

## 🚀 예상 결과물

### 사용자 워크플로우
1. **템플릿 선택** → 자동으로 컬러 요소 분석
2. **프리셋 선택 or Primary 컬러 설정** → 전체 팔레트 자동 생성
3. **드래그앤드롭** → 필요시 컴포넌트별 컬러 재할당
4. **실시간 확인** → 모바일/데스크톱 미리보기
5. **프리셋 저장** → 다른 템플릿에도 재사용
6. **버전 저장** → 변경사항 히스토리 관리

### 기대 효과
- **일관성**: 체계적인 컬러 시스템으로 전문적 결과
- **효율성**: 수동 작업 대비 80% 시간 단축
- **재사용성**: 한 번 만든 프리셋을 모든 템플릿에 적용
- **접근성**: WCAG 기준 자동 준수로 웹 접근성 보장

---

**준비 완료**: 새로운 PRD를 기반으로 Phase 3이 재설계되었으며, 기존 Phase 1, 2의 인프라를 최대한 활용하는 구조로 계획되었습니다.