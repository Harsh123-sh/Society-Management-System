# Deployment Checklist

## Environment
- [ ] Set `JWT_SECRET` to a secure, random value
- [ ] Set `DATABASE_URL` to production PostgreSQL URL
- [ ] Set `CORS_ORIGIN` with production frontend origins
- [ ] Set `NODE_ENV=production`
- [ ] Configure `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX`
- [ ] Configure `AUTH_RATE_LIMIT_WINDOW_MS` and `AUTH_RATE_LIMIT_MAX`
- [ ] Configure `ARCHIVE_MAINTENANCE_INTERVAL_MS` if needed

## Database
- [ ] Run database migrations and schema initialization
- [ ] Verify indexes exist for critical tables
- [ ] Configure automated backups and retention policy
- [ ] Test restore process from backup
- [ ] Enable SSL/TLS for database connections

## Backend
- [ ] Verify `backend/App.js` and `backend/server.js` load cleanly
- [ ] Ensure `/`, `/health`, and `/api/health` return healthy status
- [ ] Validate all route mounts and remove duplicate route entries
- [ ] Configure centralized logging or APM service
- [ ] Configure error tracker (Sentry/Rollbar)
- [ ] Confirm token revocation and blacklist storage strategy

## Frontend
- [ ] Run `npm run build` and verify success
- [ ] Fix all ESLint errors and warnings
- [ ] Audit React hook dependency issues
- [ ] Confirm no `console.error` or `console.log` leakage in production
- [ ] Validate service worker and PWA assets if used
- [ ] Verify route transitions and page renders across all major pages

## Mobile
- [ ] Run mobile app build for Android and iOS
- [ ] Validate authentication flow and API connectivity
- [ ] Verify push notification registration and permission prompts
- [ ] Test on at least one real device / simulator per platform

## Monitoring & Logging
- [ ] Integrate application performance monitoring
- [ ] Integrate centralized error tracking
- [ ] Establish log retention and alerts for 5xx errors
- [ ] Add alerts for unhealthy health endpoints
- [ ] Add logging of critical audit actions

## Security
- [ ] Configure CSP and HSTS in production
- [ ] Validate CORS origins in deployed environment
- [ ] Verify JWT token structure and expiry
- [ ] Run penetration test for cross-society access controls
- [ ] Audit input validation for all public endpoints
- [ ] Confirm password reset and OTP flows are secure

## Testing
- [ ] Add automated backend tests and run them before deployment
- [ ] Add frontend regression tests for critical workflows
- [ ] Add accessibility tests for key pages
- [ ] Add cross-browser compatibility checks
- [ ] Add load testing for expected traffic patterns

## Final Signoff
- [ ] Confirm no critical ESLint errors remain
- [ ] Confirm health checks pass in staging
- [ ] Confirm backup restore tested
- [ ] Confirm alerts and monitoring are active
- [ ] Confirm documentation is up to date
