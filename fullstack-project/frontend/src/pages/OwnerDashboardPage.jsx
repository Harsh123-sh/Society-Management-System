import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LanguageSelector from "../components/LanguageSelector";
import PremiumNotificationButton from "../components/common/PremiumNotificationButton";
import ThemeToggle from "../components/ThemeToggle";
import { fetchMyBills } from "../services/billingApi";
import { fetchMyComplaints } from "../services/complaintApi";
import { fetchMyDocuments } from "../services/documentApi";
import { fetchMyFlats } from "../services/flatApi";
import { fetchNotices } from "../services/noticeApi";
import { fetchOwnerPreapprovals, fetchOwnerVisitorHistory } from "../services/visitorApi";
import { clearAuthSession, getSelectedSociety, getStoredUser } from "../utils/session";
import "./owner-dashboard.css";

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const DATE_OPTIONS = { weekday: "long", day: "numeric", month: "long", year: "numeric" };

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function normalizeList(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.properties)) return value.properties;
  if (Array.isArray(value?.flats)) return value.flats;
  if (Array.isArray(value?.bills)) return value.bills;
  if (Array.isArray(value?.complaints)) return value.complaints;
  if (Array.isArray(value?.documents)) return value.documents;
  if (Array.isArray(value?.notices)) return value.notices;
  if (Array.isArray(value?.bookings)) return value.bookings;
  if (Array.isArray(value?.visitors)) return value.visitors;
  return [];
}

function getAmount(item) {
  return Number(item?.amount ?? item?.total_amount ?? item?.due_amount ?? item?.maintenance_amount ?? item?.rent_amount ?? 0);
}

