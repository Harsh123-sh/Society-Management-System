const tenantModel = require("../models/tenantModel");
const aiService = require("../services/aiAssistantService");

function buildFallbackTheme({ name = "Society", mood = "modern", palette = "teal", mode = "dark" }) {
  const paletteMap = {
    teal: { primaryColor: "#0f766e", secondaryColor: "#2563eb", accentColor: "#14b8a6" },
    blue: { primaryColor: "#1d4ed8", secondaryColor: "#7c3aed", accentColor: "#38bdf8" },
    emerald: { primaryColor: "#166534", secondaryColor: "#0ea5e9", accentColor: "#34d399" },
    amber: { primaryColor: "#b45309", secondaryColor: "#dc2626", accentColor: "#f59e0b" },
    slate: { primaryColor: "#334155", secondaryColor: "#0f172a", accentColor: "#64748b" },
  };

  const selectedPalette = paletteMap[palette] || paletteMap.teal;
  return {
    title: `${name} ${mood} theme`,
    branding: {
      primaryColor: selectedPalette.primaryColor,
      secondaryColor: selectedPalette.secondaryColor,
      accentColor: selectedPalette.accentColor,
      fontFamily: mode === "light" ? "Manrope" : "Space Grotesk",
      logoUrl: null,
      faviconUrl: null,
      theme: {
        mode,
        density: mode === "light" ? "comfortable" : "compact",
        layout: mode === "light" ? "balanced" : "glass",
        heroGradient: [selectedPalette.primaryColor, selectedPalette.secondaryColor],
        navigationStyle: mode === "light" ? "clean" : "floating",
        radius: mode === "light" ? "18px" : "24px",
        background: mode === "light" ? "#f8fafc" : "#020617",
      },
    },
  };
}

function parseJsonMaybe(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(String(value).replace(/^```json\s*/i, "").replace(/```$/i, "").trim());
  } catch (_error) {
    return fallback;
  }
}

async function listThemes(req, res) {
  try {
    const societies = await tenantModel.listTenantSummaries();
    return res.json({ success: true, data: societies });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to fetch themes" });
  }
}

async function getCurrentTheme(req, res) {
  try {
    const societyId = req.tenant?.society?.id || req.user?.societyId || null;
    if (!societyId) {
      return res.status(404).json({ success: false, message: "Theme context not found" });
    }

    const theme = await tenantModel.getTenantContextBySocietyId(societyId);
    return res.json({ success: true, data: theme });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to fetch current theme" });
  }
}

async function updateTheme(req, res) {
  try {
    const societyId = Number(req.params.id || req.user?.societyId || req.tenant?.society?.id);
    if (!societyId) {
      return res.status(400).json({ success: false, message: "society id is required" });
    }

    const branding = req.body || {};
    await tenantModel.updateTenantBranding(societyId, {
      logoUrl: branding.logoUrl,
      faviconUrl: branding.faviconUrl,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      accentColor: branding.accentColor,
      fontFamily: branding.fontFamily,
      theme: branding.theme || branding.themeJson,
    });

    const updated = await tenantModel.getTenantContextBySocietyId(societyId);
    return res.json({ success: true, message: "Theme updated", data: updated });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to update theme" });
  }
}

