// 컬러 시스템 테스트 페이지 - Phase 3 테스트
import { useState, useRef, useEffect } from 'react';
import { ColorSystemPanel } from '~/components/color/ColorSystemPanel';
import { LivePreview } from '~/components/preview/LivePreview';
import { ColorTokenManager } from '~/utils/color-token-manager';
import type { ColorSystem } from '~/types/color-system';

export default function TestColorSystem() {
  const [colorSystem, setColorSystem] = useState<ColorSystem>({
    brand: {
      primary: '#3B82F6',
      secondary: '#8B5CF6'
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6'
    },
    neutral: {
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      border: '#E5E7EB'
    },
    interaction: {
      hover: '#2563EB',
      active: '#1D4ED8',
      focus: '#3B82F6',
      disabled: '#9CA3AF'
    }
  });

  const [tokenManager] = useState(() => new ColorTokenManager(colorSystem));

  const handleColorSystemChange = (newColorSystem: ColorSystem) => {
    setColorSystem(newColorSystem);
    tokenManager.updateColorSystem(newColorSystem);
    
    // CSS 변수 테스트 출력
    console.log('Updated Color System:', newColorSystem);
    console.log('CSS Variables:', tokenManager.exportAsCSSVariables());
  };

  // 테스트용 HTML 콘텐츠
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: var(--color-neutral-background, white);
          color: var(--color-neutral-textPrimary, black);
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        h1 {
          color: var(--color-brand-primary, blue);
          margin-bottom: 20px;
        }
        h2 {
          color: var(--color-brand-secondary, purple);
          margin-top: 30px;
        }
        .text-secondary {
          color: var(--color-neutral-textSecondary, gray);
        }
        .card {
          background-color: var(--color-neutral-surface, #f5f5f5);
          border: 1px solid var(--color-neutral-border, #ddd);
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: var(--color-brand-primary, blue);
          color: white;
          text-decoration: none;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        .button:hover {
          background-color: var(--color-interaction-hover, darkblue);
        }
        .button:active {
          background-color: var(--color-interaction-active, navy);
        }
        .button:disabled {
          background-color: var(--color-interaction-disabled, gray);
          cursor: not-allowed;
        }
        .status {
          padding: 10px;
          margin: 10px 0;
          border-radius: 4px;
        }
        .status.success {
          background-color: var(--color-semantic-success, green);
          color: white;
        }
        .status.warning {
          background-color: var(--color-semantic-warning, orange);
          color: white;
        }
        .status.error {
          background-color: var(--color-semantic-error, red);
          color: white;
        }
        .status.info {
          background-color: var(--color-semantic-info, blue);
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>컬러 시스템 테스트 페이지</h1>
        <p class="text-secondary">이 페이지는 CSS 변수를 통한 컬러 시스템 적용을 테스트합니다.</p>
        
        <div class="card">
          <h2>카드 컴포넌트</h2>
          <p>이것은 surface 배경색과 border 색상을 사용하는 카드입니다.</p>
          <a href="#" class="button">Primary Button</a>
        </div>
        
        <h2>상태 메시지</h2>
        <div class="status success">Success: 작업이 성공적으로 완료되었습니다.</div>
        <div class="status warning">Warning: 주의가 필요한 항목이 있습니다.</div>
        <div class="status error">Error: 오류가 발생했습니다.</div>
        <div class="status info">Info: 추가 정보를 확인하세요.</div>
      </div>
      
      <script>
        // LivePreview 메시지 수신 및 처리
        window.addEventListener('message', function(event) {
          if (event.data.type === 'style-update' && event.data.cssVariables) {
            const root = document.documentElement;
            const vars = event.data.cssVariables.split('; ');
            vars.forEach(varDeclaration => {
              const [name, value] = varDeclaration.split(': ');
              if (name && value) {
                root.style.setProperty(name, value.trim());
              }
            });
            console.log('CSS Variables updated:', event.data.cssVariables);
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b px-4 py-3">
        <h1 className="text-xl font-semibold">컬러 시스템 테스트</h1>
      </div>
      
      <div className="flex-1 flex">
        {/* 좌측: 컬러 시스템 패널 */}
        <div className="w-[300px] border-r">
          <ColorSystemPanel
            templateId="test"
            colorSystem={colorSystem}
            onColorSystemChange={handleColorSystemChange}
          />
        </div>
        
        {/* 중앙: 테스트 프리뷰 */}
        <div className="flex-1 bg-gray-100 p-4">
          <TestPreview colorSystem={colorSystem} />
        </div>
        
        {/* 우측: CSS 변수 출력 */}
        <div className="w-[350px] border-l bg-white p-4">
          <h3 className="text-lg font-semibold mb-4">생성된 CSS 변수</h3>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-xs">
            {tokenManager.exportAsCSSVariables()}
          </pre>
        </div>
      </div>
    </div>
  );
}

// 테스트 프리뷰 컴포넌트
function TestPreview({ colorSystem }: { colorSystem: ColorSystem }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [tokenManager] = useState(() => new ColorTokenManager(colorSystem));

  useEffect(() => {
    tokenManager.updateColorSystem(colorSystem);
    
    if (iframeRef.current?.contentWindow) {
      // CSS 변수 생성
      const cssVars: string[] = [];
      const addVars = (obj: any, prefix: string = '') => {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            const varName = prefix ? `--color-${prefix}-${key}` : `--color-${key}`;
            cssVars.push(`${varName}: ${value}`);
          } else if (typeof value === 'object' && value !== null) {
            addVars(value, prefix ? `${prefix}-${key}` : key);
          }
        }
      };
      
      addVars(colorSystem);
      
      // iframe에 메시지 전송
      iframeRef.current.contentWindow.postMessage({
        type: 'style-update',
        cssVariables: cssVars.join('; ')
      }, '*');
    }
  }, [colorSystem, tokenManager]);

  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: var(--color-neutral-background, white);
          color: var(--color-neutral-textPrimary, black);
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        h1 {
          color: var(--color-brand-primary, blue);
          margin-bottom: 20px;
        }
        h2 {
          color: var(--color-brand-secondary, purple);
          margin-top: 30px;
        }
        .text-secondary {
          color: var(--color-neutral-textSecondary, gray);
        }
        .card {
          background-color: var(--color-neutral-surface, #f5f5f5);
          border: 1px solid var(--color-neutral-border, #ddd);
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: var(--color-brand-primary, blue);
          color: white;
          text-decoration: none;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        .button:hover {
          background-color: var(--color-interaction-hover, darkblue);
        }
        .button:active {
          background-color: var(--color-interaction-active, navy);
        }
        .button:disabled {
          background-color: var(--color-interaction-disabled, gray);
          cursor: not-allowed;
        }
        .status {
          padding: 10px;
          margin: 10px 0;
          border-radius: 4px;
        }
        .status.success {
          background-color: var(--color-semantic-success, green);
          color: white;
        }
        .status.warning {
          background-color: var(--color-semantic-warning, orange);
          color: white;
        }
        .status.error {
          background-color: var(--color-semantic-error, red);
          color: white;
        }
        .status.info {
          background-color: var(--color-semantic-info, blue);
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>컬러 시스템 테스트 페이지</h1>
        <p class="text-secondary">이 페이지는 CSS 변수를 통한 컬러 시스템 적용을 테스트합니다.</p>
        
        <div class="card">
          <h2>카드 컴포넌트</h2>
          <p>이것은 surface 배경색과 border 색상을 사용하는 카드입니다.</p>
          <a href="#" class="button">Primary Button</a>
        </div>
        
        <h2>상태 메시지</h2>
        <div class="status success">Success: 작업이 성공적으로 완료되었습니다.</div>
        <div class="status warning">Warning: 주의가 필요한 항목이 있습니다.</div>
        <div class="status error">Error: 오류가 발생했습니다.</div>
        <div class="status info">Info: 추가 정보를 확인하세요.</div>
      </div>
      
      <script>
        // LivePreview 메시지 수신 및 처리
        window.addEventListener('message', function(event) {
          if (event.data.type === 'style-update' && event.data.cssVariables) {
            const root = document.documentElement;
            const vars = event.data.cssVariables.split('; ');
            vars.forEach(varDeclaration => {
              const [name, value] = varDeclaration.split(': ');
              if (name && value) {
                root.style.setProperty(name, value.trim());
              }
            });
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <div className="bg-white rounded-lg shadow-sm h-full">
      <iframe
        ref={iframeRef}
        srcDoc={testHtml}
        className="w-full h-full rounded-lg"
        title="Color System Test"
      />
    </div>
  );
}