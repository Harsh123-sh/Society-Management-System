import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import LanguageSelector from "../components/LanguageSelector";
import PremiumNotificationButton from "../components/common/PremiumNotificationButton";
import ThemeToggle from "../components/ThemeToggle";
import { fetchMyBills } from "../services/billingApi";
import { fetchBookings } from "../services/bookingsApi";
import { fetchMyComplaints } from "../services/complaintApi";
import { fetchMyDocuments } from "../services/documentApi";
import { fetchMyFlats, fetchMyPropertySummary } from "../services/flatApi";
import { fetchNotices } from "../services/noticeApi";
import { getParkingSlots } from "../services/parkingApi";
import { fetchOwnerPreapprovals, fetchOwnerVisitorHistory } from "../services/visitorApi";
import { clearAuthSession, getSelectedSociety, getStoredUser } from "../utils/session";
import "./owner-dashboard.css";

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const DATE_TIME = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });
const palette = ["#6d5dfc", "#149eca", "#10b981", "#f59e0b", "#f43f5e", "#64748b"];

const ownerNav = [
  ["dashboard", "Dashboard", "/resident"],
  ["properties", "My Properties", "/resident/properties"],
  ["tenants", "Tenant Management", "/resident/tenants"],
  ["billing", "Billing & Payments", "/resident/billing"],
  ["complaints", "Complaints", "/resident/complaints"],
  ["visitors", "Visitors", "/resident/visitors"],
  ["notices", "Notices", "/resident/notices"],
  ["documents", "Documents", "/resident/documents"],
  ["parking", "Parking & Vehicles", "/resident/parking"],
  ["amenities", "Amenities Booking", "/resident/amenities"],
  ["meetings", "Voting & Meetings", "/resident/meetings"],
  ["income", "Rent & Income", "/resident/income"],
  ["profile", "Profile", "/resident/profile"],
];

const moduleCopy = {
  dashboard: ["Dashboard", "Owner workspace"],
  properties: ["My Properties", "Portfolio, documents, parking and history"],
  tenants: ["Tenant Management", "Verification, agreements, move-in and move-out"],
  billing: ["Billing & Payments", "Bills, receipts, payment portal and due calendar"],
  complaints: ["Complaints", "Tickets, timelines, staff assignment and feedback"],
  visitors: ["Visitors", "QR passes, approvals, deliveries and security logs"],
  notices: ["Notices", "Read status, attachments and society updates"],
  documents: ["Documents", "Ownership vault, receipts, agreements and verification"],
  parking: ["Parking & Vehicles", "Slots, vehicles, passes and parking history"],
  amenities: ["Amenities Booking", "Calendar, approvals and payment status"],
  meetings: ["Voting & Meetings", "Agenda, polls, minutes and voting history"],
  income: ["Rent & Income", "Collections, dues, yield and agreement expiry"],
  profile: ["Profile", "Personal details, KYC, security and preferences"],
};

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

function money(value) {
  const amount = Number(value || 0);
  return INR.format(Number.isFinite(amount) ? amount : 0);
}

function getAmount(item) {
  return Number(item?.amount ?? item?.total_amount ?? item?.due_amount ?? item?.maintenance_amount ?? item?.rent_amount ?? 0);
}

function getStatus(item) {
  return String(item?.status || item?.payment_status || item?.occupancy_status || item?.verification_status || "pending").toLowerCase();
}

