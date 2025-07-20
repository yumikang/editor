# 웹사이트 다국어 관리 시스템 개발 문서

## 프로젝트 개요

이 프로젝트는 Agntix 웹사이트 템플릿을 한국어로 현지화하고, JSON 기반의 다국어 텍스트 관리 시스템을 구축한 것입니다.

### 주요 기능
1. **웹사이트 템플릿 다운로드 및 한글화**
2. **JSON 기반 텍스트 관리 시스템**
3. **고급 JSON 에디터 (V3)**
4. **자동 텍스트 업데이트 시스템**

---

## 1. 프로젝트 구조

```
/Users/dongeuncheon/Downloads/blee_notion/
├── agntix_download/              # 메인 프로젝트 디렉토리
│   ├── index.html               # 메인 웹사이트 (한글화됨)
│   ├── assets/                  # 웹사이트 리소스
│   │   ├── css/                # 스타일시트
│   │   ├── js/                 # JavaScript 파일
│   │   ├── img/                # 이미지 파일
│   │   └── video/              # 비디오 파일
│   ├── website-texts.json      # 초기 텍스트 데이터
│   ├── website-texts-updated.json # 업데이트된 텍스트 데이터
│   ├── json-editor.html        # JSON 에디터 V1
│   ├── json-editor-v2.html     # JSON 에디터 V2 (버전 관리)
│   ├── json-editor-v3.html     # JSON 에디터 V3 (고급 기능)
│   ├── auto-update.html        # 자동 업데이트 관리 페이지
│   └── update-texts.js         # 자동 텍스트 업데이트 스크립트
└── 코드비 웹/웹3/agntix/        # Vercel 배포용 복사본

```

---

## 2. 기술 스택

### Frontend
- **HTML5**: 웹 페이지 구조
- **CSS3**: 스타일링 (Bootstrap 포함)
- **JavaScript (ES6+)**: 동적 기능
- **React 18**: JSON 에디터 UI (CDN 버전)
- **Babel**: JSX 변환 (브라우저에서)

### 저장소
- **LocalStorage**: 버전 히스토리, 설정, 이미지 저장
- **SessionStorage**: 임시 데이터
- **File API**: 파일 업로드/다운로드
- **Blob API**: 파일 생성

### 배포
- **Vercel**: 정적 웹사이트 호스팅
- **Python HTTP Server**: 로컬 개발 서버

---

## 3. 주요 컴포넌트 분석

### 3.1 웹사이트 (index.html)

**주요 섹션:**
- Header: 네비게이션 메뉴
- Hero Section: 메인 타이틀과 서브타이틀
- About Section: 회사 소개
- Services Section: 서비스 목록
- Projects Section: 프로젝트 갤러리
- Footer: 연락처 및 링크

**한글화 내용:**
```javascript
// 예시: 네비게이션 메뉴
"Demo" → "데모"
"Pages" → "페이지"
"Projects" → "프로젝트"
"Services" → "서비스"
```

### 3.2 JSON 에디터 V3 (json-editor-v3.html)

**핵심 기능:**

#### 1) 텍스트 편집
```javascript
const updateValue = (path, value, lang) => {
    const newData = { ...jsonData };
    // 중첩 객체 업데이트 로직
    setJsonData(newData);
    setHasChanges(true);
};
```

#### 2) 버전 관리
```javascript
const saveNewVersion = async () => {
    const timestamp = Date.now();
    const newVersion = {
        id: timestamp,
        date: timestamp,
        comment: versionComment || '변경사항 저장',
        data: jsonData
    };
    // localStorage에 저장
    localStorage.setItem('jsonEditorVersions', JSON.stringify(updatedVersions));
};
```

#### 3) 토글 잠금 시스템
```javascript
const toggleLock = (path, event) => {
    event.stopPropagation();
    const newLocks = new Set(lockedPaths);
    if (newLocks.has(path)) {
        newLocks.delete(path);
    } else {
        newLocks.add(path);
    }
    setLockedPaths(newLocks);
};
```

#### 4) 일괄 번역
```javascript
const performTranslation = (preview = false) => {
    const newData = JSON.parse(JSON.stringify(jsonData));
    let translatedCount = 0;
    
    // 재귀적으로 객체 순회하며 번역
    const translateInObject = (obj, parentPath = '') => {
        // 잠긴 항목은 건너뛰기
        if (!lockedPaths.has(currentPath)) {
            // 번역 로직
        }
    };
};
```

#### 5) 스타일 가이드
- 폰트 관리: 웹폰트 동적 로드
- @font-face 규칙 생성
- 실시간 폰트 적용

#### 6) 이미지 관리
```javascript
const handleImageUpload = (event, section) => {
    // Canvas API를 사용한 이미지 리사이징
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 섹션별 최대 크기 설정
    let maxWidth = 800;
    let maxHeight = 600;
    
    // 리사이징 후 Base64로 저장
    const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
};
```

### 3.3 자동 업데이트 시스템 (update-texts.js)

**작동 원리:**

1. **자동 감지**
```javascript
function checkForUpdates() {
    const savedTexts = localStorage.getItem('websiteTexts');
    if (savedTexts) {
        const data = JSON.parse(savedTexts);
        applyTextUpdates(data);
    }
}
```

2. **텍스트 업데이트**
```javascript
function applyTextUpdates(data) {
    // 선택자로 요소 찾기
    document.querySelectorAll('a').forEach(el => {
        if (el.textContent.trim() === value.english) {
            el.textContent = value.korean;
            updateCount++;
        }
    });
}
```

