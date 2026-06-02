# White-Label Theme System - Complete Implementation Guide

## Overview

This is a comprehensive white-label theme system that allows each society to customize the entire platform's branding, colors, and design. The system works across web, mobile, and all user roles.

## Architecture

### Database Layer
- **societies table**: Stores theme configuration per society
- **Theme fields**: 
  - `theme_primary` - Primary brand color
  - `theme_secondary` - Secondary brand color  
  - `theme_accent` - Accent color
  - `theme_mode` - Light/dark/auto mode
  - `theme_gradient_style` - Gradient type (linear/radial/conic)
  - `logo_url` / `logo_dark_url` - Society logos
  - `brand_name` - Display name
  - `font_family` - Typography choice
  - `sidebar_style` - Navigation style
  - `button_style` - Button appearance
  - `accent_radius` - Roundedness
  - `theme_preset` - Active preset name
  - `custom_css` - Custom CSS overrides
  - `updated_at` - Last modified timestamp

### Backend Architecture
- **Models**: `themeModel.js` - Theme business logic
- **Controllers**: `themeController.js` - API endpoints
- **Routes**: `/api/themes/*` - REST endpoints
- **Database**: Automatic schema migration on startup

### Frontend Architecture
- **ThemeContext**: React context for global theme access
- **ThemeProvider**: Component wrapper for app
- **useTheme**: Hook for accessing theme
- **Design Tokens**: Centralized design system
- **CSS Variables**: Dynamic styling system
- **Tailwind Integration**: Theme-aware utilities

## API Endpoints

### GET /api/themes/my-theme
Get current user's society theme
```bash
curl http://localhost:5000/api/themes/my-theme \
  -H "Authorization: Bearer TOKEN"
```

### GET /api/themes/subdomain/:subdomain
Get theme by society subdomain (public)
```bash
curl http://localhost:5000/api/themes/subdomain/my-society
```

### GET /api/themes/presets/list
Get all available theme presets
```bash
curl http://localhost:5000/api/themes/presets/list
```

### POST /api/themes/:societyId/preset
Apply a preset theme
```bash
curl -X POST http://localhost:5000/api/themes/123/preset \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"presetId": "luxury"}'
```

### PATCH /api/themes/:societyId
Update society theme
```bash
curl -X PATCH http://localhost:5000/api/themes/123 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "theme_primary": "#1e40af",
    "theme_secondary": "#64748b",
    "theme_accent": "#0ea5e9",
    "brand_name": "My Society"
  }'
```

### GET /api/themes/:societyId/export-css
Export theme as CSS variables file
```bash
curl http://localhost:5000/api/themes/123/export-css
```

### POST /api/themes/validate/accessibility
Validate theme colors for WCAG accessibility
```bash
curl -X POST http://localhost:5000/api/themes/validate/accessibility \
  -H "Content-Type: application/json" \
  -d '{
    "primary": "#1e40af",
    "secondary": "#64748b",
    "accent": "#0ea5e9"
  }'
```

## Frontend Integration

### 1. Wrap App with ThemeProvider
```jsx
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider societyId={user.societyId}>
      <YourApp />
    </ThemeProvider>
  );
}
```

### 2. Use Theme in Components
```jsx
import { useTheme } from '../context/ThemeContext';

function Button() {
  const { theme, darkMode, toggleDarkMode } = useTheme();
  
  return (
    <div>
      <button style={{ backgroundColor: theme.theme_primary }}>
        Click me
      </button>
      <button onClick={toggleDarkMode}>
        Toggle: {darkMode ? 'Dark' : 'Light'}
      </button>
    </div>
  );
}
```

### 3. Use Design Tokens
```jsx
import { DesignTokens, colorUtils } from '../styles/designTokens';

function Card() {
  const contrastRatio = colorUtils.getContrastRatio('#1e40af', '#ffffff');
  
  return (
    <div style={{ 
      borderRadius: DesignTokens.borderRadius.base,
      boxShadow: DesignTokens.shadows.lg,
      fontFamily: DesignTokens.typography.fontFamily
    }}>
      Contrast ratio: {contrastRatio.toFixed(2)}
    </div>
  );
}
```

### 4. Use Tailwind Theme Colors
```jsx
export default function Header() {
  return (
    <header className="bg-primary text-white p-6 rounded-theme-md shadow-lg">
      <h1 className="text-3xl font-bold text-accent">Welcome</h1>
      <button className="btn-theme mt-4">
        Get Started
      </button>
    </header>
  );
}
```

## CSS Variables System

All components automatically use CSS variables:

```css
:root {
  --primary: #1e40af;
  --primary-50 through --primary-900: color shades
  --secondary: #64748b;
  --accent: #0ea5e9;
  --font-family: "Inter", sans-serif;
  --sidebar-style: default;
  --button-style: rounded;
  --accent-radius: 0.5rem;
}
```

Update any CSS variable to change theme globally:
```javascript
document.documentElement.style.setProperty('--primary', '#ff0000');
```

## Theme Presets

Available presets:
- **default** - Professional blue theme
- **luxury** - Elegant dark gold
- **modern** - Contemporary gradient
- **corporate** - Professional business
- **nature** - Green sustainable
- **sunset** - Warm vibrant
- **ocean** - Cool water-inspired
- **festival** - Festive colorful
- **emergency** - High contrast alert

