import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import "./styles/theme-overrides.css";
import "./styles/premium-redesign.css";
import "./styles/professional-light-theme.css";
import "./styles/public-v2.css";
import "./styles/enterprise-ux-optimization.css";
import { BRAND } from "./config/brand";
import ProtectedRoute from "./components/ProtectedRoute";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import SuperAdminProtectedRoute from "./components/SuperAdminProtectedRoute";

const lazyPage = (loader) => lazy(loader);

const LoginPage = lazyPage(() => import("./pages/LoginPage"));
const RegisterPage = lazyPage(() => import("./pages/RegisterPage"));
const ChairmanRegisterPage = lazyPage(() => import("./pages/ChairmanRegisterPage"));
const OAuthCompleteProfilePage = lazyPage(() => import("./pages/OAuthCompleteProfilePage"));
const VerifyOtpPage = lazyPage(() => import("./pages/VerifyOtpPage"));
const ForgotPasswordPage = lazyPage(() => import("./pages/ForgotPasswordPage"));
const PremiumLandingPage = lazyPage(() => import("./pages/PremiumLandingPage"));
const LegalPage = lazyPage(() => import("./pages/LegalPage"));
const DashboardLayout = lazyPage(() => import("./components/DashboardLayout"));
const ChairmanDashboard = lazyPage(() => import("./pages/ChairmanDashboard"));
const AccountantDashboardPage = lazyPage(() => import("./pages/AccountantDashboardPage"));
const AnalyticsDashboard = lazyPage(() => import("./pages/AnalyticsDashboard"));
const SecretaryHomePage = lazyPage(() => import("./pages/SecretaryHomePage"));
const SecretaryApprovalsPage = lazyPage(() => import("./pages/SecretaryApprovalsPage"));
const StaffHomePage = lazyPage(() => import("./pages/StaffHomePage"));
const StaffLayout = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffLayout })));
const StaffTasksPage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffTasksPage })));
const StaffAttendancePage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffAttendancePage })));
const StaffWorkOrdersPage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffWorkOrdersPage })));
const StaffMaintenancePage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffMaintenancePage })));
const StaffVisitorsPage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffVisitorsPage })));
const StaffDocumentsPage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffDocumentsPage })));
const StaffNoticesPage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffNoticesPage })));
const StaffLeaveRequestsPage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffLeaveRequestsPage })));
const StaffComplaintsPage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffComplaintsPage })));
const StaffAnnouncementsPage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffAnnouncementsPage })));
const StaffSettingsPage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffSettingsPage })));
const StaffComplaintWorkPage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffComplaintWorkPage })));
const StaffDutySchedulePage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffDutySchedulePage })));
const StaffLeaveManagementPage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffLeaveManagementPage })));
const StaffMaterialRequestsPage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffMaterialRequestsPage })));
const StaffEmergencyTasksPage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffEmergencyTasksPage })));
const StaffSalaryPayslipsPage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffSalaryPayslipsPage })));
const StaffPerformancePage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffPerformancePage })));
const StaffProfileDocumentsPage = lazyPage(() => import("./pages/StaffHomePage").then((module) => ({ default: module.StaffProfileDocumentsPage })));
const ResidentDashboardRouterPage = lazyPage(() => import("./pages/ResidentDashboardRouterPage"));
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
const UsersPage = lazyPage(() => import("./pages/UsersPage"));
const SuperAdminLoginPage = lazyPage(() => import("./pages/SuperAdminLoginPage"));
const SuperAdminForgotPasswordPage = lazyPage(() => import("./pages/SuperAdminForgotPasswordPage"));
const SuperAdminVerifyOtpPage = lazyPage(() => import("./pages/SuperAdminVerifyOtpPage"));
const SuperAdminResetPasswordPage = lazyPage(() => import("./pages/SuperAdminResetPasswordPage"));
const SuperAdminDashboardPage = lazyPage(() => import("./pages/SuperAdminDashboardPage"));
const SuperAdminSocietyDetailsPage = lazyPage(() => import("./pages/SuperAdminSocietyDetailsPage"));
const SuperAdminChairmanRegistrationsPage = lazyPage(() => import("./pages/SuperAdminChairmanRegistrationsPage"));
const NotFoundPage = lazyPage(() => import("./pages/NotFoundPage"));
const SecurityRouter = lazyPage(() => import("./security/SecurityRouter"));

