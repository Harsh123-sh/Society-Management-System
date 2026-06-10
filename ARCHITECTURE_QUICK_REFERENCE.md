# 📊 Architecture Overview - Visual Summary

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        SAAS ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│   FRONTEND       │         │    MOBILE        │
│   React 18.2.0   │◄───────►│   React Native   │
│   Vite (build)   │         │   (Partial)      │
│   TailwindCSS    │         │                  │
└────────┬─────────┘         └──────────────────┘
         │
         │ HTTP/Socket.io
         │
┌────────▼────────────────────────────────────────────┐
│          BACKEND - Express 5.2.1                     │
├────────────────────────────────────────────────────┤
│ ✅ Authentication & JWT                             │
│ ✅ Multi-tenancy (societyId)                        │
│ ❌ Data Isolation (7 endpoints need fix)            │
│ ✅ Rate limiting & Security (Helmet, HPP)          │
│ ⏳ PostgreSQL migration (incomplete)                │
└────────┬────────────────────────────────────────────┘
         │
         │ pg (Node PostgreSQL)
         │
┌────────▼────────────────────────────────────────────┐
│        DATABASE - PostgreSQL (Render)                │
├────────────────────────────────────────────────────┤
│ societies (1:N) users (6 roles, 2 resident types) │
│ bills → charges                                    │
│ complaints → comments → resolution                │
│ visitors → qr_passes → preapprovals               │
│ notices, documents, parking, chat, bookings       │
│ Total: 49 tables                                  │
└────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐
│  Cloudinary      │     │  Gemini AI       │
│  (Photos/Docs)   │     │  (Assistant)     │
└──────────────────┘     └──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│  Razorpay        │     │  Firebase Admin  │
│  (Payments)      │     │  (Push Notif)    │
└──────────────────┘     └──────────────────┘
```

---

## Authentication Flow

```
User Login
    ↓
LoginPage.jsx (enter email, password, societyCode)
    ↓
POST /api/auth/login
    ↓
authController.validateLoginCredentials()
    ↓
Check: email + society_id + password match
    ↓
Generate JWT with societyId embedded
    ↓
Return token → localStorage
    ↓
Redirect to /dashboard
    ↓
ProtectedRoute checks token + role
    ↓
All API requests: Authorization: Bearer TOKEN
    ↓
Backend: authenticateToken() validates JWT
    ↓
✅ Access granted with req.user.societyId
❌ society_id mismatch → 403 Forbidden
```

---

## Role-Based Access Control (RBAC)

```
Super Admin (Global)
├── Society provisioning
├── Subscription management
├── Global analytics
└── Brand governance

Admin/Chairman (Society-wide)
├── Member management
├── Billing & collections
├── Notice broadcasting
└── Staff oversight

Secretary (Moderator)
├── Approvals
├── Events
├── Documents
└── Meeting records

Staff (Operational)
├── Task queue
├── Attendance
├── Work logs
└── Escalations

Resident (Tenant or Owner)
├── Chat & messaging
├── Payment portal
├── Complaint submission
├── Family management
└── Visitor preapproval

Security (Gate Operations)
├── Visitor approvals
├── Gate logs
├── Alert broadcast
└── Incident reports

