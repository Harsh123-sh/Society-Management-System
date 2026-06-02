import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import LanguageSelector from "./components/LanguageSelector";
import { useTranslation } from "./contexts/LanguageContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OtpVerificationPage from "./pages/OtpVerificationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import AdminOverviewPage from "./pages/AdminOverviewPage";
import DashboardPage from "./pages/DashboardPage";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import SecretaryHomePage from "./pages/SecretaryHomePage";
import StaffHomePage from "./pages/StaffHomePage";
import StaffTasksPage from "./pages/StaffTasksPage";
import StaffComplaintsPage from "./pages/StaffComplaintsPage";
import StaffAttendancePage from "./pages/StaffAttendancePage";
import StaffWorkTrackingPage from "./pages/StaffWorkTrackingPage";
import StaffNotificationsPage from "./pages/StaffNotificationsPage";
import StaffDocumentsPage from "./pages/StaffDocumentsPage";
import StaffAIInsightsPage from "./pages/StaffAIInsightsPage";
import ResidentDashboardRouterPage from "./pages/ResidentDashboardRouterPage";
import OwnerTenantPage from "./pages/OwnerTenantPage";
import OwnerAnalyticsPage from "./pages/OwnerAnalyticsPage";
import OwnerSettingsPage from "./pages/OwnerSettingsPage";
import TenantVisitorsPage from "./pages/TenantVisitorsPage";
import TenantProfilePage from "./pages/TenantProfilePage";
import BillingPage from "./pages/BillingPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import NoticesPage from "./pages/NoticesPage";
import ArchiveCenterPage from "./pages/ArchiveCenterPage";
import ChatPage from "./pages/ChatPage";
import AiAssistantPage from "./pages/AiAssistantPage";
import VisitorsPage from "./pages/VisitorsPage";
import FlatsPage from "./pages/FlatsPage";
import DocumentsPage from "./pages/DocumentsPage";
import ParkingPage from "./pages/ParkingPage";
import StaffManagementPage from "./pages/StaffManagementPage";
import SettingsPage from "./pages/SettingsPage";
import ThemeAdminPage from "./pages/ThemeAdminPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import ChairmanUserManagementPage from "./pages/ChairmanUserManagementPage";
import SuperAdminLoginPage from "./pages/SuperAdminLoginPage";
import SuperAdminForgotPasswordPage from "./pages/SuperAdminForgotPasswordPage";
import SuperAdminVerifyOtpPage from "./pages/SuperAdminVerifyOtpPage";
import SuperAdminResetPasswordPage from "./pages/SuperAdminResetPasswordPage";
import SuperAdminDashboardPage from "./pages/SuperAdminDashboardPage";
import SuperAdminSocietyDetailsPage from "./pages/SuperAdminSocietyDetailsPage";
import SuperAdminProtectedRoute from "./components/SuperAdminProtectedRoute";
import NotFoundPage from "./pages/NotFoundPage";
import SecurityRouter from "./security/SecurityRouter";
import { societyPresets as societyThemes } from "./theme/societyPresets";
import { useThemeEngine } from "./contexts/ThemeContext";
import { fetchPublicSocieties, fetchSocietyLivePreview } from "./services/authApi";

const heroStats = [
  { value: "24/7", label: "AI automation and alerts" },
  { value: "12x", label: "Faster complaint routing" },
  { value: "99.95%", label: "Realtime uptime target" },
  { value: "6", label: "Role-specific dashboards" },
];

const capabilities = [
  {
    title: "Multi-society tenancy",
    description: "One SaaS core, isolated society branding, permissions, data, and workflows.",
  },
  {
    title: "AI assistant",
    description: "Society-aware chat that drafts notices, answers queries, and routes tasks.",
  },
  {
    title: "WhatsApp-style chat",
    description: "Fast resident-to-admin messaging with attachments, typing, and delivery states.",
  },
  {
    title: "Visitor management",
    description: "Gate approvals, QR passes, OCR identity capture, and live entry logs.",
  },
  {
    title: "Billing & payments",
    description: "Invoices, dues, reminders, receipts, and payment reconciliation across societies.",
  },
  {
    title: "Complaint intelligence",
    description: "Priority scoring, SLA tracking, auto-assignments, and escalation policies.",
  },
  {
    title: "Realtime notifications",
    description: "Socket-driven updates for visitors, notices, bills, chats, and approvals.",
  },
  {
    title: "Mobile-first access",
    description: "Android and iOS-ready experiences for residents, staff, and managers.",
  },
];

