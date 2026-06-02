# QUICK REFERENCE - Controller Fixes Remaining

**Use this checklist to fix remaining controllers**

---

## 🟢 DONE - billController.js

✅ createBill - societyId validation added
✅ getAllBills - societyId parameter added
✅ getMyBills - societyId parameter added  
✅ billRoutes.js - middleware added

⏳ Still need: Model layer (billModel.js) to add `WHERE society_id = ?` to SQL

---

## 🔴 CRITICAL PRIORITY - visitorController.js

### Functions to Fix:
1. `addVisitorEntry()` - Line ~[X]
   - Add: Validate preapproval.flat.society_id === req.user.societyId
   
2. `approveOwnerPreapproval()` - Line ~[X]
   - Add: WHERE society_id = ? check
   
3. `rejectOwnerPreapproval()` - Line ~[X]
   - Add: WHERE society_id = ? check
   
4. `issueQrPass()` - Line ~[X]
   - Add: Validate flat belongs to society
   
5. `sendOtp()` - Line ~[X]
   - Add: Validate preapproval belongs to society
   
6. `getVisitorLogs()` - Line ~[X]
   - Add: Filter by society_id
   
7. `getVisitorHistory()` - Line ~[X]
   - Add: Filter by society_id
   
8. `getVisitorDashboard()` - Line ~[X]
   - Add: Join with flats and filter by society

### Fix Template:
```javascript
async function functionName(req, res) {
  try {
    // ADD THIS:
    if (!req.user?.societyId) {
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
