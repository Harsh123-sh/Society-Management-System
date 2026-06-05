const jwt = require("jsonwebtoken");

function requireSuperAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized: missing token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Forbidden: super admin access required" });
    }

    // If token carries a status field and it's not active, reject.
    if (decoded.status && decoded.status !== "active") {
      return res.status(403).json({ success: false, message: "Forbidden: account not active" });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
}

module.exports = {
  requireSuperAdmin,
};