const roleCards = [
  {
    title: "Super admin SaaS panel",
    points: ["Society provisioning", "Subscription plans", "Global analytics", "Brand governance"],
  },
  {
    title: "Society admin dashboard",
    points: ["Member control", "Bills and collections", "Notice broadcasting", "Staff oversight"],
  },
  {
    title: "Secretary console",
    points: ["Approvals", "Events", "Documents", "Meeting records"],
  },
  {
    title: "Staff workspace",
    points: ["Task queue", "Attendance", "Work logs", "Escalations"],
  },
  {
    title: "Resident portal",
    points: ["Chat", "Payments", "Complaints", "Family management"],
  },
  {
    title: "Security station",
    points: ["Visitor approvals", "Gate logs", "Alert broadcast", "Incident reports"],
  },
];

function findPresetForSociety(society) {
  const normalized = String(society?.id || society?.code || society?.name || "").toLowerCase();
  return societyThemes.find(
    (preset) =>
      String(preset.id).toLowerCase() === normalized ||
      String(preset.name).toLowerCase() === String(society?.name || "").toLowerCase() ||
      String(preset.id).toLowerCase() === String(society?.code || "").toLowerCase()
  );
}

function hexToRgbString(color) {
  if (!color || typeof color !== "string") {
    return "20 184 166";
  }

  const value = color.trim();
  if (/^\d+\s+\d+\s+\d+$/.test(value)) {
    return value;
  }

  const hex = value.replace('#', '');
  if (![3, 6].includes(hex.length)) {
    return "20 184 166";
  }

  const normalized = hex.length === 3 ? hex.split('').map((item) => item + item).join('') : hex;
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  if ([red, green, blue].some((item) => Number.isNaN(item))) {
    return "20 184 166";
  }

  return `${red} ${green} ${blue}`;
}

function parseThemeJson(themeJson) {
  if (!themeJson) return {};
  if (typeof themeJson === "object") return themeJson;

  try {
    return JSON.parse(themeJson);
  } catch {
    return {};
  }
}

