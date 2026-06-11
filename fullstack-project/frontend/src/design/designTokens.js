/**
 * PREMIUM SAAS DESIGN SYSTEM
 * Apple + Linear + Stripe + Notion Inspired
 * Modern, Minimal, Enterprise-Grade
 */

export const DESIGN_TOKENS = {
  // ==========================================
  // BORDER RADIUS SYSTEM (24px card scale)
  // ==========================================
  borderRadius: {
    xs: '8px',      // tiny components
    sm: '12px',     // small buttons, inputs
    md: '14px',     // standard inputs, buttons
    lg: '18px',     // cards
    xl: '24px',     // large cards, modals
    2xl: '28px',    // modal dialog
    full: '9999px', // pill-shaped
  },

  // ==========================================
  // SPACING SYSTEM (8px base unit)
  // ==========================================
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    2xl: '32px',
    3xl: '40px',
    4xl: '48px',
    5xl: '56px',
    6xl: '64px',
  },

  // ==========================================
  // LIGHT MODE COLOR SYSTEM
  // ==========================================
  light: {
    // Backgrounds
    background: '#F5F7FA',
    surface: '#FFFFFF',
    surfaceSecondary: '#F9FAFB',
    surfaceTertiary: '#F3F4F6',
    
    // Borders
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    
    // Text
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textDisabled: '#D1D5DB',
    
    // Semantic Colors
    primary: '#007AFF',
    primaryLight: '#0A84FF',
    primaryDark: '#0051D5',
    
    secondary: '#5E5CE6',
    success: '#30D158',
    warning: '#FF9F0A',
    danger: '#FF453A',
    info: '#00C7FF',
    
    // Interactive States
    interactive: {
      hoverBg: 'rgba(0, 0, 0, 0.04)',
      activeBg: 'rgba(0, 0, 0, 0.08)',
      selectedBg: 'rgba(0, 122, 255, 0.1)',
    },
    
    // Shadows
    shadow: {
      xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
      sm: '0 2px 4px rgba(0, 0, 0, 0.08)',
      md: '0 4px 12px rgba(0, 0, 0, 0.10)',
      lg: '0 12px 32px rgba(0, 0, 0, 0.12)',
      xl: '0 20px 48px rgba(0, 0, 0, 0.15)',
      elevated: '0 30px 60px rgba(0, 0, 0, 0.20)',
      glow: '0 0 24px rgba(0, 122, 255, 0.15)',
    },
  },

  // ==========================================
  // DARK MODE COLOR SYSTEM
  // ==========================================
  dark: {
    // Backgrounds
    background: '#0A0A0A',
    surface: '#111111',
    surfaceSecondary: '#1A1A1A',
    surfaceTertiary: '#242424',
    
    // Borders
    border: '#2D2D2D',
    borderLight: '#3D3D3D',
    
    // Text
    text: '#FFFFFF',
    textSecondary: '#ABABAB',
    textTertiary: '#808080',
    textDisabled: '#4A4A4A',
    
    // Semantic Colors
    primary: '#0A84FF',
    primaryLight: '#40B0FF',
    primaryDark: '#0051D5',
    
    secondary: '#7C7CFF',
    success: '#34C759',
    warning: '#FFB800',
    danger: '#FF453A',
    info: '#00D9FF',
    
    // Interactive States
    interactive: {
      hoverBg: 'rgba(255, 255, 255, 0.08)',
      activeBg: 'rgba(255, 255, 255, 0.12)',
      selectedBg: 'rgba(10, 132, 255, 0.15)',
    },
    
    // Shadows
    shadow: {
      xs: '0 1px 3px rgba(0, 0, 0, 0.30)',
      sm: '0 2px 6px rgba(0, 0, 0, 0.40)',
      md: '0 4px 16px rgba(0, 0, 0, 0.50)',
      lg: '0 12px 40px rgba(0, 0, 0, 0.60)',
      xl: '0 20px 60px rgba(0, 0, 0, 0.70)',
      elevated: '0 30px 80px rgba(0, 0, 0, 0.80)',
      glow: '0 0 24px rgba(10, 132, 255, 0.20)',
    },
  },

  // ==========================================
  // TYPOGRAPHY SYSTEM
  // ==========================================
  typography: {
    fontFamily: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    
    // Font Sizes (px, designed for 16px base)
    fontSize: {
      xs: { size: '12px', lineHeight: '16px' },
      sm: { size: '13px', lineHeight: '18px' },
      base: { size: '14px', lineHeight: '20px' },
      md: { size: '15px', lineHeight: '22px' },
      lg: { size: '16px', lineHeight: '24px' },
      xl: { size: '18px', lineHeight: '28px' },
      '2xl': { size: '20px', lineHeight: '30px' },
      '3xl': { size: '24px', lineHeight: '32px' },
      '4xl': { size: '28px', lineHeight: '36px' },
      '5xl': { size: '32px', lineHeight: '40px' },
      '6xl': { size: '36px', lineHeight: '44px' },
      '7xl': { size: '40px', lineHeight: '48px' },
    },
    
    // Font Weights
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // ==========================================
  // GLASSMORPHISM SYSTEM
  // ==========================================
  glass: {
    // Backdrop blur values
    blur: {
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
    },
    
    // Glass effects (light mode)
    light: {
      card: {
        background: 'rgba(255, 255, 255, 0.80)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.60)',
      },
      panel: {
        background: 'rgba(255, 255, 255, 0.70)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.50)',
      },
      overlay: {
        background: 'rgba(0, 0, 0, 0.20)',
        backdropFilter: 'blur(12px)',
      },
    },
    
    // Glass effects (dark mode)
    dark: {
      card: {
        background: 'rgba(17, 17, 17, 0.80)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
      },
      panel: {
        background: 'rgba(17, 17, 17, 0.70)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      },
      overlay: {
        background: 'rgba(0, 0, 0, 0.60)',
        backdropFilter: 'blur(12px)',
      },
    },
  },

  // ==========================================
  // ANIMATION SYSTEM
  // ==========================================
  animation: {
    duration: {
      instant: '0ms',
      fast: '150ms',
      base: '200ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms',
      slowest: '1000ms',
    },
    
    easing: {
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },

  // ==========================================
  // COMPONENT SPECIFICATIONS
  // ==========================================
  components: {
    // Button Specifications
    button: {
      height: {
        sm: '32px',
        md: '36px',
        lg: '40px',
        xl: '48px',
      },
      padding: {
        sm: '0px 12px',
        md: '0px 16px',
        lg: '0px 20px',
        xl: '0px 24px',
      },
      fontSize: '14px',
      fontWeight: 500,
      borderRadius: '14px',
      transitionDuration: '200ms',
    },

    // Input Specifications
    input: {
      height: '36px',
      fontSize: '14px',
      borderRadius: '14px',
      padding: '8px 12px',
      transitionDuration: '200ms',
    },

    // Card Specifications
    card: {
      borderRadius: '24px',
      padding: '24px',
      transitionDuration: '300ms',
    },

    // Modal Specifications
    modal: {
      borderRadius: '28px',
      backdrop: 'rgba(0, 0, 0, 0.5)',
      backdropBlur: '12px',
      transitionDuration: '300ms',
    },

    // Sidebar Specifications
    sidebar: {
      width: '280px',
      collapsedWidth: '80px',
      transitionDuration: '300ms',
      backdropBlur: '16px',
    },

    // Topbar Specifications
    topbar: {
      height: '60px',
      backdropBlur: '12px',
      transitionDuration: '300ms',
    },

    // Table Specifications
    table: {
      headerHeight: '44px',
      rowHeight: '48px',
      borderRadius: '12px',
      transitionDuration: '200ms',
    },
  },

  // ==========================================
  // Z-INDEX SCALE
  // ==========================================
  zIndex: {
    hide: '-1',
    base: '0',
    dropdown: '100',
    sticky: '200',
    overlay: '300',
    modal: '400',
    popover: '500',
    tooltip: '600',
    notification: '700',
  },
};

export default DESIGN_TOKENS;
