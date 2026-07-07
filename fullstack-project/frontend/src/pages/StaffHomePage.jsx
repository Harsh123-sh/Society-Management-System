import { createElement, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Download,
  Eye,
  FileBadge2,
  FileText,
  Filter,
  Flame,
  Gauge,
  Globe2,
  History,
  Home,
  IdCard,
  Languages,
  ListChecks,
  Loader2,
  LockKeyhole,
  LogOut,
  Moon,
  PackageCheck,
  PauseCircle,
  PlayCircle,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  UploadCloud,
  WalletCards,
  Wrench,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { clearAuthSession, getStoredUser } from "../utils/session";
import {
  fetchStaffAttendance,
  fetchStaffDashboard,
  staffAttendanceCheckIn,
  staffAttendanceCheckOut,
  submitStaffAttendanceRequest,
} from "../services/authApi";
import "../styles/staff-dashboard.css";

const Motion = motion;

const TEXT = {
  en: {
    staffWorkspace: "Staff Workspace",
    secureScope: "Staff-only operations",
    dashboard: "Dashboard",
    myTasks: "My Tasks",
    complaintWork: "Complaint Work",
    attendance: "Attendance",
    dutySchedule: "Duty Schedule",
    leaveManagement: "Leave Management",
    materialRequests: "Material Requests",
    emergencyTasks: "Emergency Tasks",
    salaryPayslips: "Salary & Payslips",
    notices: "Notices",
    performance: "Performance",
    profileDocuments: "Profile & Documents",
    search: "Search assigned work",
    filters: "Filters",
    all: "All",
    today: "Today",
    loading: "Syncing secure staff records",
    empty: "No assigned records yet.",
    emptyDetail: "Your staff-only work will appear here after the society syncs it.",
    auditLogs: "Audit Logs",
    security: "Security",
    aiDailySummary: "AI Daily Summary",
    aiSmartSuggestions: "AI Smart Suggestions",
    restricted: "Staff role restricted",
    logout: "Logout",
  },
  hi: {
    staffWorkspace: "स्टाफ वर्कस्पेस",
    secureScope: "केवल स्टाफ संचालन",
    dashboard: "डैशबोर्ड",
    myTasks: "मेरे कार्य",
    complaintWork: "शिकायत कार्य",
    attendance: "उपस्थिति",
    dutySchedule: "ड्यूटी शेड्यूल",
    leaveManagement: "अवकाश प्रबंधन",
    materialRequests: "सामग्री अनुरोध",
    emergencyTasks: "आपातकालीन कार्य",
    salaryPayslips: "वेतन और पेस्लिप",
    notices: "सूचनाएं",
    performance: "प्रदर्शन",
    profileDocuments: "प्रोफाइल और दस्तावेज",
    search: "सौंपे गए कार्य खोजें",
    filters: "फिल्टर",
    all: "सभी",
    today: "आज",
    loading: "सुरक्षित स्टाफ रिकॉर्ड सिंक हो रहे हैं",
    empty: "अभी कोई सौंपा गया रिकॉर्ड नहीं है।",
    emptyDetail: "सोसाइटी सिंक के बाद आपका स्टाफ कार्य यहां दिखेगा।",
    auditLogs: "ऑडिट लॉग",
    security: "सुरक्षा",
    aiDailySummary: "AI दैनिक सारांश",
    aiSmartSuggestions: "AI स्मार्ट सुझाव",
    restricted: "स्टाफ भूमिका सीमित",
    logout: "लॉगआउट",
  },
  gu: {
    staffWorkspace: "સ્ટાફ વર્કસ્પેસ",
    secureScope: "માત્ર સ્ટાફ કામગીરી",
    dashboard: "ડેશબોર્ડ",
    myTasks: "મારા કાર્યો",
    complaintWork: "ફરિયાદ કામ",
    attendance: "હાજરી",
    dutySchedule: "ડ્યુટી શેડ્યૂલ",
    leaveManagement: "રજા વ્યવસ્થાપન",
    materialRequests: "સામગ્રી વિનંતીઓ",
    emergencyTasks: "ઇમરજન્સી કાર્યો",
    salaryPayslips: "પગાર અને પેસ્લિપ",
    notices: "નોટિસ",
    performance: "પ્રદર્શન",
    profileDocuments: "પ્રોફાઇલ અને દસ્તાવેજો",
    search: "સોંપાયેલ કામ શોધો",
    filters: "ફિલ્ટર્સ",
    all: "બધું",
    today: "આજે",
    loading: "સુરક્ષિત સ્ટાફ રેકોર્ડ સિંક થાય છે",
    empty: "હાલ કોઈ સોંપાયેલ રેકોર્ડ નથી.",
    emptyDetail: "સોસાયટી સિંક થયા પછી તમારું સ્ટાફ કામ અહીં દેખાશે.",
    auditLogs: "ઓડિટ લોગ",
    security: "સુરક્ષા",
    aiDailySummary: "AI દૈનિક સારાંશ",
    aiSmartSuggestions: "AI સ્માર્ટ સૂચનો",
    restricted: "સ્ટાફ ભૂમિકા મર્યાદિત",
    logout: "લોગઆઉટ",
  },
};

const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi" },
  { id: "gu", label: "Gujarati" },
];

const navItems = [
  { labelKey: "dashboard", to: "/staff/dashboard", icon: Home },
  { labelKey: "myTasks", to: "/staff/tasks", icon: ListChecks },
  { labelKey: "complaintWork", to: "/staff/complaint-work", icon: Wrench },
  { labelKey: "attendance", to: "/staff/attendance", icon: Clock3 },
  { labelKey: "dutySchedule", to: "/staff/duty-schedule", icon: CalendarDays },
  { labelKey: "leaveManagement", to: "/staff/leave-management", icon: FileText },
  { labelKey: "materialRequests", to: "/staff/material-requests", icon: PackageCheck },
  { labelKey: "emergencyTasks", to: "/staff/emergency-tasks", icon: Flame },
  { labelKey: "salaryPayslips", to: "/staff/salary-payslips", icon: WalletCards },
  { labelKey: "notices", to: "/staff/notices", icon: Bell },
  { labelKey: "performance", to: "/staff/performance", icon: Star },
  { labelKey: "profileDocuments", to: "/staff/profile-documents", icon: IdCard },
];

const routeTitles = {
  "/staff/dashboard": "dashboard",
  "/staff/tasks": "myTasks",
  "/staff/complaint-work": "complaintWork",
  "/staff/attendance": "attendance",
  "/staff/duty-schedule": "dutySchedule",
  "/staff/leave-management": "leaveManagement",
  "/staff/material-requests": "materialRequests",
  "/staff/emergency-tasks": "emergencyTasks",
  "/staff/salary-payslips": "salaryPayslips",
  "/staff/notices": "notices",
  "/staff/performance": "performance",
  "/staff/profile-documents": "profileDocuments",
  "/staff/profile": "profileDocuments",
};

