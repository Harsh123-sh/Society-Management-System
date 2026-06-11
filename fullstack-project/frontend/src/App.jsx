import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./App.css";
import "./styles/theme-overrides.css";
import LanguageSelector from "./components/LanguageSelector";
import { useTranslation } from "./contexts/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import SuperAdminProtectedRoute from "./components/SuperAdminProtectedRoute";
import { societyPresets as societyThemes } from "./theme/societyPresets";
import { useThemeEngine } from "./contexts/ThemeContext";
import { fetchPublicSocieties, fetchSocietyLivePreview } from "./services/authApi";

const lazyPage = (loader) => lazy(loader);

const LoginPage = lazyPage(() => import("./pages/LoginPage"));
const RegisterPage = lazyPage(() => import("./pages/RegisterPage"));
const VerifyOtpPage = lazyPage(() => import("./pages/VerifyOtpPage"));
const ForgotPasswordPage = lazyPage(() => import("./pages/ForgotPasswordPage"));
const DashboardLayout = lazyPage(() => import("./components/DashboardLayout"));
const AdminOverviewPage = lazyPage(() => import("./pages/AdminOverviewPage"));
const AnalyticsDashboard = lazyPage(() => import("./pages/AnalyticsDashboard"));
const SecretaryHomePage = lazyPage(() => import("./pages/SecretaryHomePage"));
const StaffHomePage = lazyPage(() => import("./pages/StaffHomePage"));
const StaffTasksPage = lazyPage(() => import("./pages/StaffTasksPage"));
const StaffComplaintsPage = lazyPage(() => import("./pages/StaffComplaintsPage"));
const StaffAttendancePage = lazyPage(() => import("./pages/StaffAttendancePage"));
const StaffWorkTrackingPage = lazyPage(() => import("./pages/StaffWorkTrackingPage"));
const StaffNotificationsPage = lazyPage(() => import("./pages/StaffNotificationsPage"));
const StaffDocumentsPage = lazyPage(() => import("./pages/StaffDocumentsPage"));
const StaffAIInsightsPage = lazyPage(() => import("./pages/StaffAIInsightsPage"));
const ResidentDashboardRouterPage = lazyPage(() => import("./pages/ResidentDashboardRouterPage"));
const OwnerTenantPage = lazyPage(() => import("./pages/OwnerTenantPage"));
const OwnerAnalyticsPage = lazyPage(() => import("./pages/OwnerAnalyticsPage"));
const OwnerSettingsPage = lazyPage(() => import("./pages/OwnerSettingsPage"));
const TenantVisitorsPage = lazyPage(() => import("./pages/TenantVisitorsPage"));
const TenantProfilePage = lazyPage(() => import("./pages/TenantProfilePage"));
const BillingPage = lazyPage(() => import("./pages/BillingPage"));
const ComplaintsPage = lazyPage(() => import("./pages/ComplaintsPage"));
const NoticesPage = lazyPage(() => import("./pages/NoticesPage"));
const ArchiveCenterPage = lazyPage(() => import("./pages/ArchiveCenterPage"));
const ChatPage = lazyPage(() => import("./pages/ChatPage"));
const AiAssistantPage = lazyPage(() => import("./pages/AiAssistantPage"));
const VisitorsPage = lazyPage(() => import("./pages/VisitorsPage"));
const FlatsPage = lazyPage(() => import("./pages/FlatsPage"));
const DocumentsPage = lazyPage(() => import("./pages/DocumentsPage"));
const ParkingPage = lazyPage(() => import("./pages/ParkingPage"));
const StaffManagementPage = lazyPage(() => import("./pages/StaffManagementPage"));
const SettingsPage = lazyPage(() => import("./pages/SettingsPage"));
const ThemeAdminPage = lazyPage(() => import("./pages/ThemeAdminPage"));
const ChairmanUserManagementPage = lazyPage(() => import("./pages/ChairmanUserManagementPage"));
const SuperAdminLoginPage = lazyPage(() => import("./pages/SuperAdminLoginPage"));
const SuperAdminForgotPasswordPage = lazyPage(() => import("./pages/SuperAdminForgotPasswordPage"));
const SuperAdminVerifyOtpPage = lazyPage(() => import("./pages/SuperAdminVerifyOtpPage"));
const SuperAdminResetPasswordPage = lazyPage(() => import("./pages/SuperAdminResetPasswordPage"));
const SuperAdminDashboardPage = lazyPage(() => import("./pages/SuperAdminDashboardPage"));
const SuperAdminSocietyDetailsPage = lazyPage(() => import("./pages/SuperAdminSocietyDetailsPage"));
const NotFoundPage = lazyPage(() => import("./pages/NotFoundPage"));
const SecurityRouter = lazyPage(() => import("./security/SecurityRouter"));

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

