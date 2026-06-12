import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./App.css";
import "./styles/theme-overrides.css";
import "./styles/premium-redesign.css";
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

  const features = [
    { title: "Resident Management", description: "Manage resident profiles, flats, owners, and tenants." },
    { title: "Visitor Management", description: "Track visitor entries, approvals, and gate activity." },
    { title: "Complaint Management", description: "Receive, assign, and resolve complaints faster." },
    { title: "Billing & Maintenance", description: "Manage bills, payments, dues, and receipts." },
    { title: "Notice Board", description: "Share society announcements and updates." },
    { title: "Security Operations", description: "Support gate staff with visitor and entry records." },
    { title: "Staff Management", description: "Assign work, track attendance, and monitor tasks." },
    { title: "Document Management", description: "Store and organize important society documents." },
  ];
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
  const activeSocietyStat = livePreview?.totalFlats
    ? `${livePreview.totalFlats} flats • ${livePreview.occupiedFlats} occupied`
    : activeSocietyPreset.stat;
  const liveData = livePreview || null;
  const previewModules = [
    { label: "Residents", value: liveData?.totalResidents ? liveData.totalResidents.toLocaleString() : "Profiles" },
    { label: "Visitors", value: liveData?.todayVisitors ? liveData.todayVisitors : "Gate Log" },
    { label: "Complaints", value: liveData?.pendingComplaints ? liveData.pendingComplaints : "Tracking" },
    { label: "Bills", value: liveData?.totalCollections ? formatCurrency(liveData.totalCollections) : "Payments" },
    { label: "Notices", value: liveData?.notices?.length ? liveData.notices.length : "Updates" },
    { label: "Documents", value: "Records" },
    { label: "Security", value: "Gate Desk" },
    { label: "Staff", value: "Tasks" },
  ];

  useEffect(() => {
    document.title = `${activeSocietyDisplayName} | Society Management System`;

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
            Sign In
          </button>
          <Link className="button button--primary" to="/register">
            Get Demo
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
          <span className="eyebrow-pill">Society Management System</span>
          <h2>Society Management System</h2>
          <p className="hero-description">
            Manage residents, visitors, billing, complaints, notices, documents, and security operations from one platform.
          </p>

          <div className="hero-actions">
            <Link className="button button--primary button--large" to="/register">
              Get Demo
            </Link>
            <a className="button button--ghost button--large" href="#contact">
              Contact Us
            </a>
          </div>
        </div>

        <motion.div
          className="hero-workstation landing-device"
          initial={{ opacity: 0, y: 28, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, delay: 0.22, ease: "easeOut" }}
        >
          <div className="workstation-glow" />
          <div className="floating-module floating-module--one">
            <span>Residents</span>
            <strong>{liveData?.totalResidents ? liveData.totalResidents.toLocaleString() : "Profiles"}</strong>
          </div>
          <div className="floating-module floating-module--two">
            <span>Visitors</span>
            <strong>{liveData?.todayVisitors || "Gate Log"}</strong>
          </div>
          <div className="floating-module floating-module--three">
            <span>Billing</span>
            <strong>{liveData?.totalCollections ? formatCurrency(liveData.totalCollections) : "Payments"}</strong>
          </div>
          <div className="floating-module floating-module--four">
            <span>Complaints</span>
            <strong>{liveData?.pendingComplaints || "Tracking"}</strong>
          </div>
          <div className="floating-module floating-module--five">
            <span>Security</span>
            <strong>Gate Desk</strong>
          </div>

          <div className="desk-scene">
            <div className="monitor-row">
              <div className="monitor monitor--primary">
                <div className="monitor-bezel">
                  <div className="monitor-screen">
                    <div className="screen-topbar">
                      <span />
                      <span />
                      <span />
                      <strong>{activeSocietyDisplayName}</strong>
                    </div>
                    <div className="screen-dashboard">
                      <div className="screen-hero-card">
                        <p>Society Overview</p>
                        <strong>{activeSocietyStat}</strong>
                        <span>{previewLoading ? "Loading dashboard" : activeSocietyLabel}</span>
                      </div>
                      <div className="screen-stat-row">
                        {previewModules.slice(0, 4).map((module) => (
                          <div key={module.label} className="screen-stat">
                            <span>{module.label}</span>
                            <strong>{module.value}</strong>
                          </div>
                        ))}
                      </div>
                      <div className="screen-list">
                        <div>
                          <span>Notice Board</span>
                          <strong>{liveData?.notices?.[0]?.title || "Society updates"}</strong>
                        </div>
                        <div>
                          <span>Maintenance</span>
                          <strong>{liveData?.maintenanceAlerts?.[0]?.title || "Bills and dues"}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="monitor-neck" />
                <div className="monitor-foot" />
              </div>

              <div className="monitor monitor--secondary">
                <div className="monitor-bezel">
                  <div className="monitor-screen">
                    <div className="screen-topbar screen-topbar--compact">
                      <span />
                      <span />
                      <span />
                      <strong>Modules</strong>
                    </div>
                    <div className="module-stack">
                      {previewModules.slice(1, 8).map((module) => (
                        <div key={module.label} className="module-row">
                          <span>{module.label}</span>
                          <strong>{module.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="monitor-neck monitor-neck--small" />
                <div className="monitor-foot monitor-foot--small" />
              </div>
            </div>

            <div className="desk-base">
              <div className="keyboard">
                {Array.from({ length: 18 }).map((_, index) => (
                  <span key={index} />
                ))}
              </div>
              <div className="trackpad" />
            </div>
          </div>
        </motion.div>
      </motion.section>

      <section className="content-section landing-section product-showcase-section" id="features">
        <SectionHeader
          eyebrow="Product capabilities"
          title="One operating system for society teams."
          description="Analytics, mobile-ready workflows, AI assistance, and core operational modules in a compact enterprise workspace."
          align="center"
        />

        <div className="product-showcase-grid">
          <motion.article
            className="showcase-card showcase-card--analytics"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            whileHover={{ y: -6 }}
          >
            <div className="showcase-card__header">
              <span>Analytics preview</span>
              <strong>{liveData?.totalCollections ? formatCurrency(liveData.totalCollections) : "₹8.4L"}</strong>
            </div>
            <div className="mini-chart" aria-hidden="true">
              {[42, 64, 48, 78, 58, 88, 72].map((height, index) => (
                <span key={index} style={{ "--bar-height": `${height}%` }} />
              ))}
            </div>
            <p>Collection health, occupancy, complaints, visitor movement, and staff execution stay visible without digging through reports.</p>
          </motion.article>

          <motion.article
            className="showcase-card showcase-card--mobile"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            whileHover={{ y: -6 }}
          >
            <div className="phone-preview">
              <div className="phone-preview__screen">
                <span>Resident</span>
                <strong>Maintenance bill</strong>
                <p>{liveData?.totalCollections ? formatCurrency(liveData.totalCollections) : "Pay, complain, approve visitors"}</p>
                <div />
                <div />
                <div />
              </div>
            </div>
            <p>Resident, staff, and security workflows are built for quick mobile checks with the same role-based access model.</p>
          </motion.article>

          <motion.article
            className="showcase-card showcase-card--ai"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            whileHover={{ y: -6 }}
          >
            <div className="ai-preview">
              <span>AI assistant preview</span>
              <p>Summarize open complaints, draft a notice, forecast collections, and highlight operational risk.</p>
            </div>
            <div className="ai-preview__chips">
              <span>Complaints</span>
              <span>Notices</span>
              <span>Collections</span>
            </div>
          </motion.article>

          <div className="capability-grid landing-feature-grid showcase-card showcase-card--features">
            {features.map((feature) => (
              <motion.article
                key={feature.title}
                className="capability-card landing-feature-card"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4 }}
              >
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <footer className="landing-footer glass-panel" id="contact">
        <div className="brand-lockup">
          <div className="brand-mark brand-mark--small">A</div>
          <div>
            <p className="brand-eyebrow">Society Management</p>
            <h2>Society Management System</h2>
          </div>
        </div>
        <div className="footer-note">
          <a href="#features">Features</a>
          <a href="#contact">Contact</a>
          <Link to="/login">Sign In</Link>
          <a href="mailto:contact@society.com">Contact Us</a>
        </div>
      </footer>
    </main>
  );
}

export default App;