async function generateTheme(req, res) {
  try {
    const {
      societyName = "Society",
      vibe = "modern",
      palette = "teal",
      mode = "dark",
      layout = "glass",
      fontFamily = "",
      logoUrl = null,
      faviconUrl = null,
      prompt = "",
    } = req.body || {};

    const fallback = buildFallbackTheme({ name: societyName, mood: vibe, palette, mode });

    if (!aiService.hasOpenAi()) {
      return res.json({ success: true, data: fallback });
    }

    const query = [
      "Generate a JSON theme pack for a multi-society management platform.",
      `Society name: ${societyName}`,
      `Mood: ${vibe}`,
      `Palette hint: ${palette}`,
      `Mode: ${mode}`,
      `Layout: ${layout}`,
      `Font preference: ${fontFamily || "auto"}`,
      `Extra prompt: ${prompt || "none"}`,
      "Return JSON with fields: title, branding.primaryColor, branding.secondaryColor, branding.accentColor, branding.fontFamily, branding.logoUrl, branding.faviconUrl, branding.theme.mode, branding.theme.density, branding.theme.layout, branding.theme.heroGradient, branding.theme.navigationStyle, branding.theme.radius, branding.theme.background.",
    ].join("\n");

    const response = await aiService.answerSocietyQuestion({
      query,
      context: { role: req.user?.role, societyId: req.user?.societyId || req.tenant?.society?.id || null },
    });

    const parsed = parseJsonMaybe(response?.answer, null) || parseJsonMaybe(response?.response, null);
    if (parsed?.branding) {
      return res.json({ success: true, data: parsed });
    }

    return res.json({ success: true, data: fallback });
  } catch (_error) {
    return res.json({ success: true, data: buildFallbackTheme(req.body || {}) });
  }
}

module.exports = {
  listThemes,
  getCurrentTheme,
  updateTheme,
  generateTheme,
  // Existing comprehensive theme management functions
  getThemePresets,
  applyPresetTheme,
  validateThemeAccessibility,
  exportThemeCSS,
  getMyTheme,
  getThemeBySubdomain,
  // NEW: AI-powered theme generation
  generateAITheme,
  applyAIGeneratedTheme,
  getThemeGenerationHistory,
  getAIThemePresets,
};

// ========================================
// NEW COMPREHENSIVE THEME FUNCTIONS
// ========================================

const db = require("../config/db");

