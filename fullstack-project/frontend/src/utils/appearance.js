import { applyThemeState, readStoredThemeState, writeStoredThemeState } from './themeState';

const DEFAULT_APPEARANCE = {
  accent: '79 70 229',
  surface: '255 255 255',
  theme: 'auto',
  density: 'comfortable',
};

function getPreferredThemeThemeMode() {
  if (typeof window === 'undefined') return 'light';

  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function toAppearanceSettings(state) {
  const nextState = state || readStoredThemeState();
  const themeMode = nextState.themeMode === 'auto' ? getPreferredThemeThemeMode() : nextState.themeMode;

  return {
    accent: nextState.accentColor || DEFAULT_APPEARANCE.accent,
    surface: themeMode === 'dark' ? '15 23 42' : '255 255 255',
    theme: nextState.themeMode || DEFAULT_APPEARANCE.theme,
    density: nextState.density || DEFAULT_APPEARANCE.density,
  };
}

export function getAppearanceSettings() {
  if (typeof window === 'undefined') return DEFAULT_APPEARANCE;
  return toAppearanceSettings(readStoredThemeState());
}

export function applyAppearanceSettings(settings = getAppearanceSettings()) {
  const nextState = applyThemeState({
    ...readStoredThemeState(),
    accentColor: settings.accent || settings.accentColor,
    themeMode: settings.theme || settings.themeMode,
    density: settings.density,
  });

  return toAppearanceSettings(nextState);
}

export function saveAppearanceSettings(partialSettings) {
  if (typeof window === 'undefined') return DEFAULT_APPEARANCE;

  const nextState = writeStoredThemeState({
    ...readStoredThemeState(),
    accentColor: partialSettings.accent || partialSettings.accentColor,
    themeMode: partialSettings.theme || partialSettings.themeMode,
    density: partialSettings.density,
  });

  applyThemeState(nextState);
  return toAppearanceSettings(nextState);
}
