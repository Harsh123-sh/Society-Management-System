const db = require("../db");

class ThemeModel {
  // Get society theme
  static async getTheme(societyId) {
    try {
      const { rows: theme } = await db.query(
        `SELECT 
          id, code, name, 
          theme_primary, theme_secondary, theme_accent,
          theme_mode, theme_gradient_style,
          logo_url, logo_dark_url, brand_name,
          font_family, sidebar_style, button_style,
          accent_radius, theme_preset, custom_css,
          created_at, updated_at
        FROM societies WHERE id = ?`,
        [societyId]
      );
      return theme[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Update society theme
  static async updateTheme(societyId, themeData) {
    try {
      const allowedFields = [
        'theme_primary', 'theme_secondary', 'theme_accent',
        'theme_mode', 'theme_gradient_style',
        'logo_url', 'logo_dark_url', 'brand_name',
        'font_family', 'sidebar_style', 'button_style',
        'accent_radius', 'theme_preset', 'custom_css'
      ];

      const fields = [];
      const values = [];

      for (const [key, value] of Object.entries(themeData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }

      if (fields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(societyId);

      const query = `UPDATE societies SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      const result = await db.query(query, values);

      if (result[0].affectedRows === 0) {
        throw new Error('Society not found');
      }

      return await this.getTheme(societyId);
    } catch (error) {
      throw error;
    }
  }

  // Get theme presets
  static async getThemePresets() {
    return [
      {
        id: 'default',
        name: 'Default',
        description: 'Professional blue theme',
        theme_primary: '#1e40af',
        theme_secondary: '#64748b',
        theme_accent: '#0ea5e9',
        theme_mode: 'auto'
      },
      {
        id: 'luxury',
        name: 'Luxury',
        description: 'Elegant dark gold theme',
        theme_primary: '#78350f',
        theme_secondary: '#1e293b',
        theme_accent: '#fbbf24',
        theme_mode: 'dark'
      },
      {
        id: 'modern',
        name: 'Modern',
        description: 'Contemporary gradient theme',
        theme_primary: '#7c3aed',
        theme_secondary: '#06b6d4',
        theme_accent: '#ec4899',
        theme_mode: 'light'
      },
      {
        id: 'corporate',
        name: 'Corporate',
        description: 'Professional business theme',
        theme_primary: '#1f2937',
        theme_secondary: '#4b5563',
        theme_accent: '#3b82f6',
        theme_mode: 'light'
      },
      {
        id: 'nature',
        name: 'Nature',
        description: 'Green sustainable theme',
        theme_primary: '#15803d',
        theme_secondary: '#7c2d12',
        theme_accent: '#4ade80',
        theme_mode: 'light'
      },
      {
        id: 'sunset',
        name: 'Sunset',
        description: 'Warm vibrant theme',
        theme_primary: '#dc2626',
        theme_secondary: '#ea580c',
        theme_accent: '#fbbf24',
        theme_mode: 'light'
      },
      {
        id: 'ocean',
        name: 'Ocean',
        description: 'Cool water-inspired theme',
        theme_primary: '#0369a1',
        theme_secondary: '#0c4a6e',
        theme_accent: '#06b6d4',
        theme_mode: 'dark'
      },
      {
        id: 'festival',
        name: 'Festival Special',
        description: 'Festive colorful theme',
        theme_primary: '#e11d48',
        theme_secondary: '#7c2d12',
        theme_accent: '#fbbf24',
        theme_mode: 'light'
      },
      {
        id: 'emergency',
        name: 'Emergency Alert',
        description: 'High contrast alert theme',
        theme_primary: '#dc2626',
        theme_secondary: '#7f1d1d',
        theme_accent: '#fbbf24',
        theme_mode: 'light'
      }
    ];
  }

  // Generate AI theme suggestions
  static async generateThemeSuggestion(societyName, industryType = 'general') {
    try {
      // Call AI service to generate theme
      const aiController = require('../controllers/aiController');
      
      const prompt = `Generate a professional color theme for a society/community management platform named "${societyName}". 
      Industry type: ${industryType}. 
      
      Return ONLY a JSON object with:
      {
        "theme_primary": "#hexcolor",
        "theme_secondary": "#hexcolor", 
        "theme_accent": "#hexcolor",
        "theme_mode": "light|dark|auto",
        "font_family": "font-name",
        "button_style": "rounded|square|pill",
        "sidebar_style": "default|minimal|compact",
        "brand_name": "${societyName}",
        "reasoning": "brief explanation"
      }`;

      // For now, return a default suggestion
      // In production, call actual AI service
      return {
        theme_primary: '#1e40af',
        theme_secondary: '#64748b',
        theme_accent: '#0ea5e9',
        theme_mode: 'auto',
        font_family: 'Inter',
        button_style: 'rounded',
        sidebar_style: 'default',
        brand_name: societyName,
        reasoning: 'Professional theme suitable for community management'
      };
    } catch (error) {
      throw error;
    }
  }

  // Validate theme colors for accessibility
  static async validateThemeAccessibility(theme) {
    try {
      // Simple contrast ratio check
      const contrastCheck = (color1, color2) => {
        // Calculate relative luminance
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

      // Check primary vs white background
      const primaryContrast = contrastCheck(theme.theme_primary, '#ffffff');
      if (primaryContrast < 4.5) {
        issues.push('Primary color may not have sufficient contrast with white background (WCAG AA)');
      }

      // Check accent vs primary
      const accentContrast = contrastCheck(theme.theme_accent, theme.theme_primary);
      if (accentContrast < 3) {
        issues.push('Accent color may not have sufficient contrast with primary color');
      }

      return {
        isAccessible: issues.length === 0,
        issues,
        scores: {
          primaryContrast: primaryContrast.toFixed(2),
          accentContrast: accentContrast.toFixed(2)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Export theme as CSS variables
  static generateCSSVariables(theme) {
    return `
:root {
  --primary: ${theme.theme_primary};
  --primary-50: ${this.lighten(theme.theme_primary, 0.9)};
  --primary-100: ${this.lighten(theme.theme_primary, 0.8)};
  --primary-200: ${this.lighten(theme.theme_primary, 0.6)};
  --primary-300: ${this.lighten(theme.theme_primary, 0.4)};
  --primary-400: ${this.lighten(theme.theme_primary, 0.2)};
  --primary-500: ${theme.theme_primary};
  --primary-600: ${this.darken(theme.theme_primary, 0.2)};
  --primary-700: ${this.darken(theme.theme_primary, 0.4)};
  --primary-800: ${this.darken(theme.theme_primary, 0.6)};
  --primary-900: ${this.darken(theme.theme_primary, 0.8)};

  --secondary: ${theme.theme_secondary};
  --accent: ${theme.theme_accent};
  --gradient-style: ${theme.theme_gradient_style || 'linear'};
  --font-family: ${theme.font_family || 'Inter, sans-serif'};
  --sidebar-style: ${theme.sidebar_style || 'default'};
  --button-style: ${theme.button_style || 'rounded'};
  --accent-radius: ${theme.accent_radius === 'small' ? '0.25rem' : theme.accent_radius === 'large' ? '0.75rem' : '0.5rem'};
}

[data-theme="dark"] {
  --primary: ${this.darken(theme.theme_primary, 0.3)};
  --secondary: ${this.lighten(theme.theme_secondary, 0.2)};
  --accent: ${this.lighten(theme.theme_accent, 0.2)};
}
    `.trim();
  }

  // Helper functions for color manipulation
  static lighten(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  static darken(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }
}

module.exports = ThemeModel;
