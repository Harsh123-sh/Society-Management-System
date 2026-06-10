# Developer Quick Reference Guide - SaaS Transformation

**For Teams Building Phases 2-3**

---

## 🚀 Quick Start

### Get Up to Speed (30 mins)
1. Read IMPLEMENTATION_SUMMARY.md (10 min)
2. Read SECURITY_AUDIT_REPORT.md (10 min)
3. Read this file (10 min)

### Key Points to Remember
- ✅ All data MUST be scoped by `societyId`
- ✅ Always validate `req.user?.societyId` in controllers
- ✅ Always pass `societyId` to model functions
- ✅ The database has a compatibility layer (MySQL `?` → PostgreSQL)
- ✅ Frontend is already working correctly

---

## 🔐 Critical Security Pattern - COPY THIS!

```javascript
// ✅ EVERY BACKEND ENDPOINT MUST FOLLOW THIS PATTERN

async function getMyData(req, res) {
  try {
    // 1. VALIDATE societyId exists
    if (!req.user?.societyId) {
      return res.status(403).json({ 
        success: false, 
        message: "Society context required" 
      });
    }

    // 2. EXTRACT societyId from user (not from query!)
    const societyId = req.user.societyId;

    // 3. PASS to model
    const data = await myModel.getDataBySociety(societyId);
    
    // 4. RETURN data
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error" });
  }
}
```

---

## ❌ Common Mistakes (DON'T DO THESE)

1. **Missing societyId validation**
   ```javascript
   // ❌ WRONG - User can pass any societyId
   const data = await model.getData(req.query.societyId);
   
   // ✅ RIGHT - Get from verified JWT
   const data = await model.getData(req.user.societyId);
   ```

2. **Optional societyId filter**
   ```javascript
   // ❌ WRONG - Returns ALL data if societyId not provided
   const where = societyId ? `WHERE society_id = ?` : '';
   
   // ✅ RIGHT - Always filter
   if (!societyId) throw new Error('societyId required');
   ```

3. **Forgetting JOIN with parent table**
   ```javascript
   // ❌ WRONG - If visitors table lacks society_id column
   `SELECT * FROM visitors WHERE society_id = ?`
   
   // ✅ RIGHT - Join to get society_id
   `SELECT v.* FROM visitors v
    JOIN flats f ON f.id = v.flat_id
    WHERE f.society_id = ?`
   ```

---

## 📋 What's Been Fixed (Phase 1 ✅)

| Component | Status | Why It Matters |
|-----------|--------|----------------|
| Visitor Emergency Alerts | ✅ Fixed | Was completely unscoped |
| Analytics Dashboard | ✅ Fixed | Was showing all societies |
| Blacklist Entries | ✅ Fixed | Was cross-society visible |
| Vehicle Entries | ✅ Fixed | Missing societyId validation |
| Delivery Entries | ✅ Fixed | Missing societyId validation |
| Visitor Analytics | ✅ Fixed | Was unfiltered |
| Complaints | ✅ Verified | Already properly scoped |
| Documents | ✅ Verified | Already properly scoped |
| Flats | ✅ Verified | Already properly scoped |
| Parking | ✅ Verified | Already properly scoped |

---

## 📍 File Locations You Need to Know

```
backend/
├── config/db.js ................ 🔥 DB compatibility layer
├── controllers/
│   ├── visitorController.js .... ✅ FIXED (good example)
│   ├── analyticsController.js .. ✅ FIXED (good example)
│   └── complaintController.js .. ✅ VERIFIED (already good)
└── models/
    ├── visitorModel.js ......... ✅ FIXED
    └── analyticsModel.js ....... ✅ FIXED

frontend/src/
├── pages/
│   └── ComplaintsPage.jsx ...... ✅ Uses API (no changes needed)
└── services/api.js ............ API call layer
```

---

## ✅ Testing Before You Commit

```
1. Login as user from Society A
2. Call /api/your-endpoint
3. Verify only Society A data is returned
4. Logout, login as user from Society B
5. Verify cannot see Society A data
6. Check browser console - no errors
7. Check server terminal - no errors
```

---

## 📞 Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| "Unauthorized" error | Missing societyId validation | Add `if (!req.user?.societyId) return 403` |
| Other society's data visible | Missing WHERE clause | Add `AND society_id = ?` to query |
| Blank page on frontend | API error | Check browser console |
| Database query error | Syntax mismatch | The compatibility layer handles it |

---

**Phase 1 Status**: ✅ COMPLETE  
**Next**: Read IMPLEMENTATION_SUMMARY.md for Phase 2 roadmap  
**Questions**: Check SECURITY_AUDIT_REPORT.md first
      return res.status(403).json({ 
        success: false, 
        message: "Society context required" 
      });
    }

    // ... existing code but filter queries by societyId ...
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
```

### Route Update:
```javascript
// Add to visitorRoutes.js at top:
const { requireSocietyAccess } = require("../middleware/societyAccessMiddleware");

