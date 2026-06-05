// Simple in-memory token blacklist with expiry cleanup
// Note: For production, replace with persistent store (Redis) to survive restarts.

const map = new Map(); // token -> expiryTimestamp (ms)

function isBlacklisted(token) {
  if (!token) return false;
  const entry = map.get(token);
  if (!entry) return false;
  if (Date.now() >= entry) {
    map.delete(token);
    return false;
  }
  return true;
}

function blacklistToken(token, ttlSeconds = 86400) {
  if (!token) return;
  const expiry = Date.now() + ttlSeconds * 1000;
  map.set(token, expiry);
}

function cleanup() {
  const now = Date.now();
  for (const [token, expiry] of map.entries()) {
    if (now >= expiry) map.delete(token);
  }
}

// periodic cleanup
setInterval(cleanup, 60 * 60 * 1000).unref();

module.exports = { isBlacklisted, blacklistToken };
