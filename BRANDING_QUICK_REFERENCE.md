# Branding Audit - Quick Reference Guide

## Current Branding
- **Brand Name:** NEXORA
- **Tagline:** Smart Society Management Platform
- **Support Email:** contact@nexora.com
- **Primary Logo:** `/nexora-logo.png`
- **Favicon:** `/nexora-favicon.png`
- **Theme Color:** #14B8A6 (Teal)

---

## Critical Files to Update

### 1. Frontend Brand Configuration
**File:** `fullstack-project/frontend/src/config/brand.js`
```javascript
export const BRAND = {
  name: "NEXORA",                    // ← CHANGE THIS
  tagline: "Smart Society Management Platform",  // ← CHANGE THIS
  shortName: "NEXORA",               // ← CHANGE THIS
  initials: "N",                       // ← CHANGE THIS
  logo: "/nexora-logo.png",          // ← UPDATE LOGO FILE
  logoLight: "/nexora-logo.png",     // ← UPDATE LOGO FILE
  logoDark: "/nexora-logo.png",      // ← UPDATE LOGO FILE
  favicon: "/nexora-favicon.png",             // ← UPDATE FAVICON FILE
  supportEmail: "contact@nexora.com",// ← CHANGE THIS
};
```

### 2. HTML Page Title
**File:** `fullstack-project/frontend/index.html` (Line 10)
```html
<title>NEXORA</title>  <!-- CHANGE THIS -->
```

### 3. PWA Manifest
**File:** `fullstack-project/frontend/public/manifest.webmanifest`
```json
{
  "name": "NEXORA",                    // ← CHANGE THIS
  "short_name": "NEXORA",             // ← CHANGE THIS
  "description": "Smart Society Management Platform",  // ← CHANGE THIS
  "theme_color": "#14B8A6"              // ← OPTIONAL: Change theme color
}
```

### 4. Email Branding
**File:** `fullstack-project/backend/utils/mailer.js` (Lines 23-25)
```javascript
const BRAND_NAME = "NEXORA";                              // ← CHANGE THIS
const BRAND_TAGLINE = "Smart Society Management Platform"; // ← CHANGE THIS
const BRAND_COLOR = "#14B8A6";                             // ← OPTIONAL: Change color
```

### 5. Logo Files
Replace these files with new branding:
- `fullstack-project/frontend/public/nexora-logo.png` → New logo (512x512+)
- `fullstack-project/frontend/public/nexora-favicon.png` → New favicon (64x64+)

---

## Theme Context Files (Optional: Update Defaults)

### Default Theme - Context
**File:** `fullstack-project/frontend/src/context/ThemeContext.jsx` (Lines 212-214)
```javascript
logo_url: '/nexora-logo.png',    // ← UPDATE IF NEW LOGO PATH
brand_name: 'NEXORA',            // ← OPTIONAL: Change default
```

### Default Theme - Provider
**File:** `fullstack-project/frontend/src/contexts/ThemeProvider.jsx` (Lines 219-220)
```javascript
brand_name: 'NEXORA',            // ← OPTIONAL: Change default
logo_url: '/nexora-logo.png',    // ← UPDATE IF NEW LOGO PATH
```

---

## Dashboard Hardcoded Text (Optional)

### Premium Dashboard
**File:** `fullstack-project/frontend/src/pages/PremiumDashboardTemplate.jsx` (Line 300)
```jsx
<p>NEXORA</p>  <!-- CHANGE IF NEEDED -->
```

### Premium Login Page
**File:** `fullstack-project/frontend/src/pages/PremiumLoginPage.jsx` (Line 162)
```jsx
Modern NEXORA  <!-- CHANGE IF NEEDED -->
```

### Auth Layout
**File:** `fullstack-project/frontend/src/components/AuthLayout.jsx` (Line 13)
```jsx
eyebrow = "NEXORA"  <!-- CHANGE IF NEEDED -->
```

---

## API Response Branding (Automatic from Database)

The following are automatically populated from database `society_brandings` table when you update society branding via API:
- Society logo_url
- Theme colors
- Brand name per society
- Custom theme settings

**No code changes needed** - uses white-label system.

---

## Email Template Locations

All email templates are auto-generated using the `brandedEmailShell()` function in:
**File:** `fullstack-project/backend/utils/mailer.js`

Functions:
- `sendOtpEmail()` - OTP emails (Line 84)
- `sendAccountDeletionEmail()` - Account deletion (Line 131)
- `sendVisitorArrivalEmails()` - Visitor notifications (Line 164)

