// 확장된 스타일 토큰 시스템 - Phase 3

// 간격 토큰
export interface SpacingTokens {
  xs: string;    // 4px
  sm: string;    // 8px
  md: string;    // 16px
  lg: string;    // 24px
  xl: string;    // 32px
  xxl: string;   // 48px
  xxxl: string;  // 64px
}

// 타이포그래피 토큰
export interface TypographyTokens {
  fontSize: {
    xs: string;    // 12px
    sm: string;    // 14px
    base: string;  // 16px
    lg: string;    // 18px
    xl: string;    // 24px
    xxl: string;   // 32px
    xxxl: string;  // 48px
    display: string; // 64px
  };
  lineHeight: {
    tight: string;    // 1.2
    normal: string;   // 1.5
    relaxed: string;  // 1.75
    loose: string;    // 2
  };
  fontWeight: {
    light: string;    // 300
    normal: string;   // 400
    medium: string;   // 500
    semibold: string; // 600
    bold: string;     // 700
    extrabold: string; // 800
  };
  letterSpacing: {
    tight: string;    // -0.05em
    normal: string;   // 0
    wide: string;     // 0.05em
    wider: string;    // 0.1em
  };
}

// 효과 토큰
export interface EffectTokens {
  borderRadius: {
    none: string;     // 0
    sm: string;       // 4px
    md: string;       // 8px
    lg: string;       // 16px
    xl: string;       // 24px
    full: string;     // 9999px
  };
  shadow: {
    none: string;     // none
    sm: string;       // 0 1px 2px rgba(0,0,0,0.05)
    md: string;       // 0 4px 6px rgba(0,0,0,0.1)
    lg: string;       // 0 10px 15px rgba(0,0,0,0.1)
    xl: string;       // 0 20px 25px rgba(0,0,0,0.1)
    inner: string;    // inset 0 2px 4px rgba(0,0,0,0.06)
  };
  blur: {
    none: string;     // 0
    sm: string;       // 4px
    md: string;       // 8px
    lg: string;       // 16px
    xl: string;       // 24px
  };
}

// 전환 토큰
export interface TransitionTokens {
  duration: {
    fast: string;     // 150ms
    normal: string;   // 300ms
    slow: string;     // 500ms
  };
  timing: {
    linear: string;   // linear
    ease: string;     // ease
    easeIn: string;   // ease-in
    easeOut: string;  // ease-out
    easeInOut: string; // ease-in-out
  };
}

// 전체 스타일 토큰 시스템
export interface StyleTokenSystem {
  spacing: SpacingTokens;
  typography: TypographyTokens;
  effects: EffectTokens;
  transitions: TransitionTokens;
}

// 기본 스타일 토큰 값
export const defaultStyleTokens: StyleTokenSystem = {
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px'
  },
  typography: {
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '24px',
      xxl: '32px',
      xxxl: '48px',
      display: '64px'
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2'
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800'
    },
    letterSpacing: {
      tight: '-0.05em',
      normal: '0',
      wide: '0.05em',
      wider: '0.1em'
    }
  },
  effects: {
    borderRadius: {
      none: '0',
      sm: '4px',
      md: '8px',
      lg: '16px',
      xl: '24px',
      full: '9999px'
    },
    shadow: {
      none: 'none',
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
      inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)'
    },
    blur: {
      none: '0',
      sm: '4px',
      md: '8px',
      lg: '16px',
      xl: '24px'
    }
  },
  transitions: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    timing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out'
    }
  }
};

// 토큰을 CSS 변수로 변환하는 유틸리티
export function tokensToCSSVariables(tokens: StyleTokenSystem): string {
  const cssVars: string[] = [];
  
  // 간격 토큰
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    cssVars.push(`--spacing-${key}: ${value}`);
  });
  
  // 타이포그래피 토큰
  Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
    cssVars.push(`--font-size-${key}: ${value}`);
  });
  Object.entries(tokens.typography.lineHeight).forEach(([key, value]) => {
    cssVars.push(`--line-height-${key}: ${value}`);
  });
  Object.entries(tokens.typography.fontWeight).forEach(([key, value]) => {
    cssVars.push(`--font-weight-${key}: ${value}`);
  });
  Object.entries(tokens.typography.letterSpacing).forEach(([key, value]) => {
    cssVars.push(`--letter-spacing-${key}: ${value}`);
  });
  
  // 효과 토큰
  Object.entries(tokens.effects.borderRadius).forEach(([key, value]) => {
    cssVars.push(`--radius-${key}: ${value}`);
  });
  Object.entries(tokens.effects.shadow).forEach(([key, value]) => {
    cssVars.push(`--shadow-${key}: ${value}`);
  });
  Object.entries(tokens.effects.blur).forEach(([key, value]) => {
    cssVars.push(`--blur-${key}: ${value}`);
  });
  
  // 전환 토큰
  Object.entries(tokens.transitions.duration).forEach(([key, value]) => {
    cssVars.push(`--duration-${key}: ${value}`);
  });
  Object.entries(tokens.transitions.timing).forEach(([key, value]) => {
    cssVars.push(`--timing-${key}: ${value}`);
  });
  
  return cssVars.join('; ');
}