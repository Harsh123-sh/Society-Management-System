import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CalendarClock,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ClipboardCheck,
  CreditCard,
  Download,
  FileBarChart,
  FileText,
  Filter,
  Folder,
  Gauge,
  HelpCircle,
  Home,
  Import,
  LayoutDashboard,
  Languages,
  LogOut,
  Menu,
  MapPin,
  Moon,
  Monitor,
  MoreHorizontal,
  ParkingCircle,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  UserCheck,
  UserCircle,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fetchChairmanHome,
  fetchChairmanSection,
  fetchChairmanStats,
  runChairmanRowAction,
} from "../services/chairmanDashboardApi";
import { getApiMessage, logoutUser } from "../services/authApi";
import { createAutoInvoices } from "../services/billingApi";
import { clearAuthSession, getStoredUser } from "../utils/session";
import { BRAND } from "../config/brand";
import "../styles/chairman-dashboard.css";

const Motion = motion;
const pageSize = 10;
const chartPalette = ["#8b5cf6", "#38bdf8", "#6366f1", "#22c55e", "#f59e0b", "#fb7185"];

const navGroups = [
  {
    title: "Chairman",
    items: [
      { label: "Dashboard", path: "/admin/dashboard", key: "dashboard", icon: LayoutDashboard },
      { label: "Residents", path: "/admin/resident-directory", key: "resident-directory", icon: Users },
      { label: "Flats & Properties", path: "/admin/flats", key: "flats", icon: Building2 },
      { label: "Visitors", path: "/admin/visitor-logs", key: "visitor-logs", icon: ShieldCheck },
      { label: "Billing & Finance", path: "/admin/maintenance-bills", key: "maintenance-bills", icon: WalletCards },
      { label: "Complaints", path: "/admin/active-complaints", key: "active-complaints", icon: AlertTriangle },
      { label: "Approvals", path: "/admin/pending-chairman-tasks", key: "pending-chairman-tasks", icon: ClipboardCheck },
      { label: "Notices", path: "/admin/notice-board", key: "notice-board", icon: Bell },
      { label: "Staff & Security", path: "/admin/staff-register", key: "staff-register", icon: BriefcaseBusiness },
      { label: "Documents", path: "/admin/documents", key: "documents", icon: Folder },
      { label: "Reports & Analytics", path: "/admin/analytics", key: "analytics", icon: BarChart3 },
      { label: "Settings", path: "/admin/settings", key: "settings", icon: Settings },
    ],
  },
];

const allItems = navGroups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.title })));

const legacyPathMap = {
  approvals: "pending-chairman-tasks",
  billing: "maintenance-bills",
  community: "active-complaints",
  complaints: "active-complaints",
  flats: "flats",
  "flats-properties": "flats",
  "financial-reports": "reports",
  "gate-passes": "gate-pass",
  language: "settings",
  messages: "notice-board",
  notices: "notice-board",
  notifications: "settings",
  parking: "parking",
  "parking-management": "parking",
  products: "documents",
  property: "flats",
  "revenue-dashboard": "analytics",
  security: "visitor-logs",
  settings: "settings",
  "society-documents": "documents",
  "society-settings": "settings",
  staff: "staff-register",
  "staff-approval": "staff-approvals",
  "staff-management": "staff-register",
  tenants: "tenants",
  theme: "settings",
  "towers-wings-floors": "towers",
  users: "resident-directory",
  visitors: "visitor-logs",
  "vehicle-approval": "vehicle-approvals",
};

const sectionMeta = {
  dashboard: { title: "Executive Overview", summary: "Live society operations, finance, approvals, complaints, visitors, and workforce intelligence." },
  "society-profile": { title: "Society Profile", summary: "Verified society identity, contacts, address, registration, and operating details." },
  towers: { title: "Towers", summary: "High-level property structure and occupancy distribution across towers." },
  wings: { title: "Wings", summary: "Wing-level inventory, resident allocation, and operational coverage." },
  flats: { title: "Flats & Properties", summary: "Manage flats, occupancy, owners, tenants, wings, and floor assignments." },
  parking: { title: "Parking", summary: "Parking slots, allocations, vehicles, and availability controls." },
  owners: { title: "Owners", summary: "Owner CRM, KYC, documents, payments, complaints, visitors, and activity history." },
  tenants: { title: "Tenants", summary: "Tenant CRM, KYC, move-in lifecycle, payments, complaints, visitors, and history." },
  "resident-directory": { title: "Residents", summary: "Manage owners, tenants, families, and KYC records." },
  "move-in-out": { title: "Move In / Move Out", summary: "Resident transition workflow, verification, and account status." },
  "pending-chairman-tasks": { title: "Approvals", summary: "Review pending registrations, documents, staff, security, and vehicle requests." },
  "secretary-approvals": { title: "Secretary Approvals", summary: "Secretary onboarding approvals scoped to the current society." },
  "resident-approvals": { title: "Resident Approvals", summary: "Pending owner and tenant registrations requiring Chairman review." },
  "staff-approvals": { title: "Staff Approvals", summary: "Staff onboarding, KYC, role, and verification requests." },
  "security-approvals": { title: "Security Approvals", summary: "Security guard registration and access approval queue." },
  "vehicle-approvals": { title: "Vehicle Approvals", summary: "Vehicle and gate pass approvals from security workflows." },
  "generate-bills": { title: "Generate Bills", summary: "AI-assisted bill generation by society, wing, floor, flat, and resident type." },
  "maintenance-bills": { title: "Maintenance Bills", summary: "Generated bills, paid/unpaid/overdue status, and PDF-ready billing records." },
  collections: { title: "Collections", summary: "Collection performance, payment status, and revenue progress." },
  "pending-dues": { title: "Pending Dues", summary: "Overdue and unpaid obligations requiring collection follow-up." },
  receipts: { title: "Receipts", summary: "Receipt tracking, reconciliation, and download workflow." },
  reports: { title: "Reports", summary: "Finance reports, collection percentage, and export-ready analysis." },
  "active-complaints": { title: "Active Complaints", summary: "Open complaint workload, assignments, SLA pressure, and resolution actions." },
  "escalated-cases": { title: "Escalated Cases", summary: "High-risk complaint cases requiring Chairman attention." },
  "complaint-analytics": { title: "Complaint Analytics", summary: "Complaint patterns, resolution status, and risk signals." },
  "visitor-logs": { title: "Visitor Logs", summary: "Visitor, cab, service provider, vehicle, and live movement records." },
  "gate-pass": { title: "Gate Pass", summary: "QR-ready gate pass requests, approvals, and live status." },
  delivery: { title: "Delivery", summary: "Delivery entries, status, provider details, and history." },
  emergency: { title: "Emergency", summary: "Emergency events, alerts, live response status, and audit trail." },
  "staff-register": { title: "Staff & Security", summary: "Manage staff, security, attendance, leave requests, shifts, and task assignment." },
  "security-register": { title: "Security Register", summary: "Security guard HR records, shifts, documents, attendance, and performance." },
  attendance: { title: "Attendance", summary: "Attendance timeline, shift presence, leave, and monthly report controls." },
  performance: { title: "Performance", summary: "Staff and security performance, attendance quality, and operational scorecards." },
  "notice-board": { title: "Notices", summary: "Create, schedule, publish, and manage society notices." },
  documents: { title: "Documents", summary: "Manage society documents, categories, downloads, uploads, and expiry reminders." },
  analytics: { title: "Reports & Analytics", summary: "Track KPIs, charts, exports, and date-filtered society insights." },
  settings: { title: "Settings", summary: "Profile, society profile, notifications, and appearance settings." },
};

const actionMap = {
  "resident-directory": [{ label: "View", action: "view-record", local: true }, { label: "Edit", action: "edit-record", local: true }],
  flats: [{ label: "View", action: "view-record", local: true }, { label: "Edit", action: "edit-record", local: true }, { label: "Assign", action: "assign-flat", local: true }],
  "pending-chairman-tasks": [{ label: "View", action: "view-record", local: true }, { label: "Approve", action: "approve-user", approve: true }, { label: "Reject", action: "reject-user", danger: true }],
  "resident-approvals": [{ label: "Approve", action: "approve-user" }, { label: "Reject", action: "reject-user", danger: true }],
  "secretary-approvals": [{ label: "Approve", action: "approve-user" }, { label: "Reject", action: "reject-user", danger: true }],
  "staff-approvals": [{ label: "Approve", action: "approve-user" }, { label: "Reject", action: "reject-user", danger: true }],
  "security-approvals": [{ label: "Approve", action: "approve-user" }, { label: "Reject", action: "reject-user", danger: true }],
  "vehicle-approvals": [{ label: "Approve", action: "approve-vehicle" }, { label: "Reject", action: "reject-vehicle", danger: true }],
  "gate-pass": [{ label: "Approve", action: "approve-vehicle" }, { label: "Reject", action: "reject-vehicle", danger: true }],
  documents: [{ label: "View", action: "view-record", local: true }, { label: "Download", action: "download-record", local: true }],
  "notice-board": [{ label: "View", action: "view-record", local: true }, { label: "Edit", action: "edit-record", local: true }, { label: "Delete", action: "delete-record", danger: true, local: true }],
  analytics: [{ label: "View", action: "view-record", local: true }],
  "active-complaints": [{ label: "Resolve", action: "resolve-complaint" }],
  "escalated-cases": [{ label: "Resolve", action: "resolve-complaint" }],
};

