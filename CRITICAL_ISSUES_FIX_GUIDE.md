# 🔴 CRITICAL ISSUES - QUICK FIX GUIDE

## Issue #1: Visitor Data Leakage (SECURITY CRITICAL)

**File**: [backend/controllers/visitorController.js](backend/controllers/visitorController.js)

### Functions to Fix (22 Queries Total)

```javascript
// BROKEN - Line ~150:
async function getVisitorLogs(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM visitors WHERE society_id = $1 LIMIT 100`
  );
  // ❌ BROKEN: Missing AND society_id check
  // Should validate req.user.societyId matches
}

// FIXED:
async function getVisitorLogs(req, res) {
  if (!req.user?.societyId) {
    return res.status(403).json({ success: false, message: "Society context required" });
  }
  
  const { rows } = await db.query(
    `SELECT * FROM visitors 
     WHERE society_id = $1 
     LIMIT 100`,
    [req.user.societyId]
  );
}
```

### All Functions Needing Fix:
1. `getVisitorLogs()` - line ~150
2. `getVisitorHistory()` - line ~180
3. `getVisitorDashboard()` - line ~210
4. `getVisitorAnalytics()` - line ~240
5. `listSecurityPreapprovals()` - line ~270
6. `checkInFromPreapproval()` - line ~300
7. `recognizeFace()` - line ~350
8. `addBlacklist()` - line ~380
9. `createVehicleEntry()` - line ~410
10. `listVehicleEntries()` - line ~430
11. `createDeliveryEntry()` - line ~450
12. `listDeliveryEntries()` - line ~470
13. `createEmergencyAlert()` - line ~490
14. `listEmergencyAlerts()` - line ~510
15. Plus 7 more visitor retrieval functions

### Fix Template:
```javascript
// Add to start of each function:
if (!req.user?.societyId) {
  return res.status(403).json({ success: false, message: "Society context required" });
}

