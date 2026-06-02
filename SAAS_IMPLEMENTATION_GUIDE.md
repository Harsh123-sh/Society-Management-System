# AI Smart Society Management SaaS Platform
## Comprehensive Implementation Guide

Complete guide to deploy the multi-society, AI-powered, white-label society management platform.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Database Setup](#database-setup)
4. [Backend Configuration](#backend-configuration)
5. [Frontend Setup](#frontend-setup)
6. [API Integration](#api-integration)
7. [Demo Data Seeding](#demo-data-seeding)
8. [Features & Usage](#features--usage)
9. [Troubleshooting](#troubleshooting)
10. [Deployment](#deployment)

---

## 🏗️ System Overview

### Architecture

```
├── Backend (Node.js + Express)
│   ├── Multi-tenant database
│   ├── Gemini AI integration
│   ├── White-label theme engine
│   ├── User approval workflow
│   └── Data isolation layer
│
├── Frontend (React + Vite)
│   ├── Dynamic theme system
│   ├── Role-based dashboards
│   ├── Society-aware UI
│   └── AI chat interface
│
└── Database (MySQL)
    ├── 5 Demo societies
    ├── User management
    ├── Theme storage
    └── AI chat history
```

### Key Features

✅ **5 Complete Demo Societies** with unique themes and data  
✅ **Multi-tenant Data Isolation** - Complete data separation  
✅ **Dynamic White-Label Themes** - CSS variables based theming  
✅ **AI Theme Generator** - Gemini-powered color schemes  
✅ **User Approval Workflow** - Registration → Approval → Active  
✅ **Gemini AI Assistant** - Society-aware and general QA  
✅ **Super Admin Panel** - Cross-society management  
✅ **Role-Based Dashboards** - Secretary, Owner, Tenant, Staff, Security  
✅ **KYC Verification** - Owner and tenant document verification  
✅ **Notice & Email Generation** - AI-powered document creation  

---

## 📦 Prerequisites

### System Requirements

- Node.js 16+
- MySQL 8.0+
- npm or yarn
- CORS enabled
- 2GB RAM minimum

### API Keys & Credentials

1. **Google Gemini API Key** (Free tier available)
   - Get from: https://aistudio.google.com/apikey
   - Add to `.env`: `GOOGLE_GEMINI_API_KEY=your_key_here`

2. **Database Credentials**
   - MySQL host, user, password
   - Add to `.env`: `DB_HOST`, `DB_USER`, `DB_PASSWORD`

3. **JWT Secret**
   - Generate: `openssl rand -base64 32`
   - Add to `.env`: `JWT_SECRET=your_secret`

---

## 🗄️ Database Setup

### Step 1: Create Database

```bash
mysql -u root -p

CREATE DATABASE IF NOT EXISTS fullstack_db;
USE fullstack_db;
```

### Step 2: Run Initial Schema

```bash
# Option 1: Using MySQL CLI
mysql -u root -p fullstack_db < backend/database/schema.sql

# Option 2: Using Node.js
node backend/scripts/runMigration.js
```

### Step 3: Run SaaS Enhancements

```bash
# This adds all the new tables and columns for multi-society, themes, and AI
mysql -u root -p fullstack_db < backend/database/saas-enhancements.sql
```

### Step 4: Verify Tables

```bash
# Check if new tables exist
SHOW TABLES;  -- Should show wings, ai_theme_generations, user_approvals, ai_chats, etc.

# Check society themes
SELECT id, name, theme_primary, theme_secondary FROM societies;
```

---

## ⚙️ Backend Configuration

### Step 1: Install Dependencies

```bash
cd fullstack-project/backend
npm install

# Additional packages needed:
npm install @google/generative-ai
```

### Step 2: Create .env File

```bash
# Create backend/.env
cat > .env << EOF
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=fullstack_db
DB_PORT=3306

# Server
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Gemini AI
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# File Upload
MAX_FILE_SIZE=10mb
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_PORT=587

# Logging
LOG_LEVEL=debug
EOF
```

### Step 3: Add API Routes

Add the new routes to `backend/App.js`:

```javascript
// Add these lines to App.js routes section
const approvalRoutes = require("./routes/approvalRoutes");
const geminiAIRoutes = require("./routes/geminiAIRoutes");

app.use("/api/approvals", approvalRoutes);
app.use("/api/ai", geminiAIRoutes);
```

### Step 4: Create Routes Files

Create `backend/routes/approvalRoutes.js`:

```javascript
const express = require("express");
const router = express.Router();
const userApprovalController = require("../controllers/userApprovalController");
const { authenticate, authorizeRoles } = require("../middleware/authMiddleware");

// Society-specific approvals
router.get("/:societyId/pending", authenticate, 
  userApprovalController.getPendingApprovals);
router.post("/:societyId/approve/:approvalId", authenticate,
  userApprovalController.approveUser);
router.post("/:societyId/reject/:approvalId", authenticate,
  userApprovalController.rejectUser);
router.post("/:societyId/bulk-approve", authenticate,
  userApprovalController.bulkApproveUsers);

// Super Admin cross-society
router.get("/super-admin/pending", authenticate, authorizeRoles('super_admin'),
  userApprovalController.getSuperAdminPendingApprovals);
router.post("/super-admin/approve/:approvalId", authenticate, authorizeRoles('super_admin'),
  userApprovalController.superAdminApproveUser);

module.exports = router;
```

Create `backend/routes/geminiAIRoutes.js`:

```javascript
const express = require("express");
const router = express.Router();
const geminiAIController = require("../controllers/geminiAIController");
const { authenticate } = require("../middleware/authMiddleware");

// Public
router.get("/capabilities", geminiAIController.getAICapabilities);
router.get("/health", geminiAIController.healthCheck);

// General QA
router.post("/ask-general", authenticate,
  geminiAIController.askGeneralQuestion);

// Society-aware
router.post("/ask-society", authenticate,
  geminiAIController.askSocietyQuestion);

// Document generation
router.post("/generate-notice", authenticate,
  geminiAIController.generateNotice);
router.post("/generate-email", authenticate,
  geminiAIController.generateEmail);

// Chat history
router.get("/chat-history", authenticate,
  geminiAIController.getChatHistory);

// Stats
router.get("/stats/:societyId", authenticate,
  geminiAIController.getAIUsageStats);

module.exports = router;
```

### Step 5: Test Backend

```bash
# Start backend server
npm start

# Test endpoints
curl http://localhost:5000/api/theme/presets
curl http://localhost:5000/api/ai/health
```

---

## 🎨 Frontend Setup

### Step 1: Install Dependencies

```bash
cd fullstack-project/frontend
npm install

# Ensure you have these versions:
# react@^18.2.0
# react-router-dom@^6.11.0
# tailwindcss@^3.3.0
```

### Step 2: Add Theme System

Create or update `src/index.css` to import theme variables:

```css
@import url("./styles/theme-variables.css");
```

### Step 3: Setup ThemeProvider in App

Update `src/App.jsx`:

```jsx
import ThemeProvider from './contexts/ThemeProvider';

function App() {
  const societyId = useParams().societyId || localStorage.getItem('societyId');

  return (
    <ThemeProvider societyId={societyId}>
      <YourMainApp />
    </ThemeProvider>
  );
}

export default App;
```

### Step 4: Update Vite Config

Ensure `vite.config.js` has:

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
});
```

### Step 5: Create AI Chat Component

Create `src/components/AIChat.jsx`:

```jsx
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeProvider';

export const AIChat = ({ societyId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const askAI = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/ask-society', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          societyId,
          query: input
        })
      });

      const data = await response.json();
      setMessages([...messages, 
        { role: 'user', content: input },
        { role: 'ai', content: data.response }
      ]);
      setInput('');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chat-container" style={{
      backgroundColor: `var(--color-bg-secondary)`,
      borderColor: `var(--color-border)`,
      borderRadius: `var(--button-border-radius)`
    }}>
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      
      <form onSubmit={askAI} className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI a question..."
          style={{
            backgroundColor: `var(--input-bg-color)`,
            color: `var(--input-text-color)`,
            borderColor: `var(--input-border-color)`
          }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>
    </div>
  );
};

export default AIChat;
```

---

## 🌐 API Integration

### Base URLs

```javascript
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Society Theme
GET    /api/theme/society/:societyId
PUT    /api/theme/society/:societyId
POST   /api/theme/generate-ai/:societyId
POST   /api/theme/apply/:societyId/:generationId
GET    /api/theme/presets
GET    /api/theme/history/:societyId

// User Approvals
GET    /api/approvals/:societyId/pending
POST   /api/approvals/:societyId/approve/:approvalId
POST   /api/approvals/:societyId/reject/:approvalId
POST   /api/approvals/:societyId/bulk-approve
GET    /api/approvals/super-admin/pending

// Gemini AI
POST   /api/ai/ask-general
POST   /api/ai/ask-society
POST   /api/ai/generate-notice
POST   /api/ai/generate-email
GET    /api/ai/chat-history
GET    /api/ai/health
GET    /api/ai/capabilities

// Wings (Towers/Buildings)
GET    /api/wings/society/:societyId
POST   /api/wings/:societyId
GET    /api/wings/:wingId
PUT    /api/wings/:wingId
```

---

## 🌱 Demo Data Seeding

### Step 1: Run Seeder

```bash
cd backend
node scripts/seedDemoSocieties.js
```

### Output

```
=== Starting Demo Societies Seed ===

→ Creating society: Green Valley Residency
  ✓ Society created (ID: 1)
  ✓ Created 3 wings/towers
  ✓ Created 120 flats
  ✓ Created 15 users

→ Creating society: Royal Heights
  ✓ Society created (ID: 2)
  ...

✓ Demo Societies Seed Completed Successfully

Demo Societies Created:
  1. Green Valley Residency (GVR)
  2. Royal Heights (RH)
  3. Skyline Enclave (SKY)
  4. Lakeview Homes (LV)
  5. Sunrise Residency (SR)

Super Admin Credentials:
  Email: superadmin@demo.local
  Password: SuperAdmin@123

Sample User Credentials:
  Secretary: secretary@greenvalley.demo.local / Secretary@123
  Owner: owner1@greenvalley.demo.local / Owner@123
  Tenant: tenant1@greenvalley.demo.local / Tenant@123
```

### Step 2: Reset Demo Data (If Needed)

```bash
node scripts/seedDemoSocieties.js reset
```

---

## ✨ Features & Usage

### 1. Multi-Society Theme System

```javascript
// Load society theme
const fetchTheme = async (societyId) => {
  const res = await fetch(`/api/theme/society/${societyId}`);
  return res.json();
};

// Apply preset theme
const applyPreset = async (societyId, presetId) => {
  const res = await fetch(`/api/theme/apply/${societyId}/${presetId}`, {
    method: 'POST'
  });
  return res.json();
};
```

### 2. AI Theme Generation

```javascript
// Generate AI theme
const generateTheme = async (societyId, prompt) => {
  const res = await fetch(`/api/theme/generate-ai/${societyId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, style: 'modern' })
  });
  return res.json();
};
```

### 3. User Approval Workflow

```javascript
// Get pending approvals
const getPending = async (societyId) => {
  const res = await fetch(`/api/approvals/${societyId}/pending`);
  return res.json();
};

// Approve user
const approveUser = async (societyId, approvalId, comments) => {
  const res = await fetch(`/api/approvals/${societyId}/approve/${approvalId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comments })
  });
  return res.json();
};
```

### 4. Gemini AI Assistant

```javascript
// Ask society question
const askAI = async (societyId, query) => {
  const res = await fetch('/api/ai/ask-society', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ societyId, query })
  });
  return res.json();
};

