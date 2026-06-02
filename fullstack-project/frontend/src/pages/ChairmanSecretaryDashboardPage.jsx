import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AlertMessage from "../components/AlertMessage";
import { api, getApiMessage } from "../services/authApi";
import { fetchAllBills } from "../services/billingApi";
import { fetchAllComplaints } from "../services/complaintApi";
import { fetchFlats } from "../services/flatApi";
import { fetchNotifications } from "../services/notificationApi";
import { fetchNotices } from "../services/noticeApi";
import { getParkingStats } from "../services/parkingApi";
import { fetchVisitorLogs } from "../services/visitorApi";
import { queryAssistant } from "../services/aiApi";
import { initSocket, subscribe } from "../sockets/socketClient";
import { getStoredUser } from "../utils/session";
import { useThemeEngine } from "../contexts/ThemeContext";

const CHART_COLORS = {
  primary: "#14b8a6",
  secondary: "#2563eb",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#8b5cf6",
  slate: "#64748b",
};

const ROLE_PERMISSIONS = {
  chairman: [
    "Approve or reject secretary appointments",
    "Approve member registrations and KYC",
    "Authorize financial exceptions and budgets",
    "Manage society settings and governance",
    "Review audit trails and reports",
    "Control committee and election workflows",
  ],
  secretary: [
    "Manage resident records and approvals",
    "Track complaints and escalations",
    "Publish notices and announcements",
    "Oversee visitors, billing and documents",
    "Coordinate staff, events and parking",
    "Handle day-to-day society operations",
  ],
};

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatCurrency(value) {
  return `₹${toNumber(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMonthKey(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  if (!key) return "";
  const [year, month] = key.split("-").map(Number);
  return new Date(year, (month || 1) - 1, 1).toLocaleString("en-IN", {
    month: "short",
  });
}

function lastSixMonthKeys() {
  const cursor = new Date();
  cursor.setDate(1);

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(cursor.getFullYear(), cursor.getMonth() - 5 + index, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

function buildMonthlySeries(items, getDate, getValue = () => 1) {
  const keys = lastSixMonthKeys();
  const map = new Map(keys.map((key) => [key, { key, month: monthLabel(key), value: 0 }]));

  for (const item of items) {
    const key = getMonthKey(getDate(item));
    if (!key || !map.has(key)) continue;
    map.get(key).value += toNumber(getValue(item));
  }

  return keys.map((key) => map.get(key));
}

function compactName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function isTruthyStatus(status, accepted = []) {
  const value = String(status || "").toLowerCase();
  return accepted.includes(value);
}

function isOccupiedFlat(flat) {
  const status = String(flat?.status || flat?.occupancy_status || "").toLowerCase();
  return (
    status.includes("occupied") ||
    Boolean(flat?.resident_id) ||
    Boolean(flat?.resident_name) ||
    Boolean(flat?.assigned_resident_id) ||
    Boolean(flat?.assignedResidentId)
  );
}

function getLeadershipName(users, role, fallback) {
  const person = users.find((item) => String(item?.role || "").toLowerCase() === role);
  return compactName(person?.name || fallback || "-") || "-";
}

function StatusPill({ children, tone = "slate" }) {
  const tones = {
    slate: "border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] text-[rgb(var(--app-text-rgb))]",
    primary: "border-[rgb(var(--app-primary-rgb))]/20 bg-[rgb(var(--app-primary-rgb))]/10 text-[rgb(var(--app-primary-rgb))]",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function StatCard({ label, value, helper, tone = "primary" }) {
  const accents = {
    primary: "from-cyan-500/18 via-transparent to-transparent",
    secondary: "from-blue-500/18 via-transparent to-transparent",
    warning: "from-amber-500/18 via-transparent to-transparent",
    danger: "from-rose-500/18 via-transparent to-transparent",
    success: "from-emerald-500/18 via-transparent to-transparent",
    info: "from-violet-500/18 via-transparent to-transparent",
    slate: "from-slate-500/18 via-transparent to-transparent",
  };

  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-5 shadow-[0_14px_48px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
      <div className={`absolute inset-0 bg-gradient-to-br ${accents[tone]} opacity-100`} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[rgb(var(--app-text-muted-rgb))]">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[rgb(var(--app-text-rgb))]">{value}</p>
          <p className="mt-2 text-xs text-[rgb(var(--app-text-muted-rgb))]">{helper}</p>
        </div>
        <div className="h-11 w-11 rounded-2xl border border-white/60 bg-white/40 shadow-inner shadow-white/40 backdrop-blur" />
      </div>
    </div>
  );
}

function SectionCard({ eyebrow, title, description, action, children, className = "" }) {
  return (
    <section className={`surface-card app-surface min-w-0 rounded-[30px] border border-[rgb(var(--app-border-rgb))] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6 ${className}`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[rgb(var(--app-text-muted-rgb))]">{eyebrow}</p> : null}
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-[rgb(var(--app-text-rgb))]">{title}</h3>
          {description ? <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--app-text-muted-rgb))]">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function TimelineItem({ title, detail, time, tone = "slate" }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
      <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${tone === "primary" ? "bg-[rgb(var(--app-primary-rgb))]" : tone === "warning" ? "bg-amber-500" : tone === "danger" ? "bg-rose-500" : tone === "success" ? "bg-emerald-500" : "bg-slate-400"}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-[rgb(var(--app-text-rgb))]">{title}</p>
          <span className="text-xs text-[rgb(var(--app-text-muted-rgb))]">{time}</span>
        </div>
        <p className="mt-1 text-sm text-[rgb(var(--app-text-muted-rgb))]">{detail}</p>
      </div>
    </div>
  );
}

function PermissionList({ title, items, tone, active }) {
  return (
    <div className={`rounded-[28px] border p-5 ${active ? "border-[rgb(var(--app-primary-rgb))]/30 bg-[rgb(var(--app-primary-rgb))]/5" : "border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))]"}`}>
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-lg font-semibold text-[rgb(var(--app-text-rgb))]">{title}</h4>
        <StatusPill tone={tone}>{active ? "Current role" : "Related role"}</StatusPill>
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm text-[rgb(var(--app-text-rgb))]">
            <span className={`mt-1 h-2.5 w-2.5 rounded-full ${active ? "bg-[rgb(var(--app-primary-rgb))]" : "bg-[rgb(var(--app-text-muted-rgb))]"}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChairmanSecretaryDashboardPage() {
  const { preferences, setThemeMode } = useThemeEngine();
  const [loading, setLoading] = useState(true);
  const [chartsReady, setChartsReady] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [societyContext, setSocietyContext] = useState(null);
  const [users, setUsers] = useState([]);
  const [flats, setFlats] = useState([]);
  const [bills, setBills] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [parkingStats, setParkingStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [aiWidgets, setAiWidgets] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiReply, setAiReply] = useState("");
  const [maintenancePrediction, setMaintenancePrediction] = useState(null);
  const [assistantInput, setAssistantInput] = useState("");
  const socketInitializedRef = useRef(false);
  const dashboardLoadedRef = useRef(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (socketInitializedRef.current) return undefined;
    socketInitializedRef.current = true;

    const socket = initSocket();
    const unsubs = [
      subscribe("stats-update", (payload) => {
        if (payload?.users) setUsers(toArray(payload.users));
        if (payload?.flats) setFlats(toArray(payload.flats));
        if (payload?.bills) setBills(toArray(payload.bills));
        if (payload?.complaints) setComplaints(toArray(payload.complaints));
        if (payload?.visitors) setVisitors(toArray(payload.visitors));
        if (payload?.notices) setNotices(toArray(payload.notices));
      }),
      subscribe("activity", (payload) => {
        if (payload?.type === "notification") {
          setNotifications((prev) => [payload, ...prev].slice(0, 8));
        }
      }),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => {
        try {
          unsubscribe();
        } catch (_error) {
          // ignore cleanup errors
        }
      });

      try {
        socket?.disconnect?.();
      } catch (_error) {
        // ignore cleanup errors
      }
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setChartsReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (dashboardLoadedRef.current) return undefined;
    dashboardLoadedRef.current = true;

    async function loadDashboard() {
      try {
        setLoading(true);

        const [societyRes, usersRes, flatsRes, billsRes, complaintsRes, noticesRes, visitorsRes, notificationsRes, parkingStatsRes] = await Promise.allSettled([
          api.get("dashboards/society"),
          api.get("/users"),
          fetchFlats(),
          fetchAllBills(),
          fetchAllComplaints(),
          fetchNotices(),
          fetchVisitorLogs(),
          fetchNotifications({ limit: 8 }),
          getParkingStats(),
        ]);

        const nextAlerts = [];

        if (societyRes.status === "fulfilled") {
          setSocietyContext(societyRes.value?.data?.data || societyRes.value?.data || null);
        } else {
          nextAlerts.push(getApiMessage(societyRes.reason, "Could not load society context"));
        }

        if (usersRes.status === "fulfilled") setUsers(toArray(usersRes.value?.data));
        else nextAlerts.push(getApiMessage(usersRes.reason, "Could not load residents and staff"));

        if (flatsRes.status === "fulfilled") setFlats(toArray(flatsRes.value));
        else nextAlerts.push(getApiMessage(flatsRes.reason, "Could not load flat inventory"));

        if (billsRes.status === "fulfilled") setBills(toArray(billsRes.value));
        else nextAlerts.push(getApiMessage(billsRes.reason, "Could not load billing data"));

        if (complaintsRes.status === "fulfilled") setComplaints(toArray(complaintsRes.value));
        else nextAlerts.push(getApiMessage(complaintsRes.reason, "Could not load complaints"));

        if (noticesRes.status === "fulfilled") setNotices(toArray(noticesRes.value));
        else nextAlerts.push(getApiMessage(noticesRes.reason, "Could not load notices"));

        if (visitorsRes.status === "fulfilled") setVisitors(toArray(visitorsRes.value));
        else nextAlerts.push(getApiMessage(visitorsRes.reason, "Could not load visitors"));

        if (notificationsRes.status === "fulfilled") setNotifications(toArray(notificationsRes.value));
        else nextAlerts.push(getApiMessage(notificationsRes.reason, "Could not load notifications"));

        if (parkingStatsRes.status === "fulfilled") setParkingStats(parkingStatsRes.value?.data || null);
        else nextAlerts.push(getApiMessage(parkingStatsRes.reason, "Could not load parking statistics"));

        if (nextAlerts.length) {
          setAlert({ type: "warning", message: nextAlerts[0] });
        }
      } catch (error) {
        setAlert({ type: "error", message: getApiMessage(error, "Could not load chairman and secretary dashboard") });
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  useEffect(() => {
    const user = getStoredUser();
    if (user) setCurrentUser(user);
  }, []);

  const location = useLocation();
  const society = societyContext?.society || null;
  const currentRole = String(currentUser?.role || "secretary").toLowerCase();
  const basePath = location.pathname.startsWith("/chairman")
    ? "/chairman"
    : location.pathname.startsWith("/secretary")
      ? "/secretary"
      : "/admin";
  const roleLabel = currentRole === "admin" ? "Chairman" : currentRole === "secretary" ? "Secretary" : "Society Lead";

  const totalFlats = flats.length;
  const occupiedFlats = flats.filter(isOccupiedFlat).length;
  const vacantFlats = Math.max(totalFlats - occupiedFlats, 0);
  const totalResidents = users.filter((item) => String(item?.role || "").toLowerCase() === "resident").length;
  const totalStaff = users.filter((item) => ["staff", "security"].includes(String(item?.role || "").toLowerCase())).length;
  const pendingApprovals = users.filter((item) => String(item?.status || "").toLowerCase() === "pending").length;
  const openComplaints = complaints.filter((item) => !isTruthyStatus(item?.status, ["resolved", "closed", "completed"])).length;
  const activeVisitors = visitors.filter((item) => {
    const status = String(item?.status || item?.entry_status || item?.visit_status || "").toLowerCase();
    return ["approved", "in_premises", "inside", "checked_in", "active"].includes(status) || (!item?.exit_time && !item?.exitTime);
  }).length;
  const visitorsToday = visitors.filter((item) => {
    const raw = item?.entry_time || item?.created_at || item?.createdAt;
    if (!raw) return false;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  }).length;
  const parkingAssigned = Number(parkingStats?.assigned_slots || 0);

  const paidBills = bills.filter((item) => isTruthyStatus(item?.status || item?.payment_status, ["paid", "partial", "partially_paid"]));
  const unpaidBills = bills.filter((item) => isTruthyStatus(item?.status || item?.payment_status, ["unpaid", "overdue", "pending"]));
  const totalIncome = paidBills.reduce((sum, item) => sum + toNumber(item?.paid_amount || item?.total_amount || item?.amount), 0);
  const pendingDues = unpaidBills.reduce((sum, item) => sum + Math.max(toNumber(item?.total_amount || item?.amount) - toNumber(item?.paid_amount), 0), 0);
  const monthlyCollection = paidBills.reduce((sum, item) => {
    const monthKey = getMonthKey(item?.paid_at || item?.paid_date || item?.updated_at || item?.created_at);
    const currentMonthKey = getMonthKey(new Date());
    return monthKey === currentMonthKey ? sum + toNumber(item?.paid_amount || item?.total_amount || item?.amount) : sum;
  }, 0);
  const totalExpenses = toNumber(societyContext?.financial?.totalExpenses || societyContext?.metrics?.totalExpenses || 0);

  const totalBilled = bills.reduce((sum, item) => sum + toNumber(item?.total_amount || item?.amount), 0);
  const collectionRate = totalBilled ? Math.round((totalIncome / totalBilled) * 100) : 0;
  const occupancyRate = totalFlats ? Math.round((occupiedFlats / totalFlats) * 100) : 0;
  const complaintResolutionRate = complaints.length
    ? Math.round((complaints.filter((item) => isTruthyStatus(item?.status, ["resolved", "closed", "completed"])).length / complaints.length) * 100)
    : 0;
  const staffCoverage = totalStaff ? 100 : 0;
  const societyHealthScore = Math.round((collectionRate + occupancyRate + complaintResolutionRate + staffCoverage) / 4);

  const chairmanName = societyContext?.chairmanName || getLeadershipName(users, "admin", societyContext?.user?.role === "admin" ? societyContext?.user?.name : currentUser?.name);
  const secretaryName = societyContext?.secretaryName || getLeadershipName(users, "secretary", societyContext?.user?.role === "secretary" ? societyContext?.user?.name : currentUser?.name);

  const revenueSeries = useMemo(
    () => buildMonthlySeries(paidBills, (item) => item?.paid_at || item?.paid_date || item?.updated_at || item?.created_at, (item) => item?.paid_amount || item?.total_amount || item?.amount),
    [paidBills]
  );

  const occupancySeries = useMemo(
    () => [
      { name: "Occupied", value: occupiedFlats },
      { name: "Vacant", value: vacantFlats },
      { name: "Maintenance", value: flats.filter((item) => String(item?.status || "").toLowerCase().includes("maintenance")).length },
    ],
    [occupiedFlats, vacantFlats, flats]
  );

  const complaintSeries = useMemo(
    () => {
      const counts = complaints.reduce((acc, item) => {
        const status = String(item?.status || "open").toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      return [
        { name: "Open", value: counts.open || counts.pending || 0 },
        { name: "In Progress", value: counts.in_progress || counts.working || 0 },
        { name: "Resolved", value: counts.resolved || counts.closed || 0 },
      ];
    },
    [complaints]
  );

  const residentGrowth = useMemo(() => {
    const base = buildMonthlySeries(users.filter((item) => String(item?.role || "").toLowerCase() === "resident"), (item) => item?.created_at || item?.registered_at || item?.updated_at, () => 1);
    return base.map((item, index) => ({ ...item, value: base.slice(0, index + 1).reduce((sum, entry) => sum + entry.value, 0) }));
  }, [users]);

  const quickActions = useMemo(
    () => {
      const adminActions = [
        { label: "Residents", to: `${basePath}/residents`, hint: "Review approvals and KYC" },
        { label: "Flats", to: `${basePath}/flats`, hint: "Manage occupancy and transfers" },
        { label: "Billing", to: `${basePath}/billing`, hint: "Run collections and dues" },
        { label: "Complaints", to: `${basePath}/complaints`, hint: "Escalations and resolution" },
        { label: "Notices", to: `${basePath}/notices`, hint: "Publish and schedule notices" },
        { label: "Visitors", to: `${basePath}/visitors`, hint: "Track access and QR passes" },
        { label: "Documents", to: `${basePath}/documents`, hint: "Minutes and legal records" },
        { label: "Staff", to: `${basePath}/staff`, hint: "Shifts, attendance and payroll" },
        { label: "Settings", to: `${basePath}/settings`, hint: "Society profile and controls" },
        { label: "Analytics", to: `${basePath}/analytics`, hint: "Reports and forecasting" },
      ];

      const secretaryActions = [
        { label: "Resident Approvals", to: `${basePath}/users`, hint: "Approve and verify members" },
        { label: "Billing", to: `${basePath}/billing`, hint: "Create bills and track payments" },
        { label: "Complaints", to: `${basePath}/complaints`, hint: "Monitor service requests" },
        { label: "Visitors", to: `${basePath}/visitors`, hint: "Review visitor access logs" },
        { label: "Staff", to: `${basePath}/staff`, hint: "Review workforce coverage" },
        { label: "Settings", to: `${basePath}/settings`, hint: "Update society profile" },
        { label: "Documents", to: `${basePath}/documents`, hint: "Record notices and minutes" },
        { label: "Notices", to: `${basePath}/notices`, hint: "Publish resident updates" },
      ];

      return currentRole === "admin" ? adminActions : secretaryActions;
    },
    [basePath, currentRole]
  );

  const activityTimeline = useMemo(() => {
    const entries = [
      ...complaints.slice(0, 4).map((item) => ({
        key: `complaint-${item?.id}`,
        title: compactName(item?.title || item?.subject || "Complaint update"),
        detail: compactName(item?.status || "open complaint"),
        time: formatDateTime(item?.updated_at || item?.created_at),
        timestamp: new Date(item?.updated_at || item?.created_at || 0).getTime(),
        tone: isTruthyStatus(item?.status, ["resolved", "closed", "completed"]) ? "success" : isTruthyStatus(item?.status, ["pending", "open"]) ? "warning" : "primary",
      })),
      ...bills.slice(0, 4).map((item) => ({
        key: `bill-${item?.id}`,
        title: compactName(item?.title || item?.bill_type || "Billing event"),
        detail: `${formatCurrency(item?.paid_amount || item?.total_amount || item?.amount)} ${compactName(item?.status || "")}`,
        time: formatDateTime(item?.paid_at || item?.updated_at || item?.created_at),
        timestamp: new Date(item?.paid_at || item?.updated_at || item?.created_at || 0).getTime(),
        tone: isTruthyStatus(item?.status, ["paid"]) ? "success" : "warning",
      })),
      ...notices.slice(0, 3).map((item) => ({
        key: `notice-${item?.id}`,
        title: compactName(item?.title || "Notice"),
        detail: compactName(item?.description || item?.message || "Published to residents"),
        time: formatDateTime(item?.published_at || item?.created_at),
        timestamp: new Date(item?.published_at || item?.created_at || 0).getTime(),
        tone: "primary",
      })),
      ...visitors.slice(0, 3).map((item) => ({
        key: `visitor-${item?.id}`,
        title: compactName(item?.name || item?.visitor_name || "Visitor"),
        detail: compactName(item?.purpose || item?.visitPurpose || item?.status || "Visitor entry"),
        time: formatDateTime(item?.entry_time || item?.created_at || item?.createdAt),
        timestamp: new Date(item?.entry_time || item?.created_at || item?.createdAt || 0).getTime(),
        tone: isTruthyStatus(item?.status, ["inside", "in_premises", "checked_in", "approved"]) ? "primary" : "slate",
      })),
    ];

    return entries.sort((left, right) => right.timestamp - left.timestamp).slice(0, 8);
  }, [complaints, bills, notices, visitors]);

  const summaryCards = [
    { label: "Society Name", value: society?.name || societyContext?.society?.name || "Linked society", helper: society?.code ? `Code ${society.code}` : "Society-scoped access", tone: "primary" },
    { label: "Chairman", value: chairmanName, helper: currentRole === "admin" ? "Current chairperson account" : "Leadership reference", tone: "secondary" },
    { label: "Secretary", value: secretaryName, helper: currentRole === "secretary" ? "Current secretary account" : "Operational lead", tone: "info" },
    { label: "Total Residents", value: totalResidents, helper: "Active resident records", tone: "success" },
    { label: "Total Flats", value: totalFlats, helper: `${occupiedFlats} occupied and ${vacantFlats} vacant`, tone: "secondary" },
    { label: "Total Staff", value: totalStaff, helper: "Includes support and security roster", tone: "warning" },
    { label: "Visitors Today", value: visitorsToday, helper: "Entries created today", tone: "info" },
    { label: "Parking Assigned", value: parkingAssigned, helper: "Assigned slots in this society", tone: "secondary" },
    { label: "Pending Approvals", value: pendingApprovals, helper: "Waiting for review", tone: "danger" },
    { label: "Open Complaints", value: openComplaints, helper: "Unresolved service tickets", tone: "warning" },
    { label: "Monthly Collection", value: formatCurrency(monthlyCollection), helper: "Paid during the current month", tone: "success" },
    { label: "Pending Dues", value: formatCurrency(pendingDues), helper: "Outstanding receivables", tone: "danger" },
    { label: "Total Income", value: formatCurrency(totalIncome), helper: "Collected from paid bills", tone: "primary" },
    { label: "Total Expenses", value: formatCurrency(totalExpenses), helper: totalExpenses > 0 ? "Ledger-linked expense outflow" : "Expense ledger not configured", tone: "slate" },
    { label: "Society Health", value: `${societyHealthScore}%`, helper: "Composite operational score", tone: societyHealthScore >= 80 ? "success" : societyHealthScore >= 60 ? "warning" : "danger" },
  ];

  async function handleAskAssistant(event) {
    event.preventDefault();
    const prompt = assistantInput.trim();
    if (!prompt) return;

    try {
      setAssistantLoading(true);
      const response = await queryAssistant({
        query: prompt,
        context: {
          section: "chairman-secretary-dashboard",
          societyId: society?.id || societyContext?.society?.id || currentUser?.societyId || null,
          role: currentRole,
        },
      });

      const payload = response?.data || response || {};
      setAiReply(payload?.answer || payload?.reply || "No response from assistant.");
      setAssistantInput("");
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "AI assistant failed") });
    } finally {
      setAssistantLoading(false);
    }
  }

  function runVoiceAssistant() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAlert({ type: "error", message: "Speech recognition is not supported in this browser" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const text = event.results?.[0]?.[0]?.transcript || "";
      setAssistantInput(text);
    };

    recognition.onerror = () => setAlert({ type: "error", message: "Voice input could not be captured" });
    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopVoiceAssistant() {
    recognitionRef.current?.stop?.();
  }

  function downloadSnapshot() {
    const snapshot = {
      society: {
        name: society?.name || societyContext?.society?.name || "Linked society",
        code: society?.code || societyContext?.society?.code || null,
        logoUrl: society?.logo_url || society?.logoUrl || null,
      },
      role: roleLabel,
      metrics: {
        totalResidents,
        totalFlats,
        occupiedFlats,
        vacantFlats,
        totalStaff,
        activeVisitors,
        pendingApprovals,
        openComplaints,
        monthlyCollection,
        pendingDues,
        totalIncome,
        totalExpenses,
        societyHealthScore,
      },
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `society-dashboard-${society?.code || "snapshot"}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="rounded-[32px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-6">
          <div className="h-4 w-40 rounded-full bg-[rgb(var(--app-surface-muted-rgb))]" />
          <div className="mt-4 h-12 w-3/4 rounded-2xl bg-[rgb(var(--app-surface-muted-rgb))]" />
          <div className="mt-3 h-4 w-1/2 rounded-full bg-[rgb(var(--app-surface-muted-rgb))]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="h-32 rounded-[28px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="group relative overflow-hidden rounded-[32px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.16),transparent_30%)]" />
        <div className="relative grid gap-6 p-6 md:grid-cols-[1.6fr_0.9fr] md:p-8">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill tone="primary">Society command center</StatusPill>
              <StatusPill tone={currentRole === "admin" ? "success" : "warning"}>{roleLabel}</StatusPill>
              <StatusPill tone={society?.status === "active" ? "success" : "warning"}>{society?.status || "active"}</StatusPill>
              <button
                type="button"
                onClick={() => setThemeMode(preferences.themeMode === "dark" ? "light" : "dark")}
                className="rounded-full border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] px-4 py-2 text-sm font-semibold text-[rgb(var(--app-text-rgb))] shadow-sm transition hover:border-[rgb(var(--app-primary-rgb))]"
              >
                {preferences.themeMode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[22px] border border-[rgb(var(--app-border-rgb))] bg-white/80 shadow-sm">
                {society?.logo_url || society?.logoUrl ? (
                  <img alt={society?.name || "Society logo"} className="h-full w-full object-cover" src={society.logo_url || society.logoUrl} />
                ) : (
                  <div className="text-2xl font-bold text-[rgb(var(--app-primary-rgb))]">{String(society?.name || "S").slice(0, 1).toUpperCase()}</div>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--app-text-muted-rgb))]">Premium chairman and secretary workspace</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-[rgb(var(--app-text-rgb))] md:text-5xl">{society?.name || societyContext?.society?.name || "Society Dashboard"}</h1>
                <p className="mt-3 max-w-3xl text-sm text-[rgb(var(--app-text-muted-rgb))]">
                  Society-scoped operations, approvals, collections, complaints, visitors and AI assistance for {roleLabel.toLowerCase()} leadership.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-sm text-[rgb(var(--app-text-rgb))]">
              <span className="rounded-full border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] px-4 py-2 font-semibold text-[rgb(var(--app-text-rgb))] shadow-sm">Code: {society?.code || societyContext?.society?.code || "-"}</span>
              <span className="rounded-full border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] px-4 py-2 font-semibold text-[rgb(var(--app-text-rgb))] shadow-sm">Chairman: {chairmanName}</span>
              <span className="rounded-full border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] px-4 py-2 font-semibold text-[rgb(var(--app-text-rgb))] shadow-sm">Secretary: {secretaryName}</span>
              <span className="rounded-full border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] px-4 py-2 font-semibold text-[rgb(var(--app-text-rgb))] shadow-sm">Access limited to assigned society</span>
            </div>
          </div>

          <div className="grid gap-3 rounded-[28px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))]/70 p-4 shadow-[0_14px_48px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-[rgb(var(--app-text-muted-rgb))]">Current profile</p>
              <p className="mt-2 text-xl font-semibold text-[rgb(var(--app-text-rgb))]">{currentUser?.name || roleLabel}</p>
              <p className="mt-1 text-sm text-[rgb(var(--app-text-muted-rgb))]">{compactName(currentUser?.email || societyContext?.user?.email || "Society-authenticated")}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
                <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">Approval queue</p>
                <p className="mt-2 text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{pendingApprovals}</p>
              </div>
              <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
                <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">Health score</p>
                <p className="mt-2 text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{societyHealthScore}%</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={downloadSnapshot} className="rounded-xl bg-[rgb(var(--app-primary-rgb))] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-95">Download Snapshot</button>
              <Link to={`${basePath}/billing`} className="rounded-xl border border-[rgb(var(--app-border-rgb))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--app-text-rgb))] transition-colors hover:border-[rgb(var(--app-primary-rgb))]">Open Billing</Link>
            </div>
          </div>
        </div>
      </section>

      <AlertMessage type={alert.type} message={alert.message} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} helper={card.helper} tone={card.tone} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard eyebrow="Revenue" title="Collection trends" description="Monthly collection velocity and dues movement across the society.">
          <div className="h-80 min-w-0">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueSeries}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" tick={{ fill: "currentColor" }} />
                  <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fill: "currentColor" }} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="value" stroke={CHART_COLORS.primary} fill="url(#revenueGradient)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))]/70 text-sm text-[rgb(var(--app-text-muted-rgb))]">
                Preparing chart...
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Occupancy" title="Flat utilization" description="Occupied, vacant and maintenance-aware inventory view.">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="h-72 min-w-0">
              {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancySeries}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fill: "currentColor" }} />
                    <YAxis allowDecimals={false} tick={{ fill: "currentColor" }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                      {occupancySeries.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={[CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.warning][index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))]/70 text-sm text-[rgb(var(--app-text-muted-rgb))]">
                  Preparing chart...
                </div>
              )}
            </div>
            <div className="grid gap-3">
              <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
                <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Occupancy rate</p>
                <p className="mt-2 text-3xl font-bold text-[rgb(var(--app-text-rgb))]">{occupancyRate}%</p>
                <p className="mt-1 text-xs text-[rgb(var(--app-text-muted-rgb))]">Derived from live flat records</p>
              </div>
              <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
                <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Society health score</p>
                <p className="mt-2 text-3xl font-bold text-[rgb(var(--app-text-rgb))]">{societyHealthScore}%</p>
                <p className="mt-1 text-xs text-[rgb(var(--app-text-muted-rgb))]">Collection, occupancy and resolution blend</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <SectionCard eyebrow="Complaints" title="Issue analytics" description="Open, active and resolved complaint distribution.">
          <div className="h-72 min-w-0">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={complaintSeries} dataKey="value" nameKey="name" innerRadius={70} outerRadius={108} paddingAngle={4}>
                    {complaintSeries.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={[CHART_COLORS.danger, CHART_COLORS.warning, CHART_COLORS.primary][index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))]/70 text-sm text-[rgb(var(--app-text-muted-rgb))]">
                Preparing chart...
              </div>
            )}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-3">
              <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">Open</p>
              <p className="mt-1 text-xl font-bold text-[rgb(var(--app-text-rgb))]">{complaintSeries[0]?.value || 0}</p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-3">
              <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">In progress</p>
              <p className="mt-1 text-xl font-bold text-[rgb(var(--app-text-rgb))]">{complaintSeries[1]?.value || 0}</p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-3">
              <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">Resolved</p>
              <p className="mt-1 text-xl font-bold text-[rgb(var(--app-text-rgb))]">{complaintSeries[2]?.value || 0}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Residents" title="Resident growth" description="Registered resident accounts over the last six months.">
          <div className="h-72 min-w-0">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={residentGrowth}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="month" tick={{ fill: "currentColor" }} />
                  <YAxis allowDecimals={false} tick={{ fill: "currentColor" }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke={CHART_COLORS.secondary} strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))]/70 text-sm text-[rgb(var(--app-text-muted-rgb))]">
                Preparing chart...
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Finance" title="Billing health" description="Current month collections, dues and expense readiness.">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
              <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">Current month collection</p>
              <p className="mt-2 text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{formatCurrency(monthlyCollection)}</p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
              <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">Pending dues</p>
              <p className="mt-2 text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{formatCurrency(pendingDues)}</p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
              <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">Collection rate</p>
              <p className="mt-2 text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{collectionRate}%</p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
              <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">Total expenses</p>
              <p className="mt-2 text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_1.1fr_0.9fr]">
        <SectionCard eyebrow="Approvals" title="Pending review queue" description="Operational items requiring chairman or secretary attention.">
          <div className="space-y-3">
            {users.filter((item) => String(item?.status || "").toLowerCase() === "pending").slice(0, 4).map((item) => (
              <TimelineItem
                key={item?.id}
                title={compactName(item?.name || item?.email || "Pending account")}
                detail={`${compactName(item?.role || "member")} approval waiting for verification`}
                time={formatDateTime(item?.created_at || item?.updated_at)}
                tone="warning"
              />
            ))}
            {!users.some((item) => String(item?.status || "").toLowerCase() === "pending") ? <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">No approvals pending right now.</p> : null}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Activity" title="Activity timeline" description="Latest operational events across billing, complaints, notices and visitors.">
          <div className="space-y-3">
            {activityTimeline.map((item) => (
              <TimelineItem key={item.key} title={item.title} detail={item.detail} time={item.time} tone={item.tone} />
            ))}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Notifications" title="Recent notifications" description="Unread and recent delivery events from the communication layer.">
          <div className="space-y-3">
            {notifications.slice(0, 5).map((item, index) => (
              <div key={item?.id || index} className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
                <p className="text-sm font-semibold text-[rgb(var(--app-text-rgb))]">{compactName(item?.title || item?.subject || item?.message || item?.type || "Notification")}</p>
                <p className="mt-1 text-xs text-[rgb(var(--app-text-muted-rgb))]">{compactName(item?.message || item?.description || "Delivered to society scope")}</p>
              </div>
            ))}
            {!notifications.length ? <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">No recent notifications found.</p> : null}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard eyebrow="Quick actions" title="Operational shortcuts" description="Direct links for the most common chairman and secretary workflows.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <Link key={action.to} to={action.to} className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[rgb(var(--app-primary-rgb))]">
                <p className="font-semibold text-[rgb(var(--app-text-rgb))]">{action.label}</p>
                <p className="mt-1 text-xs text-[rgb(var(--app-text-muted-rgb))]">{action.hint}</p>
              </Link>
            ))}
          </div>
        </SectionCard>

        <SectionCard eyebrow="AI" title="AI assistant workspace" description="Society-specific prompts, recommendations and live leadership guidance.">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
                <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">Maintenance prediction</p>
                <p className="mt-2 text-lg font-semibold text-[rgb(var(--app-text-rgb))]">{maintenancePrediction?.prediction || maintenancePrediction?.summary || "Prediction will appear here."}</p>
              </div>
              <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
                <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">AI reply</p>
                <p className="mt-2 text-sm text-[rgb(var(--app-text-rgb))]">{aiReply || "Ask the assistant for notices, insights or operational summaries."}</p>
              </div>
            </div>

            <form onSubmit={handleAskAssistant} className="space-y-3">
              <textarea
                value={assistantInput}
                onChange={(event) => setAssistantInput(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] px-4 py-3 text-sm text-[rgb(var(--app-text-rgb))] outline-none transition focus:border-[rgb(var(--app-primary-rgb))]"
                placeholder="Ask: Draft an urgent notice for a water outage, summarize open complaints, forecast collections, or suggest member follow-ups."
              />
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={assistantLoading} className="rounded-xl bg-[rgb(var(--app-primary-rgb))] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60">
                  {assistantLoading ? "Thinking..." : "Ask Assistant"}
                </button>
                <button type="button" onClick={runVoiceAssistant} className="rounded-xl border border-[rgb(var(--app-border-rgb))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--app-text-rgb))] transition-colors hover:border-[rgb(var(--app-primary-rgb))]">Voice</button>
                <button type="button" onClick={stopVoiceAssistant} className="rounded-xl border border-[rgb(var(--app-border-rgb))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--app-text-rgb))] transition-colors hover:border-[rgb(var(--app-primary-rgb))]">Stop</button>
              </div>
            </form>

            <div className="grid gap-3 sm:grid-cols-2">
              {toArray(aiWidgets).slice(0, 4).map((widget, index) => (
                <div key={widget?.id || index} className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
                  <p className="text-sm font-semibold text-[rgb(var(--app-text-rgb))]">{compactName(widget?.title || widget?.label || widget?.name || `Widget ${index + 1}`)}</p>
                  <p className="mt-1 text-xs text-[rgb(var(--app-text-muted-rgb))]">{compactName(widget?.summary || widget?.message || widget?.description || String(widget?.value || "AI driven insight"))}</p>
                </div>
              ))}
              {!toArray(aiWidgets).length ? <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">AI widgets will appear after the assistant service returns insights.</p> : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {aiRecommendations.slice(0, 4).map((item, index) => (
                <div key={item?.id || index} className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
                  <p className="text-sm font-semibold text-[rgb(var(--app-text-rgb))]">{compactName(item?.title || item?.name || item?.label || `Suggestion ${index + 1}`)}</p>
                  <p className="mt-1 text-xs text-[rgb(var(--app-text-muted-rgb))]">{compactName(item?.detail || item?.description || item?.reason || item?.value || "Suggested by AI")}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionCard eyebrow="Permissions" title="Role access matrix" description="Chairman and secretary privileges are separated by scope and leadership authority.">
          <div className="grid gap-4 md:grid-cols-2">
            <PermissionList title="Chairman permissions" items={ROLE_PERMISSIONS.chairman} tone="success" active={currentRole === "admin"} />
            <PermissionList title="Secretary permissions" items={ROLE_PERMISSIONS.secretary} tone="warning" active={currentRole === "secretary"} />
          </div>
        </SectionCard>

        <SectionCard eyebrow="Scope" title="Society metadata" description="The dashboard is always tied to the authenticated society context.">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
              <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">Society address</p>
              <p className="mt-2 text-sm font-semibold text-[rgb(var(--app-text-rgb))]">{society?.address || societyContext?.society?.address || "Not configured"}</p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
              <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">Contact</p>
              <p className="mt-2 text-sm font-semibold text-[rgb(var(--app-text-rgb))]">{society?.contact_phone || society?.contactPhone || society?.contact_email || society?.contactEmail || "Not configured"}</p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
              <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">Society ID</p>
              <p className="mt-2 text-sm font-semibold text-[rgb(var(--app-text-rgb))]">{society?.id || societyContext?.society?.id || "-"}</p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4">
              <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">Last sync</p>
              <p className="mt-2 text-sm font-semibold text-[rgb(var(--app-text-rgb))]">{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}

export default ChairmanSecretaryDashboardPage;