Aliases (Normalized):
chairman     → admin
secretary   → secretary
owner       → resident
tenant      → resident
```

---

## API Endpoint Summary (30 Route Files)

| Category | Count | Status |
|----------|-------|--------|
| Authentication | 5 endpoints | ✅ FIXED |
| Users | 8 endpoints | ⏳ PARTIAL |
| Billing | 12 endpoints | ⏳ PARTIAL |
| Complaints | 6 endpoints | ❌ BROKEN |
| Visitors | 18 endpoints | ❌ CRITICAL |
| Notices | 4 endpoints | ✅ MOSTLY |
| Analytics | 10 endpoints | ⏳ PARTIAL |
| Documents | 5 endpoints | ❌ BROKEN |
| Parking | 6 endpoints | ❌ BROKEN |
| Chat | 4 endpoints | ⏳ PARTIAL |
| Others (bookings, themes, audit, etc) | 30 endpoints | ⏳ PARTIAL |

**Total**: 108 API endpoints across 30 route files

---

## Frontend Pages & Routes

### Public Routes
```
/                               → Redirect to /auth/login
/auth/login                     → LoginPage.jsx
/auth/register                  → RegisterPage.jsx
/auth/forgot-password           → ForgotPasswordPage.jsx
/auth/verify-otp                → OtpVerificationPage.jsx
/superadmin/login               → SuperAdminLoginPage.jsx
/superadmin/forgot-password     → SuperAdminForgotPasswordPage.jsx
```

### Protected Routes (ProtectedRoute wrapper)
```
/dashboard                      → DashboardPage.jsx (resident home)
/admin/overview                 → AdminOverviewPage.jsx (admin dashboard)
/admin/user-management          → ChairmanUserManagementPage.jsx
/admin/approvals                → AdminHomePage.jsx

/owner-dashboard                → OwnerDashboardProPage.jsx
/tenant-dashboard               → TenantDashboardPage.jsx

/billing                        → BillingPage.jsx
/complaints                     → ComplaintsPage.jsx (❌ mock data)
/notices                        → NoticesPage.jsx
/visitors                       → VisitorsPage.jsx
/documents                      → DocumentsPage.jsx
/parking                        → ParkingPage.jsx
/chat                           → ChatPage.jsx
/analytics                      → AnalyticsDashboard.jsx
/archive                        → ArchiveCenterPage.jsx
/settings                       → SettingsPage.jsx
/theme-admin                    → ThemeAdminPage.jsx
```

### Super Admin Routes (SuperAdminProtectedRoute wrapper)
```
/superadmin/dashboard           → SuperAdminDashboardPage.jsx
/superadmin/societies           → SuperAdminSocietyDetailsPage.jsx
/superadmin/analytics           → Global analytics
/superadmin/billing             → Global billing
```

### Security Routes (SecurityRouter)
```
/security/dashboard             → Security station
/security/visitors              → Visitor management
/security/face-recognition      → Face recognition UI
/security/qr-verification       → QR code verification
```

---

## Database Schema - Key Relationships

```
societies (1) ──────────┐
                        │ 1:N
                        ├──→ users (6 roles)
                        ├──→ flats/apartments
                        ├──→ bills
                        ├──→ complaints
                        ├──→ visitors
                        ├──→ notices
                        ├──→ documents
                        ├──→ parking_slots
                        ├──→ chat/messages
                        ├──→ bookings
                        ├──→ audit_logs
                        └──→ notifications

users (residents) ──────┐
                        │ 1:N
                        ├──→ flats (resident lives here)
                        ├──→ complaints (raised by)
                        ├──→ bills (assigned to)
                        ├──→ chat_messages (sent by)
                        ├──→ visitor_preapprovals (owner approves)
                        └──→ documents (owned by)

flats ───────────────────┐
                        │ 1:N
                        ├──→ users (residents)
                        ├──→ parking_allocations
                        └──→ owner_properties
```

---

## Feature Status Dashboard

| Feature | Coverage | Status | Risk |
|---------|----------|--------|------|
| **Authentication** | 100% | ✅ FIXED | LOW |
| **Dashboard** | 85% | ✅ MOSTLY | LOW |
| **Billing** | 60% | ⏳ PARTIAL | HIGH |
| **Complaints** | 50% | ❌ BROKEN | HIGH |
| **Visitors** | 40% | ❌ CRITICAL | CRITICAL |
| **Analytics** | 70% | ⏳ PARTIAL | MEDIUM |
| **Chat** | 75% | ⏳ PARTIAL | MEDIUM |
| **Documents** | 60% | ❌ BROKEN | HIGH |
| **Parking** | 50% | ❌ BROKEN | MEDIUM |
| **Notices** | 80% | ✅ MOSTLY | LOW |
| **Themes** | 95% | ✅ COMPLETE | LOW |
| **Payments** | 50% | ⏳ PARTIAL | HIGH |

---

## Middleware Chain (Request Flow)

```
HTTP Request
    ↓