// Generate notice
const generateNotice = async (societyId, topic, content) => {
  const res = await fetch('/api/ai/generate-notice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ societyId, topic, content })
  });
  return res.json();
};
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue 1: "GOOGLE_GEMINI_API_KEY not configured"**
- Solution: Add API key to `.env` file
- Get key from: https://aistudio.google.com/apikey

**Issue 2: "Database connection failed"**
- Solution: Check `.env` credentials
- Test: `mysql -h DB_HOST -u DB_USER -p`

**Issue 3: "CORS error"**
- Solution: Update CORS_ORIGIN in `.env`
- Example: `CORS_ORIGIN=http://localhost:5173,http://localhost:3000`

**Issue 4: "Theme not loading"**
- Solution: Check `/api/theme/health` endpoint
- Ensure ThemeProvider wraps App component

**Issue 5: "Wings table structure error"**
- Solution: Run migrations again
- Check column names and types

### Debug Mode

```bash
# Enable debug logging
NODE_ENV=development DEBUG=* npm start

# Check database
mysql -u root -p fullstack_db
SELECT * FROM societies LIMIT 5;
SELECT * FROM wings LIMIT 5;
SELECT * FROM users WHERE role='secretary' LIMIT 5;
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database backups in place
- [ ] SSL certificates installed
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] File upload limits set
- [ ] Logging configured
- [ ] Monitoring setup
- [ ] Gemini API key secured
- [ ] Database indices optimized

### Deployment Steps

```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Build backend (if applicable)
cd ../backend
npm install --production

# 3. Update environment
cp .env.production .env

# 4. Run migrations
npm run migrate

# 5. Seed production data (optional)
npm run seed:prod

# 6. Start services
npm start
```

### Docker Setup (Optional)

```dockerfile
# Backend Dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

---

## 📊 Database Schema Summary

### Key Tables

| Table | Purpose |
|-------|---------|
| societies | Society info & branding |
| wings | Towers/buildings/blocks |
| flats | Individual units |
| users | All users across societies |
| user_approvals | Approval workflow |
| ai_theme_generations | Generated themes |
| ai_chats | AI conversation history |
| demo_data_markers | Track demo data |

---

## 📞 Support & Documentation

For more information:
- API Documentation: `/api/docs`
- Theme Guide: `WHITELIST_THEME_SYSTEM.md`
- Database Schema: `backend/database/schema.sql`
- Contributing: `CONTRIBUTING.md`

---

## 📝 License

This project is proprietary software. All rights reserved.

---

**Last Updated**: May 2026  
**Version**: 1.0.0 - Production Ready