## Color Utilities

```javascript
import { colorUtils } from '../styles/designTokens';

// Lighten/Darken
colorUtils.lighten('#1e40af', 0.3)  // Lighter
colorUtils.darken('#1e40af', 0.3)   // Darker

// Get contrast color
colorUtils.getContrastColor('#1e40af')  // Returns #ffffff

// Calculate contrast ratio (WCAG)
colorUtils.getContrastRatio('#1e40af', '#ffffff')  // 4.5 (AA compliant)

// Hex to RGB
colorUtils.hexToRgb('#1e40af')  // { r: 30, g: 64, b: 175 }

// RGB to Hex
colorUtils.rgbToHex(30, 64, 175)  // #1e40af
```

## Using Theme Manager Component

```jsx
import ThemeManager from './components/ThemeManager';

function AdminDashboard() {
  return (
    <div>
      <ThemeManager societyId={societyId} />
    </div>
  );
}
```

## Mobile App Integration

### React Native
```javascript
import { useTheme } from '../context/ThemeContext';
import { StyleSheet } from 'react-native';

export default function MobileComponent() {
  const { theme } = useTheme();
  
  const styles = StyleSheet.create({
    button: {
      backgroundColor: theme.theme_primary,
      borderRadius: parseInt(theme.button_style === 'pill' ? '99' : '8')
    }
  });
  
  return <TouchableOpacity style={styles.button} />;
}
```

## Dark Mode Implementation

### Auto-detect
```javascript
const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

### Manual Toggle
```javascript
const { darkMode, toggleDarkMode } = useTheme();

<button onClick={toggleDarkMode}>
  {darkMode ? 'Light Mode' : 'Dark Mode'}
</button>
```

### Persist Setting
```javascript
localStorage.setItem('theme-mode', 'dark');
```

## Role-Based Customization

### Super Admin
- Global default theme
- Builder-wide branding
- System-wide CSS overrides

```javascript
if (user.role === 'super_admin') {
  // Can update global defaults
  await updateTheme(societyId: 0, {...});
}
```

### Builder Admin
- Builder-wide branding
- Multiple society themes

```javascript
if (user.role === 'admin' && user.builder_id) {
  // Can update all societies under builder
  await updateTheme(societyId, {...});
}
```

### Society Admin
- Society-specific branding only

```javascript
if (user.role === 'admin') {
  // Can only update own society
  await updateTheme(user.society_id, {...});
}
```

## Responsive Implementation

### Mobile
- Full theme support on mobile
- Touch-friendly color pickers
- Simplified theme manager UI
- Auto-sync across devices

### Tablet
- Two-column theme manager
- Split color picker view
- Responsive preset grid

### Desktop
- Full theme customization
- Live preview
- Advanced accessibility tools
- Batch operations

## Best Practices

1. **Always Validate Accessibility**
   ```javascript
   const { isAccessible, issues } = await validateAccessibility(theme);
   ```

2. **Use CSS Variables Instead of Hardcoding**
   ```css
   /* Good */
   button { background-color: var(--primary); }
   
   /* Bad */
   button { background-color: #1e40af; }
   ```

3. **Provide Fallbacks**
   ```css
   color: var(--primary, #1e40af);
   ```

4. **Optimize Performance**
   - Cache theme fetches
   - Debounce color updates
   - Use CSS variables for instant updates

5. **Test Dark Mode**
   - Ensure sufficient contrast
   - Test all components
   - Verify images/logos

## Troubleshooting

### Theme not applying
- Clear browser cache
- Check localStorage theme-mode
- Verify ThemeProvider is wrapping app
- Check CSS variables are set

### Dark mode toggle not working
- Verify darkMode state in context
- Check HTML dark class
- Verify CSS dark mode selectors
- Check localStorage persistence

### Colors not updating
- Verify updateTheme API response
- Check CSS variable application
- Clear browser cache
- Restart dev server

### Accessibility warnings
- Use validateAccessibility endpoint
- Lighten dark colors
- Darken light colors
- Test with contrast checker tools

## Database Migration

Existing databases will automatically add theme columns on server startup:

```javascript
// Auto-executed in initSchema.js
ALTER TABLE societies ADD COLUMN theme_primary VARCHAR(7) DEFAULT '#1e40af';
ALTER TABLE societies ADD COLUMN theme_secondary VARCHAR(7) DEFAULT '#64748b';
// ... and so on
```

## Future Enhancements

1. **AI Theme Generation**
   - Generate themes based on society name
   - Industry-specific color suggestions
   - Accessibility-first recommendations

2. **Theme Templates**
   - Pre-built industry templates
   - Festival/seasonal themes
   - Emergency alert themes

3. **Advanced Customization**
   - Component-level overrides
   - Custom animations
   - Typography scales

4. **Analytics**
   - Track theme usage
   - Popular color combinations
   - Accessibility compliance rates

5. **Multi-Society Sync**
   - Copy themes between societies
   - Theme inheritance
   - Bulk updates

## Support

For issues or questions, refer to:
- Backend: `/backend/controllers/themeController.js`
- Frontend: `/frontend/src/context/ThemeContext.jsx`
- Design System: `/frontend/src/styles/designTokens.js`
- Styles: `/frontend/src/styles/theme.css`
