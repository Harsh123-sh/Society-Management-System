import { getStoredRole, getStoredUser } from "../utils/session";

/**
 * Hook to check if current user is a tenant
 */
export function useTenantAccess() {
  const role = getStoredRole();
  const user = getStoredUser();
  const residentType = user?.resident_type || "owner";
  
  const isTenant = role === "resident" && residentType === "tenant";
  
  return {
    isTenant,
    canAccessAdminPages: !isTenant,
    canAccessChalrmanPages: !isTenant,
    canAccessSecurityPages: !isTenant,
    canAccessFinancialPages: !isTenant,
  };
}

/**
 * Hook to prevent tenant from accessing restricted pages
 */
export function useTenantRestriction() {
  const { isTenant } = useTenantAccess();
  
  const restrictedPaths = [
    "/admin",
    "/chairman", 
    "/secretary",
    "/security-dashboard",
    "/security",
    "/accountant",
    "/super-admin",
    "/staff",
  ];
  
  const isRestrictedPath = (path) => {
    return restrictedPaths.some(restricted => path.startsWith(restricted));
  };
  
  return {
    isTenant,
    isRestrictedPath,
    canAccess: (path) => !isTenant || !isRestrictedPath(path),
  };
}

/**
 * Get tenant-specific menu items
 */
export function getTenantMenuItems() {
  return [
    { label: "Dashboard", to: "/tenant/dashboard", icon: "📊" },
    { label: "My Residence", to: "/tenant/residence", icon: "🏠" },
    { label: "Family Members", to: "/tenant/family-members", icon: "👨‍👩‍👧‍👦" },
    { label: "Visitors", to: "/tenant/visitors", icon: "👥" },
    { label: "Payments", to: "/tenant/billing", icon: "💳" },
    { label: "Complaints", to: "/tenant/complaints", icon: "📝" },
    { label: "Documents", to: "/tenant/documents", icon: "📄" },
    { label: "Amenities", to: "/tenant/amenities", icon: "🎯" },
    { label: "Parking", to: "/tenant/parking", icon: "🚗" },
    { label: "Community", to: "/tenant/community", icon: "👥" },
    { label: "Settings", to: "/tenant/settings", icon: "⚙️" },
  ];
}
