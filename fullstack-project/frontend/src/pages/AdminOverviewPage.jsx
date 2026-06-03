import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
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
import { fetchNotices } from "../services/noticeApi";
import { fetchVisitorLogs } from "../services/visitorApi";
import { initSocket, subscribe } from "../sockets/socketClient";
import RealTimeFeed from "../components/RealTimeFeed";
import AiCommandCenter from "../components/AiCommandCenter";
import { getRoleHomePath, getStoredRole, getStoredUser } from "../utils/session";
import { API_BASE_URL } from "../config/api";

const OCCUPANCY_COLORS = ["#14f195", "#00f5ff", "#ff9f1a"];
const CHART_COLORS = {
  line: "#00f5ff",
  bar1: "#14f195",
  bar2: "#ff9f1a",
};

function toList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function getActivityTimestamp(item) {
  return (
    item.updated_at ||
    item.paid_at ||
    item.created_at ||
    item.createdAt ||
    item.date ||
    null
  );
}

function toMonthKey(value) {
  const dt = value ? new Date(value) : null;
  if (!dt || Number.isNaN(dt.getTime())) return null;
  const month = `${dt.getMonth() + 1}`.padStart(2, "0");
  return `${dt.getFullYear()}-${month}`;
}

function formatMonth(key) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, (month || 1) - 1, 1).toLocaleString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function getLastSixMonthKeys() {
  const cursor = new Date();
  cursor.setDate(1);
  const keys = [];

  for (let i = 5; i >= 0; i -= 1) {
    const dt = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1);
    const month = `${dt.getMonth() + 1}`.padStart(2, "0");
    keys.push(`${dt.getFullYear()}-${month}`);
  }

  return keys;
}

