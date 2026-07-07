import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "../contexts/LanguageContext";
import { getStoredUser } from "../utils/session";
import LanguageSelector from "./LanguageSelector";
import SocietySwitcher from "./SocietySwitcher";
import ThemeSwitcher from "./ThemeSwitcher";
import BrandLogo from "./BrandLogo";
import nexoraLogo from "../assets/branding/nexora-logo.png";
import { BRAND } from "../config/brand";

function NavIcon({ name }) {
  const paths = {
    dashboard: "M4 5.5A1.5 1.5 0 0 1 5.5 4h4A1.5 1.5 0 0 1 11 5.5v4A1.5 1.5 0 0 1 9.5 11h-4A1.5 1.5 0 0 1 4 9.5v-4Zm9 0A1.5 1.5 0 0 1 14.5 4h4A1.5 1.5 0 0 1 20 5.5v2A1.5 1.5 0 0 1 18.5 9h-4A1.5 1.5 0 0 1 13 7.5v-2ZM4 14.5A1.5 1.5 0 0 1 5.5 13h4a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 9.5 20h-4A1.5 1.5 0 0 1 4 18.5v-4Zm9-2A1.5 1.5 0 0 1 14.5 11h4a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5v-6Z",
    residents: "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-12 9a8 8 0 0 1 16 0M19 8v4m2-2h-4",
    property: "M4 20V8l8-4 8 4v12M8 20v-7h8v7M8 10h.01M12 10h.01M16 10h.01",
    visitors: "M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm7 2h4m-2-2v4M3 20a7 7 0 0 1 12 0",
    billing: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6M9 16h4",
    complaints: "M5 5h14v10H8l-3 3V5Zm7 3v3m0 3h.01",
    approval: "M9 12l2 2 4-5M4 5h16v14H4V5Zm4 0V3m8 2V3",
    notices: "M5 5h10l4 4v10H5V5Zm9 0v5h5M8 13h8M8 16h5",
    facilities: "M4 11h16M6 11V7a3 3 0 0 1 6 0v4m6 0V8a2 2 0 0 0-4 0v3M6 11v8m12-8v8M4 19h16",
    parking: "M7 20V4h6a4 4 0 0 1 0 8H7m0 0h6",
    staff: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0M18 7h3m-1.5-1.5v3",
    vendors: "M4 8h16l-2 12H6L4 8Zm3-4h10l1 4H6l1-4Zm2 8h6",
    documents: "M6 3h9l3 3v15H6V3Zm8 0v4h4M9 12h6M9 16h6",
    reports: "M5 19V5m0 14h14M9 16V9m4 7V7m4 9v-5",
    communication: "M4 6h16v10H7l-3 3V6Zm4 4h8m-8 3h5",
    committee: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20a5 5 0 0 1 10 0m-2 0a5 5 0 0 1 10 0",
    settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 4h2M2 12h2m14.36-6.36 1.41-1.41M4.22 19.78l1.42-1.42m0-12.72L4.22 4.22m15.56 15.56-1.42-1.42",
    ai: "M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9L12 3Zm7 11 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z",
  };

  return (
    <svg className="dashboard-sidebar-svg-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name] || paths.dashboard} />
    </svg>
  );
}

function getRoleLabel(role, t) {
  if (role === "admin") return t("role.admin");
  if (role === "secretary") return t("role.secretary");
  if (role === "accountant") return "Accountant";
  if (role === "super_admin") return t("role.super_admin");
  if (!role) return t("role.resident");
  return role[0].toUpperCase() + role.slice(1);
}

