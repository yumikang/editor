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
  
  // 초기 로드 시 부모에게 준비 완료 알림
  window.parent.postMessage({
    type: 'PREVIEW_READY'
  }, '*');
})();