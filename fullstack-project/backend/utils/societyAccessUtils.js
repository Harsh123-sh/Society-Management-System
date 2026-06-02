/**
 * Helper functions to enforce society-scoped data access across the application
 * Use these to ensure no cross-society data leakage
 */

/**
 * Validates that the user has access to the requested society
 * Throws error if access is denied
 */
function validateUserSocietyAccess(req, societyId) {
  if (!req.user?.societyId) {
    throw new Error("User society context missing");
  }
  
  if (societyId && parseInt(societyId) !== req.user.societyId) {
    throw new Error("Access denied: User cannot access this society");
  }
}

/**
 * Builds a WHERE clause condition for society filtering
 * Returns string like: "t.society_id = ?"
 */
function getSocietyWhereClause(tableAlias = "", prefix = "") {
  const dot = tableAlias ? "." : "";
  return `${prefix}${tableAlias}${dot}society_id`;
}

/**
 * Gets array of query parameters with societyId appended
 */
function addSocietyIdToParams(params, societyId) {
  return Array.isArray(params) ? [...params, societyId] : [societyId];
}

/**
 * Enforces society-scoped access for bulk operations
 * Validates that records belong to the user's society
 */
async function validateBulkRecordAccess(db, table, recordIds, societyId) {
  if (!Array.isArray(recordIds) || recordIds.length === 0) {
    return [];
  }

  const placeholders = recordIds.map(() => "?").join(",");
  const [records] = await db.query(
    `SELECT id, society_id FROM ${table} WHERE id IN (${placeholders})`,
    recordIds
  );

  // Check all records belong to the same society
  for (const record of records) {
    if (record.society_id !== societyId) {
      throw new Error(`Record ${record.id} does not belong to society ${societyId}`);
    }
  }

  return records;
}

/**
 * Middleware to inject societyId into all queries
 * Automatically appends societyId condition to queries
 */
function societyIdInjectionMiddleware(req, res, next) {
  if (req.user?.societyId) {
    req.societyId = req.user.societyId;
  }
  next();
}

module.exports = {
  validateUserSocietyAccess,
  getSocietyWhereClause,
  addSocietyIdToParams,
  validateBulkRecordAccess,
  societyIdInjectionMiddleware,
};
