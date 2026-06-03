// This file is deprecated. Schema initialization is handled by database/initSchema.js
// using PostgreSQL with pg package instead of MySQL.

require("dotenv").config();

console.warn(
  "⚠ checkSchema.js is deprecated. Schema validation and initialization is now handled by database/initSchema.js using PostgreSQL."
);

process.exit(0);