const navByRole = {
  admin: [
    { label: "Dashboard", to: "dashboard", icon: "dashboard" },
    { label: "Residents", to: "users", icon: "residents" },
    { label: "Flats & Properties", to: "flats", icon: "property" },
    { label: "Visitors", to: "visitors", icon: "visitors" },
    { label: "Billing & Finance", to: "billing", icon: "billing" },
    { label: "Complaints", to: "complaints", icon: "complaints" },
    { label: "Notices", to: "notices", icon: "notices" },
    { label: "Staff & Security", to: "staff", icon: "staff" },
    { label: "Documents", to: "documents", icon: "documents" },
    { label: "Reports & Analytics", to: "analytics", icon: "reports" },
    { label: "Settings", to: "settings", icon: "settings" },
  ],
  secretary: [
    { label: "Dashboard", to: "dashboard", icon: "dashboard" },
    { label: "Residents", to: "users", icon: "residents" },
    { label: "Flats & Properties", to: "flats", icon: "property" },
    { label: "Visitors", to: "visitors", icon: "visitors" },
    { label: "Billing & Finance", to: "billing", icon: "billing" },
    { label: "Complaints", to: "complaints", icon: "complaints" },
    { label: "Notices", to: "notices", icon: "notices" },
    { label: "Staff & Security", to: "staff", icon: "staff" },
    { label: "Documents", to: "documents", icon: "documents" },
    { label: "Reports & Analytics", to: "analytics", icon: "reports" },
    { label: "Settings", to: "settings", icon: "settings" },
  ],
  accountant: [
    { label: "Finance Overview", to: "dashboard" },
    { label: "Collections", to: "collections" },
    { label: "Expenses", to: "expenses" },
    { label: "Budgets", to: "budgets" },
    { label: "Invoices", to: "invoices" },
    { label: "Financial Reports", to: "financial-reports" },
    { label: "AI Forecasting", to: "ai-assistant" },
  ],
  staff: [
    { label: "Dashboard", to: "dashboard", icon: "dashboard" },
    { label: "My Tasks", to: "tasks", icon: "complaints" },
    { label: "Complaint Work", to: "complaint-work", icon: "approval" },
    { label: "Attendance", to: "attendance", icon: "reports" },
    { label: "Duty Schedule", to: "duty-schedule", icon: "notices" },
    { label: "Leave Management", to: "leave-management", icon: "documents" },
    { label: "Material Requests", to: "material-requests", icon: "vendors" },
    { label: "Emergency Tasks", to: "emergency-tasks", icon: "security" },
    { label: "Salary & Payslips", to: "salary-payslips", icon: "billing" },
    { label: "Notices", to: "notices", icon: "communication" },
    { label: "Performance", to: "performance", icon: "ai" },
    { label: "Profile & Documents", to: "profile-documents", icon: "staff" },
  ],
  security: [
    { labelKey: "nav.securityOps", to: "" },
    { labelKey: "nav.visitors", to: "visitors" },
    { labelKey: "nav.notices", to: "notices" },
  ],
};

const residentOwnerNav = [
  { labelKey: "nav.dashboard", to: "" },
  { labelKey: "nav.flats", to: "flats" },
  { labelKey: "nav.tenant", to: "tenant" },
  { labelKey: "nav.visitors", to: "visitors" },
  { labelKey: "nav.billing", to: "billing" },
  { labelKey: "nav.maintenance", to: "complaints" },
  { labelKey: "nav.complaints", to: "complaints" },
  { labelKey: "nav.parking", to: "parking" },
  { labelKey: "nav.documents", to: "documents" },
  { labelKey: "nav.analytics", to: "analytics" },
  { labelKey: "nav.aiAssistant", to: "ai-assistant" },
  { labelKey: "nav.notices", to: "notices" },
  { labelKey: "nav.community", to: "messages", disabled: true },
  { labelKey: "nav.securityLogs", to: "visitors", disabled: true },
  { labelKey: "nav.notifications", to: "chat", disabled: true },
  { labelKey: "nav.emergencySos", to: "complaints", disabled: true },
  { labelKey: "nav.messages", to: "chat" },
  { labelKey: "nav.settings", to: "settings" },
];

const residentTenantNav = [
  { labelKey: "nav.dashboard", to: "" },
  { labelKey: "nav.messages", to: "chat" },
  { labelKey: "nav.payments", to: "billing" },
  { labelKey: "nav.aiAssistant", to: "ai-assistant" },
  { labelKey: "nav.complaints", to: "complaints" },
  { labelKey: "nav.visitors", to: "visitors" },
  { labelKey: "nav.notices", to: "notices" },
  { labelKey: "nav.documents", to: "documents" },
  { labelKey: "nav.profile", to: "profile" },
];

