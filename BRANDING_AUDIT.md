# Nexora SAAS - Complete Branding Audit

**Generated:** 2026-06-14
**Current Brand Name:** NEXORA
**Project:** Smart Society Management Platform

---

## EXECUTIVE SUMMARY

This document provides a comprehensive inventory of all branding elements in the Nexora SAAS application. The current branding is "NEXORA" - a multi-tenant property management platform. All instances where branding appears are documented below with exact file paths and line numbers for easy navigation and replacement.

---

## 1. CURRENT APPLICATION BRANDING

### Main Brand Identity
- **Brand Name:** NEXORA
- **Tagline:** Smart Society Management Platform
- **Short Name:** NEXORA
- **Initials:** N
- **Support Email:** contact@nexora.com

### Locations with Brand Name
1. **[fullstack-project/frontend/src/config/brand.js](fullstack-project/frontend/src/config/brand.js)** (Lines 1-20)
   - Primary brand configuration file
   - Defines BRAND object with all branding properties
   - Contains: name, tagline, shortName, initials, logo paths, favicon, supportEmail

2. **[fullstack-project/frontend/index.html](fullstack-project/frontend/index.html)** (Line 10)
   - HTML title tag: `<title>NEXORA</title>`

3. **[fullstack-project/frontend/public/manifest.webmanifest](fullstack-project/frontend/public/manifest.webmanifest)** (Lines 2-3)
   - PWA manifest name: "NEXORA"
   - PWA short_name: "NEXORA"
   - Description: "Smart Society Management Platform"

4. **[fullstack-project/backend/utils/mailer.js](fullstack-project/backend/utils/mailer.js)** (Lines 23-25)
   - Email branding constants:
     - BRAND_NAME = "NEXORA"
     - BRAND_TAGLINE = "Smart Society Management Platform"
     - BRAND_COLOR = "#14B8A6"

5. **[fullstack-project/frontend/src/context/ThemeContext.jsx](fullstack-project/frontend/src/context/ThemeContext.jsx)** (Lines 213, 214)
   - Default theme branding:
     - brand_name: 'NEXORA'
     - logo_url: '/nexora-logo.png'

6. **[fullstack-project/frontend/src/contexts/ThemeProvider.jsx](fullstack-project/frontend/src/contexts/ThemeProvider.jsx)** (Lines 219, 220)
   - Default theme configuration:
     - brand_name: 'NEXORA'
     - logo_url: '/nexora-logo.png'

7. **[fullstack-project/frontend/src/pages/PremiumDashboardTemplate.jsx](fullstack-project/frontend/src/pages/PremiumDashboardTemplate.jsx)** (Line 300)
   - Dashboard hardcoded text: "NEXORA"

8. **[fullstack-project/frontend/src/pages/PremiumLoginPage.jsx](fullstack-project/frontend/src/pages/PremiumLoginPage.jsx)** (Line 162)
   - Login page text: "Modern NEXORA"

9. **[fullstack-project/frontend/src/components/AuthLayout.jsx](fullstack-project/frontend/src/components/AuthLayout.jsx)** (Line 13)
   - Auth component eyebrow text: "NEXORA"

---

## 2. LOGO FILES AND LOCATIONS

### Logo Format: SVG, PNG

#### Frontend Public Assets
| Location | Type | Dimensions | Usage |
|----------|------|-----------|-------|
| [fullstack-project/frontend/public/nexora-logo.png](fullstack-project/frontend/public/nexora-logo.png) | SVG | 512x512+ | Main logo, PWA icon, branding |
| [fullstack-project/frontend/public/nexora-favicon.png](fullstack-project/frontend/public/nexora-favicon.png) | SVG | 64x64+ | Browser favicon, apple-touch-icon |
| [fullstack-project/frontend/public/icons.svg](fullstack-project/frontend/public/icons.svg) | SVG | Multiple | Icon library |

#### Project Assets
| Location | Type | Dimensions | Usage |
|----------|------|-----------|-------|
| [fullstack-project/Image/Logo.png](fullstack-project/Image/Logo.png) | PNG | ? | Project reference image |
| [fullstack-project/frontend/src/assets/hero.png](fullstack-project/frontend/src/assets/hero.png) | PNG | ? | Landing page hero image |

### Logo References in Code

