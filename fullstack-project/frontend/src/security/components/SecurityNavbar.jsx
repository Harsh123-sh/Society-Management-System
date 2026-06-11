import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../../components/ThemeToggle";
import LanguageSelector from "../../components/LanguageSelector";
import { useTranslation } from "../../contexts/LanguageContext";
import { clearAuthSession, getStoredUser } from "../../utils/session";
import { Link } from "react-router-dom";
import { fetchSecurityProfile } from "../../services/securityApi";
import { logoutUser } from "../../services/authApi";

function SecurityNavbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const user = getStoredUser();

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const response = await fetchSecurityProfile();
        if (!mounted) return;
        setProfile(response?.data || null);
      } catch (error) {
        console.error("[SecurityNavbar] profile load failed", error);
        if (!mounted) return;
        setProfile(null);
      } finally {
        if (mounted) {
          setProfileLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const guardName = profile?.name || user?.name || user?.userName || "Security User";
  const guardEmail = profile?.email || user?.email || localStorage.getItem("userEmail") || "";
  const societyName = profile?.society_name || user?.society_name || user?.societyName || localStorage.getItem("societyName") || "";
  const guardRole = profile?.role || user?.role || "security";
  const guardStatus = profile?.status || user?.status || "active";
  const guardInitials = guardName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "S";

  async function handleLogout() {
    setShowProfile(false);
    setShowNotifications(false);

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

  const notifications = [
    { id: 1, title: "Visitor Arrived", message: "Pre-approved guest at Wing A", time: "2 min ago" },
    { id: 2, title: "AI Alert", message: "Repeated unknown visitor detected", time: "5 min ago" },
    { id: 3, title: "Delivery Pending", message: "Courier waiting for B-205", time: "10 min ago" },
  ];

  function openMobileSidebar() {
    window.dispatchEvent(new Event("security-sidebar:open"));
  }

  return (
    <nav className="security-navbar dashboard-navbar fixed left-0 right-0 top-0 z-30 border-b border-[var(--border)] bg-[var(--card-bg)] lg:pl-64">
      <div className="flex items-center justify-between h-20 px-4 lg:px-8">
        {/* Left Section - Guard Info */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openMobileSidebar}
            className="security-icon-button rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] lg:hidden"
          >
            Menu
          </button>
          <div className="security-avatar flex h-11 w-11 items-center justify-center rounded-full bg-[rgb(var(--app-primary-rgb))] text-sm font-bold text-[var(--text-main)]">
            {profileLoading ? "..." : guardInitials}
          </div>
          <div className="hidden md:block">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              {guardName}
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              {guardEmail || t("security.profileLoading")}
            </p>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-4">
          {/* Shift Status */}
          <div className="security-duty-pill hidden items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 lg:flex">
            <span className="text-xs font-semibold text-green-700">
              {t("security.onDuty")}
            </span>
          </div>

          {/* QR Scanner Button */}
            <button className="security-action-button hidden items-center gap-2 rounded-lg bg-[rgb(var(--app-surface-muted-rgb))] px-3 py-2 transition-colors hover:opacity-90 sm:flex">
            <span className="text-lg">📷</span>
              <span className="text-xs font-semibold text-[rgb(var(--app-text-rgb))]">{t("security.qrOcr")}</span>
          </button>

          <LanguageSelector className="hidden lg:block" />
          <ThemeToggle />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
              className="security-icon-button relative rounded-lg p-2 transition-colors hover:bg-[rgb(var(--app-surface-muted-rgb))]"
            >
              🔔
              <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-[var(--text-main)] text-xs flex items-center justify-center font-bold">
                3
              </span>
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="security-dropdown app-surface absolute right-0 mt-2 max-h-96 w-80 space-y-3 overflow-y-auto rounded-lg p-4 shadow-lg">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="cursor-pointer rounded border-l-4 border-red-500 bg-red-50 p-3 transition-colors hover:bg-red-100"
                  >
                    <p className="text-sm font-semibold text-[rgb(var(--app-text-rgb))]">
                      {notif.title}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--app-text-muted-rgb))]">
                      {notif.message}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--app-text-muted-rgb))]">{notif.time}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Assistant */}
          <Link
            className="security-icon-button rounded-lg p-2 transition-colors hover:bg-[rgb(var(--app-surface-muted-rgb))]"
            title={t("security.aiAssistant")}
            to="/security-dashboard/alerts"
          >
            🤖
          </Link>

          {/* Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className="security-icon-button p-2 rounded-lg transition-colors hover:bg-[rgb(var(--app-surface-muted-rgb))] text-[var(--text-primary)]"
            >
              👤
            </button>
            {showProfile && (
              <div className="security-dropdown app-surface absolute right-0 mt-2 w-56 space-y-3 rounded-lg p-4 shadow-lg">
                <div className="border-b border-[rgb(var(--app-border-rgb))] pb-3 text-center">
                  <p className="font-bold text-[rgb(var(--app-text-rgb))]">
                    {guardName}
                  </p>
                  <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">
                    {guardEmail}
                  </p>
                  <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">
                    {societyName || t("security.societyNotAssigned")}
                  </p>
                  <p className="text-xs uppercase tracking-wide text-[rgb(var(--app-text-muted-rgb))]">
                    {guardRole} • {guardStatus}
                  </p>
                </div>

                <Link className="block rounded px-3 py-2 text-left text-sm text-[rgb(var(--app-text-rgb))] transition hover:bg-[rgb(var(--app-surface-muted-rgb))]" to="/security-dashboard/settings">
                  ⚙️ {t("security.settings")}
                </Link>
                <Link className="block rounded px-3 py-2 text-left text-sm text-[rgb(var(--app-text-rgb))] transition hover:bg-[rgb(var(--app-surface-muted-rgb))]" to="/security-dashboard/reports">
                  📋 {t("security.reports")}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-lg bg-red-500 px-3 py-2 text-center text-sm font-semibold text-[var(--text-main)] transition-colors hover:bg-red-600"
                >
                  {t("security.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default SecurityNavbar;