// Add to WHERE clause of each query:
AND society_id = $X  // where $X is the next parameter index
```

---

## Issue #2: Complaints Data Leakage (HIGH SECURITY)

**File**: [backend/controllers/complaintController.js](backend/controllers/complaintController.js)

### Functions to Fix (3 Critical)

```javascript
// BROKEN - Line ~80:
async function getAllComplaints(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM complaints ORDER BY created_at DESC`
  );
  // ❌ BROKEN: Returns complaints from ALL societies
}

// FIXED:
async function getAllComplaints(req, res) {
  if (!req.user?.societyId) {
    return res.status(403).json({ success: false, message: "Society context required" });
  }
  
  const { rows } = await db.query(
    `SELECT * FROM complaints 
     WHERE society_id = $1 
     ORDER BY created_at DESC`,
    [req.user.societyId]
  );
}

// Similar fixes needed for:
async function getComplaintById(req, res) {
  // Add: AND society_id = $2 to WHERE clause
}

async function updateComplaintStatus(req, res) {
  // Add: AND society_id = $3 to WHERE clause (for validation)
}
```

### Fix Template:
```javascript
// Add societyId validation:
if (!req.user?.societyId) {
  return res.status(403).json({ success: false, message: "Society context required" });
}

// Update WHERE clause:
WHERE society_id = $1 AND ...
```

---

## Issue #3: Billing getAllBills() Not Scoped

**File**: [backend/controllers/billController.js](backend/controllers/billController.js)

### Function to Fix (1 Line)

```javascript
// BROKEN - Line ~120:
async function getAllBills(req, res) {
  const { rows: bills } = await db.query(
    `SELECT * FROM bills ORDER BY created_at DESC`  // ❌ Returns ALL bills
  );
}

// FIXED:
async function getAllBills(req, res) {
  if (!req.user?.societyId) {
    return res.status(403).json({ success: false, message: "Society context required" });
  }
  
  const { rows: bills } = await db.query(
    `SELECT * FROM bills 
     WHERE society_id = $1 
     ORDER BY created_at DESC`,
    [req.user.societyId]  // Add societyId parameter
  );
}
```

**Fix Time**: 2 minutes

---

## Issue #4: PostgreSQL Migration Incomplete

**Files Needing Fixes**:
- [backend/models/billModel.js](backend/models/billModel.js) - 10+ queries
- [backend/models/chatModel.js](backend/models/chatModel.js) - 6+ queries
- [backend/models/flatModel.js](backend/models/flatModel.js) - 4+ queries
- [backend/models/notificationModel.js](backend/models/notificationModel.js) - 5+ queries

### Pattern #1: MySQL `?` to PostgreSQL `$1`, `$2`

```javascript
// BROKEN (MySQL):
const { rows } = await db.query(
  `SELECT * FROM users WHERE society_id = ? AND email = ?`,
  [societyId, email]
);

// FIXED (PostgreSQL):
const { rows } = await db.query(
  `SELECT * FROM users WHERE society_id = $1 AND email = $2`,
  [societyId, email]
);
```

### Pattern #2: insertId to RETURNING

```javascript
// BROKEN (MySQL):
const result = await db.query(
  `INSERT INTO bills (title, amount) VALUES (?, ?)`,
  [title, amount]
);
const billId = result.insertId;  // ❌ Doesn't exist in PostgreSQL

// FIXED (PostgreSQL):
const result = await db.query(
  `INSERT INTO bills (title, amount) 
   VALUES ($1, $2) 
   RETURNING id`,
  [title, amount]
);
const billId = result.rows[0].id;
```

### Pattern #3: ON DUPLICATE KEY UPDATE to ON CONFLICT

```javascript
// BROKEN (MySQL):
await db.query(
  `INSERT INTO society_settings (society_id, setting_key, value) 
   VALUES (?, ?, ?)
   ON DUPLICATE KEY UPDATE value = VALUES(value)`,
  [societyId, key, value]
);

// FIXED (PostgreSQL):
await db.query(
  `INSERT INTO society_settings (society_id, setting_key, value) 
   VALUES ($1, $2, $3)
   ON CONFLICT (society_id, setting_key) 
   DO UPDATE SET value = EXCLUDED.value`,
  [societyId, key, value]
);
```

### Pattern #4: Transaction getConnection()

```javascript
// BROKEN (Uses getConnection for transactions):
const connection = await db.getConnection();
await connection.query('BEGIN');
// ... queries
await connection.release();

// FIXED (PostgreSQL transactions):
const client = await db.pool.connect();
try {
  await client.query('BEGIN');
  // ... queries using client
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

**Affected Files**: billModel.js, chatModel.js, flatModel.js, notificationModel.js

---

## Issue #5: Documents Data Leakage

**File**: [backend/controllers/documentController.js](backend/controllers/documentController.js)

### Functions to Fix (3)

```javascript
// BROKEN:
async function getAllDocuments(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM documents ORDER BY created_at DESC`  // ❌ All societies
  );
}

// FIXED:
async function getAllDocuments(req, res) {
  if (!req.user?.societyId) {
    return res.status(403).json({ success: false, message: "Society context required" });
  }
  
  const { rows } = await db.query(
    `SELECT * FROM documents 
     WHERE society_id = $1 
     ORDER BY created_at DESC`,
    [req.user.societyId]
  );
}
```

**Fix Time**: 20 minutes

---

## Issue #6: Flats Data Leakage

**File**: [backend/controllers/flatController.js](backend/controllers/flatController.js)

### Fix Pattern:

```javascript
// Add societyId check at start of functions:
if (!req.user?.societyId) {
  return res.status(403).json({ success: false, message: "Society context required" });
}

// Add to WHERE clause:
WHERE society_id = $X AND ...
```

**Affected Functions**:
- getAllFlats()
- getFlatById()
- getFlatsByWing()
- getFlatsByFloor()

**Fix Time**: 25 minutes

---

## Issue #7: ComplaintsPage Using Mock Data

**File**: [frontend/src/pages/ComplaintsPage.jsx](frontend/src/pages/ComplaintsPage.jsx)

### Current Code (BROKEN):

```javascript
function ComplaintsPage() {
  const [complaints] = useState([  // ❌ Hardcoded data
    {
      id: 1,
      resident: "Rajesh Kumar",
      issue: "Water leakage",
      status: "pending",
      // ... 4 more fake records
    }
  ]);
  // Users see fake data!
}
```

### Fixed Code:

```javascript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/complaints');
        setComplaints(response.data.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load complaints');
        console.error('Fetch complaints error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!complaints.length) return <div>No complaints found</div>;

  return (
    <div className="space-y-4">
      {complaints.map(complaint => (
        <div key={complaint.id} className="p-4 border rounded">
          <h3>{complaint.issue}</h3>
          <p>Status: {complaint.status}</p>
          {/* Render rest of complaint */}
        </div>
      ))}
    </div>
  );
}
```

**Fix Time**: 30 minutes

---

## Issue #8: Parking Data Isolation

**File**: [backend/controllers/parkingController.js](backend/controllers/parkingController.js)

### Pattern (Apply to all functions):

```javascript
// Add societyId validation:
if (!req.user?.societyId) {
  return res.status(403).json({ success: false, message: "Society context required" });
}

// Add to WHERE clause:
AND society_id = $X
```

**Affected Functions**:
- createParkingSlot()
- getParkingSlots()
- allocateParking()
- deallocateParking()

**Fix Time**: 20 minutes

---

## Issue #9: Analytics Missing Filters

**File**: [backend/controllers/analyticsController.js](backend/controllers/analyticsController.js)

### Functions to Fix:

```javascript
// BROKEN:
async function getOverviewStats(req, res) {
  const stats = await db.query(
    `SELECT COUNT(*) as total_visitors FROM visitors`  // ❌ All societies
  );
}

// FIXED:
async function getOverviewStats(req, res) {
  if (!req.user?.societyId) {
    return res.status(403).json({ success: false, message: "Society context required" });
  }
  
  const stats = await db.query(
    `SELECT COUNT(*) as total_visitors 
     FROM visitors 
     WHERE society_id = $1`,
    [req.user.societyId]
  );
}
```

**Affected Functions**:
- getOverviewStats()
- getVisitorAnalyticsDash()
- getFinancialAnalyticsDash()
- getComplaintAnalyticsDash()

**Fix Time**: 25 minutes

---

## Issue #10: Token Blacklist - In-Memory (Session Persistence)

**File**: [backend/utils/tokenBlacklist.js](backend/utils/tokenBlacklist.js)

### Current (BROKEN):

```javascript
// In-memory storage - lost on restart!
const blacklistedTokens = new Map();
```

### Fix: Move to Redis

```javascript
// Using redis-client
const redis = require('../config/redis');

async function blacklistToken(token, expiresInSeconds = 86400) {
  const ttl = Math.ceil(expiresInSeconds);
  await redis.setex(`blacklist:${token}`, ttl, '1');
}

async function isBlacklisted(token) {
  const result = await redis.get(`blacklist:${token}`);
  return result === '1';
}
```

**Installation**:
```bash
npm install redis
```

**Fix Time**: 1-2 hours

---

# Implementation Order (Priority)

```
1. Visitor data isolation (30 min) - CRITICAL SECURITY
2. Complaints data isolation (20 min) - CRITICAL SECURITY
3. Documents data isolation (20 min) - HIGH SECURITY
4. PostgreSQL model fixes (2 hrs) - DEPLOYMENT BLOCKER
5. Flats data isolation (25 min) - HIGH SECURITY
6. Billing getAllBills() (5 min) - QUICK FIX
7. ComplaintsPage mock data (30 min) - UI FIX
8. Parking data isolation (20 min) - SECURITY
9. Analytics filters (25 min) - SECURITY
10. Token blacklist Redis (1 hr) - SESSION MANAGEMENT

Total Time: ~6 hours
```

---

# Testing After Fixes

```bash
# Test cross-society access denial
# Login as User A (Society 1)
# Try to access User B's data (Society 2)
# Should get 403 Forbidden

# Test API directly:
curl -H "Authorization: Bearer TOKEN_A" \
  http://localhost:5000/api/visitors/B_VISITOR_ID
# Should return: { success: false, message: "..." }
```

---

# Files Already Fixed ✅

- [backend/server.js](backend/server.js) - PostgreSQL configured
- [backend/App.js](backend/App.js) - Routes setup
- [backend/middleware/authMiddleware.js](backend/middleware/authMiddleware.js) - JWT validation
- [backend/middleware/societyAccessMiddleware.js](backend/middleware/societyAccessMiddleware.js) - Society scope check
- [frontend/src/pages/LoginPage.jsx](frontend/src/pages/LoginPage.jsx) - SocietyCode field added
- [frontend/src/pages/AdminOverviewPage.jsx](frontend/src/pages/AdminOverviewPage.jsx) - Dashboard fixed

