import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getStoredRole, getStoredUser } from '../utils/session';
import { societyPresets } from '../theme/societyPresets';
import { fetchCurrentTheme, fetchThemeCatalog, generateTheme, updateTheme } from '../services/themeApi';
import { applyThemeState, normalizeThemeState, readStoredThemeState, writeStoredThemeState } from '../utils/themeState';

const ThemeContext = createContext(null);

function loadPreferences() {
  if (typeof window === 'undefined') {
    return normalizeThemeState();
  }

  return readStoredThemeState();
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
  writeStoredThemeState(preferences);
}

export function ThemeProvider({ children }) {
  const [preferences, setPreferences] = useState(loadPreferences);
  const [catalog, setCatalog] = useState([]);
  const [systemThemeMode, setSystemThemeMode] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

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
    applyThemeState(preferences);
    savePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => setSystemThemeMode(event.matches ? 'dark' : 'light');

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (preferences.themeMode === 'auto') {
      applyThemeState(preferences);
    }
  }, [preferences, systemThemeMode]);

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
    setAccentColor(accentColor) {
      setPreferences((current) => ({ ...current, accentColor }));
    },
    setPrimaryColor(primaryColor) {
      setPreferences((current) => ({ ...current, primaryColor }));
    },
    setSecondaryColor(secondaryColor) {
      setPreferences((current) => ({ ...current, secondaryColor }));
    },
    setBackgroundImage(backgroundImage) {
      setPreferences((current) => ({ ...current, backgroundImage }));
    },
    setBackgroundBlur(backgroundBlur) {
      setPreferences((current) => ({ ...current, backgroundBlur }));
    },
    setBackgroundOpacity(backgroundOpacity) {
      setPreferences((current) => ({ ...current, backgroundOpacity }));
    },
    resetTheme() {
      setPreferences(normalizeThemeState(DEFAULT_THEME_STATE));
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