function formatDate(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function currentPageFromPath(pathname) {
  const tail = pathname.replace(/\/+$/, "").split("/").pop();
  if (!tail || tail === "resident") return "dashboard";
  if (tail === "flats") return "properties";
  if (tail === "tenant") return "tenants";
  if (tail === "settings") return "profile";
  return moduleCopy[tail] ? tail : "dashboard";
}

function countBy(items, predicate) {
  return items.filter(predicate).length;
}

function SkeletonBlock({ compact = false }) {
  return (
    <div className={`od-skeleton ${compact ? "od-skeleton--compact" : ""}`}>
      <span />
      <span />
      <span />
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="od-empty">
      <span>NX</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function Panel({ title, kicker, action, children, className = "" }) {
  return (
    <section className={`od-panel ${className}`}>
      <div className="od-panel__head">
        <div>
          <span>{kicker}</span>
          <h2>{title}</h2>
        </div>
        {action ? <button type="button">{action}</button> : null}
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value, helper, tone = "blue" }) {
  return (
    <article className={`od-stat od-stat--${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <p>{helper}</p>
    </article>
  );
}

function MiniBars({ data }) {
  if (!data.length) return <EmptyState title="No chart data" text="Charts appear after backend records are available." />;
  return (
    <div className="od-mini-bars">
      {data.map((item) => (
        <span key={item.name} style={{ height: `${Math.max(10, item.value)}%` }} title={`${item.name}: ${item.value}`} />
      ))}
    </div>
  );
}

function OwnerDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const page = currentPageFromPath(location.pathname);
  const user = useMemo(() => getStoredUser(), []);
  const [collapsed, setCollapsed] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [readNoticeIds, setReadNoticeIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [records, setRecords] = useState({
    properties: [],
    bills: [],
    complaints: [],
    visitors: [],
    preapprovals: [],
    notices: [],
    documents: [],
    parking: [],
    bookings: [],
    summary: null,
    profile: null,
  });

  const society = getSelectedSociety();
  const ownerId = user?.id || user?.userId;
  const societyId = user?.societyId || user?.society_id || society?.id;
  const societyName = user?.societyName || user?.society_name || society?.name || "Nexora Society";
  const societyCode = user?.societyCode || user?.society_code || localStorage.getItem("societyCode") || "Linked";

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadOwnerData() {
      setLoading(true);
      setError("");
      const params = { owner_id: ownerId, society_id: societyId };
      const requests = {
        properties: fetchMyFlats(),
        summary: fetchMyPropertySummary(),
        bills: fetchMyBills(params),
        complaints: fetchMyComplaints(params),
        visitors: fetchOwnerVisitorHistory(),
        preapprovals: fetchOwnerPreapprovals(params),
        notices: fetchNotices(),
        documents: fetchMyDocuments(params),
        parking: getParkingSlots(params),
        bookings: fetchBookings(params),
        profile: Promise.resolve({ user }),
      };

      const entries = await Promise.allSettled(Object.entries(requests).map(async ([key, promise]) => [key, await promise]));
      if (cancelled) return;

      const next = {};
      const failures = [];
      entries.forEach((entry) => {
        if (entry.status === "fulfilled") {
          const [key, value] = entry.value;
          next[key] = key === "summary" || key === "profile" ? value : normalizeList(value);
        } else {
          failures.push(entry.reason?.response?.data?.message || entry.reason?.message || "Request failed");
        }
      });

      if (failures.length) {
        console.warn("[OwnerDashboard] Optional owner modules could not be loaded.", failures);
      }

      setRecords((prev) => ({ ...prev, ...next }));
      setError("");
      setLoading(false);
    }

    loadOwnerData();
    return () => {
      cancelled = true;
    };
  }, [ownerId, societyId, user]);

  const stats = useMemo(() => {
    const occupied = countBy(records.properties, (item) => getStatus(item).includes("occupied") || item?.tenant_id || item?.tenant_name);
    const vacant = countBy(records.properties, (item) => getStatus(item).includes("vacant"));
    const pendingBills = records.bills.filter((bill) => !["paid", "success", "completed"].includes(getStatus(bill)));
    const monthlyExpenses = pendingBills.reduce((sum, bill) => sum + getAmount(bill), 0);
    const paidBills = records.bills.filter((bill) => ["paid", "success", "completed"].includes(getStatus(bill)));
    const activeComplaints = records.complaints.filter((item) => !["closed", "resolved"].includes(getStatus(item)));
    const activeTenants = countBy(records.properties, (item) => item?.tenant_id || item?.tenant_name || getStatus(item).includes("tenant"));
    const rentRecords = records.properties.filter((item) => Number(item?.rent_amount || item?.monthly_rent));
    const rentTotal = rentRecords.reduce((sum, item) => sum + Number(item?.rent_amount || item?.monthly_rent || 0), 0);

    return {
      occupied,
      vacant,
      activeTenants,
      pendingBills,
      paidBills,
      monthlyExpenses,
      activeComplaints,
      rentTotal,
      propertyCount: records.properties.length || Number(records.summary?.total_properties || 0),
      documentCount: records.documents.length,
      visitorCount: records.visitors.length + records.preapprovals.length,
    };
  }, [records]);

  const trendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const source = records.bills.length ? records.bills : [];
    return months.map((month, index) => {
      const amount = source
        .filter((bill) => {
          const date = new Date(bill?.due_date || bill?.created_at || bill?.paid_at || "");
          return !Number.isNaN(date.getTime()) && date.getMonth() === index;
        })
        .reduce((sum, bill) => sum + getAmount(bill), 0);
      return { month, expenses: amount, income: Math.max(0, stats.rentTotal) };
    }).filter((item) => item.expenses || item.income);
  }, [records.bills, stats.rentTotal]);

  const pageTitle = moduleCopy[page][0];
  const pageSubtitle = moduleCopy[page][1];
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

  function logout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="owner-dashboard" data-sidebar={collapsed ? "collapsed" : "expanded"}>
      <aside className="od-sidebar">
        <div className="od-brand">
          <Link to="/resident" aria-label="Nexora owner dashboard">
            <span>NX</span>
            <strong>Nexora</strong>
          </Link>
          <button type="button" onClick={() => setCollapsed((value) => !value)} aria-label="Toggle sidebar">
            {collapsed ? ">" : "<"}
          </button>
        </div>
        <nav className="od-nav" aria-label="Owner dashboard navigation">
          {ownerNav.map(([id, label, href]) => (
            <Link key={id} to={href} className={id === page ? "is-active" : ""}>
              <span>{label.slice(0, 2).toUpperCase()}</span>
              <b>{label}</b>
            </Link>
          ))}
        </nav>
        <div className="od-society-card">
          <span className="od-online">Online</span>
          <strong>{societyName}</strong>
          <p>Code {societyCode}</p>
          <dl>
            <div><dt>Owner</dt><dd>{user?.name || user?.userName || "Owner"}</dd></div>
            <div><dt>Flats</dt><dd>{stats.propertyCount}</dd></div>
          </dl>
        </div>
      </aside>

      <div className="od-shell">
        <header className="od-topbar">
          <div>
            <p>Resident / Owner / {pageTitle}</p>
            <h1>{pageTitle}</h1>
          </div>
          <div className="od-topbar__actions">
            <span className="od-clock">{DATE_TIME.format(now)}</span>
            <PremiumNotificationButton
              notifications={noticeNotifications}
              unreadCount={unreadNoticeCount}
              onMarkAllRead={() => setReadNoticeIds((current) => Array.from(new Set([...current, ...noticeNotifications.map((item) => item.id)])))}
              onMarkRead={(id) => setReadNoticeIds((current) => current.includes(id) ? current : [...current, id])}
            />
            <button type="button" className="od-ai-button">Nexora AI</button>
            <ThemeToggle />
            <LanguageSelector supportedCodes={["en", "hi", "gu"]} />
            <div className="od-profile">
              <button type="button">{(user?.name || "Owner").slice(0, 1).toUpperCase()}</button>
              <div>
                <strong>{user?.name || user?.userName || "Owner"}</strong>
                <span>{user?.email || "Verified owner"}</span>
                <button type="button" onClick={logout}>Logout</button>
              </div>
            </div>
          </div>
        </header>

        <main className="od-content">
          {error ? <div className="od-alert">{error}</div> : null}
          {page === "dashboard" ? (
            <DashboardOverview loading={loading} records={records} stats={stats} trendData={trendData} ownerName={user?.name || "Owner"} />
          ) : (
            <ModulePage page={page} title={pageTitle} subtitle={pageSubtitle} loading={loading} records={records} stats={stats} trendData={trendData} />
          )}
        </main>
      </div>
    </div>
  );
}

function DashboardOverview({ loading, records, stats, trendData, ownerName }) {
  if (loading) {
    return (
      <div className="od-grid">
        {Array.from({ length: 10 }).map((_, index) => <SkeletonBlock key={index} />)}
      </div>
    );
  }

  const kpis = [
    ["My Properties", stats.propertyCount, "Owner mapped flats", "blue"],
    ["Occupied Flats", stats.occupied, "Owner or tenant occupied", "green"],
    ["Vacant Flats", stats.vacant, "Ready for move-in", "slate"],
    ["Active Tenants", stats.activeTenants, "Verified rental profiles", "purple"],
    ["Pending Bills", stats.pendingBills.length, `${money(stats.pendingBills.reduce((sum, bill) => sum + getAmount(bill), 0))} due`, "amber"],
    ["Monthly Expenses", money(stats.monthlyExpenses), "Open maintenance and society dues", "rose"],
  ];

  return (
    <>
      <section className="od-hero">
        <div>
          <span>Owner command center</span>
          <h2>Good evening, {ownerName}. Your portfolio is in one clean operating view.</h2>
          <p>Property, tenants, billing, visitors, documents, notices, complaints, and AI summaries are scoped to your account and linked society.</p>
        </div>
        <div className="od-hero__summary">
          <strong>{stats.propertyCount}</strong>
          <span>properties monitored</span>
          <p>{stats.activeComplaints.length} active complaints, {stats.pendingBills.length} pending bills</p>
        </div>
      </section>

      <section className="od-kpis">
        {kpis.map(([label, value, helper, tone]) => <StatCard key={label} label={label} value={value} helper={helper} tone={tone} />)}
      </section>

      <section className="od-grid od-grid--two">
        <Panel title="Property Portfolio Summary" kicker="Portfolio">
          <PropertyList records={records.properties} />
        </Panel>
        <Panel title="Payment Overview" kicker="Finance">
          <PaymentOverview bills={records.bills} stats={stats} />
        </Panel>
        <Panel title="Complaint Status" kicker="Service">
          <StatusList items={records.complaints} empty="No complaints raised for your properties." />
        </Panel>
        <Panel title="Visitor Activity" kicker="Security">
          <StatusList items={[...records.preapprovals, ...records.visitors]} empty="No visitor activity recorded yet." />
        </Panel>
      </section>

      <section className="od-grid od-grid--three">
        <Panel title="Maintenance Timeline" kicker="Timeline">
          <Timeline records={[...records.complaints, ...records.bills, ...records.documents]} />
        </Panel>
        <Panel title="Upcoming Payments" kicker="Due calendar">
          <DueList bills={stats.pendingBills} />
        </Panel>
        <Panel title="Society Notices" kicker="Announcements">
          <StatusList items={records.notices.slice(0, 5)} empty="No unread society notices." />
        </Panel>
      </section>

      <section className="od-grid od-grid--two">
        <ChartPanel title="Property Analytics" type="pie" data={[
          { name: "Occupied", value: stats.occupied },
          { name: "Vacant", value: stats.vacant },
          { name: "Tenant", value: stats.activeTenants },
        ]} />
        <ChartPanel title="Expense Trend" type="area" data={trendData} />
        <ChartPanel title="Rental Income" type="bar" data={trendData} />
        <Panel title="AI Executive Summary" kicker="Nexora AI" className="od-ai-panel">
          <AiInsights stats={stats} />
        </Panel>
      </section>
    </>
  );
}

function ModulePage({ page, title, subtitle, loading, records, stats, trendData }) {
  if (loading) return <SkeletonBlock />;
  const modules = {
    properties: <PropertiesModule records={records} stats={stats} />,
    tenants: <TenantsModule properties={records.properties} />,
    billing: <BillingModule bills={records.bills} stats={stats} />,
    complaints: <ComplaintsModule complaints={records.complaints} />,
    visitors: <VisitorsModule visitors={records.visitors} preapprovals={records.preapprovals} />,
    notices: <NoticesModule notices={records.notices} />,
    documents: <DocumentsModule documents={records.documents} />,
    parking: <ParkingModule parking={records.parking} properties={records.properties} />,
    amenities: <AmenitiesModule bookings={records.bookings} />,
    meetings: <MeetingsModule notices={records.notices} />,
    income: <IncomeModule properties={records.properties} trendData={trendData} stats={stats} />,
    profile: <ProfileModule profile={records.profile} documents={records.documents} />,
  };
  return (
    <>
      <section className="od-page-head">
        <div>
          <span>Owner workflow</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button type="button">Export PDF</button>
      </section>
      {modules[page] || modules.properties}
    </>
  );
}

function PropertyList({ records }) {
  if (!records.length) return <EmptyState title="No properties linked" text="Once your society assigns ownership, property cards appear here." />;
  return (
    <div className="od-card-list">
      {records.slice(0, 4).map((item, index) => (
        <article key={item.id || item.flat_id || index}>
          <strong>{item.flat_number || item.unit_number || `Property ${index + 1}`}</strong>
          <p>{item.wing || item.tower_name || "Wing not set"} · Floor {item.floor || "NA"} · {item.area_sqft || item.area || "Area pending"} sq.ft.</p>
          <span>{getStatus(item).replaceAll("_", " ")}</span>
        </article>
      ))}
    </div>
  );
}

function PaymentOverview({ bills, stats }) {
  if (!bills.length) return <EmptyState title="No billing records" text="Bills and receipts appear once generated by your society." />;
  return (
    <div className="od-payment-split">
      <div><strong>{stats.pendingBills.length}</strong><span>Pending bills</span></div>
      <div><strong>{stats.paidBills.length}</strong><span>Paid bills</span></div>
      <MiniBars data={bills.slice(0, 8).map((bill, index) => ({ name: bill.bill_number || `Bill ${index + 1}`, value: Math.min(100, getAmount(bill) / 100) }))} />
    </div>
  );
}

function StatusList({ items, empty }) {
  if (!items.length) return <EmptyState title="Nothing to review" text={empty} />;
  return (
    <div className="od-status-list">
      {items.slice(0, 6).map((item, index) => (
        <article key={item.id || index}>
          <div>
            <strong>{item.title || item.name || item.visitor_name || item.category || item.bill_number || `Record ${index + 1}`}</strong>
            <p>{item.description || item.message || item.purpose || item.flat_number || formatDate(item.created_at)}</p>
          </div>
          <span>{getStatus(item)}</span>
        </article>
      ))}
    </div>
  );
}

function Timeline({ records }) {
  const sorted = records
    .filter(Boolean)
    .sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))
    .slice(0, 6);
  if (!sorted.length) return <EmptyState title="Timeline is clear" text="Activity logs build automatically as you use the owner dashboard." />;
  return (
    <div className="od-timeline">
      {sorted.map((item, index) => (
        <article key={item.id || index}>
          <span />
          <div><strong>{item.title || item.category || item.document_type || item.bill_number || "Owner activity"}</strong><p>{formatDate(item.created_at || item.updated_at)}</p></div>
        </article>
      ))}
    </div>
  );
}

function DueList({ bills }) {
  if (!bills.length) return <EmptyState title="No dues pending" text="You are clear on currently loaded bills." />;
  return (
    <div className="od-due-list">
      {bills.slice(0, 5).map((bill, index) => (
        <article key={bill.id || index}>
          <div><strong>{bill.title || bill.bill_number || "Maintenance bill"}</strong><p>Due {formatDate(bill.due_date)}</p></div>
          <span>{money(getAmount(bill))}</span>
        </article>
      ))}
    </div>
  );
}

function ChartPanel({ title, type, data }) {
  const hasData = data.some((item) => Number(item.value || item.expenses || item.income) > 0);
  return (
    <Panel title={title} kicker="Analytics">
      {!hasData ? <EmptyState title="No analytics yet" text="Backend records are needed before this chart is drawn." /> : (
        <div className="od-chart">
          <ResponsiveContainer width="100%" height={230}>
            {type === "pie" ? (
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={4}>
                  {data.map((item, index) => <Cell key={item.name} fill={palette[index % palette.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            ) : type === "bar" ? (
              <BarChart data={data}>
                <CartesianGrid stroke="var(--od-grid)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "var(--od-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--od-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={data}>
                <CartesianGrid stroke="var(--od-grid)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "var(--od-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--od-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="expenses" stroke="#6d5dfc" fill="#6d5dfc33" strokeWidth={3} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

function AiInsights({ stats }) {
  const items = [
    ["AI Executive Summary", `${stats.propertyCount} properties, ${stats.pendingBills.length} pending bills and ${stats.activeComplaints.length} active complaints need attention.`],
    ["AI Maintenance Prediction", stats.activeComplaints.length ? "Open complaint categories can guide preventive maintenance scheduling." : "No active complaint signal is available for prediction."],
    ["AI Expense Analysis", `Current open society dues total ${money(stats.monthlyExpenses)}.`],
    ["AI Smart Recommendations", stats.vacant ? "Review vacant flats for rent readiness, parking, and document completion." : "Portfolio occupancy looks stable from loaded records."],
  ];
  return (
    <div className="od-ai-list">
      {items.map(([title, text]) => <article key={title}><strong>{title}</strong><p>{text}</p></article>)}
    </div>
  );
}

function PropertiesModule({ records, stats }) {
  return (
    <section className="od-grid od-grid--two">
      <Panel title="Property Cards" kicker="My flats"><PropertyList records={records.properties} /></Panel>
      <Panel title="Property Statistics" kicker="Portfolio"><div className="od-kpis od-kpis--compact"><StatCard label="Total" value={stats.propertyCount} helper="Linked flats" /><StatCard label="Occupied" value={stats.occupied} helper="Active use" tone="green" /><StatCard label="Vacant" value={stats.vacant} helper="Available" tone="slate" /></div></Panel>
      <Panel title="Documents & Parking" kicker="Compliance"><StatusList items={[...records.documents, ...records.parking]} empty="Documents and parking allocation are not available yet." /></Panel>
      <Panel title="Property Timeline" kicker="History"><Timeline records={[...records.properties, ...records.documents, ...records.bills]} /></Panel>
    </section>
  );
}

function TenantsModule({ properties }) {
  const tenants = properties.filter((item) => item.tenant_name || item.tenant_id || getStatus(item).includes("tenant"));
  return (
    <section className="od-grid od-grid--two">
      <Panel title="Tenant Cards" kicker="Active rentals" action="Add Tenant"><StatusList items={tenants} empty="No active tenants are linked to your properties." /></Panel>
      <Panel title="Approval Status" kicker="Verification"><WorkflowCloud items={["Add Tenant", "Remove Tenant", "Move In", "Move Out", "Tenant Verification", "Rental Agreement", "Approval Status", "Tenant History", "AI Tenant Risk Analysis"]} /></Panel>
    </section>
  );
}

function BillingModule({ bills, stats }) {
  return (
    <section className="od-grid od-grid--two">
      <Panel title="Pending Bills" kicker="Due now"><DueList bills={stats.pendingBills} /></Panel>
      <Panel title="Paid Bills & Receipts" kicker="History"><StatusList items={stats.paidBills} empty="No paid receipts available from the backend." /></Panel>
      <Panel title="Monthly Summary" kicker="Breakdown"><PaymentOverview bills={bills} stats={stats} /></Panel>
      <Panel title="Online Payment" kicker="Actions"><WorkflowCloud items={["Online Payment", "Download Receipt", "Bill Breakdown", "Due Calendar", "AI Bill Reminder", "Auto Reminders"]} /></Panel>
    </section>
  );
}

function ComplaintsModule({ complaints }) {
  return (
    <section className="od-grid od-grid--two">
      <Panel title="Complaint Cards" kicker="Support" action="Create Complaint"><StatusList items={complaints} empty="No complaint records found for your account." /></Panel>
      <Panel title="Complaint Timeline" kicker="SLA"><Timeline records={complaints} /></Panel>
      <Panel title="Resolution Workflow" kicker="Actions"><WorkflowCloud items={["Complaint Status", "Assigned Staff", "Upload Images", "Feedback", "Reopen Complaint", "AI Complaint Summary"]} /></Panel>
    </section>
  );
}

function VisitorsModule({ visitors, preapprovals }) {
  return (
    <section className="od-grid od-grid--two">
      <Panel title="Visitor List" kicker="History"><StatusList items={[...preapprovals, ...visitors]} empty="No visitor entries have been recorded." /></Panel>
      <Panel title="QR Pass & Approval" kicker="Gate flow"><WorkflowCloud items={["QR Pass", "Guest Approval", "Delivery Entry", "Visitor History", "Security Logs", "AI Visitor Insights"]} /></Panel>
    </section>
  );
}

function NoticesModule({ notices }) {
  return (
    <section className="od-grid od-grid--two">
      <Panel title="Notice Cards" kicker="Society updates"><StatusList items={notices} empty="No notices have been published yet." /></Panel>
      <Panel title="Notice Details" kicker="Filters"><WorkflowCloud items={["Category Filter", "Read / Unread", "Attachments", "Notice Details"]} /></Panel>
    </section>
  );
}

function DocumentsModule({ documents }) {
  return (
    <section className="od-grid od-grid--two">
      <Panel title="Digital Document Vault" kicker="Secure files"><StatusList items={documents} empty="No owner documents are available yet." /></Panel>
      <Panel title="Verification Status" kicker="Compliance"><WorkflowCloud items={["Ownership Documents", "Society Documents", "Agreements", "Maintenance Receipts", "Download", "Upload", "Verification Status", "AI Document Summary"]} /></Panel>
    </section>
  );
}

function ParkingModule({ parking, properties }) {
  return (
    <section className="od-grid od-grid--two">
      <Panel title="Registered Vehicles" kicker="Slots"><StatusList items={parking} empty="No parking slots are linked to your owner profile." /></Panel>
      <Panel title="Parking History" kicker="Access"><WorkflowCloud items={["Parking Slot", "Visitor Parking", "Vehicle Pass", "Parking History", `${properties.length} linked properties`]} /></Panel>
    </section>
  );
}

function AmenitiesModule({ bookings }) {
  return (
    <section className="od-grid od-grid--two">
      <Panel title="Booking Calendar" kicker="Amenities"><StatusList items={bookings} empty="No amenity bookings found." /></Panel>
      <Panel title="Amenities" kicker="Availability"><WorkflowCloud items={["Clubhouse", "Hall", "Gym", "Swimming Pool", "Garden", "Sports Area", "Booking History", "Approval Status", "Payment Status"]} /></Panel>
    </section>
  );
}

function MeetingsModule({ notices }) {
  return (
    <section className="od-grid od-grid--two">
      <Panel title="Society Meetings" kicker="Governance"><StatusList items={notices.filter((item) => String(item.category || item.type || "").toLowerCase().includes("meeting"))} empty="No meeting records are available yet." /></Panel>
      <Panel title="Online Voting" kicker="Participation"><WorkflowCloud items={["Online Voting", "Polls", "Agenda", "Meeting Minutes", "Voting History"]} /></Panel>
    </section>
  );
}

function IncomeModule({ properties, trendData, stats }) {
  return (
    <section className="od-grid od-grid--two">
      <Panel title="Rental Income" kicker="Collections"><div className="od-kpis od-kpis--compact"><StatCard label="Monthly Income" value={money(stats.rentTotal)} helper="From loaded property rent fields" tone="green" /><StatCard label="Annual Income" value={money(stats.rentTotal * 12)} helper="Projected rental income" tone="purple" /></div></Panel>
      <Panel title="Rent Collection" kicker="Tenancy"><StatusList items={properties.filter((item) => item.tenant_name || item.rent_amount || item.monthly_rent)} empty="No rental income records are linked yet." /></Panel>
      <ChartPanel title="Rent Statistics" type="bar" data={trendData} />
      <Panel title="AI Rental Yield Analysis" kicker="Nexora AI"><WorkflowCloud items={["Rent Due", "Agreement Expiry", "AI Rent Reminder", "AI Property Value Estimation", "AI Rental Yield Analysis"]} /></Panel>
    </section>
  );
}

function ProfileModule({ profile, documents }) {
  const data = profile?.user || profile || {};
  return (
    <section className="od-grid od-grid--two">
      <Panel title="Personal Details" kicker="Profile">
        <div className="od-profile-card"><strong>{data.name || data.userName || "Owner"}</strong><p>{data.email || "Email not available"}</p><span>{data.mobile || data.phone || "Phone not available"}</span></div>
      </Panel>
      <Panel title="Account Settings" kicker="Security"><WorkflowCloud items={["Family Members", "Emergency Contact", "KYC", "Notifications", "Password", "Privacy", "Account Settings"]} /></Panel>
      <Panel title="KYC Documents" kicker="Verification"><StatusList items={documents} empty="No KYC documents are available yet." /></Panel>
    </section>
  );
}

function WorkflowCloud({ items }) {
  return (
    <div className="od-workflow-cloud">
      {items.map((item) => <span key={item}>{item}</span>)}
    </div>
  );
}

export default OwnerDashboardPage;
