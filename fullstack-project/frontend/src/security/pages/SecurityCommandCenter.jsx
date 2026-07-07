import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import LanguageSelector from "../../components/LanguageSelector";
import PremiumNotificationButton from "../../components/common/PremiumNotificationButton";
import PremiumThemeToggle from "../../components/common/PremiumThemeToggle";
import { useThemeEngine } from "../../contexts/ThemeContext";
import {
  acknowledgeEmergencyAlert,
  checkInSecurityVisitor,
  checkOutSecurityVisitor,
  createSecurityVehicleEntry,
  createDelivery,
  createEmergencyAlert,
  fetchDeliveries,
  fetchEmergencyAlerts,
  fetchMySecurityLeaveRequests,
  fetchMySecurityShifts,
  fetchSecurityDashboard,
  fetchSecurityNotifications,
  fetchSecurityProfile,
  fetchSecurityVehicles,
  fetchSecurityVisitors,
  fetchVisitorRequests,
  markSecurityNotificationRead,
  resolveEmergencyAlert,
  searchSecurityResidents,
  securityCheckIn,
  securityCheckOut,
  updateDeliveryStatus,
} from "../../services/securityApi";
import {
  createVisitorEmergencyAlert,
  fetchSecurityPreapprovals,
  fetchVisitorAnalytics,
  fetchVisitorEmergencyAlerts,
} from "../../services/visitorApi";
import { getApiMessage } from "../../services/authApi";
import { clearAuthSession, getStoredUser } from "../../utils/session";
import "./security-command-center.css";

const sectionMeta = {
  dashboard: { title: "Dashboard", crumb: "Security / Dashboard" },
  visitors: { title: "Visitor Management", crumb: "Security / Visitors" },
  deliveries: { title: "Delivery Management", crumb: "Security / Deliveries" },
  vehicles: { title: "Vehicle Management", crumb: "Security / Vehicles" },
  staff: { title: "Staff Entry", crumb: "Security / Staff Entry" },
  attendance: { title: "Attendance", crumb: "Security / Attendance" },
  emergency: { title: "Emergency Center", crumb: "Security / Emergency" },
  notices: { title: "Notices", crumb: "Security / Notices" },
  shifts: { title: "Shift Management", crumb: "Security / Shifts" },
  profile: { title: "Profile", crumb: "Security / Profile" },
};

const navItems = [
  ["dashboard", "Dashboard", "DB"],
  ["visitors", "Visitor Management", "VM"],
  ["deliveries", "Delivery Management", "DL"],
  ["vehicles", "Vehicle Management", "VH"],
  ["staff", "Staff Entry", "ST"],
  ["attendance", "Attendance", "AT"],
  ["emergency", "Emergency Center", "EM"],
  ["notices", "Notices", "NT"],
  ["shifts", "Shift Management", "SF"],
  ["profile", "Profile", "PR"],
];

const staffFeatures = [
  "Housekeeping Entry",
  "Electrician Entry",
  "Plumber Entry",
  "Contractor Entry",
  "Vendor Entry",
  "Driver Entry",
  "Staff Attendance",
  "Entry History",
];

const emergencyFeatures = [
  "Fire Emergency",
  "Medical Emergency",
  "Security Threat",
  "Water Leakage",
  "Lift Emergency",
  "SOS",
  "Emergency Contacts",
];

const noticeFeatures = ["Society Notices", "Security Instructions", "Emergency Notices", "Read Status", "Attachments", "Notice Details"];
const smartFeatures = ["Face Photo Check-In", "Resident Approval", "Real-time Notifications", "Offline Entry Mode", "Camera Integration", "Push Notifications", "Audit Logs", "Multi-Gate Support", "Multi-Society Support"];

function unwrap(response) {
  if (Array.isArray(response)) return response;
  return response?.data ?? response ?? null;
}

function asArray(value) {
  const data = unwrap(value);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.logs)) return data.logs;
  return [];
}

function formatDateTime(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function formatDate(value) {
  if (!value) return "Not assigned";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString([], { dateStyle: "medium" });
}

function statusCount(items, statuses) {
  const normalized = new Set(statuses.map((item) => String(item).toLowerCase()));
  return items.filter((item) => normalized.has(String(item.status || item.approval_status || "").toLowerCase())).length;
}

function textValue(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") || "Not available";
}

function calculateHours(startValue, endValue = new Date()) {
  if (!startValue) return 0;
  const start = new Date(startValue);
  const end = endValue instanceof Date ? endValue : new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return 0;
  return Math.round(((end.getTime() - start.getTime()) / 3600000) * 10) / 10;
}

function useClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}

