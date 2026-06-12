import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import { clearAuthSession, getStoredRole, getStoredUser } from "../utils/session";
import { logoutUser } from "../services/authApi";
import { useTranslation } from "../contexts/LanguageContext";

function getDashboardRoleLabel(role, t) {
  if (role === "admin") return t("role.admin");
  if (role === "secretary") return t("role.secretary");
  if (role === "super_admin") return t("role.super_admin");
  if (!role) return t("role.resident");
  return role[0].toUpperCase() + role.slice(1);
}

function getRoleTheme(role) {
  const themes = {
    admin: {
      className: "role-dashboard role-dashboard--chairman",
      accent: "20 184 166",
      accent2: "37 99 235",
      label: "Society control",
    },
    chairman: {
      className: "role-dashboard role-dashboard--chairman",
      accent: "20 184 166",
      accent2: "37 99 235",
      label: "Society control",
    },
    secretary: {
      className: "role-dashboard role-dashboard--secretary",
      accent: "16 185 129",
      accent2: "5 150 105",
      label: "Operations",
    },
    resident: {
      className: "role-dashboard role-dashboard--resident",
      accent: "14 165 233",
      accent2: "124 58 237",
      label: "Self service",
    },
    staff: {
      className: "role-dashboard role-dashboard--staff",
      accent: "245 158 11",
      accent2: "37 99 235",
      label: "Work management",
    },
    security: {
      className: "role-dashboard role-dashboard--security",
      accent: "6 182 212",
      accent2: "249 115 22",
      label: "Gate operations",
    },
  };

  return themes[role] || themes.resident;
}

function DashboardLayout({ basePath = "/admin" }) {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const role = getStoredRole();
  const user = getStoredUser();
  const residentType = user?.resident_type || null;
  const roleTheme = getRoleTheme(role);

  // Theme is initialized by the ThemeProvider.

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (error) {
      console.warn("Logout API failed, clearing local session anyway.", error);
    }

    localStorage.clear();
    sessionStorage.clear();
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className={`dashboard-shell min-h-screen text-[var(--text)] ${roleTheme.className}`} style={{
      backgroundColor: "var(--background)",
      color: "var(--text)",
      "--role-accent-rgb": roleTheme.accent,
      "--role-accent-2-rgb": roleTheme.accent2,
      "--dashboard-role-label": `"${roleTheme.label}"`,
    }}>
      <div className="flex min-h-screen">
        <Sidebar
          basePath={basePath}
          role={role}
          open={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavbar
            title={t("dashboard.title", {
              role: `${getDashboardRoleLabel(role, t)}${
                role === "resident" && residentType ? ` (${t(`residentType.${residentType}`)})` : ""
              }`
            })}
            onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
            onLogout={handleLogout}
          />

          <main className="dashboard-main flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <motion.div
              className={`dashboard-page-transition chairman-dashboard-surface ${role === "secretary" ? "secretary-dashboard-surface" : ""} ${role === "resident" ? `resident-dashboard-surface resident-dashboard-surface--${residentType || "owner"}` : ""} ${role === "staff" ? "staff-dashboard-surface" : ""} mx-auto max-w-7xl`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
