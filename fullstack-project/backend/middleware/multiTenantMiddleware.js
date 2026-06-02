/**
 * Multi-Tenant Isolation Middleware
 * 
 * This middleware ensures that:
 * 1. Builders only access their own data
 * 2. Society admins only access their society data
 * 3. Users only access data they're authorized for
 */

const builderModel = require("../models/builderModel");
const societyModel = require("../models/societyModel");

/**
 * Resolve builder context from JWT token
 */
async function resolveBuilderContext(req, _res, next) {
  try {
    // Builder ID comes from JWT token (set during authentication)
    const builderId = req.user?.builder_id || req.headers["x-builder-id"] || null;
    
    if (!builderId) {
      // For super admin, may not have builder context
      req.builder = null;
      return next();
    }

    const builder = await builderModel.getBuilderById(builderId);
    if (!builder) {
      return next(); // Builder will be null
    }

    req.builder = {
      id: builder.id,
      name: builder.name,
      slug: builder.slug,
      maxSocieties: builder.max_societies,
      maxUsers: builder.max_users,
    };

    return next();
  } catch (error) {
    console.error("Builder resolution error:", error.message);
    return next(error);
  }
}

/**
 * Resolve society context from JWT or request header
 */
async function resolveSocietyContext(req, _res, next) {
  try {
    // Society ID comes from JWT or request header
    const societyId = req.user?.societyId || req.user?.society_id || req.headers["x-society-id"] || req.query.societyId || null;
    
    if (!societyId) {
      req.society = null;
      return next();
    }

    const society = await societyModel.getSocietyById(societyId);
    if (!society) {
      req.society = null;
      return next();
    }

    // Verify builder match if user has builder context
    if (req.user?.builder_id && society.builder_id && society.builder_id !== req.user.builder_id) {
      return next(new Error("Society does not belong to this builder"));
    }

    req.society = {
      id: society.id,
      code: society.code,
      name: society.name,
      builderId: society.builder_id,
      status: society.status,
    };

    if (req.user) {
      req.user.societyId = req.user.societyId || society.id;
      req.user.society_id = req.user.society_id || society.id;
    }

    return next();
  } catch (error) {
    console.error("Society resolution error:", error.message);
    return next(error);
  }
}

/**
 * Require builder context for endpoints
 */
function requireBuilderContext(req, res, next) {
  if (!req.builder) {
    return res.status(403).json({
      success: false,
      message: "Builder context required",
    });
  }
  return next();
}

/**
 * Require society context for endpoints
 */
function requireSocietyContext(req, res, next) {
  if (!req.society) {
    return res.status(403).json({
      success: false,
      message: "Society context required",
    });
  }
  return next();
}

/**
 * Apply builder isolation filter to query
 * Ensures user only sees their builder's data
 */
function getBuilderFilter(req) {
  if (!req.builder) return null;
  return { builder_id: req.builder.id };
}

/**
 * Apply society isolation filter to query
 * Ensures user only sees their society's data
 */
function getSocietyFilter(req) {
  if (!req.society) return null;
  return {
    builder_id: req.society.builderId,
    society_id: req.society.id,
  };
}

/**
 * Verify that a resource belongs to the current builder
 */
async function verifyBuilderOwnership(builderId, resourceBuilderId) {
  return builderId === resourceBuilderId;
}

/**
 * Verify that a resource belongs to the current society
 */
async function verifySocietyOwnership(societyId, builderId, resourceSocietyId, resourceBuilderId) {
  return resourceSocietyId === societyId && resourceBuilderId === builderId;
}

module.exports = {
  resolveBuilderContext,
  resolveSocietyContext,
  requireBuilderContext,
  requireSocietyContext,
  getBuilderFilter,
  getSocietyFilter,
  verifyBuilderOwnership,
  verifySocietyOwnership,
};