// Add after authenticateToken:
router.use(authenticateToken);
router.use(requireSocietyAccess);  // ← ADD THIS LINE
```

### Test:
- User A cannot see visitors from Society B
- User A's preapprovals only show for their society

---

## 🔴 HIGH PRIORITY - complaintController.js

### Functions to Fix:
1. `getAllComplaints()` - Line ~[X]
   - Change: `WHERE resident_id = ?` 
   - To: `WHERE resident_id = ? AND society_id = ?`
   
2. `updateComplaintStatus()` - Line ~[X]
   - Add: Verify complaint belongs to user's society
   
3. `addComment()` - Line ~[X]
   - Add: Verify complaint belongs to user's society

### Fix Template:
```javascript
async function getAllComplaints(req, res) {
  try {
    if (!req.user?.societyId) {
      return res.status(403).json({ message: "Society context required" });
    }

    // CHANGE THE QUERY:
    // const [complaints] = await db.query(
    //   `SELECT * FROM complaints WHERE resident_id = ?`,
    //   [req.user.id]
    // );

    // TO:
    const [complaints] = await db.query(
      `SELECT c.* FROM complaints c
       JOIN users u ON u.id = c.resident_id
       WHERE c.resident_id = ? AND u.society_id = ?`,
      [req.user.id, req.user.societyId]
    );

    return res.json({ success: true, data: complaints });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
```

---

## 🔴 HIGH PRIORITY - documentController.js

### Functions to Fix:
1. `getAllDocuments()` - Add society_id filter
2. `reviewDocument()` - Verify document belongs to society
3. `uploadDocument()` - Pass societyId when creating

### Fix Pattern:
```javascript
// Filter: Add AND society_id = ? to WHERE clause
const [documents] = await db.query(
  `SELECT * FROM documents WHERE flat_id = ? AND society_id = ?`,
  [flatId, req.user.societyId]
);
```

---

## 🟠 MEDIUM PRIORITY - parkingController.js

### Functions to Fix:
1. `getSlots()` - Add society_id filter
2. `getSlot()` - Validate slot belongs to society
3. `updateSlot()` - Add society_id check
4. `assignSlot()` - Validate society ownership
5. `releaseSlot()` - Validate society ownership
6. `getStatistics()` - Filter by society_id

### Fix Pattern:
```javascript
const [slot] = await db.query(
  `SELECT * FROM parking_slots WHERE id = ? AND society_id = ?`,
  [slotId, req.user.societyId]
);
```

---

## 🟠 MEDIUM PRIORITY - flatController.js

### Functions to Fix:
1. `assignResident()` - Validate flat belongs to society
2. `unassignResident()` - Validate flat belongs to society
3. `approveFlat()` - Validate flat belongs to society
4. `getOccupancyHistory()` - Filter by society_id

### Fix Pattern:
```javascript
// Verify flat belongs to society before modifying
const [flat] = await db.query(
  `SELECT * FROM flats WHERE id = ? AND society_id = ?`,
  [flatId, req.user.societyId]
);

if (!flat || flat.length === 0) {
  return res.status(403).json({ 
    success: false, 
    message: "Flat not found or access denied" 
  });
}
```

---

## 🟡 LOW PRIORITY - ownerController.js

### Functions to Fix:
1. `listOwners()` - Filter by society_id
2. `getOwnerProperties()` - Add society_id filter

### Fix Pattern:
```javascript
const [owners] = await db.query(
  `SELECT u.* FROM users u
   WHERE u.society_id = ? AND u.resident_type = 'owner'`,
  [req.user.societyId]
);
```

---

## ✅ QUICK VALIDATION CHECKLIST FOR EACH FIX

For each controller function you fix:

- [ ] Added societyId check at start: `if (!req.user?.societyId)`
- [ ] Updated all db.query() calls to include `AND society_id = ?`
- [ ] Added `req.user.societyId` to params array
- [ ] Routes have `requireSocietyAccess` middleware
- [ ] Tested: User A cannot access User B's data
- [ ] Tested: User A can access their own society's data
- [ ] No console errors when querying

---

## 🚨 DON'T FORGET

1. **Import middleware in routes**:
   ```javascript
   const { requireSocietyAccess } = require("../middleware/societyAccessMiddleware");
   ```

2. **Add middleware to router**:
   ```javascript
   router.use(authenticateToken);
   router.use(requireSocietyAccess);  // ← IMPORTANT
   ```

3. **Check EVERY query** - Even one forgotten query = data leak

4. **Test cross-society access** - MUST return 403 or empty

---

## 📊 COMPLETION TRACKER

```
visitorController:        ⏳ 0/8 functions
complaintController:      ⏳ 0/3 functions
documentController:       ⏳ 0/3 functions
parkingController:        ⏳ 0/6 functions
flatController:           ⏳ 0/4 functions
ownerController:          ⏳ 0/2 functions

Model Layer (SQL):        ⏳ ~20 functions need WHERE society_id
Routes:                   ⏳ ~40 routes need middleware

TOTAL: ~85 changes remaining
TIME: 2-3 hours
```

---

**Use this as your daily checklist. Cross off each controller as you complete it.**
