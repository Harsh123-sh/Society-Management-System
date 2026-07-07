const THEME_STORAGE_KEY = 'society_theme_engine_v2';

const DEFAULT_THEME_STATE = {
  selectedSocietyId: '1',
  themeMode: 'auto',
  density: 'comfortable',
  layoutMode: 'glass',
  fontFamily: 'Manrope',
  logoUrl: '/nexora-logo.png',
  faviconUrl: '/nexora-favicon.png',
  primaryColor: '#4f46e5',
  secondaryColor: '#2563eb',
  accentColor: '79 70 229',
  backgroundImage: '',
  backgroundBlur: 0,
  backgroundOpacity: 0.14,
  themeJson: {
    mode: 'auto',
    layout: 'glass',
    density: 'comfortable',
    navigationStyle: 'floating',
    radius: '24px',
    autoContrast: true,
  },
};

const LIGHT_THEME_TOKENS = {
  appBg: '#f6f8fc',
  pageBg: '#f6f8fc',
  surface: '#ffffff',
  surfaceSoft: '#f1f5f9',
  cardBg: 'rgba(255, 255, 255, 0.88)',
  heroBg: 'linear-gradient(135deg, #ffffff, #f1f5f9)',
  sidebarBg: '#ffffff',
  navbarBg: '#ffffff',
  textMain: '#0b1220',
  textSecondary: '#334155',
  textMuted: '#475569',
  border: 'rgba(15, 23, 42, 0.12)',
  inputBg: '#ffffff',
  inputText: '#0b1220',
  modalBg: '#ffffff',
  tableBg: '#ffffff',
  tableHeaderBg: '#f1f5f9',
  buttonPrimaryBg: '#4f46e5',
  buttonPrimaryText: '#ffffff',
  shadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
};

const DARK_THEME_TOKENS = {
  appBg: '#020617',
  pageBg: '#020617',
  surface: '#0b1220',
  surfaceSoft: '#1e293b',
  cardBg: 'rgba(15, 23, 42, 0.86)',
  heroBg: 'linear-gradient(135deg, #020617, #0f766e)',
  sidebarBg: '#0b1220',
  navbarBg: '#0f172a',
  textMain: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  border: 'rgba(148, 163, 184, 0.18)',
  inputBg: '#1e293b',
  inputText: '#f8fafc',
  modalBg: '#0f172a',
  tableBg: '#0f172a',
  tableHeaderBg: '#1e293b',
  buttonPrimaryBg: '#6366f1',
  buttonPrimaryText: '#ffffff',
  shadow: '0 12px 30px rgba(0, 0, 0, 0.35)',
};

function applyThemeTokens(root, tokens) {
  root.style.setProperty('--app-bg', tokens.appBg);
  root.style.setProperty('--page-bg', tokens.pageBg);
  root.style.setProperty('--surface', tokens.surface);
  root.style.setProperty('--surface-soft', tokens.surfaceSoft);
  root.style.setProperty('--card-bg', tokens.cardBg);
  root.style.setProperty('--hero-bg', tokens.heroBg);
  root.style.setProperty('--sidebar-bg', tokens.sidebarBg);
  root.style.setProperty('--navbar-bg', tokens.navbarBg);
  root.style.setProperty('--text-main', tokens.textMain);
  root.style.setProperty('--text-secondary', tokens.textSecondary);
  root.style.setProperty('--text-muted', tokens.textMuted);
  root.style.setProperty('--border', tokens.border);
  root.style.setProperty('--input-bg', tokens.inputBg);
  root.style.setProperty('--input-text', tokens.inputText);
  root.style.setProperty('--modal-bg', tokens.modalBg);
  root.style.setProperty('--table-bg', tokens.tableBg);
  root.style.setProperty('--table-header-bg', tokens.tableHeaderBg);
  root.style.setProperty('--button-primary-bg', tokens.buttonPrimaryBg);
  root.style.setProperty('--button-primary-text', tokens.buttonPrimaryText);
  root.style.setProperty('--shadow', tokens.shadow);
}

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
    return DEFAULT_THEME_STATE.themeMode === 'auto' ? 'light' : DEFAULT_THEME_STATE.themeMode;
  }

  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return DEFAULT_THEME_STATE.themeMode === 'auto' ? 'light' : DEFAULT_THEME_STATE.themeMode;
  }
}

