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

function DashboardLayout({ basePath = "/admin" }) {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const role = getStoredRole();
  const user = getStoredUser();
  const residentType = user?.resident_type || null;

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
    <div className="dashboard-shell min-h-screen text-[var(--text)]" style={{
      backgroundColor: "var(--background)",
      color: "var(--text)"
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
              className={`surface-card chairman-dashboard-surface ${role === "secretary" ? "secretary-dashboard-surface" : ""} ${role === "resident" ? `resident-dashboard-surface resident-dashboard-surface--${residentType || "owner"}` : ""} ${role === "staff" ? "staff-dashboard-surface" : ""} mx-auto max-w-7xl overflow-hidden p-4 xl:p-6`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-elevated)"
            }}>
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
