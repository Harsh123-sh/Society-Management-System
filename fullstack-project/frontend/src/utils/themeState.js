const THEME_STORAGE_KEY = 'society_theme_engine_v2';

const DEFAULT_THEME_STATE = {
  selectedSocietyId: '1',
  themeMode: 'light',
  density: 'comfortable',
  layoutMode: 'glass',
  fontFamily: 'Manrope',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#4f46e5',
  secondaryColor: '#2563eb',
  accentColor: '79 70 229',
  themeJson: {
    mode: 'light',
    layout: 'glass',
    density: 'comfortable',
    navigationStyle: 'floating',
    radius: '24px',
  },
};

function safeParse(rawValue) {
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

function hexToRgbString(color) {
  if (!color || typeof color !== 'string') {
    return '79 70 229';
  }

  const value = color.trim();
  if (/^\d+\s+\d+\s+\d+$/.test(value)) {
    return value;
  }

  const hex = value.replace('#', '');
  if (![3, 6].includes(hex.length)) {
    return '79 70 229';
  }

  const normalized = hex.length === 3 ? hex.split('').map((item) => item + item).join('') : hex;
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  if ([red, green, blue].some((item) => Number.isNaN(item))) {
    return '79 70 229';
  }

  return `${red} ${green} ${blue}`;
}

function getPreferredThemeMode() {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_STATE.themeMode;
  }

  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return DEFAULT_THEME_STATE.themeMode;
  }
}

function normalizeThemeState(partialState = {}) {
  const themeMode = partialState.themeMode || partialState.theme || getPreferredThemeMode();
  const density = partialState.density || DEFAULT_THEME_STATE.density;
  const layoutMode = partialState.layoutMode || partialState.layout || DEFAULT_THEME_STATE.layoutMode;
  const accentColor = partialState.accentColor || partialState.accent || DEFAULT_THEME_STATE.accentColor;

  return {
    ...DEFAULT_THEME_STATE,
    ...partialState,
    themeMode,
    density,
    layoutMode,
    accentColor: hexToRgbString(accentColor),
    primaryColor: partialState.primaryColor || DEFAULT_THEME_STATE.primaryColor,
    secondaryColor: partialState.secondaryColor || DEFAULT_THEME_STATE.secondaryColor,
    themeJson: {
      ...DEFAULT_THEME_STATE.themeJson,
      ...(partialState.themeJson || {}),
      mode: themeMode,
      layout: layoutMode,
      density,
    },
  };
}

function readStoredThemeState() {
  if (typeof window === 'undefined') {
    return normalizeThemeState(DEFAULT_THEME_STATE);
  }

  const saved = safeParse(localStorage.getItem(THEME_STORAGE_KEY));
  if (!saved) {
    return normalizeThemeState({ ...DEFAULT_THEME_STATE, themeMode: getPreferredThemeMode() });
  }

  return normalizeThemeState(saved);
}

function writeStoredThemeState(partialState) {
  if (typeof window === 'undefined') {
    return normalizeThemeState(partialState);
  }

  const nextState = normalizeThemeState(partialState);
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(nextState));
  return nextState;
}

function applyThemeState(partialState) {
  if (typeof document === 'undefined') {
    return normalizeThemeState(partialState);
  }

  const nextState = normalizeThemeState(partialState);
  const root = document.documentElement;
  const body = document.body;
  const isDark = nextState.themeMode === 'dark';

  root.style.setProperty('--app-accent-rgb', nextState.accentColor);
  root.style.setProperty('--app-primary-rgb', hexToRgbString(nextState.primaryColor));
  root.style.setProperty('--app-secondary-rgb', hexToRgbString(nextState.secondaryColor));
  root.style.setProperty('--app-bg-rgb', isDark ? '2 6 23' : '248 250 252');
  root.style.setProperty('--app-surface-rgb', isDark ? '15 23 42' : '255 255 255');
  root.style.setProperty('--app-surface-muted-rgb', isDark ? '30 41 59' : '241 245 249');
  root.style.setProperty('--app-border-rgb', isDark ? '51 65 85' : '226 232 240');
  root.style.setProperty('--app-text-rgb', isDark ? '226 232 240' : '15 23 42');
  root.style.setProperty('--app-text-muted-rgb', isDark ? '148 163 184' : '71 85 105');
  root.style.setProperty('--app-card-rgb', isDark ? '15 23 42' : '255 255 255');
  root.style.setProperty('--bg-main', isDark ? '#020617' : '#f8fafc');
  root.style.setProperty('--bg-card', isDark ? '#0f172a' : '#ffffff');
  root.style.setProperty('--bg-sidebar', isDark ? '#020617' : '#ffffff');
  root.style.setProperty('--bg-header', isDark ? '#0f172a' : '#ffffff');
  root.style.setProperty('--text-primary', isDark ? '#f8fafc' : '#0f172a');
  root.style.setProperty('--text-secondary', isDark ? '#cbd5e1' : '#475569');
  root.style.setProperty('--text-muted', isDark ? '#94a3b8' : '#64748b');
  root.style.setProperty('--border-color', isDark ? '#334155' : '#e2e8f0');
  root.style.setProperty('--input-bg', isDark ? '#111827' : '#ffffff');
  root.style.setProperty('--input-border', isDark ? '#334155' : '#e2e8f0');
  root.style.setProperty('--input-placeholder', isDark ? '#94a3b8' : '#64748b');
  root.style.setProperty('--button-bg', isDark ? '#1e293b' : '#ffffff');
  root.style.setProperty('--button-text', isDark ? '#f8fafc' : '#0f172a');
  root.style.setProperty('--hero-bg', isDark ? 'linear-gradient(135deg, #020617, #064e3b)' : 'linear-gradient(135deg, #ffffff, #ecfdf5)');
  root.style.setProperty('--background', isDark ? '#020617' : '#f8fafc');
  root.style.setProperty('--surface', isDark ? '#0f172a' : '#ffffff');
  root.style.setProperty('--border', isDark ? '#334155' : '#e2e8f0');
  root.style.setProperty('--app-font-sans', nextState.fontFamily || 'Manrope');
  root.style.setProperty('--app-layout-mode', nextState.layoutMode || 'glass');
  root.style.setProperty('--app-logo-url', nextState.logoUrl || '');
  root.style.setProperty('--app-radius', nextState.themeJson?.radius || '24px');
  root.style.colorScheme = nextState.themeMode;

  root.dataset.theme = nextState.themeMode;
  root.dataset.density = nextState.density;
  root.dataset.layout = nextState.layoutMode;
  root.classList.toggle('dark', isDark);
  root.classList.toggle('light', !isDark);

  if (body) {
    body.dataset.theme = nextState.themeMode;
    body.dataset.density = nextState.density;
    body.dataset.layout = nextState.layoutMode;
    body.classList.toggle('dark', isDark);
    body.classList.toggle('light', !isDark);
    body.style.colorScheme = nextState.themeMode;
  }

  return nextState;
}

export {
  THEME_STORAGE_KEY,
  DEFAULT_THEME_STATE,
  applyThemeState,
  hexToRgbString,
  normalizeThemeState,
  readStoredThemeState,
  writeStoredThemeState,
};