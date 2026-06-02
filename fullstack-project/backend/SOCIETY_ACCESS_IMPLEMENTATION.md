# Multi-Society Data Isolation - Implementation Guide

## CRITICAL: All Queries Must Filter by societyId

This document provides step-by-step instructions to prevent cross-society data leakage.

## 1. KEY PRINCIPLE: Every Data Query Must Include societyId Filter

**WRONG (causes data leakage):**
```sql
SELECT * FROM bills WHERE user_id = ?
```

**CORRECT (safe):**
```sql
SELECT * FROM bills WHERE user_id = ? AND society_id = ?
```

## 2. Controller Function Categories

### A. BILL OPERATIONS
File: `/backend/controllers/billController.js`

Fix these functions to add `AND society_id = ?` to all queries:
- `getAllBills()` - Line ~[location]: Add society_id filter to bills query
- `generateInvoice()` - Add society_id check to bill lookup
- `getBillingDashboard()` - Add society_id to aggregation queries
- `getFinancialAnalytics()` - Add society_id to analytics queries
- `runPaymentReminders()` - Add society_id to pending bills query

**Pattern:**
```javascript
// Before
const [bills] = await db.query(
  `SELECT * FROM bills WHERE resident_id = ?`,
  [residentId]
);

// After
const [bills] = await db.query(
  `SELECT * FROM bills WHERE resident_id = ? AND society_id = ?`,
  [residentId, req.user.societyId]
);
```

### B. VISITOR OPERATIONS
File: `/backend/controllers/visitorController.js`

Fix these functions:
- `addVisitorEntry()` - Validate preapproval belongs to user's society
- `approveOwnerPreapproval()` - Add society_id check to preapproval lookup
- `rejectOwnerPreapproval()` - Add society_id check
- `issueQrPass()` - Add society_id validation
- `sendOtp()` - Add society_id validation
- `getVisitorLogs()` - Filter by society_id
- `getVisitorHistory()` - Filter by society_id
- `getVisitorDashboard()` - Add society_id to all joined tables
- All other visitor functions

**Pattern:**
```javascript
// Validate ownership of visitor record
const [preapproval] = await db.query(
  `SELECT vp.* FROM visitor_preapprovals vp
   JOIN flats f ON f.id = vp.flat_id
   WHERE vp.id = ? AND f.society_id = ?`,
  [preapprovalId, req.user.societyId]
);
```

### C. COMPLAINT OPERATIONS
File: `/backend/controllers/complaintController.js`

Fix these functions:
- `getAllComplaints()` - Add society_id filter
- `updateComplaintStatus()` - Validate complaint belongs to society
- `addComment()` - Validate complaint belongs to society

**Pattern:**
```javascript
const [complaints] = await db.query(
  `SELECT c.* FROM complaints c
   JOIN users u ON u.id = c.resident_id
   WHERE u.society_id = ?`,
  [req.user.societyId]
);
```

### D. DOCUMENT OPERATIONS
File: `/backend/controllers/documentController.js`

Fix these functions:
- `getAllDocuments()` - Add society_id filter to documents
- `reviewDocument()` - Validate document belongs to society

### E. PARKING OPERATIONS
File: `/backend/controllers/parkingController.js`

Fix these functions:
- `getSlots()` - Add society_id filter
- `getSlot()` - Add society_id check
- `updateSlot()` - Add society_id validation
- `assignSlot()` - Add society_id validation
- `releaseSlot()` - Add society_id validation
- `getStatistics()` - Add society_id filter

### F. FLAT OPERATIONS
File: `/backend/controllers/flatController.js`

Fix these functions:
- `assignResident()` - Validate flat belongs to society
- `unassignResident()` - Add society_id check
- `approveFlat()` - Add society_id check
- `getOccupancyHistory()` - Add society_id filter

### G. OWNER/TENANT OPERATIONS
Files: `/backend/controllers/ownerController.js`, `/backend/controllers/tenantController.js`

Fix these functions:
- `listOwners()` - Add society_id filter to user query
- `getOwnerProperties()` - Add society_id to flats join

## 3. General Rule for Fixing a Function

For any function that queries the database:

1. Identify all `db.query()` calls
2. For each query, add `AND society_id = ?` clause (or JOIN on society_id if needed)
3. Add `req.user.societyId` to the parameters array
4. Test that users cannot access data from other societies

**Example transformation:**

Before:
```javascript
async function getBill(req, res) {
  const billId = req.params.billId;
  const [bill] = await db.query(
    `SELECT * FROM bills WHERE id = ?`,
    [billId]
  );
  return res.json({ success: true, data: bill });
}
```

After:
```javascript
async function getBill(req, res) {
  const billId = req.params.billId;
  const societyId = req.user.societyId;
  
  if (!societyId) {
    return res.status(403).json({ success: false, message: "Society context required" });
  }
  
  const [bill] = await db.query(
    `SELECT b.* FROM bills b
     JOIN flats f ON f.id = b.flat_id
     WHERE b.id = ? AND f.society_id = ?`,
    [billId, societyId]
  );
  
  if (!bill) {
    return res.status(404).json({ success: false, message: "Bill not found" });
  }
  
  return res.json({ success: true, data: bill[0] });
}
```

## 4. Testing the Fix

After updating each function:

1. Create test accounts in two different societies
2. Login to Society A as user X
3. Query data for Society B (should fail with 403 Access Denied)
4. Query data for Society A (should succeed)
5. Repeat for Society B user

## 5. Database Queries Checklist

- [ ] bills - Filter by society_id via flat_id -> society_id or direct society_id column
- [ ] complaints - Filter via resident's society_id
- [ ] documents - Filter by society_id
- [ ] flats - Filter by society_id
- [ ] flat_residents - Filter via flat's society_id
- [ ] owner_properties - Filter via flat's society_id
- [ ] parking_slots - Filter by society_id
- [ ] visitors - Filter by society_id or via flat's society_id
- [ ] visitor_preapprovals - Filter via flat's society_id
- [ ] visitor_qr_passes - Filter via preapproval's flat's society_id
- [ ] notices - Filter by society_id
- [ ] bills - Filter by society_id or via flat's society_id

## 6. Routes to Update with requireSocietyAccess Middleware

Add this middleware to all routes that need society context:

```javascript
const { requireSocietyAccess } = require("../middleware/societyAccessMiddleware");

router.post(
  "/bills",
  authenticateToken,
  requireSocietyAccess,  // <- ADD THIS
  billController.createBill
);
```

All routes for bills, visitors, complaints, documents, parking, flats, owners, tenants should have this middleware.

## 7. Priority Order for Implementation

1. **CRITICAL - Do First:**
   - billController - Financial data is most sensitive
   - visitorController - Security data
   - complaintController - User privacy

2. **HIGH - Do Next:**
   - documentController - Personal documents
   - parkingController - Assignment data
   - flatController - Property data

3. **MEDIUM - Do After:**
   - ownerController - Profile data
   - userController - Account access

## 8. Completion Checklist

- [ ] All bill queries include society_id filter
- [ ] All visitor queries include society_id filter
- [ ] All complaint queries include society_id filter
- [ ] All document queries include society_id filter
- [ ] All parking queries include society_id filter
- [ ] All flat queries include society_id filter
- [ ] All owner queries include society_id filter
- [ ] All routes have requireSocietyAccess middleware
- [ ] Manual testing confirms no cross-society access
- [ ] Automated tests verify society isolation
