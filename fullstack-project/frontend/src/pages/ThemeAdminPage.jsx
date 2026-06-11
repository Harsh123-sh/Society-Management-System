import { useEffect, useMemo, useState } from 'react';
import { getApiMessage } from '../services/authApi';
import { fetchThemeCatalog, generateTheme, updateTheme } from '../services/themeApi';
import { useThemeEngine } from '../contexts/ThemeContext';

const fontOptions = ['Manrope', 'Space Grotesk', 'Inter', 'Poppins', 'DM Sans'];
const paletteOptions = [
  { label: 'Teal', value: 'teal' },
  { label: 'Blue', value: 'blue' },
  { label: 'Emerald', value: 'emerald' },
  { label: 'Amber', value: 'amber' },
  { label: 'Slate', value: 'slate' },
];

function ThemeAdminPage() {
  const {
    catalog,
    setThemeMode,
    setDensity,
    setLayoutMode,
    setFontFamily,
    setAccentColor,
    setPrimaryColor,
    setSecondaryColor,
    setBackgroundImage,
    setBackgroundBlur,
    setBackgroundOpacity,
    setBranding,
    resetTheme,
    saveThemeToBackend,
    generateThemePack,
    selectedSociety,
  } = useThemeEngine();
  const [societies, setSocieties] = useState([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [themeDraft, setThemeDraft] = useState({
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#0f766e',
    secondaryColor: '#2563eb',
    accentColor: '#14b8a6',
    backgroundImage: '',
    backgroundBlur: 0,
    backgroundOpacity: 0.14,
    fontFamily: 'Manrope',
    theme: {
      mode: 'dark',
      density: 'comfortable',
      layout: 'glass',
      navigationStyle: 'floating',
      radius: '24px',
      heroGradient: ['#0f766e', '#2563eb'],
      background: '#020617',
    },
  });

  useEffect(() => {
    async function loadThemes() {
      try {
        setLoading(true);
        const response = await fetchThemeCatalog();
        const rows = Array.isArray(response?.data) ? response.data : [];
        setSocieties(rows);
        if (!selectedSocietyId && rows.length) {
          setSelectedSocietyId(String(rows[0].id));
        }
      } catch (error) {
        setMessage(getApiMessage(error, 'Failed to load theme catalog'));
      } finally {
        setLoading(false);
      }
    }

    loadThemes();
  }, []);

  useEffect(() => {
    const society = societies.find((item) => String(item.id) === String(selectedSocietyId));
    if (!society) {
      return;
    }

    setThemeDraft((current) => ({
      ...current,
      primaryColor: society.primary_color || current.primaryColor,
      secondaryColor: society.secondary_color || current.secondaryColor,
      accentColor: society.accent_color || current.accentColor,
    }));
  }, [selectedSocietyId, societies]);

  const stats = useMemo(() => [
    { label: 'Societies', value: societies.length },
    { label: 'Selected', value: selectedSociety?.name || 'Current society' },
    { label: 'Theme mode', value: themeDraft.theme.mode },
  ], [societies.length, selectedSociety?.name, themeDraft.theme.mode]);

  async function handleSave() {
    if (!selectedSocietyId) {
      return;
    }

    try {
      setSaving(true);
      const response = await saveThemeToBackend(selectedSocietyId, {
        logoUrl: themeDraft.logoUrl || null,
        faviconUrl: themeDraft.faviconUrl || null,
        primaryColor: themeDraft.primaryColor,
        secondaryColor: themeDraft.secondaryColor,
        accentColor: themeDraft.accentColor,
        fontFamily: themeDraft.fontFamily,
        theme: themeDraft.theme,
      });

      setBranding({
        logoUrl: themeDraft.logoUrl,
        faviconUrl: themeDraft.faviconUrl,
        primaryColor: themeDraft.primaryColor,
        secondaryColor: themeDraft.secondaryColor,
        accentColor: themeDraft.accentColor,
        backgroundImage: themeDraft.backgroundImage,
        backgroundBlur: themeDraft.backgroundBlur,
        backgroundOpacity: themeDraft.backgroundOpacity,
        fontFamily: themeDraft.fontFamily,
        themeJson: themeDraft.theme,
      });

      setMessage(response?.message || 'Theme saved');
    } catch (error) {
      setMessage(getApiMessage(error, 'Failed to save theme'));
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    try {
      setSaving(true);
      const result = await generateThemePack({
        societyName: societies.find((item) => String(item.id) === String(selectedSocietyId))?.name || 'Society',
        palette: 'teal',
        mode: themeDraft.theme.mode,
        layout: themeDraft.theme.layout,
        fontFamily: themeDraft.fontFamily,
        prompt: 'Create a polished multi-society admin theme with brand confidence and clear hierarchy.',
      });

      const branding = result?.branding || result;
      if (branding) {
        setThemeDraft((current) => ({
          ...current,
          logoUrl: branding.logoUrl || current.logoUrl,
          faviconUrl: branding.faviconUrl || current.faviconUrl,
          primaryColor: branding.primaryColor || current.primaryColor,
          secondaryColor: branding.secondaryColor || current.secondaryColor,
          accentColor: branding.accentColor || current.accentColor,
          fontFamily: branding.fontFamily || current.fontFamily,
          theme: { ...current.theme, ...(branding.theme || {}) },
        }));
      }

      setMessage('AI theme generated');
    } catch (error) {
      setMessage(getApiMessage(error, 'Failed to generate theme'));
    } finally {
      setSaving(false);
    }
  }

  const currentSociety = societies.find((item) => String(item.id) === String(selectedSocietyId));

  return (
    <div className="chairman-page space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-[var(--page-bg)] via-[var(--surface-soft)] to-teal-800 p-6 text-[var(--text-main)] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">Theme admin panel</p>
        <div className="chairman-page mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Multi-society theme engine</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
              Control colors, logos, fonts, layouts, density, and AI-generated branding packs from a single admin surface.
            </p>
          </div>
          <div className="chairman-page grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-[var(--text-main)]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="chairman-page grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className="chairman-page rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="chairman-page flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Society selection</h2>
                <p className="text-sm text-slate-500">Apply a theme pack to a specific society.</p>
              </div>
              <select
                value={selectedSocietyId}
                onChange={(event) => setSelectedSocietyId(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none"
              >
                {societies.map((society) => (
                  <option key={society.id} value={String(society.id)}>{society.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="chairman-page rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Branding</h2>
              <p className="text-sm text-slate-500">Colors, logo, fonts, and theme mood.</p>
            </div>

            <div className="chairman-page mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Logo URL</span>
                <input
                  type="text"
                  value={themeDraft.logoUrl}
                  onChange={(event) => setThemeDraft((current) => ({ ...current, logoUrl: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                  placeholder="https://cdn.example.com/logo.svg"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Favicon URL</span>
                <input
                  type="text"
                  value={themeDraft.faviconUrl}
                  onChange={(event) => setThemeDraft((current) => ({ ...current, faviconUrl: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Primary color</span>
                <input
                  type="color"
                  value={themeDraft.primaryColor}
                  onChange={(event) => {
                    const value = event.target.value;
                    setThemeDraft((current) => ({ ...current, primaryColor: value }));
                    setPrimaryColor(value);
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-2 py-1"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Secondary color</span>
                <input
                  type="color"
                  value={themeDraft.secondaryColor}
                  onChange={(event) => {
                    const value = event.target.value;
                    setThemeDraft((current) => ({ ...current, secondaryColor: value }));
                    setSecondaryColor(value);
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-2 py-1"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Accent color</span>
                <input
                  type="color"
                  value={themeDraft.accentColor}
                  onChange={(event) => {
                    const value = event.target.value;
                    setThemeDraft((current) => ({ ...current, accentColor: value }));
                    setAccentColor(value);
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-2 py-1"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Background image URL</span>
                <input
                  type="text"
                  value={themeDraft.backgroundImage}
                  onChange={(event) => {
                    const value = event.target.value;
                    setThemeDraft((current) => ({ ...current, backgroundImage: value }));
                    setBackgroundImage(value);
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                  placeholder="https://cdn.example.com/background.jpg"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Background blur</span>
                <input
                  type="range"
                  min="0"
                  max="48"
                  value={themeDraft.backgroundBlur}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setThemeDraft((current) => ({ ...current, backgroundBlur: value }));
                    setBackgroundBlur(value);
                  }}
                  className="w-full"
                />
                <div className="chairman-page text-sm text-slate-500">{themeDraft.backgroundBlur}px</div>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Background opacity</span>
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.02"
                  value={themeDraft.backgroundOpacity}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setThemeDraft((current) => ({ ...current, backgroundOpacity: value }));
                    setBackgroundOpacity(value);
                  }}
                  className="w-full"
                />
                <div className="chairman-page text-sm text-slate-500">{themeDraft.backgroundOpacity}</div>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Font family</span>
                <select
                  value={themeDraft.fontFamily}
                  onChange={(event) => {
                    const value = event.target.value;
                    setThemeDraft((current) => ({ ...current, fontFamily: value }));
                    setFontFamily(value);
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                >
                  {fontOptions.map((font) => <option key={font} value={font}>{font}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="chairman-page rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-950">Layout and mode</h2>
            <div className="chairman-page mt-5 grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Mode</span>
                <select
                  value={themeDraft.theme.mode}
                  onChange={(event) => {
                    const value = event.target.value;
                    setThemeDraft((current) => ({ ...current, theme: { ...current.theme, mode: value } }));
                    setThemeMode(value);
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Density</span>
                <select
                  value={themeDraft.theme.density}
                  onChange={(event) => {
                    const value = event.target.value;
                    setThemeDraft((current) => ({ ...current, theme: { ...current.theme, density: value } }));
                    setDensity(value);
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Layout</span>
                <select
                  value={themeDraft.theme.layout}
                  onChange={(event) => {
                    const value = event.target.value;
                    setThemeDraft((current) => ({ ...current, theme: { ...current.theme, layout: value } }));
                    setLayoutMode(value);
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none"
                >
                  <option value="glass">Glass</option>
                  <option value="clean">Clean</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="chairman-page rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-950">Live preview</h2>
            <p className="text-sm text-slate-500">Preview the selected society tokens before saving.</p>

            <div
              className="mt-5 overflow-hidden rounded-3xl p-5 text-[var(--text-main)]"
              style={{
                backgroundImage: themeDraft.backgroundImage
                  ? `linear-gradient(rgba(15,23,42,0.55), rgba(15,23,42,0.55)), url('${themeDraft.backgroundImage}')`
                  : `linear-gradient(135deg, ${themeDraft.primaryColor}, ${themeDraft.secondaryColor})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
                backdropFilter: themeDraft.backgroundBlur ? `blur(${themeDraft.backgroundBlur}px)` : 'none',
              }}
            >
              <div className="chairman-page rounded-3xl bg-slate-950/10 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-secondary)]">{currentSociety?.name || 'Society preview'}</p>
                <h3 className="mt-3 text-2xl font-semibold">{themeDraft.theme.mode === 'dark' ? 'Dark' : 'Light'} theme</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Dynamic colors, logo, font, and layout controls applied live.</p>
                <div className="chairman-page mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{themeDraft.fontFamily}</span>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{themeDraft.theme.layout}</span>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{themeDraft.theme.density}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="chairman-page rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-950">Theme actions</h2>
            <p className="text-sm text-slate-500">Persist to society branding or generate a new AI theme pack.</p>
            <div className="chairman-page mt-5 flex flex-col gap-3">
              <button type="button" onClick={handleGenerate} disabled={saving || loading} className="rounded-2xl theme-page px-4 py-3 text-sm font-semibold text-[var(--text-main)] disabled:opacity-50">
                AI generate theme
              </button>
              <button type="button" onClick={handleSave} disabled={saving || loading} className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-900 disabled:opacity-50">
                Save theme to society
              </button>
              <button type="button" onClick={() => {
                resetTheme();
                setThemeDraft((current) => ({
                  ...current,
                  logoUrl: '',
                  faviconUrl: '',
                  primaryColor: '#0f766e',
                  secondaryColor: '#2563eb',
                  accentColor: '#14b8a6',
                  backgroundImage: '',
                  backgroundBlur: 0,
                  backgroundOpacity: 0.14,
                  fontFamily: 'Manrope',
                  theme: {
                    mode: 'dark',
                    density: 'comfortable',
                    layout: 'glass',
                    navigationStyle: 'floating',
                    radius: '24px',
                    heroGradient: ['#0f766e', '#2563eb'],
                    background: '#020617',
                  },
                }));
              }} disabled={saving || loading} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 disabled:opacity-50">
                Reset theme
              </button>
            </div>
            {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default ThemeAdminPage;
