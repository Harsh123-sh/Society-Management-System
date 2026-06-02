import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import { useTranslation } from "../contexts/LanguageContext";

function TopNavbar({ title = "Management Dashboard", onMenuClick, onLogout }) {
  const { t } = useTranslation();

  return (
    <header className="dashboard-navbar sticky top-0 z-20 px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm transition md:hidden"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text)"
            }}
          >
            {t("common.menu")}
          </button>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-muted)]">{t("sidebar.approvalCenter")}</p>
            <h1 className="truncate text-lg font-semibold tracking-tight text-[var(--text)] sm:text-xl">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector className="hidden md:block" />
          <ThemeToggle />
          <div className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:block">
            {t("common.live")}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="auth-button auth-button--primary rounded-xl px-4 py-2 text-sm"
            style={{
              backgroundColor: "var(--primary)",
              color: "#FFFFFF"
            }}
          >
            {t("security.logout")}
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopNavbar;
