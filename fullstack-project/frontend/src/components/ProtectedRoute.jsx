import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import AccessDeniedPage from "../pages/AccessDeniedPage";
import { clearAuthSession, getStoredRole, getStoredUser, hasRequiredSocietyContext, isValidAuthToken } from "../utils/session";

function AuthFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">You are not logged in</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your session is missing or expired. Please sign in to continue.
        </p>
        <Link
          to="/login"
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:bg-blue-700"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}

function PendingApprovalMessage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-amber-900">Your account is pending approval.</h2>
        <p className="mt-2 text-sm text-amber-800">
          Please wait for an admin or super admin to approve your access before signing in.
        </p>
        <Link
          to="/login"
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:bg-amber-700"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}

function ProtectedRoute({ allowedRoles = [] }) {
  const token = (() => {
    try {
      return localStorage.getItem("token");
    } catch (error) {
      console.error("[ProtectedRoute] localStorage token read failed", error);
      return null;
    }
  })();
  const location = useLocation();
  const role = getStoredRole();
  const user = getStoredUser();
  const tokenValid = isValidAuthToken(token);

  console.debug("[ProtectedRoute] Route check", {
    path: location.pathname,
    hasToken: Boolean(token),
    tokenValid,
    role,
    userStatus: user?.status,
    allowedRoles,
  });

  if (!tokenValid) {
    clearAuthSession();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.status && user.status !== "active") {
    console.warn("[ProtectedRoute] User status invalid, clearing session", {
      status: user?.status,
    });
    if (user.status === "pending") {
      return <PendingApprovalMessage />;
    }
    clearAuthSession();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length && !allowedRoles.includes(role)) {
    console.warn("[ProtectedRoute] Role not allowed", {
      role,
      allowedRoles,
      path: location.pathname,
    });
    return <AccessDeniedPage />;
  }

  if (role === "staff" && !hasRequiredSocietyContext(user)) {
    clearAuthSession();
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, message: "Society access not found. Please login again." }}
      />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
