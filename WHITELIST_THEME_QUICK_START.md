# Quick Integration Guide - White-Label Theme System

## Setup Steps

### Step 1: Database Update
The database schema is automatically updated when the backend starts. The `initSchema.js` will add all necessary theme columns to the societies table.

No manual migration needed! ✓

### Step 2: Backend Routes
Theme routes are already configured in `/backend/routes/themeRoutes.js` and registered in your Express app.

Make sure your app includes theme routes:
```javascript
// In your main App.js or server.js
const themeRoutes = require('./routes/themeRoutes');
app.use('/api/themes', themeRoutes);
```

### Step 3: Frontend Setup

#### Import Theme CSS
```javascript
// In your main.jsx or App.jsx - FIRST IMPORT
import './styles/theme.css';
```

#### Wrap with ThemeProvider
```jsx
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider societyId={user.societyId || 1}>
      {/* Your app content */}
    </ThemeProvider>
  );
}

export default App;
```

#### Import Tailwind Config
Tailwind config is already updated in `tailwind.config.js` with theme tokens.

### Step 4: Update Your Components

Replace hardcoded colors with theme variables:

**BEFORE:**
```jsx
<button style={{ backgroundColor: '#1e40af' }}>
  Submit
</button>
```

**AFTER:**
```jsx
<button className="bg-primary text-white px-4 py-2 rounded-theme-md">
  Submit
</button>
```

Or use CSS variables:
```jsx
<button style={{ backgroundColor: 'var(--primary)' }}>
  Submit
</button>
```

### Step 5: Add Theme Manager to Admin Panel

```jsx
import ThemeManager from './components/ThemeManager';

function AdminPanel() {
  return (
    <div>
      <ThemeManager societyId={currentSociety.id} />
    </div>
  );
}
```

## File Structure Created

```
Backend:
├── models/themeModel.js          (Theme business logic)
├── controllers/themeController.js (API endpoints)
├── routes/themeRoutes.js         (REST routes)
└── database/initSchema.js        (Updated with migrations)

Frontend:
├── context/ThemeContext.jsx      (Theme provider & hook)
├── components/ThemeManager.jsx   (Admin UI)
├── styles/
│   ├── theme.css                 (CSS variables)
│   └── designTokens.js           (Design system)
└── tailwind.config.js            (Updated config)
```

## Available Hooks & Components

### useTheme Hook
```javascript
const {
  theme,                    // Current theme object
  loading,                  // Loading state
  darkMode,                 // Dark mode flag
  toggleDarkMode,           // Toggle function
  updateTheme,              // Update function
  applyPreset,              // Apply preset function
  exportCSS,                // Export CSS function
  getPrimaryColor,          // Get primary color function
  getSecondaryColor,        // Get secondary color function
  getAccentColor            // Get accent color function
} = useTheme();
```

### Design Tokens
```javascript
import DesignTokens, { colorUtils } from './styles/designTokens';

// Access any design token
DesignTokens.colors.primary[500]
DesignTokens.typography.sizes.lg
DesignTokens.spacing[4]
DesignTokens.shadows.lg

// Color utilities
colorUtils.lighten(color, percent)
colorUtils.darken(color, percent)
colorUtils.getContrastRatio(color1, color2)
colorUtils.getContrastColor(color)
```

## Tailwind Classes

All theme colors work in Tailwind:

```jsx
// Primary shades
<div className="bg-primary text-primary-600" />

// Secondary
<div className="bg-secondary text-secondary-light" />

// Accent
<div className="bg-accent border-accent-dark" />

// Theme-aware utilities
<button className="btn-theme" />
<div className="btn-theme-outline" />
<div className="card-theme" />
<div className="gradient-theme" />
```

## CSS Variables Reference

All available CSS variables:

```css
/* Colors */
--primary (--primary-50 to --primary-900)
--secondary (--secondary-light, --secondary-dark)
--accent (--accent-light, --accent-dark)

/* Typography */
--font-family

/* Layout */
--sidebar-style
--button-style
--accent-radius

/* Semantic Colors */
--success, --warning, --error, --info

/* Component Specific */
--card-bg, --card-border
--input-bg, --input-border, --input-focus
--button-padding-x, --button-padding-y
```

## Testing the Theme System

### 1. Test API Endpoints
```bash
# Get my theme
curl http://localhost:5000/api/themes/my-theme \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get presets
curl http://localhost:5000/api/themes/presets/list

# Update theme
curl -X PATCH http://localhost:5000/api/themes/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"theme_primary":"#ff0000"}'
```

### 2. Test Frontend
- Open browser DevTools
- Check CSS variables in `:root` styles
- Change theme and verify DOM updates
- Toggle dark mode
- Test on mobile

### 3. Test Dark Mode
- Open DevTools
- Add `dark` class to `<html>` tag
- Verify colors change
- Test contrast ratios

## Common Tasks

### Change Primary Color for All Societies
```javascript
// Backend
app.patch('/api/admin/themes/bulk', async (req, res) => {
  const { theme_primary } = req.body;
  await db.query('UPDATE societies SET theme_primary = ?', [theme_primary]);
  res.json({ success: true });
});
```

### Export Current Theme as CSS
```javascript
const { exportCSS } = useTheme();
const css = await exportCSS();
// Download or use CSS
```

### Create Custom Theme Preset
```javascript
const customPreset = {
  id: 'my-preset',
  name: 'My Custom',
  theme_primary: '#your-color',
  theme_secondary: '#your-color',
  theme_accent: '#your-color',
  theme_mode: 'light'
};
```

## Performance Optimization

1. **Cache theme globally**
   - ThemeProvider handles caching
   - localStorage for theme mode preference
   - 1-hour cache on API responses

2. **Lazy load theme**
   - Theme loaded on app initialization
   - Components render with defaults first
   - Update when theme arrives

3. **Optimize re-renders**
   - useTheme only re-renders when theme changes
   - CSS variables update without React re-renders
   - Use CSS-in-JS for dynamic styles

## Troubleshooting Checklist

- [ ] Theme CSS imported first
- [ ] ThemeProvider wrapping app
- [ ] API endpoints responding
- [ ] CSS variables showing in DevTools
- [ ] Tailwind classes working
- [ ] Dark mode toggle functioning
- [ ] Accessibility scores passing
- [ ] Mobile responsive

## Next Steps

1. ✓ Replace hardcoded colors in all components
2. ✓ Add theme manager to admin panel
3. ✓ Test all preset themes
4. ✓ Implement AI theme suggestions
5. ✓ Add theme analytics
6. ✓ Create theme marketplace

## Support Files

- **Documentation**: `WHITELIST_THEME_SYSTEM.md`
- **API Reference**: See `themeController.js`
- **Design System**: `designTokens.js`
- **Implementation**: `ThemeContext.jsx`

---

**Ready to use!** Start integrating the theme system into your components.