function normalizeThemeState(partialState = {}) {
  const rawThemeMode = partialState.themeMode || partialState.theme || DEFAULT_THEME_STATE.themeMode;
  const themeMode = rawThemeMode === 'dark' || rawThemeMode === 'auto' ? rawThemeMode : 'light';
  const density = partialState.density || DEFAULT_THEME_STATE.density;
  const layoutMode = partialState.layoutMode || partialState.layout || DEFAULT_THEME_STATE.layoutMode;
  const accentColor = partialState.accentColor || partialState.accent || DEFAULT_THEME_STATE.accentColor;
  const backgroundBlur = Number.isFinite(Number(partialState.backgroundBlur))
    ? Number(partialState.backgroundBlur)
    : DEFAULT_THEME_STATE.backgroundBlur;
  const backgroundOpacity = Number.isFinite(Number(partialState.backgroundOpacity))
    ? Math.min(Math.max(Number(partialState.backgroundOpacity), 0), 0.9)
    : DEFAULT_THEME_STATE.backgroundOpacity;

  return {
    ...DEFAULT_THEME_STATE,
    ...partialState,
    themeMode,
    density,
    layoutMode,
    accentColor: hexToRgbString(accentColor),
    backgroundImage: partialState.backgroundImage || DEFAULT_THEME_STATE.backgroundImage,
    backgroundBlur,
    backgroundOpacity,
    primaryColor: partialState.primaryColor || DEFAULT_THEME_STATE.primaryColor,
    secondaryColor: partialState.secondaryColor || DEFAULT_THEME_STATE.secondaryColor,
    themeJson: {
      ...DEFAULT_THEME_STATE.themeJson,
      ...(partialState.themeJson || {}),
      mode: themeMode,
      layout: layoutMode,
      density,
      autoContrast: partialState.themeJson?.autoContrast ?? DEFAULT_THEME_STATE.themeJson.autoContrast,
    },
  };
}

