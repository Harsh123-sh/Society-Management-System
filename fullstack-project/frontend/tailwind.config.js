/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme system - use single source CSS variables
        background: 'var(--background)',
        surface: 'var(--surface)',
        card: 'var(--card)',
        text: 'var(--text)',
        muted: 'var(--text-muted)',
        border: 'var(--border)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        success: 'var(--success)',
        error: 'var(--error)',
        warning: 'var(--warning)',
        info: 'var(--info)',
      },
      fontFamily: {
        sans: ["var(--font-family, 'Inter')", "Manrope", "Segoe UI", "sans-serif"],
        display: ["Space Grotesk", "Manrope", "Segoe UI", "sans-serif"],
        app: ["var(--font-family, 'Inter')"],
      },
      transitionDuration: {
        250: '250ms',
      },
      backgroundColor: {
        "gradient-dark": "linear-gradient(135deg, #07111f 0%, #0f172a 100%)",
        "theme-gradient": "var(--gradient-style)",
      },
      borderRadius: {
        "theme-sm": "var(--accent-radius, 0.25rem)",
        "theme-md": "var(--accent-radius, 0.5rem)",
        "theme-lg": "var(--accent-radius, 0.75rem)",
      },
      boxShadow: {
        "glow-cyan": "0 0 20px rgba(0, 245, 255, 0.3), inset 0 0 20px rgba(0, 245, 255, 0.1)",
        "glow-teal": "0 0 20px rgba(20, 241, 149, 0.3), inset 0 0 20px rgba(20, 241, 149, 0.1)",
        "soft-shadow": "0 8px 32px rgba(0, 0, 0, 0.1)",
        "elevated": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "theme-glow": "0 0 20px rgba(var(--primary), 0.3)",
      },
      animation: {
        "float": "float 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "gradient-shift": "gradient-shift 3s ease-in-out infinite",
        "slide-up": "slide-up 0.5s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
      },
      keyframes: {
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.7 },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
      backdropBlur: {
        "md": "12px",
        "lg": "16px",
      },
      backgroundImage: {
        'theme-gradient': 'linear-gradient(to right, var(--primary), var(--accent))',
        'theme-mesh': 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 50%, var(--accent) 100%)',
      },
    },
  },
  plugins: [
    require('tailwindcss/plugin')(function({ addUtilities, theme }) {
      const utilities = {
        // Theme-aware utilities
        '.btn-theme': {
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          transitionProperty: 'all',
          transitionDuration: '250ms',
          backgroundColor: 'var(--primary)',
          color: 'white',
          '&:hover': {
            backgroundColor: 'var(--primary-600)',
          },
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
}

