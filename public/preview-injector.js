// 템플릿 미리보기 실시간 업데이트 스크립트
(function() {
  'use strict';
  
  // 편집된 데이터 저장소
  let editedData = {
    texts: {},
    images: {},
    colors: {}
  };
  
  // 선택된 요소 ID
  let selectedElementId = null;
  
  // 디바운싱 타이머
  let updateTimer = null;
  
  // 메시지 리스너
  window.addEventListener('message', function(event) {
    // 보안을 위해 origin 체크 (개발 환경에서는 생략)
    // if (event.origin !== 'http://localhost:5178') return;
    
    const message = event.data;
    
    switch (message.type) {
      case 'INIT_PREVIEW':
        // 초기 데이터 설정
        editedData = message.data || {};
        selectedElementId = message.selectedElementId;
        applyAllChanges();
        break;
        
      case 'UPDATE_CONTENT':
        // 컨텐츠 업데이트
        editedData = message.data || {};
        selectedElementId = message.selectedElementId;
        
        // 디바운싱 적용
        if (updateTimer) clearTimeout(updateTimer);
        updateTimer = setTimeout(() => {
          applyAllChanges();
        }, 100);
        break;
        
      case 'HIGHLIGHT_ELEMENT':
        // 특정 요소 하이라이트
        highlightElement(message.elementId);
        break;
        
      case 'UPDATE_COLOR':
        // 색상 변경
        updateColor(message.originalColor, message.newColor, message.usage);
        break;
        
      case 'UPDATE_TYPOGRAPHY':
        // 타이포그래피 변경
        updateTypography(message.original, message.updates);
        break;
    }
  });
  
  // 모든 변경사항 적용
  function applyAllChanges() {
    // 텍스트 변경사항 적용
    if (editedData.texts) {
      Object.entries(editedData.texts).forEach(([elementId, newText]) => {
        const elements = document.querySelectorAll(`[data-editable-id="${elementId}"]`);
        elements.forEach(element => {
          if (element.textContent !== newText) {
            element.textContent = newText;
            
            // 변경 애니메이션
            element.style.transition = 'background-color 0.3s ease';
            element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            setTimeout(() => {
              element.style.backgroundColor = '';
            }, 300);
          }
        });
      });
    }
    
    // 이미지 변경사항 적용
    if (editedData.images) {
      Object.entries(editedData.images).forEach(([elementId, newSrc]) => {
        const elements = document.querySelectorAll(`[data-image-id="${elementId}"]`);
        elements.forEach(element => {
          if (element.src !== newSrc) {
            element.src = newSrc;
          }
        });
      });
    }
    
    // 색상 변경사항 적용
    if (editedData.colors) {
      applyColorSystem(editedData.colors);
    }
    
    // 선택된 요소 하이라이트
    if (selectedElementId) {
      highlightElement(selectedElementId);
    }
  }
  
  // 요소 하이라이트
  function highlightElement(elementId) {
    // 이전 하이라이트 제거
    document.querySelectorAll('.preview-highlight').forEach(el => {
      el.classList.remove('preview-highlight');
    });
    
    if (!elementId) return;
    
    // 새 하이라이트 추가
    const elements = document.querySelectorAll(`[data-editable-id="${elementId}"]`);
    elements.forEach(element => {
      element.classList.add('preview-highlight');
      
      // 스크롤 인투 뷰
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    });
  }
  
  // 색상 시스템 적용
  function applyColorSystem(colorSystem) {
    // CSS 변수로 색상 적용
    const root = document.documentElement;
    
    if (colorSystem.primary) {
      Object.entries(colorSystem.primary).forEach(([shade, color]) => {
        root.style.setProperty(`--color-primary-${shade}`, color);
      });
    }
    
    if (colorSystem.secondary) {
      Object.entries(colorSystem.secondary).forEach(([shade, color]) => {
        root.style.setProperty(`--color-secondary-${shade}`, color);
      });
    }
    
    // 추가 색상들도 동일하게 적용
  }
  
  // 색상 변경 적용
  function updateColor(originalColor, newColor, usage) {
    // 색상을 사용하는 모든 요소 찾기
    const elements = document.querySelectorAll('*');
    
    elements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      
      // 사용 용도에 따라 색상 변경
      switch (usage) {
        case 'text':
          if (computedStyle.color === originalColor || 
              rgbToHex(computedStyle.color) === originalColor) {
            element.style.color = newColor;
            element.classList.add('color-changing');
            setTimeout(() => element.classList.remove('color-changing'), 1000);
          }
          break;
          
        case 'background':
          if (computedStyle.backgroundColor === originalColor ||
              rgbToHex(computedStyle.backgroundColor) === originalColor) {
            element.style.backgroundColor = newColor;
            element.classList.add('color-changing');
            setTimeout(() => element.classList.remove('color-changing'), 1000);
          }
          break;
          
        case 'border':
          if (computedStyle.borderColor === originalColor ||
              rgbToHex(computedStyle.borderColor) === originalColor) {
            element.style.borderColor = newColor;
            element.classList.add('color-changing');
            setTimeout(() => element.classList.remove('color-changing'), 1000);
          }
          break;
      }
      
      // 인라인 스타일에서도 변경
      const inlineStyle = element.getAttribute('style') || '';
      if (inlineStyle.includes(originalColor)) {
        const newStyle = inlineStyle.replace(new RegExp(originalColor, 'g'), newColor);
        element.setAttribute('style', newStyle);
        element.classList.add('color-changing');
        setTimeout(() => element.classList.remove('color-changing'), 1000);
      }
    });
    
    // CSS 스타일시트에서도 변경 (동적으로 CSS 룰 수정)
    updateCSSRules(originalColor, newColor);
  }
  
  // CSS 룰 동적 수정
  function updateCSSRules(originalColor, newColor) {
    try {
      for (let stylesheet of document.styleSheets) {
        try {
          for (let rule of stylesheet.cssRules || stylesheet.rules) {
            if (rule.style) {
              // 모든 CSS 속성 검사
              for (let prop in rule.style) {
                if (rule.style[prop] === originalColor) {
                  rule.style[prop] = newColor;
                }
              }
            }
          }
        } catch (e) {
          // Cross-origin 또는 기타 접근 제한
          console.log('Cannot access stylesheet:', e);
        }
      }
    } catch (e) {
      console.log('Error updating CSS rules:', e);
    }
  }
  
  // RGB 색상을 HEX로 변환
  function rgbToHex(rgb) {
    if (!rgb || !rgb.includes('rgb')) return rgb;
    
    const matches = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!matches) return rgb;
    
    const r = parseInt(matches[1]).toString(16).padStart(2, '0');
    const g = parseInt(matches[2]).toString(16).padStart(2, '0');
    const b = parseInt(matches[3]).toString(16).padStart(2, '0');
    
    return `#${r}${g}${b}`;
  }
  
  // 하이라이트 스타일 추가
  const style = document.createElement('style');
  style.textContent = `
    .preview-highlight {
      outline: 2px solid #3b82f6 !important;
      outline-offset: 2px !important;
      animation: highlight-pulse 2s ease-in-out infinite;
    }
    
    @keyframes highlight-pulse {
      0%, 100% {
        outline-color: #3b82f6;
      }
      50% {
        outline-color: #60a5fa;
      }
    }
    
    [data-editable-id], [data-image-id] {
      transition: all 0.3s ease;
    }
    
    /* 편집 가능한 요소에 호버 효과 */
    [data-editable-id]:hover {
      outline: 1px dashed #94a3b8;
      outline-offset: 2px;
      cursor: pointer;
    }
    
    /* 색상 변경 애니메이션 */
    .color-changing {
      transition: all 0.3s ease !important;
      animation: color-pulse 1s ease-in-out;
    }
    
    @keyframes color-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; transform: scale(1.02); }
    }
    
    /* 타이포그래피 변경 애니메이션 */
    .typography-changing {
      transition: all 0.5s ease !important;
      animation: typography-pulse 1s ease-in-out;
    }
    
    @keyframes typography-pulse {
      0%, 100% { 
        background-color: transparent;
      }
      50% { 
        background-color: rgba(59, 130, 246, 0.1);
        transform: translateX(2px);
      }
    }
  `;
  document.head.appendChild(style);
  
  // 클릭 이벤트로 부모에게 요소 선택 알림
  document.addEventListener('click', function(event) {
    const editableElement = event.target.closest('[data-editable-id]');
    if (editableElement) {
      const elementId = editableElement.getAttribute('data-editable-id');
      
      // 부모 창에 요소 선택 알림
      window.parent.postMessage({
        type: 'ELEMENT_SELECTED',
        elementId: elementId
      }, '*');
      
      event.preventDefault();
    }
  });
  
  // 타이포그래피 업데이트 함수
  function updateTypography(original, updates) {
    const elements = document.querySelectorAll('*');
    
    elements.forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      let shouldUpdate = false;
      
      // 폰트 패밀리 매칭
      if (original.fontFamily && computedStyle.fontFamily.includes(original.fontFamily.split(',')[0].trim().replace(/['"]/g, ''))) {
        // 폰트 크기 매칭
        if (computedStyle.fontSize === original.fontSize) {
          // 폰트 굵기 매칭
          const weight = computedStyle.fontWeight;
          if (weight === original.fontWeight || 
              (original.fontWeight === '400' && weight === 'normal') ||
              (original.fontWeight === '700' && weight === 'bold')) {
            shouldUpdate = true;
          }
        }
      }
      
      if (shouldUpdate) {
        // 타이포그래피 속성 업데이트
        if (updates.fontFamily) element.style.fontFamily = updates.fontFamily;
        if (updates.fontSize) element.style.fontSize = updates.fontSize;
        if (updates.fontWeight) element.style.fontWeight = updates.fontWeight;
        if (updates.lineHeight) element.style.lineHeight = updates.lineHeight;
        if (updates.letterSpacing) element.style.letterSpacing = updates.letterSpacing;
        
        // 변경 애니메이션
        element.classList.add('typography-changing');
        setTimeout(() => element.classList.remove('typography-changing'), 1000);
      }
    });
  }
  
  // 초기 로드 시 부모에게 준비 완료 알림
  window.parent.postMessage({
    type: 'PREVIEW_READY'
  }, '*');
})();