function readStoredThemeState() {
  if (typeof window === 'undefined') {
    return normalizeThemeState(DEFAULT_THEME_STATE);
  }

  const saved = safeParse(localStorage.getItem(THEME_STORAGE_KEY));
  if (!saved) {
    return normalizeThemeState(DEFAULT_THEME_STATE);
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

function getEffectiveThemeMode(themeMode) {
  if (themeMode === 'auto') {
    return getPreferredThemeMode();
  }
  return themeMode === 'dark' ? 'dark' : 'light';
}

function getContrastColor(rgbString) {
  const parts = String(rgbString).split(' ').map((value) => Number.parseInt(value, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return '#ffffff';
  }

  const [r, g, b] = parts;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#0f172a' : '#ffffff';
}

function applyThemeState(partialState) {
  if (typeof document === 'undefined') {
    return normalizeThemeState(partialState);
  }

  const nextState = normalizeThemeState(partialState);
  const root = document.documentElement;
  const body = document.body;
  const effectiveThemeMode = getEffectiveThemeMode(nextState.themeMode);
  const isDark = effectiveThemeMode === 'dark';
  const tokens = isDark ? DARK_THEME_TOKENS : LIGHT_THEME_TOKENS;

  applyThemeTokens(root, tokens);

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
  root.style.setProperty('--bg-primary', tokens.pageBg);
  root.style.setProperty('--bg-secondary', tokens.surface);
  root.style.setProperty('--bg-card', tokens.cardBg);
  root.style.setProperty('--bg-main', tokens.appBg);
  root.style.setProperty('--bg-sidebar', tokens.sidebarBg);
  root.style.setProperty('--bg-header', tokens.navbarBg);
  root.style.setProperty('--text-primary', tokens.textMain);
  root.style.setProperty('--text', tokens.textMain);
  root.style.setProperty('--text-secondary', tokens.textSecondary);
  root.style.setProperty('--text-muted', tokens.textMuted);
  root.style.setProperty('--border-color', tokens.border);
  root.style.setProperty('--input-border', isDark ? '#334155' : '#e2e8f0');
  root.style.setProperty('--input-placeholder', isDark ? '#94a3b8' : '#64748b');
  root.style.setProperty('--button-bg', tokens.buttonPrimaryBg);
  root.style.setProperty('--button-text', tokens.buttonPrimaryText);
  root.style.setProperty('--primary', tokens.buttonPrimaryBg);
  root.style.setProperty('--surface-muted', tokens.surfaceSoft);
  root.style.setProperty('--sidebar-card', tokens.cardBg);
  root.style.setProperty('--sidebar-text', isDark ? '#e5edf7' : '#0b1220');
  root.style.setProperty('--sidebar-text-muted', isDark ? '#cbd5e1' : '#334155');
  root.style.setProperty('--sidebar-icon', isDark ? '#d8d9ff' : '#4f46e5');
  root.style.setProperty('--active', 'linear-gradient(135deg, #6d5ef6 0%, #2563eb 100%)');
  root.style.setProperty('--active-text', '#ffffff');
  root.style.setProperty('--accent', isDark ? '#8b5cf6' : '#6d5ef6');
  root.style.setProperty('--text-disabled', isDark ? '#64748b' : '#94a3b8');
  root.style.setProperty('--table-row-bg', tokens.tableBg);
  root.style.setProperty('--shadow-color', isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(15, 23, 42, 0.10)');
  root.style.setProperty('--background', tokens.appBg);
  root.style.setProperty('--card', tokens.cardBg);
  root.style.setProperty('--app-font-sans', nextState.fontFamily || 'Manrope');
  root.style.setProperty('--app-layout-mode', nextState.layoutMode || 'glass');
  root.style.setProperty('--app-logo-url', nextState.logoUrl || '');
  root.style.setProperty('--app-radius', nextState.themeJson?.radius || '24px');
  root.style.setProperty('--brand-rgb', nextState.accentColor);
  root.style.setProperty('--hero-start', nextState.primaryColor);
  root.style.setProperty('--hero-end', nextState.secondaryColor);
  root.style.setProperty('--app-background-image', nextState.backgroundImage ? `url('${nextState.backgroundImage}')` : 'none');
  root.style.setProperty('--app-background-blur', `${nextState.backgroundBlur}px`);
  root.style.setProperty('--app-background-opacity', `${nextState.backgroundOpacity}`);
  root.style.setProperty(
    '--app-background-overlay',
    nextState.backgroundImage ? `rgba(15, 23, 42, ${nextState.backgroundOpacity})` : 'transparent'
  );
  root.style.setProperty('--app-foreground-contrast', getContrastColor(nextState.accentColor));
  root.style.colorScheme = effectiveThemeMode;

  root.dataset.theme = effectiveThemeMode;
  root.dataset.themeMode = nextState.themeMode;
  root.dataset.density = nextState.density;
  root.dataset.layout = nextState.layoutMode;
  root.classList.toggle('dark', isDark);
  root.classList.toggle('light', !isDark);

  if (body) {
    body.dataset.theme = effectiveThemeMode;
    body.dataset.themeMode = nextState.themeMode;
    body.dataset.density = nextState.density;
    body.dataset.layout = nextState.layoutMode;
    body.classList.toggle('dark', isDark);
    body.classList.toggle('light', !isDark);
    body.style.colorScheme = effectiveThemeMode;
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
