import { NavLink } from "react-router-dom";
import { useTranslation } from "../contexts/LanguageContext";
import { getStoredUser } from "../utils/session";

function getRoleLabel(role, t) {
  if (role === "admin") return t("role.admin");
  if (role === "secretary") return t("role.secretary");
  if (role === "super_admin") return t("role.super_admin");
  if (!role) return t("role.resident");
  return role[0].toUpperCase() + role.slice(1);
}

const navByRole = {
  admin: [
    { labelKey: "nav.dashboard", to: "dashboard" },
    { labelKey: "nav.messages", to: "messages" },
    { labelKey: "nav.flats", to: "flats" },
    { labelKey: "nav.users", to: "users" },
    { labelKey: "nav.billing", to: "billing" },
    { labelKey: "nav.complaints", to: "complaints" },
    { labelKey: "nav.notices", to: "notices" },
    { labelKey: "nav.archiveCenter", to: "archive-center" },
    { labelKey: "nav.visitors", to: "visitors" },
    { labelKey: "nav.parking", to: "parking" },
    { labelKey: "nav.documents", to: "documents" },
    { labelKey: "nav.staff", to: "staff" },
    { labelKey: "nav.analytics", to: "analytics" },
    { labelKey: "nav.aiAssistant", to: "ai-assistant" },
    { labelKey: "nav.settings", to: "settings" },
    { labelKey: "nav.theme", to: "theme" },
  ],
  secretary: [
    { labelKey: "nav.dashboard", to: "dashboard" },
    { labelKey: "nav.messages", to: "messages" },
    { labelKey: "nav.users", to: "users" },
    { labelKey: "nav.documents", to: "documents" },
    { labelKey: "nav.flats", to: "flats" },
    { labelKey: "nav.billing", to: "billing" },
    { labelKey: "nav.aiAssistant", to: "ai-assistant" },
    { labelKey: "nav.complaints", to: "complaints" },
    { labelKey: "nav.notices", to: "notices" },
    { labelKey: "nav.archiveCenter", to: "archive-center" },
    { labelKey: "nav.visitors", to: "visitors" },
    { labelKey: "nav.staff", to: "staff" },
    { labelKey: "nav.settings", to: "settings" },
  ],
  staff: [
    { labelKey: "nav.dashboard", to: "" },
    { labelKey: "nav.tasks", to: "tasks" },
    { labelKey: "nav.complaints", to: "complaints" },
    { labelKey: "nav.attendance", to: "attendance" },
    { labelKey: "nav.workTracking", to: "work-tracking" },
    { labelKey: "nav.notifications", to: "notifications" },
    { labelKey: "nav.documents", to: "documents" },
    { labelKey: "nav.aiInsights", to: "ai-insights" },
    { labelKey: "nav.aiAssistant", to: "ai-assistant" },
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
  return `${cleanBase}/${childPath}`;
}

function Sidebar({ open, onClose, role = "resident", basePath = "/resident" }) {
  const { t } = useTranslation();
  const user = getStoredUser();
  const residentType = user?.resident_type || "owner";

  let navItems = navByRole[role] || [{ label: "Dashboard", to: "" }];
  if (role === "resident") {
    navItems = residentType === "tenant" ? residentTenantNav : residentOwnerNav;
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-30 theme-modal-backdrop backdrop-blur-sm transition md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`dashboard-sidebar fixed inset-y-0 left-0 z-40 flex w-72 flex-col px-4 py-6 shadow-2xl transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 overflow-hidden rounded-[28px] border p-4 shadow-lg" style={{
          backgroundColor: "var(--sidebar-card)",
          borderColor: "var(--border)"
        }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">{t("brand.eyebrow")}</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--text)]">
                {residentType === "tenant" ? t("sidebar.tenantWorkspace") : t("sidebar.ownerWorkspace")}
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {residentType === "tenant" ? t("sidebar.approvalCenter") : t("sidebar.propertyControl")}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-200">{t("common.live")}</p>
              <p className="text-xs font-semibold text-[var(--text-main)]">Realtime ready</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
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
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
          {navItems.map((item) => (
            item.disabled ? (
              <div
                key={`${basePath}-${item.to || "home"}-${item.labelKey || item.label}`}
                className="flex items-center justify-between rounded-2xl border px-3 py-2.5 text-sm font-medium"
                style={{
                  backgroundColor: "var(--surface-muted)",
                  borderColor: "var(--border)",
                  color: "var(--text-disabled)"
                }}
              >
                <span>{t(item.labelKey || item.label)}</span>
                <span className="text-[10px] uppercase tracking-[0.22em] opacity-60">{t("common.soon")}</span>
              </div>
            ) : (
              <NavLink
                key={`${basePath}-${item.to || "home"}-${item.labelKey || item.label}`}
                to={buildPath(basePath, item.to)}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "text-[var(--text-main)] shadow-lg"
                      : "hover:border-[var(--primary)]"
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? "var(--primary)" : "transparent",
                  borderColor: isActive ? "var(--primary)" : "var(--border)",
                  color: isActive ? "#FFFFFF" : "var(--text)"
                })}
              >
                <span>{t(item.labelKey || item.label)}</span>
                <span className="text-[10px] uppercase tracking-[0.22em] opacity-60 group-hover:opacity-100">
                  {item.to || "home"}
                </span>
              </NavLink>
            )
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
