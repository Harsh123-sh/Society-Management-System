# Backend Supabase Verification Checklist

## ✅ Verification completed

The backend was verified against a live Supabase PostgreSQL instance. The connection, schema bootstrapping, health routes, and login flow all worked successfully.

### Verified items
- [x] Database connection succeeds with the Supabase URL
- [x] Schema initialization completes successfully
- [x] `/health` responds successfully
- [x] `/api/health` responds successfully
- [x] `/api/auth/login` returns `200` for a seeded account

---

## 🔧 Backend checks to keep in place

### Database configuration
- [x] `config/db.js` supports Supabase and local PostgreSQL URLs
- [x] SSL is enabled for remote cloud hosts and disabled for localhost
- [x] Startup logging and retry behavior are in place

### Schema and startup
- [x] Schema initialization is idempotent and resilient
- [x] Required tables and columns are validated on startup
- [x] The backend starts without requiring a separate database migration step for the core flow

### Auth and tenant flow
- [x] Society lookup by code works
- [x] Login returns tokens and a populated user payload
- [x] Society code is attached to the auth response

---

## 🚀 Supabase deployment checklist

### Environment variables
- [ ] `DATABASE_URL` is set to the Supabase connection string
- [ ] `NODE_ENV` is set to `production`
- [ ] `JWT_SECRET` is set to a strong random string
- [ ] `PORT` is set if a non-default port is required

### Runtime verification
- [ ] Start the backend and confirm the startup messages appear
- [ ] Verify `/health`
- [ ] Verify `/api/health`
- [ ] Verify `/api/auth/login` with a valid society and user

---

## 🔍 Troubleshooting notes

### If the connection fails
- Confirm the Supabase connection string is correct
- Preserve the `?sslmode=require` suffix for the hosted Supabase URL
- Ensure the database is reachable from the runtime environment

### If schema initialization fails
- Verify the database credentials have permission to create tables
- Check the backend logs for the exact SQL error

### If auth fails
- Confirm the society exists in the database
- Confirm the user exists in that society and the password is correct
- Confirm the user is active and verified

---

## ✅ Current status

The backend is verified for Supabase-backed operation for the core flows tested in this workspace.