1. **HTML Head - [fullstack-project/frontend/index.html](fullstack-project/frontend/index.html)**
   - Line 5: `<link rel="icon" type="image/svg+xml" href="/nexora-favicon.png" />`
   - Line 6: `<link rel="apple-touch-icon" href="/nexora-logo.png" />`

2. **Frontend Config - [fullstack-project/frontend/src/config/brand.js](fullstack-project/frontend/src/config/brand.js)**
   - logo: "/nexora-logo.png"
   - logoLight: "/nexora-logo.png"
   - logoDark: "/nexora-logo.png"
   - favicon: "/nexora-favicon.png"

3. **Components Using Logo**
   - [fullstack-project/frontend/src/components/BrandLogo.jsx](fullstack-project/frontend/src/components/BrandLogo.jsx) - Main logo component
   - [fullstack-project/frontend/src/admin/components/Sidebar.jsx](fullstack-project/frontend/src/admin/components/Sidebar.jsx) - Admin sidebar logo
   - [fullstack-project/frontend/src/components/SocietySwitcher.jsx](fullstack-project/frontend/src/components/SocietySwitcher.jsx) - Society logo switcher

4. **Theme System**
   - [fullstack-project/frontend/src/context/ThemeContext.jsx](fullstack-project/frontend/src/context/ThemeContext.jsx) - Lines 79-80 (CSS variables)
   - [fullstack-project/frontend/src/contexts/ThemeProvider.jsx](fullstack-project/frontend/src/contexts/ThemeProvider.jsx) - Lines 97-98 (CSS variables)

---

## 3. PAGE TITLES AND HTML META TAGS

### HTML Title Tags
| File | Current Title |
|------|---|
| [fullstack-project/frontend/index.html](fullstack-project/frontend/index.html) | NEXORA |

### Title Generation Function
**File:** [fullstack-project/frontend/src/config/brand.js](fullstack-project/frontend/src/config/brand.js) (Lines 18-20)
```javascript
export function getBrandedTitle(pageTitle) {
  return pageTitle ? `${pageTitle} | ${BRAND.name}` : BRAND.name;
}
```
- Used to generate page titles dynamically: `PageName | NEXORA`

### HTML Meta Tags
**File:** [fullstack-project/frontend/index.html](fullstack-project/frontend/index.html)
- Line 4: `<meta charset="UTF-8" />`
- Line 5: Favicon reference
- Line 7: PWA manifest reference
- Line 8: `<meta name="theme-color" content="#14B8A6" />` (Teal theme color)
- Line 9: Viewport settings

### PWA Manifest
**File:** [fullstack-project/frontend/public/manifest.webmanifest](fullstack-project/frontend/public/manifest.webmanifest)
```json
{
  "name": "NEXORA",
  "short_name": "NEXORA",
  "description": "Smart Society Management Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#020617",
  "theme_color": "#14B8A6"
}
```

---

## 4. EMAIL TEMPLATES

### Email Service Configuration
**File:** [fullstack-project/backend/utils/mailer.js](fullstack-project/backend/utils/mailer.js)

#### SMTP Configuration
- Lines 4-10: SMTP connection settings
  - HOST: `process.env.SMTP_HOST || process.env.EMAIL_HOST`
  - PORT: `process.env.SMTP_PORT || process.env.EMAIL_PORT || 587`
  - SECURE: `process.env.SMTP_SECURE || process.env.EMAIL_SECURE`
  - USER: `process.env.SMTP_USER || process.env.EMAIL_USER`
  - PASS: `process.env.SMTP_PASS || process.env.EMAIL_PASS`
  - FROM: `process.env.SMTP_FROM || process.env.EMAIL_FROM`

#### Brand Configuration in Emails
- Line 23: `const BRAND_NAME = "NEXORA";`
- Line 24: `const BRAND_TAGLINE = "Smart Society Management Platform";`
- Line 25: `const BRAND_COLOR = "#14B8A6";`