function getStatus(item) {
  return String(item?.status || item?.payment_status || item?.occupancy_status || item?.verification_status || "pending").toLowerCase();
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTimeAgo(value) {
  if (!value) return "";
  const now = new Date();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
}

const NAV_ITEMS = [
  { icon: "🏠", label: "Dashboard", path: "/resident/dashboard", id: "dashboard" },
  { icon: "🏢", label: "My Home", path: "/resident/home", id: "home" },
  { icon: "🚶", label: "Visitors", path: "/resident/visitors", id: "visitors" },
  { icon: "💳", label: "Payments", path: "/resident/payments", id: "payments" },
  { icon: "📝", label: "Complaints", path: "/resident/complaints", id: "complaints" },
  { icon: "📄", label: "Documents", path: "/resident/documents", id: "documents" },
  { icon: "👥", label: "Community", path: "/resident/community", id: "community" },
  { icon: "⚙️", label: "Settings", path: "/resident/settings", id: "settings" },
];

function getSectionFromPath(pathname) {
  const path = pathname.replace(/^\/resident\/?/, "").split("/")[0] || "dashboard";
  switch (path) {
    case "home":
    case "visitors":
    case "payments":
    case "complaints":
    case "documents":
    case "community":
    case "settings":
      return path;
    default:
      return "dashboard";
  }
}

const MOCK_EVENTS = [
  { id: 1, title: "Society Meeting", date: "2026-07-15", time: "11:00 AM", location: "Clubhouse", type: "meeting" },
  { id: 2, title: "Festival Celebration", date: "2026-07-20", time: "6:00 PM", location: "Main Lawn", type: "festival" },
  { id: 3, title: "Maintenance Shutdown", date: "2026-07-12", time: "9:00 AM", location: "Water Supply", type: "maintenance" },
];

const MOCK_ACTIVITIES = [
  { id: 1, type: "payment", title: "Maintenance Paid", description: "June 2026 maintenance paid via online", time: "2026-07-09T10:30:00", status: "completed" },
  { id: 2, type: "visitor", title: "Visitor Approved", description: "Guest pass approved for Sharma family", time: "2026-07-09T08:15:00", status: "approved" },
  { id: 3, type: "complaint", title: "Complaint Submitted", description: "Plumbing issue in kitchen", time: "2026-07-08T16:45:00", status: "open" },
  { id: 4, type: "document", title: "Document Uploaded", description: "Property tax receipt 2025-26", time: "2026-07-07T14:20:00", status: "verified" },
  { id: 5, type: "amenity", title: "Amenity Booked", description: "Clubhouse booked for July 15th", time: "2026-07-06T11:00:00", status: "confirmed" },
];

function OwnerDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useMemo(() => getStoredUser(), []);
  const [now, setNow] = useState(() => new Date());
  const [activePage, setActivePage] = useState(() => getSectionFromPath(location.pathname));
  const [readNoticeIds, setReadNoticeIds] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [themeMode, setThemeMode] = useState(() => document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState({
    properties: [],
    bills: [],
    complaints: [],
    visitors: [],
    preapprovals: [],
    notices: [],
    documents: [],
  });

  const society = getSelectedSociety();
  const ownerId = user?.id || user?.userId;
  const societyId = user?.societyId || user?.society_id || society?.id;
  const societyName = user?.societyName || user?.society_name || society?.name || "Shree Residency";
  const societyCode = user?.societyCode || user?.society_code || localStorage.getItem("societyCode") || "NX001";
  const ownerName = user?.name || user?.userName || "Owner";
  const ownerEmail = user?.email || "owner@example.com";

  // Primary flat (first property)
  const primaryFlat = useMemo(() => {
    if (!records.properties.length) return null;
    return records.properties[0];
  }, [records.properties]);

  // Compute family members count from primary flat
  const familyCount = useMemo(() => {
    return primaryFlat?.family_members_count || primaryFlat?.family_count || 0;
  }, [primaryFlat]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    setActivePage(getSectionFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    const updateThemeMode = () => {
      const nextTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      setThemeMode(nextTheme);
    };

    updateThemeMode();
    const observer = new MutationObserver(updateThemeMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadOwnerData() {
      setLoading(true);
      const params = { owner_id: ownerId, society_id: societyId };
      const requests = {
        properties: fetchMyFlats(),
        bills: fetchMyBills(params),
        complaints: fetchMyComplaints(params),
        visitors: fetchOwnerVisitorHistory(),
        preapprovals: fetchOwnerPreapprovals(params),
        notices: fetchNotices(),
        documents: fetchMyDocuments(params),
      };

      const results = await Promise.allSettled(
        Object.entries(requests).map(async ([key, promise]) => [key, await promise])
      );
      if (cancelled) return;

      const next = {};
      results.forEach((entry) => {
        if (entry.status === "fulfilled") {
          const [key, value] = entry.value;
          next[key] = normalizeList(value);
        }
      });

      setRecords((prev) => ({ ...prev, ...next }));
      setLoading(false);
    }

    loadOwnerData();
    return () => { cancelled = true; };
  }, [ownerId, societyId]);

  // Compute KPIs
  const pendingDues = useMemo(() => {
    return records.bills.filter((bill) => !["paid", "success", "completed"].includes(getStatus(bill)));
  }, [records.bills]);

  const pendingDuesAmount = useMemo(() => {
    return pendingDues.reduce((sum, bill) => sum + getAmount(bill), 0);
  }, [pendingDues]);

  const visitorsToday = useMemo(() => {
    const today = new Date().toDateString();
    return [...records.visitors, ...records.preapprovals].filter((v) => {
      const d = v?.created_at || v?.date || v?.visit_date;
      return d && new Date(d).toDateString() === today;
    }).length;
  }, [records.visitors, records.preapprovals]);

  const openComplaints = useMemo(() => {
    return records.complaints.filter((item) => !["closed", "resolved"].includes(getStatus(item))).length;
  }, [records.complaints]);

  const upcomingEventsCount = MOCK_EVENTS.length;

  const pendingDuesTrend = pendingDues.length > 2 ? "+12%" : pendingDues.length > 0 ? "+5%" : "0%";
  const visitorsTrend = visitorsToday > 5 ? "+20%" : visitorsToday > 0 ? "+8%" : "0";
  const complaintsTrend = openComplaints > 3 ? "+15%" : openComplaints > 0 ? "+3%" : "0";
  const eventsTrend = "+2 new";

  // Notices
  const noticeList = useMemo(() => {
    return records.notices.slice(0, 3).map((notice, i) => ({
      id: notice.id || i,
      title: notice.title || notice.category || "Society Notice",
      date: notice.created_at || notice.date || "",
      priority: notice.priority || notice.status || "normal",
      message: notice.message || notice.description || "",
    }));
  }, [records.notices]);

  const filteredNotices = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return noticeList;
    return noticeList.filter((notice) => [notice.title, notice.message, notice.priority].some((value) => String(value).toLowerCase().includes(query)));
  }, [noticeList, searchValue]);

  const filteredActivities = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return MOCK_ACTIVITIES;
    return MOCK_ACTIVITIES.filter((activity) => [activity.title, activity.description, activity.status].some((value) => String(value).toLowerCase().includes(query)));
  }, [searchValue]);

  const filteredEvents = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return MOCK_EVENTS;
    return MOCK_EVENTS.filter((event) => [event.title, event.location, event.type].some((value) => String(value).toLowerCase().includes(query)));
  }, [searchValue]);

  // Notifications for bell
  const noticeNotifications = records.notices.slice(0, 8).map((notice, index) => {
    const id = notice.id || notice.notice_id || `${notice.title || "notice"}-${notice.created_at || index}`;
    return {
      ...notice,
      id,
      unread: !readNoticeIds.includes(id) && !notice.read_at,
      title: notice.title || notice.category || "Society notice",
      message: notice.message || notice.description || "Society update available.",
      category: notice.category || notice.status || "Notice",
      time: notice.created_at || notice.date || "",
    };
  });
  const unreadNoticeCount = noticeNotifications.filter((item) => item.unread).length;

  // Today's date formatted
  const todayFormatted = now.toLocaleDateString("en-IN", DATE_OPTIONS);

  function logout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  function navigateTo(path) {
    navigate(path);
  }

  function handleNavSelect(section) {
    setActivePage(section);
    navigateTo(getPathForSection(section));
  }

  function getPathForSection(section) {
    switch (section) {
      case "home": return "/resident/home";
      case "visitors": return "/resident/visitors";
      case "payments": return "/resident/payments";
      case "complaints": return "/resident/complaints";
      case "documents": return "/resident/documents";
      case "community": return "/resident/community";
      case "settings": return "/resident/settings";
      default: return "/resident/dashboard";
    }
  }

  // Render content based on active page
  function renderContent() {
    switch (activePage) {
      case "dashboard": return <DashboardView />;
      case "home": return <MyHomeView />;
      default: return <DashboardView />;
    }
  }

  // ─── DASHBOARD VIEW ──────────────────────────────────────────
  function DashboardView() {
    return (
      <div className="od2-content">
        {loading ? (
          <div className="od2-loading">
            <div className="od2-loading-spinner" />
            <span>Loading your dashboard...</span>
          </div>
        ) : (
          <>
            {/* SECTION 1: Welcome Hero */}
            <section className="od2-hero">
              <div className="od2-hero-bg" />
              <div className="od2-hero-content">
                <div className="od2-hero-left">
                  <div className="od2-hero-avatar">
                    <span>{(ownerName || "O").charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="od2-hero-text">
                    <h1>{getTimeGreeting()}, {ownerName.split(" ")[0]} 👋</h1>
                    <div className="od2-hero-address">
                      <span className="od2-hero-flat">{primaryFlat?.flat_number || "A-101"}</span>
                      <span className="od2-hero-divider">•</span>
                      <span>{primaryFlat?.tower_name || "Tower A"}</span>
                      <span className="od2-hero-divider">•</span>
                      <span>{societyName}</span>
                    </div>
                    <div className="od2-hero-meta">
                      <span className="od2-hero-date">📅 {todayFormatted}</span>
                      <span className="od2-hero-weather">🌤️ 32°C, Ahmedabad</span>
                    </div>
                  </div>
                </div>
                <div className="od2-hero-right">
                  <div className="od2-hero-society-logo">
                    <img src={themeMode === "dark" ? "/nexora-logo-dark.png" : "/nexora-logo-light.png"} alt="Nexora" />
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: KPI Cards */}
            <section className="od2-kpis">
              <div className="od2-kpi-card od2-kpi--due">
                <div className="od2-kpi-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 2v20"/><path d="M2 10h20"/></svg>
                </div>
                <div className="od2-kpi-info">
                  <span className="od2-kpi-label">Pending Dues</span>
                  <strong className="od2-kpi-value">{INR.format(pendingDuesAmount)}</strong>
                  <span className="od2-kpi-trend od2-trend--up">{pendingDuesTrend}</span>
                </div>
              </div>
              <div className="od2-kpi-card od2-kpi--visitors">
                <div className="od2-kpi-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="od2-kpi-info">
                  <span className="od2-kpi-label">Visitors Today</span>
                  <strong className="od2-kpi-value">{visitorsToday}</strong>
                  <span className="od2-kpi-trend od2-trend--up">{visitorsTrend}</span>
                </div>
              </div>
              <div className="od2-kpi-card od2-kpi--complaints">
                <div className="od2-kpi-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div className="od2-kpi-info">
                  <span className="od2-kpi-label">Open Complaints</span>
                  <strong className="od2-kpi-value">{openComplaints}</strong>
                  <span className="od2-kpi-trend od2-trend--down">{complaintsTrend}</span>
                </div>
              </div>
              <div className="od2-kpi-card od2-kpi--events">
                <div className="od2-kpi-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div className="od2-kpi-info">
                  <span className="od2-kpi-label">Upcoming Events</span>
                  <strong className="od2-kpi-value">{upcomingEventsCount}</strong>
                  <span className="od2-kpi-trend od2-trend--up">{eventsTrend}</span>
                </div>
              </div>
            </section>

            {/* SECTION 3: Quick Actions */}
            <section className="od2-actions">
              <h2 className="od2-section-title">Quick Actions</h2>
              <div className="od2-actions-grid">
                <button className="od2-action-btn od2-action--pay" onClick={() => navigateTo("/resident/payments")}>
                  <span className="od2-action-icon">💳</span>
                  <span className="od2-action-label">Pay Maintenance</span>
                </button>
                <button className="od2-action-btn od2-action--visitor" onClick={() => navigateTo("/resident/visitors")}>
                  <span className="od2-action-icon">🚶</span>
                  <span className="od2-action-label">Add Visitor</span>
                </button>
                <button className="od2-action-btn od2-action--complaint" onClick={() => navigateTo("/resident/complaints")}>
                  <span className="od2-action-icon">📝</span>
                  <span className="od2-action-label">Raise Complaint</span>
                </button>
                <button className="od2-action-btn od2-action--amenity" onClick={() => navigateTo("/resident/community")}>
                  <span className="od2-action-icon">🏊</span>
                  <span className="od2-action-label">Book Amenity</span>
                </button>
                <button className="od2-action-btn od2-action--receipt" onClick={() => navigateTo("/resident/payments")}>
                  <span className="od2-action-icon">🧾</span>
                  <span className="od2-action-label">Download Receipt</span>
                </button>
                <button className="od2-action-btn od2-action--office" onClick={() => navigateTo("/resident/settings")}>
                  <span className="od2-action-icon">📞</span>
                  <span className="od2-action-label">Contact Office</span>
                </button>
              </div>
            </section>

            {/* SECTION 4 + 5 + 6 + 7: Bottom Grid */}
            <div className="od2-bottom-grid">
              {/* SECTION 4: My Home Card */}
              <section className="od2-panel od2-home-card">
                <h2 className="od2-panel-title">
                  <span>🏢</span> My Home
                </h2>
                <div className="od2-home-details">
                  <div className="od2-home-visual">
                    <div className="od2-home-icon">🏠</div>
                    <span className="od2-home-flat">{primaryFlat?.flat_number || "A-101"}</span>
                  </div>
                  <div className="od2-home-info-grid">
                    <div className="od2-home-info-item">
                      <span className="od2-home-info-label">Flat Number</span>
                      <span className="od2-home-info-value">{primaryFlat?.flat_number || "A-101"}</span>
                    </div>
                    <div className="od2-home-info-item">
                      <span className="od2-home-info-label">Tower</span>
                      <span className="od2-home-info-value">{primaryFlat?.tower_name || "Tower A"}</span>
                    </div>
                    <div className="od2-home-info-item">
                      <span className="od2-home-info-label">Wing</span>
                      <span className="od2-home-info-value">{primaryFlat?.wing || primaryFlat?.block || "A"}</span>
                    </div>
                    <div className="od2-home-info-item">
                      <span className="od2-home-info-label">Resident Type</span>
                      <span className="od2-home-info-value od2-badge-owner">Owner</span>
                    </div>
                    <div className="od2-home-info-item">
                      <span className="od2-home-info-label">Family Members</span>
                      <span className="od2-home-info-value">{familyCount || user?.family_count || 4}</span>
                    </div>
                    <div className="od2-home-info-item">
                      <span className="od2-home-info-label">Parking Slot</span>
                      <span className="od2-home-info-value">{primaryFlat?.parking_slot || primaryFlat?.parking || "P-12"}</span>
                    </div>
                  </div>
                  <button className="od2-home-btn" onClick={() => navigateTo("/resident/home")}>
                    View Property →
                  </button>
                </div>
              </section>

              {/* SECTION 5: Recent Notices */}
              <section className="od2-panel od2-notices-panel">
                <div className="od2-panel-header">
                  <h2 className="od2-panel-title">
                    <span>📢</span> Recent Notices
                  </h2>
                  <button className="od2-panel-btn" onClick={() => navigateTo("/resident/documents")}>View All →</button>
                </div>
                <div className="od2-notices-list">
                  {filteredNotices.length > 0 ? filteredNotices.map((notice) => (
                    <div key={notice.id} className="od2-notice-item">
                      <div className="od2-notice-content">
                        <strong className="od2-notice-title">{notice.title}</strong>
                        <span className="od2-notice-date">{formatDate(notice.date)}</span>
                      </div>
                      <span className={`od2-notice-badge od2-badge--${notice.priority === "high" || notice.priority === "urgent" ? "high" : notice.priority === "medium" ? "medium" : "low"}`}>
                        {notice.priority === "high" || notice.priority === "urgent" ? "High" : notice.priority === "medium" ? "Medium" : "Normal"}
                      </span>
                    </div>
                  )) : (
                    <div className="od2-empty-state">
                      <span>📬</span>
                      <p>No notices yet</p>
                    </div>
                  )}
                </div>
              </section>

              {/* SECTION 6: Recent Activities */}
              <section className="od2-panel od2-activities-panel">
                <h2 className="od2-panel-title">
                  <span>🔄</span> Recent Activities
                </h2>
                <div className="od2-timeline">
                  {filteredActivities.map((activity) => (
                    <div key={activity.id} className={`od2-timeline-item od2-tl--${activity.type}`}>
                      <div className="od2-timeline-dot" />
                      <div className="od2-timeline-content">
                        <div className="od2-timeline-header">
                          <strong>{activity.title}</strong>
                          <span className="od2-timeline-status">{activity.status}</span>
                        </div>
                        <p>{activity.description}</p>
                        <span className="od2-timeline-time">{formatTimeAgo(activity.time)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* SECTION 7: Upcoming Events */}
              <section className="od2-panel od2-events-panel">
                <div className="od2-panel-header">
                  <h2 className="od2-panel-title">
                    <span>🗓️</span> Upcoming Events
                  </h2>
                  <button className="od2-panel-btn" onClick={() => navigateTo("/resident/community")}>View Calendar →</button>
                </div>
                <div className="od2-events-list">
                  {filteredEvents.map((event) => (
                    <div key={event.id} className="od2-event-item">
                      <div className={`od2-event-type-icon od2-ev--${event.type}`}>
                        {event.type === "meeting" ? "📋" : event.type === "festival" ? "🎉" : "🔧"}
                      </div>
                      <div className="od2-event-content">
                        <strong className="od2-event-title">{event.title}</strong>
                        <span className="od2-event-details">{formatDate(event.date)} at {event.time}</span>
                        <span className="od2-event-location">{event.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    );
  }

  // ─── MY HOME VIEW ──────────────────────────────────────────
  function MyHomeView() {
    return (
      <div className="od2-content">
        <section className="od2-page-hero">
          <h1>🏢 My Home</h1>
          <p>Property details, family, tenants, vehicles & parking</p>
        </section>
        <div className="od2-bottom-grid">
          <section className="od2-panel od2-panel--full">
            <h2 className="od2-panel-title"><span>👨‍👩‍👧‍👦</span> Family Members</h2>
            <div className="od2-module-placeholder">
              <div className="od2-empty-state">
                <span>👨‍👩‍👧‍👦</span>
                <p>Family member management coming here</p>
              </div>
            </div>
          </section>
          <section className="od2-panel od2-panel--full">
            <h2 className="od2-panel-title"><span>👤</span> Tenant Details</h2>
            <div className="od2-module-placeholder">
              <div className="od2-empty-state">
                <span>👤</span>
                <p>Tenant information and agreements</p>
              </div>
            </div>
          </section>
          <section className="od2-panel od2-panel--full">
            <h2 className="od2-panel-title"><span>🚗</span> Vehicles & Parking</h2>
            <div className="od2-module-placeholder">
              <div className="od2-empty-state">
                <span>🚗</span>
                <p>Vehicle registration and parking slot details</p>
              </div>
            </div>
          </section>
          <section className="od2-panel od2-panel--full">
            <h2 className="od2-panel-title"><span>📄</span> Property Documents</h2>
            <div className="od2-module-placeholder">
              <div className="od2-empty-state">
                <span>📄</span>
                <p>Property ownership documents and certificates</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ─── VISITORS VIEW ──────────────────────────────────────────
  function VisitorsView() {
    return (
      <div className="od2-content">
        <section className="od2-page-hero">
          <h1>🚶 Visitors</h1>
          <p>Guest approvals, visit logs and entry coordination</p>
        </section>
        <div className="od2-module-grid">
          <section className="od2-panel od2-module-card">
            <h2 className="od2-panel-title"><span>🪪</span> Visitor Summary</h2>
            <div className="od2-module-stats">
              <div className="od2-stat-pill"><strong>4</strong><span>Expected today</span></div>
              <div className="od2-stat-pill"><strong>2</strong><span>Approved</span></div>
              <div className="od2-stat-pill"><strong>1</strong><span>Pending review</span></div>
            </div>
          </section>
          <section className="od2-panel od2-module-card">
            <h2 className="od2-panel-title"><span>📋</span> Recent Visitors</h2>
            <div className="od2-stack-list">
              <div className="od2-stack-item">
                <strong>Sharma Family</strong>
                <span>Arriving at 6:30 PM</span>
              </div>
              <div className="od2-stack-item">
                <strong>Delivery Team</strong>
                <span>Package drop-off</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ─── COMPLAINTS VIEW ────────────────────────────────────────
  function ComplaintsView() {
    return (
      <div className="od2-content">
        <section className="od2-page-hero">
          <h1>📝 Complaints</h1>
          <p>Track service issues, updates and resolution status</p>
        </section>
        <div className="od2-module-grid">
          <section className="od2-panel od2-module-card">
            <h2 className="od2-panel-title"><span>⚡</span> Open Issues</h2>
            <div className="od2-stack-list">
              <div className="od2-stack-item">
                <strong>Plumbing leak</strong>
                <span>Assigned to maintenance</span>
              </div>
              <div className="od2-stack-item">
                <strong>Lift noise</strong>
                <span>Pending inspection</span>
              </div>
            </div>
          </section>
          <section className="od2-panel od2-module-card">
            <h2 className="od2-panel-title"><span>✅</span> Resolution Timeline</h2>
            <div className="od2-stack-list">
              <div className="od2-stack-item">
                <strong>Water pressure</strong>
                <span>Resolved yesterday</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ─── PAYMENTS VIEW ──────────────────────────────────────────
  function PaymentsView() {
    return (
      <div className="od2-content">
        <section className="od2-page-hero">
          <h1>💳 Payments</h1>
          <p>Payment history, receipts, outstanding bills & statements</p>
        </section>
        <div className="od2-bottom-grid">
          <section className="od2-panel od2-panel--full">
            <h2 className="od2-panel-title"><span>📊</span> Payment History</h2>
            <div className="od2-module-placeholder">
              <div className="od2-empty-state">
                <span>📊</span>
                <p>Your payment history will appear here</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ─── DOCUMENTS VIEW ──────────────────────────────────────────
  function DocumentsView() {
    return (
      <div className="od2-content">
        <section className="od2-page-hero">
          <h1>📄 Documents</h1>
          <p>Property documents, society certificates & download center</p>
        </section>
        <div className="od2-bottom-grid">
          <section className="od2-panel od2-panel--full">
            <h2 className="od2-panel-title"><span>📁</span> Document Center</h2>
            <div className="od2-module-placeholder">
              <div className="od2-empty-state">
                <span>📁</span>
                <p>All your documents organized here</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ─── COMMUNITY VIEW ──────────────────────────────────────────
  function CommunityView() {
    return (
      <div className="od2-content">
        <section className="od2-page-hero">
          <h1>👥 Community</h1>
          <p>Events, meetings, polls & announcements</p>
        </section>
        <div className="od2-bottom-grid">
          <section className="od2-panel od2-panel--full">
            <h2 className="od2-panel-title"><span>🗓️</span> Events & Meetings</h2>
            <div className="od2-module-placeholder">
              <div className="od2-empty-state">
                <span>🗓️</span>
                <p>Community events and society meetings</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ─── SETTINGS VIEW ───────────────────────────────────────────
  function SettingsView() {
    return (
      <div className="od2-content">
        <section className="od2-page-hero">
          <h1>⚙️ Settings</h1>
          <p>Preferences, alerts and account controls</p>
        </section>
        <div className="od2-module-grid">
          <section className="od2-panel od2-module-card">
            <h2 className="od2-panel-title"><span>🔔</span> Preferences</h2>
            <div className="od2-stack-list">
              <div className="od2-stack-item">
                <strong>Quiet hours</strong>
                <span>Notifications paused after 10 PM</span>
              </div>
              <div className="od2-stack-item">
                <strong>Theme</strong>
                <span>Auto, light or dark</span>
              </div>
            </div>
          </section>
          <section className="od2-panel od2-module-card">
            <h2 className="od2-panel-title"><span>🛡️</span> Security</h2>
            <div className="od2-stack-list">
              <div className="od2-stack-item">
                <strong>Two-step verification</strong>
                <span>Enabled for account access</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ─── RENDER CURRENT PAGE ─────────────────────────────────────
  function renderActivePage() {
    switch (activePage) {
      case "dashboard": return <DashboardView />;
      case "home": return <MyHomeView />;
      case "visitors": return <VisitorsView />;
      case "complaints": return <ComplaintsView />;
      case "payments": return <PaymentsView />;
      case "documents": return <DocumentsView />;
      case "community": return <CommunityView />;
      case "settings": return <SettingsView />;
      default: return <DashboardView />;
    }
  }

  return (
    <div className="od2-dashboard">
      {/* SIDEBAR */}
      <aside className="od2-sidebar">
        <div className="od2-sidebar-brand">
          <button type="button" className="od2-brand-logo" onClick={() => handleNavSelect("dashboard")} aria-label="Go to dashboard">
            <img src={themeMode === "dark" ? "/nexora-logo-dark.png" : "/nexora-logo-light.png"} alt="Nexora" />
          </button>
          <div className="od2-brand-info">
            <strong>{societyName}</strong>
            <span>Code: {societyCode}</span>
          </div>
        </div>

        <nav className="od2-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`od2-nav-item ${activePage === item.id ? "od2-nav--active" : ""}`}
              onClick={() => handleNavSelect(item.id)}
            >
              <span className="od2-nav-icon">{item.icon}</span>
              <span className="od2-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="od2-sidebar-footer">
          <div className="od2-sidebar-user">
            <div className="od2-user-avatar">
              <span>{(ownerName || "O").charAt(0).toUpperCase()}</span>
            </div>
            <div className="od2-user-info">
              <strong>{ownerName}</strong>
              <span>{ownerEmail}</span>
            </div>
          </div>
          <button className="od2-sidebar-logout" onClick={logout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="od2-main">
        {/* TOPBAR */}
        <header className="od2-topbar">
          <div className="od2-topbar-left">
            <button type="button" className="od2-topbar-brand" onClick={() => handleNavSelect("dashboard")}>
              <img src={themeMode === "dark" ? "/nexora-logo-dark.png" : "/nexora-logo-light.png"} alt="Nexora" />
            </button>
            <div className="od2-topbar-title-group">
              <strong>Owner Dashboard</strong>
              <span>Resident / {activePage.charAt(0).toUpperCase() + activePage.slice(1)}</span>
            </div>
          </div>

          <div className="od2-topbar-center">
            <label className="od2-searchbar">
              <span aria-hidden="true">⌕</span>
              <input
                type="text"
                placeholder="Search notices, activity, events"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </label>
          </div>

          <div className="od2-topbar-right">
            <button type="button" className="od2-header-pill od2-calendar-pill" onClick={() => setCalendarOpen((current) => !current)}>
              <span aria-hidden="true">📅</span>
              <span>{todayFormatted}</span>
            </button>
            <PremiumNotificationButton
              notifications={noticeNotifications}
              unreadCount={unreadNoticeCount}
              onMarkAllRead={() => setReadNoticeIds((current) =>
                Array.from(new Set([...current, ...noticeNotifications.map((item) => item.id)]))
              )}
              onMarkRead={(id) => setReadNoticeIds((current) =>
                current.includes(id) ? current : [...current, id]
              )}
            />
            <ThemeToggle />
            <LanguageSelector supportedCodes={["en", "hi", "gu"]} />
            <div className="od2-profile-menu">
              <button type="button" className="od2-profile-trigger" onClick={() => setProfileMenuOpen((current) => !current)}>
                <span className="od2-profile-avatar">{(ownerName || "O").charAt(0).toUpperCase()}</span>
                <span className="od2-profile-meta">
                  <strong>{ownerName}</strong>
                  <span>Owner</span>
                </span>
              </button>
              {profileMenuOpen ? (
                <div className="od2-profile-dropdown">
                  <button type="button" onClick={() => { setProfileMenuOpen(false); handleNavSelect("settings"); }}>My Profile</button>
                  <button type="button" onClick={() => { setProfileMenuOpen(false); handleNavSelect("home"); }}>My Property</button>
                  <button type="button" onClick={() => { setProfileMenuOpen(false); handleNavSelect("settings"); }}>Account Settings</button>
                  <button type="button" onClick={() => { setProfileMenuOpen(false); handleNavSelect("dashboard"); }}>Notifications</button>
                  <button type="button" onClick={() => { setProfileMenuOpen(false); handleNavSelect("settings"); }}>Security</button>
                  <button type="button" onClick={() => { setProfileMenuOpen(false); handleNavSelect("documents"); }}>Help Center</button>
                  <button type="button" className="od2-profile-logout" onClick={() => { setProfileMenuOpen(false); logout(); }}>Logout</button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {calendarOpen ? (
          <div className="od2-calendar-widget">
            <div>
              <strong>Upcoming this week</strong>
              <span>{filteredEvents.slice(0, 3).map((event) => event.title).join(" • ")}</span>
            </div>
            <button type="button" onClick={() => handleNavSelect("community")}>Open calendar</button>
          </div>
        ) : null}

        {/* PAGE CONTENT */}
        <main className="od2-main-content">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}

export default OwnerDashboardPage;