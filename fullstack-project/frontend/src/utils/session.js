export function getCurrentUserFromToken() {
  const token = localStorage.getItem("token");
  if (!isValidAuthToken(token)) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = JSON.parse(atob(normalizedPayload));

    return {
      id: decodedPayload.id,
      email: decodedPayload.email,
      role: normalizeRole(decodedPayload.role),
      resident_type: decodedPayload.residentType || decodedPayload.resident_type || null,
      status: decodedPayload.status || null,
      societyId: decodedPayload.societyId || decodedPayload.society_id || null,
      society_id: decodedPayload.society_id || decodedPayload.societyId || null,
      societyName: decodedPayload.societyName || decodedPayload.society_name || null,
      society_name: decodedPayload.society_name || decodedPayload.societyName || null,
      societyCode: decodedPayload.societyCode || decodedPayload.society_code || null,
      society_code: decodedPayload.society_code || decodedPayload.societyCode || null,
    };
  } catch {
    return null;
  }
}

export function normalizeRole(role) {
  if (role === "chairman") return "admin";
  if (role === "user" || role === "owner" || role === "tenant") return "resident";
  return role || "resident";
}

export function isTokenExpired(token) {
  if (!token) return true;

  try {
    const payload = token.split(".")[1];
    if (!payload) return true;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = JSON.parse(atob(normalizedPayload));
    // If token has no expiry field treat it as expired for safety
    if (!decodedPayload?.exp) return true;

    return Date.now() >= decodedPayload.exp * 1000;
  } catch {
    return true;
  }
}

export function isValidAuthToken(token) {
  return Boolean(token) && !isTokenExpired(token);
}

export function getRoleHomePath(role) {
  const normalizedRole = normalizeRole(role);

  switch (normalizedRole) {
    case "super_admin":
      return "/super-admin/dashboard";
    case "admin":
    case "chairman":
      return "/chairman/dashboard";
    case "secretary":
      return "/secretary/dashboard";
    case "resident":
      return "/resident";
    case "staff":
      return "/staff";
    case "security":
      return "/security-dashboard";
    default:
      return "/access-denied";
  }
}

export function saveSelectedSociety({ id, name }) {
  if (!id) return;
  localStorage.setItem("selectedSocietyId", id);
  if (name) {
    localStorage.setItem("selectedSocietyName", name);
  }
}

export function clearSelectedSociety() {
  localStorage.removeItem("selectedSocietyId");
  localStorage.removeItem("selectedSocietyName");
}

export function getSelectedSociety() {
  const id = localStorage.getItem("selectedSocietyId") || localStorage.getItem("societyId");
  if (!id) return null;
  return {
    id,
    name:
      localStorage.getItem("selectedSocietyName") ||
      localStorage.getItem("societyName") ||
      id,
  };
}

export function saveAuthSession({ token, user, societyId, societyName }) {
  if (token) {
    localStorage.setItem("token", token);
  }

  const normalizedUser = user
    ? {
        ...user,
        role: normalizeRole(user.role),
      }
    : null;

  if (normalizedUser) {
    localStorage.setItem("role", normalizedUser.role);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    if (normalizedUser.id || normalizedUser.userId) {
      localStorage.setItem("userId", String(normalizedUser.id || normalizedUser.userId));
    }
    if (normalizedUser.name || normalizedUser.userName) {
      localStorage.setItem("userName", normalizedUser.name || normalizedUser.userName);
    }
    if (normalizedUser.email) {
      localStorage.setItem("userEmail", normalizedUser.email);
    }
  }

  const resolvedSocietyId = societyId || normalizedUser?.societyId || normalizedUser?.society_id;
  const resolvedSocietyName = societyName || normalizedUser?.societyName || normalizedUser?.society_name;

  if (resolvedSocietyId) {
    localStorage.setItem("societyId", resolvedSocietyId);
    localStorage.setItem("selectedSocietyId", resolvedSocietyId);
  }
  if (resolvedSocietyName) {
    localStorage.setItem("societyName", resolvedSocietyName);
    localStorage.setItem("selectedSocietyName", resolvedSocietyName);
  }
}

export function saveSuperAdminSession({ token, user }) {
  if (token) {
    localStorage.setItem("superAdminToken", token);
  }

  const normalizedUser = user
    ? {
        ...user,
        role: normalizeRole(user.role),
      }
    : null;

  if (normalizedUser) {
    localStorage.setItem("superAdminRole", normalizedUser.role);
    localStorage.setItem("superAdminUser", JSON.stringify(normalizedUser));
  }
}

export function clearSuperAdminSession() {
  localStorage.removeItem("superAdminToken");
  localStorage.removeItem("superAdminRole");
  localStorage.removeItem("superAdminUser");
}

export function getStoredSuperAdminUser() {
  try {
    const raw = localStorage.getItem("superAdminUser");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      role: normalizeRole(parsed?.role),
    };
  } catch {
    return null;
  }
}

export function getStoredSuperAdminRole() {
  const role = localStorage.getItem("superAdminRole");
  if (role) return normalizeRole(role);
  return normalizeRole(getStoredSuperAdminUser()?.role);
}

export function getStoredSuperAdminToken() {
  return localStorage.getItem("superAdminToken");
}

export function clearAuthSession() {
  [
    "token",
    "user",
    "userId",
    "role",
    "userEmail",
    "societyId",
    "societyName",
    "userName",
    "refreshToken",
    "permissions",
  ].forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  clearSelectedSociety();
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return getCurrentUserFromToken();
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      id: parsed?.id || parsed?.userId || localStorage.getItem("userId") || null,
      userId: parsed?.userId || parsed?.id || localStorage.getItem("userId") || null,
      email: parsed?.email || localStorage.getItem("userEmail") || null,
      name: parsed?.name || parsed?.userName || localStorage.getItem("userName") || null,
      userName: parsed?.userName || parsed?.name || localStorage.getItem("userName") || null,
      societyId: parsed?.societyId || parsed?.society_id || localStorage.getItem("societyId") || null,
      society_id: parsed?.society_id || parsed?.societyId || localStorage.getItem("societyId") || null,
      societyName: parsed?.societyName || parsed?.society_name || localStorage.getItem("societyName") || null,
      society_name: parsed?.society_name || parsed?.societyName || localStorage.getItem("societyName") || null,
      status: parsed?.status || null,
      role: normalizeRole(parsed?.role),
    };
  } catch {
    return getCurrentUserFromToken();
  }
}

export function getStoredRole() {
  const role = localStorage.getItem("role");
  if (role) return normalizeRole(role);
  return normalizeRole(getStoredUser()?.role);
}
