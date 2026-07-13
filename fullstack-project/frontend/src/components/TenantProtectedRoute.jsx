import { Navigate } from "react-router-dom";
import { getStoredRole, getStoredUser } from "../utils/session";
import AccessDeniedPage from "../pages/AccessDeniedPage";

/**
 * TenantProtectedRoute ensures tenants can only access tenant-specific routes
 * Blocks access to admin, secretary, chairman, security, and other restricted pages
 */
function TenantProtectedRoute({ children }) {
  const role = getStoredRole();
  const user = getStoredUser();
  const residentType = user?.resident_type || "owner";

  // Only allow tenants through
  if (role !== "resident" || residentType !== "tenant") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * Prevent tenant access to admin/leadership pages
 */
function TenantAccessControl({ children, restrictedRoles = [] }) {
  const role = getStoredRole();
  const user = getStoredUser();
  const residentType = user?.resident_type || "owner";
  const isTenant = role === "resident" && residentType === "tenant";

  // List of pages tenants should never access
  const restrictedPages = [
    "admin",
    "secretary",
    "chairman",
    "super-admin",
    "security-dashboard",
    "security",
    "staff",
    "accountant",
  ];

  const isAccessingRestricted = restrictedRoles.some(
    (restricted) => restrictedPages.includes(restricted)
  );

  if (isTenant && isAccessingRestricted) {
    return <AccessDeniedPage />;
  }

  return children;
}

export default TenantProtectedRoute;
export { TenantAccessControl };