const taskStages = ["Assigned", "Accepted", "In Progress", "Paused", "Completed", "Verified"];
const chartColors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];
const staffPermissions = [
  "View own assigned tasks",
  "Update own work status",
  "Upload own proof files",
  "Submit own attendance",
  "Request leave and materials",
  "View own salary and documents",
];
const restrictedPermissions = [
  "Society administration",
  "Finance configuration",
  "Resident management",
  "System settings",
  "Staff-wide analytics",
];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function firstList(data, keys) {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function num(value, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function titleCase(value) {
  const text = String(value || "not available").replace(/_/g, " ");
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortDate(value) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function shortTime(value) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function useStaffText(language) {
  return TEXT[language] || TEXT.en;
}

function useStaffContext() {
  return useOutletContext() || {
    dashboard: {},
    attendance: {},
    loading: false,
    error: "",
    staff: {},
    society: {},
    language: "en",
    t: TEXT.en,
    toast: () => {},
    refreshAttendance: () => {},
  };
}

function metricValue(data, keys, fallback = 0) {
  for (const key of keys) {
    const value = key.split(".").reduce((current, part) => current?.[part], data);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

function getTaskRows(data) {
  return firstList(data, ["tasks", "assignedTasks", "myTasks", "workOrders", "complaints"]).map((item, index) => ({
    id: item.id || item.task_id || item.complaint_id || `task-${index}`,
    title: item.title || item.subject || item.category || "Assigned work",
    category: item.category || item.department || "General",
    priority: item.priority || item.severity || "normal",
    status: item.status || item.work_status || "assigned",
    resident: item.resident_name || item.residentName || item.raised_by || "--",
    flat: item.flat_number || item.resident_flat_number || item.flat || item.location || "--",
    due: item.due_date || item.deadline || item.required_date || item.created_at,
    notes: item.notes || item.description || item.message || "",
    raw: item,
  }));
}

function getComplaintRows(data) {
  const complaints = firstList(data, ["complaints", "assignedComplaints", "workOrders"]);
  return complaints.map((item, index) => ({
    id: item.id || item.complaint_id || `complaint-${index}`,
    title: item.title || item.subject || item.category || "Complaint work",
    category: item.category || "Maintenance",
    priority: item.priority || item.severity || "normal",
    status: item.status || item.work_status || "assigned",
    resident: item.resident_name || item.residentName || "--",
    flat: item.flat_number || item.resident_flat_number || item.flat || "--",
    timeline: list(item.timeline || item.history),
    images: list(item.images || item.photos || item.attachments),
    feedback: item.feedback || item.resident_feedback || "",
    raw: item,
  }));
}

function getNotices(data) {
  return firstList(data, ["notices", "announcements", "notifications"]).map((item, index) => ({
    id: item.id || item.notice_id || `notice-${index}`,
    title: item.title || item.category || "Society notice",
    message: item.message || item.description || "Notice from the society.",
    category: item.category || item.type || "Notice",
    status: item.read_at ? "read" : item.status || "unread",
    date: item.created_at || item.date || item.updated_at,
  }));
}

function getMaterials(data) {
  return firstList(data, ["materialRequests", "materials", "inventoryRequests"]).map((item, index) => ({
    id: item.id || item.request_id || `material-${index}`,
    name: item.name || item.material_name || item.title || "Material",
    quantity: item.quantity || item.qty || "--",
    priority: item.priority || "normal",
    reason: item.reason || item.notes || item.description || "",
    stock: item.stock || item.availability || item.inventory_status || "--",
    status: item.status || item.approval_status || "pending",
    date: item.required_date || item.created_at,
  }));
}

function getLeaves(data) {
  return firstList(data, ["leaveRequests", "leaves", "leaveHistory"]).map((item, index) => ({
    id: item.id || item.leave_id || `leave-${index}`,
    type: item.type || item.leave_type || "Leave",
    status: item.status || item.approval_status || "pending",
    date: item.date || item.leave_date || item.from_date || item.created_at,
    reason: item.reason || item.notes || "",
    document: item.document_url || item.attachment,
  }));
}

function getEmergencyRows(data) {
  return firstList(data, ["emergencyTasks", "emergencyAlerts", "emergencies"]).map((item, index) => ({
    id: item.id || item.alert_id || `emergency-${index}`,
    title: item.title || item.alert_type || item.type || "Emergency task",
    status: item.status || "active",
    priority: item.priority || "urgent",
    location: item.location || item.flat_number || "--",
    date: item.created_at || item.date,
    checklist: list(item.checklist),
  }));
}

function getAttendanceRecords(data, attendance) {
  return [
    ...firstList(attendance, ["records", "attendance", "history"]),
    ...firstList(data, ["attendanceRecords", "attendanceHistory"]),
  ];
}

function getChartRows(data, sourceKey, fallbackRows = []) {
  const rows = sourceKey.split(".").reduce((current, part) => current?.[part], data);
  if (Array.isArray(rows) && rows.length) return rows;
  return fallbackRows;
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);
  return <span className={cx("staff-chip", `staff-chip--${normalized || "neutral"}`)}>{titleCase(status)}</span>;
}

function IconButton({ label, icon, onClick, active = false }) {
  const iconNode = createElement(icon, { size: 18 });
  return (
    <button type="button" className={cx("staff-icon-button", active && "is-active")} onClick={onClick} aria-label={label} title={label}>
      {iconNode}
    </button>
  );
}

function Button({ children, icon, tone = "secondary", type = "button", onClick, disabled = false, loading = false }) {
  const iconNode = icon ? createElement(icon, { size: 16 }) : null;
  return (
    <button type={type} className={`staff-button staff-button--${tone}`} onClick={onClick} disabled={disabled || loading}>
      {loading ? <Loader2 className="staff-spin" size={16} /> : iconNode}
      <span>{children}</span>
    </button>
  );
}

function EmptyState({ title, detail }) {
  return (
    <div className="staff-empty">
      <Sparkles size={22} />
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="staff-skeleton-grid" aria-label="Loading">
      {Array.from({ length: 8 }).map((_, index) => <span key={index} />)}
    </div>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="staff-error" role="alert">
      <AlertTriangle size={18} />
      <span>{message}</span>
    </div>
  );
}

function StaffSidebar({ t, staff, society }) {
  return (
    <aside className="staff-sidebar">
      <Link className="staff-brand" to="/staff/dashboard" aria-label="Nexora staff dashboard">
        <span>N</span>
        <div>
          <strong>Nexora</strong>
          <small>{t.secureScope}</small>
        </div>
      </Link>

      <nav className="staff-nav" aria-label="Staff dashboard navigation">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => cx("staff-nav-link", isActive && "is-active")}>
            <item.icon size={18} />
            <span>{t[item.labelKey]}</span>
          </NavLink>
        ))}
      </nav>

      <section className="staff-scope-card" aria-label="Staff access scope">
        <div>
          <span>Society</span>
          <strong>{society?.name || "Assigned society"}</strong>
        </div>
        <div>
          <span>Staff ID</span>
          <strong>{staff?.staffId || staff?.id || "Verified staff"}</strong>
        </div>
        <div>
          <span>Access</span>
          <strong><ShieldCheck size={14} /> Own work only</strong>
        </div>
      </section>
    </aside>
  );
}