CORS + Helmet (security headers)
    ↓
Rate Limiter (300 req/15min by default)
    ↓
Express JSON parser
    ↓
Route matching
    ↓
authenticateToken()
├─→ Validate JWT exists
├─→ Check token not blacklisted
├─→ Verify signature
└─→ Validate user status (active/rejected)
    ↓
requireSocietyAccess()
├─→ Check req.user.societyId exists
└─→ Validate society is active
    ↓
authorizeRoles()
├─→ Normalize role (chairman → admin)
└─→ Check role in allowed list
    ↓
validationMiddleware()
├─→ Validate request params
├─→ Validate request body
└─→ Validate response format
    ↓
Controller logic
    ↓
✅ Response with data
❌ Response with error
    ↓
errorHandler()
├─→ Format error response
└─→ Log error
    ↓
HTTP Response
```

---

## State Management (Frontend)

```
No Redux/Zustand - Using React Context + localStorage

Local Storage
├── token (JWT)
├── userId
├── societyId
├── societyCode
├── userRole
├── userName
├── appearance (theme settings)
└── language

React Context
├── ThemeContext
│   ├── theme object
│   ├── loadTheme()
│   ├── updateTheme()
│   └── applyPreset()
│
└── LanguageContext
    ├── current language
    └── translation function

Global State Flow:
User Login → Save token/societyId to localStorage
          → Set user in ThemeContext
          → Initialize appearance settings
          
API Call  → Read token from localStorage
         → Add to Authorization header
         → Backend validates societyId from JWT
         
Theme Change → Update in ThemeContext
            → Save appearance to localStorage
            → CSS variables update
            → Smooth transition (250ms)
