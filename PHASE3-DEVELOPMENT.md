# Phase 3 개발 문서 - 디자인 토큰 기반 컬러 시스템

## 개요
Phase 3는 템플릿의 색상을 시각적으로 편집할 수 있는 디자인 토큰 시스템을 구현합니다.
Monaco Editor 대신 순수 비주얼 편집 방식을 채택하여 사용성을 극대화했습니다.

## 완료된 작업

### Day 1-2: 기반 시스템 구축
#### LivePreview 컴포넌트
- 실시간 CSS 변수 업데이트
- postMessage를 통한 iframe 통신
- 디바운싱으로 성능 최적화

#### 타입 시스템 확장
```typescript
// Phase 2.5 데이터 모델 확장
interface ColorSystem {
  brand: BrandColors;
  semantic?: SemanticColors;
  neutral?: NeutralColors;
  interaction?: InteractionColors;
}

interface ColorTokenReference {
  token: string;
  fallback: string;
}
```

### Day 3-4: 컬러 이론 및 프리셋
#### ColorTheory 클래스
- 보색(Complementary) 생성
- 유사색(Analogous) 생성
- 삼각색(Triadic) 생성
- 단색조(Monochromatic) 생성
- WCAG 접근성 검사

#### 프리셋 시스템
- 기본 프리셋 4종 제공
- 사용자 정의 프리셋 저장/로드
- JSON 내보내기/가져오기

### Day 5: 좌측 패널 - 컬러 시스템 관리
#### ColorSystemPanel 구현
- 실시간 HEX 색상 검증
- 드래그 가능한 컬러 토큰
- 프리셋 CRUD 작업
- 팔레트 제안 기능

#### 주요 기능
- 입력 검증 및 에러 피드백
- 200ms 디바운싱 저장
- 성공/에러 메시지 표시
- ColorTokenManager 통합

### Day 6: 우측 패널 - 드래그앤드롭 매핑
#### ComponentMappingPanel 구현
- 컴포넌트 그룹화 (텍스트/배경/버튼/테두리)
- 드래그앤드롭으로 토큰 적용
- 실시간 미리보기 하이라이트
- 매핑 관리 (추가/제거)

#### 시각적 피드백
- 드래그 오버: 파란색 테두리 + 스케일 효과
- 드롭 성공: 초록색 펄스 애니메이션
- 호버: 미리보기에 아웃라인 표시
- "여기에 놓기" 힌트 메시지

## 아키텍처

### 3-패널 레이아웃
```
┌─────────────┬──────────────────┬─────────────┐
│   좌측      │      중앙        │    우측     │
│ 컬러 시스템 │  실시간 미리보기  │ 컴포넌트   │
│   (300px)   │    (flex-1)      │   매핑      │
│             │                  │  (350px)    │
└─────────────┴──────────────────┴─────────────┘
```

### 데이터 흐름
1. **컬러 변경**: ColorSystemPanel → ColorTokenManager → LivePreview
2. **드래그앤드롭**: ColorSystemPanel → ComponentMappingPanel → LivePreview
3. **저장**: 디바운싱 → API → 파일 시스템

### 주요 컴포넌트

#### ColorSystemPanel
- 컬러 토큰 편집
- 프리셋 관리
- 드래그 시작점

#### ComponentMappingPanel  
- 드롭 대상 컴포넌트 목록
- 매핑 상태 관리
- 시각적 피드백

#### LivePreview
- iframe 기반 실시간 미리보기
- CSS 변수 주입
- postMessage 통신

## API 엔드포인트

### `/api/style/tokens`
- GET: 컬러 시스템 로드
- POST: 컬러 시스템 업데이트

### `/api/color/presets`
- GET: 프리셋 목록 조회
- POST: 프리셋 CRUD 작업

### `/api/style/component-mapping`
- POST: 컴포넌트-토큰 매핑 저장/제거

## 테스트 페이지

- `/test/color-system`: 컬러 시스템 단독 테스트
- `/test/drag-drop`: 전체 통합 테스트

## 성능 최적화

1. **디바운싱**: 200ms 지연으로 API 호출 최소화
2. **조건부 렌더링**: 불필요한 리렌더링 방지
3. **메모이제이션**: 복잡한 계산 결과 캐싱

## 보안 고려사항

1. **입력 검증**: HEX 색상 형식 검증
2. **XSS 방지**: postMessage origin 검증
3. **권한 체크**: 템플릿 소유권 확인

## 향후 계획 (Day 7)

### 3패널 통합 완성
- 전체 레이아웃 최적화
- 반응형 디자인 적용
- 성능 프로파일링

### 버전 관리 연동
- 컬러 변경 이력 추적
- 되돌리기/다시하기 기능
- 버전별 프리셋 저장

### 추가 토큰 시스템
- 간격(Spacing) 토큰
- 타이포그래피 토큰
- 그림자/효과 토큰

## 주요 성과

1. **사용성**: Monaco Editor 제거로 진입 장벽 낮춤
2. **시각성**: 드래그앤드롭으로 직관적 조작
3. **실시간성**: 모든 변경사항 즉시 반영
4. **안정성**: 입력 검증 및 에러 처리 강화

## 기술 스택

- **Frontend**: React, Remix, TypeScript
- **상태관리**: React Hooks, useFetcher
- **스타일링**: Tailwind CSS
- **통신**: postMessage API
- **최적화**: lodash debounce

## 참고사항

- componentId와 tokenKey는 명확히 구분하여 사용
- 시각적 피드백은 사용자 경험의 핵심
- 실시간 업데이트와 영구 저장은 분리 처리