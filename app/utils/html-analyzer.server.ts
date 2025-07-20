import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface EditableElement {
  id: string;
  selector: string;
  type: 'text' | 'image' | 'link' | 'button';
  content: string;
  attributes?: Record<string, string>;
  section?: string;
}

export interface AnalysisResult {
  elements: EditableElement[];
  structure: {
    sections: string[];
    hasNavbar: boolean;
    hasFooter: boolean;
  };
}

export class HtmlAnalyzer {
  private $: cheerio.CheerioAPI;
  private elements: EditableElement[] = [];
  private sectionCounter = 0;

  constructor(private html: string) {
    this.$ = cheerio.load(html);
  }

  analyze(): AnalysisResult {
    this.findEditableElements();
    this.findSections();
    
    return {
      elements: this.elements,
      structure: {
        sections: this.getSectionNames(),
        hasNavbar: this.$('nav, header').length > 0,
        hasFooter: this.$('footer').length > 0,
      }
    };
  }

  private findEditableElements() {
    // 텍스트 요소 찾기
    const textSelectors = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'span:not(:empty)', 'li', 'td', 'th',
      '[data-editable="true"]'
    ];

    textSelectors.forEach(selector => {
      this.$(selector).each((index, elem) => {
        const $elem = this.$(elem);
        const text = $elem.text().trim();
        
        if (text && !this.hasChildElements($elem)) {
          this.elements.push({
            id: this.generateId('text', index),
            selector: this.getUniqueSelector(elem),
            type: 'text',
            content: text,
            section: this.findSection(elem)
          });
        }
      });
    });

    // 이미지 찾기 (img 태그)
    this.$('img').each((index, elem) => {
      const $elem = this.$(elem);
      this.elements.push({
        id: this.generateId('image', index),
        selector: this.getUniqueSelector(elem),
        type: 'image',
        content: $elem.attr('src') || '',
        attributes: {
          alt: $elem.attr('alt') || '',
          width: $elem.attr('width') || '',
          height: $elem.attr('height') || ''
        },
        section: this.findSection(elem)
      });
    });
    
    // background-image CSS 추출
    let bgImageIndex = 0;
    this.$('*').each((_, elem) => {
      const $elem = this.$(elem);
      const style = $elem.attr('style') || '';
      const bgImageMatch = style.match(/background-image:\s*url\(['"]?(.+?)['"]?\)/);
      
      if (bgImageMatch && bgImageMatch[1]) {
        this.elements.push({
          id: this.generateId('bg-image', bgImageIndex++),
          selector: this.getUniqueSelector(elem),
          type: 'image',
          content: bgImageMatch[1],
          attributes: {
            type: 'background-image',
            originalStyle: style
          },
          section: this.findSection(elem)
        });
      }
      
      // 인라인 style뿐만 아니라 클래스에서도 background-image 확인
      const classes = $elem.attr('class');
      if (classes) {
        // 실제 프로덕션에서는 CSS 파일을 파싱해야 하지만, 
        // 일반적인 패턴 감지 (예: bg-[url...])
        const tailwindBgMatch = classes.match(/bg-\[url\(['"]?(.+?)['"]?\)\]/);
        if (tailwindBgMatch && tailwindBgMatch[1]) {
          this.elements.push({
            id: this.generateId('bg-image', bgImageIndex++),
            selector: this.getUniqueSelector(elem),
            type: 'image',
            content: tailwindBgMatch[1],
            attributes: {
              type: 'background-image',
              fromClass: classes
            },
            section: this.findSection(elem)
          });
        }
      }
    });

    // 링크 찾기
    this.$('a').each((index, elem) => {
      const $elem = this.$(elem);
      const text = $elem.text().trim();
      
      if (text) {
        this.elements.push({
          id: this.generateId('link', index),
          selector: this.getUniqueSelector(elem),
          type: 'link',
          content: text,
          attributes: {
            href: $elem.attr('href') || ''
          },
          section: this.findSection(elem)
        });
      }
    });

    // 버튼 찾기
    this.$('button, input[type="button"], input[type="submit"], .btn, .button').each((index, elem) => {
      const $elem = this.$(elem);
      const text = $elem.text().trim() || $elem.val() as string || '';
      
      if (text) {
        this.elements.push({
          id: this.generateId('button', index),
          selector: this.getUniqueSelector(elem),
          type: 'button',
          content: text,
          section: this.findSection(elem)
        });
      }
    });
  }

  private findSections() {
    const sectionSelectors = ['section', '[class*="section"]', 'main', 'header', 'footer'];
    
    sectionSelectors.forEach(selector => {
      this.$(selector).each((index, elem) => {
        const $elem = this.$(elem);
        const id = $elem.attr('id');
        const className = $elem.attr('class');
        
        if (id || className) {
          this.sectionCounter++;
        }
      });
    });
  }

  private hasChildElements($elem: cheerio.Cheerio): boolean {
    const blockElements = ['div', 'section', 'article', 'header', 'footer', 'main'];
    return $elem.find(blockElements.join(',')).length > 0;
  }

  private getUniqueSelector(elem: cheerio.Element): string {
    const $elem = this.$(elem);
    
    // ID가 있으면 사용
    if ($elem.attr('id')) {
      return `#${$elem.attr('id')}`;
    }
    
    // 고유한 class 조합 찾기
    const classes = $elem.attr('class');
    if (classes) {
      const selector = `.${classes.split(' ').join('.')}`;
      if (this.$(selector).length === 1) {
        return selector;
      }
    }
    
    // 부모 요소와 인덱스 조합
    const parent = $elem.parent();
    const index = parent.children().index(elem);
    const parentSelector = parent.attr('id') ? `#${parent.attr('id')}` : parent.prop('tagName')?.toLowerCase();
    
    return `${parentSelector} > ${elem.tagName.toLowerCase()}:nth-child(${index + 1})`;
  }

  private findSection(elem: cheerio.Element): string {
    const $elem = this.$(elem);
    const $section = $elem.closest('section, [class*="section"], main, header, footer');
    
    if ($section.length) {
      return $section.attr('id') || $section.attr('class')?.split(' ')[0] || 'unknown';
    }
    
    return 'global';
  }

  private generateId(type: string, index: number): string {
    return `${type}_${Date.now()}_${index}`;
  }

  private getSectionNames(): string[] {
    const sections: string[] = [];
    
    this.$('section, [class*="section"], main').each((_, elem) => {
      const $elem = this.$(elem);
      const id = $elem.attr('id');
      const className = $elem.attr('class')?.split(' ')[0];
      
      if (id) sections.push(id);
      else if (className) sections.push(className);
    });
    
    return [...new Set(sections)];
  }
}

// HTML 파일 분석 유틸리티
export async function analyzeHtmlFile(filePath: string): Promise<AnalysisResult> {
  const html = await fs.readFile(filePath, 'utf-8');
  const analyzer = new HtmlAnalyzer(html);
  return analyzer.analyze();
}

// 여러 테마 분석
export async function analyzeThemes(themesDir: string): Promise<Record<string, AnalysisResult>> {
  const results: Record<string, AnalysisResult> = {};
  
  const themes = await fs.readdir(themesDir);
  
  for (const theme of themes) {
    const indexPath = path.join(themesDir, theme, 'index.html');
    
    try {
      const result = await analyzeHtmlFile(indexPath);
      results[theme] = result;
    } catch (error) {
      console.error(`Error analyzing ${theme}:`, error);
    }
  }
  
  return results;
}