function StaffTopbar({ t, language, onLanguageChange, theme, onThemeChange, staff, notices }) {
  const now = useClock();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState([]);
  const unread = notices.filter((notice) => !readIds.includes(notice.id) && normalizeStatus(notice.status) !== "read").length;

  return (
    <header className="staff-topbar">
      <div>
        <span>{t.staffWorkspace}</span>
        <h1>{t[routeTitles[useLocation().pathname] || "dashboard"]}</h1>
      </div>
      <div className="staff-topbar-actions">
        <time>{now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })} / {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</time>
        <div className="staff-language">
          <Languages size={16} />
          <select value={language} onChange={(event) => onLanguageChange(event.target.value)} aria-label="Language">
            {LANGUAGES.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
          </select>
        </div>
        <IconButton label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} icon={theme === "dark" ? Sun : Moon} onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")} />
        <div className="staff-notifications">
          <IconButton label="Notifications" icon={Bell} onClick={() => setOpen((value) => !value)} active={open} />
          {unread ? <span>{unread > 9 ? "9+" : unread}</span> : null}
          {open ? (
            <section className="staff-notification-menu" role="dialog" aria-label="Notifications">
              <header>
                <strong>{t.notices}</strong>
                <button type="button" onClick={() => setReadIds(notices.map((notice) => notice.id))}>Mark all read</button>
              </header>
              {notices.length ? notices.slice(0, 6).map((notice) => (
                <article key={notice.id} className={!readIds.includes(notice.id) ? "is-unread" : ""}>
                  <strong>{notice.title}</strong>
                  <p>{notice.message}</p>
                  <button type="button" onClick={() => setReadIds((ids) => Array.from(new Set([...ids, notice.id])))}>Read</button>
                </article>
              )) : <p className="staff-menu-empty">{t.empty}</p>}
            </section>
          ) : null}
        </div>
        <details className="staff-profile-menu">
          <summary>
            <span>{String(staff?.name || "S").slice(0, 1).toUpperCase()}</span>
            <ChevronDown size={16} />
          </summary>
          <div>
            <strong>{staff?.name || "Staff Member"}</strong>
            <small>{staff?.department || staff?.role || "Staff"}</small>
            <Link to="/staff/profile-documents">Profile</Link>
            <button type="button" onClick={() => { clearAuthSession(); window.location.href = "/login"; }}>
              <LogOut size={15} /> {t.logout}
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}

