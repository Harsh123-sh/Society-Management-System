const tenantModel = require("../models/tenantModel");

async function resolveTenantContext(req, _res, next) {
  try {
    const tenant = await tenantModel.resolveTenantFromRequest(req);
    req.tenant = tenant;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireTenantContext(req, res, next) {
  if (!req.tenant || !req.tenant.society) {
    return res.status(404).json({
      success: false,
      message: "Tenant context not found",
    });
  }

  return next();
}

module.exports = {
  resolveTenantContext,
  requireTenantContext,
};