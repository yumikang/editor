# 개발 로그 - Phase 8: 디자인 스캔 시스템 및 색상 팔레트 편집기

## 완료 일자: 2025-07-20

## 1. 디자인 스캔 시스템 구현

### 핵심 기능
- **CSS 분석 엔진**: HTML 및 CSS 파일 자동 파싱
- **색상 추출**: CSS 변수, 클래스, 인라인 스타일에서 색상 수집
- **타이포그래피 분석**: 폰트 패밀리, 크기, 굵기, 줄 높이 등 추출
- **간격 시스템**: margin, padding, gap 값 분석 및 정규화

### 추출 대상
```typescript
// 1️⃣ 색상 (Color)
├── CSS 변수 (:root, --primary-color)
├── 클래스 색상 (.text-red, background-color)
├── 인라인 스타일 (style="color: #FF0000")
├── 그라디언트 색상
└── 투명도 포함 색상 (rgba, hsla)

// 2️⃣ 타이포그래피 (Typography)
├── 폰트 패밀리 (font-family)
├── 폰트 크기 (font-size)
├── 폰트 굵기 (font-weight)
├── 줄 높이 (line-height)
├── 자간 (letter-spacing)
└── 텍스트 정렬 (text-align)

// 3️⃣ 간격 (Spacing)
├── 패딩 (padding)
├── 마진 (margin)
├── 갭 (gap)
└── 섹션 간격
```

### 분류 시스템
- **색상**: 사용 빈도순, 용도별(텍스트/배경/테두리), 명도별, 색상계열별
- **타이포그래피**: 제목용(h1~h6), 본문용(p, span), 특수용(button, label), 사이즈별
- **간격**: 컴포넌트 내부, 컴포넌트 간, 섹션 간, 반응형

## 2. 색상 팔레트 편집기

### UI 컴포넌트 구조
```typescript
ColorPalette.tsx
├── 검색 기능 (색상값, 선택자별)
├── 필터 탭 (전체/텍스트/배경/테두리/기타)
├── 색상계열별 그룹화 (빨강/노랑/초록/파랑/보라/무채색)
├── 색상 카드
│   ├── 색상 미리보기
│   ├── 사용 빈도 표시
│   ├── 용도별 라벨
│   ├── 명도/채도 정보
│   └── 사용 선택자 목록
└── 색상 선택기 (컬러피커 + HEX 입력)
```

### 주요 기능
1. **실시간 색상 편집**
   - 클릭으로 색상 선택기 표시
   - HEX 값 직접 입력 지원
   - 변경사항 즉시 미리보기 반영

2. **스마트 분류**
   - 용도별 자동 분류 (텍스트/배경/테두리)
   - 색상계열별 그룹화 (HSL 기반)
   - 사용 빈도별 정렬

