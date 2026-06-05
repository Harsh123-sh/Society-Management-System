const ROLE_ALIASES = {
  chairman: "admin",
  secretary: "secretary",
  owner: "resident",
  tenant: "resident",
};

function normalizeRole(role) {
  if (!role) return role;
  const rl = String(role).toLowerCase();
  return ROLE_ALIASES[rl] || rl;
}

function authorizeRoles(...allowedRoles) {
  const normalizedAllowed = allowedRoles.map(normalizeRole);
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userRole = normalizeRole(req.user.role);
    if (!normalizedAllowed.includes(userRole)) {
      console.warn("[authorizeRoles] access denied", { userId: req.user.id, route: req.path, required: normalizedAllowed, actual: userRole });
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    return next();
  };
}

module.exports = {
  authorizeRoles,
};
