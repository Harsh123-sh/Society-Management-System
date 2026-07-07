# Supabase PostgreSQL Deployment Guide

## ✅ What was verified

The backend has been tested against a live Supabase PostgreSQL instance. The database connection, schema initialization, health endpoints, and login flow all work successfully.

### Verified runtime checks
- Database connection completed successfully
- Schema initialization completed successfully
- `/health` and `/api/health` responded successfully
- `/api/auth/login` returned `200` with a successful login payload using seeded credentials

---

## 🚀 Supabase setup steps

### Step 1: Create or open a Supabase project

1. Go to https://supabase.com/
2. Create a new project or open an existing one
3. Open Project Settings → Database
4. Copy the connection string for your PostgreSQL database

The connection string will look like:

```env
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require
```

### Step 2: Configure backend environment

Set the backend environment variables:

```env
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require
NODE_ENV=production
JWT_SECRET=your-strong-random-secret
PORT=5000
```

### Step 3: Start the backend

From the backend directory, run:

```bash
npm install
npm start
```

### Step 4: Verify the backend

Test the health endpoints:

```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/health
```

Then verify login with a valid seeded account:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123","societyCode":"NEXORA","role":"resident"}'
```

---

## 🔍 Troubleshooting

### Invalid URL or SSL error
- Make sure the `DATABASE_URL` is copied exactly from Supabase
- Keep `?sslmode=require` in the URL for the hosted Supabase connection
- Do not use an unescaped password with special characters if your URL format requires encoding

### Connection retry failures
- Wait a moment after creating the Supabase project before starting the backend
- Confirm the database is reachable from the environment running the backend
- Check the startup logs for the exact PostgreSQL error message

### Schema initialization issues
- Ensure the database user has permission to create tables and extensions
- Confirm the connection string points to the correct project database

---

## 📝 Environment reference

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | Yes | `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require` |
| `NODE_ENV` | Yes | `production` |
| `JWT_SECRET` | Yes | A strong random string |
| `PORT` | Optional | `5000` |

---

## ✅ Notes

The backend now uses the same PostgreSQL connection logic for Supabase and local PostgreSQL. The connection layer automatically enables SSL for remote hosts and disables it for localhost-based development setups.  
