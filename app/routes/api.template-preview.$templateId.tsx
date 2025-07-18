// 템플릿 프리뷰 API - Phase 3
import { type LoaderFunctionArgs } from "@remix-run/node";
import { previewMessageHandler } from '~/components/preview/LivePreview';

export async function loader({ params }: LoaderFunctionArgs) {
  const { templateId } = params;
  
  // 테스트용 HTML 템플릿
  const testTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Template Preview - ${templateId}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: system-ui, -apple-system, sans-serif;
          line-height: 1.6;
          background-color: var(--color-neutral-background, #ffffff);
          color: var(--color-neutral-textPrimary, #111827);
        }
        
        .header {
          background-color: var(--color-brand-primary, #3B82F6);
          color: white;
          padding: 2rem;
          text-align: center;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          color: inherit;
        }
        
        h2 {
          font-size: 1.5rem;
          color: var(--color-brand-secondary, #8B5CF6);
          margin: 2rem 0 1rem;
        }
        
        p {
          color: var(--color-neutral-textSecondary, #6B7280);
          margin-bottom: 1rem;
        }
        
        a {
          color: var(--color-brand-primary, #3B82F6);
          text-decoration: none;
          transition: color 0.2s;
        }
        
        a:hover {
          color: var(--color-interaction-hover, #2563EB);
          text-decoration: underline;
        }
        
        .card {
          background-color: var(--color-neutral-surface, #F9FAFB);
          border: 1px solid var(--color-neutral-border, #E5E7EB);
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin: 1rem 0;
          transition: all 0.2s;
        }
        
        .card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .btn-primary {
          display: inline-block;
          background-color: var(--color-brand-primary, #3B82F6);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 500;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
          margin: 0.5rem;
        }
        
        .btn-primary:hover {
          background-color: var(--color-interaction-hover, #2563EB);
        }
        
        .btn-secondary {
          display: inline-block;
          background-color: var(--color-brand-secondary, #8B5CF6);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 500;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
          margin: 0.5rem;
        }
        
        .btn-secondary:hover {
          background-color: var(--color-interaction-hover, #7C3AED);
        }
        
        .btn-danger {
          display: inline-block;
          background-color: var(--color-semantic-error, #EF4444);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-weight: 500;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
          margin: 0.5rem;
        }
        
        .btn-danger:hover {
          background-color: #DC2626;
        }
        
        input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--color-neutral-border, #D1D5DB);
          border-radius: 0.375rem;
          font-size: 1rem;
          transition: all 0.2s;
        }
        
        input:focus {
          outline: none;
          border-color: var(--color-interaction-focus, #3B82F6);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .divider {
          height: 1px;
          background-color: var(--color-neutral-border, #E5E7EB);
          margin: 2rem 0;
        }
        
        /* 하이라이트 애니메이션 */
        @keyframes highlight-fade {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        .preview-highlight {
          position: relative;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>템플릿 프리뷰</h1>
      </div>
      
      <div class="container">
        <h2>색상 시스템 테스트</h2>
        <p>이 페이지는 드래그앤드롭으로 색상을 적용할 수 있는 템플릿입니다.</p>
        
        <div class="card">
          <h3>카드 컴포넌트</h3>
          <p>카드 내부의 텍스트입니다. 다양한 색상을 적용해보세요.</p>
          <a href="#">링크 텍스트</a>
        </div>
        
        <h2>버튼 컴포넌트</h2>
        <div>
          <button class="btn-primary">Primary 버튼</button>
          <button class="btn-secondary">Secondary 버튼</button>
          <button class="btn-danger">Danger 버튼</button>
        </div>
        
        <h2>폼 요소</h2>
        <div class="card">
          <input type="text" placeholder="텍스트 입력 필드" />
        </div>
        
        <div class="divider"></div>
        
        <p>
          더 많은 컴포넌트를 추가하려면 
          <a href="#">여기를 클릭</a>하세요.
        </p>
      </div>
      
      ${previewMessageHandler}
    </body>
    </html>
  `;
  
  return new Response(testTemplate, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}