function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite" aria-label="Loading page">
      <div className="route-fallback__card">
        <span className="brand-loading-mark"><img src={BRAND.logo} alt="" /></span>
        <span>Loading Nexora...</span>
      </div>
    </div>
  );
}

function App() {
  // Theme is initialized by the ThemeProvider and appearance loader.

  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/" element={<PremiumLandingPage />} />
      <Route path="/privacy-policy" element={<LegalPage type="privacy" />} />
      <Route path="/terms-and-conditions" element={<LegalPage type="terms" />} />
      <Route path="/select-role" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/chairman/register" element={<ChairmanRegisterPage />} />
      <Route path="/auth/complete-profile" element={<OAuthCompleteProfilePage />} />
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
      <Route
        path="/super-admin/chairman-registrations"
        element={
          <SuperAdminProtectedRoute>
            <SuperAdminChairmanRegistrationsPage />
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

      <Route element={<ProtectedRoute allowedRoles={["chairman", "admin"]} />}>
        <Route path="/admin/*" element={<ChairmanDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["accountant", "admin", "secretary"]} />}>
        <Route path="/accountant" element={<DashboardLayout basePath="/accountant" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AccountantDashboardPage />} />
          <Route path="collections" element={<BillingPage />} />
          <Route path="expenses" element={<BillingPage />} />
          <Route path="budgets" element={<AnalyticsDashboard />} />
          <Route path="invoices" element={<BillingPage />} />
          <Route path="financial-reports" element={<AnalyticsDashboard />} />
          <Route path="ai-assistant" element={<AiAssistantPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["secretary"]} />}>
        <Route path="/secretary" element={<DashboardLayout basePath="/secretary" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SecretaryHomePage />} />
          <Route path="approvals" element={<SecretaryApprovalsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="residents" element={<Navigate to="/secretary/users" replace />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="flats" element={<FlatsPage />} />
          <Route path="property" element={<FlatsPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="ai-assistant" element={<AiAssistantPage />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="analytics-ai" element={<AnalyticsDashboard />} />
          <Route path="community" element={<ComplaintsPage />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="messages" element={<ChatPage />} />
          <Route path="notices" element={<NoticesPage />} />
          <Route path="security" element={<VisitorsPage />} />
          <Route path="visitors" element={<VisitorsPage />} />
          <Route path="parking" element={<ParkingPage />} />
          <Route path="staff" element={<StaffManagementPage />} />
          <Route path="theme" element={<ThemeAdminPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StaffHomePage />} />
          <Route path="tasks" element={<StaffTasksPage />} />
          <Route path="attendance" element={<StaffAttendancePage />} />
          <Route path="work-orders" element={<StaffWorkOrdersPage />} />
          <Route path="maintenance" element={<StaffMaintenancePage />} />
          <Route path="visitors" element={<StaffVisitorsPage />} />
          <Route path="documents" element={<StaffDocumentsPage />} />
          <Route path="notices" element={<StaffNoticesPage />} />
          <Route path="leave-requests" element={<StaffLeaveRequestsPage />} />
          <Route path="complaints" element={<StaffComplaintsPage />} />
          <Route path="announcements" element={<StaffAnnouncementsPage />} />
          <Route path="profile" element={<StaffProfileDocumentsPage />} />
          <Route path="settings" element={<StaffSettingsPage />} />
          <Route path="complaint-work" element={<StaffComplaintWorkPage />} />
          <Route path="duty-schedule" element={<StaffDutySchedulePage />} />
          <Route path="leave-management" element={<StaffLeaveManagementPage />} />
          <Route path="material-requests" element={<StaffMaterialRequestsPage />} />
          <Route path="emergency-tasks" element={<StaffEmergencyTasksPage />} />
          <Route path="salary-payslips" element={<StaffSalaryPayslipsPage />} />
          <Route path="performance" element={<StaffPerformancePage />} />
          <Route path="profile-documents" element={<StaffProfileDocumentsPage />} />
          <Route path="work-tracking" element={<Navigate to="/staff/performance" replace />} />
          <Route path="notifications" element={<Navigate to="/staff/notices" replace />} />
          <Route path="ai-insights" element={<Navigate to="/staff/announcements" replace />} />
          <Route path="ai-assistant" element={<Navigate to="/staff/announcements" replace />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["resident"]} />}>
        <Route path="/resident/*" element={<ResidentDashboardRouterPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  );
}

export default App;
