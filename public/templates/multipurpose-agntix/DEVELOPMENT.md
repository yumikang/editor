# 코드비(CodeB) 웹사이트 개발 문서

## 프로젝트 개요
- **프로젝트명**: 코드비(CodeB) 웹사이트
- **기반 템플릿**: Agntix - Digital Agency & Creative Portfolio
- **주요 기능**: 다국어 지원, 실시간 텍스트 편집, 이미지 관리

## 주요 개발 내용

### 1. 웹사이트 한글화
- 전체 웹사이트를 한국어로 번역
- 회사명: Agntix → 코드비(CodeB)
- 슬로건: "혁신적인 디지털 솔루션을 제공합니다"

### 2. JSON 기반 텍스트 관리 시스템

#### 2.1 기본 구조
```json
{
  "meta": {
    "title": { "english": "...", "korean": "..." },
    "description": { "english": "...", "korean": "..." }
  },
  "navigation": { ... },
  "hero_section": { ... },
  "services_section": { ... },
  "footer_section": { ... }
}
```

#### 2.2 자동 업데이트 시스템
- **update-texts.js**: 웹페이지 텍스트 자동 업데이트 스크립트
- localStorage 기반 실시간 동기화
- BroadcastChannel을 통한 탭 간 통신

### 3. 텍스트 편집 도구

#### 3.1 JSON Editor v2 (json-editor-v2.html)
**주요 기능:**
- 영문/한글 동시 편집
- 버전 관리 시스템
- 토글 보호 기능 (개별 항목 잠금)
- 이미지 관리 탭
- 실시간 localStorage 동기화

**토글 보호 기능:**
- 개별 항목별 잠금/해제 스위치
- 전체 잠금/해제 버튼
- 시각적 표시 (노란 배경, 🔒 아이콘)

**이미지 관리:**
- 섹션별 이미지 업로드
- 드래그 앤 드롭 지원
- 자동 리사이징 (JPEG 85% 압축)
- 권장 크기:
  - Hero Section: 1920x1080
  - Services Section: 600x400
  - Projects Section: 800x600
  - About Section: 800x600
  - Testimonial Section: 100x100
  - Footer Section: 400x400

#### 3.2 Before/After Editor (text-editor-before-after.html)
**주요 기능:**
- 현재 텍스트 자동 스캔
- Before/After 형식으로 비교 편집
- 영문/한글 자유롭게 변환
- 실시간 미리보기
- 변경사항 추적 및 관리

#### 3.3 보조 도구
- **instant-update.html**: 원클릭 즉시 업데이트
- **auto-copy.html**: JSON 파일 드래그 앤 드롭 업데이트
- **test-connection.html**: 연동 상태 테스트 도구

### 4. 실시간 동기화 시스템

#### 4.1 작동 방식
1. 에디터에서 텍스트 수정
2. localStorage에 즉시 저장
3. BroadcastChannel로 알림 전송
4. 홈페이지에서 update-texts.js가 변경 감지
5. 새로고침 없이 실시간 반영

#### 4.2 데이터 흐름
```
JSON Editor → localStorage → BroadcastChannel → Homepage
     ↓                                              ↑
     └──────────── update-texts.js ─────────────────┘
```

### 5. 파일 구조
```
/웹3/agntix/
├── index.html                    # 메인 홈페이지
├── update-texts.js              # 자동 업데이트 스크립트
├── website-texts-updated.json   # 텍스트 데이터
├── json-editor-v2.html         # 메인 에디터
├── text-editor-before-after.html # Before/After 에디터
├── instant-update.html         # 즉시 업데이트 도구
├── auto-copy.html             # 파일 업데이트 도구
├── test-connection.html       # 연동 테스트 도구
└── assets/                    # 리소스 파일들
```

### 6. 사용 방법

#### 6.1 로컬 서버 실행
```bash
cd /Users/dongeuncheon/Downloads/blee_notion/코드비\ 웹/웹3/agntix
python3 -m http.server 8001
```

#### 6.2 페이지 접속
- 홈페이지: http://localhost:8001/
- JSON 에디터: http://localhost:8001/json-editor-v2.html
- Before/After 에디터: http://localhost:8001/text-editor-before-after.html

#### 6.3 텍스트 수정 워크플로우
1. JSON 에디터 또는 Before/After 에디터 열기
2. 원하는 텍스트 선택 및 수정
3. 변경사항이 홈페이지에 실시간 반영됨
4. "새 버전 저장"으로 백업 생성

### 7. 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Framework**: React 18 (CDN)
- **스타일링**: Custom CSS, Bootstrap 기반
- **데이터 저장**: localStorage, JSON
- **실시간 통신**: BroadcastChannel API
- **버전 관리**: Git

### 8. 향후 개선 사항
- [ ] 다국어 전환 버튼 추가
- [ ] 텍스트 변경 이력 추적
- [ ] 협업 기능 (여러 사용자 동시 편집)
- [ ] 클라우드 백업 기능
- [ ] SEO 최적화

### 9. 트러블슈팅

#### 9.1 localStorage 동기화 문제
- 문제: file:// 프로토콜에서는 localStorage 공유 안됨
- 해결: http://localhost 사용 필수

#### 9.2 BroadcastChannel 미지원 브라우저
- 문제: 일부 브라우저에서 미지원
- 해결: storage 이벤트로 폴백 처리

#### 9.3 CORS 문제
- 문제: 로컬 파일 접근 시 CORS 에러
- 해결: 로컬 서버 사용 (python http.server)

### 10. 개발자 정보
- 개발 도구: Claude Code
- 개발 기간: 2025년 7월
- 주요 기여: 텍스트 관리 시스템, 실시간 동기화, UI/UX 개선

---

## 빠른 시작 가이드

1. **서버 시작**
   ```bash
   python3 -m http.server 8001
   ```

2. **에디터 접속**
   - http://localhost:8001/json-editor-v2.html

3. **텍스트 수정**
   - 왼쪽 메뉴에서 항목 선택
   - 오른쪽 편집 영역에서 수정
   - 자동으로 홈페이지에 반영

4. **버전 저장**
   - "새 버전 저장" 클릭
   - JSON 파일 자동 다운로드

끝! 🎉