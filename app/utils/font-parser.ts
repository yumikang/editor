import type { ParsedFontCSS, FontFace, FontParsedData } from '~/types/font-types';

export async function parseFontCSS(cssUrl: string): Promise<ParsedFontCSS> {
  try {
    const response = await fetch(cssUrl);
    const cssText = await response.text();
    
    const fontFaces: FontFace[] = [];
    const imports: string[] = [];
    const variables: Record<string, string> = {};
    
    // Parse @import statements
    const importRegex = /@import\s+(?:url\()?['"]([^'"]+)['"](?:\))?;/g;
    let importMatch;
    while ((importMatch = importRegex.exec(cssText)) !== null) {
      imports.push(importMatch[1]);
    }
    
    // Parse @font-face rules
    const fontFaceRegex = /@font-face\s*{([^}]+)}/g;
    let fontFaceMatch;
    
    while ((fontFaceMatch = fontFaceRegex.exec(cssText)) !== null) {
      const content = fontFaceMatch[1];
      const fontFace: Partial<FontFace> = {};
      
      // Extract font-family
      const familyMatch = content.match(/font-family:\s*['"]?([^'";]+)['"]?;/);
      if (familyMatch) {
        fontFace.fontFamily = familyMatch[1].trim();
      }
      
      // Extract src
      const srcMatch = content.match(/src:\s*([^;]+);/);
      if (srcMatch) {
        fontFace.src = srcMatch[1].trim();
      }
      
      // Extract font-weight
      const weightMatch = content.match(/font-weight:\s*([^;]+);/);
      if (weightMatch) {
        fontFace.fontWeight = weightMatch[1].trim();
      }
      
      // Extract font-style
      const styleMatch = content.match(/font-style:\s*([^;]+);/);
      if (styleMatch) {
        fontFace.fontStyle = styleMatch[1].trim();
      }
      
      // Extract font-display
      const displayMatch = content.match(/font-display:\s*([^;]+);/);
      if (displayMatch) {
        fontFace.fontDisplay = displayMatch[1].trim();
      }
      
      // Extract unicode-range
      const unicodeMatch = content.match(/unicode-range:\s*([^;]+);/);
      if (unicodeMatch) {
        fontFace.unicodeRange = unicodeMatch[1].trim();
      }
      
      if (fontFace.fontFamily && fontFace.src) {
        fontFaces.push(fontFace as FontFace);
      }
    }
    
    // Parse CSS variables
    const varRegex = /--([\w-]+):\s*([^;]+);/g;
    let varMatch;
    while ((varMatch = varRegex.exec(cssText)) !== null) {
      variables[varMatch[1]] = varMatch[2].trim();
    }
    
    return {
      fontFaces,
      imports,
      variables
    };
  } catch (error) {
    console.error('Error parsing font CSS:', error);
    throw new Error('Failed to parse font CSS');
  }
}

export function extractFontData(parsed: ParsedFontCSS): FontParsedData {
  const weights = new Set<string>();
  const styles = new Set<string>();
  let primaryUrl = '';
  let unicode = '';
  let display: FontParsedData['display'] = 'swap';
  let fontFamily = '';
  
  // Process font faces
  parsed.fontFaces.forEach((face, index) => {
    if (index === 0) {
      fontFamily = face.fontFamily;
      
      // Extract primary URL from src
      const urlMatch = face.src.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (urlMatch) {
        primaryUrl = urlMatch[1];
      }
    }
    
    // Collect weights
    if (face.fontWeight) {
      const weight = face.fontWeight.replace(/normal/i, '400').replace(/bold/i, '700');
      weights.add(weight);
    }
    
    // Collect styles
    if (face.fontStyle) {
      styles.add(face.fontStyle);
    }
    
    // Get display value
    if (face.fontDisplay) {
      display = face.fontDisplay as FontParsedData['display'];
    }
    
    // Collect unicode ranges
    if (face.unicodeRange && !unicode) {
      unicode = face.unicodeRange;
    }
  });
  
  return {
    fontFamily,
    weights: Array.from(weights).sort((a, b) => parseInt(a) - parseInt(b)),
    styles: Array.from(styles),
    primaryUrl,
    unicode,
    display
  };
}

export function generateFontFaceCSS(fontFaces: FontFace[]): string {
  return fontFaces.map(face => {
    const lines = ['@font-face {'];
    
    if (face.fontFamily) {
      lines.push(`  font-family: '${face.fontFamily}';`);
    }
    
    if (face.src) {
      lines.push(`  src: ${face.src};`);
    }
    
    if (face.fontWeight) {
      lines.push(`  font-weight: ${face.fontWeight};`);
    }
    
    if (face.fontStyle) {
      lines.push(`  font-style: ${face.fontStyle};`);
    }
    
    if (face.fontDisplay) {
      lines.push(`  font-display: ${face.fontDisplay};`);
    }
    
    if (face.unicodeRange) {
      lines.push(`  unicode-range: ${face.unicodeRange};`);
    }
    
    lines.push('}');
    
    return lines.join('\n');
  }).join('\n\n');
}

export function validateFontUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Check if URL is valid
    if (!parsedUrl.protocol.startsWith('http')) {
      return false;
    }
    
    // Check if it's a CSS file
    if (!url.endsWith('.css') && !url.includes('.css?')) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

export function extractFontName(cssUrl: string, fontFamily?: string): string {
  // Try to extract from URL first
  const urlParts = cssUrl.split('/');
  const filename = urlParts[urlParts.length - 1];
  const nameFromUrl = filename.replace(/\.css.*$/, '').replace(/[-_]/g, ' ');
  
  if (nameFromUrl && !nameFromUrl.includes('?')) {
    return nameFromUrl.charAt(0).toUpperCase() + nameFromUrl.slice(1);
  }
  
  // Fallback to font family
  if (fontFamily) {
    return fontFamily.replace(/['"]/g, '').split(',')[0].trim();
  }
  
  return 'Unknown Font';
}