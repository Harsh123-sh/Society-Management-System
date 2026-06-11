/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      // ==========================================
      // COLORS - Premium SaaS Design System
      // ==========================================
      colors: {
        // Semantic colors using CSS variables
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-secondary': 'var(--surface-secondary)',
        'surface-tertiary': 'var(--surface-tertiary)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-disabled': 'var(--text-disabled)',
        border: 'var(--border)',
        'border-light': 'var(--border-light)',
        
        // Primary colors
        primary: 'var(--primary)',
        'primary-light': 'var(--primary-light)',
        'primary-dark': 'var(--primary-dark)',
        
        // Semantic colors
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        error: 'var(--error)',
        info: 'var(--info)',
      },

      // ==========================================
      // FONT FAMILY - Inter + System Fonts
      // ==========================================
      fontFamily: {
        sans: [
          "'Inter'",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "'Helvetica Neue'",
          "sans-serif",
        ],
        display: [
          "'Inter'",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "sans-serif",
        ],
      },

      // ==========================================
      // FONT SIZE - Premium Typography
      // ==========================================
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['14px', { lineHeight: '20px' }],
        md: ['15px', { lineHeight: '22px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['18px', { lineHeight: '28px' }],
        '2xl': ['20px', { lineHeight: '30px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
        '4xl': ['28px', { lineHeight: '36px' }],
        '5xl': ['32px', { lineHeight: '40px' }],
        '6xl': ['36px', { lineHeight: '44px' }],
        '7xl': ['40px', { lineHeight: '48px' }],
      },

      // ==========================================
      // BORDER RADIUS - Apple Inspired Curves
      // ==========================================
      borderRadius: {
        xs: 'var(--radius-xs, 8px)',
        sm: 'var(--radius-sm, 12px)',
        md: 'var(--radius-md, 14px)',
        lg: 'var(--radius-lg, 18px)',
        xl: 'var(--radius-xl, 24px)',
        '2xl': 'var(--radius-2xl, 28px)',
        full: '9999px',
      },

      // ==========================================
      // SPACING - 8px Grid System
      // ==========================================
      spacing: {
        xs: 'var(--space-xs, 4px)',
        sm: 'var(--space-sm, 8px)',
        md: 'var(--space-md, 12px)',
        lg: 'var(--space-lg, 16px)',
        xl: 'var(--space-xl, 24px)',
        '2xl': 'var(--space-2xl, 32px)',
        '3xl': 'var(--space-3xl, 40px)',
        '4xl': '48px',
        '5xl': '56px',
        '6xl': '64px',
      },

      // ==========================================
      // SHADOWS - Premium Elevation System
      // ==========================================
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        elevated: 'var(--shadow-elevated)',
        glow: 'var(--shadow-glow)',
        'glass-light': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.30)',
      },

      // ==========================================
      // BACKDROP FILTER - Glassmorphism
      // ==========================================
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },

      // ==========================================
      // TRANSITIONS
      // ==========================================
      transitionDuration: {
        fast: 'var(--duration-fast, 150ms)',
        normal: 'var(--duration-normal, 300ms)',
        slow: 'var(--duration-slow, 500ms)',
      },

      transitionTimingFunction: {
        'ease-out': 'var(--easing-out, cubic-bezier(0, 0, 0.2, 1))',
        'ease-in-out': 'var(--easing-inOut, cubic-bezier(0.4, 0, 0.2, 1))',
      },

      // ==========================================
      // ANIMATIONS - Framer Motion Inspired
      // ==========================================
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'fade-out': 'fadeOut 300ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'slide-down': 'slideDown 300ms ease-out',
        'scale-in': 'scaleIn 300ms ease-out',
        'bounce-soft': 'bounceSoft 500ms ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSoft: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
          '100%': { transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      },

      // ==========================================
      // WIDTH/HEIGHT - Sidebar & Component Sizes
      // ==========================================
      width: {
        sidebar: '280px',
        'sidebar-collapsed': '80px',
      },

      height: {
        topbar: '60px',
      },

      // ==========================================
      // Z-INDEX SCALE
      // ==========================================
      zIndex: {
        hide: '-1',
        auto: 'auto',
        dropdown: '100',
        sticky: '200',
        overlay: '300',
        modal: '400',
        popover: '500',
        tooltip: '600',
        notification: '700',
      },
    },
  },

  plugins: [
    // Custom plugin for advanced utilities
    require('tailwindcss/plugin')(function({ addUtilities, theme }) {
      const utilities = {
        // ==========================================
        // GLASS MORPHISM UTILITIES
        // ==========================================
        '.glass': {
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          border: 'var(--glass-border)',
        },

        '.glass-lg': {
          backgroundColor: 'rgba(255, 255, 255, 0.90)',
          '@dark': { backgroundColor: 'rgba(17, 17, 17, 0.90)' },
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          '@dark': { border: '1px solid rgba(255, 255, 255, 0.10)' },
        },

        '.glass-sm': {
          backgroundColor: 'rgba(255, 255, 255, 0.70)',
          '@dark': { backgroundColor: 'rgba(17, 17, 17, 0.70)' },
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          '@dark': { border: '1px solid rgba(255, 255, 255, 0.08)' },
        },

        // ==========================================
        // PREMIUM BUTTON UTILITIES
        // ==========================================
        '.btn-primary': {
          position: 'relative',
          backgroundColor: 'var(--primary)',
          color: '#ffffff',
          fontWeight: '500',
          borderRadius: '14px',
          padding: '0 16px',
          height: '36px',
          fontSize: '14px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 200ms ease-out',
          border: 'none',

          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 'var(--shadow-glow)',
          },

          '&:active': {
            transform: 'translateY(0)',
          },
        },

        '.btn-secondary': {
          position: 'relative',
          backgroundColor: 'var(--surface-secondary)',
          color: 'var(--text)',
          fontWeight: '500',
          borderRadius: '14px',
          padding: '0 16px',
          height: '36px',
          fontSize: '14px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 200ms ease-out',
          border: '1px solid var(--border)',

          '&:hover': {
            backgroundColor: 'var(--hover-bg)',
          },

          '&:active': {
            backgroundColor: 'var(--active-bg)',
          },
        },

        '.btn-danger': {
          position: 'relative',
          backgroundColor: 'var(--danger)',
          color: '#ffffff',
          fontWeight: '500',
          borderRadius: '14px',
          padding: '0 16px',
          height: '36px',
          fontSize: '14px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 200ms ease-out',
          border: 'none',

          '&:hover': {
            transform: 'translateY(-2px)',
            filter: 'brightness(1.1)',
          },
        },

        // ==========================================
        // PREMIUM CARD UTILITIES
        // ==========================================
        '.card-premium': {
          backgroundColor: 'var(--surface)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)',
          transition: 'all 300ms ease-out',

          '&:hover': {
            boxShadow: 'var(--shadow-lg)',
            transform: 'translateY(-4px)',
          },
        },

        '.card-glass': {
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          border: 'var(--glass-border)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 300ms ease-out',

          '&:hover': {
            boxShadow: 'var(--shadow-lg)',
            transform: 'translateY(-4px)',
          },
        },

        // ==========================================
        // FOCUS RING UTILITIES
        // ==========================================
        '.focus-ring': {
          outlineColor: 'var(--primary)',
          outlineStyle: 'solid',
          outlineWidth: '2px',
          outlineOffset: '2px',
        },

        '.focus-ring-inset': {
          boxShadow: 'inset 0 0 0 2px var(--primary)',
        },

        // ==========================================
        // TEXT UTILITIES
        // ==========================================
        '.text-gradient': {
          backgroundImage: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        },

        // ==========================================
        // BACKDROP UTILITIES
        // ==========================================
        '.backdrop-blur-glass': {
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          '@dark': { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
        },
        '.btn-theme-outline': {
          padding: '0.5rem 1rem',
          borderWidth: '2px',
          borderRadius: '0.5rem',
          transitionProperty: 'all',
          transitionDuration: '250ms',
          borderColor: 'var(--primary)',
          color: 'var(--primary)',
          '&:hover': {
            backgroundColor: 'var(--primary-50)',
          },
        },
        '.card-theme': {
          borderRadius: '0.5rem',
          boxShadow: theme('boxShadow.md'),
          padding: '1.5rem',
          transitionProperty: 'all',
          transitionDuration: '250ms',
          backgroundColor: 'var(--card)',
          borderLeft: '4px solid var(--primary)',
        },
        '.gradient-theme': {
          backgroundImage: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
        },
        '.sidebar-theme': {
          backgroundColor: 'var(--sidebar-bg)',
          width: 'var(--sidebar-width)',
        },
      };

      addUtilities(utilities);
    }),
  ],
};
