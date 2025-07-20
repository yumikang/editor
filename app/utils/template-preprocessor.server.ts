import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ProcessedTemplate {
  html: string;
  elementsFound: number;
  processedAt: string;
}

export class TemplatePreprocessor {
  private $: cheerio.CheerioAPI;
  private elementCounter = 0;
  
  constructor(private html: string) {
    this.$ = cheerio.load(html);
  }
  
  process(originalContentData: any): ProcessedTemplate {
    // 각 분석된 요소에 대해 data 속성 추가
    if (originalContentData && originalContentData.elements) {
      originalContentData.elements.forEach((element: any) => {
        try {
          const $elements = this.$(element.selector);
          
          $elements.each((_, elem) => {
            const $elem = this.$(elem);
            
            if (element.type === 'text' || element.type === 'link' || element.type === 'button') {
              $elem.attr('data-editable-id', element.id);
              this.elementCounter++;
            } else if (element.type === 'image') {
              $elem.attr('data-image-id', element.id);
              this.elementCounter++;
            }
          });
        } catch (error) {
          console.error(`Error processing selector ${element.selector}:`, error);
        }
      });
    }
    
    // 미리보기 스크립트 주입
    this.injectPreviewScript();
    
    return {
      html: this.$.html(),
      elementsFound: this.elementCounter,
      processedAt: new Date().toISOString()
    };
  }
  
  private injectPreviewScript() {
    // head가 없으면 생성
    if (this.$('head').length === 0) {
      this.$('html').prepend('<head></head>');
    }
    
    // 미리보기 스크립트 추가
    this.$('head').append(`
      <script src="/preview-injector.js" defer></script>
    `);
    
    // body가 없으면 생성
    if (this.$('body').length === 0) {
      const bodyContent = this.$('html').html();
      this.$('html').html('<head></head><body>' + bodyContent + '</body>');
    }
  }
}

// 템플릿 전처리 함수
export async function preprocessTemplate(templatePath: string): Promise<void> {
  try {
    // index.html 읽기
    const indexPath = path.join(templatePath, 'index.html');
    const originalHtml = await fs.readFile(indexPath, 'utf-8');
    
    // original-content.json 읽기
    const contentPath = path.join(templatePath, 'original-content.json');
    let originalContent = null;
    
    try {
      const contentData = await fs.readFile(contentPath, 'utf-8');
      originalContent = JSON.parse(contentData);
    } catch {
      console.log('No original-content.json found, skipping preprocessing');
      return;
    }
    
    // 이미 처리된 파일인지 확인
    if (originalHtml.includes('data-editable-id') || originalHtml.includes('/preview-injector.js')) {
      console.log('Template already preprocessed, skipping');
      return;
    }
    
    // 템플릿 전처리
    const preprocessor = new TemplatePreprocessor(originalHtml);
    const result = preprocessor.process(originalContent);
    
    // 원본 백업
    const backupPath = path.join(templatePath, 'index.original.html');
    await fs.writeFile(backupPath, originalHtml);
    
    // 처리된 HTML 저장
    await fs.writeFile(indexPath, result.html);
    
    // 처리 정보 저장
    const infoPath = path.join(templatePath, 'preprocessing-info.json');
    await fs.writeFile(infoPath, JSON.stringify(result, null, 2));
    
    console.log(`Preprocessed template: ${templatePath}, elements: ${result.elementsFound}`);
  } catch (error) {
    console.error(`Error preprocessing template ${templatePath}:`, error);
  }
}

// 모든 템플릿 전처리
export async function preprocessAllTemplates(templatesDir: string): Promise<void> {
  const templates = await fs.readdir(templatesDir, { withFileTypes: true });
  
  for (const template of templates) {
    if (template.isDirectory()) {
      const templatePath = path.join(templatesDir, template.name);
      await preprocessTemplate(templatePath);
    }
  }
}