3. **검색 및 필터링**
   - 색상값으로 검색 (#FF0000, rgb...)
   - CSS 선택자로 검색 (.button, #header...)
   - 용도별 필터링

## 3. 실시간 미리보기 연동

### PostMessage 통신 시스템
```javascript
// preview-injector.js
UPDATE_COLOR 메시지 처리:
├── 원본 색상 → 새 색상 매핑
├── DOM 요소별 색상 적용
│   ├── computed style 검사
│   ├── inline style 변경
│   └── CSS 규칙 동적 수정
├── 변경 애니메이션 효과
└── RGB ↔ HEX 색상 변환
```

### 색상 변경 알고리즘
1. **색상 매칭**: 원본 색상과 일치하는 모든 요소 탐색
2. **용도별 적용**: 텍스트/배경/테두리에 따른 속성 변경
3. **인라인 스타일**: style 속성의 색상값 직접 교체
4. **CSS 규칙**: 동적 스타일시트 수정
5. **시각적 피드백**: 변경된 요소에 펄스 애니메이션

## 4. 파일 구조 및 데이터 플로우

### 새로 추가된 파일
```
app/utils/design-scanner.server.ts     # 디자인 요소 분석 엔진
app/components/editor/ColorPalette.tsx # 색상 팔레트 UI
public/preview-injector.js             # 실시간 색상 변경 (업데이트)
```

### 데이터 플로우
```
1. 템플릿 분석 (대시보드)
   dashboard.tsx → design-scanner.server.ts
   ↓
   design-analysis.json 생성

2. 디자인 편집 (에디터)
   editor.$themeId.tsx → DesignTab.tsx → ColorPalette.tsx
   ↓
   실시간 색상 변경

3. 미리보기 반영
   ColorPalette → PostMessage → preview-injector.js
   ↓
   DOM 색상 업데이트
```

### 생성되는 데이터 파일
```
템플릿폴더/
├── original-content.json      # 텍스트 요소 분석
├── design-analysis.json       # 디자인 요소 분석 ✨ 새로 추가
├── preprocessing-info.json    # 전처리 정보
└── index.original.html        # 원본 백업
```

## 5. 사용자 경험 개선

### Before (기존)
- 미리 정의된 색상 시스템만 사용
- 수동 색상 입력 필요
- 템플릿별 색상 정보 없음

### After (개선)
- **자동 색상 추출**: 템플릿에서 실제 사용 중인 색상 자동 분석
- **시각적 편집**: 직관적인 색상 팔레트 UI
- **실시간 미리보기**: 색상 변경 즉시 반영
- **스마트 분류**: 용도별, 계열별 자동 그룹화
- **상세 정보**: 사용 빈도, 명도/채도, 적용 위치 표시

## 6. 기술적 구현

### 색상 분석 알고리즘
```typescript
// 색상 정규화 및 HSL 변환
normalizeColor() → hexToHsl() → 색상계열 분류

// CSS 파싱 엔진
CSS Variables → Property Extraction → Usage Classification

// 사용 빈도 계산
Selector Matching → Frequency Counting → Priority Weighting
```

### 성능 최적화
- **CSS 파싱**: 정규식 기반 효율적 파싱
- **색상 매칭**: Map 자료구조로 O(1) 접근
- **실시간 업데이트**: 디바운싱 및 선택적 DOM 업데이트
- **메모리 관리**: 불필요한 색상 객체 정리

## 7. 사용 시나리오

### 1단계: 템플릿 분석
```bash
대시보드 → 템플릿 선택 → "Analyze" 버튼 클릭
↓
디자인 요소 스캔 (색상 57개, 타이포그래피 23개, 간격 45개 추출)
```

### 2단계: 색상 편집
```bash
에디터 → 디자인 탭 → 색상 팔레트 탭
↓
색상 계열별 그룹화된 팔레트 확인
↓
원하는 색상 클릭 → 컬러피커 → 새 색상 선택
```

### 3단계: 실시간 확인
```bash
색상 변경 → PostMessage 전송 → iframe 업데이트
↓
변경된 요소들에 애니메이션 효과 표시
↓
전체 디자인 조화 확인
```

## 8. 향후 확장 계획

### 단기 과제
- [ ] 타이포그래피 편집 UI 구현
- [ ] 간격 시스템 편집 기능
- [ ] 색상 조합 추천 시스템

### 중기 과제
- [ ] AI 기반 색상 조화 분석
- [ ] 접근성 (WCAG) 검사 기능
- [ ] 브랜드 가이드라인 준수 검증

### 장기 과제
- [ ] 실시간 협업 편집
- [ ] 디자인 토큰 생성 및 내보내기
- [ ] 디자인 시스템 자동 생성

---

## 완료된 작업 요약
✅ 디자인 스캔 시스템으로 템플릿 색상 자동 추출  
✅ 직관적인 색상 팔레트 편집 UI 구현  
✅ 실시간 색상 변경 및 미리보기 연동  
✅ 용도별, 계열별 스마트 색상 분류  
✅ PostMessage 기반 안전한 iframe 통신  

**다음 단계**: 타이포그래피 및 간격 편집 시스템 구현