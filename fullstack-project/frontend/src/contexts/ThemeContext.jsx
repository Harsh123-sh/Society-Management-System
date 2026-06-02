import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getStoredRole, getStoredUser } from '../utils/session';
import { societyPresets } from '../theme/societyPresets';
import { fetchCurrentTheme, fetchThemeCatalog, generateTheme, updateTheme } from '../services/themeApi';

const THEME_STORAGE_KEY = 'society_theme_engine_v1';

const defaultPreferences = {
  selectedSocietyId: "",
  themeMode: 'light',
  density: 'comfortable',
  layoutMode: 'glass',
  fontFamily: 'Manrope',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: societyPresets[0].heroStart,
  secondaryColor: societyPresets[0].heroEnd,
  accentColor: '20 184 166',
  themeJson: {
    mode: 'light',
    layout: 'glass',
    density: 'comfortable',
    navigationStyle: 'floating',
    radius: '24px',
  },
};

const ThemeContext = createContext(null);
const APPEARANCE_STORAGE_KEY = 'society_theme_engine_v2';

function safeParse(rawValue) {
  if (!rawValue) return null;
  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

function loadPreferences() {
  if (typeof window === 'undefined') {
    return defaultPreferences;
  }

  const saved = safeParse(localStorage.getItem(THEME_STORAGE_KEY));
  const appearance = safeParse(localStorage.getItem(APPEARANCE_STORAGE_KEY));
  const resolvedThemeMode = appearance?.themeMode || appearance?.theme || saved?.themeMode || saved?.theme || defaultPreferences.themeMode;
  return {
    ...defaultPreferences,
    ...(saved || {}),
    themeMode: resolvedThemeMode,
    themeJson: {
      ...defaultPreferences.themeJson,
      ...(saved?.themeJson || {}),
      mode: resolvedThemeMode,
    },
  };
}

function hexToRgbString(color) {
  if (!color || typeof color !== 'string') {
    return '20 184 166';
  }

  const value = color.trim();
  if (/^\d+\s+\d+\s+\d+$/.test(value)) {
    return value;
  }

  const hex = value.replace('#', '');
  if (![3, 6].includes(hex.length)) {
    return '20 184 166';
  }

  const normalized = hex.length === 3 ? hex.split('').map((item) => item + item).join('') : hex;
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  if ([red, green, blue].some((item) => Number.isNaN(item))) {
    return '20 184 166';
  }

  return `${red} ${green} ${blue}`;
}

function savePreferences(preferences) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preferences));
  localStorage.setItem(
    APPEARANCE_STORAGE_KEY,
    JSON.stringify({
      themeMode: preferences.themeMode || 'light',
      density: preferences.density || defaultPreferences.density,
      layoutMode: preferences.layoutMode || defaultPreferences.layoutMode,
      fontFamily: preferences.fontFamily || defaultPreferences.fontFamily,
      logoUrl: preferences.logoUrl || '',
      faviconUrl: preferences.faviconUrl || '',
      primaryColor: preferences.primaryColor || defaultPreferences.primaryColor,
      secondaryColor: preferences.secondaryColor || defaultPreferences.secondaryColor,
      accentColor: preferences.accentColor || defaultPreferences.accentColor,
      themeJson: {
        ...defaultPreferences.themeJson,
        ...(preferences.themeJson || {}),
        mode: preferences.themeMode || 'light',
      },
    })
  );
}

function applyThemeVariables(preferences) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;
  const primaryRgb = preferences.accentColor || '20 184 166';
  const surfaceRgb = preferences.themeMode === 'dark' ? '8 15 28' : '255 255 255';

  root.style.setProperty('--app-accent-rgb', primaryRgb);
  root.style.setProperty('--app-surface-rgb', surfaceRgb);
  root.style.setProperty('--app-primary-color', preferences.primaryColor || '#0f766e');
  root.style.setProperty('--app-secondary-color', preferences.secondaryColor || '#2563eb');
  root.style.setProperty('--app-font-sans', preferences.fontFamily || 'Manrope');
  root.style.setProperty('--app-layout-mode', preferences.layoutMode || 'glass');
  root.style.setProperty('--app-logo-url', preferences.logoUrl || '');
  root.style.setProperty('--bg-main', preferences.themeMode === 'dark' ? '#020617' : '#f8fafc');
  root.style.setProperty('--bg-card', preferences.themeMode === 'dark' ? '#0f172a' : '#ffffff');
  root.style.setProperty('--bg-sidebar', preferences.themeMode === 'dark' ? '#020617' : '#ffffff');
  root.style.setProperty('--bg-header', preferences.themeMode === 'dark' ? '#0f172a' : '#ffffff');
  root.style.setProperty('--text-primary', preferences.themeMode === 'dark' ? '#f8fafc' : '#0f172a');
  root.style.setProperty('--text-secondary', preferences.themeMode === 'dark' ? '#cbd5e1' : '#475569');
  root.style.setProperty('--text-muted', preferences.themeMode === 'dark' ? '#94a3b8' : '#64748b');
  root.style.setProperty('--border-color', preferences.themeMode === 'dark' ? '#334155' : '#e2e8f0');
  root.style.setProperty('--input-bg', preferences.themeMode === 'dark' ? '#111827' : '#ffffff');
  root.style.setProperty('--input-border', preferences.themeMode === 'dark' ? '#334155' : '#e2e8f0');
  root.style.setProperty('--input-placeholder', preferences.themeMode === 'dark' ? '#94a3b8' : '#64748b');
  root.style.setProperty('--button-bg', preferences.themeMode === 'dark' ? '#1e293b' : '#ffffff');
  root.style.setProperty('--button-text', preferences.themeMode === 'dark' ? '#f8fafc' : '#0f172a');
  root.style.setProperty('--hero-bg', preferences.themeMode === 'dark' ? 'linear-gradient(135deg, #020617, #064e3b)' : 'linear-gradient(135deg, #ffffff, #ecfdf5)');

  const themeMode = preferences.themeMode || 'light';
  root.dataset.theme = themeMode;
  root.dataset.themeMode = themeMode;
  root.classList.toggle('dark', themeMode === 'dark');
  root.classList.toggle('light', themeMode === 'light');
  body.dataset.theme = themeMode;
  body.dataset.density = preferences.density;
  body.dataset.layout = preferences.layoutMode;
  body.classList.toggle('dark', themeMode === 'dark');
  body.classList.toggle('light', themeMode === 'light');
  body.style.setProperty('--app-font-sans', preferences.fontFamily || 'Manrope');
}