// Premium Stat Card with 3D floating effect
function PremiumStatCard({ label, value, trend, unit = "", accentColor = "cyan" }) {
  const colorMap = {
    cyan: {
      borderClass: "border-[rgb(var(--app-primary-rgb))]",
      textClass: "text-[rgb(var(--app-primary-rgb))]",
      glowColor: "rgb(var(--app-primary-rgb) / 0.18)",
      bgGradient: "from-[rgb(var(--app-primary-rgb))]",
      shadow: "0 0 20px rgb(var(--app-primary-rgb) / 0.14), inset 0 0 20px rgb(var(--app-primary-rgb) / 0.08)",
    },
    teal: {
      borderClass: "border-emerald-400",
      textClass: "text-emerald-600",
      glowColor: "rgb(16 185 129 / 0.16)",
      bgGradient: "from-emerald-500",
      shadow: "0 0 20px rgb(16 185 129 / 0.12), inset 0 0 20px rgb(16 185 129 / 0.06)",
    },
    orange: {
      borderClass: "border-amber-400",
      textClass: "text-amber-600",
      glowColor: "rgb(245 158 11 / 0.16)",
      bgGradient: "from-amber-500",
      shadow: "0 0 20px rgb(245 158 11 / 0.12), inset 0 0 20px rgb(245 158 11 / 0.06)",
    },
  };

  const colors = colorMap[accentColor];

  return (
    <div
      className={`group relative rounded-3xl border ${colors.borderClass} bg-[rgb(var(--app-surface-rgb))] p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl`}
      style={{ boxShadow: colors.shadow }}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-10" style={{ backgroundImage: `linear-gradient(to bottom right, ${colors.glowColor}, transparent)` }} />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium tracking-wide text-[rgb(var(--app-text-muted-rgb))]">{label}</p>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-4xl font-bold text-[rgb(var(--app-text-rgb))]">{value}</p>
            {unit && <span className="text-xs font-semibold text-[rgb(var(--app-primary-rgb))]">{unit}</span>}
          </div>
          {trend !== undefined && (
            <div className={`mt-3 flex items-center gap-1 text-sm font-semibold ${trend >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              <span>{trend >= 0 ? "↑" : "↓"}</span>
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminOverviewPage() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [societyContext, setSocietyContext] = useState(null);
  const [flats, setFlats] = useState([]);
  const [residents, setResidents] = useState([]);
  const [bills, setBills] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const token = (() => {
    try {
      return localStorage.getItem("token");
    } catch {
      return null;
    }
  })();
  const role = getStoredRole();

  useEffect(() => {
    if (!token || (role && role !== "admin" && role !== "chairman")) {
      return undefined;
    }

    async function loadOverview() {
      try {
        setLoading(true);
        console.log("[ChairmanDashboard] loading overview", {
          apiUrl: `${API_BASE_URL}/api`,
          hasToken: Boolean(token),
          role,
          societyId: localStorage.getItem("societyId") || localStorage.getItem("selectedSocietyId") || null,
        });

        const [
          societyResult,
          flatsResult,
          residentsResult,
          billsResult,
          complaintsResult,
          noticesResult,
          visitorsResult,
        ] = await Promise.allSettled([
          api.get("dashboards/society"),
          fetchFlats(),
          api.get("/users", { params: { role: "resident", status: "active" } }),
          fetchAllBills(),
          fetchAllComplaints(),
          fetchNotices(),
          fetchVisitorLogs(),
        ]);

        console.log("[ChairmanDashboard] dashboard API response", {
          society: societyResult.status,
          flats: flatsResult.status,
          residents: residentsResult.status,
          bills: billsResult.status,
          complaints: complaintsResult.status,
          notices: noticesResult.status,
          visitors: visitorsResult.status,
        });

        if (societyResult.status === "fulfilled") setSocietyContext(societyResult.value?.data?.data || societyResult.value?.data || null);
        if (flatsResult.status === "fulfilled") setFlats(toList(flatsResult.value));
        if (residentsResult.status === "fulfilled") {
          setResidents(toList(residentsResult.value?.data));
        }
        if (billsResult.status === "fulfilled") setBills(toList(billsResult.value));
        if (complaintsResult.status === "fulfilled") {
          setComplaints(toList(complaintsResult.value));
        }
        if (noticesResult.status === "fulfilled") setNotices(toList(noticesResult.value));
        if (visitorsResult.status === "fulfilled") {
          setVisitors(toList(visitorsResult.value));
        }
      } catch (error) {
        console.error("[ChairmanDashboard] API error", error?.response?.data || error?.message || error);
        setAlert({
          type: "error",
          message: getApiMessage(error, "Could not load overview data"),
        });
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
    // initialize socket and subscribe to updates
    const s = initSocket();
    const unsubStats = subscribe("stats-update", (payload) => {
      // payload expected to contain delta counts or full snapshot
      if (payload?.flats) setFlats(payload.flats);
      if (payload?.residents) setResidents(payload.residents);
      if (payload?.bills) setBills(payload.bills);
      if (payload?.complaints) setComplaints(payload.complaints);
      if (payload?.visitors) setVisitors(payload.visitors);
    });

    const unsubActivity = subscribe("activity", (payload) => {
      // push new activity to recentActivities via state update hack: append to visitors/complaints arrays if relevant
      setVisitors((prev) => (payload.type === "visitor" ? [payload, ...prev] : prev));
      setComplaints((prev) => (payload.type === "complaint" ? [payload, ...prev] : prev));
    });

    return () => {
      try { unsubStats(); } catch (e) {}
      try { unsubActivity(); } catch (e) {}
      try { s.disconnect(); } catch (e) {}
    };
  }, []);

  const overview = useMemo(() => {
    const occupiedFlats = flats.filter((flat) => {
      const status = String(flat.status || "").toLowerCase();
      return (
        status === "occupied" ||
        Boolean(flat.resident_id) ||
        Boolean(flat.resident_name) ||
        Boolean(flat.assigned_resident_id)
      );
    }).length;

    const underMaintenanceFlats = flats.filter((flat) => {
      const status = String(flat.status || "").toLowerCase();
      return status.includes("maintenance");
    }).length;

    const vacantFlats = Math.max(flats.length - occupiedFlats - underMaintenanceFlats, 0);

    const pendingPayments = bills.filter((bill) => {
      const status = String(bill.status || "").toLowerCase();
      return ["unpaid", "overdue", "pending"].includes(status);
    }).length;

    const activeComplaints = complaints.filter((complaint) => {
      const status = String(complaint.status || "").toLowerCase();
      return !["resolved", "closed"].includes(status);
    }).length;

    return {
      totalFlats: flats.length,
      occupiedFlats,
      vacantFlats,
      underMaintenanceFlats,
      totalResidents: residents.length,
      pendingPayments,
      activeComplaints,
    };
  }, [flats, residents, bills, complaints]);

  const occupancyChartData = useMemo(
    () => [
      { name: "Occupied", value: overview.occupiedFlats },
      { name: "Vacant", value: overview.vacantFlats },
      { name: "Maintenance", value: overview.underMaintenanceFlats },
    ],
    [overview]
  );

  const monthlyCollectionData = useMemo(() => {
    const monthKeys = getLastSixMonthKeys();
    const grouped = Object.fromEntries(
      monthKeys.map((key) => [key, { month: formatMonth(key), paid: 0, pending: 0 }])
    );

    bills.forEach((bill) => {
      const key = toMonthKey(bill.paid_at || bill.updated_at || bill.due_date || bill.created_at);
      if (!key || !grouped[key]) return;

      const amount = Number(bill.total_amount || bill.amount || 0);
      const status = String(bill.status || "").toLowerCase();

      if (status === "paid") {
        grouped[key].paid += amount;
      } else {
        grouped[key].pending += amount;
      }
    });

    return monthKeys.map((key) => ({
      ...grouped[key],
      paid: Number(grouped[key].paid.toFixed(2)),
      pending: Number(grouped[key].pending.toFixed(2)),
    }));
  }, [bills]);

  const complaintTrendData = useMemo(() => {
    const monthKeys = getLastSixMonthKeys();
    const grouped = Object.fromEntries(
      monthKeys.map((key) => [key, { month: formatMonth(key), count: 0 }])
    );

    complaints.forEach((complaint) => {
      const key = toMonthKey(complaint.created_at || complaint.updated_at);
      if (!key || !grouped[key]) return;
      grouped[key].count += 1;
    });

    return monthKeys.map((key) => grouped[key]);
  }, [complaints]);

  const recentActivities = useMemo(() => {
    const records = [
      ...complaints.map((item) => ({
        id: `complaint-${item.id}`,
        label: `Complaint: ${item.title || "Issue reported"}`,
        type: "Complaint",
        timestamp: getActivityTimestamp(item),
        icon: "⚠️",
      })),
      ...bills.map((item) => ({
        id: `bill-${item.id}`,
        label: `${item.status === "paid" ? "Payment received" : "Bill generated"}: ${
          item.title || "Maintenance bill"
        }`,
        type: "Billing",
        timestamp: getActivityTimestamp(item),
        icon: "💳",
      })),
      ...notices.map((item) => ({
        id: `notice-${item.id}`,
        label: `Notice: ${item.title || "Announcement"}`,
        type: "Notice",
        timestamp: getActivityTimestamp(item),
        icon: "📢",
      })),
      ...visitors.map((item) => ({
        id: `visitor-${item.id}`,
        label: `Visitor: ${item.visitor_name || "Entry logged"}`,
        type: "Visitor",
        timestamp: getActivityTimestamp(item),
        icon: "👤",
      })),
    ];

    return records
      .filter((record) => record.timestamp)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }, [complaints, bills, notices, visitors]);

  const currentUser = getStoredUser();
  const roleLabel = currentUser?.role === "admin" ? "Chairman" : currentUser?.role === "secretary" ? "Secretary" : currentUser?.role || "User";
  const society = societyContext?.society || null;
  const societyName = society?.name || currentUser?.society_name || localStorage.getItem("societyName") || "Linked society";
  const societyCode = society?.code || currentUser?.society_code || localStorage.getItem("societyId") || "";
  const societyLocation = [society?.city, society?.state].filter(Boolean).join(", ");
  const shouldRedirect = !token || (role && role !== "admin" && role !== "chairman");

  if (shouldRedirect) {
    return <Navigate to={token ? getRoleHomePath(role) : "/login"} replace state={{ from: location }} />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.08),_transparent_28%),linear-gradient(180deg,_rgb(var(--app-canvas-rgb))_0%,_rgb(var(--app-canvas-rgb))_100%)]">
      <div className="space-y-8 p-6 md:p-8">
        {/* Alert */}
        <AlertMessage type={alert.type} message={alert.message} />

        <section className="group relative overflow-hidden rounded-[28px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--app-primary-rgb))] via-transparent to-emerald-400 opacity-0 transition-opacity duration-500 group-hover:opacity-10" />
          <div className="relative grid gap-6 px-8 py-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[rgb(var(--app-text-muted-rgb))]">Chairman workspace</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-[rgb(var(--app-text-rgb))] md:text-5xl">
                {currentUser?.name || "Chairman profile"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[rgb(var(--app-text-muted-rgb))]">
                {roleLabel} of {societyName}. All dashboard data below is scoped to this society only.
              </p>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-[rgb(var(--app-text-rgb))]">
                <span className="rounded-full border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-2 font-semibold">
                  {roleLabel}
                </span>
                <span className="rounded-full border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-2 font-semibold">
                  {societyCode ? `Society code: ${societyCode}` : "Society linked"}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[rgb(var(--app-text-muted-rgb))]">Society</p>
                <p className="mt-2 text-lg font-semibold text-[rgb(var(--app-text-rgb))]">{societyName}</p>
                <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">{society?.address || societyLocation || "Society details synced from Super Admin"}</p>
              </div>
              <div className="rounded-3xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[rgb(var(--app-text-muted-rgb))]">Role</p>
                <p className="mt-2 text-lg font-semibold text-[rgb(var(--app-text-rgb))]">{roleLabel}</p>
                <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">{currentUser?.email || "Account linked to this society"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <div className="group relative overflow-hidden rounded-[28px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="absolute inset-0 bg-gradient-to-r from-[rgb(var(--app-primary-rgb))] via-transparent to-emerald-400 opacity-0 transition-opacity duration-500 group-hover:opacity-10" />
          
          <div className="relative px-8 py-12 md:py-16">
            <div className="max-w-3xl">
              <h1 className="animate-fade-in bg-gradient-to-r from-[rgb(var(--app-primary-rgb))] via-[rgb(var(--app-text-rgb))] to-emerald-500 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
                AI Powered Society Command Center
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-[rgb(var(--app-text-muted-rgb))]">
                Real-time visibility into all society operations. Manage flats, residents, billing, complaints, and security in one unified premium dashboard.
              </p>
              <div className="mt-6 flex gap-4">
                <button className="rounded-xl bg-gradient-to-r from-[rgb(var(--app-primary-rgb))] to-emerald-500 px-8 py-3 font-bold text-white transition-all duration-300 hover:scale-105 hover:opacity-95 active:scale-95">
                  Get Started
                </button>
                <button className="rounded-xl border border-[rgb(var(--app-border-rgb))] px-8 py-3 font-bold text-[rgb(var(--app-text-rgb))] transition-all duration-300 hover:border-[rgb(var(--app-primary-rgb))] hover:bg-[rgb(var(--app-surface-muted-rgb))]">
                  Learn More
                </button>
              </div>
            </div>
          </div>

          {/* Animated background elements */}
          <div className="absolute -mr-48 -mt-48 h-96 w-96 rounded-full bg-[rgb(var(--app-primary-rgb))] opacity-5 blur-3xl right-0 top-0" />
          <div className="absolute -ml-48 -mb-48 h-96 w-96 rounded-full bg-emerald-500 opacity-5 blur-3xl bottom-0 left-0" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <PremiumStatCard
            label="Total Flats"
            value={overview.totalFlats}
            accentColor="cyan"
            unit="units"
          />
          <PremiumStatCard
            label="Active Residents"
            value={overview.totalResidents}
            accentColor="teal"
            unit="accounts"
          />
          <PremiumStatCard
            label="Pending Payments"
            value={overview.pendingPayments}
            accentColor="orange"
            unit="bills"
          />
          <PremiumStatCard
            label="Active Complaints"
            value={overview.activeComplaints}
            accentColor="cyan"
            unit="tickets"
          />
        </div>

        {/* Occupancy Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-emerald-200 bg-[rgb(var(--app-surface-rgb))] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[rgb(var(--app-text-muted-rgb))]">Occupied Flats</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">{overview.occupiedFlats}</p>
              </div>
              <div className="text-5xl opacity-20">🏠</div>
            </div>
            <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-emerald-500 to-transparent" />
          </div>

          <div className="rounded-3xl border border-sky-200 bg-[rgb(var(--app-surface-rgb))] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[rgb(var(--app-text-muted-rgb))]">Vacant Flats</p>
                <p className="mt-2 text-3xl font-bold text-[rgb(var(--app-primary-rgb))]">{overview.vacantFlats}</p>
              </div>
              <div className="text-5xl opacity-20">🔓</div>
            </div>
            <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-[rgb(var(--app-primary-rgb))] to-transparent" />
          </div>

          <div className="rounded-3xl border border-amber-200 bg-[rgb(var(--app-surface-rgb))] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[rgb(var(--app-text-muted-rgb))]">Under Maintenance</p>
                <p className="mt-2 text-3xl font-bold text-amber-600">{overview.underMaintenanceFlats}</p>
              </div>
              <div className="text-5xl opacity-20">🔧</div>
            </div>
            <div className="mt-4 h-1 rounded-full bg-gradient-to-r from-amber-500 to-transparent" />
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Occupancy Pie Chart */}
          <div className="rounded-3xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-8 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-[rgb(var(--app-text-rgb))]">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[rgb(var(--app-primary-rgb))] to-emerald-500" />
              Occupancy Rate
            </h3>
            <div className="h-72 -mx-4">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="animate-pulse text-text-secondary">Loading chart...</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={occupancyChartData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      label
                      labelLine={false}
                    >
                      {occupancyChartData.map((entry, index) => (
                        <Cell key={entry.name} fill={OCCUPANCY_COLORS[index % OCCUPANCY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid rgb(226 232 240)", borderRadius: "12px", color: "rgb(15 23 42)" }} />
                    <Legend wrapperStyle={{ color: "rgb(100 116 139)" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Monthly Collection Chart */}
          <div className="rounded-3xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-8 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-[rgb(var(--app-text-rgb))]">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-500 to-[rgb(var(--app-primary-rgb))]" />
              Monthly Collection
            </h3>
            <div className="h-72 -mx-4">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="animate-pulse text-text-secondary">Loading chart...</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyCollectionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(226 232 240)" vertical={false} />
                    <XAxis dataKey="month" stroke="rgb(100 116 139)" />
                    <YAxis stroke="rgb(100 116 139)" />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid rgb(226 232 240)", borderRadius: "12px", color: "rgb(15 23 42)" }} />
                    <Legend wrapperStyle={{ color: "rgb(100 116 139)" }} />
                    <Bar dataKey="paid" fill="#10b981" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="pending" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Complaint Trends & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Complaint Trends Chart */}
          <div className="lg:col-span-2 rounded-3xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-8 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-[rgb(var(--app-text-rgb))]">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[rgb(var(--app-primary-rgb))] to-emerald-500" />
              Complaint Trends
            </h3>
            <div className="h-64 -mx-4">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="animate-pulse text-text-secondary">Loading chart...</div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={complaintTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(226 232 240)" vertical={false} />
                    <XAxis dataKey="month" stroke="rgb(100 116 139)" />
                    <YAxis stroke="rgb(100 116 139)" allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid rgb(226 232 240)", borderRadius: "12px", color: "rgb(15 23 42)" }} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ fill: "#10b981", r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="rounded-3xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-8 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-[rgb(var(--app-text-rgb))]">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-500 to-[rgb(var(--app-primary-rgb))]" />
              Recent Activity
            </h3>
            <RealTimeFeed initial={recentActivities} />
          </div>

          {/* AI Command Center */}
          <div className="rounded-3xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-8 shadow-sm">
            <AiCommandCenter />
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="rounded-3xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-8 shadow-sm">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-[rgb(var(--app-text-rgb))]">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-500 to-[rgb(var(--app-primary-rgb))]" />
            Society Overview Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4 text-center">
              <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Occupancy Rate</p>
              <p className="mt-2 text-2xl font-bold text-[rgb(var(--app-primary-rgb))]">
                {overview.totalFlats > 0 ? Math.round((overview.occupiedFlats / overview.totalFlats) * 100) : 0}%
              </p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4 text-center">
              <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Collection Rate</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {bills.length > 0
                  ? Math.round(
                      ((bills.filter((b) => String(b.status || "").toLowerCase() === "paid").length /
                        bills.length) *
                        100) || 0
                    )
                  : 0}%
              </p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4 text-center">
              <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Complaint Resolution</p>
              <p className="mt-2 text-2xl font-bold text-amber-600">
                {complaints.length > 0
                  ? Math.round(
                      ((complaints.filter(
                        (c) =>
                          ["resolved", "closed"].includes(
                            String(c.status || "").toLowerCase()
                          )
                      ).length /
                        complaints.length) *
                        100) || 0
                    )
                  : 0}%
              </p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4 text-center">
              <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Visitors Today</p>
              <p className="mt-2 text-2xl font-bold text-[rgb(var(--app-primary-rgb))]">{visitors.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { default } from "./ChairmanSecretaryDashboardPage";