#### Email Template Shell Function
**Function:** `brandedEmailShell()`  (Lines 27-50)
- Uses branded header with NEXORA logo
- Branded footer with "Sent securely by NEXORA"
- Teal accent color (#14B8A6)

#### Specific Email Templates

1. **OTP Email** - Lines 84-128
   - Function: `sendOtpEmail({ to, otp, purpose })`
   - Subject: "Your OTP is: {OTP}"
   - Uses branded shell

2. **Account Deletion Email** - Lines 131-163
   - Function: `sendAccountDeletionEmail({ to, name, reason })`
   - Subject: "Your account has been deleted"
   - Uses branded shell

3. **Visitor Arrival Email** - Lines 164+
   - Function: `sendVisitorArrivalEmails()`
   - Uses branded shell

### AI-Generated Email Templates
**File:** [fullstack-project/backend/services/geminiAIService.js](fullstack-project/backend/services/geminiAIService.js) (Lines 432-445)
- Function: `generateEmail(recipient, subject, context)`
- Generates professional emails with AI
- Can include branded footer

### Backend Branding in Responses
**File:** [fullstack-project/backend/controllers/dashboardController.js](fullstack-project/backend/controllers/dashboardController.js) (Line 159)
```javascript
logoUrl: society.logo_url || null,
```

---

## 5. DASHBOARD AND NAVIGATION BRANDING

### Navigation Components

#### Top Navigation Bar
**File:** [fullstack-project/frontend/src/components/TopNavbar.jsx](fullstack-project/frontend/src/components/TopNavbar.jsx)
- Line 11: Header element with sticky positioning
- Line 27: Society information display
- Lines 27+: Title and breadcrumb information

#### Admin Navigation
**File:** [fullstack-project/frontend/src/admin/components/Navbar.jsx](fullstack-project/frontend/src/admin/components/Navbar.jsx)
- Notification management
- Admin dashboard navigation

### Sidebar Components

#### Main Sidebar
**File:** [fullstack-project/frontend/src/components/Sidebar.jsx](fullstack-project/frontend/src/components/Sidebar.jsx) (Lines 99-215)
- Logo Section (Lines 20-28)
- Displays "BrandLogo" component
- Society workspace context text
- Navigation items

#### Admin Sidebar
**File:** [fullstack-project/frontend/src/admin/components/Sidebar.jsx](fullstack-project/frontend/src/admin/components/Sidebar.jsx)
- Line 4: Imports BrandLogo
- Line 20: Logo Section comment
- Line 25: Logo icon variant
- Line 28: Logo compact variant
- Line 29: "Admin Dashboard" text

#### Premium Sidebar
**File:** [fullstack-project/frontend/src/components/layout/premium/Sidebar.jsx](fullstack-project/frontend/src/components/layout/premium/Sidebar.jsx)
- Advanced premium sidebar with glass effect
- Logo in header (Lines 99-130)
- Footer support (Lines 179-182)
- Navigation menu (Lines 135-177)

### Dashboard Headers

#### Dashboard Page
**File:** [fullstack-project/frontend/src/pages/DashboardPage.jsx](fullstack-project/frontend/src/pages/DashboardPage.jsx)
- Line 218: "Analytics Dashboard" heading
- Line 378: Dashboard description text

#### Owner Dashboard
**File:** [fullstack-project/frontend/src/pages/OwnerDashboardPage.jsx](fullstack-project/frontend/src/pages/OwnerDashboardPage.jsx) (Line 310)
- Sidebar navigation with "Owner dashboard navigation" label

#### Chairman Dashboard
**File:** [fullstack-project/frontend/src/pages/ChairmanSecretaryDashboardPage.jsx](fullstack-project/frontend/src/pages/ChairmanSecretaryDashboardPage.jsx) (Line 559)
- Displays: `{society?.name || societyContext?.society?.name || "Society Dashboard"}`

#### Admin Dashboard
**File:** [fullstack-project/frontend/src/pages/AdminOverviewPage.jsx](fullstack-project/frontend/src/pages/AdminOverviewPage.jsx) (Line 332)
- Navigation label: "Chairman dashboard sections"

#### Premium Dashboard Template
**File:** [fullstack-project/frontend/src/pages/PremiumDashboardTemplate.jsx](fullstack-project/frontend/src/pages/PremiumDashboardTemplate.jsx)
- Lines 38-40: Navigation items
- Line 300: Hardcoded "NEXORA" text
- Line 343: "Dashboard Content" section

### Dashboard Layout Components
**File:** [fullstack-project/frontend/src/components/DashboardLayout.jsx](fullstack-project/frontend/src/components/DashboardLayout.jsx)
- Lines 93-107: Sidebar integration in layout

---

## 6. FOOTER BRANDING

### Landing Page Footer
**File:** [fullstack-project/frontend/src/App.jsx](fullstack-project/frontend/src/App.jsx) (Lines 748-758)
```jsx
<footer className="landing-footer glass-panel" id="contact">
  <div className="footer-note">
    {/* Footer content */}
  </div>
</footer>
```

### Footer Styling
- CSS class: `landing-footer`
- Glass panel effect styling applied
- ID: "contact" for anchor navigation

---

## 7. CONFIGURATION FILES WITH BRAND SETTINGS

### Frontend Brand Config
**File:** [fullstack-project/frontend/src/config/brand.js](fullstack-project/frontend/src/config/brand.js)
```javascript
export const BRAND = {
  name: "NEXORA",
  tagline: "Smart Society Management Platform",
  shortName: "NEXORA",
  initials: "N",
  logo: "/nexora-logo.png",
  logoLight: "/nexora-logo.png",
  logoDark: "/nexora-logo.png",
  favicon: "/nexora-favicon.png",
  supportEmail: "contact@nexora.com",
};

export function getBrandedTitle(pageTitle) {
  return pageTitle ? `${pageTitle} | ${BRAND.name}` : BRAND.name;
}
```

### Frontend API Config
**File:** [fullstack-project/frontend/src/config/api.js](fullstack-project/frontend/src/config/api.js)
- API endpoint configuration
- No brand-specific content

### Backend Mailer Config
**File:** [fullstack-project/backend/utils/mailer.js](fullstack-project/backend/utils/mailer.js)
- SMTP configuration via environment variables
- Brand constants (Lines 23-25)
- Email template functions

### Environment Variables Required
```
SMTP_HOST / EMAIL_HOST
SMTP_PORT / EMAIL_PORT
SMTP_SECURE / EMAIL_SECURE
SMTP_USER / EMAIL_USER
SMTP_PASS / EMAIL_PASS
SMTP_FROM / EMAIL_FROM
```

---

## 8. IMAGE DIRECTORIES AND LOGO LOCATIONS

### Public Directory Structure
**Path:** `fullstack-project/frontend/public/`
```
public/
├── nexora-favicon.png                    # Browser favicon
├── nexora-logo.png             # Main logo
├── icons.svg                     # Icon library
├── manifest.webmanifest          # PWA manifest
└── push-sw.js                    # Service worker
```

### Assets Directory
**Path:** `fullstack-project/frontend/src/assets/`
```
assets/
├── hero.png                      # Landing page hero
├── vite.svg                      # Vite logo (framework)
└── react.svg                     # React logo (framework)
```

### Project Images
**Path:** `fullstack-project/Image/`
```
Image/
└── Logo.png                      # Project logo reference
```

---

## 9. PUBLIC DIRECTORY STRUCTURE

### Frontend Public Directory
**Location:** `fullstack-project/frontend/public/`

| File | Purpose | Format |
|------|---------|--------|
| [nexora-favicon.png](fullstack-project/frontend/public/nexora-favicon.png) | Browser tab icon | SVG |
| [nexora-logo.png](fullstack-project/frontend/public/nexora-logo.png) | Application logo | SVG |
| [icons.svg](fullstack-project/frontend/public/icons.svg) | Icon library | SVG |
| [manifest.webmanifest](fullstack-project/frontend/public/manifest.webmanifest) | PWA manifest | JSON |
| [push-sw.js](fullstack-project/frontend/public/push-sw.js) | Service worker | JavaScript |

### HTML Entry Point
**File:** [fullstack-project/frontend/index.html](fullstack-project/frontend/index.html)
- Main HTML template
- References all public assets
- PWA manifest link
- Meta tags for branding

---

## 10. AUTHENTICATION PAGE LAYOUTS

### Login Pages

#### Standard Login Page
**File:** [fullstack-project/frontend/src/pages/LoginPage.jsx](fullstack-project/frontend/src/pages/LoginPage.jsx)
- Multi-society login with society code field
- Uses BrandLogo component
- NEXORA branding in auth layout

#### Premium Login Page
**File:** [fullstack-project/frontend/src/pages/PremiumLoginPage.jsx](fullstack-project/frontend/src/pages/PremiumLoginPage.jsx) (Line 162)
- Text: "Modern NEXORA"
- Premium UI styling
- Apple + Linear inspired design

#### Super Admin Login
**File:** [fullstack-project/frontend/src/pages/SuperAdminLoginPage.jsx](fullstack-project/frontend/src/pages/SuperAdminLoginPage.jsx)
- Super admin authentication
- SaaS platform admin access

### Registration Pages

#### Standard Registration
**File:** [fullstack-project/frontend/src/pages/RegisterPage.jsx](fullstack-project/frontend/src/pages/RegisterPage.jsx)
- User registration with society code
- Branded auth layout

#### Super Admin Registration
**File:** [fullstack-project/frontend/src/pages/SuperAdminForgotPasswordPage.jsx](fullstack-project/frontend/src/pages/SuperAdminForgotPasswordPage.jsx)
- Super admin onboarding

### OTP Verification Pages

#### Email OTP Verification
**File:** [fullstack-project/frontend/src/pages/OtpVerificationPage.jsx](fullstack-project/frontend/src/pages/OtpVerificationPage.jsx)
- Email OTP entry
- Branded verification flow

#### Super Admin OTP
**File:** [fullstack-project/frontend/src/pages/SuperAdminVerifyOtpPage.jsx](fullstack-project/frontend/src/pages/SuperAdminVerifyOtpPage.jsx)
- Super admin OTP verification

#### Verify OTP Page
**File:** [fullstack-project/frontend/src/pages/VerifyOtpPage.jsx](fullstack-project/frontend/src/pages/VerifyOtpPage.jsx) (Line 97)
- Button text: "Continue To Dashboard"
- Dashboard navigation

### Password Recovery Pages

#### Forgot Password
**File:** [fullstack-project/frontend/src/pages/ForgotPasswordPage.jsx](fullstack-project/frontend/src/pages/ForgotPasswordPage.jsx)
- Password reset initiation

#### Super Admin Password Reset
**File:** [fullstack-project/frontend/src/pages/SuperAdminResetPasswordPage.jsx](fullstack-project/frontend/src/pages/SuperAdminResetPasswordPage.jsx)
- Super admin password management

### Auth Layout Component
**File:** [fullstack-project/frontend/src/components/AuthLayout.jsx](fullstack-project/frontend/src/components/AuthLayout.jsx) (Line 13)
- eyebrow = "NEXORA"
- Common layout for all auth pages
- Branding applied globally to auth flows

### Auth Hero Component
**File:** [fullstack-project/frontend/src/components/AuthHero.jsx](fullstack-project/frontend/src/components/AuthHero.jsx) (Line 61)
- auth-platform-preview__header styling
- Hero section for auth pages

---

## 11. PDF GENERATION CODE

### Invoice Generation
**File:** [fullstack-project/backend/controllers/billController.js](fullstack-project/backend/controllers/billController.js)

#### PDF Generation Functions
1. **buildInvoicePdf()** - Lines 72-110
   - Creates PDF invoice document
   - Uses PDFKit library
   - Invoice title and formatting

2. **buildInvoicePayload()** - Lines 25-62
   - Prepares invoice data
   - Invoice number, date, resident info
   - Line items and totals

3. **streamPdfResponse()** - Lines 63-70
   - Streams PDF to client
   - Sets Content-Type: application/pdf
   - A4 page size, 40px margins

4. **downloadInvoicePdf()** - Lines 734-755
   - Invoice download endpoint
   - Filename: `invoice-${invoiceNumber}.pdf`

#### Invoice Content Structure
**Lines 72-110:**
```
- Invoice Title
- Invoice Number
- Invoice Date
- Bill To (Resident info)
- Item Description
- Amount and Tax
- Total Due
```

#### API Endpoints

**Generate Invoice Endpoint**
- Route: `/api/bills/{billId}/invoice` [GET]
- Controller: [billController.js](fullstack-project/backend/controllers/billController.js) - Line 712
- Returns invoice JSON or PDF

**Download Invoice PDF**
- Route: `/api/bills/{billId}/download-invoice` [GET]
- Controller: [billController.js](fullstack-project/backend/controllers/billController.js) - Line 734
- Returns PDF file stream

#### Export Functions

1. **Export as CSV** - Lines 114-153
   - Function: `exportBillingReport()`
   - Columns: Invoice, Resident, Flat, Type, Status, Payment Status, Total, Paid, Balance, Due Date, Created At
   - Filename: `billing-report.csv`

2. **Export as Excel** - Lines 154-193
   - Uses ExcelJS library
   - Sheet name: "Billing Report"
   - Formatted headers and data
   - Filename: `billing-report.xlsx`

### Library Dependencies
**File:** [fullstack-project/backend/package.json](fullstack-project/backend/package.json)
- `pdfkit` - PDF generation
- `exceljs` - Excel export
- `axios` - HTTP requests

---

## 12. BRAND LOGO COMPONENT

### BrandLogo Component
**File:** [fullstack-project/frontend/src/components/BrandLogo.jsx](fullstack-project/frontend/src/components/BrandLogo.jsx)

#### Component Props
- `to`: Navigation link (default: "/")
- `variant`: Logo type - "full", "compact", "icon"
- `animated`: Enable framer-motion animation (default: true)
- `className`: Additional CSS classes

#### Logo Variants
1. **Full** - Logo mark + text + tagline
2. **Compact** - Logo mark + text (no tagline)
3. **Icon** - Logo mark only

#### Rendering
```jsx
<span className={`brand-logo brand-logo--${variant}`}>
  <span className="brand-logo__mark">
    <img src={BRAND.logo} alt="" />
  </span>
  {showText && (
    <span className="brand-logo__text">
      <strong>{BRAND.name}</strong>
      {variant === "full" && <em>{BRAND.tagline}</em>}
    </span>
  )}
</span>
```

#### Animation
- Uses Framer Motion library
- Opacity, Y position, scale animation
- Duration: 0.45s
- Easing: Custom cubic-bezier

#### Link Behavior
- Links to specified `to` prop (default: home "/")
- Accessible with proper aria-label
- Optional - can render without link wrapper

---

## 13. THEME/BRANDING SYSTEM (WHITE-LABEL SUPPORT)

### Theme Management System
**Backend Controller:** [fullstack-project/backend/controllers/themeController.js](fullstack-project/backend/controllers/themeController.js)

#### Theme Functions
1. **listThemes()** - Line 52
2. **getCurrentTheme()** - Line 61
3. **updateTheme()** - Line 75
4. **generateTheme()** - Line 100

#### Branding Fields Managed
- `logoUrl` - Logo image URL
- `faviconUrl` - Favicon URL
- `primaryColor` - Primary brand color
- `secondaryColor` - Secondary brand color
- `accentColor` - Accent color
- `fontFamily` - Brand font
- `theme.mode` - Light/Dark mode
- `theme.density` - UI density (comfortable/compact)
- `theme.layout` - Layout style (glass/clean)
- `theme.heroGradient` - Hero section gradient
- `theme.navigationStyle` - Nav bar style
- `theme.radius` - Border radius preset
- `theme.background` - Background style

### Theme Model
**File:** [fullstack-project/backend/models/themeModel.js](fullstack-project/backend/models/themeModel.js)

#### Database Fields
- `theme_primary` - Primary color
- `theme_secondary` - Secondary color
- `theme_accent` - Accent color
- `theme_mode` - Light/Dark
- `theme_gradient_style` - Gradient preset
- `logo_url` - Logo URL
- `logo_dark_url` - Dark mode logo
- `brand_name` - Society brand name
- `accent_radius` - Border radius
- `theme_preset` - Theme preset selection
- `custom_css` - Custom CSS overrides

#### Theme API Routes
**File:** [fullstack-project/backend/routes/themeRoutes.js](fullstack-project/backend/routes/themeRoutes.js)

| Method | Endpoint | Controller | Auth |
|--------|----------|-----------|------|
| GET | /presets/list | getThemePresets | Public |
| GET | /my-theme | getMyTheme | Authenticated |
| GET | /subdomain/:subdomain | getThemeBySubdomain | Public |
| GET | /societies | listThemes | Super Admin/Admin |
| GET | /current | getCurrentTheme | Authenticated |
| PATCH | /:id | updateTheme | Super Admin/Admin |
| POST | /generate | generateTheme | Super Admin/Admin |

### Branding Update Endpoints
**File:** [fullstack-project/backend/routes/tenantRoutes.js](fullstack-project/backend/routes/tenantRoutes.js)

| Method | Endpoint | Controller | Auth |
|--------|----------|-----------|------|
| PATCH | /:id/branding | updateBranding | Super Admin/Admin |
| PATCH | /:code/branding-by-code | updateBrandingByCode | Super Admin/Admin |

### Frontend Theme Context
**File:** [fullstack-project/frontend/src/context/ThemeContext.jsx](fullstack-project/frontend/src/context/ThemeContext.jsx)

#### Default Theme Configuration (Lines 212-214)
```javascript
logo_url: '/nexora-logo.png',
brand_name: 'NEXORA',
logo_url: '/nexora-logo.png',
```

#### CSS Variables Applied
- `--brand-name` - Brand name CSS variable
- `--logo-url` - Logo URL as CSS background
- `--sidebar-style` - Sidebar styling

### Frontend Theme Provider
**File:** [fullstack-project/frontend/src/contexts/ThemeProvider.jsx](fullstack-project/frontend/src/contexts/ThemeProvider.jsx)

#### CSS Variable Application (Lines 94-98)
```javascript
if (themeData.brand_name) {
  root.style.setProperty('--brand-name', `"${themeData.brand_name}"`);
}
if (themeData.logo_url) {
  root.style.setProperty('--brand-logo-url', `url(${themeData.logo_url})`);
}
```

### Theme Manager Component
**File:** [fullstack-project/frontend/src/components/ThemeManager.jsx](fullstack-project/frontend/src/components/ThemeManager.jsx)

#### Editable Fields
- brand_name (Line 328-329)
- sidebar_style (Line 284-285)
- Primary/Secondary/Accent colors
- Font family selection
- Theme presets

---

## 14. BRANDING IN DATABASE SCHEMA

### Society Branding Table
**SQL Location:** [fullstack-project/backend/database/saas-enhancements.sql](fullstack-project/backend/database/saas-enhancements.sql)

#### Key Tables with Branding

1. **societies** table
   - id: PK
   - name: Society name
   - code: Society code
   - logo_url: Logo URL
   - status: Active/Inactive
   - subscription_plan: Plan type
   - created_at: Timestamp

2. **society_brandings** table (referenced in queries)
   - society_id: FK to societies
   - logo_url: Logo image URL
   - favicon_url: Favicon URL
   - theme_json: Theme JSON config
   - brand_name: Display name

3. **builders** table
   - logo_url: Builder logo
   - name: Builder name
   - website: Website URL

### Sample Queries
**File:** [fullstack-project/backend/routes/publicSocietyRoutes.js](fullstack-project/backend/routes/publicSocietyRoutes.js) (Lines 43-52)
```sql
SELECT
  s.id,
  s.name,
  s.code,
  b.logo_url,
  b.favicon_url,
  b.theme_json
FROM societies s
LEFT JOIN society_brandings b ON b.society_id = s.id
```

---

## 15. NAVIGATION AND SITE STRUCTURE

### Top-Level Navigation
**Component:** [TopNavbar.jsx](fullstack-project/frontend/src/components/TopNavbar.jsx)
- Sticky header positioning
- Society selector
- Theme toggle
- Notification center
- User profile menu

### Sidebar Navigation
**Component:** [Sidebar.jsx](fullstack-project/frontend/src/components/Sidebar.jsx)
- Role-based navigation
- Logo section with BrandLogo
- Main navigation menu
- Workspace context ("Society Command", "Approval Center", etc.)

### Admin Sidebar
**Component:** [fullstack-project/frontend/src/admin/components/Sidebar.jsx](fullstack-project/frontend/src/admin/components/Sidebar.jsx)
- Admin-specific navigation
- "Admin Dashboard" label
- System management options

### Authentication Navigation
**Component:** [AuthLayout.jsx](fullstack-project/frontend/src/components/AuthLayout.jsx)
- Auth page header with "NEXORA" branding
- Authentication form container
- Back-to-home link

---

## 16. PUBLIC WEBSITE AND LANDING PAGE

### Landing Page
**File:** [fullstack-project/frontend/src/App.jsx](fullstack-project/frontend/src/App.jsx) (Lines 125-758)

#### Hero Section (Lines 473-533)
- Header with navigation
- Main call-to-action
- Feature showcase

#### Feature Sections (Lines 665-746)
- Section headers with SectionHeader component
- Feature cards with description
- Platform capabilities

#### Footer (Lines 748-758)
- Contact footer
- Footer notes

#### Page Structure
- SectionHeader component (Lines 146-156)
- Motion animations with Framer Motion
- Responsive grid layouts
- Contact section with ID anchor

### Premium Landing Page
**File:** [fullstack-project/frontend/src/pages/PremiumLandingPage.jsx](fullstack-project/frontend/src/pages/PremiumLandingPage.jsx)
- Premium UI design
- Society showcase (Line 110)
- Logo display from society.logo_url

---

## 17. MULTI-TENANT BRANDING SUPPORT

### Society-Specific Branding

#### Society Context
**File:** [fullstack-project/frontend/src/contexts/SocietyContext.jsx](fullstack-project/frontend/src/contexts/SocietyContext.jsx)
```javascript
logo_url: rawSociety?.logo_url || rawSociety?.logoUrl || ""
```
- Per-society logo management
- Multiple society support
- Dynamic logo switching

#### Tenant Model Functions
**File:** [fullstack-project/backend/models/tenantModel.js](fullstack-project/backend/models/tenantModel.js)
- `updateTenantBranding()` - Update society branding
- `getTenantContextBySocietyId()` - Fetch society branding

#### Society Switcher Component
**File:** [fullstack-project/frontend/src/components/SocietySwitcher.jsx](fullstack-project/frontend/src/components/SocietySwitcher.jsx) (Lines 15-16)
```jsx
if (society?.logo_url) {
  return <img src={society.logo_url} alt="" />;
}
```

---

## 18. SUMMARY OF REPLACEMENT REQUIREMENTS

### Critical Branding Elements to Replace

| Element | Current Value | Files to Update | Count |
|---------|---------------|-----------------|-------|
| **Brand Name** | NEXORA | 9 files | 15+ instances |
| **Support Email** | contact@nexora.com | 1 file | 1 instance |
| **Logo Files** | /nexora-logo.png | 3 files | - |
| **Favicon** | /nexora-favicon.png | 1 file | - |
| **Theme Color** | #14B8A6 (Teal) | 2 files | 2 instances |
| **Tagline** | Smart Society Management Platform | 2 files | 2 instances |
| **Page Title** | NEXORA | 1 file | 1 instance |
| **PWA Name** | NEXORA | 1 file | 2 instances |
| **Email Brand** | NEXORA | 1 file | 3 instances |

---

## 19. BRANDING REPLACEMENT CHECKLIST

- [ ] Update brand name in `frontend/src/config/brand.js`
- [ ] Update page title in `frontend/index.html`
- [ ] Update PWA manifest (`frontend/public/manifest.webmanifest`)
- [ ] Update email branding in `backend/utils/mailer.js`
- [ ] Replace logo files:
  - [ ] `frontend/public/nexora-logo.png`
  - [ ] `frontend/public/nexora-favicon.png`
- [ ] Update theme colors in context files
- [ ] Update support email in brand config
- [ ] Test logo display in all components:
  - [ ] BrandLogo component
  - [ ] Admin sidebar
  - [ ] Auth pages
  - [ ] Landing page
- [ ] Verify email templates with new branding
- [ ] Update PWA app name and description
- [ ] Test with multiple societies for white-label functionality
- [ ] Verify theme system applies custom society branding
- [ ] Update PDF invoice branding (if needed)
- [ ] Test all authentication pages
- [ ] Verify dashboard navigation branding

---

## 20. ADDITIONAL NOTES

### CSS Variables for Branding
The system uses CSS custom properties for dynamic branding:
- `--brand-name` - Injected from ThemeContext
- `--brand-logo-url` - Logo as background image
- `--logo-url` - Alternative logo variable
- `--sidebar-style` - Sidebar styling

### Multi-Society Support
Each society can have its own:
- Logo (logo_url)
- Branding colors (primaryColor, secondaryColor, accentColor)
- Theme configuration
- Font family
- Custom CSS

### API Response Structure
Branding data returned by API includes:
```json
{
  "branding": {
    "logoUrl": "...",
    "faviconUrl": "...",
    "primaryColor": "#...",
    "secondaryColor": "#...",
    "accentColor": "#...",
    "fontFamily": "...",
    "theme": {
      "mode": "light|dark",
      "density": "...",
      "layout": "...",
      ...
    }
  }
}
```

### Email Brand Constants
Located centrally in `backend/utils/mailer.js` for consistency across all outgoing emails.

### Frontend Configuration
All frontend branding centralized in `frontend/src/config/brand.js` for easy updates and exports across components.

---

## 21. RELATED DOCUMENTATION

- **Theme System:** See `README_THEME_SYSTEM.md` for detailed theme customization
- **Multi-Tenancy:** See `MULTI_SOCIETY_FIX_COMPLETE_GUIDE.md` for society isolation
- **White-Label:** See `WHITELIST_THEME_SYSTEM.md` for white-label capabilities
- **Deployment:** See `DEPLOYMENT_CHECKLIST.md` for deployment considerations

---

**End of Branding Audit Document**
