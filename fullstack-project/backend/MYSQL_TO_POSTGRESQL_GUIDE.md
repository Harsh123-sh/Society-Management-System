# MySQL to PostgreSQL Query Conversion Guide

## Overview

The backend has 40+ files with database queries. Many still need conversion from MySQL syntax to PostgreSQL syntax. This guide shows the exact patterns to convert.

## Quick Reference - Conversion Patterns

### Pattern 1: Question Mark Placeholders

```javascript
// ❌ MySQL (WRONG)
db.query("SELECT * FROM users WHERE id = ?", [userId])
db.query("INSERT INTO users ... VALUES (?, ?, ?)", params)

// ✅ PostgreSQL (CORRECT)
db.query("SELECT * FROM users WHERE id = $1", [userId])
db.query("INSERT INTO users ... VALUES ($1, $2, $3)", params)
```

**How to fix**: Replace `?` with `$1, $2, $3` (numbered sequentially)

### Pattern 2: Insert ID Return

```javascript
// ❌ MySQL (WRONG)
const result = await db.query("INSERT INTO users ... VALUES (?, ?, ?)", params);
const userId = result.insertId;

// ✅ PostgreSQL (CORRECT)
const result = await db.query("INSERT INTO users ... VALUES ($1, $2, $3) RETURNING id", params);
const userId = result.rows[0].id;
```

**How to fix**: 
1. Add `RETURNING id` to INSERT query
2. Change `result.insertId` to `result.rows[0].id`

### Pattern 3: Upsert (Duplicate Key)

```javascript
// ❌ MySQL (WRONG)
INSERT INTO users (email, name) VALUES (?, ?)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  updated_at = NOW()

// ✅ PostgreSQL (CORRECT)
INSERT INTO users (email, name) VALUES ($1, $2)
ON CONFLICT(email) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = CURRENT_TIMESTAMP
```

**How to fix**:
1. Identify the UNIQUE column in the conflict (e.g., `email`)
2. Replace `ON DUPLICATE KEY UPDATE` with `ON CONFLICT(unique_column) DO UPDATE SET`
3. Replace each `VALUES(column)` with `EXCLUDED.column`
4. Replace `NOW()` with `CURRENT_TIMESTAMP`

### Pattern 4: Boolean Values

```javascript
// ❌ MySQL (WRONG - uses 0/1)
db.query("INSERT INTO settings (enabled) VALUES (?)", [flag ? 1 : 0])

// ✅ PostgreSQL (CORRECT - uses true/false)
db.query("INSERT INTO settings (enabled) VALUES ($1)", [flag ? true : false])
```

**How to fix**: Replace `1 : 0` with `true : false`

### Pattern 5: Datetime Functions

```javascript
// ❌ MySQL (WRONG)
db.query("UPDATE logs SET updated_at = NOW()")
db.query("INSERT INTO logs ... VALUES (?, NOW())", params)

// ✅ PostgreSQL (CORRECT)
db.query("UPDATE logs SET updated_at = CURRENT_TIMESTAMP")
db.query("INSERT INTO logs ... VALUES ($1, CURRENT_TIMESTAMP)", params)
```

**How to fix**: Replace `NOW()` with `CURRENT_TIMESTAMP`

### Pattern 6: Transactions (Advanced)

```javascript
// ❌ MySQL (WRONG)
const connection = await db.getConnection();
try {
  await connection.beginTransaction();
  await connection.query(...);
  await connection.commit();
} finally {
  connection.release();
}

// ✅ PostgreSQL (CORRECT)
// For now, just use direct queries without transactions
// PostgreSQL pool doesn't support connection-based transactions like MySQL
await db.query(...)
await db.query(...)
```

**How to fix**: Remove transaction logic and use direct pool queries

### Pattern 7: LIKE Search

```javascript
// ❌ MySQL (WRONG)
const search = `%${query}%`;
db.query("SELECT * FROM users WHERE name LIKE ?", [search])

// ✅ PostgreSQL (CORRECT)
const search = `%${query}%`;
db.query("SELECT * FROM users WHERE name LIKE $1", [search])
```

**How to fix**: Only change `?` to `$1`, the pattern stays the same

## Files Needing Conversion

### Priority 1 - Critical (errors in logs)
- [ ] `models/billModel.js` - getConnection, beginTransaction, insertId
- [ ] `models/chatModel.js` - ON DUPLICATE KEY, VALUES(), getConnection, insertId
- [ ] `models/flatModel.js` - getConnection, beginTransaction, insertId
- [ ] `models/notificationModel.js` - ON DUPLICATE KEY, VALUES(), insertId

### Priority 2 - Important (missing insertId conversion)
- [ ] `models/builderModel.js` - insertId
- [ ] `models/bookingModel.js` - insertId
- [ ] `models/complaintModel.js` - insertId (multiple)
- [ ] `models/noticeModel.js` - insertId
- [ ] `models/documentModel.js` - insertId
- [ ] `models/otpModel.js` - insertId