function resolveSocietyBranding(society) {
  const preset = findPresetForSociety(society) || societyThemes[0];
  const themeJson = parseThemeJson(society?.theme_json);

  return {
    accentRgb: hexToRgbString(society?.accent_color || preset.accentRgb),
    heroStart: society?.primary_color || preset.heroStart,
    heroEnd: society?.secondary_color || preset.heroEnd,
    label: society?.subscription_plan || society?.plan || preset.label,
    summary: society?.status ? `${society.status} society control center` : preset.summary,
    stat: preset.stat,
    themeMode: themeJson.mode || society?.theme_mode || "dark",
    fontFamily: society?.font_family || themeJson.fontFamily || preset.fontFamily || "Manrope",
    logoUrl: society?.logo_url || themeJson.logoUrl || preset.logoUrl || "",
    faviconUrl: society?.favicon_url || themeJson.faviconUrl || preset.faviconUrl || "",
  };
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

const architectureTabs = [
  {
    id: "frontend",
    title: "Frontend architecture",
    summary: "Next.js or React shell with Tailwind, motion, and a design-token theme engine.",
    signals: ["Responsive layouts", "Dark/light mode", "Role-aware navigation"],
    items: ["Design tokens", "Shared components", "Dashboard shells", "Mobile adapters"],
  },
  {
    id: "backend",
    title: "Backend architecture",
    summary: "Node.js or Django REST API with JWT auth, tenant scoping, and modular services.",
    signals: ["REST endpoints", "Secure auth", "Multi-tenant guards"],
    items: ["Auth service", "Tenant isolation", "Billing service", "Notification service"],
  },
  {
    id: "ai",
    title: "AI workflow",
    summary: "OpenAI-powered assistant, NLP routing, OCR extraction, translation, and automation.",
    signals: ["OCR scans", "Translated messages", "Automation rules"],
    items: ["Prompt router", "Context memory", "Task generation", "Insight summarizer"],
  },
  {
    id: "realtime",
    title: "Realtime layer",
    summary: "Socket.io events keep chats, approvals, payments, and incidents instantly synced.",
    signals: ["Presence indicators", "Delivery receipts", "Live admin updates"],
    items: ["Socket channels", "Push queues", "Event stream", "Offline recovery"],
  },
  {
    id: "security",
    title: "Security model",
    summary: "Role-based access control, audit logs, encryption, and tenant-level permissions.",
    signals: ["RBAC policies", "Audit trails", "Signed uploads"],
    items: ["JWT sessions", "MFA ready", "Policy engine", "Rate limiting"],
  },
  {
    id: "cloud",
    title: "Cloud deployment",
    summary: "Render or AWS deployment with Cloudinary assets, Firebase notifications, and autoscaling.",
    signals: ["Managed storage", "CDN assets", "Horizontal scale"],
    items: ["Web app", "API service", "Worker jobs", "Database cluster"],
  },
];

const aiWorkflow = [
  "Resident sends a complaint, bill query, or visitor request.",
  "AI classifies intent, extracts details, and checks society context.",
  "Automation routes the task to the right role and suggests a response.",
  "Realtime notifications update everyone until the task is resolved.",
];

function SectionHeader({ eyebrow, title, description, align = "left" }) {
  return (
    <div className={`section-header section-header--${align}`}>
      <span className="section-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function App() {
  const { t } = useTranslation();
  // Theme is initialized by the ThemeProvider and appearance loader.

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/select-role" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<OtpVerificationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />
      <Route path="/403" element={<AccessDeniedPage />} />
      <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
      <Route path="/super-admin/forgot-password" element={<SuperAdminForgotPasswordPage />} />
      <Route path="/super-admin/verify-otp" element={<SuperAdminVerifyOtpPage />} />
      <Route path="/super-admin/reset-password" element={<SuperAdminResetPasswordPage />} />
      <Route
        path="/super-admin/dashboard"
        element={
          <SuperAdminProtectedRoute>
            <SuperAdminDashboardPage />
          </SuperAdminProtectedRoute>
        }
      />
      <Route
        path="/super-admin/societies/:id"
        element={
          <SuperAdminProtectedRoute>
            <SuperAdminSocietyDetailsPage />
          </SuperAdminProtectedRoute>
        }
      />
      <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />

      <Route element={<ProtectedRoute allowedRoles={["admin", "secretary", "super_admin"]} />}>
        <Route path="/archive-center" element={<ArchiveCenterPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["security"]} />}>
        <Route path="/security-dashboard/*" element={<SecurityRouter />} />
        <Route path="/security/dashboard/*" element={<Navigate to="/security-dashboard" replace />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["admin", "chairman"]} />}>
        <Route path="/chairman" element={<DashboardLayout basePath="/chairman" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminOverviewPage />} />
          <Route path="users" element={<ChairmanUserManagementPage />} />
          <Route path="flats" element={<FlatsPage />} />
          <Route path="residents" element={<Navigate to="/chairman/users" replace />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="messages" element={<ChatPage />} />
          <Route path="notices" element={<NoticesPage />} />
          <Route path="visitors" element={<VisitorsPage />} />
          <Route path="parking" element={<ParkingPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="staff" element={<StaffManagementPage />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="ai-assistant" element={<AiAssistantPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="theme" element={<ThemeAdminPage />} />
          <Route path="users" element={<Navigate to="/chairman/users" replace />} />
          <Route path="products" element={<Navigate to="/chairman/documents" replace />} />
        </Route>

        <Route path="/admin" element={<DashboardLayout basePath="/admin" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminOverviewPage />} />
          <Route path="flats" element={<FlatsPage />} />
          <Route path="users" element={<Navigate to="/chairman/users" replace />} />
          <Route path="residents" element={<Navigate to="/chairman/users" replace />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="messages" element={<ChatPage />} />
          <Route path="notices" element={<NoticesPage />} />
          <Route path="visitors" element={<VisitorsPage />} />
          <Route path="parking" element={<ParkingPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="staff" element={<StaffManagementPage />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="ai-assistant" element={<AiAssistantPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="theme" element={<ThemeAdminPage />} />
          <Route path="users" element={<Navigate to="/admin/residents" replace />} />
          <Route path="products" element={<Navigate to="/admin/documents" replace />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["secretary"]} />}>
        <Route path="/secretary" element={<DashboardLayout basePath="/secretary" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SecretaryHomePage />} />
          <Route path="users" element={<ChairmanUserManagementPage />} />
          <Route path="residents" element={<Navigate to="/secretary/users" replace />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="flats" element={<FlatsPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="ai-assistant" element={<AiAssistantPage />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="notices" element={<NoticesPage />} />
          <Route path="visitors" element={<VisitorsPage />} />
          <Route path="staff" element={<StaffManagementPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
        <Route path="/staff" element={<DashboardLayout basePath="/staff" />}>
          <Route index element={<StaffHomePage />} />
          <Route path="tasks" element={<StaffTasksPage />} />
          <Route path="complaints" element={<StaffComplaintsPage />} />
          <Route path="attendance" element={<StaffAttendancePage />} />
          <Route path="work-tracking" element={<StaffWorkTrackingPage />} />
          <Route path="notifications" element={<StaffNotificationsPage />} />
          <Route path="documents" element={<StaffDocumentsPage />} />
          <Route path="ai-insights" element={<StaffAIInsightsPage />} />
          <Route path="ai-assistant" element={<AiAssistantPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["resident"]} />}>
        <Route path="/resident" element={<DashboardLayout basePath="/resident" />}>
          <Route index element={<ResidentDashboardRouterPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="ai-assistant" element={<AiAssistantPage />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="messages" element={<ChatPage />} />
          <Route path="notices" element={<NoticesPage />} />
          <Route path="flats" element={<FlatsPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="parking" element={<ParkingPage />} />
          <Route path="tenant" element={<OwnerTenantPage />} />
          <Route path="analytics" element={<OwnerAnalyticsPage />} />
          <Route path="settings" element={<OwnerSettingsPage />} />
          <Route path="visitors" element={<TenantVisitorsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="profile" element={<TenantProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { preferences, setThemeMode, setSelectedSocietyId } = useThemeEngine();
  const [activeArchitecture, setActiveArchitecture] = useState("frontend");
  const [publicSocieties, setPublicSocieties] = useState([]);
  const [publicLoading, setPublicLoading] = useState(true);
  const [publicError, setPublicError] = useState("");
  const [livePreview, setLivePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const heroStats = t("heroStats", []);
  const capabilities = t("capabilities", []);
  const roleCards = t("roleCards", []);
  const architectureTabs = t("architectureTabs", []);
  const aiWorkflow = t("aiWorkflow", []);
  const mobileList = t("mobile.list", []);
  const footerItems = [
    t("footer.item1"),
    t("footer.item2"),
    t("footer.item3"),
    t("footer.item4"),
  ];

  const activeArchitectureItem =
    architectureTabs.find((item) => item.id === activeArchitecture) ?? architectureTabs[0];

  const loadPublicSocieties = async () => {
    setPublicLoading(true);
    setPublicError("");

    try {
      console.log("[PublicSocietyAPI] fetchPublicSocieties -> /api/public/societies");
      const response = await fetchPublicSocieties();
      console.log("[PublicSocietyAPI] fetchPublicSocieties response:", response);
      setPublicSocieties(
        Array.isArray(response?.data)
          ? response.data.map((society) => ({
              ...society,
              name: society.society_name || society.name || society.code || "Society",
            }))
          : []
      );
    } catch (error) {
      console.error("[PublicSocietyAPI] fetchPublicSocieties error:", error?.response?.data || error?.message || error);
      setPublicSocieties([]);
      setPublicError("No societies available yet.");
    } finally {
      setPublicLoading(false);
    }
  };

  useEffect(() => {
    loadPublicSocieties();
  }, []);

  useEffect(() => {
    const onSocietyChange = () => {
      loadPublicSocieties();
    };

    window.addEventListener("societies:changed", onSocietyChange);
    return () => window.removeEventListener("societies:changed", onSocietyChange);
  }, []);

  useEffect(() => {
    if (!publicSocieties.length) {
      return;
    }

    const selectedId = String(preferences.selectedSocietyId || "");
    const hasValidSelection = publicSocieties.some((society) => String(society.id) === selectedId);

    if (!hasValidSelection) {
      setSelectedSocietyId(String(publicSocieties[0].id));
    }
  }, [publicSocieties, preferences.selectedSocietyId, setSelectedSocietyId]);

  const effectiveSocietyId = useMemo(() => {
    if (!publicSocieties.length) {
      return "";
    }

    const candidate = publicSocieties.find((society) => String(society.id) === String(preferences.selectedSocietyId));
    return candidate ? String(candidate.id) : String(publicSocieties[0]?.id || "");
  }, [publicSocieties, preferences.selectedSocietyId]);

  useEffect(() => {
    if (!effectiveSocietyId) {
      return;
    }

    setLivePreview(null);
    setPreviewError("");
    setPreviewLoading(true);

    fetchSocietyLivePreview(effectiveSocietyId)
      .then((response) => {
        setLivePreview(response?.data?.livePreview || null);
      })
      .catch(() => {
        setPreviewError("Unable to fetch society analytics. Please try again later.");
      })
      .finally(() => {
        setPreviewLoading(false);
      });
  }, [effectiveSocietyId]);

  const renderedSocieties = publicSocieties;
  const activeSociety = renderedSocieties.find((society) => String(society.id) === String(effectiveSocietyId)) || renderedSocieties[0] || { id: "", name: "Society", status: "active" };
  const activeSocietyPreset = resolveSocietyBranding(activeSociety);
  const activeSocietyLabel = activeSociety.subscription_plan || activeSociety.status || activeSocietyPreset.label;
  const activeSocietySummary = activeSocietyPreset.summary;
  const activeSocietyStat = livePreview?.totalFlats
    ? `${livePreview.totalFlats} flats • ${livePreview.occupiedFlats} occupied`
    : activeSocietyPreset.stat;
  const liveData = livePreview || null;

  useEffect(() => {
    document.title = `${activeSociety.name} | AI Society Management SaaS`;

    return () => {
      document.title = "Society Management System";
    };
  }, [activeSociety.name]);

  return (
    <main
      className="app-shell"
      style={{
        "--brand-rgb": activeSocietyPreset.accentRgb,
        "--hero-start": activeSocietyPreset.heroStart,
        "--hero-end": activeSocietyPreset.heroEnd,
        "--app-font-sans": activeSocietyPreset.fontFamily,
      }}
    >
      <header className="topbar glass-panel">
        <div className="topbar-brand brand-lockup">
          <div className="brand-mark">A</div>
          <div>
            <p className="brand-eyebrow">{t("brand.eyebrow")}</p>
            <h1>{t("brand.title")}</h1>
          </div>
        </div>

        <div className="topbar-center">
          <div className="society-switcher" aria-label={t("brand.eyebrow") + " selector"}>
            {publicLoading ? (
              <div className="society-chip">{t("common.loadingActiveSocieties")}</div>
            ) : publicError ? (
              <div className="society-chip">{publicError}</div>
            ) : publicSocieties.length ? (
              publicSocieties.map((society) => {
                const theme = findPresetForSociety(society) || societyThemes[0];
                return (
                  <button
                    key={society.id}
                    type="button"
                    className={`society-chip ${String(preferences.selectedSocietyId) === String(society.id) ? "is-active" : ""}`}
                    onClick={() => setSelectedSocietyId(String(society.id))}
                  >
                    <span className="society-chip__dot" style={{ background: theme.heroEnd }} />
                    <span>{society.name}</span>
                  </button>
                );
              })
            ) : (
              <div className="society-chip">{t("common.noSocietiesAvailable")}</div>
            )}
          </div>
        </div>

        <div className="topbar-actions">
          <LanguageSelector className="hidden lg:block" />
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setThemeMode(preferences.themeMode === "dark" ? "light" : "dark")}
          >
            {preferences.themeMode === "dark" ? t("actions.lightMode") : t("actions.darkMode")}
          </button>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => navigate("/login")}
          >
            {t("actions.signIn")}
          </button>
          <Link className="button button--primary" to="/register">
            {t("actions.startFreeTrial")}
          </Link>
        </div>
      </header>

      <section className="hero-grid glass-panel hero-panel">
        <div className="hero-copy">
          <span className="eyebrow-pill">{t("hero.eyebrow")}</span>
          <h2>{t("hero.title")}</h2>
          <p className="hero-description">{t("hero.description")}</p>

          <div className="hero-actions">
            <Link className="button button--primary button--large" to="/register">
              {t("hero.launchPlatform")}
            </Link>
            <a className="button button--ghost button--large" href="#architecture">
              {t("hero.exploreArchitecture")}
            </a>
          </div>

          <div className="feature-strips">
            {t("heroFeatures", []).map((feature) => (
              <span key={feature}>{feature}</span>
            ))}
          </div>

          <div className="hero-stats">
            {heroStats.map((stat) => (
              <article key={stat.label} className="metric-card glass-card">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="hero-visual glass-card">
          <div className="hero-visual__header">
            <div>
              <p className="brand-eyebrow">{t("hero.liveLens")}</p>
              <h3>{activeSociety.name}</h3>
            </div>
            <span className="status-chip">{activeSocietyLabel}</span>
          </div>

          <div
            className="hero-visual__dashboard"
            style={{ background: `linear-gradient(160deg, ${activeSocietyPreset.heroStart}, ${activeSocietyPreset.heroEnd})` }}
          >
            <div className="dashboard-surface">
              {previewLoading ? (
                <div className="space-y-6">
                  <div className="dashboard-row dashboard-row--split">
                    <div>
                      <p className="dashboard-label">{t("hero.health")}</p>
                      <strong className="animate-pulse">{t("hero.fetchingAnalytics")}</strong>
                    </div>
                    <span className="pulse-dot">{t("common.loading")}</span>
                    <div className="h-16 rounded-2xl bg-slate-900/20" />
                  </div>

                  <div className="dashboard-grid">
                    {[...Array(4)].map((_, index) => (
                      <article key={index} className="h-24 rounded-3xl bg-slate-900/20" />
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="dashboard-row dashboard-row--split">
                    <div>
                      <p className="dashboard-label">{t("hero.health")}</p>
                      <strong>
                        {liveData?.totalResidents
                          ? `${liveData.totalResidents.toLocaleString()} ${t("hero.residentsLabel")}`
                          : t("hero.noResidents")}
                      </strong>
                    </div>
                    <span className="pulse-dot">{t("hero.realtime")}</span>
                  </div>

                  <div className="assistant-card">
                    <div>
                      <p className="dashboard-label">{t("hero.assistant")}</p>
                      <h4>
                        {liveData?.aiTaskCount
                          ? `${liveData.aiTaskCount} ${t("hero.aiTasks")}`
                          : t("hero.noAiTasks")}
                      </h4>
                    </div>
                    <div className="assistant-chat">
                      {liveData?.maintenanceAlerts?.length ? (
                        <span>{liveData.maintenanceAlerts[0].title}</span>
                      ) : liveData?.notices?.length ? (
                        <span>{liveData.notices[0].title}</span>
                      ) : (
                        <span>{t("hero.societySetupInProgress")}</span>
                      )}
                    </div>
                  </div>

                  <div className="dashboard-grid">
                    <article>
                      <span>{t("hero.paymentsCollected")}</span>
                      <strong>
                        {liveData?.totalCollections
                          ? formatCurrency(liveData.totalCollections)
                          : t("hero.noPaymentRecords")}
                      </strong>
                    </article>
                    <article>
                      <span>{t("hero.openComplaints")}</span>
                      <strong>
                        {liveData?.pendingComplaints ? liveData.pendingComplaints : t("hero.noComplaintsFound")}
                      </strong>
                    </article>
                    <article>
                      <span>{t("hero.todaysVisitors")}</span>
                      <strong>
                        {liveData?.todayVisitors ? liveData.todayVisitors : t("hero.noVisitorActivity")}
                      </strong>
                    </article>
                    <article>
                      <span>{t("hero.aiTasks")}</span>
                      <strong>
                        {liveData?.aiTaskCount ? liveData.aiTaskCount : t("hero.noAiTasks")}
                      </strong>
                    </article>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mini-rail">
            <div>
              <span className="mini-rail__label">{t("hero.brandPack")}</span>
              <strong>{activeSociety.name}</strong>
              <p>{activeSocietySummary}</p>
            </div>
            <div>
              <span className="mini-rail__label">{t("hero.flats")}</span>
              <strong>{activeSocietyStat}</strong>
              <p>{t("hero.brandSummary")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <SectionHeader
          eyebrow={t("sections.capabilities.eyebrow")}
          title={t("sections.capabilities.title")}
          description={t("sections.capabilities.description")}
        />

        <div className="capability-grid">
          {capabilities.map((capability) => (
            <article key={capability.title} className="capability-card glass-card">
              <h3>{capability.title}</h3>
              <p>{capability.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section">
        <SectionHeader
          eyebrow="Role-based dashboards"
          title="Every role gets a clean, focused workspace."
          description="Super admins, society admins, residents, staff, and security teams operate with tailored views and permissions."
        />

        <div className="role-grid">
          {roleCards.map((role) => (
            <article key={role.title} className="role-card glass-card">
              <h3>{role.title}</h3>
              <ul>
                {role.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section architecture-section" id="architecture">
        <SectionHeader
          eyebrow="Blueprint"
          title="Architecture, workflows, and deployment mapped in one view."
          description="This layout reflects the full SaaS product story the prompt calls for, from API structure to mobile apps."
        />

        <div className="architecture-shell glass-panel">
          <div className="architecture-tabs" role="tablist" aria-label="Architecture tabs">
            {architectureTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeArchitecture === tab.id}
                className={`architecture-tab ${activeArchitecture === tab.id ? "is-active" : ""}`}
                onClick={() => setActiveArchitecture(tab.id)}
              >
                {tab.title}
              </button>
            ))}
          </div>

          <div className="architecture-detail">
            <div>
              <span className="eyebrow-pill eyebrow-pill--compact">{activeArchitectureItem.id}</span>
              <h3>{activeArchitectureItem.title}</h3>
              <p>{activeArchitectureItem.summary}</p>
              <div className="signal-row">
                {activeArchitectureItem.signals.map((signal) => (
                  <span key={signal}>{signal}</span>
                ))}
              </div>
            </div>

            <div className="architecture-list">
              {activeArchitectureItem.items.map((item, index) => (
                <article key={item}>
                  <span className="architecture-list__index">0{index + 1}</span>
                  <strong>{item}</strong>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="workflow-grid">
          <article className="glass-card workflow-card">
            <h3>AI workflow</h3>
            <ol>
              {aiWorkflow.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>

          <article className="glass-card workflow-card workflow-card--accent">
            <h3>Realtime architecture</h3>
            <p>
              Socket.io channels sync chat, visitor approvals, notice publishing, bill updates,
              and incident escalation across web and mobile clients.
            </p>
            <div className="realtime-stack">
              <span>Presence</span>
              <span>Message delivery</span>
              <span>Admin alerts</span>
              <span>Offline recovery</span>
            </div>
          </article>

          <article className="glass-card workflow-card">
            <h3>Deployment stack</h3>
            <p>
              Cloudinary stores media, Firebase pushes notifications, and Render or AWS runs the
              API, workers, and dashboard app with autoscaling support.
            </p>
            <div className="deployment-stack">
              <span>Frontend</span>
              <span>Backend API</span>
              <span>Database</span>
              <span>Workers</span>
            </div>
          </article>
        </div>
      </section>

      <section className="content-section mobile-section">
        <SectionHeader
          eyebrow="Mobile and UX"
          title="Responsive by default, polished like a premium mobile app."
          description="The same platform adapts to desktop dashboards, tablets, and resident-facing mobile experiences."
        />

        <div className="mobile-grid">
          <div className="phone-frame glass-card">
            <div className="phone-frame__status">09:41</div>
            <div className="phone-app">
              <div className="phone-app__header">
                <span className="brand-mark brand-mark--small">A</span>
                <div>
                  <strong>Society App</strong>
                  <p>Resident feed</p>
                </div>
              </div>

              <div className="phone-feed">
                <article>
                  <strong>Gate approval</strong>
                  <p>Visitor verified, QR pass generated, security notified.</p>
                </article>
                <article>
                  <strong>Maintenance update</strong>
                  <p>AI created a work order and assigned the nearest staff member.</p>
                </article>
                <article>
                  <strong>Billing reminder</strong>
                  <p>Smart notifications adapt to language, due date, and payment history.</p>
                </article>
              </div>
            </div>
          </div>

          <div className="glass-card mobile-copy">
            <h3>What the product delivers</h3>
            <ul>
              <li>Separate society branding, theme packs, and feature toggles.</li>
              <li>Secure authentication with tenant-scoped access controls.</li>
              <li>AI analytics, OCR extraction, translation, and automation workflows.</li>
              <li>Android and iOS-ready architecture with realtime messaging.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="cta-band glass-panel">
        <div>
          <span className="section-eyebrow">Ready to ship</span>
          <h2>Launch the multi-society SaaS platform with a premium front door and enterprise spine.</h2>
          <p>
            Use the login and dashboard routes already in the app to wire real user flows while
            keeping this new visual system as the public product experience.
          </p>
        </div>

        <div className="cta-band__actions">
          <Link className="button button--primary button--large" to="/register">
            Create account
          </Link>
          <Link className="button button--ghost button--large" to="/login">
            Open portal
          </Link>
        </div>
      </section>

      <footer className="footer-note">
        <span>Multi-tenant architecture</span>
        <span>Realtime-first communication</span>
        <span>AI-powered operations</span>
        <span>Mobile-ready dashboards</span>
      </footer>
    </main>
  );
}

export default App;