function SecurityCommandCenter() {
  const theme = useThemeEngine();
  const user = getStoredUser();
  const now = useClock();
  const [collapsed, setCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState(() => getSectionFromHash());
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [logoutOpen, setLogoutOpen] = useState(false);
  const calendarRef = useRef(null);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);
  const [records, setRecords] = useState({
    dashboard: null,
    profile: null,
    visitorLogs: [],
    visitorRequests: [],
    preapprovals: [],
    deliveries: [],
    deliveryEntries: [],
    vehicles: [],
    alerts: [],
    visitorAlerts: [],
    shifts: [],
    leaveRequests: [],
    notifications: [],
    analytics: null,
  });

  useEffect(() => {
    function syncHash() {
      setActiveSection(getSectionFromHash());
    }
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const loadData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setRefreshing(silent);
    setError("");

    const calls = await Promise.allSettled([
      fetchSecurityDashboard(),
      fetchSecurityProfile(),
      fetchSecurityVisitors({ limit: 20 }),
      fetchVisitorRequests(),
      fetchSecurityPreapprovals(),
      fetchDeliveries(),
      Promise.resolve({ data: [] }),
      fetchSecurityVehicles(),
      fetchEmergencyAlerts(),
      fetchVisitorEmergencyAlerts(),
      fetchMySecurityShifts(),
      fetchMySecurityLeaveRequests(),
      fetchSecurityNotifications(),
      fetchVisitorAnalytics(),
    ]);

    const next = {
      dashboard: calls[0].status === "fulfilled" ? unwrap(calls[0].value) : null,
      profile: calls[1].status === "fulfilled" ? unwrap(calls[1].value) : null,
      visitorLogs: calls[2].status === "fulfilled" ? asArray(calls[2].value) : [],
      visitorRequests: calls[3].status === "fulfilled" ? asArray(calls[3].value) : [],
      preapprovals: calls[4].status === "fulfilled" ? asArray(calls[4].value) : [],
      deliveries: calls[5].status === "fulfilled" ? asArray(calls[5].value) : [],
      deliveryEntries: calls[6].status === "fulfilled" ? asArray(calls[6].value) : [],
      vehicles: calls[7].status === "fulfilled" ? asArray(calls[7].value) : [],
      alerts: calls[8].status === "fulfilled" ? asArray(calls[8].value) : [],
      visitorAlerts: calls[9].status === "fulfilled" ? asArray(calls[9].value) : [],
      shifts: calls[10].status === "fulfilled" ? asArray(calls[10].value) : [],
      leaveRequests: calls[11].status === "fulfilled" ? asArray(calls[11].value) : [],
      notifications: calls[12].status === "fulfilled" ? asArray(calls[12].value) : [],
      analytics: calls[13].status === "fulfilled" ? unwrap(calls[13].value) : null,
    };

    setRecords(next);
    calls.forEach((call, index) => {
      if (call.status === "rejected") {
        console.warn("[SecurityDashboard] Panel unavailable", {
          panel: index,
          message: getApiMessage(call.reason, "Panel unavailable"),
        });
      }
    });
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const metrics = useMemo(() => buildMetrics(records), [records]);
  const meta = sectionMeta[activeSection] || sectionMeta.dashboard;
  const guardProfile = records.profile || user || {};
  const unreadCount = records.notifications.filter((item) => !item.is_read).length;
  const attendanceSummary = useMemo(() => buildAttendanceSummary(records, now), [records, now]);
  const calendarEvents = useMemo(() => buildTopbarCalendarEvents(records), [records]);

  useEffect(() => {
    function closeFloatingControls(event) {
      const target = event.target;
      if (calendarOpen && calendarRef.current && !calendarRef.current.contains(target)) {
        setCalendarOpen(false);
      }
      if (notificationOpen && notificationRef.current && !notificationRef.current.contains(target)) {
        setNotificationOpen(false);
      }
      if (profileOpen && profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setCalendarOpen(false);
        setNotificationOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", closeFloatingControls);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeFloatingControls);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [calendarOpen, notificationOpen, profileOpen]);

  function goTo(section) {
    const nextUrl = section === "dashboard" ? window.location.pathname : `${window.location.pathname}#${section}`;
    window.history.pushState(null, "", nextUrl);
    setActiveSection(section);
  }

  async function action(label, handler) {
    setError("");
    try {
      const result = await handler();
      pushToast("success", label);
      await loadData({ silent: true });
      return result;
    } catch (actionError) {
      const message = getApiMessage(actionError, "Action could not be completed.");
      setError(message);
      pushToast("error", message);
      return null;
    }
  }

  function pushToast(type, message) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, type, message }].slice(-4));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2800);
  }

  async function markAllNotificationsRead() {
    const unread = records.notifications.filter((item) => !item.is_read && item.id);
    if (!unread.length) return;
    await action("All notifications marked as read.", () => Promise.all(unread.map((item) => markSecurityNotificationRead(item.id))));
  }

  function openCalendar() {
    setCalendarOpen((value) => !value);
    setNotificationOpen(false);
    setProfileOpen(false);
  }

  function openNotifications() {
    setNotificationOpen((value) => !value);
    setCalendarOpen(false);
    setProfileOpen(false);
  }

  function openProfile() {
    setProfileOpen((value) => !value);
    setCalendarOpen(false);
    setNotificationOpen(false);
  }

  function handleLogout() {
    clearAuthSession();
    sessionStorage.setItem("loginSuccessMessage", "Logged out successfully.");
    window.location.href = "/login";
  }

  return (
    <div className="sg-shell">
      <aside className={`sg-sidebar ${collapsed ? "is-collapsed" : ""}`} aria-label="Security navigation">
        <div className="sg-brand">
          <span className="sg-brand-mark">NX</span>
          <span className="sg-brand-text">
            <strong>Nexora</strong>
            <em>Guard Console</em>
          </span>
          <button className="sg-icon-btn" type="button" onClick={() => setCollapsed((value) => !value)} aria-label="Toggle sidebar">
            <span aria-hidden="true">{collapsed ? ">" : "<"}</span>
          </button>
        </div>

        <nav className="sg-nav">
          {navItems.map(([id, label, icon]) => (
            <button key={id} type="button" className={activeSection === id ? "is-active" : ""} onClick={() => goTo(id)}>
              <span className="sg-nav-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sg-assignment-card">
          <span className="sg-status-dot" aria-hidden="true" />
          <p>Assigned Society</p>
          <strong>{textValue(guardProfile.society_name, guardProfile.societyName, user?.societyName)}</strong>
          <dl>
            <div><dt>Society Code</dt><dd>{textValue(guardProfile.society_code, user?.societyCode)}</dd></div>
            <div><dt>Assigned Gate</dt><dd>{textValue(guardProfile.assigned_gate, guardProfile.gate, "Main Gate")}</dd></div>
            <div><dt>Guard Name</dt><dd>{textValue(guardProfile.name, guardProfile.userName, user?.name)}</dd></div>
            <div><dt>Online Status</dt><dd>Online</dd></div>
          </dl>
        </div>
      </aside>

      <div className="sg-main">
        <header className="sg-topbar">
          <div>
            <p>{meta.crumb}</p>
            <h1>{meta.title}</h1>
          </div>
          <div className="sg-topbar-actions">
            <div className="sg-popover-wrap" ref={calendarRef}>
              <button
                className="sg-clock-card"
                type="button"
                onClick={openCalendar}
                aria-haspopup="dialog"
                aria-expanded={calendarOpen}
                aria-label="Open calendar"
              >
                <Icon name="calendar" />
                <time dateTime={now.toISOString()}>
                  <span>{now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span>
                  <strong>{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong>
                </time>
              </button>
              {calendarOpen ? (
                <CalendarDropdown
                  month={calendarMonth}
                  selectedDate={selectedDate}
                  events={calendarEvents}
                  onMonthChange={setCalendarMonth}
                  onSelectedDateChange={setSelectedDate}
                  onToday={() => {
                    const today = new Date();
                    setSelectedDate(today);
                    setCalendarMonth(startOfMonth(today));
                  }}
                  onViewShifts={() => {
                    setCalendarOpen(false);
                    goTo("shifts");
                  }}
                />
              ) : null}
            </div>
            <div className="sg-popover-wrap" ref={notificationRef}>
              <PremiumNotificationButton
                notifications={records.notifications}
                unreadCount={unreadCount}
                open={notificationOpen}
                onOpenChange={(nextOpen) => {
                  if (nextOpen) openNotifications();
                  else setNotificationOpen(false);
                }}
                onMarkAllRead={markAllNotificationsRead}
                onViewAll={() => {
                  setNotificationOpen(false);
                  goTo("notices");
                }}
                onMarkRead={(_, item) => action("Notification marked as read.", () => markSecurityNotificationRead(item.id))}
              />
            </div>
            <button className="sg-ai-btn" type="button" onClick={() => goTo("dashboard")}>Nexora AI</button>
            <PremiumThemeToggle />
            <LanguageSelector className="sg-language" supportedCodes={["en", "hi", "mr", "gu"]} />
            <div className="sg-popover-wrap" ref={profileRef}>
              <button className="sg-profile-btn" type="button" onClick={openProfile} aria-haspopup="dialog" aria-expanded={profileOpen} aria-label="Open profile menu">
                <span>{initials(textValue(guardProfile.name, user?.name, "Guard"))}</span>
              </button>
              {profileOpen ? (
                <Popover title="Profile">
                  <div className="sg-profile-menu">
                    <strong>{textValue(guardProfile.name, user?.name)}</strong>
                    <span>{textValue(guardProfile.email, user?.email)}</span>
                    <button type="button" onClick={() => goTo("profile")}>Open profile</button>
                    <button className="sg-danger-btn" type="button" onClick={() => setLogoutOpen(true)}>Logout</button>
                  </div>
                </Popover>
              ) : null}
            </div>
          </div>
        </header>

        {error ? <span className="sg-screen-reader-status" role="status">{error}</span> : null}

        <main className="sg-content">
          {activeSection === "dashboard" ? <DashboardView loading={loading} refreshing={refreshing} metrics={metrics} records={records} goTo={goTo} reload={() => loadData({ silent: true })} /> : null}
          {activeSection === "visitors" ? <VisitorsView loading={loading} records={records} action={action} /> : null}
          {activeSection === "deliveries" ? <DeliveriesView loading={loading} records={records} action={action} /> : null}
          {activeSection === "vehicles" ? <VehiclesView loading={loading} records={records} action={action} /> : null}
          {activeSection === "staff" ? <FeatureWorkflow title="Staff Entry" features={staffFeatures} records={[]} loading={loading} empty="No staff entry records are available from the backend yet." /> : null}
          {activeSection === "attendance" ? <AttendanceView loading={loading} records={records} summary={attendanceSummary} action={action} /> : null}
          {activeSection === "emergency" ? <EmergencyView loading={loading} records={records} action={action} /> : null}
          {activeSection === "notices" ? <NoticesView loading={loading} records={records} /> : null}
          {activeSection === "shifts" ? <ShiftsView loading={loading} records={records} action={action} /> : null}
          {activeSection === "profile" ? <ProfileView loading={loading} profile={guardProfile} shifts={records.shifts} /> : null}
        </main>
      </div>

      {logoutOpen ? (
        <div className="sg-modal-backdrop" role="presentation">
          <section className="sg-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="sg-logout-title">
            <span className="sg-confirm-icon">LO</span>
            <h2 id="sg-logout-title">Logout from guard console?</h2>
            <p>Your current local session will be cleared and you will be redirected to the login page.</p>
            <div className="sg-confirm-actions">
              <button type="button" onClick={() => setLogoutOpen(false)}>Cancel</button>
              <button className="sg-danger-btn" type="button" onClick={handleLogout}>Logout</button>
            </div>
          </section>
        </div>
      ) : null}
      <ToastViewport toasts={toasts} onClose={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
    </div>
  );
}

function getSectionFromHash() {
  const hash = window.location.hash.replace("#", "").trim().toLowerCase();
  return sectionMeta[hash] ? hash : "dashboard";
}

function initials(name) {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Icon({ name }) {
  const common = {
    className: "sg-svg-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };
  const paths = {
    calendar: <><rect x="3" y="4" width="18" height="18" rx="4" /><path d="M8 2v4M16 2v4M3 10h18" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
    moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" />,
    desktop: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    alert: <><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    package: <><path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></>,
    userCheck: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m16 11 2 2 4-4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    notice: <><path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  };

  return <svg {...common}>{paths[name] || paths.notice}</svg>;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function dateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSameDate(a, b) {
  return dateKey(a) === dateKey(b);
}

function buildMonthGrid(month) {
  const first = startOfMonth(month);
  const gridStart = new Date(first);
  gridStart.setDate(1 - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return { date, inMonth: date.getMonth() === month.getMonth() };
  });
}

function addCalendarEvent(map, value, type, label) {
  const key = dateKey(value);
  if (!key) return;
  const existing = map.get(key) || [];
  existing.push({ type, label });
  map.set(key, existing);
}

function buildTopbarCalendarEvents(records) {
  const events = new Map();
  records.notifications.forEach((item) => addCalendarEvent(events, item.created_at, "notice", textValue(item.title, "Security notice")));
  records.shifts.forEach((item) => addCalendarEvent(events, item.shift_date, "shift", `${textValue(item.shift_type, "Shift")} ${textValue(item.start_time, "")}`.trim()));
  (records.dashboard?.holidays || []).forEach((item) => addCalendarEvent(events, item.holiday_date, "holiday", textValue(item.title, "Holiday")));
  [...records.visitorRequests, ...records.preapprovals].forEach((item) => addCalendarEvent(events, item.expected_at || item.visit_date || item.created_at, "visitor", textValue(item.visitor_name, "Visitor appointment")));
  return events;
}

function notificationType(item) {
  const text = `${item.category || ""} ${item.related_type || ""} ${item.title || ""}`.toLowerCase();
  if (text.includes("emergency") || text.includes("alert")) return "emergency";
  if (text.includes("delivery") || text.includes("package")) return "delivery";
  if (text.includes("attendance") || text.includes("shift")) return "attendance";
  if (text.includes("visitor") || text.includes("approval")) return "visitor";
  return "notice";
}

function notificationIcon(item) {
  const type = notificationType(item);
  if (type === "emergency") return "alert";
  if (type === "delivery") return "package";
  if (type === "attendance") return "clock";
  if (type === "visitor") return "userCheck";
  return "notice";
}

function buildMetrics(records) {
  const dashboardMetrics = records.dashboard?.metrics || {};
  const logsToday = records.visitorLogs.filter((item) => isToday(item.entry_time || item.created_at));
  const deliveriesToday = [...records.deliveries, ...records.deliveryEntries].filter((item) => isToday(item.created_at || item.updated_at));
  const vehicleToday = records.vehicles.filter((item) => isToday(item.entry_time || item.created_at));
  const alerts = [...records.alerts, ...records.visitorAlerts];

  return {
    todayVisitors: logsToday.length,
    visitorsInside: statusCount(records.visitorLogs, ["in_premises", "checked_in", "inside"]),
    deliveriesToday: deliveriesToday.length,
    vehicleEntries: vehicleToday.length,
    emergencyAlerts: dashboardMetrics.activeAlerts ?? statusCount(alerts, ["active", "acknowledged"]),
    pendingApprovals: dashboardMetrics.pendingVisitorApprovals ?? statusCount([...records.visitorRequests, ...records.preapprovals], ["pending"]),
  };
}

function buildAttendanceSummary(records, now = new Date()) {
  const attendance = records.dashboard?.attendance || null;
  const checkIn = attendance?.check_in_at || attendance?.checkInAt || null;
  const checkOut = attendance?.check_out_at || attendance?.checkOutAt || null;
  const workingHours = calculateHours(checkIn, checkOut || now);
  const lateArrival = checkIn ? new Date(checkIn).getHours() >= 9 : false;
  const overtime = Math.max(0, Math.round((workingHours - 8) * 10) / 10);
  const leaveDays = records.leaveRequests.filter((item) => ["approved", "leave"].includes(String(item.status).toLowerCase())).length;
  const presentDays = attendance?.status ? 1 : 0;
  const absentDays = presentDays ? 0 : 1;
  const lateDays = lateArrival ? 1 : 0;
  const attendancePercent = Math.round((presentDays / Math.max(1, presentDays + absentDays + leaveDays)) * 100);

  return {
    attendance,
    workingHours,
    overtime,
    presentDays,
    absentDays,
    leaveDays,
    lateDays,
    attendancePercent,
    breakStatus: "Ready",
  };
}

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function DashboardView({ loading, refreshing, metrics, records, goTo, reload }) {
  const kpis = [
    ["Today's Visitors", metrics.todayVisitors, "Visitor entries recorded today", "visitors"],
    ["Visitors Inside", metrics.visitorsInside, "Currently checked in", "visitors"],
    ["Deliveries Today", metrics.deliveriesToday, "Packages logged today", "deliveries"],
    ["Vehicle Entries", metrics.vehicleEntries, "Vehicles recorded today", "vehicles"],
    ["Emergency Alerts", metrics.emergencyAlerts, "Active emergency records", "emergency"],
    ["Pending Visitor Approvals", metrics.pendingApprovals, "Resident approval queue", "visitors"],
  ];

  return (
    <div className="sg-dashboard">
      <section className="sg-kpi-grid">
        {kpis.map(([label, value, helper, target]) => (
          <button key={label} className="sg-kpi" type="button" onClick={() => goTo(target)}>
            <span>{label}</span>
            {loading ? <SkeletonLine /> : <strong>{value}</strong>}
            <em>{helper}</em>
          </button>
        ))}
      </section>

      <section className="sg-panel-grid sg-panel-grid-four">
        <ActivityPanel title="Today's Visitor Activity" items={records.visitorLogs.filter((item) => isToday(item.entry_time || item.created_at))} loading={loading} empty="No visitor activity recorded today." />
        <ActivityPanel title="Recent Deliveries" items={[...records.deliveries, ...records.deliveryEntries]} loading={loading} empty="No delivery records available." />
        <ChartPanel title="Gate Activity" items={records.visitorLogs} loading={loading} groupKey="wing" empty="No gate records available." />
        <ChartPanel title="Vehicle Movement" items={records.vehicles} loading={loading} groupKey="status" empty="No vehicle movement recorded." />
      </section>

      <section className="sg-panel-grid sg-panel-grid-four">
        <SummaryPanel title="Security Notices" items={records.notifications} loading={loading} empty="No notices for your guard profile." />
        <SummaryPanel title="Upcoming Shift" items={records.shifts} loading={loading} empty="No upcoming shifts assigned." />
        <AttendanceMiniPanel loading={loading} records={records} />
        <ActivityPanel title="Recent Entry Logs" items={[...records.visitorLogs, ...records.vehicles]} loading={loading} empty="No recent entry logs found." />
      </section>

      <section className="sg-panel-grid sg-panel-grid-four sg-panel-grid-final">
        <QuickStatsPanel loading={loading} metrics={metrics} records={records} />
        <ChartPanel title="Visitor Trend" items={records.visitorLogs} loading={loading} groupKey="status" empty="No visitor trend data yet." />
        <ChartPanel title="Vehicle Trend" items={records.vehicles} loading={loading} groupKey="status" empty="No vehicle trend data yet." />
        <SummaryPanel title="Emergency Summary" items={[...records.alerts, ...records.visitorAlerts]} loading={loading} empty="No emergency alerts are active." />
      </section>

      <section className="sg-panel-grid sg-panel-grid-four sg-panel-grid-final">
        <ActivityPanel title="Recent Activities" items={[...records.notifications, ...records.alerts, ...records.visitorLogs]} loading={loading} empty="No recent activity found." />
        <SmartFeaturesPanel />
        <AIPanel loading={loading} records={records} refreshing={refreshing} reload={reload} />
      </section>
    </div>
  );
}

function AttendanceMiniPanel({ loading, records }) {
  const summary = buildAttendanceSummary(records);
  return (
    <section className="sg-panel">
      <div className="sg-panel-head"><span>Attendance Summary</span><strong>{summary.attendancePercent}%</strong></div>
      {loading ? <SkeletonBlock /> : (
        <div className="sg-stat-stack">
          <div><span>Working Hours</span><strong>{summary.workingHours}h</strong></div>
          <div><span>Overtime</span><strong>{summary.overtime}h</strong></div>
          <div><span>Late Days</span><strong>{summary.lateDays}</strong></div>
        </div>
      )}
    </section>
  );
}

function QuickStatsPanel({ loading, metrics, records }) {
  const stats = [
    ["Open Alerts", metrics.emergencyAlerts],
    ["Unread Notifications", records.notifications.filter((item) => !item.is_read).length],
    ["Upcoming Shifts", records.shifts.length],
    ["Pending Deliveries", statusCount([...records.deliveries, ...records.deliveryEntries], ["pending"])],
  ];
  return (
    <section className="sg-panel">
      <div className="sg-panel-head"><span>Quick Statistics</span><strong>Live</strong></div>
      {loading ? <SkeletonBlock /> : <div className="sg-mini-grid">{stats.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>}
    </section>
  );
}

function SmartFeaturesPanel() {
  return (
    <section className="sg-panel">
      <div className="sg-panel-head"><span>Smart Features</span><strong>{smartFeatures.length}</strong></div>
      <div className="sg-chip-cloud">
        {smartFeatures.map((feature) => <span key={feature}>{feature}</span>)}
      </div>
    </section>
  );
}

function CalendarDropdown({ month, selectedDate, events, onMonthChange, onSelectedDateChange, onToday, onViewShifts }) {
  const days = buildMonthGrid(month);
  const monthLabel = month.toLocaleDateString([], { month: "long", year: "numeric" });
  const selectedEvents = events.get(dateKey(selectedDate)) || [];

  return (
    <div className="sg-calendar-popover sg-glass-popover" role="dialog" aria-label="Security calendar">
      <div className="sg-calendar-head">
        <div>
          <span>Guard Calendar</span>
          <strong>{monthLabel}</strong>
        </div>
        <div className="sg-calendar-nav">
          <button type="button" onClick={() => onMonthChange(addMonths(month, -1))} aria-label="Previous month">
            <Icon name="chevronLeft" />
          </button>
          <button type="button" onClick={() => onMonthChange(addMonths(month, 1))} aria-label="Next month">
            <Icon name="chevronRight" />
          </button>
        </div>
      </div>

      <div className="sg-calendar-weekdays" aria-hidden="true">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="sg-calendar-month-grid">
        {days.map((day) => {
          const key = dateKey(day.date);
          const dayEvents = events.get(key) || [];
          const classes = [
            "sg-calendar-date",
            day.inMonth ? "" : "is-muted",
            isSameDate(day.date, new Date()) ? "is-today" : "",
            isSameDate(day.date, selectedDate) ? "is-selected" : "",
          ].filter(Boolean).join(" ");
          return (
            <button
              type="button"
              className={classes}
              key={key}
              onClick={() => onSelectedDateChange(day.date)}
              aria-label={`${day.date.toLocaleDateString([], { dateStyle: "full" })}, ${dayEvents.length} events`}
            >
              <span>{day.date.getDate()}</span>
              {dayEvents.length ? (
                <i className="sg-event-dots" aria-hidden="true">
                  {dayEvents.slice(0, 4).map((event, index) => <b className={`is-${event.type}`} key={`${event.type}-${index}`} />)}
                </i>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="sg-calendar-event-list">
        <strong>{selectedDate.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}</strong>
        {selectedEvents.length ? selectedEvents.slice(0, 4).map((event, index) => (
          <span className={`is-${event.type}`} key={`${event.label}-${index}`}>{event.label}</span>
        )) : <em>No scheduled guard events</em>}
      </div>

      <div className="sg-calendar-footer">
        <button type="button" onClick={onToday}>Today</button>
        <button type="button" onClick={onViewShifts}>View Shift Calendar</button>
      </div>
    </div>
  );
}

function NotificationCenter({ loading, items, unreadCount, onMarkAllRead, onViewAll, onMarkRead }) {
  const channels = [
    ["visitor", "Visitor approval"],
    ["delivery", "Delivery update"],
    ["emergency", "Emergency alert"],
    ["attendance", "Attendance reminder"],
    ["notice", "Security notice"],
  ];
  const visibleItems = items.slice(0, 6);

  return (
    <div className="sg-notification-popover sg-glass-popover" role="dialog" aria-label="Notification center">
      <div className="sg-notification-head">
        <div>
          <span>Notification Center</span>
          <strong>{unreadCount} unread</strong>
        </div>
        <button type="button" onClick={onMarkAllRead} disabled={!unreadCount}>Mark all as read</button>
      </div>

      <div className="sg-notification-channels" aria-label="Notification categories">
        {channels.map(([type, label]) => <span className={`is-${type}`} key={type}>{label}</span>)}
      </div>

      {loading ? <SkeletonBlock /> : (
        <div className="sg-notification-list">
          {visibleItems.length ? visibleItems.map((item) => {
            const isUnread = !item.is_read;
            return (
              <article className={isUnread ? "is-unread" : ""} key={item.id || item.title}>
                <span className={`sg-notification-type is-${notificationType(item)}`} aria-hidden="true"><Icon name={notificationIcon(item)} /></span>
                <div>
                  <strong>{textValue(item.title, item.alert_type, item.category)}</strong>
                  <p>{textValue(item.message, item.priority, "Security update")}</p>
                  <small>{formatDateTime(item.created_at)}</small>
                </div>
                {isUnread ? <button type="button" onClick={() => onMarkRead(item)}>Read</button> : null}
              </article>
            );
          }) : <EmptyState message="No security notifications are pending." />}
        </div>
      )}

      <button className="sg-view-all-btn" type="button" onClick={onViewAll}>View all notifications</button>
    </div>
  );
}

function AttendanceView({ loading, records, summary, action }) {
  const calendarDays = buildAttendanceCalendar(summary);
  const rules = ["8 Hours Duty", "2 Paid Leaves", "1 Half Leave", "Weekly Off", "Overtime Rules"];
  const stats = [
    ["Present Days", summary.presentDays],
    ["Absent Days", summary.absentDays],
    ["Leave Days", summary.leaveDays],
    ["Late Days", summary.lateDays],
    ["Overtime", `${summary.overtime}h`],
    ["Working Hours", `${summary.workingHours}h`],
  ];

  return (
    <div className="sg-page-grid">
      <section className="sg-panel sg-span-4 sg-attendance-hero">
        <div>
          <span>Attendance</span>
          <h2>{summary.attendance?.status || "Ready for duty"}</h2>
          <p>8 hour duty target with leave, late arrival, break, and overtime tracking.</p>
        </div>
        <div className="sg-actions-row">
          <button type="button" onClick={() => action("Check-in recorded.", () => securityCheckIn("Attendance page check-in"))}>Check In</button>
          <button type="button" onClick={() => action("Check-out recorded.", () => securityCheckOut("Attendance page check-out"))}>Check Out</button>
          <button type="button" onClick={() => action("Break started.", () => Promise.resolve())}>Break Start</button>
          <button type="button" onClick={() => action("Break ended.", () => Promise.resolve())}>Break End</button>
        </div>
      </section>

      <section className="sg-kpi-grid sg-span-4 sg-attendance-stats">
        {stats.map(([label, value]) => (
          <div className="sg-kpi" key={label}>
            <span>{label}</span>
            {loading ? <SkeletonLine /> : <strong>{value}</strong>}
            <em>{label === "Working Hours" ? `${summary.attendancePercent}% attendance` : "Current month"}</em>
          </div>
        ))}
      </section>

      <section className="sg-panel sg-span-4">
        <div className="sg-panel-head"><span>Monthly Attendance Calendar</span><strong>{new Date().toLocaleDateString([], { month: "long", year: "numeric" })}</strong></div>
        {loading ? <SkeletonBlock /> : (
          <>
            <div className="sg-calendar-grid">
              {calendarDays.map((day) => (
                <div className={`sg-calendar-day is-${day.status}`} key={day.day}>
                  <strong>{day.day}</strong>
                  <span>{day.label}</span>
                </div>
              ))}
            </div>
            <div className="sg-calendar-legend">
              <span className="is-present">Present</span>
              <span className="is-absent">Absent</span>
              <span className="is-half">Half Day</span>
              <span className="is-leave">Leave</span>
              <span className="is-holiday">Holiday</span>
              <span className="is-off">Weekly Off</span>
            </div>
          </>
        )}
      </section>

      <FeatureWorkflow title="Attendance Rules" features={rules} records={records.leaveRequests} loading={loading} empty="No attendance exceptions or leave records are available." />
    </div>
  );
}

function buildAttendanceCalendar(summary) {
  const today = new Date();
  const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return Array.from({ length: totalDays }, (_, index) => {
    const day = index + 1;
    const date = new Date(today.getFullYear(), today.getMonth(), day);
    const isPast = day < today.getDate();
    const isTodayDay = day === today.getDate();
    const isOff = [0].includes(date.getDay());
    let status = isOff ? "off" : isPast ? "absent" : "future";
    let label = isOff ? "Off" : isPast ? "Absent" : "Scheduled";

    if (isTodayDay) {
      status = summary.attendance?.status ? "present" : "half";
      label = summary.attendance?.status ? "Present" : "Pending";
    }

    return { day, status, label };
  });
}

function VisitorFaceCapture({ photoPreview, onPhoto, onClear }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => () => stopCamera(streamRef), []);

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError("Camera permission denied or unavailable. Upload a visitor photo manually.");
      setCameraActive(false);
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      setCameraError("Camera preview is not ready yet.");
      return;
    }
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError("Could not capture photo. Please try again.");
        return;
      }
      const file = new File([blob], `visitor-face-${Date.now()}.jpg`, { type: "image/jpeg" });
      onPhoto(file, URL.createObjectURL(file));
      stopCamera(streamRef);
      setCameraActive(false);
    }, "image/jpeg", 0.9);
  }

  function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCameraError("Please upload a JPG or PNG visitor photo.");
      return;
    }
    onPhoto(file, URL.createObjectURL(file));
    setCameraError("");
  }

  function retake() {
    onClear();
    startCamera();
  }

  return (
    <div className="sg-face-capture">
      <div className="sg-face-preview">
        {photoPreview ? <img src={photoPreview} alt="Captured visitor face" /> : <video ref={videoRef} muted playsInline />}
        <canvas ref={canvasRef} hidden />
      </div>
      {cameraError ? <p className="sg-inline-error">{cameraError}</p> : null}
      <div className="sg-actions-row">
        <button type="button" onClick={startCamera} disabled={cameraActive}>Start Camera</button>
        <button type="button" onClick={capturePhoto} disabled={!cameraActive}>Capture Photo</button>
        <button type="button" onClick={retake} disabled={!photoPreview}>Retake</button>
        <label className="sg-upload-btn">
          Upload Photo
          <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleUpload} />
        </label>
      </div>
      <p className="sg-helper-text">A captured or uploaded face photo is required before visitor check-in.</p>
    </div>
  );
}

function VisitorDrawer({ visitor, onClose }) {
  const timeline = [
    ["Check-In", visitor.entry_time || visitor.created_at],
    ["Approval", visitor.approval_status],
    ["Status", visitor.status],
    ["Check-Out", visitor.exit_time],
  ];

  return (
    <div className="sg-drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside className="sg-visitor-drawer" role="dialog" aria-modal="true" aria-label="Visitor details" onMouseDown={(event) => event.stopPropagation()}>
        <button className="sg-drawer-close" type="button" onClick={onClose} aria-label="Close visitor details">Close</button>
        {visitor.photo_url ? <img src={visitor.photo_url} alt="" /> : <div className="sg-drawer-avatar">{initials(textValue(visitor.visitor_name, "Visitor"))}</div>}
        <h2>{textValue(visitor.visitor_name)}</h2>
        <p>{textValue(visitor.purpose)} / {textValue(visitor.phone)}</p>
        <div className="sg-drawer-grid">
          <div><span>Visitor ID</span><strong>{textValue(visitor.visitor_id, visitor.id)}</strong></div>
          <div><span>Resident</span><strong>{textValue(visitor.resident_name, visitor.person_to_meet)}</strong></div>
          <div><span>Flat</span><strong>{textValue(visitor.wing)} {textValue(visitor.flat_number)}</strong></div>
          <div><span>Status</span><strong>{textValue(visitor.status)}</strong></div>
        </div>
        <div className="sg-drawer-timeline">
          {timeline.map(([label, value]) => (
            <div key={label}>
              <span />
              <strong>{label}</strong>
              <em>{label.includes("Status") || label.includes("Approval") ? textValue(value) : formatDateTime(value)}</em>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function stopCamera(streamRef) {
  if (!streamRef.current) return;
  streamRef.current.getTracks().forEach((track) => track.stop());
  streamRef.current = null;
}

function buildVisitorStats(visitors, approvals) {
  return [
    ["Today's Visitors", visitors.filter((item) => isToday(item.entry_time || item.created_at)).length],
    ["Visitors Inside", visitors.filter((item) => ["in_premises", "pending_approval"].includes(String(item.status).toLowerCase())).length],
    ["Pending Approval", [
      ...visitors.filter((item) => String(item.approval_status).toLowerCase() === "pending"),
      ...approvals.filter((item) => String(item.status).toLowerCase() === "pending"),
    ].length],
    ["Checked Out", visitors.filter((item) => ["checked_out", "exited"].includes(String(item.status).toLowerCase())).length],
  ];
}

function filterVisitors(items, filters) {
  return items.filter((item) => {
    const status = String(item.status || item.approval_status || "").toLowerCase();
    if (filters.status !== "all" && status !== filters.status) return false;
    const resident = `${item.resident_name || ""} ${item.person_to_meet || ""}`.toLowerCase();
    if (filters.resident && !resident.includes(filters.resident.toLowerCase())) return false;
    if (filters.date && dateKey(item.entry_time || item.created_at) !== filters.date) return false;
    const haystack = `${item.visitor_name || ""} ${item.phone || ""} ${item.visitor_id || ""} ${item.flat_number || ""}`.toLowerCase();
    if (filters.search && !haystack.includes(filters.search.toLowerCase())) return false;
    return true;
  });
}

function toResidentCard(resident) {
  if (!resident) return null;
  return {
    residentId: resident.resident_id || resident.residentId || "",
    flatId: resident.flat_id || resident.flatId || "",
    residentName: resident.resident_name || resident.residentName || "",
    residentPhone: resident.resident_phone || resident.residentPhone || "",
    wing: resident.wing || "",
    floor: resident.floor || "",
    flatNumber: resident.flat_number || resident.flatNumber || "",
    ownerTenant: resident.owner_tenant || resident.ownerTenant || "",
    societyName: resident.society_name || resident.societyName || "",
    approvalStatus: resident.approval_status || resident.approvalStatus || "",
  };
}

function ResidentPicker({ value, onChange, compact = false }) {
  const selected = toResidentCard(value);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [state, setState] = useState({ loading: false, message: "" });

  useEffect(() => {
    const term = query.trim();
    if (!term) return undefined;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await searchSecurityResidents(term);
        const rows = asArray(response);
        if (cancelled) return;
        setResults(rows);
        setState({
          loading: false,
          message: rows.length ? "" : "Resident is not registered in this society. Please contact Chairman/Secretary.",
        });
      } catch (error) {
        if (cancelled) return;
        setResults([]);
        setState({
          loading: false,
          message: getApiMessage(error, "Resident is not registered in this society. Please contact Chairman/Secretary."),
        });
      }
    }, 240);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  function selectResident(resident) {
    const next = toResidentCard(resident);
    onChange(next);
    setQuery(`${next.residentName} / ${next.wing || "-"} ${next.flatNumber || "-"}`);
    setResults([]);
    setState({ loading: false, message: "" });
  }

  function handleQueryChange(event) {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    onChange(null);
    if (!nextQuery.trim()) {
      setResults([]);
      setState({ loading: false, message: "" });
    } else {
      setState({ loading: true, message: "" });
    }
  }

  return (
    <div className={compact ? "sg-resident-select is-compact" : "sg-resident-select"}>
      <label>
        <span>Select Resident / Flat</span>
        <input value={query} onChange={handleQueryChange} placeholder="Search name, mobile, wing, floor, or flat" />
      </label>
      {state.loading ? <p className="sg-helper-text">Searching registered residents...</p> : null}
      {results.length ? (
        <div className="sg-resident-results" role="listbox">
          {results.map((resident) => (
            <button type="button" key={`${resident.resident_id}-${resident.flat_id}`} onClick={() => selectResident(resident)}>
              <strong>{textValue(resident.resident_name)}</strong>
              <span>{textValue(resident.resident_phone)} / {textValue(resident.wing)} wing, floor {textValue(resident.floor)}, flat {textValue(resident.flat_number)}</span>
            </button>
          ))}
        </div>
      ) : null}
      {state.message ? <p className="sg-inline-error">{state.message}</p> : null}
      {selected?.residentId ? (
        <div className="sg-selected-resident-card">
          <strong>{selected.residentName}</strong>
          <span>{selected.flatNumber} / Wing {selected.wing || "-"} / Floor {selected.floor || "-"}</span>
          <span>{textValue(selected.ownerTenant)} / {textValue(selected.residentPhone)}</span>
        </div>
      ) : null}
    </div>
  );
}

function VisitorsView({ loading, records, action }) {
  const emptyEntry = { visitorName: "", phone: "", visitorEmail: "", purpose: "", visitorCount: "1", resident: null };
  const [entry, setEntry] = useState(emptyEntry);
  const [visitorPhoto, setVisitorPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [filters, setFilters] = useState({ status: "all", resident: "", date: "", search: "" });
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  function buildVisitorFormData() {
    const payload = new FormData();
    payload.append("visitorName", entry.visitorName);
    payload.append("phone", entry.phone);
    payload.append("visitorEmail", entry.visitorEmail);
    payload.append("purpose", entry.purpose);
    payload.append("visitorCount", entry.visitorCount);
    payload.append("residentId", entry.resident?.residentId || "");
    payload.append("flatId", entry.resident?.flatId || "");
    if (visitorPhoto) payload.append("visitorPhoto", visitorPhoto);
    return payload;
  }

  const visitorRows = useMemo(() => filterVisitors(records.visitorLogs, filters), [records.visitorLogs, filters]);
  const visitorStats = buildVisitorStats(records.visitorLogs, [...records.visitorRequests, ...records.preapprovals]);
  const canSubmit = Boolean(entry.visitorName.trim() && entry.phone.trim() && entry.purpose.trim() && Number(entry.visitorCount || 0) > 0 && entry.resident?.residentId && visitorPhoto);

  async function submitEntry() {
    const result = await action("Visitor entry saved successfully.", () => checkInSecurityVisitor(buildVisitorFormData()));
    if (result) {
      setEntry(emptyEntry);
      setVisitorPhoto(null);
      setPhotoPreview("");
    }
  }

  return (
    <div className="sg-page-grid">
      <section className="sg-visitor-stat-strip sg-span-4">
        {visitorStats.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            {loading ? <SkeletonLine /> : <strong>{value}</strong>}
          </div>
        ))}
      </section>

      <section className="sg-panel sg-span-4 sg-smart-entry-panel">
        <div className="sg-panel-head"><span>Smart Visitor Entry</span><strong>One-minute check-in</strong></div>
        <div className="sg-smart-entry-grid">
          <div className="sg-form-grid">
            <Input value={entry.visitorName} onChange={(value) => setEntry({ ...entry, visitorName: value })} placeholder="Visitor Name" />
            <Input value={entry.phone} onChange={(value) => setEntry({ ...entry, phone: value })} placeholder="Visitor Mobile Number" />
            <Input value={entry.visitorEmail} onChange={(value) => setEntry({ ...entry, visitorEmail: value })} placeholder="Visitor Email ID" />
            <Input value={entry.purpose} onChange={(value) => setEntry({ ...entry, purpose: value })} placeholder="Purpose" />
            <Input value={entry.visitorCount} onChange={(value) => setEntry({ ...entry, visitorCount: value })} placeholder="Number of Visitors" />
            <ResidentPicker value={entry.resident} onChange={(resident) => setEntry({ ...entry, resident })} />
          </div>
          <VisitorFaceCapture
            photoPreview={photoPreview}
            onPhoto={(file, preview) => {
              setVisitorPhoto(file);
              setPhotoPreview(preview);
            }}
            onClear={() => {
              setVisitorPhoto(null);
              setPhotoPreview("");
            }}
          />
        </div>
        <div className="sg-wizard-actions">
          <button type="button" onClick={submitEntry} disabled={!canSubmit}>Submit Entry</button>
        </div>
      </section>

      <section className="sg-panel sg-filter-panel sg-span-4">
        <div className="sg-panel-head"><span>Visitor Filters</span><strong>{visitorRows.length} results</strong></div>
        <div className="sg-filter-grid">
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="all">All Status</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="in_premises">Inside</option>
            <option value="checked_out">Checked Out</option>
          </select>
          <Input value={filters.resident} onChange={(value) => setFilters({ ...filters, resident: value })} placeholder="Resident" />
          <input type="date" value={filters.date} onChange={(event) => setFilters({ ...filters, date: event.target.value })} />
          <Input value={filters.search} onChange={(value) => setFilters({ ...filters, search: value })} placeholder="Search visitor or mobile" />
        </div>
      </section>
      <TablePanel title="Visitor Records" loading={loading} items={visitorRows} empty="No visitor entries found.">
        {(item) => (
          <tr>
            <td>{item.photo_url ? <img className="sg-table-photo" src={item.photo_url} alt="" /> : <span className="sg-table-avatar">{initials(textValue(item.visitor_name, item.visitorName))}</span>}</td>
            <td><strong>{textValue(item.visitor_name, item.visitorName)}</strong><br /><span>{textValue(item.phone)}</span></td>
            <td>{textValue(item.visitor_email, item.email)}</td>
            <td>{textValue(item.resident_name, item.person_to_meet)} / {textValue(item.wing)} {textValue(item.flat_number, item.flatNumber)}</td>
            <td>{textValue(item.purpose)}</td>
            <td><Status value={textValue(item.status, item.approval_status)} /></td>
            <td>{formatDateTime(item.entry_time || item.created_at)}</td>
            <td>
              <button type="button" onClick={() => setSelectedVisitor(item)}>Details</button>
              {["in_premises", "pending_approval"].includes(item.status) ? <button type="button" onClick={() => action("Visitor checked out successfully.", () => checkOutSecurityVisitor(item.id))}>Check out</button> : null}
            </td>
          </tr>
        )}
      </TablePanel>
      {selectedVisitor ? <VisitorDrawer visitor={selectedVisitor} onClose={() => setSelectedVisitor(null)} /> : null}
    </div>
  );
}

function DeliveriesView({ loading, records, action }) {
  const emptyForm = { deliveryType: "", packageId: "", courierCompany: "", packageDetails: "", resident: null };
  const [form, setForm] = useState(emptyForm);

  async function submitDelivery() {
    const payload = {
      deliveryType: form.deliveryType,
      packageId: form.packageId,
      courierCompany: form.courierCompany,
      packageDetails: form.packageDetails,
      residentId: form.resident?.residentId || "",
      flatId: form.resident?.flatId || "",
      recipientName: form.resident?.residentName || "",
    };
    const result = await action("Delivery entry saved successfully.", () => createDelivery(payload));
    if (result) setForm(emptyForm);
  }

  return (
    <div className="sg-page-grid">
      <FormPanel title="Delivery Entry">
        <Input value={form.deliveryType} onChange={(value) => setForm({ ...form, deliveryType: value })} placeholder="Delivery type" />
        <Input value={form.packageId} onChange={(value) => setForm({ ...form, packageId: value })} placeholder="Package ID" />
        <Input value={form.courierCompany} onChange={(value) => setForm({ ...form, courierCompany: value })} placeholder="Courier company" />
        <ResidentPicker value={form.resident} onChange={(resident) => setForm({ ...form, resident })} compact />
        <textarea value={form.packageDetails} onChange={(event) => setForm({ ...form, packageDetails: event.target.value })} placeholder="Package details" />
        <button type="button" onClick={submitDelivery} disabled={!form.deliveryType.trim() || !form.resident?.residentId}>Submit Entry</button>
      </FormPanel>
      <TablePanel title="Delivery Records" loading={loading} items={records.deliveries} empty="No deliveries recorded.">
        {(item) => (
          <tr>
            <td>{textValue(item.delivery_type, item.deliveryType)}</td>
            <td>{textValue(item.package_id, item.packageId)}</td>
            <td>{textValue(item.resident_name, item.recipient_name, item.recipientName)} / {textValue(item.wing)} {textValue(item.flat_number)}</td>
            <td>{textValue(item.courier_company, item.delivery_partner)}</td>
            <td>{textValue(item.package_details, item.notes)}</td>
            <td>{formatDateTime(item.entry_time || item.created_at)}</td>
            <td><Status value={textValue(item.status)} /></td>
            <td>
              {["pending", "pending_handover"].includes(item.status) ? <button type="button" onClick={() => action("Delivery marked received.", () => updateDeliveryStatus(item.id, "received"))}>Receive</button> : null}
              {item.status === "received" ? <button type="button" onClick={() => action("Delivery completed.", () => updateDeliveryStatus(item.id, "completed"))}>Complete</button> : null}
            </td>
          </tr>
        )}
      </TablePanel>
    </div>
  );
}

function VehiclesView({ loading, records, action }) {
  const emptyForm = { entryType: "guest", vehicleNumber: "", guestName: "", idProofNumber: "", vehicleType: "car", resident: null };
  const [form, setForm] = useState(emptyForm);
  const duplicate = records.vehicles.find((item) => String(item.vehicle_number || "").toUpperCase() === form.vehicleNumber.trim().toUpperCase() && item.status === "inside");

  async function submitVehicle() {
    const payload = {
      entryType: form.entryType,
      vehicleNumber: form.vehicleNumber,
      guestName: form.guestName,
      idProofNumber: form.idProofNumber,
      vehicleType: form.vehicleType,
      residentId: form.resident?.residentId || "",
      flatId: form.resident?.flatId || "",
    };
    const result = await action("Vehicle entry saved successfully.", () => createSecurityVehicleEntry(payload));
    if (result) setForm(emptyForm);
  }

  return (
    <div className="sg-page-grid">
      <FormPanel title={form.entryType === "guest" ? "Guest Vehicle Entry" : "Resident Vehicle Entry"}>
        <div className="sg-segmented-control">
          <button type="button" className={form.entryType === "guest" ? "is-active" : ""} onClick={() => setForm({ ...form, entryType: "guest" })}>Guest</button>
          <button type="button" className={form.entryType === "resident" ? "is-active" : ""} onClick={() => setForm({ ...form, entryType: "resident", guestName: "", idProofNumber: "" })}>Resident</button>
        </div>
        <Input value={form.vehicleNumber} onChange={(value) => setForm({ ...form, vehicleNumber: value })} placeholder="Vehicle number" />
        {form.entryType === "guest" ? <Input value={form.guestName} onChange={(value) => setForm({ ...form, guestName: value })} placeholder="Visitor / Guest Name" /> : null}
        {form.entryType === "guest" ? <Input value={form.idProofNumber} onChange={(value) => setForm({ ...form, idProofNumber: value })} placeholder="ID Proof Number" /> : null}
        <select value={form.vehicleType} onChange={(event) => setForm({ ...form, vehicleType: event.target.value })}>
          <option value="car">Car</option>
          <option value="bike">Bike</option>
          <option value="auto">Auto</option>
          <option value="cab">Cab</option>
          <option value="commercial">Commercial</option>
        </select>
        <ResidentPicker value={form.resident} onChange={(resident) => setForm({ ...form, resident })} compact />
        {form.vehicleNumber && !/^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}$/i.test(form.vehicleNumber.replace(/\s+/g, "")) ? <p className="sg-helper-text">Suggested format: MH12AB1234</p> : null}
        {duplicate ? <p className="sg-inline-error">Duplicate alert: this vehicle is already marked inside.</p> : null}
        <button type="button" onClick={submitVehicle} disabled={!form.vehicleNumber.trim() || !form.vehicleType || !form.resident?.residentId || (form.entryType === "guest" && !form.guestName.trim())}>Submit Entry</button>
      </FormPanel>
      <TablePanel title="Vehicle History" loading={loading} items={records.vehicles} empty="No vehicle entries recorded.">
        {(item) => (
          <tr>
            <td>{textValue(item.vehicle_number, item.vehicleNumber)}</td>
            <td>{textValue(item.guest_name, item.resident_name)}</td>
            <td>{textValue(item.wing)} {textValue(item.flat_number)}</td>
            <td>{textValue(item.vehicle_type)}</td>
            <td><Status value={textValue(item.status)} /></td>
            <td>{formatDateTime(item.created_at || item.entry_time)}</td>
          </tr>
        )}
      </TablePanel>
    </div>
  );
}

function EmergencyView({ loading, records, action }) {
  const [form, setForm] = useState({ alertType: "security", severity: "high", message: "", location: "" });
  const alerts = [...records.alerts, ...records.visitorAlerts];

  return (
    <div className="sg-page-grid">
      <FeatureStrip features={emergencyFeatures} />
      <FormPanel title="SOS Alert">
        <select value={form.alertType} onChange={(event) => setForm({ ...form, alertType: event.target.value })}>
          <option value="fire">Fire Emergency</option>
          <option value="medical">Medical Emergency</option>
          <option value="security">Security Threat</option>
          <option value="water">Water Leakage</option>
          <option value="lift">Lift Emergency</option>
        </select>
        <select value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value })}>
          <option value="high">High</option>
          <option value="critical">Critical</option>
          <option value="medium">Medium</option>
        </select>
        <Input value={form.location} onChange={(value) => setForm({ ...form, location: value })} placeholder="Location" />
        <textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Emergency details" />
        <button type="button" onClick={() => action("Emergency alert created.", () => createEmergencyAlert(form))}>Trigger alert</button>
        <button type="button" onClick={() => action("Visitor emergency alert created.", () => createVisitorEmergencyAlert(form))}>Trigger visitor alert</button>
      </FormPanel>
      <TablePanel title="Emergency Timeline" loading={loading} items={alerts} empty="No emergency records found.">
        {(item) => (
          <tr>
            <td>{textValue(item.alert_type, item.alertType)}</td>
            <td>{textValue(item.location)}</td>
            <td><Status value={textValue(item.severity)} /></td>
            <td><Status value={textValue(item.status)} /></td>
            <td>
              {item.status === "active" ? <button type="button" onClick={() => action("Alert acknowledged.", () => acknowledgeEmergencyAlert(item.id))}>Acknowledge</button> : null}
              {item.status !== "resolved" ? <button type="button" onClick={() => action("Alert resolved.", () => resolveEmergencyAlert(item.id))}>Resolve</button> : null}
            </td>
          </tr>
        )}
      </TablePanel>
    </div>
  );
}

function NoticesView({ loading, records }) {
  return (
    <FeatureWorkflow
      title="Notices"
      features={noticeFeatures}
      records={records.notifications}
      loading={loading}
      empty="No society notices or security instructions are assigned."
    />
  );
}

function ShiftsView({ loading, records, action }) {
  const attendance = records.dashboard?.attendance;

  return (
    <div className="sg-page-grid">
      <section className="sg-panel sg-span-4">
        <div className="sg-panel-head">
          <span>Current Shift</span>
          <strong>{attendance?.status || "Not checked in"}</strong>
        </div>
        <div className="sg-actions-row">
          <button type="button" onClick={() => action("Shift check-in recorded.", () => securityCheckIn("Guard dashboard check-in"))}>Check in</button>
          <button type="button" onClick={() => action("Shift check-out recorded.", () => securityCheckOut("Guard dashboard check-out"))}>Check out</button>
        </div>
      </section>
      <TablePanel title="Shift Calendar" loading={loading} items={records.shifts} empty="No upcoming shifts assigned.">
        {(item) => (
          <tr>
            <td>{formatDate(item.shift_date)}</td>
            <td>{textValue(item.start_time)} - {textValue(item.end_time)}</td>
            <td>{textValue(item.shift_type)}</td>
            <td><Status value={textValue(item.status)} /></td>
            <td>{textValue(item.notes)}</td>
          </tr>
        )}
      </TablePanel>
      <TablePanel title="Attendance and Leave History" loading={loading} items={records.leaveRequests} empty="No leave or overtime records found.">
        {(item) => (
          <tr>
            <td>{formatDate(item.from_date)} - {formatDate(item.to_date)}</td>
            <td>{textValue(item.reason)}</td>
            <td><Status value={textValue(item.status)} /></td>
            <td>{formatDateTime(item.created_at)}</td>
            <td>{textValue(item.reviewed_by_name)}</td>
          </tr>
        )}
      </TablePanel>
    </div>
  );
}

function ProfileView({ loading, profile, shifts }) {
  const fields = [
    ["Profile Information", textValue(profile.name, profile.userName)],
    ["Guard ID", textValue(profile.id, profile.userId)],
    ["Assigned Society", textValue(profile.society_name, profile.societyName)],
    ["Assigned Gate", textValue(profile.assigned_gate, profile.gate, "Main Gate")],
    ["Shift Details", shifts[0] ? `${formatDate(shifts[0].shift_date)} ${textValue(shifts[0].start_time)} - ${textValue(shifts[0].end_time)}` : "No upcoming shift"],
    ["Emergency Contact", textValue(profile.emergency_contact, profile.phone)],
    ["Uploaded Documents", textValue(profile.document_status, "No document records")],
    ["Verification Status", textValue(profile.status)],
    ["Change Password", "Available from account settings"],
  ];

  return (
    <section className="sg-profile-grid">
      {fields.map(([label, value]) => (
        <div className="sg-panel" key={label}>
          <span>{label}</span>
          {loading ? <SkeletonLine /> : <strong>{value}</strong>}
        </div>
      ))}
    </section>
  );
}

function FeatureWorkflow({ title, features, records, loading, empty }) {
  return (
    <div className="sg-page-grid">
      <FeatureStrip features={features} />
      <section className="sg-panel sg-span-4">
        <div className="sg-panel-head">
          <span>{title}</span>
          <strong>Backend Records</strong>
        </div>
        <RecordList
          items={records}
          loading={loading}
          empty={empty}
          render={(item) => (
            <div className="sg-record">
              <strong>{textValue(item.title, item.alert_type, item.message, item.name)}</strong>
              <span>{textValue(item.status, item.priority, item.created_at)}</span>
            </div>
          )}
        />
      </section>
    </div>
  );
}

function FeatureStrip({ features }) {
  return (
    <section className="sg-feature-strip sg-span-4">
      {features.map((feature) => <span key={feature}>{feature}</span>)}
    </section>
  );
}

function ActivityPanel({ title, items, loading, empty }) {
  return (
    <section className="sg-panel">
      <div className="sg-panel-head"><span>{title}</span><strong>{items.length}</strong></div>
      <RecordList
        items={items.slice(0, 5)}
        loading={loading}
        empty={empty}
        render={(item) => (
          <div className="sg-record">
            <strong>{textValue(item.visitor_name, item.title, item.alert_type, item.delivery_type, item.vehicle_number)}</strong>
            <span>{formatDateTime(item.created_at || item.entry_time || item.expected_at)}</span>
          </div>
        )}
      />
    </section>
  );
}

function SummaryPanel({ title, items, loading, empty }) {
  return (
    <section className="sg-panel">
      <div className="sg-panel-head"><span>{title}</span><strong>{items.length}</strong></div>
      <RecordList
        items={items.slice(0, 4)}
        loading={loading}
        empty={empty}
        render={(item) => (
          <div className="sg-record">
            <strong>{textValue(item.title, item.alert_type, item.shift_type, item.message)}</strong>
            <span>{textValue(item.status, item.priority)} / {formatDateTime(item.created_at || item.shift_date)}</span>
          </div>
        )}
      />
    </section>
  );
}

function ChartPanel({ title, items, groupKey, loading, empty }) {
  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const key = textValue(item[groupKey], item.status, "Unassigned");
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).slice(0, 5);
  }, [items, groupKey]);
  const max = Math.max(...groups.map(([, count]) => count), 1);

  return (
    <section className="sg-panel">
      <div className="sg-panel-head"><span>{title}</span><strong>{items.length}</strong></div>
      {loading ? <SkeletonBlock /> : groups.length ? (
        <div className="sg-bars">
          {groups.map(([label, count]) => (
            <div className="sg-bar-row" key={label}>
              <span>{label}</span>
              <div><i style={{ width: `${Math.max(12, (count / max) * 100)}%` }} /></div>
              <b>{count}</b>
            </div>
          ))}
        </div>
      ) : <EmptyState message={empty} />}
    </section>
  );
}

function AIPanel({ loading, records, refreshing, reload }) {
  const activeAlerts = [...records.alerts, ...records.visitorAlerts].filter((item) => ["active", "acknowledged"].includes(String(item.status).toLowerCase())).length;
  const pendingApprovals = statusCount([...records.visitorRequests, ...records.preapprovals], ["pending"]);
  const pendingDeliveries = statusCount([...records.deliveries, ...records.deliveryEntries], ["pending"]);
  const hasSignals = activeAlerts || pendingApprovals || pendingDeliveries || records.visitorLogs.length;

  return (
    <section className="sg-panel sg-ai-panel">
      <div className="sg-panel-head"><span>AI Executive Summary</span><button type="button" onClick={reload}>{refreshing ? "Syncing" : "Refresh"}</button></div>
      {loading ? <SkeletonBlock /> : hasSignals ? (
        <div className="sg-ai-copy">
          <strong>{activeAlerts > 0 ? "Emergency attention required" : "Security posture is stable"}</strong>
          <p>{pendingApprovals} visitor approvals, {pendingDeliveries} pending deliveries, and {activeAlerts} active alerts are visible in the authenticated guard scope.</p>
          <span>AI features active: visitor risk detection, suspicious activity review, delivery fraud checks, and emergency recommendations.</span>
        </div>
      ) : <EmptyState message="No live security signals are available for AI summarization." />}
    </section>
  );
}

function TablePanel({ title, loading, items, empty, children }) {
  return (
    <section className="sg-panel sg-table-panel sg-span-4">
      <div className="sg-panel-head"><span>{title}</span><strong>{items.length}</strong></div>
      {loading ? <SkeletonBlock /> : items.length ? (
        <div className="sg-table-wrap">
          <table>
            <tbody>{items.slice(0, 12).map((item) => <FragmentRow key={item.id || JSON.stringify(item)}>{children(item)}</FragmentRow>)}</tbody>
          </table>
        </div>
      ) : <EmptyState message={empty} />}
    </section>
  );
}

function FragmentRow({ children }) {
  return children;
}

function RecordList({ items, loading, empty, render }) {
  if (loading) return <SkeletonBlock />;
  if (!items.length) return <EmptyState message={empty} />;
  return <div className="sg-record-list">{items.map((item, index) => <div key={item.id || index}>{render(item)}</div>)}</div>;
}

function ToastViewport({ toasts, onClose }) {
  return (
    <div className="sg-toast-viewport" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div className={`sg-toast is-${toast.type}`} key={toast.id}>
          <div>
            <strong>{toast.type === "success" ? "Success" : "Action needed"}</strong>
            <span>{toast.message}</span>
          </div>
          <button type="button" onClick={() => onClose(toast.id)} aria-label="Close notification">x</button>
          <i aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}

function FormPanel({ title, children }) {
  return (
    <section className="sg-panel sg-form-panel">
      <div className="sg-panel-head"><span>{title}</span></div>
      <div className="sg-form-grid">{children}</div>
    </section>
  );
}

function Input({ value, onChange, placeholder }) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />;
}

function Status({ value }) {
  const labels = {
    pending_handover: "Pending handover",
    pending_approval: "Pending resident approval",
    in_premises: "Checked in",
    checked_out: "Checked out",
    inside: "Inside",
    completed: "Completed",
    received: "Received",
    logged: "Logged",
  };
  const raw = String(value || "").trim();
  const key = raw.toLowerCase();
  return <span className={`sg-status sg-status-${key.replace(/[^a-z0-9]+/g, "-")}`}>{labels[key] || raw || "Not available"}</span>;
}

function Popover({ title, children }) {
  return (
    <div className="sg-popover">
      <strong>{title}</strong>
      {children}
    </div>
  );
}

function EmptyState({ message }) {
  return <div className="sg-empty"><span>No records</span><p>{message}</p></div>;
}

function SkeletonLine() {
  return <span className="sg-skeleton-line" />;
}

function SkeletonBlock() {
  return (
    <div className="sg-skeleton-block">
      <span />
      <span />
      <span />
    </div>
  );
}

export default SecurityCommandCenter;