```

---

## CSS/Theme System

```
Global Theme Variables (css vars)
├── --app-background (dark: #1a1a1a, light: #fff)
├── --app-text (dark: #fff, light: #000)
├── --app-text-muted (dark: #999, light: #666)
├── --app-card (dark: #2a2a2a, light: #f5f5f5)
├── --app-border (dark: #444, light: #ddd)
├── --app-primary (accent color from theme)
├── --error (red)
├── --warning (orange)
└── --success (green)

Component Classes
├── .card (--app-card bg, --app-border)
├── .btn-primary (--app-primary bg)
├── .text-muted (--app-text-muted color)
└── .input (--app-background, --app-border)

Theme Files
├── theme-overrides.css (global light/dark)
├── App.css (component styles)
└── TailwindCSS (utility classes)

Theme Application
1. User selects light/dark
2. Update ThemeContext.theme
3. CSS variables update via ::root
4. Components re-render with new colors
5. Smooth 250ms transition
6. Save to localStorage
```

---

## Security Layers

| Layer | Implementation | Status |
|-------|-----------------|--------|
| HTTPS/TLS | Render automatic | ✅ |
| CORS | Origin whitelist + credentials | ✅ |
| Helmet | Security headers (CSP, X-Frame, etc) | ✅ |
| HPP | HTTP Parameter Pollution protection | ✅ |
| Rate Limiting | 300 req/15min per IP | ✅ |
| Auth Rate Limiting | 20 auth attempts/15min | ✅ |
| JWT Validation | RS256 signature verification | ✅ |
| Token Blacklist | In-memory (❌ TODO: Redis) | ⏳ |
| SQL Injection | Parameterized queries ($1, $2) | ✅ |
| Data Isolation | societyId checks (❌ 7 endpoints) | ❌ |
| RBAC | Role + societyId validation | ✅ |
| XSS Protection | React auto-escaping + CSP | ✅ |

---

## Deployment Architecture

```
Render Platform
├── PostgreSQL Database
│   └── 49 tables, multi-tenant design
│
├── Node.js Web Service (Backend)
│   ├── Express server
│   ├── Socket.io for real-time
│   ├── Cloudinary for uploads
│   └── Gemini AI integration
│
└── External Services
    ├── Vercel (Frontend deployment)
    ├── Cloudinary (Image/Doc storage)
    ├── Razorpay (Payment gateway)
    ├── Firebase Admin (Push notifications)
    └── Gemini API (AI assistant)

Environment Variables (Render)
├── DATABASE_URL (PostgreSQL)
├── JWT_SECRET
├── NODE_ENV=production
├── CORS_ORIGIN
├── PORT (auto-assigned by Render)
├── CLOUDINARY_* (3 vars)
├── RAZORPAY_* (2 vars)
├── FIREBASE_* (2 vars)
└── GEMINI_API_KEY
```

---

## Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| First Load | < 3s | ⏳ Unknown |
| API Response | < 500ms | ⏳ Unknown |
| Database Query | < 100ms | ⏳ Unknown |
| Socket.io Latency | < 100ms | ⏳ Unknown |
| Bundle Size | < 500KB | ⏳ Unknown |
| Lighthouse Score | > 80 | ⏳ Unknown |

---

## File Organization

```
fullstack-project/
├── backend/
│   ├── server.js                    ✅ Entry point
│   ├── App.js                       ✅ Express setup
│   ├── config/
│   │   ├── db.js                    ✅ PostgreSQL
│   │   ├── aiPrompts.js             ⏳ AI config
│   │   └── aiWorkflows.js           ⏳ AI workflows
│   ├── controllers/                 31 files (30 partial)
│   ├── models/                      25 files (3 need PostgreSQL fixes)
│   ├── routes/                      30 files
│   ├── middleware/                  12 files
│   ├── database/                    ✅ Schema + migrations
│   ├── services/                    AI, mailer, etc
│   ├── utils/                       Validators, helpers
│   └── scripts/                     Migration scripts
│
└── frontend/
    ├── src/
    │   ├── main.jsx                 ✅ Entry point
    │   ├── App.jsx                  ✅ Router
    │   ├── pages/                   50+ pages
    │   ├── components/              30+ components
    │   ├── context/                 ThemeContext, LanguageContext
    │   ├── services/                API client, auth
    │   ├── theme/                   Theme presets
    │   ├── styles/                  CSS + TailwindCSS
    │   └── utils/                   Helpers, validators
    ├── vite.config.js               ✅ Build config
    ├── tailwind.config.js           ✅ Theme config
    └── package.json                 Dependencies
```

---

## Key Technologies Stack

**Backend**:
- Node.js + Express 5.2.1
- PostgreSQL 12+ (pg driver)
- Socket.io (real-time)
- JWT (authentication)
- Cloudinary (image storage)
- Gemini AI (assistant)
- Multer (file upload)
- Nodemailer (email)

**Frontend**:
- React 18.2.0
- React Router v6
- Tailwind CSS 3
- Vite (build tool)
- Socket.io client
- Fetch API

**DevOps**:
- Render (hosting)
- PostgreSQL (Render database)
- Vercel (frontend)
- Cloudinary (CDN)

---

## Next 24-48 Hours Action Items

```
IMMEDIATE (Next 2 hours):
1. ❌ Fix visitor data isolation (30 min) → CRITICAL
2. ❌ Fix complaints data isolation (20 min) → CRITICAL
3. ❌ Remove ComplaintsPage mock data (30 min)
4. ❌ Complete PostgreSQL migration (2+ hrs) → BLOCKER

TODAY (Remaining hours):
5. ❌ Fix flats data isolation (25 min)
6. ❌ Fix billing getAllBills() (5 min)
7. ❌ Fix parking data isolation (20 min)
8. ❌ Fix analytics filters (25 min)

TOMORROW:
9. ⏳ Comprehensive integration testing
10. ⏳ Security audit (cross-society access testing)
11. ⏳ Performance testing
12. ⏳ Deploy to Render

THEN:
13. ⏳ Move token blacklist to Redis (1-2 hrs)
14. ⏳ Add comprehensive error handling
15. ⏳ Set up monitoring/alerting
```

