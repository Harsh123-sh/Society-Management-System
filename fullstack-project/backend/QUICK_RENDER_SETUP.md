# Quick Supabase Setup Guide

## Step 1: Create or open a Supabase project

1. Go to https://supabase.com/
2. Create a new project or open an existing one
3. In the project dashboard, open Project Settings → Database
4. Copy the PostgreSQL connection string from the connection settings

A typical connection string looks like:

```env
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require
```

## Step 2: Configure the backend environment

Set these values in the backend environment:

```env
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres?sslmode=require
NODE_ENV=production
JWT_SECRET=your-strong-random-secret
PORT=5000
```

## Step 3: Start the backend

From the backend folder, run:

```bash
npm install
npm start
```

Expected startup output:

```text
✓ PostgreSQL database connected successfully
✓ Database schema initialized
✓ Server running on port 5000
```

## Step 4: Verify the deployment

Test the health endpoints:

```bash
curl http://localhost:5000/health
curl http://localhost:5000/api/health
```

Then verify the auth endpoint with valid credentials:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123","societyCode":"NEXORA","role":"resident"}'
```

## ✅ Success signs

- The backend starts without a database connection error
- The schema initializes successfully
- `/health` and `/api/health` return successful responses
- `/api/auth/login` returns a successful login payload for a seeded account

## 🔗 Frontend connection

If the frontend needs to call the backend, set the API base to the backend URL:

```env
VITE_API_URL=http://localhost:5000/api
```

---

This guide reflects the verified Supabase PostgreSQL setup for the backend in this workspace.