export function ThemeProvider({ children }) {
  const [preferences, setPreferences] = useState(loadPreferences);
  const [catalog, setCatalog] = useState([]);

  const selectedSociety = useMemo(() => {
    const selected = catalog.find((item) => String(item.id) === String(preferences.selectedSocietyId));
    if (selected) {
      const preset = societyPresets.find((item) => item.id === String(selected.slug || selected.code || selected.name || '').toLowerCase()) || societyPresets[0];
      return {
        ...preset,
        ...selected,
        accentRgb: hexToRgbString(selected.accent_color || selected.accentColor || preset.accentRgb),
        heroStart: selected.primary_color || selected.primaryColor || preset.heroStart,
        heroEnd: selected.secondary_color || selected.secondaryColor || preset.heroEnd,
        label: selected.subscription_plan || preset.label,
        summary: selected.status ? `${selected.status} society control center` : preset.summary,
        stat: selected.user_count ? `${selected.user_count} members` : preset.stat,
      };
    }

    return societyPresets.find((item) => item.id === preferences.selectedSocietyId) || societyPresets[0];
  }, [catalog, preferences.selectedSocietyId]);

  useEffect(() => {
    applyThemeVariables(preferences);
    savePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    const role = getStoredRole();
    const user = getStoredUser();

    if (!user?.token || !['admin', 'super_admin'].includes(role)) {
      return;
    }

    fetchCurrentTheme()
      .then((response) => {
        const themeContext = response?.data;
        if (!themeContext?.branding) {
          return;
        }

        setPreferences((current) => ({
          ...current,
          selectedSocietyId: String(themeContext.society?.id || current.selectedSocietyId),
          logoUrl: themeContext.branding.logoUrl || current.logoUrl,
          faviconUrl: themeContext.branding.faviconUrl || current.faviconUrl,
          primaryColor: themeContext.branding.primaryColor || current.primaryColor,
          secondaryColor: themeContext.branding.secondaryColor || current.secondaryColor,
          accentColor: themeContext.branding.accentColor || current.accentColor,
          fontFamily: themeContext.branding.fontFamily || current.fontFamily,
          themeMode: themeContext.branding.theme?.mode || current.themeMode,
          density: themeContext.branding.theme?.density || current.density,
          layoutMode: themeContext.branding.theme?.layout || current.layoutMode,
          themeJson: { ...current.themeJson, ...(themeContext.branding.theme || {}) },
        }));
      })
      .catch(() => undefined);

    fetchThemeCatalog()
      .then((response) => setCatalog(Array.isArray(response?.data) ? response.data : []))
      .catch(() => undefined);
  }, []);

  const apiActions = useMemo(() => ({
    async saveThemeToBackend(societyId, payload) {
      const response = await updateTheme(societyId, payload);
      const branding = response?.data?.branding || response?.data;
      if (branding) {
        setPreferences((current) => ({
          ...current,
          selectedSocietyId: String(response?.data?.society?.id || societyId),
          logoUrl: branding.logoUrl || current.logoUrl,
          faviconUrl: branding.faviconUrl || current.faviconUrl,
          primaryColor: branding.primaryColor || current.primaryColor,
          secondaryColor: branding.secondaryColor || current.secondaryColor,
          accentColor: branding.accentColor || current.accentColor,
          fontFamily: branding.fontFamily || current.fontFamily,
          themeMode: branding.theme?.mode || current.themeMode,
          density: branding.theme?.density || current.density,
          layoutMode: branding.theme?.layout || current.layoutMode,
          themeJson: { ...current.themeJson, ...(branding.theme || {}) },
        }));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('societies:changed'));
        }
      }
      return response;
    },
    async generateThemePack(payload) {
      const response = await generateTheme(payload);
      return response?.data || response;
    },
  }), []);

  const value = useMemo(() => ({
    preferences,
    selectedSociety,
    catalog,
    setSelectedSocietyId(selectedSocietyId) {
      setPreferences((current) => ({ ...current, selectedSocietyId }));
    },
    setThemeMode(themeMode) {
      setPreferences((current) => ({ ...current, themeMode }));
    },
    setDensity(density) {
      setPreferences((current) => ({ ...current, density }));
    },
    setLayoutMode(layoutMode) {
      setPreferences((current) => ({ ...current, layoutMode }));
    },
    setFontFamily(fontFamily) {
      setPreferences((current) => ({ ...current, fontFamily }));
    },
    setBranding(partialBranding) {
      setPreferences((current) => ({
        ...current,
        ...partialBranding,
        themeJson: { ...current.themeJson, ...(partialBranding.themeJson || {}) },
      }));
    },
    ...apiActions,
  }), [apiActions, catalog, preferences, selectedSociety]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeEngine() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeEngine must be used within ThemeProvider');
  }
  return context;
}
