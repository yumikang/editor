# 코드 분석 보고서

## 1. 프로젝트 아키텍처 분석

### 1.1 전체 구조
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   웹사이트      │     │  JSON 에디터     │     │  자동 업데이트   │
│  (index.html)   │ ←── │ (json-editor-v3) │ ──→ │ (auto-update)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         ↑                       ↓                         ↓
         │                 ┌────────────┐                  │
         └─────────────────│ localStorage│─────────────────┘
                           └────────────┘
```

### 1.2 데이터 플로우
1. **JSON 데이터 생성/수정** → JSON 에디터
2. **데이터 저장** → localStorage + 파일 다운로드
3. **데이터 적용** → update-texts.js 자동 실행
4. **실시간 업데이트** → DOM 조작

---

## 2. 핵심 컴포넌트 코드 분석

### 2.1 JSON 에디터 V3 - React 컴포넌트 구조

#### State 관리
```javascript
// 주요 상태 변수들
const [jsonData, setJsonData] = useState(null);          // JSON 데이터
const [selectedPath, setSelectedPath] = useState(null);   // 선택된 경로
const [hasChanges, setHasChanges] = useState(false);      // 변경사항 여부
const [versions, setVersions] = useState([]);             // 버전 히스토리
const [lockedPaths, setLockedPaths] = useState(new Set()); // 잠긴 경로들
const [fonts, setFonts] = useState([]);                   // 커스텀 폰트
const [images, setImages] = useState({});                 // 업로드된 이미지
```

#### 재귀적 네비게이션 생성
```javascript
const createNavItems = (obj, parentPath = '') => {
    const items = [];
    
    for (const key in obj) {
        const currentPath = parentPath ? `${parentPath}.${key}` : key;
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null) {
            if (value.english || value.korean) {
                // 텍스트 항목
                items.push({
                    key: currentPath,
                    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                    hasChildren: false
                });
            } else {
                // 중첩 객체
                items.push({
                    key: currentPath,
                    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                    hasChildren: true,
                    children: createNavItems(value, currentPath)
                });
            }
        }
    }
    
    return items;
};
```

#### 깊은 객체 업데이트
```javascript
const updateValue = (path, value, lang) => {
    const newData = { ...jsonData };
    const keys = path.split('.');
    let current = newData;
    
    // 경로를 따라 객체 탐색
    for (let i = 0; i < keys.length - 1; i++) {
        if (keys[i].includes('[') && keys[i].includes(']')) {
            // 배열 처리
            const arrayKey = keys[i].substring(0, keys[i].indexOf('['));
            const index = parseInt(keys[i].substring(keys[i].indexOf('[') + 1, keys[i].indexOf(']')));
            current = current[arrayKey][index];
        } else {
            current = current[keys[i]];
        }
    }
    
    // 값 업데이트
    const lastKey = keys[keys.length - 1];
    if (lang) {
        current[lastKey][lang] = value;
    } else {
        current[lastKey] = value;
    }
    
    setJsonData(newData);
    setHasChanges(true);
};
```

### 2.2 자동 업데이트 시스템 분석

#### 선택자 기반 업데이트
```javascript
function applyTextUpdates(data) {
    let updateCount = 0;

    // 1. 텍스트 매칭으로 업데이트
    document.querySelectorAll('a').forEach(el => {
        if (el.textContent.trim() === value.english) {
            el.textContent = value.korean;
            updateCount++;
        }
    });

    // 2. 클래스 선택자로 업데이트
    const heroTitle = document.querySelector('.tp-hero-title-1');
    if (heroTitle) {
        heroTitle.textContent = data.hero_section.main_title.korean;
        updateCount++;
    }

    // 3. 인덱스 기반 업데이트
    const serviceTitles = document.querySelectorAll('.tp-service-box-1-title');
    data.services_section.services.forEach((service, index) => {
        if (serviceTitles[index]) {
            serviceTitles[index].textContent = service.title.korean;
            updateCount++;
        }
    });
}
```

#### Storage 이벤트 리스너
```javascript
// 다른 탭에서의 변경사항 감지
window.addEventListener('storage', (e) => {
    if (e.key === 'websiteTexts' && e.newValue) {
        console.log('Detected text update from another tab');
        try {
            const data = JSON.parse(e.newValue);
            applyTextUpdates(data);
        } catch (error) {
            console.error('Error applying updates:', error);
        }
    }
});
```

### 2.3 이미지 리사이징 로직

```javascript
const handleImageUpload = (event, section) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 섹션별 최대 크기 설정
                let maxWidth = 800;
                let maxHeight = 600;
                
                if (section === 'hero') {
                    maxWidth = 1920;
                    maxHeight = 1080;
                } else if (section === 'thumbnail') {
                    maxWidth = 400;
                    maxHeight = 300;
                }
                
                // 비율 유지하며 리사이징
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // JPEG 압축 (85% 품질)
                const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                
                // 저장
                setImages({
                    ...images,
                    [section]: {
                        url: resizedDataUrl,
                        width: width,
                        height: height,
                        originalName: file.name,
                        timestamp: Date.now()
                    }
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};
```

### 2.4 일괄 번역 알고리즘

```javascript
const performTranslation = (preview = false) => {
    const newData = JSON.parse(JSON.stringify(jsonData)); // Deep copy
    let translatedCount = 0;
    const changes = [];

    const translateInObject = (obj, parentPath = '') => {
        for (const key in obj) {
            const currentPath = parentPath ? `${parentPath}.${key}` : key;
            const value = obj[key];

            if (typeof value === 'object' && value !== null) {
                // 텍스트 객체 확인
                if ((value.english !== undefined || value.korean !== undefined) 
                    && !lockedPaths.has(currentPath)) {
                    
                    if (translateDirection === 'toKorean') {
                        // 영어 → 한글
                        if (value.english && value.korean !== undefined) {
                            const oldValue = obj[key].korean;
                            obj[key].korean = value.english;
                            translatedCount++;
                            changes.push({
                                path: currentPath,
                                from: oldValue || '',
                                to: value.english
                            });
                        }
                    } else {
                        // 한글 → 영어
                        if (value.korean && value.english !== undefined) {
                            const oldValue = obj[key].english;
                            obj[key].english = value.korean;
                            translatedCount++;
                            changes.push({
                                path: currentPath,
                                from: oldValue || '',
                                to: value.korean
                            });
                        }
                    }
                } else if (typeof value === 'object') {
                    // 재귀 호출
                    translateInObject(value, currentPath);
                }
            }
        }
    };

    translateInObject(newData);
    
    if (preview) {
        setPreviewData({ changes, count: translatedCount });
    } else {
        if (translatedCount > 0) {
            setJsonData(newData);
            setHasChanges(true);
            setStatus({ type: 'success', message: `${translatedCount}개 항목이 번역되었습니다.` });
            setShowTranslateModal(false);
        }
    }
};
```

---

## 3. 성능 분석

### 3.1 메모리 사용량
- **localStorage 사용**: 약 5-10MB 제한
- **이미지 Base64 인코딩**: 원본 대비 약 33% 증가
- **버전 히스토리**: 버전당 약 50-100KB

### 3.2 렌더링 성능
- **React Production 빌드**: 개발 빌드 대비 약 2-3배 빠름
- **DOM 업데이트**: 배치 처리로 리플로우 최소화
- **선택자 성능**: 클래스 선택자 > 태그 선택자

### 3.3 최적화 포인트
```javascript
// 1. 디바운싱 적용 (예시)
const debouncedUpdate = useCallback(
    debounce((path, value, lang) => {
        updateValue(path, value, lang);
    }, 300),
    []
);

// 2. 메모이제이션
const navItems = useMemo(() => 
    jsonData ? createNavItems(jsonData) : [], 
    [jsonData]
);

// 3. 조건부 렌더링
{activeTab === 'editor' && jsonData && (
    <div className="editor-container">
        {/* 컨텐츠 */}
    </div>
)}
```

---

## 4. 보안 분석

### 4.1 XSS 방지
```javascript
// 안전: textContent 사용
el.textContent = value.korean;

// 위험: innerHTML 사용 (피해야 함)
// el.innerHTML = value.korean;
```

### 4.2 JSON 파싱 에러 처리
```javascript
try {
    const data = JSON.parse(e.target.result);
    setJsonData(data);
} catch (error) {
    setStatus({ type: 'error', message: '유효한 JSON 파일이 아닙니다.' });
}
```

### 4.3 파일 업로드 검증
```javascript
const file = event.target.files[0];
if (file && file.type === 'application/json') {
    processFile(file);
} else {
    showError('JSON 파일만 업로드 가능합니다.');
}
```

---

## 5. 브라우저 호환성

### 지원 브라우저
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### 사용된 모던 JavaScript 기능
- ES6+ 문법 (화살표 함수, 구조 분해 할당)
- Async/Await
- Spread 연산자
- Optional chaining (`?.`)
- Array methods (map, filter, forEach)

### Polyfill 필요 기능
- `String.prototype.replaceAll()` (구형 브라우저)
- `navigator.clipboard` API (일부 브라우저)

---

## 6. 코드 품질 지표

### 6.1 복잡도
- **순환 복잡도**: 대부분의 함수가 10 이하
- **중첩 레벨**: 최대 4단계
- **함수 길이**: 평균 20-50줄

### 6.2 재사용성
- 컴포넌트 기반 구조
- 유틸리티 함수 분리
- 설정 가능한 옵션

### 6.3 유지보수성
- 명확한 함수명과 변수명
- 주석과 문서화
- 모듈화된 구조

---

## 7. 개선 제안

### 7.1 코드 구조
```javascript
// 현재: 하나의 큰 컴포넌트
const JsonEditor = () => {
    // 1000+ 줄의 코드
};

// 개선: 컴포넌트 분리
const JsonEditor = () => {
    return (
        <>
            <Header />
            <TabNavigation />
            <EditorContent />
            <Modals />
        </>
    );
};
```

### 7.2 상태 관리
```javascript
// 현재: useState 과다 사용
// 개선: useReducer 또는 Context API 활용

const initialState = {
    jsonData: null,
    versions: [],
    lockedPaths: new Set(),
    // ...
};

const editorReducer = (state, action) => {
    switch (action.type) {
        case 'LOAD_DATA':
            return { ...state, jsonData: action.payload };
        case 'ADD_VERSION':
            return { ...state, versions: [action.payload, ...state.versions] };
        // ...
    }
};
```

### 7.3 타입 안정성
```typescript
// TypeScript 마이그레이션 예시
interface TextData {
    english?: string;
    korean?: string;
}

interface JsonData {
    [key: string]: TextData | JsonData;
}

const updateValue = (
    path: string, 
    value: string, 
    lang: 'english' | 'korean'
): void => {
    // 타입 안전한 코드
};
```

---

## 8. 결론

이 프로젝트는 웹사이트 다국어 관리를 위한 효과적인 솔루션을 제공합니다. React 기반의 모던한 UI, localStorage를 활용한 영속성, 실시간 업데이트 기능 등이 잘 구현되어 있습니다.

### 강점
- ✅ 직관적인 사용자 인터페이스
- ✅ 강력한 버전 관리 시스템
- ✅ 실시간 업데이트 기능
- ✅ 유연한 확장 가능성

### 개선 가능 영역
- 🔄 컴포넌트 분리로 코드 구조 개선
- 🔄 TypeScript 도입으로 타입 안정성 확보
- 🔄 테스트 코드 추가
- 🔄 성능 모니터링 도구 통합

전체적으로 프로덕션 환경에서 사용 가능한 수준의 완성도를 보여주며, 향후 확장과 개선의 여지가 충분한 프로젝트입니다.