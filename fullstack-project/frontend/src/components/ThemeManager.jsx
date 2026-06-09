import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import DesignTokens, { colorUtils } from '../styles/designTokens';
import { getApiBaseUrl } from '../services/runtimeUrls';

const ThemeManager = ({ societyId }) => {
  const { theme, updateTheme, applyPreset } = useTheme();
  const [formData, setFormData] = useState({});
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [accessibility, setAccessibility] = useState(null);
  const [activeTab, setActiveTab] = useState('colors');

  useEffect(() => {
    if (theme) {
      setFormData({
        theme_primary: theme.theme_primary,
        theme_secondary: theme.theme_secondary,
        theme_accent: theme.theme_accent,
        theme_mode: theme.theme_mode,
        font_family: theme.font_family,
        sidebar_style: theme.sidebar_style,
        button_style: theme.button_style,
        accent_radius: theme.accent_radius,
        brand_name: theme.brand_name,
      });
    }
    fetchPresets();
  }, [theme]);

  const fetchPresets = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/themes/presets/list`);
      const data = await response.json();
      setPresets(data.data);
    } catch (error) {
      console.error('Failed to fetch presets:', error);
    }
  };

  const handleColorChange = async (colorKey, value) => {
    setFormData(prev => ({
      ...prev,
      [colorKey]: value
    }));

    // Validate accessibility
    if (colorKey.includes('primary') || colorKey.includes('accent')) {
      validateAccessibility({
        ...formData,
        [colorKey]: value
      });
    }
  };

  const validateAccessibility = async (colors) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/themes/validate/accessibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary: colors.theme_primary,
          secondary: colors.theme_secondary,
          accent: colors.theme_accent
        })
      });
      const data = await response.json();
      setAccessibility(data.data);
    } catch (error) {
      console.error('Accessibility validation failed:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateTheme(formData);
      alert('Theme updated successfully!');
    } catch (error) {
      alert('Failed to update theme: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetApply = async (presetId) => {
    setLoading(true);
    try {
      const preset = presets.find(p => p.id === presetId);
      if (preset) {
        setFormData(prev => ({
          ...prev,
          theme_primary: preset.theme_primary,
          theme_secondary: preset.theme_secondary,
          theme_accent: preset.theme_accent,
          theme_mode: preset.theme_mode,
        }));
      }
      await applyPreset(presetId);
      alert('Preset applied successfully!');
    } catch (error) {
      alert('Failed to apply preset: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-neutral-50 dark:theme-surface rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-neutral-900 dark:text-[var(--text-main)]">
        Theme Customization
      </h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-neutral-200 dark:border-neutral-700">
        {['colors', 'typography', 'layout', 'presets'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-primary text-primary'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Colors Tab */}
      {activeTab === 'colors' && (
        <div className="space-y-6">
          {/* Color Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary Color */}
            <div className="card">
              <label className="block text-sm font-medium mb-2">Primary Color</label>
              <input
                type="color"
                value={formData.theme_primary}
                onChange={(e) => handleColorChange('theme_primary', e.target.value)}
                className="w-full h-20 rounded cursor-pointer"
              />
              <code className="text-xs text-neutral-500 mt-2 block">
                {formData.theme_primary}
              </code>
            </div>

            {/* Secondary Color */}
            <div className="card">
              <label className="block text-sm font-medium mb-2">Secondary Color</label>
              <input
                type="color"
                value={formData.theme_secondary}
                onChange={(e) => handleColorChange('theme_secondary', e.target.value)}
                className="w-full h-20 rounded cursor-pointer"
              />
              <code className="text-xs text-neutral-500 mt-2 block">
                {formData.theme_secondary}
              </code>
            </div>

            {/* Accent Color */}
            <div className="card">
              <label className="block text-sm font-medium mb-2">Accent Color</label>
              <input
                type="color"
                value={formData.theme_accent}
                onChange={(e) => handleColorChange('theme_accent', e.target.value)}
                className="w-full h-20 rounded cursor-pointer"
              />
              <code className="text-xs text-neutral-500 mt-2 block">
                {formData.theme_accent}
              </code>
            </div>
          </div>

          {/* Color Preview */}
          <div className="card space-y-4">
            <h3 className="font-semibold">Color Preview</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div
                className="h-32 rounded-lg shadow-md flex items-center justify-center text-[var(--text-main)] font-semibold"
                style={{ backgroundColor: formData.theme_primary }}
              >
                Primary
              </div>
              <div
                className="h-32 rounded-lg shadow-md flex items-center justify-center text-[var(--text-main)] font-semibold"
                style={{ backgroundColor: formData.theme_secondary }}
              >
                Secondary
              </div>
              <div
                className="h-32 rounded-lg shadow-md flex items-center justify-center text-[var(--text-main)] font-semibold"
                style={{ backgroundColor: formData.theme_accent }}
              >
                Accent
              </div>
              <div
                className="h-32 rounded-lg shadow-md flex items-center justify-center font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${formData.theme_primary} 0%, ${formData.theme_accent} 100%)`,
                  color: 'white'
                }}
              >
                Gradient
              </div>
            </div>
          </div>

          {/* Accessibility Check */}
          {accessibility && (
            <div className={`card ${accessibility.isAccessible ? 'border-l-4 border-green-500' : 'border-l-4 border-yellow-500'}`}>
              <h3 className="font-semibold mb-2">
                {accessibility.isAccessible ? '✓ Accessibility Compliant' : '⚠ Accessibility Issues'}
              </h3>
              {accessibility.issues.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {accessibility.issues.map((issue, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="text-yellow-600">•</span>
                      {issue.message}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <strong>Primary Contrast:</strong> {accessibility.scores.primaryContrast}
                </div>
                <div>
                  <strong>Accent Contrast:</strong> {accessibility.scores.accentContrast}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Typography Tab */}
      {activeTab === 'typography' && (
        <div className="space-y-4">
          <div className="card">
            <label className="block text-sm font-medium mb-2">Font Family</label>
            <select
              value={formData.font_family}
              onChange={(e) => setFormData(prev => ({ ...prev, font_family: e.target.value }))}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md"
            >
              <option value="Inter">Inter</option>
              <option value="Poppins">Poppins</option>
              <option value="Manrope">Manrope</option>
              <option value="Space Grotesk">Space Grotesk</option>
              <option value="Playfair Display">Playfair Display</option>
            </select>
          </div>
        </div>
      )}

      {/* Layout Tab */}
      {activeTab === 'layout' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Theme Mode */}
            <div className="card">
              <label className="block text-sm font-medium mb-2">Theme Mode</label>
              <select
                value={formData.theme_mode}
                onChange={(e) => setFormData(prev => ({ ...prev, theme_mode: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              >
                <option value="auto">Auto (System)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            {/* Sidebar Style */}
            <div className="card">
              <label className="block text-sm font-medium mb-2">Sidebar Style</label>
              <select
                value={formData.sidebar_style}
                onChange={(e) => setFormData(prev => ({ ...prev, sidebar_style: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              >
                <option value="default">Default</option>
                <option value="minimal">Minimal</option>
                <option value="compact">Compact</option>
              </select>
            </div>

            {/* Button Style */}
            <div className="card">
              <label className="block text-sm font-medium mb-2">Button Style</label>
              <select
                value={formData.button_style}
                onChange={(e) => setFormData(prev => ({ ...prev, button_style: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              >
                <option value="rounded">Rounded</option>
                <option value="square">Square</option>
                <option value="pill">Pill</option>
              </select>
            </div>

            {/* Border Radius */}
            <div className="card">
              <label className="block text-sm font-medium mb-2">Border Radius</label>
              <select
                value={formData.accent_radius}
                onChange={(e) => setFormData(prev => ({ ...prev, accent_radius: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>

          {/* Brand Name */}
          <div className="card">
            <label className="block text-sm font-medium mb-2">Brand Name</label>
            <input
              type="text"
              value={formData.brand_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
              placeholder="Enter your society's brand name"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md"
            />
          </div>
        </div>
      )}

      {/* Presets Tab */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presets.map(preset => (
            <div
              key={preset.id}
              className="card cursor-pointer hover:shadow-lg transition-all"
              onClick={() => handlePresetApply(preset.id)}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{preset.preview}</span>
                <div>
                  <h3 className="font-semibold">{preset.name}</h3>
                  <p className="text-xs text-neutral-500">{preset.description}</p>
                </div>
              </div>
              <div className="flex gap-1 mt-3">
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: preset.theme_primary }}
                  title="Primary"
                />
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: preset.theme_secondary }}
                  title="Secondary"
                />
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: preset.theme_accent }}
                  title="Accent"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Button */}
      <div className="mt-8 flex gap-3 justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn-theme px-6 py-3 font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default ThemeManager;