const featureConfig = {
  "resident-directory": {
    title: "Residents",
    summary: "Manage owners, tenants, families, and KYC records.",
    breadcrumb: "Chairman / Residents",
    primaryAction: "Add Resident",
    secondaryActions: ["Pending Registrations"],
    filters: ["All residents", "Owners", "Tenants", "Pending registrations", "KYC pending"],
    columns: ["name", "resident_type", "flat_number", "wing", "mobile", "email", "kyc_status", "status"],
    emptyTitle: "No resident records found.",
    kpis: [
      ["Owners", (rows) => countByText(rows, ["owner"])],
      ["Tenants", (rows) => countByText(rows, ["tenant"])],
      ["Pending Registrations", (rows) => countByStatus(rows, ["pending", "pending_approval", "verification_pending"])],
      ["KYC Pending", (rows) => countByText(rows, ["kyc pending", "pending kyc", "unverified"])],
    ],
  },
  flats: {
    title: "Flats & Properties",
    summary: "Manage flats, occupancy, owners, tenants, wings, and floor assignments.",
    breadcrumb: "Chairman / Flats & Properties",
    primaryAction: "Add Flat",
    secondaryActions: ["Assign Owner/Tenant"],
    filters: ["All flats", "Occupied", "Vacant", "Wing filter", "Floor filter"],
    columns: ["flat_number", "wing", "floor", "occupancy_status", "owner_name", "tenant_name", "status"],
    emptyTitle: "No flat records found.",
    kpis: [
      ["Total Flats", (rows) => rows.length],
      ["Occupied", (rows) => countByStatus(rows, ["occupied", "assigned", "active"])],
      ["Vacant", (rows) => rows.filter((row) => /vacant|available/i.test(JSON.stringify(row))).length],
      ["Mapped Owners", (rows) => rows.filter((row) => row.owner_id || row.owner_name || row.ownerName).length],
    ],
  },
  "visitor-logs": {
    title: "Visitors",
    summary: "Track visitor entries, approvals, purpose, flat mapping, entry time, and exit time.",
    breadcrumb: "Chairman / Visitors",
    primaryAction: "Add Visitor",
    filters: ["All visitors", "Pending approval", "Approved", "Checked in", "Checked out"],
    columns: ["visitor_name", "name", "phone", "purpose", "flat_number", "entry_time", "exit_time", "status", "approval_status"],
    emptyTitle: "No visitor records found.",
    kpis: [
      ["Visitors", (rows) => rows.length],
      ["Pending Approval", (rows) => countByText(rows, ["pending"])],
      ["Checked In", (rows) => countByText(rows, ["checked_in", "checked in", "entered"])],
      ["Approved", (rows) => countByStatus(rows, ["approved", "active"])],
    ],
  },
  "maintenance-bills": {
    title: "Billing & Finance",
    summary: "Manage bill records, collections, pending dues, receipts, and payment status.",
    breadcrumb: "Chairman / Billing & Finance",
    primaryAction: "Generate Bill",
    secondaryActions: ["Export Excel"],
    filters: ["All bills", "Paid", "Unpaid", "Overdue", "Partial"],
    columns: ["bill_number", "flat_number", "resident_name", "amount", "total_amount", "payment_status", "due_date", "created_at"],
    emptyTitle: "No bill records found.",
    kpis: [
      ["Bills", (rows) => rows.length],
      ["Paid", (rows) => countByStatus(rows, ["paid", "captured", "success", "completed"])],
      ["Unpaid", (rows) => countByStatus(rows, ["unpaid", "pending", "partial"])],
      ["Overdue", (rows) => countByStatus(rows, ["overdue"])],
    ],
  },
  "active-complaints": {
    title: "Complaints",
    summary: "Review complaint records, status, priority, assignment, SLA pressure, and resolution actions.",
    breadcrumb: "Chairman / Complaints",
    primaryAction: "Create Complaint",
    filters: ["All complaints", "Open", "In progress", "Resolved", "Escalated"],
    columns: ["ticket_no", "title", "category", "flat_number", "priority", "assigned_to", "status", "created_at"],
    emptyTitle: "No complaint records found.",
    kpis: [
      ["Complaints", (rows) => rows.length],
      ["Open", (rows) => countByStatus(rows, ["open", "active", "pending"])],
      ["Resolved", (rows) => countByStatus(rows, ["resolved", "closed"])],
      ["Escalated", (rows) => countByStatus(rows, ["escalated"])],
    ],
  },
  "pending-chairman-tasks": {
    title: "Approvals",
    summary: "Review pending registrations, documents, staff, security, and vehicle requests.",
    breadcrumb: "Chairman / Approvals",
    primaryAction: "Review Queue",
    filters: ["All approvals", "Resident", "Document", "Staff", "Security", "Vehicle"],
    columns: ["name", "email", "phone", "role", "society_name", "request_type", "requested_date", "status"],
    emptyTitle: "No pending approvals.",
    kpis: [
      ["Pending", (rows) => countByStatus(rows, ["pending", "pending_approval", "verification_pending"])],
      ["Residents", (rows) => countByText(rows, ["resident", "owner", "tenant"])],
      ["Documents", (rows) => countByText(rows, ["document", "kyc"])],
      ["Staff/Security", (rows) => countByText(rows, ["staff", "security"])],
    ],
  },
  "notice-board": {
    title: "Notices",
    summary: "Create, schedule, publish, and manage society notices.",
    breadcrumb: "Chairman / Notices",
    primaryAction: "Create Notice",
    filters: ["All notices", "Draft", "Scheduled", "Published"],
    columns: ["title", "category", "audience", "status", "scheduled_at", "created_at"],
    emptyTitle: "No notice records found.",
    kpis: [
      ["Drafts", (rows) => countByStatus(rows, ["draft"])],
      ["Scheduled", (rows) => countByStatus(rows, ["scheduled"])],
      ["Published", (rows) => countByStatus(rows, ["published", "active"])],
      ["Total Notices", (rows) => rows.length],
    ],
  },
  documents: {
    title: "Documents",
    summary: "Manage society documents, categories, downloads, uploads, and expiry reminders.",
    breadcrumb: "Chairman / Documents",
    primaryAction: "Upload Document",
    filters: ["All documents", "Society", "KYC", "Finance", "Expiring soon"],
    columns: ["title", "name", "category", "document_type", "status", "expiry_date", "created_at"],
    emptyTitle: "No document records found.",
    kpis: [
      ["Documents", (rows) => rows.length],
      ["Expiring Soon", (rows) => rows.filter((row) => row.expiry_date || row.expires_at).length],
      ["KYC Files", (rows) => countByText(rows, ["kyc"])],
      ["Society Docs", (rows) => countByText(rows, ["society", "registration", "bylaw"])],
    ],
  },
  analytics: {
    title: "Reports & Analytics",
    summary: "Track KPIs, charts, exports, and date-filtered society insights.",
    breadcrumb: "Chairman / Reports & Analytics",
    primaryAction: "Export PDF",
    secondaryActions: ["Export Excel"],
    filters: ["This month", "Quarter", "Year", "Custom dates"],
    columns: ["name", "category", "metric", "value", "status", "created_at"],
    emptyTitle: "No report records found.",
    kpis: [
      ["Reports", (rows) => rows.length],
      ["KPIs", (rows) => Math.max(rows.length, 4)],
      ["Exports", () => 2],
      ["Date Filters", () => 4],
    ],
  },
  settings: {
    title: "Settings",
    summary: "Manage profile, society profile, notifications, and appearance only.",
    breadcrumb: "Chairman / Settings",
    primaryAction: "Save Changes",
    filters: ["Profile", "Society Profile", "Notifications", "Appearance"],
    columns: ["name", "category", "status", "updated_at"],
    emptyTitle: "No settings table records found.",
    kpis: [
      ["Profile", () => 1],
      ["Society Profile", () => 1],
      ["Notifications", () => 1],
      ["Appearance", () => 1],
    ],
  },
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function titleize(value) {
  return String(value || "-").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function money(value) {
  return Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function compact(value) {
  return Number(value || 0).toLocaleString("en-IN", { notation: "compact", maximumFractionDigits: 1 });
}

function getStatus(row) {
  return String(row?.status || row?.payment_status || row?.approval_status || row?.attendance_status || "active").toLowerCase();
}

function countByStatus(rows, statuses) {
  const allowed = new Set(statuses.map((status) => status.toLowerCase()));
  return rows.filter((row) => allowed.has(getStatus(row))).length;
}

function countByText(rows, terms) {
  return rows.filter((row) => {
    const text = JSON.stringify(row || {}).toLowerCase();
    return terms.some((term) => text.includes(term.toLowerCase()));
  }).length;
}

function getRowTitle(row, fallback = "Record") {
  return row?.name || row?.resident_name || row?.visitor_name || row?.title || row?.email || row?.flat_number || row?.vehicle_number || fallback;
}

function downloadCsv(rows, filename) {
  const keys = Array.from(new Set(rows.flatMap((row) => Object.keys(row || {})))).slice(0, 14);
  const csv = [keys.join(","), ...rows.map((row) => keys.map((key) => JSON.stringify(row?.[key] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function normalizeChartRows(rows, valueKey = "count") {
  if (!Array.isArray(rows) || !rows.length) return [];
  return rows.slice(-8).map((row, index) => ({
    name: row.month || row.period || row.name || row.label || `P${index + 1}`,
    value: Number(row[valueKey] ?? row.value ?? row.total ?? row.count ?? row.amount ?? 0),
  }));
}

function clearChairmanBrowserSession() {
  clearAuthSession();
  const preserve = new Set(["chairmanTheme", "theme-mode", "language", "society_language_v1", "rememberedLoginEmail"]);
  const sensitive = /(token|auth|session|user|role|permission|society|selectedsociety|api|cache|dashboard|billing|notice|visitor|resident|flat|staff|security)/i;

  try {
    Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter(Boolean).forEach((key) => {
      if (!preserve.has(key) && sensitive.test(key)) localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn("Chairman local storage cleanup failed.", error);
  }

  try {
    sessionStorage.clear();
  } catch (error) {
    console.warn("Chairman session storage cleanup failed.", error);
  }

  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new CustomEvent("auth:logout", { detail: { role: "chairman" } }));
}

function makeApprovalRows(data) {
  const approvals = (data?.approvals || []).filter((row) => ["pending", "pending_approval", "verification_pending"].includes(getStatus(row)));
  const rows = approvals.map((row) => ({
    id: row.id || row.approval_id || row.user_id,
    type: titleize(row.approval_type || row.role || "Approval"),
    title: getRowTitle(row, "Approval"),
    status: getStatus(row),
    priority: row.priority || (String(row.role || "").toLowerCase() === "security" ? "High" : "Medium"),
    date: row.created_at || row.updated_at,
    row,
  }));
  const vehicle = (data?.alerts || []).find((row) => ["pending", "pending_approval"].includes(getStatus(row)));
  if (vehicle) {
    rows.push({
      id: vehicle.id || "vehicle-approval",
      type: "Vehicle Approval",
      title: getRowTitle(vehicle, "Vehicle Approval"),
      status: getStatus(vehicle),
      priority: vehicle.priority || "Medium",
      date: vehicle.created_at || vehicle.updated_at,
      row: vehicle,
    });
  }
  return rows.slice(0, 5);
}

function makeActivityRows(data) {
  const users = (data?.users || []).map((row) => ({ type: "Resident Registered", text: getRowTitle(row, "Resident"), date: row.created_at || row.updated_at, icon: Users }));
  const bills = (data?.bills || []).map((row) => ({ type: "Bill Generated", text: `${row.flat_number || row.bill_number || "Bill"} - Rs. ${money(row.amount || row.total_amount || 0)}`, date: row.created_at || row.updated_at, icon: Receipt }));
  const complaints = (data?.complaints || []).map((row) => ({ type: ["resolved", "closed"].includes(getStatus(row)) ? "Complaint Closed" : "Complaint Updated", text: getRowTitle(row, "Complaint"), date: row.updated_at || row.created_at, icon: AlertTriangle }));
  const notices = (data?.notices || []).map((row) => ({ type: "Notice Published", text: getRowTitle(row, "Notice"), date: row.created_at || row.updated_at, icon: Bell }));
  return [...users, ...bills, ...complaints, ...notices]
    .filter((row) => row.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);
}

function Sidebar({ collapsed, mobileOpen, activeKey, onNavigate, onToggle, onClose }) {
  return (
    <aside className={cx("cdx-sidebar", collapsed && "is-collapsed", mobileOpen && "is-open")}>
      <div className="cdx-brand">
        <button type="button" className="cdx-brand-mark" onClick={() => onNavigate("dashboard")} aria-label="Open dashboard">
          <img src={BRAND.icon} alt="" />
        </button>
        <div><strong>Nexora</strong><span>Smart Society Management</span></div>
        <button type="button" className="cdx-sidebar-collapse" onClick={onToggle} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}>
          <ChevronsLeft size={17} className={collapsed ? "is-rotated" : ""} />
        </button>
        <button type="button" className="cdx-sidebar-close" onClick={onClose} aria-label="Close navigation"><X size={18} /></button>
      </div>
      <nav className="cdx-nav" aria-label="Chairman dashboard">
        {navGroups.map((group) => (
          <section key={group.title}>
            {group.items.map((item) => {
              const active = activeKey === item.key;
              return (
                <button key={item.key} type="button" className={cx(active && "is-active")} onClick={() => onNavigate(item.key)}>
                  {createElement(item.icon, { size: 18 })}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </section>
        ))}
      </nav>
    </aside>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getEffectiveChairmanTheme(mode) {
  if (mode === "system") {
    return window.matchMedia?.("(prefers-color-scheme: light)")?.matches ? "light" : "dark";
  }
  return mode === "light" ? "light" : "dark";
}

function Topbar({ theme, setTheme, user, onMenu, onLogout }) {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const notificationRef = useRef(null);
  const calendarRef = useRef(null);
  const themeRef = useRef(null);
  const languageRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarCursor, setCalendarCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [themeOpen, setThemeOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "EN");
  const [now, setNow] = useState(new Date());
  const [notificationItems, setNotificationItems] = useState(() => [
    { id: "resident-registrations", category: "Resident registrations", title: "3 resident registrations waiting for review", time: "12 min ago", unread: true, icon: UserCheck },
    { id: "visitor-approvals", category: "Visitor approvals", title: "2 visitor entries need Chairman approval", time: "24 min ago", unread: true, icon: ShieldCheck },
    { id: "complaints", category: "Complaints", title: "High priority water leakage complaint escalated", time: "42 min ago", unread: true, icon: AlertTriangle },
    { id: "billing-alerts", category: "Billing alerts", title: "Collection follow-up required for overdue dues", time: "1 hr ago", unread: false, icon: Receipt },
    { id: "staff-alerts", category: "Staff alerts", title: "Security shift attendance exception reported", time: "2 hrs ago", unread: true, icon: BriefcaseBusiness },
    { id: "notices", category: "Notices", title: "Notice draft is ready for final publication", time: "Today", unread: false, icon: Bell },
  ]);

  useEffect(() => {
    if (!open && !notificationsOpen && !calendarOpen && !themeOpen && !languageOpen) return undefined;
    function close(event) {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
      if (!notificationRef.current?.contains(event.target)) setNotificationsOpen(false);
      if (!calendarRef.current?.contains(event.target)) setCalendarOpen(false);
      if (!themeRef.current?.contains(event.target)) setThemeOpen(false);
      if (!languageRef.current?.contains(event.target)) setLanguageOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open, notificationsOpen, calendarOpen, themeOpen, languageOpen]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  function go(path) {
    setOpen(false);
    navigate(path);
  }

  const name = user?.name || user?.userName || "Chairman";
  const initials = String(name || "C").slice(0, 1).toUpperCase();
  const societyName = user?.societyName || user?.society_name || localStorage.getItem("societyName") || "Current Society";
  const societyLocation = user?.societyLocation || user?.city || localStorage.getItem("societyLocation") || "Ahmedabad";
  const date = now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const day = now.toLocaleDateString("en-IN", { weekday: "long" });
  const time = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const unreadCount = notificationItems.filter((item) => item.unread).length;
  const cursorYear = calendarCursor.getFullYear();
  const cursorMonth = calendarCursor.getMonth();
  const daysInMonth = new Date(cursorYear, cursorMonth + 1, 0).getDate();
  const startOffset = new Date(cursorYear, cursorMonth, 1).getDay();
  const monthDays = [
    ...Array.from({ length: startOffset }, (_, index) => ({ key: `blank-${index}`, blank: true })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const value = index + 1;
      const dateValue = new Date(cursorYear, cursorMonth, value);
      return { key: dateValue.toISOString(), value, dateValue };
    }),
  ];
  const selectedKey = selectedDate.toDateString();
  const todayKey = now.toDateString();
  const makeMonthDate = (dayNumber) => new Date(cursorYear, cursorMonth, Math.min(dayNumber, daysInMonth));
  const calendarEvents = [
    { type: "Meeting", title: "Monthly society committee review", time: "10:00 AM", date: makeMonthDate(5), tone: "violet" },
    { type: "Maintenance", title: "Water pump inspection schedule", time: "02:00 PM", date: makeMonthDate(9), tone: "blue" },
    { type: "Notice", title: "Notice board publication deadline", time: "05:00 PM", date: makeMonthDate(14), tone: "amber" },
    { type: "Holiday", title: "Society office holiday", time: "All day", date: makeMonthDate(18), tone: "green" },
    { type: "Meeting", title: "Vendor and security review", time: "11:30 AM", date: makeMonthDate(22), tone: "violet" },
    { type: "Maintenance", title: "Lift preventive maintenance", time: "09:00 AM", date: makeMonthDate(26), tone: "blue" },
    { type: "Notice", title: "Billing reminder notice", time: "Today", date: makeMonthDate(now.getDate()), tone: "amber" },
  ];
  const selectedEvents = calendarEvents.filter((event) => event.date.toDateString() === selectedKey);
  const monthLabel = calendarCursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const selectedLabel = selectedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  function moveMonth(direction) {
    const next = new Date(cursorYear, cursorMonth + direction, 1);
    setCalendarCursor(next);
    setSelectedDate(next);
  }

  function toggleNotificationRead(id) {
    setNotificationItems((items) => items.map((item) => item.id === id ? { ...item, unread: !item.unread } : item));
  }

  return (
    <header className="cdx-topbar">
      <button type="button" className="cdx-icon-button cdx-mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
      <div className="cdx-topbar-title">
        <strong>{getGreeting()}, {name}</strong>
        <small><MapPin size={14} /> {societyName}, {societyLocation}</small>
      </div>
      <label className="cdx-command-search">
        <Search size={17} />
        <input placeholder="Search anything..." />
        <kbd>⌘ K</kbd>
      </label>
      <button type="button" className="cdx-date-card" onClick={() => setCalendarOpen((value) => !value)} aria-haspopup="dialog" aria-expanded={calendarOpen}>
        <CalendarClock size={18} />
        <div><strong>{date}</strong><span>{day}, {time}</span></div>
      </button>
      <div className="cdx-notification" ref={notificationRef}>
        <button type="button" className="cdx-icon-button" onClick={() => setNotificationsOpen((value) => !value)} aria-label="Open notifications">
          <Bell size={18} />
          {unreadCount ? <i>{unreadCount}</i> : null}
        </button>
        {notificationsOpen ? (
          <Motion.div className="cdx-popover cdx-notification-menu" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
            <div className="cdx-popover-head"><strong>Notifications</strong><span>{unreadCount} unread</span></div>
            {notificationItems.map((item) => (
              <button type="button" key={item.id} className={cx("cdx-notification-item", item.unread && "is-unread")} onClick={() => toggleNotificationRead(item.id)}>
                <span className="cdx-notification-icon">{createElement(item.icon, { size: 16 })}</span>
                <span><small>{item.category}</small><strong>{item.title}</strong><time>{item.time}</time></span>
                <em>{item.unread ? "Unread" : "Read"}</em>
              </button>
            ))}
            <button type="button" className="cdx-popover-action" onClick={() => setNotificationItems((items) => items.map((item) => ({ ...item, unread: false })))}>Mark all as read</button>
          </Motion.div>
        ) : null}
      </div>
      <div className="cdx-theme-menu" ref={themeRef}>
        <button type="button" className="cdx-icon-button" onClick={() => setThemeOpen((value) => !value)} aria-label="Theme mode">
          {theme === "light" ? <Sun size={18} /> : theme === "system" ? <Monitor size={18} /> : <Moon size={18} />}
        </button>
        {themeOpen ? (
          <Motion.div className="cdx-popover cdx-theme-popover" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
            {[
              ["light", Sun, "Light"],
              ["dark", Moon, "Dark"],
              ["system", Monitor, "System"],
            ].map(([mode, icon, label]) => (
              <button type="button" key={mode} className={theme === mode ? "is-active" : ""} onClick={() => { setTheme(mode); setThemeOpen(false); }}>
                {createElement(icon, { size: 16 })}<span>{label}</span>
              </button>
            ))}
          </Motion.div>
        ) : null}
      </div>
      <div className="cdx-calendar-menu" ref={calendarRef}>
        <span className="cdx-calendar-hidden-trigger" aria-hidden="true" />
        {calendarOpen ? (
          <Motion.section className="cdx-popover cdx-calendar-popover" role="dialog" aria-label="Society calendar" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
            <header>
              <button type="button" className="cdx-calendar-nav" onClick={() => moveMonth(-1)} aria-label="Previous month"><ChevronLeft size={16} /></button>
              <div><strong>{monthLabel}</strong><span>Society calendar</span></div>
              <button type="button" className="cdx-calendar-nav" onClick={() => moveMonth(1)} aria-label="Next month"><ChevronRight size={16} /></button>
            </header>
            <div className="cdx-calendar-weekdays">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => <span key={label}>{label}</span>)}
            </div>
            <div className="cdx-calendar-grid">
              {monthDays.map((entry) => {
                if (entry.blank) return <span key={entry.key} className="is-blank" />;
                const hasEvents = calendarEvents.some((event) => event.date.toDateString() === entry.dateValue.toDateString());
                return (
                  <button
                    type="button"
                    key={entry.key}
                    className={cx(entry.dateValue.toDateString() === todayKey && "is-today", entry.dateValue.toDateString() === selectedKey && "is-selected", hasEvents && "has-events")}
                    onClick={() => setSelectedDate(entry.dateValue)}
                  >
                    {entry.value}
                  </button>
                );
              })}
            </div>
            <div className="cdx-calendar-events">
              <div className="cdx-calendar-event-title">
                <strong>{selectedLabel}</strong>
                <span>{selectedEvents.length ? `${selectedEvents.length} scheduled` : "No scheduled items"}</span>
              </div>
              {(selectedEvents.length ? selectedEvents : [{ type: "Empty", title: "No society events for this date", time: "Available", tone: "muted" }]).map((event) => (
                <article key={`${event.type}-${event.title}`} className={`tone-${event.tone}`}>
                  <span>{event.type}</span><strong>{event.title}</strong><time>{event.time}</time>
                </article>
              ))}
            </div>
          </Motion.section>
        ) : null}
      </div>
      <div className="cdx-language" ref={languageRef}>
        <button type="button" className="cdx-language-button" onClick={() => setLanguageOpen((value) => !value)}><Languages size={17} /> {language}</button>
        {languageOpen ? (
          <Motion.div className="cdx-popover cdx-language-menu" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
            {["EN", "HI", "GU"].map((item) => <button type="button" key={item} className={language === item ? "is-active" : ""} onClick={() => { setLanguage(item); localStorage.setItem("language", item); setLanguageOpen(false); }}>{item}</button>)}
          </Motion.div>
        ) : null}
      </div>
      <div className="cdx-profile" ref={menuRef}>
        <button type="button" className="cdx-profile-button" onClick={() => setOpen((value) => !value)} aria-haspopup="menu" aria-expanded={open}>
          <span>{initials}</span>
          <div><strong>{name}</strong><small>Chairman</small></div>
          <ChevronDown size={16} />
        </button>
        {open ? (
          <Motion.div className="cdx-profile-menu" role="menu" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
            <div className="cdx-profile-card">
              <span>{initials}</span>
              <strong>{name}</strong>
              <small>{societyName} / Chairman</small>
            </div>
            <button type="button" role="menuitem" onClick={() => go("/admin/settings")}><UserCircle size={17} /> My Profile</button>
            <button type="button" role="menuitem" onClick={() => go("/admin/settings")}><Settings size={17} /> Account Settings</button>
            <button type="button" role="menuitem" onClick={() => setOpen(false)}><HelpCircle size={17} /> Help</button>
            <i />
            <button type="button" role="menuitem" className="is-danger" onClick={() => { setOpen(false); onLogout(); }}><LogOut size={17} /> Logout</button>
          </Motion.div>
        ) : null}
      </div>
    </header>
  );
}

function LogoutModal({ loading, onCancel, onConfirm }) {
  return (
    <div className="cdx-modal-backdrop" onMouseDown={onCancel} role="presentation">
      <Motion.section className="cdx-logout-modal" role="dialog" aria-modal="true" aria-labelledby="logout-title" aria-describedby="logout-copy" onMouseDown={(event) => event.stopPropagation()} initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
        <div className="cdx-logout-icon"><LogOut size={24} /></div>
        <h2 id="logout-title">Logout</h2>
        <p id="logout-copy">Are you sure you want to logout from your Chairman account?</p>
        <div className="cdx-modal-actions">
          <button type="button" className="cdx-button cdx-button--ghost" onClick={onCancel} disabled={loading}>Cancel</button>
          <button type="button" className="cdx-button cdx-button--danger" onClick={onConfirm} disabled={loading}><LogOut size={17} /> {loading ? "Logging out..." : "Logout"}</button>
        </div>
      </Motion.section>
    </div>
  );
}

function PageHeader({ item, rowsCount, onRefresh, onExport, children }) {
  const feature = featureConfig[item.key];
  const meta = feature || sectionMeta[item.key] || { title: item.label, summary: "Manage this workflow." };
  const breadcrumb = feature?.breadcrumb || `Chairman / ${item.label}`;
  return (
    <section className="cdx-page-header">
      <div>
        <div className="cdx-breadcrumb">{breadcrumb.split(" / ").map((part, index, parts) => index === parts.length - 1 ? <strong key={part}>{part}</strong> : <span key={part}>{part}</span>)}</div>
        <h1>{meta.title}</h1>
        <p>{meta.summary}</p>
      </div>
      <div className="cdx-header-actions">
        {children}
        <button type="button" className="cdx-button cdx-button--ghost" onClick={onRefresh}><RefreshCw size={16} /> Refresh</button>
        <button type="button" className="cdx-button cdx-button--primary" onClick={onExport} disabled={!rowsCount}><Download size={16} /> Export</button>
      </div>
    </section>
  );
}

function StateView({ state, message, onRetry, emptyTitle = "No records found" }) {
  if (state === "loading") {
    return (
      <div className="cdx-state">
        <RefreshCw className="is-spinning" size={26} />
        <strong>Loading real backend data</strong>
        <span>Syncing the latest society records.</span>
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="cdx-state is-error">
        <AlertTriangle size={28} />
        <strong>Unable to load this workflow</strong>
        <span>{message}</span>
        <button type="button" className="cdx-button cdx-button--ghost" onClick={onRetry}>Retry</button>
      </div>
    );
  }
  return (
    <div className="cdx-state">
      <FileText size={28} />
      <strong>{emptyTitle}</strong>
      <span>This module has no records for the current society and filters.</span>
    </div>
  );
}

function KpiCard({ label, value, detail, trend, icon, tone = "blue" }) {
  return (
    <Motion.article className={cx("cdx-kpi", `tone-${tone}`)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="cdx-kpi-icon">{createElement(icon, { size: 20 })}</div>
      <strong>{value}</strong>
      <p>{label}</p>
      <span>{detail}</span>
      {trend ? <em>{trend}</em> : null}
    </Motion.article>
  );
}

function ChartCard({ title, data, type = "area", valuePrefix = "" }) {
  return (
    <section className="cdx-card cdx-chart-card">
      <div className="cdx-card-head"><h2>{title}</h2></div>
      {data.length ? (
        <ResponsiveContainer width="100%" height={240}>
          {type === "pie" ? (
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={58} outerRadius={86} paddingAngle={3}>
                {data.map((entry, index) => <Cell key={`${entry.name}-${index}`} fill={chartPalette[index % chartPalette.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => `${valuePrefix}${money(value)}`} />
            </PieChart>
          ) : type === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid stroke="var(--cdx-grid)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "var(--cdx-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--cdx-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => `${valuePrefix}${money(value)}`} contentStyle={{ background: "var(--cdx-card)", border: "1px solid var(--cdx-border)", borderRadius: 12 }} />
              <Bar dataKey="value" fill="#2563eb" radius={[10, 10, 0, 0]} />
            </BarChart>
          ) : (
            <AreaChart data={data}>
              <defs><linearGradient id={`cdx-${title.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke="var(--cdx-grid)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "var(--cdx-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--cdx-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => `${valuePrefix}${money(value)}`} contentStyle={{ background: "var(--cdx-card)", border: "1px solid var(--cdx-border)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} fill={`url(#cdx-${title.replace(/\W/g, "")})`} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      ) : <StateView state="empty" />}
    </section>
  );
}

function DashboardHome() {
  const navigate = useNavigate();
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    try {
      setState("loading");
      setError("");
      setData(await fetchChairmanHome());
      setState("ready");
    } catch (err) {
      setError(getApiMessage(err, "Failed to load Chairman dashboard."));
      setState("error");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const metrics = useMemo(() => {
    const users = data?.users || [];
    const flats = data?.flats || [];
    const bills = data?.bills || [];
    const complaints = data?.complaints || [];
    const occupied = flats.filter((row) => ["occupied", "assigned"].includes(getStatus(row)) || row.owner_id || row.resident_id).length;
    const paidBills = bills.filter((row) => ["paid", "captured", "success", "completed"].includes(getStatus(row)));
    const dueBills = bills.filter((row) => ["unpaid", "overdue", "pending", "partial"].includes(getStatus(row)));
    const monthlyCollection = paidBills.reduce((sum, row) => sum + Number(row.amount || row.total_amount || row.paid_amount || 0), 0);
    const pendingDues = dueBills.reduce((sum, row) => sum + Number(row.amount || row.total_amount || row.balance_amount || 0), 0);
    const pendingApprovals = users.filter((row) => ["pending", "pending_approval", "verification_pending"].includes(getStatus(row))).length;
    const activeComplaints = complaints.filter((row) => !["resolved", "closed"].includes(getStatus(row))).length;
    const visitorsToday = Number(data?.visitorDashboard?.today || data?.visitorDashboard?.visitorsToday || data?.visitorDashboard?.total_today || 0);
    const emergencyAlerts = (data?.alerts || []).filter((row) => !["resolved", "closed"].includes(getStatus(row))).length;
    const collectionRate = monthlyCollection + pendingDues > 0 ? Math.round((monthlyCollection / (monthlyCollection + pendingDues)) * 100) : 0;
    return {
      totalResidents: users.length,
      occupied,
      vacant: Math.max(flats.length - occupied, 0),
      pendingApprovals,
      monthlyCollection,
      pendingDues,
      collectionRate,
      activeComplaints,
      visitorsToday,
      emergencyAlerts,
      staffPresent: Number(data?.staffAttendance?.present || data?.staffAttendance?.present_count || 0),
      activeStaff: Number(data?.staffAttendance?.present || data?.staffAttendance?.present_count || data?.staffAttendance?.activeStaff || 0),
      bills,
      complaints,
      users,
      flats,
    };
  }, [data]);

  const charts = useMemo(() => {
    const monthly = data?.analytics?.overview?.charts?.monthlyTrend || data?.analytics?.analytics?.financial?.monthly || [];
    const complaintStatus = data?.analytics?.overview?.charts?.complaintStatus || metrics.complaints;
    const visitorTrend = data?.visitorAnalytics?.trend || data?.visitorAnalytics?.daily || [];
    const paid = metrics.bills.filter((row) => ["paid", "captured", "success", "completed"].includes(getStatus(row))).reduce((sum, row) => sum + Number(row.amount || row.total_amount || row.paid_amount || 0), 0);
    const due = metrics.bills.filter((row) => ["unpaid", "overdue", "pending", "partial"].includes(getStatus(row))).reduce((sum, row) => sum + Number(row.amount || row.total_amount || row.balance_amount || 0), 0);
    return {
      revenue: normalizeChartRows(monthly, "revenue"),
      collections: [{ name: "Collected", value: paid }, { name: "Due", value: due }].filter((row) => row.value > 0),
      complaints: normalizeChartRows(complaintStatus),
      visitors: normalizeChartRows(visitorTrend),
      occupancy: [{ name: "Occupied", value: metrics.occupied }, { name: "Vacant", value: metrics.vacant }].filter((row) => row.value > 0),
      staff: [
        { name: "Present", value: metrics.staffPresent },
        { name: "Active", value: metrics.activeStaff },
      ].filter((row) => row.value > 0),
      expense: normalizeChartRows(data?.analytics?.analytics?.expenses || data?.analytics?.overview?.charts?.expenses || [], "amount"),
    };
  }, [data, metrics]);

  const approvalRows = useMemo(() => makeApprovalRows(data), [data]);
  const activityRows = useMemo(() => makeActivityRows(data), [data]);

  const insights = useMemo(() => {
    const collectionRate = metrics.monthlyCollection + metrics.pendingDues > 0
      ? Math.round((metrics.monthlyCollection / (metrics.monthlyCollection + metrics.pendingDues)) * 100)
      : 0;
    return [
      { title: "Revenue insight", text: collectionRate ? `Collection efficiency is ${collectionRate}% based on paid and due bill records.` : "Revenue data will appear after bills are generated.", icon: WalletCards },
      { title: "Complaint insight", text: metrics.activeComplaints ? `${metrics.activeComplaints} complaints are still active and should be prioritized by SLA risk.` : "No active complaint pressure is visible from the backend.", icon: AlertTriangle },
      { title: "Collection prediction", text: metrics.pendingDues ? `Pending dues of Rs. ${money(metrics.pendingDues)} need focused follow-up.` : "No pending dues are visible in current billing data.", icon: BarChart3 },
      { title: "Risk alert", text: metrics.pendingApprovals ? `${metrics.pendingApprovals} approval requests can slow onboarding if left unresolved.` : "Approval queue is clear for the current society.", icon: ShieldCheck },
      { title: "Suggested action", text: metrics.vacant ? "Review vacant flats and owner mapping before the next billing cycle." : "Flat occupancy looks complete from current records.", icon: Sparkles },
    ];
  }, [metrics]);

  if (state !== "ready") {
    return <main className="cdx-content"><StateView state={state} message={error} onRetry={load} /></main>;
  }

  return (
    <main className="cdx-content">
      <section className="cdx-kpi-grid">
        <KpiCard label="Total Residents" value={compact(metrics.totalResidents)} detail="Approved residents" trend="+ live sync" icon={Users} />
        <KpiCard label="Occupied Flats" value={compact(metrics.occupied)} detail="Mapped units" trend={`${metrics.vacant} vacant`} icon={Home} tone="green" />
        <KpiCard label="Vacant Flats" value={compact(metrics.vacant)} detail="Available units" trend="Review mapping" icon={Building2} tone="amber" />
        <KpiCard label="Today Visitors" value={compact(metrics.visitorsToday)} detail="Security entries" trend="Live gate feed" icon={ShieldCheck} tone="violet" />
        <KpiCard label="Pending Approvals" value={compact(metrics.pendingApprovals)} detail="Needs action" trend="Approval queue" icon={ClipboardCheck} tone="rose" />
        <KpiCard label="Collection Rate" value={`${metrics.collectionRate}%`} detail="Paid vs dues" trend={`Rs. ${compact(metrics.pendingDues)} due`} icon={Gauge} tone="green" />
        <KpiCard label="Open Complaints" value={compact(metrics.activeComplaints)} detail="SLA workload" trend="Track resolution" icon={AlertTriangle} tone="amber" />
        <KpiCard label="Emergency Alerts" value={compact(metrics.emergencyAlerts)} detail="Active incidents" trend="Safety watch" icon={Activity} tone="rose" />
      </section>

      <section className="cdx-home-grid">
        <section className="cdx-card cdx-ai-card cdx-card--wide">
          <div className="cdx-card-head"><h2><Sparkles size={18} /> AI Executive Summary</h2><button type="button" className="cdx-mini-action">View insights</button></div>
          <div className="cdx-ai-list">
            {insights.map((item) => {
              return <article key={item.title}>{createElement(item.icon, { size: 18 })}<div><strong>{item.title}</strong><p>{item.text}</p></div></article>;
            })}
          </div>
        </section>

        <ChartCard title="Financial Overview" data={charts.revenue.length ? charts.revenue : charts.collections} valuePrefix="Rs. " />

        <section className="cdx-card cdx-approval-card">
          <div className="cdx-card-head"><h2><ClipboardCheck size={18} /> Pending Approvals</h2><button type="button" className="cdx-mini-action" onClick={() => navigate("/admin/resident-approvals")}>View all</button></div>
          {approvalRows.length ? (
            <div className="cdx-approval-list">
              {approvalRows.map((row) => (
                <article key={row.id}>
                  <div><strong>{row.type}</strong><span>{row.title}</span></div>
                  <span className={`cdx-status status-${row.status}`}>{titleize(row.status)}</span>
                  <time>{dateLabel(row.date)}</time>
                  <div className="cdx-approval-actions">
                    <button type="button">View</button>
                    <button type="button">Approve</button>
                    <button type="button" className="is-danger">Reject</button>
                  </div>
                </article>
              ))}
            </div>
          ) : <StateView state="empty" />}
        </section>

        <ChartCard title="Complaint Overview" data={charts.complaints} type="pie" />
        <ChartCard title="Resolution Trend" data={charts.complaints} type="bar" />

        <section className="cdx-card cdx-security-card">
          <div className="cdx-card-head"><h2><ShieldCheck size={18} /> Visitor & Security Overview</h2></div>
          <div className="cdx-security-grid">
            <article><Car size={18} /><span>Today Visitors</span><strong>{compact(metrics.visitorsToday)}</strong></article>
            <article><BriefcaseBusiness size={18} /><span>Staff Present</span><strong>{compact(metrics.staffPresent)}</strong></article>
            <article><ParkingCircle size={18} /><span>Occupied Flats</span><strong>{compact(metrics.occupied)}</strong></article>
            <article><AlertTriangle size={18} /><span>Emergency</span><strong>{compact(metrics.emergencyAlerts)}</strong></article>
          </div>
        </section>

        <section className="cdx-card cdx-activity-card">
          <div className="cdx-card-head"><h2><Activity size={18} /> Recent Activities</h2></div>
          {activityRows.length ? (
            <div className="cdx-activity-list">
              {activityRows.map((row, index) => {
                return (
                  <article key={`${row.type}-${index}`}>
                    <span>{createElement(row.icon, { size: 16 })}</span>
                    <div><strong>{row.type}</strong><p>{row.text}</p></div>
                    <time>{dateLabel(row.date)}</time>
                  </article>
                );
              })}
            </div>
          ) : <StateView state="empty" />}
        </section>

        <section className="cdx-card cdx-quick-card">
          <div className="cdx-card-head"><h2><Plus size={18} /> Quick Actions</h2></div>
          <div className="cdx-quick-actions">
            {[
              ["Generate Bill", Plus, "generate-bills"],
              ["Approve Residents", UserCheck, "resident-approvals"],
              ["Create Notice", Bell, "notice-board"],
              ["Register Staff", BriefcaseBusiness, "staff-register"],
              ["Security Logs", ShieldCheck, "visitor-logs"],
              ["Analytics", BarChart3, "analytics"],
            ].map(([label, icon, key]) => (
              <button type="button" key={label} onClick={() => navigate(`/admin/${key}`)}>
                {createElement(icon, { size: 18 })}<span>{label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="cdx-card cdx-events-card">
          <div className="cdx-card-head"><h2><CalendarClock size={18} /> Upcoming Events</h2></div>
          <div className="cdx-mini-list">
            {(data?.notices || []).slice(0, 3).map((notice) => (
              <article key={notice.id || notice.title}><span>{dateLabel(notice.created_at || notice.date)}</span><strong>{getRowTitle(notice, "Society update")}</strong></article>
            ))}
            {!(data?.notices || []).length ? <StateView state="empty" /> : null}
          </div>
        </section>

        <section className="cdx-card cdx-notice-card">
          <div className="cdx-card-head"><h2><Bell size={18} /> Notice Board</h2><button type="button" className="cdx-mini-action" onClick={() => navigate("/admin/notice-board")}>Open</button></div>
          <div className="cdx-mini-list">
            {(data?.notices || []).slice(0, 4).map((notice) => (
              <article key={notice.id || notice.title}><span>{titleize(notice.category || notice.status || "Notice")}</span><strong>{getRowTitle(notice, "Notice")}</strong></article>
            ))}
            {!(data?.notices || []).length ? <StateView state="empty" /> : null}
          </div>
        </section>

        <section className="cdx-card cdx-emergency-card">
          <div className="cdx-card-head"><h2><AlertTriangle size={18} /> Emergency Panel</h2><span>{metrics.emergencyAlerts} active</span></div>
          <p>{metrics.emergencyAlerts ? "Active emergency alerts require immediate society-level monitoring." : "No active emergency alerts are visible for the assigned society."}</p>
          <button type="button" className="cdx-button cdx-button--danger" onClick={() => navigate("/admin/emergency")}><AlertTriangle size={16} /> Open Emergency</button>
        </section>
      </section>
    </main>
  );
}

function ModuleToolbar({ query, setQuery, status, setStatus, statuses, view, setView, selectedCount, onBulk, onImport, feature, featureFilter, setFeatureFilter }) {
  const importRef = useRef(null);

  return (
    <section className="cdx-toolbar">
      <label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search records..." /></label>
      <label><Filter size={16} /><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{titleize(item)}</option>)}</select></label>
      {feature?.filters?.length ? (
        <label><Filter size={16} /><select value={featureFilter} onChange={(event) => setFeatureFilter(event.target.value)}>{feature.filters.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      ) : null}
      <div className="cdx-segmented">
        <button type="button" className={view === "table" ? "is-active" : ""} onClick={() => setView("table")}>Table</button>
        <button type="button" className={view === "cards" ? "is-active" : ""} onClick={() => setView("cards")}>Cards</button>
      </div>
      <input
        ref={importRef}
        type="file"
        className="sr-only"
        accept=".csv,.xlsx,.xls,.json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onImport(file);
          event.target.value = "";
        }}
      />
      <button type="button" className="cdx-button cdx-button--ghost" onClick={() => importRef.current?.click()}><Import size={16} /> Import</button>
      <button type="button" className="cdx-button cdx-button--ghost" onClick={onBulk} disabled={!selectedCount}><ClipboardCheck size={16} /> Bulk Actions {selectedCount ? `(${selectedCount})` : ""}</button>
    </section>
  );
}

function RecordsTable({ rows, selected, setSelected, actions, onAction, feature }) {
  const columns = useMemo(() => {
    const preferred = ["name", "email", "mobile", "phone", "flat_number", "wing", "category", "status", "payment_status", "approval_status", "amount", "total_amount", "created_at"];
    const configured = (feature?.columns || []).filter((key) => rows.some((row) => row?.[key] !== undefined && row?.[key] !== null));
    const available = configured.length ? configured : preferred.filter((key) => rows.some((row) => row?.[key] !== undefined && row?.[key] !== null));
    return (available.length ? available : ["name", "status", "created_at"]).slice(0, 9);
  }, [rows, feature]);

  function toggle(id) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <div className="cdx-table-wrap">
      <table className="cdx-table">
        <thead>
          <tr>
            <th><span className="sr-only">Select</span></th>
            {columns.map((column) => <th key={column}>{titleize(column)}</th>)}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const id = row.id || row.user_id || `${getRowTitle(row)}-${index}`;
            return (
              <tr key={id}>
                <td><input type="checkbox" checked={selected.includes(id)} onChange={() => toggle(id)} aria-label={`Select ${getRowTitle(row)}`} /></td>
                {columns.map((column) => (
                  <td key={column}>
                    {column.includes("status")
                      ? <span className={`cdx-status status-${getStatus(row)}`}>{titleize(row[column] || getStatus(row))}</span>
                      : column.includes("date") || column.includes("created") || column.includes("scheduled")
                        ? dateLabel(row[column])
                        : String(row[column] ?? "-")}
                  </td>
                ))}
                <td>
                  <div className="cdx-row-actions">
                    {actions.map((action) => <button key={action.action} type="button" className={cx(action.danger && "is-danger", action.approve && "is-approve")} onClick={() => onAction(action, row)}>{action.label}</button>)}
                    {!actions.length ? <button type="button"><MoreHorizontal size={16} /> View</button> : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RecordsCards({ rows, selected, setSelected, actions, onAction }) {
  return (
    <section className="cdx-card-grid">
      {rows.map((row, index) => {
        const id = row.id || row.user_id || `${getRowTitle(row)}-${index}`;
        const active = selected.includes(id);
        return (
          <article key={id} className={cx("cdx-record-card", active && "is-selected")}>
            <div>
              <input type="checkbox" checked={active} onChange={() => setSelected((current) => active ? current.filter((item) => item !== id) : [...current, id])} aria-label={`Select ${getRowTitle(row)}`} />
              <span className={`cdx-status status-${getStatus(row)}`}>{titleize(getStatus(row))}</span>
            </div>
            <strong>{getRowTitle(row)}</strong>
            <p>{row.email || row.mobile || row.phone || row.description || row.message || row.flat_number || "Backend record"}</p>
            <dl>
              <div><dt>ID</dt><dd>{row.id || row.user_id || "-"}</dd></div>
              <div><dt>Date</dt><dd>{dateLabel(row.created_at || row.updated_at || row.date)}</dd></div>
            </dl>
            <footer>
              {actions.map((action) => <button key={action.action} type="button" className={cx(action.danger && "is-danger", action.approve && "is-approve")} onClick={() => onAction(action, row)}>{action.label}</button>)}
              {!actions.length ? <button type="button">View Details</button> : null}
            </footer>
          </article>
        );
      })}
    </section>
  );
}

function BillingGenerator({ rows }) {
  const societies = Array.from(new Set(rows.map((row) => row.society_name || row.societyName || localStorage.getItem("societyName")).filter(Boolean)));
  const wings = Array.from(new Set(rows.map((row) => row.wing || row.wing_name).filter(Boolean)));
  const floors = Array.from(new Set(rows.map((row) => row.floor || row.floor_number).filter(Boolean)));
  const flats = Array.from(new Set(rows.map((row) => row.flat_number || row.flat_no).filter(Boolean))).slice(0, 80);
  const [form, setForm] = useState({ society: societies[0] || "", wing: "", floor: "", flat: "", residentType: "owner", cycle: "monthly" });
  const [state, setState] = useState({ loading: false, message: "" });

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function generate() {
    try {
      setState({ loading: true, message: "" });
      const response = await createAutoInvoices({
        society: form.society || undefined,
        wing: form.wing || undefined,
        floor: form.floor || undefined,
        flatNumber: form.flat || undefined,
        residentType: form.residentType,
        billingCycle: form.cycle,
      });
      setState({ loading: false, message: response?.message || "Bills generated successfully." });
    } catch (error) {
      setState({ loading: false, message: getApiMessage(error, "Bill generation failed.") });
    }
  }

  return (
    <section className="cdx-card cdx-bill-generator">
      <div className="cdx-card-head"><h2><Sparkles size={18} /> AI Bill Generator</h2><span>Billing workflow</span></div>
      <div className="cdx-generator-grid">
        <label>Society<select value={form.society} onChange={(event) => update("society", event.target.value)}><option value="">Current society</option>{societies.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Wing<select value={form.wing} onChange={(event) => update("wing", event.target.value)}><option value="">All wings</option>{wings.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Floor<select value={form.floor} onChange={(event) => update("floor", event.target.value)}><option value="">All floors</option>{floors.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Flat<select value={form.flat} onChange={(event) => update("flat", event.target.value)}><option value="">All flats</option>{flats.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Resident Type<select value={form.residentType} onChange={(event) => update("residentType", event.target.value)}><option value="owner">Owner</option><option value="tenant">Tenant</option></select></label>
        <label>Cycle<select value={form.cycle} onChange={(event) => update("cycle", event.target.value)}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option><option value="custom">Custom</option></select></label>
      </div>
      <div className="cdx-generator-actions">
        <button type="button" className="cdx-button cdx-button--primary" onClick={generate} disabled={state.loading}><Receipt size={16} /> {state.loading ? "Generating..." : "Generate"}</button>
        <button type="button" className="cdx-button cdx-button--ghost" onClick={() => window.print()}><Download size={16} /> Download Bill PDF</button>
        <button type="button" className="cdx-button cdx-button--ghost" onClick={() => window.print()}><Download size={16} /> Download Receipt PDF</button>
      </div>
      {state.message ? <p className="cdx-generator-message">{state.message}</p> : null}
    </section>
  );
}

function getDepartment(row) {
  return row.department || row.department_name || row.role || row.designation || "Operations";
}

function groupCount(rows, getter) {
  const map = new Map();
  rows.forEach((row) => {
    const key = getter(row) || "Other";
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map, ([name, value]) => ({ name, value })).slice(0, 8);
}

function HrMiniTable({ rows, columns, emptyTitle = "No records yet", emptyAction }) {
  if (!rows.length) {
    return (
      <div className="cdx-hr-empty">
        <FileText size={26} />
        <strong>{emptyTitle}</strong>
        <span>Records will appear here after the society syncs this workflow.</span>
        {emptyAction ? <button type="button" className="cdx-button cdx-button--primary">{emptyAction}</button> : null}
      </div>
    );
  }

  return (
    <div className="cdx-hr-table-wrap">
      <table className="cdx-hr-table">
        <thead>
          <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row.user_id || row.email || index}>
              {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] || "-"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HrPanel({ title, icon, action, children, className }) {
  return (
    <section className={cx("cdx-card cdx-hr-panel", className)}>
      <div className="cdx-card-head">
        <h2>{createElement(icon, { size: 18 })} {title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function FeatureKpiStrip({ feature, rows }) {
  if (!feature?.kpis?.length) return null;
  return (
    <section className="cdx-feature-kpis">
      {feature.kpis.map(([label, getter]) => (
        <article key={label}>
          <span>{label}</span>
          <strong>{compact(getter(rows))}</strong>
        </article>
      ))}
    </section>
  );
}

function FeatureWorkflowPanel({ item, feature, rows, onAction }) {
  if (!feature) return null;

  const chips = {
    "resident-directory": ["Resident list", "Owner/Tenant filters", "Pending registrations", "KYC status", "Add/View/Edit actions"],
    flats: ["Flats table", "Occupancy status", "Wing/Floor filters", "Add Flat", "Assign Owner/Tenant"],
    "pending-chairman-tasks": ["Pending approvals table", "View", "Approve", "Reject", "Approval type filters"],
    "notice-board": ["Notice list", "Create notice", "Draft", "Scheduled", "Published"],
    documents: ["Society documents", "Upload/download", "Category filters", "Expiry reminders"],
    analytics: ["KPI summary", "Charts", "Export PDF", "Export Excel", "Date filters"],
    settings: ["Profile", "Society Profile", "Notifications", "Appearance"],
  }[item.key] || feature.filters || [];

  return (
    <section className={cx("cdx-card cdx-feature-panel", item.key === "analytics" && "cdx-feature-panel--analytics")}>
      <div className="cdx-card-head">
        <h2>{feature.title}</h2>
        <button type="button" className="cdx-mini-action" onClick={() => onAction(`${feature.title} action opened.`)}>{feature.primaryAction || "Open"}</button>
      </div>
      <div className="cdx-feature-chips">
        {chips.map((chip) => <span key={chip}>{chip}</span>)}
      </div>
      {item.key === "analytics" ? (
        <div className="cdx-feature-chart-grid">
          <ChartCard title="Status Overview" data={groupCount(rows, (row) => titleize(getStatus(row)))} type="bar" />
          <ChartCard title="Category Mix" data={groupCount(rows, (row) => row.category || row.type || row.metric || "KPI")} type="pie" />
        </div>
      ) : null}
      {item.key === "settings" ? (
        <div className="cdx-settings-grid">
          {["Profile", "Society Profile", "Notifications", "Appearance"].map((title) => (
            <article key={title}>
              <strong>{title}</strong>
              <p>{title === "Appearance" ? "Theme and display controls for this workspace." : `${title} controls for society operations.`}</p>
              <button type="button" className="cdx-button cdx-button--ghost" onClick={() => onAction(`${title} settings opened.`)}>Configure</button>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function matchesFeatureFilter(row, filter) {
  if (!filter || /^all/i.test(filter) || /filter$/i.test(filter)) return true;
  const text = JSON.stringify(row || {}).toLowerCase();
  const normalized = filter.toLowerCase();
  if (normalized.includes("owner")) return text.includes("owner");
  if (normalized.includes("tenant")) return text.includes("tenant");
  if (normalized.includes("pending registrations")) return ["pending", "pending_approval", "verification_pending"].includes(getStatus(row));
  if (normalized.includes("kyc")) return text.includes("kyc") && /pending|unverified|missing/i.test(text);
  if (normalized.includes("occupied")) return /occupied|assigned|active/i.test(text);
  if (normalized.includes("vacant")) return /vacant|available/i.test(text);
  if (normalized.includes("expiring")) return Boolean(row.expiry_date || row.expires_at);
  return text.includes(normalized.replace(/s$/, ""));
}

function StaffSecurityModule({ item }) {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      setState("loading");
      setError("");
      const [sectionRows, sectionStats] = await Promise.all([
        fetchChairmanSection(item.key),
        fetchChairmanStats(item.key),
      ]);
      setRows(sectionRows);
      setStats(sectionStats || {});
      setState("ready");
    } catch (err) {
      setError(getApiMessage(err, "Failed to load Staff & Security."));
      setState("error");
    }
  }, [item.key]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filteredRows = useMemo(() => rows.filter((row) => {
    const matchesQuery = !query || JSON.stringify(row || {}).toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "all" || getStatus(row) === status;
    return matchesQuery && matchesStatus;
  }), [rows, query, status]);

  const hrMetrics = useMemo(() => {
    const present = rows.filter((row) => ["present", "checked_in", "active"].includes(getStatus(row))).length || Number(stats.present || stats.present_count || 0);
    const absent = rows.filter((row) => ["absent"].includes(getStatus(row))).length || Number(stats.absent || 0);
    const late = rows.filter((row) => ["late"].includes(getStatus(row))).length || Number(stats.late || 0);
    const leave = rows.filter((row) => ["leave", "on_leave", "paid_leave"].includes(getStatus(row))).length || Number(stats.leave || 0);
    const pendingLeave = rows.filter((row) => ["pending", "pending_leave"].includes(getStatus(row)) && /leave/i.test(JSON.stringify(row))).length;
    const openTasks = rows.filter((row) => ["assigned", "in_progress", "pending"].includes(getStatus(row)) && /task|work|duty/i.test(JSON.stringify(row))).length;
    return {
      total: rows.length,
      present,
      absent,
      late,
      leave,
      departments: groupCount(rows, getDepartment).length,
      pendingLeave,
      openTasks,
    };
  }, [rows, stats]);

  const attendanceTrend = useMemo(() => {
    const base = groupCount(rows, (row) => titleize(getStatus(row)));
    return base.length ? base : [
      { name: "Present", value: hrMetrics.present },
      { name: "Absent", value: hrMetrics.absent },
      { name: "Late", value: hrMetrics.late },
      { name: "Leave", value: hrMetrics.leave },
    ].filter((row) => row.value > 0);
  }, [rows, hrMetrics]);

  const departmentRows = useMemo(() => groupCount(rows, getDepartment), [rows]);
  const todayRows = filteredRows.slice(0, 8);
  const leaveRows = filteredRows.filter((row) => /leave/i.test(JSON.stringify(row))).slice(0, 6);
  const taskRows = filteredRows.filter((row) => /task|work|duty/i.test(JSON.stringify(row))).slice(0, 6);
  const auditRows = filteredRows.filter((row) => row.updated_at || row.created_at).slice(0, 6);

  if (state !== "ready") {
    return <main className="cdx-content"><PageHeader item={item} rowsCount={rows.length} onRefresh={load} onExport={() => downloadCsv(rows, "staff-security.csv")} /><StateView state={state} message={error} onRetry={load} emptyTitle="No staff or security records found." /></main>;
  }

  return (
    <main className="cdx-content">
      <PageHeader item={item} rowsCount={filteredRows.length} onRefresh={load} onExport={() => downloadCsv(filteredRows, "staff-security.csv")}>
        <button type="button" className="cdx-button cdx-button--ghost" onClick={() => window.print()}><Download size={16} /> Export PDF</button>
        <button type="button" className="cdx-button cdx-button--ghost" onClick={() => downloadCsv(filteredRows, "staff-security.xls")}><Download size={16} /> Export Excel</button>
      </PageHeader>

      <section className="cdx-hr-kpis">
        <KpiCard label="Total Staff" value={compact(hrMetrics.total)} detail="HR records" trend="Society scoped" icon={BriefcaseBusiness} />
        <KpiCard label="Present" value={compact(hrMetrics.present)} detail="Today" trend="Live attendance" icon={CheckCircle2} tone="green" />
        <KpiCard label="Absent" value={compact(hrMetrics.absent)} detail="Today" trend="Needs review" icon={AlertTriangle} tone="rose" />
        <KpiCard label="Late" value={compact(hrMetrics.late)} detail="Late arrivals" trend="Policy tracked" icon={CalendarClock} tone="amber" />
        <KpiCard label="On Leave" value={compact(hrMetrics.leave)} detail="Approved leave" trend="Calendar linked" icon={FileText} tone="violet" />
        <KpiCard label="Departments" value={compact(hrMetrics.departments)} detail="Teams" trend="Assignable" icon={Folder} />
        <KpiCard label="Pending Leave" value={compact(hrMetrics.pendingLeave)} detail="Approval queue" trend="Approve/reject" icon={ClipboardCheck} tone="amber" />
        <KpiCard label="Open Tasks" value={compact(hrMetrics.openTasks)} detail="Task workload" trend="Track progress" icon={Activity} tone="green" />
      </section>

      <section className="cdx-hr-toolbar">
        <label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search staff, department, attendance..." /></label>
        <label><Filter size={16} /><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{Array.from(new Set(rows.map(getStatus))).filter(Boolean).map((item) => <option key={item} value={item}>{titleize(item)}</option>)}</select></label>
        <button type="button" className="cdx-button cdx-button--primary" onClick={() => setNotice("Assign task workflow opened.")}><Plus size={16} /> Assign Task</button>
        <button type="button" className="cdx-button cdx-button--ghost" onClick={() => setNotice("Column selector ready for HR records.")}><FileBarChart size={16} /> Columns</button>
      </section>
      {notice ? <div className="cdx-toast" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice("")}>Dismiss</button></div> : null}

      <section className="cdx-hr-grid">
        <HrPanel title="Attendance Trend" icon={BarChart3} className="cdx-hr-panel--wide">
          <ChartCard title="Daily / Weekly / Monthly Attendance" data={attendanceTrend} type="bar" />
        </HrPanel>
        <HrPanel title="Staff Distribution" icon={Users}>
          <ChartCard title="Departments" data={departmentRows} type="pie" />
        </HrPanel>
        <HrPanel title="Attendance Calendar" icon={CalendarDays}>
          <div className="cdx-hr-calendar">
            {Array.from({ length: 30 }, (_, index) => <span key={index} className={index % 7 === 0 ? "is-holiday" : index % 5 === 0 ? "is-late" : "is-present"}>{index + 1}</span>)}
          </div>
        </HrPanel>
        <HrPanel title="Today's Attendance" icon={CheckCircle2} className="cdx-hr-panel--wide">
          <HrMiniTable
            rows={todayRows}
            emptyTitle="No attendance records found"
            columns={[
              { key: "name", label: "Staff", render: (row) => getRowTitle(row, "Staff") },
              { key: "department", label: "Department", render: (row) => getDepartment(row) },
              { key: "status", label: "Status", render: (row) => <span className={`cdx-status status-${getStatus(row)}`}>{titleize(getStatus(row))}</span> },
              { key: "created_at", label: "Time", render: (row) => dateLabel(row.created_at || row.updated_at) },
            ]}
          />
        </HrPanel>
        <HrPanel title="Leave Management" icon={ClipboardCheck}>
          <HrMiniTable
            rows={leaveRows}
            emptyTitle="No pending leave requests"
            emptyAction="Create leave policy"
            columns={[
              { key: "name", label: "Staff", render: (row) => getRowTitle(row, "Staff") },
              { key: "status", label: "Status", render: (row) => <span className={`cdx-status status-${getStatus(row)}`}>{titleize(getStatus(row))}</span> },
              { key: "actions", label: "Actions", render: () => <div className="cdx-hr-actions"><button type="button" className="is-approve">Approve</button><button type="button" className="is-reject">Reject</button></div> },
            ]}
          />
        </HrPanel>
        <HrPanel title="Overtime & Shifts" icon={CalendarClock}>
          <div className="cdx-hr-stack">
            {["Morning Shift", "Evening Shift", "Night Shift", "Rotational", "Weekly Off", "Overtime Approval"].map((label) => <button type="button" key={label}>{label}</button>)}
          </div>
        </HrPanel>
        <HrPanel title="Task Management" icon={Activity} className="cdx-hr-panel--wide">
          <HrMiniTable
            rows={taskRows}
            emptyTitle="No open staff tasks"
            emptyAction="Assign task"
            columns={[
              { key: "name", label: "Task / Staff", render: (row) => getRowTitle(row, "Task") },
              { key: "department", label: "Department", render: (row) => getDepartment(row) },
              { key: "status", label: "Progress", render: (row) => <span className={`cdx-status status-${getStatus(row)}`}>{titleize(getStatus(row))}</span> },
              { key: "created_at", label: "Due / Created", render: (row) => dateLabel(row.due_date || row.created_at) },
            ]}
          />
        </HrPanel>
        <HrPanel title="Performance" icon={Gauge}>
          <div className="cdx-hr-score">
            <strong>{hrMetrics.total ? Math.round((hrMetrics.present / Math.max(hrMetrics.total, 1)) * 100) : 0}%</strong>
            <span>Attendance score</span>
            <p>Completed tasks, attendance percentage, productivity, and monthly ranking use synced staff records.</p>
          </div>
        </HrPanel>
        <HrPanel title="Departments" icon={Folder}>
          <div className="cdx-hr-stack">
            {departmentRows.length ? departmentRows.map((department) => <button type="button" key={department.name}>{department.name}<span>{department.value}</span></button>) : <button type="button">Create Department</button>}
          </div>
        </HrPanel>
        <HrPanel title="Holiday Management" icon={CalendarDays}>
          <div className="cdx-hr-stack">
            {["Holiday Calendar", "Festival List", "Emergency Holiday"].map((label) => <button type="button" key={label}>{label}</button>)}
          </div>
        </HrPanel>
        <HrPanel title="Reports" icon={FileBarChart}>
          <div className="cdx-hr-stack">
            {["Attendance Report", "Leave Report", "Task Report", "Performance Report"].map((label) => <button type="button" key={label}>{label}</button>)}
          </div>
        </HrPanel>
        <HrPanel title="Audit Log" icon={Archive} className="cdx-hr-panel--wide">
          <HrMiniTable
            rows={auditRows}
            emptyTitle="No audit log entries yet"
            columns={[
              { key: "name", label: "Record", render: (row) => getRowTitle(row, "Audit record") },
              { key: "status", label: "Action", render: (row) => titleize(getStatus(row)) },
              { key: "department", label: "Scope", render: (row) => getDepartment(row) },
              { key: "updated_at", label: "Timestamp", render: (row) => dateLabel(row.updated_at || row.created_at) },
            ]}
          />
        </HrPanel>
      </section>
    </main>
  );
}

export function ModulePage({ item }) {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [featureFilter, setFeatureFilter] = useState("");
  const [view, setView] = useState("table");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      setState("loading");
      setError("");
      const [sectionRows, sectionStats] = await Promise.all([fetchChairmanSection(item.key), fetchChairmanStats(item.key)]);
      setRows(sectionRows);
      setStats(sectionStats || {});
      setSelected([]);
      setState("ready");
    } catch (err) {
      setError(getApiMessage(err, `Failed to load ${item.label}.`));
      setState("error");
    }
  }, [item.key, item.label]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery("");
      setStatus("all");
      setFeatureFilter(featureConfig[item.key]?.filters?.[0] || "");
      setPage(1);
      setView("table");
      load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [item.key, load]);

  const filtered = useMemo(() => rows.filter((row) => {
    const matchesQuery = !query || JSON.stringify(row || {}).toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "all" || getStatus(row) === status;
    const matchesFeature = matchesFeatureFilter(row, featureFilter);
    return matchesQuery && matchesStatus && matchesFeature;
  }), [rows, query, status, featureFilter]);

  const statuses = useMemo(() => Array.from(new Set(rows.map(getStatus))).filter(Boolean).slice(0, 12), [rows]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const actions = actionMap[item.key] || [];
  const isBilling = ["generate-bills", "maintenance-bills", "collections", "pending-dues", "receipts", "reports"].includes(item.key);
  const feature = featureConfig[item.key];

  function localActionMessage(action, row) {
    const title = getRowTitle(row, "record");
    const messages = {
      "view-record": `Viewing ${title}.`,
      "edit-record": `Editing ${title}.`,
      "assign-flat": `Assign owner/tenant workflow opened for ${title}.`,
      "download-record": `Download started for ${title}.`,
      "delete-record": `Delete confirmation prepared for ${title}.`,
    };
    return messages[action.action] || `${action.label} opened for ${title}.`;
  }

  async function handleAction(action, row) {
    try {
      if (action.local) {
        setNotice(localActionMessage(action, row));
      } else {
        await runChairmanRowAction(action.action, row);
        setNotice("Action completed successfully.");
        await load();
      }
    } catch (err) {
      setNotice(getApiMessage(err, "Action failed."));
    }
  }

  return (
    <main className="cdx-content">
      <PageHeader item={item} rowsCount={filtered.length} onRefresh={load} onExport={() => downloadCsv(filtered, `${item.key}.csv`)}>
        {feature?.primaryAction ? <button type="button" className="cdx-button cdx-button--primary" onClick={() => setNotice(`${feature.primaryAction} workflow opened.`)}><Plus size={16} /> {feature.primaryAction}</button> : null}
        {feature?.secondaryActions?.map((label) => <button key={label} type="button" className="cdx-button cdx-button--ghost" onClick={() => setNotice(`${label} workflow opened.`)}>{label}</button>)}
        <button type="button" className="cdx-button cdx-button--ghost" onClick={() => window.print()}><Upload size={16} /> Export PDF</button>
        <button type="button" className="cdx-button cdx-button--ghost" onClick={() => downloadCsv(filtered, `${item.key}.xls`)}><Download size={16} /> Export Excel</button>
      </PageHeader>

      {isBilling ? <BillingGenerator rows={rows} /> : null}
      <FeatureKpiStrip feature={feature} rows={rows} />
      <FeatureWorkflowPanel item={item} feature={feature} rows={rows} onAction={setNotice} />
      {item.key === "settings" ? (
        <>
          {notice ? <div className="cdx-toast" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice("")}>Dismiss</button></div> : null}
        </>
      ) : null}
      {item.key === "settings" ? null : (
        <>

      {Object.keys(stats || {}).length ? (
        <section className="cdx-stat-strip">
          {Object.entries(stats).slice(0, 5).map(([key, value]) => <article key={key}><span>{titleize(key)}</span><strong>{typeof value === "object" ? "-" : String(value)}</strong></article>)}
        </section>
      ) : null}

      <ModuleToolbar
        query={query}
        setQuery={(value) => { setQuery(value); setPage(1); }}
        status={status}
        setStatus={(value) => { setStatus(value); setPage(1); }}
        statuses={statuses}
        view={view}
        setView={setView}
        selectedCount={selected.length}
        onImport={(file) => setNotice(`${file.name} selected for import review.`)}
        onBulk={() => setNotice(`${selected.length} records selected for bulk action.`)}
        feature={feature}
        featureFilter={featureFilter || feature?.filters?.[0] || ""}
        setFeatureFilter={(value) => { setFeatureFilter(value); setPage(1); }}
      />

      {notice ? <div className="cdx-toast" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice("")}>Dismiss</button></div> : null}

      {state === "ready" && paged.length ? (
        view === "table"
          ? <RecordsTable rows={paged} selected={selected} setSelected={setSelected} actions={actions} onAction={handleAction} feature={feature} />
          : <RecordsCards rows={paged} selected={selected} setSelected={setSelected} actions={actions} onAction={handleAction} />
      ) : <StateView state={state === "ready" ? "empty" : state} message={error} onRetry={load} emptyTitle={feature?.emptyTitle} />}

      <footer className="cdx-pagination">
        <span>{filtered.length} records</span>
        <div>
          <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={16} /> Previous</button>
          <strong>{page} / {pageCount}</strong>
          <button type="button" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next <ChevronRight size={16} /></button>
        </div>
      </footer>
        </>
      )}
    </main>
  );
}

export default function ChairmanDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("chairmanTheme") || localStorage.getItem("theme-mode") || "dark");
  const [effectiveTheme, setEffectiveTheme] = useState(() => getEffectiveChairmanTheme(localStorage.getItem("chairmanTheme") || localStorage.getItem("theme-mode") || "dark"));
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const user = getStoredUser();
  const role = String(user?.role || localStorage.getItem("role") || "").toLowerCase();
  const societyId = user?.society_id || user?.societyId || localStorage.getItem("societyId") || localStorage.getItem("selectedSocietyId");
  const rawKey = location.pathname.replace(/^\/admin\/?/, "") || "dashboard";
  const key = legacyPathMap[rawKey] || rawKey;
  const item = allItems.find((entry) => entry.key === key) || allItems.find((entry) => entry.key === "dashboard");

  useEffect(() => {
    const applyTheme = () => {
      const resolved = getEffectiveChairmanTheme(theme);
      setEffectiveTheme(resolved);
      document.documentElement.dataset.theme = resolved;
      document.documentElement.dataset.themeMode = theme;
      document.body.dataset.theme = resolved;
      document.body.dataset.themeMode = theme;
      document.documentElement.classList.toggle("dark", resolved === "dark");
      document.body.classList.toggle("dark", resolved === "dark");
      window.dispatchEvent(new CustomEvent("theme-mode-changed", { detail: { themeMode: theme, effectiveTheme: resolved } }));
    };

    localStorage.setItem("chairmanTheme", theme);
    localStorage.setItem("theme-mode", theme);
    applyTheme();

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (theme !== "system" || !media) return undefined;
    media.addEventListener?.("change", applyTheme);
    return () => media.removeEventListener?.("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    if (legacyPathMap[rawKey]) {
      navigate(`/admin/${legacyPathMap[rawKey]}`, { replace: true });
      return;
    }
    if (!allItems.some((entry) => entry.key === key)) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [key, rawKey, navigate]);

  useEffect(() => {
    if (!logoutOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [logoutOpen]);

  function navigateTo(targetKey) {
    setMobileOpen(false);
    navigate(`/admin/${targetKey}`);
  }

  async function confirmLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutUser();
    } catch (error) {
      console.warn("Chairman logout API failed, clearing browser session anyway.", error);
    }
    clearChairmanBrowserSession();
    sessionStorage.setItem("loginSuccessMessage", "Logged out successfully.");
    navigate("/login", { replace: true });
  }

  const isChairman = ["chairman", "admin"].includes(role);
  if (isChairman && !societyId) {
    return (
      <div className={cx("cdx-shell", `cdx-shell--${effectiveTheme}`, `cdx-theme-mode--${theme}`, collapsed && "is-sidebar-collapsed")}>
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          activeKey={item.key}
          onNavigate={navigateTo}
          onToggle={() => setCollapsed((value) => !value)}
          onClose={() => setMobileOpen(false)}
          onLogout={() => setLogoutOpen(true)}
          theme={theme}
          setTheme={setTheme}
        />
        <div className="cdx-main">
          <Topbar
            theme={theme}
            setTheme={setTheme}
            user={user}
            currentItem={item}
            sidebarCollapsed={collapsed}
            onMenu={() => setMobileOpen(true)}
            onToggleSidebar={() => setCollapsed((value) => !value)}
            onLogout={() => setLogoutOpen(true)}
          />
          <main className="cdx-content">
            <section className="cdx-page-header">
              <div>
                <div className="cdx-breadcrumb"><span>Chairman</span><span>/</span><strong>Society Context</strong></div>
                <h1>Chairman is not assigned to a society.</h1>
                <p>Please ask the Super Admin to assign this Chairman account to an active society before opening records.</p>
              </div>
            </section>
            <div className="cdx-state is-error">
              <AlertTriangle size={28} />
              <strong>Missing society assignment</strong>
              <span>Chairman records are society-scoped, so the dashboard is blocked until society_id is available.</span>
            </div>
          </main>
        </div>
        {logoutOpen ? <LogoutModal loading={loggingOut} onCancel={() => !loggingOut && setLogoutOpen(false)} onConfirm={confirmLogout} /> : null}
      </div>
    );
  }

  return (
    <div className={cx("cdx-shell", `cdx-shell--${effectiveTheme}`, `cdx-theme-mode--${theme}`, collapsed && "is-sidebar-collapsed")}>
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          activeKey={item.key}
          onNavigate={navigateTo}
          onToggle={() => setCollapsed((value) => !value)}
          onClose={() => setMobileOpen(false)}
          onLogout={() => setLogoutOpen(true)}
          theme={theme}
          setTheme={setTheme}
        />
      <div className="cdx-main">
        <Topbar
          theme={theme}
          setTheme={setTheme}
          user={user}
          currentItem={item}
          sidebarCollapsed={collapsed}
          onMenu={() => setMobileOpen(true)}
          onToggleSidebar={() => setCollapsed((value) => !value)}
          onLogout={() => setLogoutOpen(true)}
        />
        {item.key === "dashboard"
          ? <DashboardHome />
          : ["staff-register", "security-register", "attendance", "performance"].includes(item.key)
            ? <StaffSecurityModule item={item} />
            : <ModulePage item={item} />}
      </div>
      {mobileOpen ? <button className="cdx-screen" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} /> : null}
      {logoutOpen ? <LogoutModal loading={loggingOut} onCancel={() => !loggingOut && setLogoutOpen(false)} onConfirm={confirmLogout} /> : null}
    </div>
  );
}
