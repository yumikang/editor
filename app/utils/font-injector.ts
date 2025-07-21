import type { CustomFont } from '~/types/font-types';

const FONT_STYLE_ID_PREFIX = 'custom-font-';
const FONT_CONTAINER_ID = 'custom-fonts-container';

export function injectFontStyle(font: CustomFont): void {
  if (typeof window === 'undefined') return;
  
  const styleId = `${FONT_STYLE_ID_PREFIX}${font.id}`;
  
  // Check if style already exists
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;
  
  if (!styleElement) {
    // Create container if it doesn't exist
    let container = document.getElementById(FONT_CONTAINER_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = FONT_CONTAINER_ID;
      container.style.display = 'none';
      document.head.appendChild(container);
    }
    
    // Create new style element
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.setAttribute('data-font-id', font.id);
    styleElement.setAttribute('data-font-family', font.fontFamily);
    container.appendChild(styleElement);
  }
  
  // Update style content
  styleElement.textContent = `@import url('${font.cssUrl}');`;
  
  // Also inject to iframe if exists
  injectFontToIframe(font);
}

export function removeFontStyle(fontId: string): void {
  if (typeof window === 'undefined') return;
  
  const styleId = `${FONT_STYLE_ID_PREFIX}${fontId}`;
  const styleElement = document.getElementById(styleId);
  
  if (styleElement) {
    styleElement.remove();
  }
  
  // Also remove from iframe
  removeFontFromIframe(fontId);
}

export function injectFontToIframe(font: CustomFont): void {
  if (typeof window === 'undefined') return;
  
  const iframe = document.querySelector('iframe#preview-iframe') as HTMLIFrameElement;
  if (!iframe?.contentDocument) return;
  
  const iframeDoc = iframe.contentDocument;
  const styleId = `${FONT_STYLE_ID_PREFIX}${font.id}`;
  
  let styleElement = iframeDoc.getElementById(styleId) as HTMLStyleElement;
  
  if (!styleElement) {
    styleElement = iframeDoc.createElement('style');
    styleElement.id = styleId;
    styleElement.setAttribute('data-font-id', font.id);
    iframeDoc.head.appendChild(styleElement);
  }
  
  styleElement.textContent = `@import url('${font.cssUrl}');`;
}

export function removeFontFromIframe(fontId: string): void {
  if (typeof window === 'undefined') return;
  
  const iframe = document.querySelector('iframe#preview-iframe') as HTMLIFrameElement;
  if (!iframe?.contentDocument) return;
  
  const styleId = `${FONT_STYLE_ID_PREFIX}${fontId}`;
  const styleElement = iframe.contentDocument.getElementById(styleId);
  
  if (styleElement) {
    styleElement.remove();
  }
}

export function injectAllActiveFonts(fonts: CustomFont[]): void {
  if (typeof window === 'undefined') return;
  
  // Filter active fonts based on load strategy
  const fontsToInject = fonts.filter(font => 
    font.isActive && font.loadStrategy !== 'inactive'
  );
  
  // Inject each font
  fontsToInject.forEach(font => {
    injectFontStyle(font);
  });
}

export function cleanupInactiveFonts(fonts: CustomFont[]): void {
  if (typeof window === 'undefined') return;
  
  // Get all existing font styles
  const container = document.getElementById(FONT_CONTAINER_ID);
  if (!container) return;
  
  const existingStyles = container.querySelectorAll(`style[id^="${FONT_STYLE_ID_PREFIX}"]`);
  const activeFontIds = new Set(
    fonts
      .filter(f => f.isActive && f.loadStrategy !== 'inactive')
      .map(f => f.id)
  );
  
  // Remove styles for inactive fonts
  existingStyles.forEach(style => {
    const fontId = style.getAttribute('data-font-id');
    if (fontId && !activeFontIds.has(fontId)) {
      style.remove();
    }
  });
}

export function generateFontFamilyCSS(fonts: CustomFont[]): string {
  const activeFonts = fonts.filter(f => f.isActive);
  
  if (activeFonts.length === 0) {
    return '';
  }
  
  // Create CSS variables for font families
  const cssVars = activeFonts.map((font, index) => {
    const varName = `--font-${font.fontFamily.toLowerCase().replace(/\s+/g, '-')}`;
    return `${varName}: ${font.parsedData.fontFamily};`;
  }).join('\n  ');
  
  // Create utility classes
  const utilityClasses = activeFonts.map(font => {
    const className = `.font-${font.fontFamily.toLowerCase().replace(/\s+/g, '-')}`;
    return `${className} {
  font-family: var(--font-${font.fontFamily.toLowerCase().replace(/\s+/g, '-')});
}`;
  }).join('\n\n');
  
  return `:root {
  ${cssVars}
}

${utilityClasses}`;
}

export function updateIframeFonts(fonts: CustomFont[]): void {
  if (typeof window === 'undefined') return;
  
  const iframe = document.querySelector('iframe#preview-iframe') as HTMLIFrameElement;
  if (!iframe?.contentWindow) return;
  
  // Send message to iframe to update fonts
  iframe.contentWindow.postMessage({
    type: 'UPDATE_FONTS',
    fonts: fonts.filter(f => f.isActive).map(f => ({
      id: f.id,
      fontFamily: f.fontFamily,
      cssUrl: f.cssUrl,
      loadStrategy: f.loadStrategy
    }))
  }, '*');
}