// Get predefined theme presets
async function getThemePresets(req, res) {
  try {
    const presets = [
      {
        id: 'default',
        name: 'Default',
        description: 'Professional blue theme',
        theme_primary: '#1e40af',
        theme_secondary: '#64748b',
        theme_accent: '#0ea5e9',
        theme_mode: 'auto',
        preview: '🔵'
      },
      {
        id: 'luxury',
        name: 'Luxury',
        description: 'Elegant dark gold theme',
        theme_primary: '#78350f',
        theme_secondary: '#1e293b',
        theme_accent: '#fbbf24',
        theme_mode: 'dark',
        preview: '✨'
      },
      {
        id: 'modern',
        name: 'Modern',
        description: 'Contemporary gradient theme',
        theme_primary: '#7c3aed',
        theme_secondary: '#06b6d4',
        theme_accent: '#ec4899',
        theme_mode: 'light',
        preview: '🚀'
      },
      {
        id: 'corporate',
        name: 'Corporate',
        description: 'Professional business theme',
        theme_primary: '#1f2937',
        theme_secondary: '#4b5563',
        theme_accent: '#3b82f6',
        theme_mode: 'light',
        preview: '💼'
      },
      {
        id: 'nature',
        name: 'Nature',
        description: 'Green sustainable theme',
        theme_primary: '#15803d',
        theme_secondary: '#7c2d12',
        theme_accent: '#4ade80',
        theme_mode: 'light',
        preview: '🌿'
      },
      {
        id: 'sunset',
        name: 'Sunset',
        description: 'Warm vibrant theme',
        theme_primary: '#dc2626',
        theme_secondary: '#ea580c',
        theme_accent: '#fbbf24',
        theme_mode: 'light',
        preview: '🌅'
      },
      {
        id: 'ocean',
        name: 'Ocean',
        description: 'Cool water-inspired theme',
        theme_primary: '#0369a1',
        theme_secondary: '#0c4a6e',
        theme_accent: '#06b6d4',
        theme_mode: 'dark',
        preview: '🌊'
      },
      {
        id: 'festival',
        name: 'Festival Special',
        description: 'Festive colorful theme',
        theme_primary: '#e11d48',
        theme_secondary: '#7c2d12',
        theme_accent: '#fbbf24',
        theme_mode: 'light',
        preview: '🎉'
      },
      {
        id: 'emergency',
        name: 'Emergency Alert',
        description: 'High contrast alert theme',
        theme_primary: '#dc2626',
        theme_secondary: '#7f1d1d',
        theme_accent: '#fbbf24',
        theme_mode: 'light',
        preview: '🚨'
      }
    ];

    res.json({ 
      success: true, 
      data: presets 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}

// Apply a preset theme to society
async function applyPresetTheme(req, res) {
  try {
    const { societyId } = req.params;
    const { presetId } = req.body;

    // Verify permission
    if (req.user.society_id !== parseInt(societyId) && req.user.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    const presets = {
      'default': { theme_primary: '#1e40af', theme_secondary: '#64748b', theme_accent: '#0ea5e9', theme_mode: 'auto' },
      'luxury': { theme_primary: '#78350f', theme_secondary: '#1e293b', theme_accent: '#fbbf24', theme_mode: 'dark' },
      'modern': { theme_primary: '#7c3aed', theme_secondary: '#06b6d4', theme_accent: '#ec4899', theme_mode: 'light' },
      'corporate': { theme_primary: '#1f2937', theme_secondary: '#4b5563', theme_accent: '#3b82f6', theme_mode: 'light' },
      'nature': { theme_primary: '#15803d', theme_secondary: '#7c2d12', theme_accent: '#4ade80', theme_mode: 'light' },
      'sunset': { theme_primary: '#dc2626', theme_secondary: '#ea580c', theme_accent: '#fbbf24', theme_mode: 'light' },
      'ocean': { theme_primary: '#0369a1', theme_secondary: '#0c4a6e', theme_accent: '#06b6d4', theme_mode: 'dark' },
      'festival': { theme_primary: '#e11d48', theme_secondary: '#7c2d12', theme_accent: '#fbbf24', theme_mode: 'light' },
      'emergency': { theme_primary: '#dc2626', theme_secondary: '#7f1d1d', theme_accent: '#fbbf24', theme_mode: 'light' }
    };

    const preset = presets[presetId];

    if (!preset) {
      return res.status(404).json({ 
        success: false, 
        message: "Preset not found" 
      });
    }

    await db.query(
      `UPDATE societies SET theme_primary = ?, theme_secondary = ?, theme_accent = ?, theme_mode = ?, theme_preset = ? WHERE id = ?`,
      [preset.theme_primary, preset.theme_secondary, preset.theme_accent, preset.theme_mode, presetId, societyId]
    );

    const { rows: updated } = await db.query('SELECT * FROM societies WHERE id = ?', [societyId]);

    res.json({ 
      success: true, 
      message: "Preset theme applied successfully",
      data: updated[0]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}

// Validate theme for accessibility
async function validateThemeAccessibility(req, res) {
  try {
    const { primary, secondary, accent } = req.body;

    const getContrast = (color1, color2) => {
      const getLuminance = (hex) => {
        const rgb = parseInt(hex.slice(1), 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = (rgb >> 0) & 0xff;
        
        const [rs, gs, bs] = [r, g, b].map(x => {
          x = x / 255;
          return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      };

      const lum1 = getLuminance(color1);
      const lum2 = getLuminance(color2);
      const lighter = Math.max(lum1, lum2);
      const darker = Math.min(lum1, lum2);
      
      return (lighter + 0.05) / (darker + 0.05);
    };

    const issues = [];
    const primaryContrast = getContrast(primary, '#ffffff');
    const accentContrast = getContrast(accent, primary);

    if (primaryContrast < 4.5) {
      issues.push({ level: 'warning', message: 'Primary color contrast with white may be insufficient (WCAG AA)' });
    }

    if (accentContrast < 3) {
      issues.push({ level: 'warning', message: 'Accent color contrast with primary may be insufficient' });
    }

    res.json({ 
      success: true, 
      data: {
        isAccessible: issues.length === 0,
        issues,
        scores: {
          primaryContrast: primaryContrast.toFixed(2),
          accentContrast: accentContrast.toFixed(2)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}

// Export theme as CSS variables
async function exportThemeCSS(req, res) {
  try {
    const { societyId } = req.params;

    const { rows: theme } = await db.query(
      `SELECT theme_primary, theme_secondary, theme_accent, theme_mode, font_family, 
              sidebar_style, button_style, accent_radius, theme_gradient_style
       FROM societies WHERE id = ?`,
      [societyId]
    );

    if (!theme.length) {
      return res.status(404).json({ 
        success: false, 
        message: "Theme not found" 
      });
    }

    const t = theme[0];
    const lighten = (color, percent) => {
      const num = parseInt(color.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.min(255, (num >> 16) + amt);
      const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
      const B = Math.min(255, (num & 0x0000FF) + amt);
      return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    };

    const darken = (color, percent) => {
      const num = parseInt(color.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.max(0, (num >> 16) - amt);
      const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
      const B = Math.max(0, (num & 0x0000FF) - amt);
      return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    };

    const css = `:root {
  --primary: ${t.theme_primary};
  --primary-50: ${lighten(t.theme_primary, 0.9)};
  --primary-100: ${lighten(t.theme_primary, 0.8)};
  --primary-200: ${lighten(t.theme_primary, 0.6)};
  --primary-300: ${lighten(t.theme_primary, 0.4)};
  --primary-400: ${lighten(t.theme_primary, 0.2)};
  --primary-500: ${t.theme_primary};
  --primary-600: ${darken(t.theme_primary, 0.2)};
  --primary-700: ${darken(t.theme_primary, 0.4)};
  --primary-800: ${darken(t.theme_primary, 0.6)};
  --primary-900: ${darken(t.theme_primary, 0.8)};

  --secondary: ${t.theme_secondary};
  --secondary-light: ${lighten(t.theme_secondary, 0.3)};
  --secondary-dark: ${darken(t.theme_secondary, 0.3)};
  
  --accent: ${t.theme_accent};
  --accent-light: ${lighten(t.theme_accent, 0.3)};
  --accent-dark: ${darken(t.theme_accent, 0.3)};
  
  --gradient-style: ${t.theme_gradient_style || 'linear'};
  --font-family: "${t.font_family || 'Inter'}", sans-serif;
  --sidebar-style: ${t.sidebar_style || 'default'};
  --button-style: ${t.button_style || 'rounded'};
  --accent-radius: ${t.accent_radius === 'small' ? '0.25rem' : t.accent_radius === 'large' ? '0.75rem' : '0.5rem'};
}

[data-theme="dark"] {
  --primary: ${darken(t.theme_primary, 0.3)};
  --primary-light: ${lighten(t.theme_primary, 0.2)};
  --secondary: ${lighten(t.theme_secondary, 0.2)};
  --accent: ${lighten(t.theme_accent, 0.2)};
}`;

    res.set('Content-Type', 'text/css');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(css);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}

// Get current user's society theme
async function getMyTheme(req, res) {
  try {
    const societyId = req.user.society_id;

    if (!societyId) {
      return res.status(400).json({ 
        success: false, 
        message: "User not associated with a society" 
      });
    }

    const { rows: theme } = await db.query(
      `SELECT id, code, name, 
        theme_primary, theme_secondary, theme_accent,
        theme_mode, theme_gradient_style,
        logo_url, logo_dark_url, brand_name,
        font_family, sidebar_style, button_style,
        accent_radius, theme_preset, custom_css
       FROM societies WHERE id = ?`,
      [societyId]
    );

    if (!theme.length) {
      return res.status(404).json({ 
        success: false, 
        message: "Theme not found" 
      });
    }

    res.json({ 
      success: true, 
      data: theme[0]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}

// Get theme by society subdomain (for public access)
async function getThemeBySubdomain(req, res) {
  try {
    const { subdomain } = req.params;

    const { rows: society } = await db.query(
      `SELECT id, theme_primary, theme_secondary, theme_accent, 
        theme_mode, theme_gradient_style, logo_url, logo_dark_url,
        brand_name, font_family, sidebar_style, button_style, accent_radius
       FROM societies WHERE subdomain = ?`,
      [subdomain]
    );

    if (!society.length) {
      return res.status(404).json({ 
        success: false, 
        message: "Society theme not found" 
      });
    }

    res.json({ 
      success: true, 
      data: society[0]
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
}

// ========================================
// NEW: AI-POWERED THEME GENERATION
// ========================================

const aiThemeGenerator = require("../services/aiThemeGenerator");

// Generate AI theme for society
async function generateAITheme(req, res) {
  try {
    const { societyId } = req.params;
    const userId = req.user?.id;
    const { prompt, style = "modern" } = req.body;

    // Verify authorization
    const { rows: user } = await db.query(
      `SELECT id FROM users 
       WHERE id = ? AND society_id = ? AND role IN ('secretary', 'admin', 'super_admin')`,
      [userId, societyId]
    );

    if (user.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    // Get society name
    const { rows: society } = await db.query(
      `SELECT name FROM societies WHERE id = ?`,
      [societyId]
    );

    if (society.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Society not found" 
      });
    }

    // Generate theme
    const result = await aiThemeGenerator.generateTheme(
      society[0].name,
      prompt,
      style
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate theme",
        error: result.error || result.message
      });
    }

    // Save generation
    const generationId = await aiThemeGenerator.saveGeneratedTheme(
      societyId,
      prompt,
      result.theme,
      userId
    );

    res.json({
      success: true,
      message: "Theme generated successfully",
      generationId,
      theme: result.theme,
      accessibility: result.theme.color_accessibility,
      suggestions: result.theme.suggestions
    });
  } catch (error) {
    console.error("Error generating AI theme:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate theme" 
    });
  }
}

// Apply generated AI theme
async function applyAIGeneratedTheme(req, res) {
  try {
    const { societyId, generationId } = req.params;
    const userId = req.user?.id;

    // Verify authorization
    const { rows: user } = await db.query(
      `SELECT id FROM users 
       WHERE id = ? AND society_id = ? AND role IN ('secretary', 'admin', 'super_admin')`,
      [userId, societyId]
    );

    if (user.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    // Get theme generation
    const { rows: generation } = await db.query(
      `SELECT generated_theme_json FROM ai_theme_generations 
       WHERE id = ? AND society_id = ?`,
      [generationId, societyId]
    );

    if (generation.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Theme generation not found" 
      });
    }

    const theme = JSON.parse(generation[0].generated_theme_json);

    // Apply theme
    await aiThemeGenerator.applyThemeToSociety(societyId, theme, userId);

    // Update status
    await db.query(
      `UPDATE ai_theme_generations SET status = 'applied', applied_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [generationId]
    );

    res.json({
      success: true,
      message: "Theme applied successfully",
      theme
    });
  } catch (error) {
    console.error("Error applying theme:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to apply theme" 
    });
  }
}

// Get theme history for society
async function getThemeGenerationHistory(req, res) {
  try {
    const { societyId } = req.params;
    const userId = req.user?.id;
    const limit = req.query.limit || 10;

    // Verify authorization
    const { rows: user } = await db.query(
      `SELECT id FROM users 
       WHERE id = ? AND society_id = ?`,
      [userId, societyId]
    );

    if (user.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    const history = await aiThemeGenerator.getThemeHistory(societyId, limit);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error("Error fetching theme history:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch history" 
    });
  }
}

// Get all AI theme presets
async function getAIThemePresets(req, res) {
  try {
    const presets = await aiThemeGenerator.getThemePresets();
    
    res.json({
      success: true,
      data: presets
    });
  } catch (error) {
    console.error("Error fetching presets:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch presets" 
    });
  }
}
