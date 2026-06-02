/**
 * Design Tokens for White-Label Theme System
 * Provides a centralized system for all theme-related values
 */

export const DesignTokens = {
  // Color Palettes
  colors: {
    primary: {
      50: 'var(--primary-50)',
      100: 'var(--primary-100)',
      200: 'var(--primary-200)',
      300: 'var(--primary-300)',
      400: 'var(--primary-400)',
      500: 'var(--primary, #1e40af)',
      600: 'var(--primary-600)',
      700: 'var(--primary-700)',
      800: 'var(--primary-800)',
      900: 'var(--primary-900)',
    },
    secondary: {
      DEFAULT: 'var(--secondary, #64748b)',
      light: 'var(--secondary-light)',
      dark: 'var(--secondary-dark)',
    },
    accent: {
      DEFAULT: 'var(--accent, #0ea5e9)',
      light: 'var(--accent-light)',
      dark: 'var(--accent-dark)',
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // Typography
  typography: {
    fontFamily: 'var(--font-family, "Inter", sans-serif)',
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
    },
    weights: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    lineHeights: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },

  // Spacing
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
    40: '10rem',
    48: '12rem',
    56: '14rem',
    64: '16rem',
  },

  // Border Radius
  borderRadius: {
    none: '0',
    small: 'var(--accent-radius, 0.25rem)',
    base: 'var(--accent-radius, 0.5rem)',
    lg: 'var(--accent-radius, 0.75rem)',
    full: '9999px',
  },

  // Button Styles
  buttonStyles: {
    rounded: {
      borderRadius: 'var(--accent-radius, 0.5rem)',
    },
    square: {
      borderRadius: '0',
    },
    pill: {
      borderRadius: '9999px',
    },
  },

  // Sidebar Styles
  sidebarStyles: {
    default: {
      width: '280px',
      borderRadius: '0',
      backgroundColor: 'var(--neutral-900)',
    },
    minimal: {
      width: '80px',
      borderRadius: 'var(--accent-radius)',
      backgroundColor: 'var(--neutral-800)',
    },
    compact: {
      width: '240px',
      borderRadius: 'var(--accent-radius)',
      backgroundColor: 'var(--neutral-900)',
    },
  },

  // Shadows
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },

  // Transitions
  transitions: {
    fast: 'all 150ms ease-in-out',
    base: 'all 250ms ease-in-out',
    slow: 'all 350ms ease-in-out',
  },

  // Responsive Breakpoints
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-Index Scale
  zIndex: {
    hide: '-1',
    base: '0',
    dropdown: '1000',
    sticky: '1100',
    fixed: '1200',
    backdrop: '1300',
    offcanvas: '1400',
    modal: '1500',
    popover: '1600',
    tooltip: '1700',
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
    secondary: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
    accent: 'linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%)',
    mesh: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 50%, var(--accent) 100%)',
  },
};

// Utility function to get theme value with fallback
export const getThemeValue = (path, fallback = undefined) => {
  const keys = path.split('.');
  let value = DesignTokens;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return fallback;
    }
  }

  return value;
};

// Color manipulation utilities
export const colorUtils = {
  // Convert hex to RGB
  hexToRgb: (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  // Convert RGB to hex
  rgbToHex: (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },

  // Lighten color
  lighten: (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  },

  // Darken color
  darken: (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  },

  // Get contrast color
  getContrastColor: (hexColor) => {
    const rgb = colorUtils.hexToRgb(hexColor);
    if (!rgb) return '#000000';
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  },

  // Calculate contrast ratio (WCAG)
  getContrastRatio: (color1, color2) => {
    const getLuminance = (hex) => {
      const rgb = colorUtils.hexToRgb(hex);
      if (!rgb) return 0;
      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(x => {
        x = x / 255;
        return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  },
};

export default DesignTokens;