function formatSocietyDisplayName(name) {
  return String(name || "Society").replace(/\bGrren\b/gi, "Green");
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

function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite" aria-label="Loading page">
      <div className="route-fallback__card">
        <span>Loading</span>
      </div>
    </div>
  );
}

function App() {
  // Theme is initialized by the ThemeProvider and appearance loader.

  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/select-role" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
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
    </Suspense>
  );
}

function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { preferences, setThemeMode, setSelectedSocietyId } = useThemeEngine();
  const [publicSocieties, setPublicSocieties] = useState([]);
  const [publicLoading, setPublicLoading] = useState(true);
  const [publicError, setPublicError] = useState("");
  const [livePreview, setLivePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const heroStats = useMemo(() => t("heroStats", []), [t]);
  const capabilities = useMemo(() => t("capabilities", []), [t]);
  const roleCards = useMemo(() => t("roleCards", []), [t]);
  const heroFeatures = useMemo(() => t("heroFeatures", []), [t]);
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
  const activeSocietyDisplayName = formatSocietyDisplayName(activeSociety.name);
  const activeSocietyPreset = resolveSocietyBranding(activeSociety);
  const activeSocietyLabel = activeSociety.subscription_plan || activeSociety.status || activeSocietyPreset.label;
  const activeSocietySummary = activeSocietyPreset.summary;
  const activeSocietyStat = livePreview?.totalFlats
    ? `${livePreview.totalFlats} flats • ${livePreview.occupiedFlats} occupied`
    : activeSocietyPreset.stat;
  const liveData = livePreview || null;
  const landingStats = [
    { value: liveData?.totalResidents?.toLocaleString() || "12x", label: "Faster complaint routing" },
    { value: liveData?.todayVisitors || "24/7", label: "Live visitor and gate visibility" },
    { value: liveData?.totalCollections ? formatCurrency(liveData.totalCollections) : "99.95%", label: "Realtime uptime target" },
    { value: liveData?.aiTaskCount || "6", label: "Role-specific workspaces" },
  ];
  const testimonials = [
    {
      quote: "The dashboard finally feels like a calm control room instead of a spreadsheet maze.",
      name: "Priya Mehta",
      role: "Society Chairman",
    },
    {
      quote: "Visitor approvals, notices, and billing updates are all visible before residents start calling.",
      name: "Rahul Shah",
      role: "Secretary",
    },
    {
      quote: "Security gets a clean workflow, residents get speed, and staff gets accountability.",
      name: "Ananya Rao",
      role: "Operations Lead",
    },
  ];

  useEffect(() => {
    document.title = `${activeSocietyDisplayName} | AI Society Management SaaS`;

    return () => {
      document.title = "Society Management System";
    };
  }, [activeSocietyDisplayName]);

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
      <motion.header
        className="topbar landing-nav glass-panel"
        initial={{ y: -22, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <Link className="topbar-brand brand-lockup landing-brand" to="/">
          <div className="brand-mark">A</div>
          <div>
            <p className="brand-eyebrow">{t("brand.eyebrow")}</p>
            <h1>{t("brand.title")}</h1>
          </div>
        </Link>

        <nav className="landing-nav-links" aria-label="Landing sections">
          <a href="#features">Features</a>
          <a href="#statistics">Stats</a>
          <a href="#testimonials">Stories</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="topbar-center landing-society-picker">
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
                    <span>{formatSocietyDisplayName(society.name)}</span>
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
      </motion.header>

      <motion.section
        className="hero-grid glass-panel hero-panel landing-hero"
        initial={{ opacity: 0, y: 34 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, delay: 0.08, ease: "easeOut" }}
      >
        <div className="hero-copy landing-hero-copy">
          <span className="eyebrow-pill">{t("hero.eyebrow")}</span>
          <h2>{t("hero.title")}</h2>
          <p className="hero-description">{t("hero.description")}</p>

          <div className="hero-actions">
            <Link className="button button--primary button--large" to="/register">
              {t("hero.launchPlatform")}
            </Link>
            <a className="button button--ghost button--large" href="#features">
              Explore product
            </a>
          </div>

          <div className="feature-strips">
            {heroFeatures.map((feature) => (
              <span key={feature}>{feature}</span>
            ))}
          </div>

          <div className="hero-stats hero-stats--compact">
            {heroStats.map((stat) => (
              <motion.article
                key={stat.label}
                className="metric-card glass-card"
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </motion.article>
            ))}
          </div>
        </div>

        <motion.div
          className="hero-visual glass-card landing-device"
          initial={{ opacity: 0, scale: 0.96, rotate: 1 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.22, ease: "easeOut" }}
        >
          <div className="hero-visual__header">
            <div>
              <p className="brand-eyebrow">{t("hero.liveLens")}</p>
              <h3>{activeSocietyDisplayName}</h3>
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
                    <div className="h-16 rounded-2xl theme-surface" />
                  </div>

                  <div className="dashboard-grid">
                    {[...Array(4)].map((_, index) => (
                      <article key={index} className="h-24 rounded-3xl theme-surface" />
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
              <strong>{activeSocietyDisplayName}</strong>
              <p>{activeSocietySummary}</p>
            </div>
            <div>
              <span className="mini-rail__label">{t("hero.flats")}</span>
              <strong>{activeSocietyStat}</strong>
              <p>{t("hero.brandSummary")}</p>
            </div>
          </div>
        </motion.div>
      </motion.section>

      <section className="content-section landing-section" id="features">
        <SectionHeader
          eyebrow={t("sections.capabilities.eyebrow")}
          title={t("sections.capabilities.title")}
          description={t("sections.capabilities.description")}
          align="center"
        />

        <div className="capability-grid landing-feature-grid">
          {capabilities.map((capability) => (
            <motion.article
              key={capability.title}
              className="capability-card glass-card landing-feature-card"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.5 }}
            >
              <h3>{capability.title}</h3>
              <p>{capability.description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="content-section landing-section" id="statistics">
        <SectionHeader
          eyebrow="Statistics"
          title="A lighter way to run complex communities."
          description="Live operations, billing, support, and gate activity are designed to feel instant without feeling noisy."
          align="center"
        />

        <div className="landing-stat-grid">
          {landingStats.map((stat, index) => (
            <motion.article
              key={stat.label}
              className="landing-stat-card glass-card"
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.55, delay: index * 0.06 }}
            >
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="content-section landing-section">
        <SectionHeader
          eyebrow="Dashboards"
          title="Focused workspaces for every role."
          description="Each role gets only the tools it needs, wrapped in the same premium interface language."
          align="center"
        />

        <div className="role-grid landing-role-grid">
          {roleCards.map((role, index) => (
            <motion.article
              key={role.title}
              className="role-card glass-card landing-role-card"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <span className="landing-card-index">0{index + 1}</span>
              <h3>{role.title}</h3>
              <ul>
                {role.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="content-section landing-section" id="testimonials">
        <SectionHeader
          eyebrow="Testimonials"
          title="Built for committees, residents, staff, and gates."
          description="The experience stays calm, readable, and fast across desktop, tablet, and mobile."
          align="center"
        />

        <div className="landing-testimonial-grid">
          {testimonials.map((item, index) => (
            <motion.article
              key={item.name}
              className="landing-testimonial glass-card"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
            >
              <p>"{item.quote}"</p>
              <div>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="content-section landing-contact glass-panel" id="contact">
        <div>
          <span className="section-eyebrow">Contact</span>
          <h2>Bring your society online with a polished operating layer.</h2>
          <p>
            Start with a branded society workspace, then add billing, visitors, complaints,
            staff tasks, notices, documents, and AI assistance as your committee needs them.
          </p>
        </div>

        <div className="cta-band__actions landing-contact-actions">
          <Link className="button button--primary button--large" to="/register">
            Start free trial
          </Link>
          <Link className="button button--ghost button--large" to="/login">
            Open portal
          </Link>
        </div>
      </section>

      <footer className="landing-footer glass-panel">
        <div className="brand-lockup">
          <div className="brand-mark brand-mark--small">A</div>
          <div>
            <p className="brand-eyebrow">{t("brand.eyebrow")}</p>
            <h2>{t("brand.title")}</h2>
          </div>
        </div>
        <div className="footer-note">
          <span>Multi-tenant SaaS</span>
          <span>Realtime-first</span>
          <span>AI-powered</span>
          <span>Mobile-ready</span>
        </div>
      </footer>
    </main>
  );
}

export default App;