export function StaffLayout() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState({});
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [language, setLanguage] = useState(() => localStorage.getItem("staff-language") || "en");
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("staffTheme") || localStorage.getItem("theme-mode");
    return stored === "dark" ? "dark" : "light";
  });
  const t = useStaffText(language);
  const storedUser = getStoredUser() || {};

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.body.classList.toggle("dark", theme === "dark");
    localStorage.setItem("staffTheme", theme);
    localStorage.setItem("theme-mode", theme);
    window.dispatchEvent(new CustomEvent("theme-mode-changed", { detail: { themeMode: theme } }));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("staff-language", language);
  }, [language]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchStaffDashboard()
      .then((response) => {
        if (!mounted) return;
        setDashboard(response?.data || response || {});
        setError("");
      })
      .catch((requestError) => {
        if (!mounted) return;
        const message = requestError?.response?.data?.message || "Unable to load staff records. Please try again.";
        setError(message);
        if (message === "Society access not found. Please login again.") {
          clearAuthSession();
          navigate("/login", { replace: true, state: { message } });
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const refreshAttendance = async () => {
    setAttendanceLoading(true);
    try {
      const response = await fetchStaffAttendance();
      setAttendance(response?.data || response || {});
    } catch (requestError) {
      setToastMessage(requestError?.response?.data?.message || "Attendance sync failed.");
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    refreshAttendance();
  }, []);

  const staff = dashboard?.staff || {
    id: storedUser.id || storedUser.userId,
    name: storedUser.name || storedUser.userName,
    role: storedUser.role || "staff",
    email: storedUser.email,
    department: storedUser.department,
  };
  const society = dashboard?.society || {
    id: storedUser.societyId || storedUser.society_id,
    name: storedUser.societyName || storedUser.society_name,
    code: storedUser.societyCode || storedUser.society_code,
  };

  return (
    <div className={cx("staff-shell", `staff-shell--${theme}`)}>
      <StaffSidebar t={t} staff={staff} society={society} />
      <main className="staff-main">
        <StaffTopbar
          t={t}
          language={language}
          onLanguageChange={setLanguage}
          theme={theme}
          onThemeChange={setTheme}
          staff={staff}
          notices={getNotices(dashboard)}
        />
        <Outlet context={{ dashboard, attendance, attendanceLoading, loading, error, staff, society, language, t, toast: setToastMessage, refreshAttendance }} />
      </main>
      {toastMessage ? (
        <div className="staff-toast" role="status">
          <CheckCircle2 size={17} />
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage("")}>Close</button>
        </div>
      ) : null}
    </div>
  );
}

function Page({ eyebrow, title, description, action, children }) {
  const context = useStaffContext();
  return (
    <div className="staff-page">
      <ErrorBanner message={context.error} />
      <Motion.section className="staff-page-head" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
        <div>
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {action}
      </Motion.section>
      {context.loading ? <SkeletonGrid /> : children}
    </div>
  );
}

function KpiCard({ label, value, detail, icon, tone = "blue" }) {
  const iconNode = createElement(icon, { size: 18 });
  return (
    <article className={`staff-kpi staff-kpi--${tone}`}>
      <div>
        <span>{iconNode}</span>
        <small>{label}</small>
      </div>
      <strong>{value ?? "--"}</strong>
      <p>{detail}</p>
    </article>
  );
}

function Panel({ title, eyebrow, action, children, className = "" }) {
  return (
    <Motion.section className={cx("staff-panel", className)} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <header className="staff-panel-head">
        <div>
          {eyebrow ? <span>{eyebrow}</span> : null}
          <h2>{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </Motion.section>
  );
}

function SecurityPanel({ t }) {
  return (
    <Panel title={t.security} eyebrow="RBAC">
      <div className="staff-permission-grid">
        <div>
          <strong><ShieldCheck size={16} /> Allowed</strong>
          {staffPermissions.map((item) => <span key={item}>{item}</span>)}
        </div>
        <div>
          <strong><LockKeyhole size={16} /> Blocked</strong>
          {restrictedPermissions.map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>
    </Panel>
  );
}

function AuditPanel({ rows = [] }) {
  const auditRows = list(rows).slice(0, 6);
  return (
    <Panel title="Audit Logs" eyebrow="Traceability">
      <div className="staff-audit-list">
        {auditRows.length ? auditRows.map((item, index) => (
          <article key={item.id || index}>
            <History size={16} />
            <div>
              <strong>{item.action || item.title || "Staff activity"}</strong>
              <span>{item.actor || "System"} / {shortDate(item.created_at || item.date)}</span>
            </div>
          </article>
        )) : <EmptyState title="No audit entries yet." detail="Staff actions will be logged when workflows are submitted." />}
      </div>
    </Panel>
  );
}

function AiPanel({ title, points }) {
  return (
    <Panel title={title} eyebrow="AI">
      <div className="staff-ai-list">
        {points.map((point) => (
          <article key={point}>
            <Sparkles size={17} />
            <span>{point}</span>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function SimpleTable({ rows, columns, emptyTitle, emptyDetail }) {
  if (!rows.length) return <EmptyState title={emptyTitle} detail={emptyDetail} />;
  return (
    <div className="staff-table-wrap">
      <table className="staff-table">
        <thead>
          <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : row[column.key] || "--"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FilterBar({ query, setQuery, status, setStatus, priority, setPriority, placeholder, t }) {
  return (
    <div className="staff-filterbar">
      <label>
        <Search size={17} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={placeholder || t.search} />
      </label>
      <label>
        <Filter size={17} />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">{t.all} Status</option>
          {["assigned", "accepted", "in_progress", "paused", "completed", "verified", "pending", "approved", "rejected"].map((item) => (
            <option key={item} value={item}>{titleCase(item)}</option>
          ))}
        </select>
      </label>
      {setPriority ? (
        <label>
          <Gauge size={17} />
          <select value={priority} onChange={(event) => setPriority(event.target.value)}>
            <option value="all">{t.all} Priority</option>
            {["low", "normal", "medium", "high", "urgent"].map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
          </select>
        </label>
      ) : null}
    </div>
  );
}

function useFilteredWork(rows) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const filtered = useMemo(() => rows.filter((row) => {
    const haystack = [row.title, row.category, row.status, row.priority, row.resident, row.flat].join(" ").toLowerCase();
    const statusMatch = status === "all" || normalizeStatus(row.status) === status;
    const priorityMatch = priority === "all" || normalizeStatus(row.priority) === priority;
    return haystack.includes(query.toLowerCase()) && statusMatch && priorityMatch;
  }), [rows, query, status, priority]);
  return { query, setQuery, status, setStatus, priority, setPriority, filtered };
}

function WorkActionForm({ selected, onSubmit }) {
  const [state, setState] = useState({
    action: "accept",
    reason: "",
    notes: "",
    duration: "",
    materials: "",
    beforePhoto: "",
    afterPhoto: "",
    residentConfirmation: false,
  });
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    if (!selected) {
      setError("Select an assigned work item first.");
      return;
    }
    if (state.action === "reject" && !state.reason.trim()) {
      setError("Reject reason is required.");
      return;
    }
    if (state.action === "complete" && (!state.afterPhoto.trim() || !state.duration.trim())) {
      setError("Completion requires after photo reference and work duration.");
      return;
    }
    setError("");
    onSubmit(`${titleCase(state.action)} recorded for ${selected.title}.`);
  }

  return (
    <form className="staff-workflow-form" onSubmit={submit}>
      <div className="staff-form-grid">
        <label>
          <span>Workflow Action</span>
          <select value={state.action} onChange={(event) => setState({ ...state, action: event.target.value })}>
            <option value="accept">Accept task</option>
            <option value="reject">Reject with reason</option>
            <option value="start">Start work</option>
            <option value="pause">Pause work</option>
            <option value="resume">Resume work</option>
            <option value="complete">Complete work</option>
          </select>
        </label>
        <label>
          <span>Work Duration</span>
          <input value={state.duration} onChange={(event) => setState({ ...state, duration: event.target.value })} placeholder="2h 30m" />
        </label>
        <label>
          <span>Used Materials</span>
          <input value={state.materials} onChange={(event) => setState({ ...state, materials: event.target.value })} placeholder="Pipe sealant, wire, paint" />
        </label>
        <label>
          <span>Reject Reason</span>
          <input value={state.reason} onChange={(event) => setState({ ...state, reason: event.target.value })} placeholder="Required only for rejection" />
        </label>
        <label>
          <span>Before Photo Reference</span>
          <input value={state.beforePhoto} onChange={(event) => setState({ ...state, beforePhoto: event.target.value })} placeholder="Upload URL or file name" />
        </label>
        <label>
          <span>After Photo Reference</span>
          <input value={state.afterPhoto} onChange={(event) => setState({ ...state, afterPhoto: event.target.value })} placeholder="Required for completion" />
        </label>
      </div>
      <label className="staff-checkbox">
        <input type="checkbox" checked={state.residentConfirmation} onChange={(event) => setState({ ...state, residentConfirmation: event.target.checked })} />
        <span>Resident confirmation captured</span>
      </label>
      <label>
        <span>Work Notes</span>
        <textarea value={state.notes} onChange={(event) => setState({ ...state, notes: event.target.value })} placeholder="Add condition, materials, and verification notes." />
      </label>
      {error ? <div className="staff-inline-error">{error}</div> : null}
      <Button type="submit" tone="primary" icon={ClipboardCheck}>Save workflow update</Button>
    </form>
  );
}

function WorkBoard({ rows, t, onWorkflow }) {
  const filters = useFilteredWork(rows);
  const [selectedId, setSelectedId] = useState(rows[0]?.id || "");
  const selected = filters.filtered.find((row) => row.id === selectedId) || filters.filtered[0] || null;

  return (
    <>
      <FilterBar {...filters} t={t} />
      <section className="staff-work-grid">
        <Panel title="Assigned Work List" eyebrow="My queue">
          <div className="staff-task-list">
            {filters.filtered.length ? filters.filtered.map((task) => (
              <button type="button" key={task.id} className={cx("staff-task-card", selected?.id === task.id && "is-active")} onClick={() => setSelectedId(task.id)}>
                <div>
                  <strong>{task.title}</strong>
                  <StatusBadge status={task.status} />
                </div>
                <p>{task.category} / Flat {task.flat} / {task.resident}</p>
                <span>{titleCase(task.priority)} priority / Due {shortDate(task.due)}</span>
              </button>
            )) : <EmptyState title={t.empty} detail={t.emptyDetail} />}
          </div>
        </Panel>
        <Panel title="Task Workflow" eyebrow="Actions">
          {selected ? (
            <>
              <div className="staff-selected-task">
                <h3>{selected.title}</h3>
                <p>{selected.notes || "No additional notes from the society."}</p>
                <div>
                  <StatusBadge status={selected.priority} />
                  <StatusBadge status={selected.status} />
                </div>
              </div>
              <div className="staff-stage-row">
                {taskStages.map((stage) => <span key={stage}>{stage}</span>)}
              </div>
              <WorkActionForm selected={selected} onSubmit={onWorkflow} />
            </>
          ) : <EmptyState title={t.empty} detail={t.emptyDetail} />}
        </Panel>
      </section>
    </>
  );
}

function ChartPanel({ data, type = "area", dataKey = "value" }) {
  const rows = list(data);
  if (!rows.length) return <EmptyState title="No chart data yet." detail="Reports will render once the backend syncs staff metrics." />;
  return (
    <div className="staff-chart">
      <ResponsiveContainer width="100%" height={240}>
        {type === "bar" ? (
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey={dataKey} radius={[8, 8, 0, 0]}>
              {rows.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
            </Bar>
          </BarChart>
        ) : type === "pie" ? (
          <PieChart>
            <Tooltip />
            <Pie data={rows} dataKey={dataKey} nameKey="label" innerRadius={58} outerRadius={90} paddingAngle={3}>
              {rows.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
            </Pie>
          </PieChart>
        ) : type === "line" ? (
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey={dataKey} stroke="#2563eb" strokeWidth={3} dot={false} />
          </LineChart>
        ) : (
          <AreaChart data={rows}>
            <defs>
              <linearGradient id="staffArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Area type="monotone" dataKey={dataKey} stroke="#2563eb" fill="url(#staffArea)" strokeWidth={3} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export default function StaffHomePage() {
  const { dashboard, attendance, t, staff, society } = useStaffContext();
  const tasks = getTaskRows(dashboard);
  const emergencies = getEmergencyRows(dashboard);
  const materials = getMaterials(dashboard);
  const notices = getNotices(dashboard);
  const attendanceRows = getAttendanceRecords(dashboard, attendance);
  const completed = tasks.filter((item) => ["completed", "verified", "closed", "resolved"].includes(normalizeStatus(item.status)));
  const chartFallback = [
    { label: "Present", value: num(metricValue(dashboard, ["attendance.monthlySummary.present", "metrics.presentDays"])) },
    { label: "Absent", value: num(metricValue(dashboard, ["attendance.monthlySummary.absent", "metrics.absentDays"])) },
    { label: "Leave", value: num(metricValue(dashboard, ["attendance.monthlySummary.leave", "metrics.leaveDays"])) },
    { label: "Overtime", value: num(metricValue(dashboard, ["attendance.monthlySummary.overtime", "metrics.overtimeHours"])) },
  ].filter((item) => item.value > 0);

  return (
    <Page
      eyebrow={t.secureScope}
      title={`Welcome, ${staff?.name || "Staff Member"}`}
      description={`Assigned to ${society?.name || "your society"}. This workspace only exposes your work, attendance, leave, salary, notices, and documents.`}
      action={<Button tone="primary" icon={Sparkles}>{t.aiDailySummary}</Button>}
    >
      <section className="staff-kpi-grid">
        <KpiCard label="Today's Attendance" value={metricValue(dashboard, ["attendance.today.status", "todayAttendance.status"], "Pending")} detail="Check-in, break, checkout" icon={Clock3} />
        <KpiCard label="Assigned Tasks" value={tasks.length} detail={`${tasks.filter((item) => normalizeStatus(item.status) !== "completed").length} pending`} icon={ListChecks} tone="green" />
        <KpiCard label="Emergency Work" value={emergencies.length} detail="Active safety queue" icon={Flame} tone="red" />
        <KpiCard label="Leave Balance" value={metricValue(dashboard, ["metrics.leaveBalance", "leave.balance"], "--")} detail="Paid and half-day leave" icon={CalendarDays} tone="purple" />
        <KpiCard label="Materials" value={materials.filter((item) => normalizeStatus(item.status) === "pending").length} detail="Pending requests" icon={PackageCheck} />
        <KpiCard label="Salary Summary" value={metricValue(dashboard, ["salary.netSalary", "metrics.netSalary"], "--")} detail="Latest payable amount" icon={WalletCards} tone="green" />
        <KpiCard label="Notices" value={notices.length} detail="Recent society notices" icon={Bell} tone="orange" />
        <KpiCard label="Completed Work" value={completed.length} detail="Verified or closed" icon={BadgeCheck} tone="purple" />
      </section>

      <section className="staff-dashboard-grid">
        <Panel title="Staff Profile Summary" eyebrow="Profile">
          <div className="staff-profile-summary">
            <span>{String(staff?.name || "S").slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{staff?.name || "Staff Member"}</strong>
              <p>{staff?.designation || staff?.department || staff?.role || "Society staff"} / {society?.name || "Assigned society"}</p>
            </div>
          </div>
          <div className="staff-profile-facts">
            {[
              ["Staff ID", staff?.staffId || staff?.id],
              ["Department", staff?.department],
              ["Designation", staff?.designation || staff?.role],
              ["Verification", staff?.verificationStatus || "Verified session"],
            ].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value || "--"}</strong></article>)}
          </div>
        </Panel>
        <Panel title="Monthly Attendance Summary" eyebrow="Calendar">
          <ChartPanel data={getChartRows(dashboard, "charts.attendanceTrend", chartFallback)} type="bar" />
        </Panel>
        <AiPanel title={t.aiSmartSuggestions} points={[
          tasks.length ? "Prioritize high priority work before starting routine requests." : "No assigned task is pending in the synced records.",
          emergencies.length ? "Emergency items should be closed only after checklist and proof upload." : "Emergency queue is clear in current sync.",
          attendanceRows.length ? "Your attendance history is available for payroll calculation." : "Check in from the attendance page to create today's record.",
        ]} />
        <Panel title="Recent Completed Work" eyebrow="History">
          <SimpleTable
            rows={completed.slice(0, 5)}
            emptyTitle={t.empty}
            emptyDetail={t.emptyDetail}
            columns={[
              { key: "title", label: "Work" },
              { key: "category", label: "Category" },
              { key: "flat", label: "Flat" },
              { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
            ]}
          />
        </Panel>
      </section>

      <section className="staff-dashboard-grid staff-dashboard-grid--bottom">
        <SecurityPanel t={t} />
        <AuditPanel rows={dashboard.auditLogs} />
      </section>
    </Page>
  );
}

export function StaffTasksPage() {
  const { dashboard, t, toast } = useStaffContext();
  const rows = getTaskRows(dashboard);
  return (
    <Page eyebrow="Work queue" title={t.myTasks} description="Accept, reject, start, pause, resume, complete, document, and verify your assigned work.">
      <WorkBoard rows={rows} t={t} onWorkflow={toast} />
      <AuditPanel rows={dashboard.auditLogs} />
    </Page>
  );
}

export function StaffComplaintWorkPage() {
  const { dashboard, t, toast } = useStaffContext();
  const rows = getComplaintRows(dashboard);
  const filters = useFilteredWork(rows);
  return (
    <Page eyebrow="Resident complaints" title={t.complaintWork} description="View assigned complaints, resident details, flat information, images, timelines, proof, feedback, and chairman approval.">
      <FilterBar {...filters} t={t} placeholder="Search complaints, flats, residents" />
      <section className="staff-work-grid">
        <Panel title="Assigned Complaints" eyebrow="Complaint queue">
          <SimpleTable
            rows={filters.filtered}
            emptyTitle={t.empty}
            emptyDetail={t.emptyDetail}
            columns={[
              { key: "title", label: "Complaint" },
              { key: "resident", label: "Resident" },
              { key: "flat", label: "Flat" },
              { key: "priority", label: "Priority", render: (row) => <StatusBadge status={row.priority} /> },
              { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
            ]}
          />
        </Panel>
        <Panel title="Completion Proof" eyebrow="Verification">
          <WorkActionForm selected={filters.filtered[0]} onSubmit={toast} />
        </Panel>
      </section>
    </Page>
  );
}

export function StaffAttendancePage() {
  const { dashboard, attendance, attendanceLoading, refreshAttendance, toast, t } = useStaffContext();
  const [request, setRequest] = useState({ type: "paid_leave", date: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const rows = getAttendanceRecords(dashboard, attendance);
  const summary = dashboard.attendance?.monthlySummary || attendance.summary || dashboard.metrics || {};

  async function runAttendance(action) {
    setSubmitting(true);
    try {
      if (action === "checkin") await staffAttendanceCheckIn({ source: "staff_dashboard", mode: "gps_qr_ready" });
      else await staffAttendanceCheckOut({ source: "staff_dashboard" });
      toast(action === "checkin" ? "Check in recorded." : "Check out recorded.");
      await refreshAttendance();
    } catch (error) {
      toast(error?.response?.data?.message || "Attendance action failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitRequest(event) {
    event.preventDefault();
    if (!request.date || !request.reason.trim()) {
      toast("Attendance request requires date and reason.");
      return;
    }
    setSubmitting(true);
    try {
      await submitStaffAttendanceRequest(request);
      toast("Attendance request submitted for approval.");
      setRequest({ type: "paid_leave", date: "", reason: "" });
      await refreshAttendance();
    } catch (error) {
      toast(error?.response?.data?.message || "Request submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Page eyebrow="Attendance management" title={t.attendance} description="Daily check-in, QR/GPS readiness, monthly calendar, policy, overtime, leave, and history.">
      <section className="staff-kpi-grid">
        {[
          ["Present Days", summary.presentDays || summary.present || 0, CheckCircle2],
          ["Absent Days", summary.absentDays || summary.absent || 0, XCircle],
          ["Paid Leave", summary.paidLeave || summary.leave || 0, CalendarDays],
          ["Half Leave", summary.halfLeave || summary.half_day || 0, Clock3],
          ["Overtime", summary.overtime || summary.overtimeHours || 0, Activity],
          ["Late Arrivals", summary.lateArrivals || summary.late || 0, AlertTriangle],
          ["Attendance %", summary.attendancePercentage || summary.percentage || "--", Gauge],
          ["Working Hours", summary.workingHours || "--", Clock3],
        ].map(([label, value, Icon]) => <KpiCard key={label} label={label} value={value} detail="Current month" icon={Icon} />)}
      </section>
      <section className="staff-dashboard-grid">
        <Panel title="Daily Attendance" eyebrow={t.today} action={attendanceLoading ? <Loader2 className="staff-spin" size={18} /> : null}>
          <div className="staff-attendance-actions">
            <Button tone="primary" icon={PlayCircle} loading={submitting} onClick={() => runAttendance("checkin")}>Check In</Button>
            <Button tone="secondary" icon={PauseCircle}>Break Start</Button>
            <Button tone="secondary" icon={PlayCircle}>Break End</Button>
            <Button tone="danger" icon={XCircle} loading={submitting} onClick={() => runAttendance("checkout")}>Check Out</Button>
          </div>
          <div className="staff-capability-grid">
            {["QR Attendance", "GPS Attendance", "Face Recognition Optional", "Biometric Optional"].map((item) => <span key={item}><BadgeCheck size={15} /> {item}</span>)}
          </div>
        </Panel>
        <Panel title="Attendance Request" eyebrow="Validation">
          <form className="staff-workflow-form" onSubmit={submitRequest}>
            <div className="staff-form-grid">
              <label><span>Request Type</span><select value={request.type} onChange={(event) => setRequest({ ...request, type: event.target.value })}><option value="paid_leave">Paid Leave</option><option value="half_day">Half Day</option><option value="overtime">Overtime</option><option value="correction">Attendance Correction</option></select></label>
              <label><span>Date</span><input type="date" value={request.date} onChange={(event) => setRequest({ ...request, date: event.target.value })} /></label>
            </div>
            <label><span>Reason</span><textarea value={request.reason} onChange={(event) => setRequest({ ...request, reason: event.target.value })} /></label>
            <Button type="submit" tone="primary" loading={submitting}>Submit for chairman/secretary approval</Button>
          </form>
        </Panel>
      </section>
      <section className="staff-dashboard-grid">
        <Panel title="Monthly Calendar" eyebrow="Present / Absent / Leave / Holiday">
          <SimpleTable rows={rows.slice(0, 12).map((item, index) => ({ id: item.id || index, date: shortDate(item.date || item.attendance_date || item.created_at), status: item.status || "present", check_in: shortTime(item.check_in_at || item.check_in), check_out: shortTime(item.check_out_at || item.check_out) }))} emptyTitle={t.empty} emptyDetail={t.emptyDetail} columns={[{ key: "date", label: "Date" }, { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> }, { key: "check_in", label: "Check In" }, { key: "check_out", label: "Check Out" }]} />
        </Panel>
        <Panel title="Attendance Policy" eyebrow="Rules">
          <div className="staff-policy-grid">
            {["8 working hours", "Configurable office time", "2 paid leaves per month", "1 half-day leave per month", "Weekly off", "Society holidays", "Late rules", "Overtime rules", "Salary deduction rules"].map((item) => <span key={item}>{item}</span>)}
          </div>
        </Panel>
      </section>
    </Page>
  );
}

export function StaffDutySchedulePage() {
  const { dashboard, t } = useStaffContext();
  const rows = firstList(dashboard, ["duties", "dutySchedule", "shifts"]).map((item, index) => ({
    id: item.id || index,
    date: shortDate(item.date || item.duty_date),
    shift: item.shift || item.shift_name || "--",
    department: item.department || "--",
    area: item.area || item.area_assignment || item.location || "--",
    status: item.status || "upcoming",
  }));
  return (
    <Page eyebrow="Scheduling" title={t.dutySchedule} description="Today's duty, weekly and monthly shifts, department, area assignment, and upcoming calendar.">
      <section className="staff-dashboard-grid">
        <Panel title="Today's Duty" eyebrow="Current shift">
          <SimpleTable rows={rows.slice(0, 4)} emptyTitle={t.empty} emptyDetail={t.emptyDetail} columns={[{ key: "date", label: "Date" }, { key: "shift", label: "Shift" }, { key: "department", label: "Department" }, { key: "area", label: "Area" }, { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> }]} />
        </Panel>
        <Panel title="Duty Calendar" eyebrow="Monthly">
          <ChartPanel data={getChartRows(dashboard, "charts.dutyLoad")} type="bar" />
        </Panel>
      </section>
    </Page>
  );
}

export function StaffLeaveManagementPage() {
  const { dashboard, t, toast } = useStaffContext();
  const rows = getLeaves(dashboard);
  const [form, setForm] = useState({ type: "casual", date: "", reason: "", document: "" });
  function submit(event) {
    event.preventDefault();
    if (!form.date || !form.reason.trim()) {
      toast("Leave request requires date and reason.");
      return;
    }
    toast("Leave request prepared for chairman/secretary approval.");
  }
  return (
    <Page eyebrow="Leave" title={t.leaveManagement} description="Apply leave, upload documents, track chairman/secretary approval, view status, history, and balance.">
      <section className="staff-dashboard-grid">
        <Panel title="Apply Leave" eyebrow="Request">
          <form className="staff-workflow-form" onSubmit={submit}>
            <div className="staff-form-grid">
              <label><span>Leave Type</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="casual">Casual Leave</option><option value="sick">Sick Leave</option><option value="emergency">Emergency Leave</option><option value="half_day">Half-Day Leave</option></select></label>
              <label><span>Date</span><input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
              <label><span>Document</span><input value={form.document} onChange={(event) => setForm({ ...form, document: event.target.value })} placeholder="Certificate or proof file" /></label>
            </div>
            <label><span>Reason</span><textarea value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></label>
            <Button type="submit" tone="primary" icon={UploadCloud}>Apply Leave</Button>
          </form>
        </Panel>
        <Panel title="Leave Balance" eyebrow="Policy">
          <div className="staff-policy-grid">
            {["Casual Leave", "Sick Leave", "Emergency Leave", "Half-Day Leave", "2 Paid Leaves / Month", "1 Half-Day / Month"].map((item) => <span key={item}>{item}</span>)}
          </div>
        </Panel>
      </section>
      <Panel title="Leave History" eyebrow="Approval">
        <SimpleTable rows={rows} emptyTitle={t.empty} emptyDetail={t.emptyDetail} columns={[{ key: "type", label: "Type" }, { key: "date", label: "Date", render: (row) => shortDate(row.date) }, { key: "reason", label: "Reason" }, { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> }]} />
      </Panel>
    </Page>
  );
}

export function StaffMaterialRequestsPage() {
  const { dashboard, t, toast } = useStaffContext();
  const rows = getMaterials(dashboard);
  const filters = useFilteredWork(rows.map((row) => ({ ...row, title: row.name, category: row.reason, flat: row.stock, resident: row.quantity })));
  return (
    <Page eyebrow="Inventory" title={t.materialRequests} description="Request materials, quantity, priority, reason, approval, issue history, usage, inventory availability, and low-stock alerts.">
      <FilterBar {...filters} t={t} placeholder="Search materials" />
      <section className="staff-dashboard-grid">
        <Panel title="Request Materials" eyebrow="Workflow">
          <form className="staff-workflow-form" onSubmit={(event) => { event.preventDefault(); toast("Material request prepared for approval."); }}>
            <div className="staff-form-grid">
              <label><span>Material</span><input placeholder="Material name" required /></label>
              <label><span>Quantity</span><input placeholder="Quantity" required /></label>
              <label><span>Priority</span><select><option>Normal</option><option>High</option><option>Urgent</option></select></label>
            </div>
            <label><span>Reason</span><textarea required /></label>
            <Button type="submit" tone="primary" icon={PackageCheck}>Request Material</Button>
          </form>
        </Panel>
        <Panel title="Material Usage" eyebrow="Chart">
          <ChartPanel data={getChartRows(dashboard, "charts.materialRequests")} type="bar" />
        </Panel>
      </section>
      <Panel title="Request Status" eyebrow="Inventory">
        <SimpleTable rows={filters.filtered} emptyTitle={t.empty} emptyDetail={t.emptyDetail} columns={[{ key: "name", label: "Material" }, { key: "quantity", label: "Qty" }, { key: "priority", label: "Priority", render: (row) => <StatusBadge status={row.priority} /> }, { key: "stock", label: "Stock" }, { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> }]} />
      </Panel>
    </Page>
  );
}

export function StaffEmergencyTasksPage() {
  const { dashboard, t, toast } = useStaffContext();
  const rows = getEmergencyRows(dashboard);
  return (
    <Page eyebrow="Emergency response" title={t.emergencyTasks} description="Fire, water leakage, electrical failure, lift breakdown, medical emergency, security assistance, checklist, and completion report.">
      <section className="staff-emergency-grid">
        {["Fire Emergency", "Water Leakage", "Electrical Failure", "Lift Breakdown", "Medical Emergency", "Security Assistance"].map((item) => (
          <article key={item}>
            <Flame size={20} />
            <strong>{item}</strong>
            <Button tone="danger" onClick={() => toast(`${item} checklist opened.`)}>Open Checklist</Button>
          </article>
        ))}
      </section>
      <section className="staff-dashboard-grid">
        <Panel title="Active Emergency Tasks" eyebrow="Urgent">
          <SimpleTable rows={rows} emptyTitle={t.empty} emptyDetail={t.emptyDetail} columns={[{ key: "title", label: "Emergency" }, { key: "location", label: "Location" }, { key: "priority", label: "Priority", render: (row) => <StatusBadge status={row.priority} /> }, { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> }]} />
        </Panel>
        <Panel title="Emergency Completion Report" eyebrow="Safety">
          <div className="staff-checklist">
            {["Assess risk", "Inform supervisor", "Secure area", "Use PPE", "Capture proof", "Resident or supervisor confirmation"].map((item) => <label key={item}><input type="checkbox" /> <span>{item}</span></label>)}
          </div>
          <Button tone="primary" icon={ClipboardCheck} onClick={() => toast("Emergency completion report saved locally.")}>Save Report</Button>
        </Panel>
      </section>
    </Page>
  );
}

export function StaffSalaryPayslipsPage() {
  const { dashboard, t } = useStaffContext();
  const salary = dashboard.salary || {};
  const history = firstList(dashboard, ["salaryHistory", "payslips"]).map((item, index) => ({ id: item.id || index, month: item.month || item.period || "--", net: item.netSalary || item.net_salary || item.amount || "--", status: item.status || item.payment_status || "pending" }));
  return (
    <Page eyebrow="Payroll" title={t.salaryPayslips} description="Monthly salary, attendance summary, overtime, bonus, deductions, net salary, payment status, history, and PDF payslip download.">
      <section className="staff-kpi-grid">
        <KpiCard label="Monthly Salary" value={salary.monthlySalary || salary.grossSalary || "--"} detail="Gross amount" icon={WalletCards} />
        <KpiCard label="Overtime Amount" value={salary.overtimeAmount || "--"} detail="Approved overtime" icon={Clock3} tone="green" />
        <KpiCard label="Bonus" value={salary.bonus || "--"} detail="Current month" icon={Star} tone="purple" />
        <KpiCard label="Deductions" value={salary.deductions || "--"} detail="Late or absence rules" icon={ReceiptText} tone="red" />
        <KpiCard label="Net Salary" value={salary.netSalary || "--"} detail="Payable" icon={BadgeCheck} tone="green" />
        <KpiCard label="Payment Status" value={salary.paymentStatus || "--"} detail="Payroll status" icon={FileBadge2} />
      </section>
      <Panel title="Salary History" eyebrow="Payslips" action={<Button tone="primary" icon={Download}>Download PDF</Button>}>
        <SimpleTable rows={history} emptyTitle={t.empty} emptyDetail={t.emptyDetail} columns={[{ key: "month", label: "Month" }, { key: "net", label: "Net Salary" }, { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> }]} />
      </Panel>
    </Page>
  );
}

export function StaffNoticesPage() {
  const { dashboard, t } = useStaffContext();
  const rows = getNotices(dashboard);
  const [category, setCategory] = useState("all");
  const categories = Array.from(new Set(rows.map((row) => row.category).filter(Boolean)));
  const filtered = category === "all" ? rows : rows.filter((row) => normalizeStatus(row.category) === category);
  return (
    <Page eyebrow="Inbox" title={t.notices} description="Society notices, maintenance updates, duty instructions, events, emergency notices, and read status.">
      <div className="staff-filterbar staff-filterbar--compact">
        <label><Globe2 size={17} /><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All Categories</option>{categories.map((item) => <option key={item} value={normalizeStatus(item)}>{titleCase(item)}</option>)}</select></label>
      </div>
      <div className="staff-notice-grid">
        {filtered.length ? filtered.map((notice) => (
          <article key={notice.id} className="staff-notice-card">
            <div><StatusBadge status={notice.status} /><span>{shortDate(notice.date)}</span></div>
            <h2>{notice.title}</h2>
            <p>{notice.message}</p>
            <Button tone="secondary" icon={Eye}>View Details</Button>
          </article>
        )) : <EmptyState title={t.empty} detail={t.emptyDetail} />}
      </div>
    </Page>
  );
}

export function StaffPerformancePage() {
  const { dashboard, t } = useStaffContext();
  const metrics = dashboard.metrics || dashboard.performance || {};
  return (
    <Page eyebrow="Performance analytics" title={t.performance} description="Tasks completed, pending tasks, completion rate, attendance score, resident and supervisor ratings, badges, monthly and yearly performance.">
      <section className="staff-kpi-grid">
        <KpiCard label="Tasks Completed" value={metrics.tasksCompleted || metrics.completedTasks || 0} detail="Current month" icon={CheckCircle2} />
        <KpiCard label="Pending Tasks" value={metrics.pendingTasks || 0} detail="Open queue" icon={ListChecks} tone="orange" />
        <KpiCard label="Completion Rate" value={metrics.completionRate ? `${metrics.completionRate}%` : "--"} detail="Work quality" icon={Gauge} tone="green" />
        <KpiCard label="Attendance Score" value={metrics.attendanceScore ? `${metrics.attendanceScore}%` : "--"} detail="Reliability" icon={Clock3} />
        <KpiCard label="Resident Rating" value={metrics.residentRating || metrics.rating || "--"} detail="Feedback" icon={Star} tone="purple" />
        <KpiCard label="Supervisor Rating" value={metrics.supervisorRating || "--"} detail="Chairman/secretary review" icon={BadgeCheck} />
      </section>
      <section className="staff-dashboard-grid">
        <Panel title="Monthly Performance" eyebrow="Trend"><ChartPanel data={getChartRows(dashboard, "charts.monthlyPerformance")} type="line" /></Panel>
        <Panel title="Task Completion" eyebrow="Breakdown"><ChartPanel data={getChartRows(dashboard, "charts.taskCompletion")} type="pie" /></Panel>
        <AiPanel title="AI Performance Analysis" points={["Completion rate, attendance consistency, response time, and verification feedback drive the productivity score.", "Monthly reports can be generated when synced performance rows are available."]} />
        <Panel title="Achievement Badges" eyebrow="Recognition"><div className="staff-badge-grid">{["Fast Response", "Safety First", "Resident Trusted", "Attendance Star"].map((item) => <span key={item}><Star size={15} /> {item}</span>)}</div></Panel>
      </section>
    </Page>
  );
}

export function StaffProfileDocumentsPage() {
  const { dashboard, staff, society, t, toast } = useStaffContext();
  const docs = firstList(dashboard, ["documents", "staffDocuments"]).map((item, index) => ({ id: item.id || index, type: item.type || item.document_type || "Document", title: item.title || item.name || "--", status: item.status || item.verification_status || "pending" }));
  return (
    <Page eyebrow="Identity" title={t.profileDocuments} description="Personal details, contact, emergency contact, staff ID, department, designation, experience, skills, Aadhaar, PAN, bank details, certificates, verification, and password security.">
      <section className="staff-dashboard-grid">
        <Panel title="Personal Details" eyebrow="Profile">
          <div className="staff-profile-facts staff-profile-facts--wide">
            {[
              ["Name", staff?.name],
              ["Email", staff?.email],
              ["Contact", staff?.phone || staff?.mobile],
              ["Emergency Contact", staff?.emergencyContact],
              ["Staff ID", staff?.staffId || staff?.id],
              ["Department", staff?.department],
              ["Designation", staff?.designation || staff?.role],
              ["Experience", staff?.experience],
              ["Skills", list(staff?.skills).join(", ") || staff?.skills],
              ["Society", society?.name],
              ["Verification", staff?.verificationStatus || "Verified session"],
              ["Bank Details", staff?.bankStatus || "Secured"],
            ].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value || "--"}</strong></article>)}
          </div>
          <div className="staff-action-row">
            <Button tone="secondary" icon={UploadCloud} onClick={() => toast("Profile photo upload ready.")}>Profile Photo</Button>
            <Button tone="primary" icon={LockKeyhole} onClick={() => toast("Password change flow opened.")}>Change Password</Button>
          </div>
        </Panel>
        <Panel title="Document Upload" eyebrow="Verification">
          <div className="staff-upload-zone">
            <UploadCloud size={28} />
            <strong>Upload Aadhaar, PAN, bank proof, certificates</strong>
            <p>Files are visible only to authorized chairman/secretary reviewers.</p>
            <Button tone="primary" icon={UploadCloud}>Choose Files</Button>
          </div>
        </Panel>
      </section>
      <Panel title="Uploaded Documents" eyebrow="Status">
        <SimpleTable rows={docs} emptyTitle={t.empty} emptyDetail={t.emptyDetail} columns={[{ key: "type", label: "Type" }, { key: "title", label: "Title" }, { key: "status", label: "Verification", render: (row) => <StatusBadge status={row.status} /> }]} />
      </Panel>
    </Page>
  );
}

export const StaffWorkOrdersPage = StaffComplaintWorkPage;
export const StaffMaintenancePage = StaffComplaintWorkPage;
export const StaffVisitorsPage = StaffEmergencyTasksPage;
export const StaffDocumentsPage = StaffProfileDocumentsPage;
export const StaffLeaveRequestsPage = StaffLeaveManagementPage;
export const StaffComplaintsPage = StaffComplaintWorkPage;
export const StaffAnnouncementsPage = StaffNoticesPage;
export const StaffSettingsPage = StaffProfileDocumentsPage;