function buildPath(basePath, childPath) {
  const cleanBase = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  if (!childPath) return cleanBase;
  if (childPath.startsWith("/")) return childPath;
  if (childPath.startsWith("#")) return `${cleanBase}${childPath}`;
  return `${cleanBase}/${childPath}`;
}

function Sidebar({ open, onClose, role = "resident", basePath = "/resident", collapsed = false, onToggleCollapse }) {
  const { t } = useTranslation();
  const user = getStoredUser();
  const residentType = user?.resident_type || "owner";
  const staffSocietyName = user?.societyName || user?.society_name || "";
  const staffSocietyCode = user?.societyCode || user?.society_code || "";
  const staffRoleLabel = user?.designation || user?.staffRole || getRoleLabel(user?.role || role, t);

  let navItems = navByRole[role] || [{ label: "Dashboard", to: "" }];
  if (role === "resident") {
    navItems = residentType === "tenant" ? residentTenantNav : residentOwnerNav;
  }

  const isLeadershipRole = ["admin", "secretary"].includes(role);
  const isStaffRole = role === "staff";
  const [societyLogoUrl, setSocietyLogoUrl] = useState(() => localStorage.getItem("societyLogoUrl") || BRAND.logo);

  useEffect(() => {
    const refreshLogo = () => setSocietyLogoUrl(localStorage.getItem("societyLogoUrl") || BRAND.logo);
    window.addEventListener("chairman-settings:logo-updated", refreshLogo);
    window.addEventListener("storage", refreshLogo);
    return () => {
      window.removeEventListener("chairman-settings:logo-updated", refreshLogo);
      window.removeEventListener("storage", refreshLogo);
    };
  }, []);
  const getItemLabel = (item) => item.labelKey ? t(item.labelKey, item.label) : item.label;
  const getNavItemClass = (isActive = false) =>
    `dashboard-sidebar-item group flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all ${
      isActive ? "is-active text-white shadow-lg" : "hover:border-[var(--primary)]"
    }`;
  const getNavItemStyle = (isActive = false) => ({
    background: isActive ? "var(--active)" : "transparent",
    borderColor: isActive ? "transparent" : "var(--border)",
    color: isActive ? "var(--active-text)" : "var(--sidebar-text, var(--text))"
  });

  return (
    <>
      <div
        className={`fixed inset-0 z-30 theme-modal-backdrop backdrop-blur-sm transition md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`dashboard-sidebar fixed inset-y-0 left-0 z-40 flex flex-col shadow-2xl transition-transform md:static md:translate-x-0 ${
          collapsed ? "dashboard-sidebar--collapsed" : ""
        } ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className={`dashboard-sidebar-brand mb-6 overflow-visible rounded-[28px] border p-4 shadow-lg ${isLeadershipRole ? "dashboard-sidebar-brand--leadership" : ""}`} style={{
          backgroundColor: "var(--sidebar-card)",
          borderColor: "var(--border)"
        }}>
          <button
            type="button"
            className="dashboard-sidebar-collapse"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            {collapsed ? ">" : "<"}
          </button>

          {isStaffRole ? (
            <div className="dashboard-sidebar-brand__leadership">
              <span className="staff-sidebar-logo">
                <img src={nexoraLogo} alt="" />
              </span>
              <div className="dashboard-sidebar-product dashboard-sidebar-text">
                <strong>NEXORA</strong>
                <span>Smart Society Platform</span>
              </div>
            </div>
          ) : isLeadershipRole ? (
            <div className="dashboard-sidebar-brand__leadership">
              <img className="dashboard-sidebar-logo-img" src={societyLogoUrl} alt="Nexora" />
              <div className="dashboard-sidebar-product dashboard-sidebar-text">
                <strong>Nexora</strong>
                <span>Smart Society Management</span>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <BrandLogo variant="compact" />
                  <p className="dashboard-sidebar-text mt-3 text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{t("brand.eyebrow")}</p>
                  <h2 className="dashboard-sidebar-text mt-2 text-xl font-semibold tracking-tight text-[var(--text)]">
                    {residentType === "tenant" ? t("sidebar.tenantWorkspace") : t("sidebar.ownerWorkspace")}
                  </h2>
                  <p className="dashboard-sidebar-text mt-1 text-sm text-[var(--text-muted)]">
                    {residentType === "tenant" ? t("sidebar.approvalCenter") : t("sidebar.propertyControl")}
                  </p>
                </div>
              </div>

              <div className="dashboard-sidebar-text mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border px-3 py-2" style={{
                  backgroundColor: "var(--surface-muted)",
                  borderColor: "var(--border)"
                }}>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{t("common.role")}</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">{getRoleLabel(role, t)}</p>
                </div>
                <div className="rounded-2xl border px-3 py-2" style={{
                  backgroundColor: "var(--surface-muted)",
                  borderColor: "var(--border)"
                }}>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{t("common.mode")}</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">{residentType === "tenant" ? t("residentType.tenant") : t("residentType.owner")}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
          {navItems.map((item) => (
            item.disabled ? (
              <div
                key={`${basePath}-${item.to || "home"}-${item.labelKey || item.label}`}
                className="dashboard-sidebar-item flex items-center justify-between rounded-2xl border px-3 py-2.5 text-sm font-medium"
                data-tooltip={getItemLabel(item)}
                style={{
                  backgroundColor: "var(--surface-muted)",
                  borderColor: "var(--border)",
                  color: "var(--text-disabled)"
                }}
              >
                <span className="dashboard-sidebar-label">{item.labelKey ? t(item.labelKey, item.label) : item.label}</span>
                <span className="dashboard-sidebar-label text-[10px] uppercase tracking-[0.22em] opacity-60">{t("common.soon")}</span>
              </div>
            ) : item.to?.startsWith("#") ? (
              <a
                key={`${basePath}-${item.to || "home"}-${item.labelKey || item.label}`}
                href={buildPath(basePath, item.to)}
                onClick={onClose}
                title={collapsed ? getItemLabel(item) : undefined}
                aria-label={getItemLabel(item)}
                data-tooltip={getItemLabel(item)}
                className={getNavItemClass(false)}
                style={getNavItemStyle(false)}
              >
                {item.icon ? <span className="dashboard-sidebar-nav-icon"><NavIcon name={item.icon} /></span> : null}
                <span className="dashboard-sidebar-label min-w-0 flex-1">{getItemLabel(item)}</span>
              </a>
            ) : (
              <NavLink
                key={`${basePath}-${item.to || "home"}-${item.labelKey || item.label}`}
                to={buildPath(basePath, item.to)}
                onClick={onClose}
                title={collapsed ? getItemLabel(item) : undefined}
                aria-label={getItemLabel(item)}
                data-tooltip={getItemLabel(item)}
                className={({ isActive }) => getNavItemClass(isActive)}
                style={({ isActive }) => getNavItemStyle(isActive)}
              >
                {item.icon ? <span className="dashboard-sidebar-nav-icon"><NavIcon name={item.icon} /></span> : null}
                <span className="dashboard-sidebar-label min-w-0 flex-1">{getItemLabel(item)}</span>
                {item.restricted ? <span className="dashboard-sidebar-label dashboard-sidebar-lock">Limited</span> : null}
              </NavLink>
            )
          ))}
        </nav>
        {isLeadershipRole ? null : isStaffRole ? (
          <div className="dashboard-sidebar-text staff-sidebar-assignment mt-5 space-y-3 rounded-3xl border p-3">
            <div>
              <p>Assigned Society</p>
              <strong>{staffSocietyName || "Society access not found"}</strong>
            </div>
            <div>
              <p>Society Code</p>
              <strong>{staffSocietyCode || "Please login again"}</strong>
            </div>
            <div>
              <p>Staff Role</p>
              <strong>{staffRoleLabel}</strong>
            </div>
          </div>
        ) : (
          <div className="dashboard-sidebar-text mt-5 space-y-3 rounded-3xl border p-3" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--border-color)" }}>
            <SocietySwitcher compact />
            <ThemeSwitcher />
            <LanguageSelector />
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