### Priority 3 - Controllers
- [ ] controllers/*.js - Check for any db.query patterns

---

## Step-by-Step Conversion Example

### Before (MySQL):
```javascript
async function createUser({ email, name, password }) {
  const [result] = await db.query(
    `INSERT INTO users (email, name, password_hash) 
     VALUES (?, ?, ?)`,
    [email, name, hashedPassword]
  );
  
  return {
    id: result.insertId,
    email,
    name
  };
}
```

### After (PostgreSQL):
```javascript
async function createUser({ email, name, password }) {
  const result = await db.query(
    `INSERT INTO users (email, name, password_hash) 
     VALUES ($1, $2, $3)
     RETURNING id`,
    [email, name, hashedPassword]
  );
  
  return {
    id: result.rows[0].id,
    email,
    name
  };
}
```

**Changes**:
1. `?` → `$1, $2, $3`
2. Added `RETURNING id`
3. `result.insertId` → `result.rows[0].id`

---

## Common Mistakes to Avoid

### ❌ Wrong: Renumbering placeholders in same query
```javascript
// WRONG
db.query("SELECT * FROM users WHERE id = $1 AND type = ?", [userId, type])
// Mix of $1 and ?
```

### ✅ Correct: All numbered or all parameters
```javascript
// CORRECT
db.query("SELECT * FROM users WHERE id = $1 AND type = $2", [userId, type])
```

### ❌ Wrong: Forgetting RETURNING for INSERT
```javascript
// WRONG
const result = await db.query(
  "INSERT INTO users ... VALUES ($1, $2) RETURNING id", params
);
const id = result.insertId; // This doesn't exist in PostgreSQL!
```

### ✅ Correct: Use result.rows[0]
```javascript
// CORRECT
const result = await db.query(
  "INSERT INTO users ... VALUES ($1, $2) RETURNING id", params
);
const id = result.rows[0].id;
```

### ❌ Wrong: Values() function in PostgreSQL
```javascript
// WRONG
ON CONFLICT DO UPDATE SET name = VALUES(name)
```

### ✅ Correct: Use EXCLUDED
```javascript
// CORRECT
ON CONFLICT DO UPDATE SET name = EXCLUDED.name
```

---

## Search & Replace Template

Use these search patterns in your editor to find queries that need conversion:

### Find MySQL placeholders:
```
Search: \?(?=[^"']*(?:["'][^"']*["'][^"']*)*$)
Replace: (manually, or use numbered replacements)
```

### Find insertId usage:
```
Search: \.insertId
Replace: .rows[0].id
```

### Find ON DUPLICATE KEY:
```
Search: ON DUPLICATE KEY UPDATE
Replace: ON CONFLICT(...) DO UPDATE SET
```

---

## Testing After Conversion

### Quick test of each file:
```bash
# Start the server
npm start

# Test a route that uses the model
curl http://localhost:5000/api/users/list

# Watch for errors like:
# - "syntax error at or near"
# - "parameter $1 not provided"
# - "Cannot read insertId"
```

### Specific model test:
```javascript
// In a test file
const model = require('./models/billModel');
const result = await model.createBill({...});
console.log(result); // Should have id, not undefined
```

---

## PostgreSQL-Specific Tips

### 1. Parameterized Queries Are Safer
```javascript
// Good: Uses parameters
db.query("SELECT * FROM users WHERE name = $1", [userInput])

// Risky: String concatenation (SQL injection!)
db.query(`SELECT * FROM users WHERE name = '${userInput}'`)
```

### 2. Boolean vs Integer
```javascript
// PostgreSQL has native BOOLEAN type
// Use true/false, not 1/0

// WRONG
db.query("INSERT INTO settings (enabled) VALUES ($1)", [1])

// CORRECT
db.query("INSERT INTO settings (enabled) VALUES ($1)", [true])
```

### 3. JSON Storage
```javascript
// PostgreSQL has native JSONB type
const data = { theme: 'dark', language: 'en' };

// Store as JSON
db.query("INSERT INTO configs (data) VALUES ($1)", [JSON.stringify(data)])

// Retrieve as JSON
const { rows } = await db.query("SELECT data FROM configs WHERE id = $1", [id]);
const data = JSON.parse(rows[0].data); // or use JSONB operators
```

### 4. RETURNING Clause Benefits
```javascript
// Get generated values without extra query
const result = await db.query(
  `INSERT INTO users (name) VALUES ($1) 
   RETURNING id, created_at`,
  ['John']
);
const { id, created_at } = result.rows[0];
```

---

## Automated Conversion Checklist

For each file:

- [ ] Find all `?` placeholders and replace with `$1, $2...`
- [ ] Find all `.insertId` and replace with `.rows[0].id`
- [ ] Find all `ON DUPLICATE KEY UPDATE` and convert to `ON CONFLICT`
- [ ] Find all `NOW()` and replace with `CURRENT_TIMESTAMP`
- [ ] Find all `VALUES(column)` and replace with `EXCLUDED.column`
- [ ] Find all `1 : 0` for booleans and replace with `true : false`
- [ ] Find all `getConnection()` and remove transaction logic
- [ ] Find all `beginTransaction()` and `commit()`/`rollback()` and remove

---

## Questions to Ask While Converting

1. **Is this an INSERT query?** → Add `RETURNING id` and use `result.rows[0].id`
2. **Is this an upsert (ON DUPLICATE)?** → Convert to `ON CONFLICT`
3. **Does it have multiple placeholders?** → Number them `$1, $2, $3...`
4. **Are there transactions?** → Remove them (use direct queries for now)
5. **Does it use `NOW()`?** → Replace with `CURRENT_TIMESTAMP`
6. **Boolean values?** → Use `true/false` not `1/0`

---

## Need Help?

If a file is particularly complex:
1. Note which file and which function
2. Post the SQL query you're converting
3. See if there's a pattern you haven't seen before

All conversions follow the same patterns shown above!

---

**Status**: Use this guide to systematically convert remaining 20-30 files
**Estimated Time**: 2-3 hours for all remaining conversions
**Difficulty**: Low to Medium (mostly mechanical replacements)
