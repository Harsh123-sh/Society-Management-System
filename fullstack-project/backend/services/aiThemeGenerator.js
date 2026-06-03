/**
 * AI Theme Generator Service
 * Uses Gemini AI to generate beautiful, cohesive themes for societies
 */

const db = require("../db");
let GoogleGenerativeAI = null;
let geminiImportError = null;

try {
  ({ GoogleGenerativeAI } = require("@google/generative-ai"));
} catch (error) {
  geminiImportError = error;
  console.warn(
    "Gemini AI module unavailable:",
    error.code === "MODULE_NOT_FOUND" ? "optional dependency missing" : error.message
  );
}

class AIThemeGenerator {
  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey || !GoogleGenerativeAI) {
      this.enabled = false;
      if (!apiKey) {
        console.warn("GOOGLE_GEMINI_API_KEY not configured, AI theme generation disabled.");
      } else {
        console.warn("Gemini AI SDK unavailable, AI theme generation disabled.");
      }
    } else {
      this.client = new GoogleGenerativeAI(apiKey);
      this.model = this.client.getGenerativeModel({ 
        model: "gemini-1.5-flash"
      });
      this.enabled = true;
    }
  }

  /**
   * Generate theme based on society name and description
   */
  async generateTheme(societyName, societyDescription = "", style = "modern") {
    try {
      if (!this.enabled) {
        return {
          success: false,
          message: "AI service not configured"
        };
      }

      const prompt = this.buildThemePrompt(societyName, societyDescription, style);

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();

      // Parse the AI response to extract color values
      const theme = this.parseThemeResponse(responseText);

      return {
        success: true,
        theme,
        rawResponse: responseText
      };
    } catch (error) {
      console.error("Error generating theme:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Build the prompt for theme generation
   */
  buildThemePrompt(societyName, description, style) {
    return `
You are an expert UI/UX designer specializing in color theory and web design.

Generate a cohesive, professional theme for a residential society management platform.

Society Details:
- Name: ${societyName}
- Description: ${description || "A residential community"}
- Style: ${style}

Generate ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "primary": "#HEX_COLOR",
  "secondary": "#HEX_COLOR", 
  "accent": "#HEX_COLOR",
  "background": "#HEX_COLOR",
  "card": "#HEX_COLOR",
  "mode": "light" or "dark",
  "gradient_style": "descriptive name",
  "sidebar_style": "light", "dark", or "colored",
  "button_style": "rounded", "square", or "pill",
  "font_family": "suggested font name",
  "accent_radius": "Tailwind border radius class",
  "preset_name": "custom name for this theme",
  "color_accessibility": {
    "contrast_score": number 1-10,
    "readability": "description"
  },
  "suggestions": ["tip 1", "tip 2", "tip 3"]
}

Requirements:
1. Ensure high contrast for accessibility (WCAG AA minimum)
2. Colors should represent the society's nature/theme
3. Create a professional, modern palette
4. Include complementary colors
5. Ensure dark mode readability if mode is "dark"
6. Use standard web-safe practices

Return ONLY the JSON object.
`;
  }

  /**
   * Parse the AI response to extract theme object
   */
  parseThemeResponse(responseText) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const theme = JSON.parse(jsonMatch[0]);

      // Validate and sanitize colors
      const validated = {
        primary: this.validateColor(theme.primary, "#0f766e"),
        secondary: this.validateColor(theme.secondary, "#2563eb"),
        accent: this.validateColor(theme.accent, "#14b8a6"),
        background: this.validateColor(theme.background, "#ffffff"),
        card: this.validateColor(theme.card, "#f9fafb"),
        mode: ["light", "dark", "auto"].includes(theme.mode) ? theme.mode : "light",
        gradient_style: theme.gradient_style || "default",
        sidebar_style: ["light", "dark", "colored"].includes(theme.sidebar_style) ? theme.sidebar_style : "light",
        button_style: ["rounded", "square", "pill"].includes(theme.button_style) ? theme.button_style : "rounded",
        font_family: theme.font_family || "Inter",
        accent_radius: this.validateRadius(theme.accent_radius),
        preset_name: theme.preset_name || "Custom Theme",
        color_accessibility: theme.color_accessibility || {}
      };

      return validated;
    } catch (error) {
      console.error("Error parsing theme response:", error);
      // Return a safe default theme
      return this.getDefaultTheme();
    }
  }

  /**
   * Validate color hex value
   */
  validateColor(color, fallback = "#0f766e") {
    if (!color) return fallback;
    
    const hexRegex = /^#([A-F0-9]{6}|[A-F0-9]{3})$/i;
    if (hexRegex.test(color)) {
      return color;
    }

    // Try to convert color name to hex
    const namedColors = {
      "red": "#ef4444",
      "blue": "#3b82f6",
      "green": "#22c55e",
      "yellow": "#eab308",
      "purple": "#a855f7",
      "pink": "#ec4899",
      "gray": "#6b7280"
    };

    return namedColors[color?.toLowerCase()] || fallback;
  }

  /**
   * Validate Tailwind radius class
   */
  validateRadius(radius) {
    const validRadius = [
      "rounded-none",
      "rounded-sm",
      "rounded",
      "rounded-md",
      "rounded-lg",
      "rounded-xl",
      "rounded-2xl",
      "rounded-3xl",
      "rounded-full"
    ];

    return validRadius.includes(radius) ? radius : "rounded-lg";
  }

  /**
   * Get theme presets
   */
  async getThemePresets() {
    return [
      {
        id: "eco",
        name: "Eco Green",
        description: "Fresh, sustainable green theme",
        ...this.getEcoTheme()
      },
      {
        id: "luxury",
        name: "Luxury Gold",
        description: "Elegant dark gold theme",
        ...this.getLuxuryTheme()
      },
      {
        id: "corporate",
        name: "Corporate Blue",
        description: "Professional blue theme",
        ...this.getCorporateTheme()
      },
      {
        id: "aqua",
        name: "Aqua Marine",
        description: "Waterfront cyan theme",
        ...this.getAquaTheme()
      },
      {
        id: "premium",
        name: "Premium Orange",
        description: "Premium orange & purple theme",
        ...this.getPremiumTheme()
      }
    ];
  }

  /**
   * Predefined theme templates
   */
  getEcoTheme() {
    return {
      primary: "#059669",
      secondary: "#ffffff",
      accent: "#10b981",
      background: "#f0fdf4",
      card: "#ecfdf5",
      mode: "light",
      gradient_style: "emerald-to-white",
      sidebar_style: "colored",
      button_style: "rounded",
      font_family: "Inter",
      accent_radius: "rounded-lg",
      preset: "eco"
    };
  }

  getLuxuryTheme() {
    return {
      primary: "#1f2937",
      secondary: "#fbbf24",
      accent: "#fcd34d",
      background: "#111827",
      card: "#1f2937",
      mode: "dark",
      gradient_style: "gold-to-black",
      sidebar_style: "dark",
      button_style: "square",
      font_family: "Playfair Display",
      accent_radius: "rounded-none",
      preset: "luxury"
    };
  }

  getCorporateTheme() {
    return {
      primary: "#0284c7",
      secondary: "#e2e8f0",
      accent: "#0ea5e9",
      background: "#f8fafc",
      card: "#f1f5f9",
      mode: "light",
      gradient_style: "blue-to-silver",
      sidebar_style: "light",
      button_style: "rounded",
      font_family: "Inter",
      accent_radius: "rounded-md",
      preset: "corporate"
    };
  }

  getAquaTheme() {
    return {
      primary: "#0891b2",
      secondary: "#001f3f",
      accent: "#06b6d4",
      background: "#ecf0f1",
      card: "#ffffff",
      mode: "light",
      gradient_style: "cyan-to-navy",
      sidebar_style: "colored",
      button_style: "pill",
      font_family: "Segoe UI",
      accent_radius: "rounded-full",
      preset: "aqua"
    };
  }

  getPremiumTheme() {
    return {
      primary: "#ea580c",
      secondary: "#7c3aed",
      accent: "#f97316",
      background: "#fef3c7",
      card: "#fff7ed",
      mode: "light",
      gradient_style: "orange-to-purple",
      sidebar_style: "colored",
      button_style: "rounded",
      font_family: "Poppins",
      accent_radius: "rounded-xl",
      preset: "premium"
    };
  }

  getDefaultTheme() {
    return {
      primary: "#0f766e",
      secondary: "#2563eb",
      accent: "#14b8a6",
      background: "#ffffff",
      card: "#f9fafb",
      mode: "light",
      gradient_style: "default",
      sidebar_style: "light",
      button_style: "rounded",
      font_family: "Inter",
      accent_radius: "rounded-lg",
      preset: "default"
    };
  }

  /**
   * Save generated theme to database
   */
  async saveGeneratedTheme(societyId, prompt, generatedTheme, generatedBy) {
    try {
      const { rows: result } = await db.query(
        `INSERT INTO ai_theme_generations (
          society_id, request_prompt, generated_theme_json, 
          generated_by, status
        ) VALUES (?, ?, ?, ?, 'archived')`,
        [
          societyId,
          prompt,
          JSON.stringify(generatedTheme),
          generatedBy
        ]
      );

      return result.insertId;
    } catch (error) {
      console.error("Error saving theme generation:", error);
      throw error;
    }
  }

  /**
   * Apply theme to society
   */
  async applyThemeToSociety(societyId, theme, userId) {
    try {
      const { rows: result } = await db.query(
        `UPDATE societies SET
          theme_primary = ?,
          theme_secondary = ?,
          theme_accent = ?,
          theme_background = ?,
          theme_card = ?,
          theme_mode = ?,
          theme_gradient_style = ?,
          sidebar_style = ?,
          button_style = ?,
          font_family = ?,
          accent_radius = ?,
          theme_preset = ?
        WHERE id = ?`,
        [
          theme.primary,
          theme.secondary,
          theme.accent,
          theme.background,
          theme.card,
          theme.mode,
          theme.gradient_style,
          theme.sidebar_style,
          theme.button_style,
          theme.font_family,
          theme.accent_radius,
          theme.preset_name || "custom",
          societyId
        ]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error applying theme:", error);
      throw error;
    }
  }

  /**
   * Get theme generation history
   */
  async getThemeHistory(societyId, limit = 10) {
    try {
      const { rows } = await db.query(
        `SELECT id, request_prompt, generated_theme_json, status, 
                generated_by, created_at
         FROM ai_theme_generations
         WHERE society_id = ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [societyId, limit]
      );

      return rows.map(row => ({
        ...row,
        generated_theme: row.generated_theme_json ? JSON.parse(row.generated_theme_json) : null
      }));
    } catch (error) {
      console.error("Error fetching theme history:", error);
      return [];
    }
  }
}

module.exports = new AIThemeGenerator();