All use `BRAND_NAME`, `BRAND_TAGLINE`, `BRAND_COLOR` constants.

---

## PDF Invoice Branding

PDF invoices are generated in:
**File:** `fullstack-project/backend/controllers/billController.js`

Functions:
- `buildInvoicePdf()` - Builds PDF content (Line 72)
- `downloadInvoicePdf()` - Download endpoint (Line 734)

**Note:** Currently no branding customization in PDF. Add logo/branding if needed.

---

## Logo Component Usage

The `BrandLogo` component is used in:
1. Admin Sidebar - `frontend/src/admin/components/Sidebar.jsx`
2. User Sidebar - `frontend/src/components/Sidebar.jsx`
3. Auth Pages - `frontend/src/components/AuthLayout.jsx`
4. Landing Page - Referenced via config

**File:** `frontend/src/components/BrandLogo.jsx`

All automatically pull from `BRAND.logo` config.

---

## Multi-Society Branding (White-Label)

Each society can have custom branding:

**API Endpoint to Update:**
```
PATCH /api/tenant/:id/branding
PATCH /api/tenant/:code/branding-by-code
```

**Request Body:**
```json
{
  "logoUrl": "https://...",
  "faviconUrl": "https://...",
  "primaryColor": "#...",
  "secondaryColor": "#...",
  "accentColor": "#...",
  "fontFamily": "Arial, sans-serif",
  "theme": {
    "mode": "light",
    "density": "comfortable",
    "layout": "glass",
    ...
  }
}
```

**No code changes needed** - automatically applies to that society's UI.

---

## Testing Checklist

- [ ] Brand name appears on all pages
- [ ] Logo displays in sidebar
- [ ] Favicon appears in browser tab
- [ ] PWA manifest has new name
- [ ] Emails include new branding
- [ ] Page titles show new name
- [ ] PDF invoices (optional) show new branding
- [ ] Multi-society branding works independently
- [ ] Theme system applies custom logos
- [ ] No broken image references

---

## Environment Variables Needed

For email sending (backend):
```
SMTP_HOST=...
SMTP_PORT=...
SMTP_SECURE=true/false
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=noreply@company.com
```

---

## File Summary Table

| File | Change Type | Priority | Lines |
|------|------------|----------|-------|
| `frontend/src/config/brand.js` | Config | CRITICAL | 1-20 |
| `frontend/index.html` | HTML | CRITICAL | 10 |
| `frontend/public/manifest.webmanifest` | JSON | CRITICAL | 2-3 |
| `backend/utils/mailer.js` | Config | CRITICAL | 23-25 |
| `frontend/public/nexora-logo.png` | Asset | CRITICAL | - |
| `frontend/public/nexora-favicon.png` | Asset | CRITICAL | - |
| `frontend/src/context/ThemeContext.jsx` | Config | Optional | 213-214 |
| `frontend/src/contexts/ThemeProvider.jsx` | Config | Optional | 219-220 |
| `frontend/src/pages/PremiumDashboardTemplate.jsx` | UI Text | Optional | 300 |
| `frontend/src/pages/PremiumLoginPage.jsx` | UI Text | Optional | 162 |
| `frontend/src/components/AuthLayout.jsx` | Component | Optional | 13 |

---

## Quick Search Commands

Find all "NEXORA" references:
```bash
grep -r "NEXORA" fullstack-project/frontend/src/
grep -r "NEXORA" fullstack-project/backend/
```

Find all logo references:
```bash
grep -r "NEXORA-logo" fullstack-project/
grep -r "favicon" fullstack-project/frontend/
```

Find all brand config references:
```bash
grep -r "BRAND\." fullstack-project/frontend/
grep -r "BRAND_" fullstack-project/backend/
```

---

## Impact Analysis

### Frontend Impact
- Logo updates: Will affect all pages with BrandLogo component
- Config updates: Will cascade to all components importing BRAND
- PWA manifest: Affects app name in installed PWA

### Backend Impact
- Mailer constants: Affects all outgoing emails
- Theme API: Automatically handles multi-society branding (no changes needed)
- PDF generation: Current code has no branding (add if needed)

### Database Impact
- Society branding table automatically stores per-society logos
- Theme generation API creates custom themes
- No schema changes needed

---

**For detailed information, see `BRANDING_AUDIT.md`**