3. **실시간 동기화**
```javascript
window.addEventListener('storage', (e) => {
    if (e.key === 'websiteTexts' && e.newValue) {
        // 다른 탭에서의 변경사항 감지
        const data = JSON.parse(e.newValue);
        applyTextUpdates(data);
    }
});
```

---

## 4. JSON 데이터 구조

```json
{
  "meta": {
    "title": {
      "english": "Agntix - Digital Agency",
      "korean": "Blee - 디지털 에이전시"
    }
  },
  "navigation": {
    "main_menu": {
      "demo": {
        "english": "Demo",
        "korean": "데모"
      }
    }
  },
  "hero_section": {
    "main_title": {
      "english": "Digital Design Experience",
      "korean": "디지털 디자인 경험"
    }
  }
}
```

---

## 5. 워크플로우

### 5.1 초기 설정
1. 웹사이트 다운로드
2. 텍스트 추출 → JSON 파일 생성
3. JSON 에디터로 한글 번역
4. 웹사이트에 적용

### 5.2 텍스트 업데이트 프로세스
```
JSON 에디터에서 수정
    ↓
새 버전 저장 (자동 타임스탬프)
    ↓
JSON 파일 다운로드 + localStorage 저장
    ↓
auto-update.html 또는 update-texts.js로 적용
    ↓
웹사이트 실시간 업데이트
```

### 5.3 버전 관리
- 모든 변경사항은 타임스탬프와 함께 저장
- 이전 버전으로 롤백 가능
- 버전별 코멘트 지원

---

## 6. 주요 기능 상세

### 6.1 토글 잠금 기능
- **목적**: 일괄 수정 시 특정 텍스트 보호
- **구현**: Set 자료구조로 잠긴 경로 관리
- **UI**: 토글 스위치로 시각적 표시

### 6.2 일괄 번역
- **영어 → 한글**: 영어 텍스트를 한글 필드에 복사
- **한글 → 영어**: 한글 텍스트를 영어 필드에 복사
- **미리보기**: 적용 전 변경사항 확인

### 6.3 스타일 가이드
- **폰트 관리**: 커스텀 폰트 추가/삭제
- **실시간 적용**: 전체 사이트에 폰트 적용
- **폰트 미리보기**: 한글/영문 샘플 텍스트

### 6.4 이미지 관리
- **드래그 앤 드롭**: 직관적인 업로드
- **자동 리사이징**: 섹션별 최적 크기
- **Base64 인코딩**: localStorage 저장 가능

---

## 7. 성능 최적화

### 7.1 localStorage 관리
- 최대 용량 고려 (약 5-10MB)
- 이미지는 압축 후 저장
- 오래된 버전 자동 정리 (선택적)

### 7.2 React 최적화
- Production 빌드 사용
- 메모이제이션 활용
- 불필요한 리렌더링 방지

### 7.3 업데이트 최적화
- 변경된 요소만 선택적 업데이트
- 배치 업데이트로 리플로우 최소화
- 디바운싱/쓰로틀링 적용

---

## 8. 보안 고려사항

### 8.1 XSS 방지
- textContent 사용 (innerHTML 대신)
- 사용자 입력 검증
- JSON 파싱 에러 처리

### 8.2 데이터 무결성
- JSON 스키마 검증
- 버전 충돌 방지
- 백업 메커니즘

---

## 9. 확장 가능성

### 9.1 추가 가능한 기능
- 다국어 지원 확대 (일본어, 중국어 등)
- 번역 API 연동
- 실시간 협업 기능
- Git 연동
- A/B 테스팅

### 9.2 개선 사항
- TypeScript 마이그레이션
- 단위 테스트 추가
- CI/CD 파이프라인
- 성능 모니터링

---

## 10. 사용 가이드

### 10.1 로컬 개발 서버 실행
```bash
cd /Users/dongeuncheon/Downloads/blee_notion/agntix_download
python3 -m http.server 8000
```

### 10.2 JSON 에디터 사용
1. http://localhost:8000/json-editor-v3.html 접속
2. "샘플 데이터 불러오기" 클릭
3. 텍스트 수정
4. "새 버전 저장" 클릭

### 10.3 웹사이트 업데이트
1. http://localhost:8000/auto-update.html 접속
2. JSON 파일 업로드
3. "업데이트 적용" 클릭

---

## 11. 트러블슈팅

### 문제: 한글이 깨져서 표시됨
**해결**: 
- HTML 파일 인코딩을 UTF-8로 설정
- `<meta charset="UTF-8">` 확인

### 문제: localStorage 용량 초과
**해결**:
- 오래된 버전 삭제
- 이미지 압축률 높이기
- 외부 저장소 고려

### 문제: 업데이트가 적용되지 않음
**해결**:
- 브라우저 캐시 삭제 (Ctrl+Shift+R)
- 콘솔에서 에러 확인
- 선택자가 올바른지 확인

---

## 12. 결론

이 시스템은 웹사이트의 다국어 관리를 효율적으로 처리할 수 있는 완전한 솔루션입니다. JSON 기반의 구조화된 데이터 관리, 버전 컨트롤, 실시간 업데이트 등의 기능을 통해 웹사이트 현지화 작업을 크게 단순화했습니다.

### 주요 성과
- ✅ 수동 HTML 편집 불필요
- ✅ 버전 관리로 안전한 수정
- ✅ 실시간 미리보기
- ✅ 일괄 번역 기능
- ✅ 직관적인 UI/UX

### 향후 계획
- 🔄 더 많은 언어 지원
- 🔄 팀 협업 기능
- 🔄 자동 번역 API 연동
- 🔄 모바일 최적화

---

**작성일**: 2025년 1월 9일  
**작성자**: Claude Code Assistant  
**버전**: 1.0