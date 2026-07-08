# NEXORA Branding - Developer Quick Reference

## 🎯 ONE-PAGE BRAND REFERENCE

### Brand Identity
```
Name:     NEXORA
Tagline:  Smart Society Management Platform
Color:    #14B8A6 (Teal)
Logo:     /nexora-logo.png
Favicon:  /nexora-favicon.png
Email:    contact@nexora.com
```

---

## 🔧 HOW TO USE BRAND IN CODE

### React Components
```jsx
// Import brand config
import { BRAND } from "../config/brand";

// Use brand name
<h1>{BRAND.name}</h1>           // NEXORA
<p>{BRAND.tagline}</p>          // Smart Society Management Platform

// Use logo
<img src={BRAND.logo} alt="" /> // /nexora-logo.png

// Use brand color
<div style={{ color: BRAND.brandColor }}>...</div>
```

### Use BrandLogo Component
```jsx
import BrandLogo from "../components/BrandLogo";

// Full logo with name (desktop)
<BrandLogo variant="full" />

// Compact logo with name (tablet)
<BrandLogo variant="compact" />

// Logo icon only (mobile)
<BrandLogo variant="icon" />
```

### Email Templates (Backend)
```javascript
// Already configured in mailer.js
const BRAND_NAME = "NEXORA";
const BRAND_TAGLINE = "Smart Society Management Platform";
const BRAND_COLOR = "#14B8A6";

// Emails automatically branded via brandedEmailShell()
```

### PDF Generation (Backend)
```javascript
// In billController.js
doc.fontSize(16).fillColor("#14B8A6").text("NEXORA");
doc.fontSize(10).text("Smart Society Management Platform");
// PDF footer automatically adds branding
```

---

## 📂 KEY FILES TO REMEMBER

| Purpose | File | Location |
|---------|------|----------|
| Central brand config | `brand.js` | `frontend/src/config/` |
| Logo component | `BrandLogo.jsx` | `frontend/src/components/` |
| Email branding | `mailer.js` | `backend/utils/` |
| CSS variables | `theme-variables.css` | `frontend/src/styles/` |
| Theme config | `ThemeContext.jsx` | `frontend/src/context/` |
| Logo file (PNG) | `nexora-logo.png` | `frontend/public/` |

---

## 🎨 CHANGING BRAND IN FUTURE

### To change application name, tagline, or color:

1. **Update `frontend/src/config/brand.js`**
```javascript
export const BRAND = {
  name: "YOUR_NEW_NAME",           // Change here
  tagline: "YOUR_NEW_TAGLINE",     // Change here
  // ... rest stays same
};
```

2. **Update `backend/utils/mailer.js`**
```javascript
const BRAND_NAME = "YOUR_NEW_NAME";          // Change here
const BRAND_TAGLINE = "YOUR_NEW_TAGLINE";    // Change here
const BRAND_COLOR = "#YOUR_COLOR";           // Change here
```

3. **Replace logo file**
- Replace `/frontend/public/nexora-logo.png` with your new logo
- Keep the same filename or update all references

4. **Update mobile app**
- Edit `mobile-app/app.json` name and displayName fields

**That's it!** All pages, dashboards, emails, and PDFs automatically update.

---

## 🔍 WHERE BRANDING APPEARS

### Frontend
- ✅ Page titles (browser tab)
- ✅ Navbar logo
- ✅ Sidebar logo
- ✅ Login page
- ✅ Landing page
- ✅ Footer

### Backend
- ✅ Email headers and footers
- ✅ PDF document headers and footers
- ✅ Notification subjects

### Mobile
- ✅ App name on home screen
- ✅ App icon label
- ✅ In-app logo (if used)

### Browser
- ✅ Browser tab icon (favicon)
- ✅ Browser tab title
- ✅ PWA app name
- ✅ Apple touch icon (iOS)

---

## 🚀 CURRENT BRANDING STATUS

- ✅ **Logo:** `/nexora-logo.png` (PNG format)
- ✅ **Favicon:** `/nexora-favicon.png` (SVG format)
- ✅ **All pages:** Using BRAND config
- ✅ **Emails:** Using email branding config
- ✅ **PDFs:** Added with branding header/footer
- ✅ **Mobile:** Updated app name

---

## 🎯 BEST PRACTICES

1. **Always use BrandLogo component** instead of hardcoding logo paths
2. **Always import BRAND config** instead of hardcoding names
3. **Keep centralizing branding** in `brand.js` and `mailer.js`
4. **Use CSS variables** for theme-aware styling
5. **Test in multiple themes** (light/dark mode)
6. **Test on multiple devices** (mobile/tablet/desktop)

---

## 📞 BRANDING SUPPORT

- **Logo not showing?** Check `frontend/public/nexora-logo.png` exists
- **Favicon not updating?** Clear browser cache (Ctrl+Shift+Delete)
- **PWA cache issue?** Clear service worker cache in DevTools
- **Email branding wrong?** Check `backend/utils/mailer.js` constants
- **PDF branding missing?** Check `backend/controllers/billController.js`

---

**Last Updated:** June 14, 2026
**Platform:** NEXORA - Smart Society Management Platform
