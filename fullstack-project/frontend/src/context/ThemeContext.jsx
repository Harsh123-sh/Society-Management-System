import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl } from '../services/runtimeUrls';

const ThemeContext = createContext();

export const ThemeProvider = ({ children, societyId, subdomain }) => {
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme-mode') === 'dark' ||
    (!localStorage.getItem('theme-mode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  // Fetch theme on mount
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        setLoading(true);
        setError(null);

        let url;
        if (societyId) {
          url = `${getApiBaseUrl()}/themes/my-theme`;
        } else if (subdomain) {
          url = `${getApiBaseUrl()}/themes/subdomain/${subdomain}`;
        } else {
          // Use default theme
          setTheme(getDefaultTheme());
          setLoading(false);
          return;
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : undefined,
          }
        });

        if (!response.ok) throw new Error('Failed to fetch theme');

        const data = await response.json();
        setTheme(data.data || getDefaultTheme());
      } catch (err) {
        console.error('Theme fetch error:', err);
        setError(err.message);
        setTheme(getDefaultTheme());
      } finally {
        setLoading(false);
      }
    };

    fetchTheme();
  }, [societyId, subdomain]);

  // Apply theme to DOM
  useEffect(() => {
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty('--primary', theme.theme_primary);
    root.style.setProperty('--secondary', theme.theme_secondary);
    root.style.setProperty('--accent', theme.theme_accent);
    root.style.setProperty('--font-family', theme.font_family || 'Inter');
    root.style.setProperty('--sidebar-style', theme.sidebar_style || 'default');
    root.style.setProperty('--button-style', theme.button_style || 'rounded');
    root.style.setProperty('--accent-radius', getRadiusValue(theme.accent_radius));

    // Apply gradient style
    if (theme.theme_gradient_style === 'radial') {
      root.style.setProperty('--gradient-style', `radial-gradient`);
    } else if (theme.theme_gradient_style === 'conic') {
      root.style.setProperty('--gradient-style', `conic-gradient`);
    } else {
      root.style.setProperty('--gradient-style', `linear-gradient`);
    }

    // Apply logo if exists
    if (theme.logo_url) {
      root.style.setProperty('--logo-url', `url(${theme.logo_url})`);
    }

    // Apply theme mode class and attributes
    const currentTheme = darkMode && theme.theme_mode !== 'light' ? 'dark' : 'light';
    root.classList.toggle('dark', currentTheme === 'dark');
    root.classList.toggle('light', currentTheme === 'light');
    root.setAttribute('data-theme', currentTheme);
    const body = document.body;
    if (body) {
      body.classList.toggle('dark', currentTheme === 'dark');
      body.classList.toggle('light', currentTheme === 'light');
      body.setAttribute('data-theme', currentTheme);
    }

    // Load custom CSS if available
    if (theme.custom_css) {
      const styleId = 'custom-theme-css';
      let style = document.getElementById(styleId);
      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
      }
      style.textContent = theme.custom_css;
    }
  }, [theme, darkMode]);

  const toggleDarkMode = useCallback(() => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme-mode', newMode ? 'dark' : 'light');
  }, [darkMode]);

  const updateTheme = useCallback(async (updates) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/themes/${societyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update theme');

      const data = await response.json();
      setTheme(data.data);
      return data.data;
    } catch (err) {
      console.error('Theme update error:', err);
      throw err;
    }
  }, [societyId]);

  const applyPreset = useCallback(async (presetId) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/themes/${societyId}/preset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ presetId })
      });

      if (!response.ok) throw new Error('Failed to apply preset');

      const data = await response.json();
      setTheme(data.data);
      return data.data;
    } catch (err) {
      console.error('Preset apply error:', err);
      throw err;
    }
  }, [societyId]);

  const exportCSS = useCallback(async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/themes/${societyId}/export-css`);
      if (!response.ok) throw new Error('Failed to export CSS');
      return await response.text();
    } catch (err) {
      console.error('CSS export error:', err);
      throw err;
    }
  }, [societyId]);

  const value = {
    theme,
    loading,
    error,
    darkMode,
    toggleDarkMode,
    updateTheme,
    applyPreset,
    exportCSS,
    getPrimaryColor: (shade = 500) => theme?.[`theme_primary_${shade}`] || theme?.theme_primary,
    getSecondaryColor: (shade = 500) => theme?.[`theme_secondary_${shade}`] || theme?.theme_secondary,
    getAccentColor: (shade = 500) => theme?.[`theme_accent_${shade}`] || theme?.theme_accent,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Helper functions
function getDefaultTheme() {
  return {
    id: 0,
    name: 'Default',
    theme_primary: '#1e40af',
    theme_secondary: '#64748b',
    theme_accent: '#0ea5e9',
    theme_mode: 'auto',
    theme_gradient_style: 'linear',
    font_family: 'Inter',
    sidebar_style: 'default',
    button_style: 'rounded',
    accent_radius: 'medium',
    logo_url: null,
    brand_name: 'Society Pro',
  };
}

function getRadiusValue(radius) {
  switch (radius) {
    case 'small':
      return '0.25rem';
    case 'large':
      return '0.75rem';
    case 'medium':
    default:
      return '0.5rem';
  }
}

export default ThemeProvider;
