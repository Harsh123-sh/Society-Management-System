/**
 * Theme Provider Context
 * Loads society-specific themes from API and applies to CSS variables
 * Provides theme switching and caching functionality
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children, societyId: propSocietyId }) => {
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [themeMode, setThemeMode] = useState('light');

  // Function to apply theme to CSS variables
  const applyThemeToCSSVariables = useCallback((themeData) => {
    if (!themeData) return;

    const root = document.documentElement;

    // Apply primary colors
    if (themeData.theme_primary) {
      root.style.setProperty('--color-primary', themeData.theme_primary);
    }
    if (themeData.theme_secondary) {
      root.style.setProperty('--color-secondary', themeData.theme_secondary);
    }
    if (themeData.theme_accent) {
      root.style.setProperty('--color-accent', themeData.theme_accent);
    }
    if (themeData.theme_background) {
      root.style.setProperty('--color-bg', themeData.theme_background);
    }
    if (themeData.theme_card) {
      root.style.setProperty('--card-bg-color', themeData.theme_card);
    }

    // Apply theme mode
    if (themeData.theme_mode) {
      root.setAttribute('data-theme-mode', themeData.theme_mode);
      setThemeMode(themeData.theme_mode);
    }

    // Apply gradient style
    if (themeData.theme_gradient_style) {
      root.setAttribute('data-gradient-style', themeData.theme_gradient_style);
    }

    // Apply sidebar style
    if (themeData.sidebar_style) {
      root.setAttribute('data-sidebar-style', themeData.sidebar_style);
    }

    // Apply button style
    if (themeData.button_style) {
      root.setAttribute('data-button-style', themeData.button_style);
    }

    // Apply font family
    if (themeData.font_family) {
      root.style.setProperty('--font-family', `"${themeData.font_family}", system-ui, -apple-system, sans-serif`);
    }

    // Apply accent radius
    if (themeData.accent_radius) {
      const radiusMap = {
        'none': 'var(--radius-none)',
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        'full': 'var(--radius-full)'
      };
      const radius = radiusMap[themeData.accent_radius] || themeData.accent_radius;
      root.style.setProperty('--button-border-radius', radius);
      root.style.setProperty('--card-border-radius', radius);
    }

    // Apply brand identity
    if (themeData.brand_name) {
      root.style.setProperty('--brand-name', `"${themeData.brand_name}"`);
    }
    if (themeData.logo_url) {
      root.style.setProperty('--brand-logo-url', `url(${themeData.logo_url})`);
    }

    // Apply custom CSS if available
    if (themeData.custom_css) {
      const styleId = 'society-custom-css';
      let styleElement = document.getElementById(styleId);
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = themeData.custom_css;
    }

    setTheme(themeData);
    
    // Cache theme in localStorage
    localStorage.setItem('societyTheme', JSON.stringify(themeData));
  }, []);

  // Fetch theme from API
  const fetchTheme = useCallback(async (societyId) => {
    try {
      setLoading(true);
      setError(null);

      // Try localStorage first
      const cachedTheme = localStorage.getItem('societyTheme');
      if (cachedTheme) {
        const parsedTheme = JSON.parse(cachedTheme);
        applyThemeToCSSVariables(parsedTheme);
      }

      // Fetch fresh theme from API
      const response = await fetch(`/api/theme/society/${societyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch theme');
      }

      const data = await response.json();
      applyThemeToCSSVariables(data.theme);
    } catch (err) {
      console.error('Error fetching theme:', err);
      setError(err.message);
      // Apply default theme on error
      applyThemeToCSSVariables(getDefaultTheme());
    } finally {
      setLoading(false);
    }
  }, [applyThemeToCSSVariables]);

  // Load theme on mount or when societyId changes
  useEffect(() => {
    if (propSocietyId) {
      fetchTheme(propSocietyId);
    }
  }, [propSocietyId, fetchTheme]);

  // Monitor system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const newMode = e.matches ? 'dark' : 'light';
      if (theme?.theme_mode === 'auto') {
        setThemeMode(newMode);
        document.documentElement.setAttribute('data-theme-mode', newMode);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Switch theme mode
  const switchThemeMode = useCallback((mode) => {
    document.documentElement.setAttribute('data-theme-mode', mode);
    setThemeMode(mode);
    
    if (theme) {
      const updatedTheme = { ...theme, theme_mode: mode };
      localStorage.setItem('societyTheme', JSON.stringify(updatedTheme));
    }
  }, [theme]);

  const value = {
    theme,
    loading,
    error,
    themeMode,
    switchThemeMode,
    fetchTheme,
    applyThemeToCSSVariables
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Default theme fallback
function getDefaultTheme() {
  return {
    theme_primary: '#0f766e',
    theme_secondary: '#2563eb',
    theme_accent: '#14b8a6',
    theme_background: '#ffffff',
    theme_card: '#f9fafb',
    theme_mode: 'light',
    theme_gradient_style: 'default',
    sidebar_style: 'light',
    button_style: 'rounded',
    font_family: 'Inter',
    accent_radius: 'lg',
    brand_name: 'Smart Society'
  };
}

export default ThemeProvider;
