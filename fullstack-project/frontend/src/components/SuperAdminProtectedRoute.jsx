import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getStoredSuperAdminRole, getStoredSuperAdminToken } from "../utils/session";

function SuperAdminProtectedRoute({ children }) {
  const location = useLocation();
  const token = getStoredSuperAdminToken();
  const role = getStoredSuperAdminRole();

  if (!token) {
    return <Navigate to="/super-admin/login" replace state={{ from: location }} />;
  }

  if (role !== "super_admin") {
    return <Navigate to="/403" replace />;
  }

  return children || <Outlet />;
}

export default SuperAdminProtectedRoute;