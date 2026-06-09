import { useEffect, useMemo, useRef, useState } from "react";
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
import { getApiMessage } from "../services/authApi";
import {
  exportAnalyticsReport,
  fetchAnalyticsDashboardBundle,
} from "../services/analyticsApi";

const RANGE_OPTIONS = [7, 30, 90, 180];
const EXPORT_TYPES = [
  { label: "All analytics", value: "all" },
  { label: "Visitor", value: "visitor" },
  { label: "Financial", value: "financial" },
  { label: "Complaint", value: "complaint" },
  { label: "Chat", value: "chat" },
  { label: "Payment", value: "payment" },
  { label: "AI", value: "ai" },
  { label: "Staff", value: "staff" },
  { label: "Security", value: "security" },
];
const EXPORT_FORMATS = [
  { label: "JSON", value: "json" },
  { label: "CSV", value: "csv" },
];
const CHART_COLORS = ["#0f172a", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

const TONE_MAP = {
  sky: {
    shell: "border-sky-200 bg-sky-50/80",
    badge: "bg-sky-100 text-sky-700",
    accent: "text-sky-700",
  },
  emerald: {
    shell: "border-emerald-200 bg-emerald-50/80",
    badge: "bg-emerald-100 text-emerald-700",
    accent: "text-emerald-700",
  },
  amber: {
    shell: "border-amber-200 bg-amber-50/80",
    badge: "bg-amber-100 text-amber-700",
    accent: "text-amber-700",
  },
  rose: {
    shell: "border-rose-200 bg-rose-50/80",
    badge: "bg-rose-100 text-rose-700",
    accent: "text-rose-700",
  },
  violet: {
    shell: "border-violet-200 bg-violet-50/80",
    badge: "bg-violet-100 text-violet-700",
    accent: "text-violet-700",
  },
  slate: {
    shell: "border-slate-200 bg-slate-50/80",
    badge: "bg-slate-100 text-slate-700",
    accent: "text-slate-700",
  },
};

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatCount(value) {
  return toNumber(value).toLocaleString();
}

function formatCurrency(value) {
  return `₹${toNumber(value).toLocaleString()}`;
}

function formatPercent(value) {
  const parsed = toNumber(value);
  return `${parsed.toFixed(1)}%`;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getLatestLabel(list, key) {
  const latest = safeArray(list)[0];
  if (!latest) return "N/A";
  return latest[key] ?? latest.name ?? latest.category ?? latest.type ?? latest.month ?? "N/A";
}

function MetricCard({ label, value, detail, tone = "slate" }) {
  const colors = TONE_MAP[tone] || TONE_MAP.slate;

  return (
    <div className={`rounded-2xl border p-4 shadow-sm backdrop-blur ${colors.shell}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${colors.accent}`}>{value}</p>
      {detail ? <p className="mt-2 text-sm text-slate-600">{detail}</p> : null}
    </div>
  );
}

function ChartPanel({ title, description, children, action }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_40px_-28px_rgba(15,23,42,0.45)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h2>
      {description ? <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p> : null}
    </div>
  );
}

function AnalyticsDashboard() {
  const [rangeDays, setRangeDays] = useState(30);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState({ overview: null, analytics: null, ai: null });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [clock, setClock] = useState(new Date());
  const [exportType, setExportType] = useState("all");
  const [exportFormat, setExportFormat] = useState("json");
  const [exporting, setExporting] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return undefined;

    const interval = setInterval(() => {
      setRefreshTick((value) => value + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const silentRefresh = hasLoadedRef.current;

      if (silentRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const bundle = await fetchAnalyticsDashboardBundle({ days: rangeDays });
        if (!active) return;

        setDashboard({
          overview: bundle.overview || null,
          analytics: bundle.analytics || null,
          ai: bundle.ai || null,
        });
        setLastUpdated(new Date());
        hasLoadedRef.current = true;
      } catch (loadError) {
        if (!active) return;
        setError(getApiMessage(loadError, "Failed to load analytics dashboard"));
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [rangeDays, refreshTick]);

  const overview = dashboard.overview || {
    totals: {
      totalResidents: 0,
      pendingComplaints: 0,
      totalUnpaidBills: 0,
    },
    charts: {
      complaintStatus: [],
      billStatus: [],
      monthlyTrend: [],
    },
  };

  const analytics = dashboard.analytics || {};
  const ai = dashboard.ai || {};

  const visitor = analytics.visitor || {};
  const financial = analytics.financial || {};
  const complaint = analytics.complaint || {};
  const chat = analytics.chat || {};
  const payment = analytics.payment || {};
  const staff = analytics.staff || {};
  const security = analytics.security || {};
  const aiWidgets = safeArray(ai.widgets);
  const aiRecommendations = safeArray(ai.recommendations);
  const aiAnomalies = safeArray(ai.anomalies);

  const realtimeWidgets = useMemo(
    () => [
      {
        label: "Live visitors",
        value: formatCount(visitor.totalVisitors),
        detail: `Approval rate ${formatPercent(visitor.approvalRate || 0)}`,
        tone: "sky",
      },
      {
        label: "Revenue pulse",
        value: formatCurrency(financial.totalRevenue),
        detail: `Collection rate ${formatPercent(financial.collectionRate || 0)}`,
        tone: "emerald",
      },
      {
        label: "Open workload",
        value: formatCount(overview.totals.pendingComplaints),
        detail: `Complaints, bills, and tasks needing attention`,
        tone: "amber",
      },
      {
        label: "Security alerts",
        value: formatCount(security.totalAlerts),
        detail: `Hotspot ${getLatestLabel(security.incidentsByLocation, "location")}`,
        tone: "rose",
      },
    ],
    [financial.collectionRate, financial.totalRevenue, overview.totals.pendingComplaints, security.incidentsByLocation, security.totalAlerts, visitor.approvalRate, visitor.totalVisitors]
  );

  const aiInsightCards = useMemo(
    () => [
      {
        label: "AI summary",
        value: ai.summary || "Analytics intelligence is warming up.",
        detail: aiAnomalies.length ? `Anomalies: ${aiAnomalies.join("; ")}` : "No active anomalies detected.",
        tone: "violet",
      },
      {
        label: "Recommendation",
        value: aiRecommendations[0] || "Prioritize unresolved tickets older than 48 hours.",
        detail: aiRecommendations[1] || "Automate reminders and escalation nudges.",
        tone: "sky",
      },
      {
        label: "Service health",
        value: `${Math.max(0, 100 - toNumber(overview.totals.pendingComplaints) * 3)}%`,
        detail: `Pending complaints: ${formatCount(overview.totals.pendingComplaints)}`,
        tone: "emerald",
      },
      {
        label: "Collection efficiency",
        value: formatPercent(financial.collectionRate || 0),
        detail: `Top defaulter: ${getLatestLabel(financial.topDefaulters, "name")}`,
        tone: "amber",
      },
    ],
    [ai.summary, aiAnomalies, aiRecommendations, financial.collectionRate, financial.topDefaulters, overview.totals.pendingComplaints]
  );

  const healthTiles = useMemo(
    () => [
      {
        label: "Residents",
        value: formatCount(overview.totals.totalResidents),
        detail: "Active resident accounts in the society",
        tone: "slate",
      },
      {
        label: "Pending complaints",
        value: formatCount(overview.totals.pendingComplaints),
        detail: "Items waiting for resolution or assignment",
        tone: "amber",
      },
      {
        label: "Unpaid bills",
        value: formatCount(overview.totals.totalUnpaidBills),
        detail: "Outstanding billing items across cycles",
        tone: "rose",
      },
      {
        label: "AI widgets",
        value: formatCount(aiWidgets.length),
        detail: "Generated from the analytics intelligence service",
        tone: "violet",
      },
    ],
    [aiWidgets.length, overview.totals.pendingComplaints, overview.totals.totalResidents, overview.totals.totalUnpaidBills]
  );

  async function handleExport() {
    try {
      setExporting(true);
      setError("");
      await exportAnalyticsReport({
        format: exportFormat,
        type: exportType,
        params: { days: rangeDays },
      });
    } catch (exportError) {
      setError(getApiMessage(exportError, "Failed to export analytics report"));
    } finally {
      setExporting(false);
    }
  }

  if (loading && !hasLoadedRef.current) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center rounded-3xl theme-page px-6 py-16 text-[var(--text-main)]">
        <div className="max-w-md text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <h1 className="mt-6 text-3xl font-semibold">Loading analytics command center</h1>
          <p className="mt-3 text-sm text-slate-300">Pulling visitor, finance, complaints, chat, payments, AI, staff, and security signals.</p>
        </div>
      </div>
    );
  }

  if (error && !hasLoadedRef.current) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <h1 className="text-2xl font-semibold">Analytics dashboard unavailable</h1>
        <p className="mt-2 text-sm">{error}</p>
        <button
          type="button"
          onClick={() => setRefreshTick((value) => value + 1)}
          className="mt-4 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-3xl bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_36%),radial-gradient(circle_at_right,_rgba(16,185,129,0.14),_transparent_28%),linear-gradient(180deg,_rgba(248,250,252,0.95),_rgba(248,250,252,0.98))] p-1 sm:p-0">
      <section className="overflow-hidden rounded-3xl border border-slate-200 theme-page text-[var(--text-main)] shadow-[0_24px_80px_-36px_rgba(15,23,42,0.85)]">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.5fr_0.9fr] lg:px-8 lg:py-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Analytics command center</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Modern society analytics dashboard</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-300 sm:text-base">
              Monitor visitor flow, financial health, complaint queues, chat activity, AI usage, payment behavior, staff throughput, and security events from a single live surface.
            </p>

            <div className="mt-5 flex flex-wrap gap-3 text-xs text-slate-200">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Updated: {lastUpdated ? lastUpdated.toLocaleString() : "waiting for first sync"}</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Clock: {clock.toLocaleTimeString()}</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Auto refresh: {autoRefresh ? "on" : "off"}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="grid gap-3 sm:grid-cols-2">
              {healthTiles.map((tile) => (
                <MetricCard key={tile.label} {...tile} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {RANGE_OPTIONS.map((days) => {
              const active = rangeDays === days;
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRangeDays(days)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active ? "theme-page text-[var(--text-main)] shadow-lg shadow-slate-950/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  {days} days
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRefreshTick((value) => value + 1)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              {refreshing ? "Refreshing..." : "Refresh now"}
            </button>
            <button
              type="button"
              onClick={() => setAutoRefresh((value) => !value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${autoRefresh ? "bg-emerald-600 text-[var(--text-main)] hover:bg-emerald-700" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
            >
              {autoRefresh ? "Auto refresh on" : "Auto refresh off"}
            </button>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
              <span className="pl-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Report</span>
              <select
                value={exportType}
                onChange={(event) => setExportType(event.target.value)}
                className="rounded-full border-0 bg-transparent px-2 py-1 text-sm font-medium text-slate-700 focus:outline-none focus:ring-0"
              >
                {EXPORT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={exportFormat}
                onChange={(event) => setExportFormat(event.target.value)}
                className="rounded-full border-0 bg-transparent px-2 py-1 text-sm font-medium text-slate-700 focus:outline-none focus:ring-0"
              >
                {EXPORT_FORMATS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="rounded-full theme-page px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:theme-surface disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>
        </div>

        {error ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      </section>

      <section>
        <SectionTitle
          eyebrow="Realtime widgets"
          title="Live system pulse"
          description="These widgets update automatically so the dashboard remains useful during active operations, not just after reports are generated."
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {realtimeWidgets.map((widget) => (
            <MetricCard key={widget.label} {...widget} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Visitor analytics"
          description="Approvals, visitor mix, and peak traffic patterns."
        >
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Total visitors" value={formatCount(visitor.totalVisitors)} tone="sky" detail="Across the selected date range" />
            <MetricCard label="Approval rate" value={formatPercent(visitor.approvalRate || 0)} tone="emerald" detail={`Peak hour ${getLatestLabel(visitor.peakHours, "hour")}`} />
            <MetricCard label="Visitor types" value={formatCount(safeArray(visitor.visitorTypes).length)} tone="violet" detail="Resident, delivery, guest, and vendor breakdowns" />
            <MetricCard label="Status buckets" value={formatCount(safeArray(visitor.approvalStatus).length)} tone="amber" detail="Approved, pending, and rejected activity" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="h-72 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={safeArray(visitor.visitTrend)}>
                  <defs>
                    <linearGradient id="visitorTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#0ea5e9" fill="url(#visitorTrendFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={safeArray(visitor.visitorTypes)} dataKey="value" nameKey="name" outerRadius={92} label>
                    {safeArray(visitor.visitorTypes).map((entry, index) => (
                      <Cell key={`visitor-${entry.name || index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartPanel>

        <ChartPanel title="Financial analytics" description="Revenue, collections, and bill status movement.">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Revenue" value={formatCurrency(financial.totalRevenue)} tone="emerald" detail="Paid bills in the selected window" />
            <MetricCard label="Collection rate" value={formatPercent(financial.collectionRate || 0)} tone="sky" detail="Paid versus total billed activity" />
            <MetricCard label="Top defaulter" value={getLatestLabel(financial.topDefaulters, "name")} tone="rose" detail={formatCurrency(safeArray(financial.topDefaulters)[0]?.amount || 0)} />
            <MetricCard label="Bill buckets" value={formatCount(safeArray(financial.billStatus).length)} tone="amber" detail="Status and amount distribution" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="h-72 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={safeArray(financial.monthlyRevenue)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeArray(financial.billStatus)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#0ea5e9" />
                  <Bar dataKey="amount" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Complaint analytics" description="Ticket volume, resolution velocity, and categories.">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Complaints" value={formatCount(complaint.totalComplaints)} tone="amber" detail="Opened in the selected period" />
            <MetricCard label="Resolution rate" value={formatPercent(complaint.resolutionRate || 0)} tone="emerald" detail={`Average ${complaint.avgResolutionDays || 0} days`} />
            <MetricCard label="Top category" value={getLatestLabel(complaint.topCategories, "category")} tone="violet" detail="Highest complaint concentration" />
            <MetricCard label="Status buckets" value={formatCount(safeArray(complaint.complaintStatus).length)} tone="sky" detail="Pending, open, and closed queues" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="h-72 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={safeArray(complaint.complaintTrend)}>
                  <defs>
                    <linearGradient id="complaintTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#f59e0b" fill="url(#complaintTrendFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeArray(complaint.topCategories)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="category" stroke="#64748b" interval={0} angle={-18} textAnchor="end" height={72} />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartPanel>

        <ChartPanel title="Chat analytics" description="Conversation throughput and channel activity.">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Messages" value={formatCount(chat.totalMessages)} tone="sky" detail="Messages sent in the selected period" />
            <MetricCard label="Active users" value={formatCount(chat.activeUsers)} tone="emerald" detail="Distinct participants in chat threads" />
            <MetricCard label="Response time" value={`${chat.avgResponseTimeMinutes || 0} min`} tone="violet" detail="Average thread turnaround" />
            <MetricCard label="Channels" value={formatCount(safeArray(chat.topChannels).length)} tone="amber" detail="Most active discussion threads" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="h-72 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={safeArray(chat.messageTrend)}>
                  <defs>
                    <linearGradient id="chatTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="url(#chatTrendFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeArray(chat.topChannels).slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="threadId" stroke="#64748b" interval={0} angle={-18} textAnchor="end" height={72} />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="messages" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Payment analytics" description="Payment success, method mix, and cashflow stability.">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Payments" value={formatCount(payment.totalPayments)} tone="emerald" detail="Successful payment events" />
            <MetricCard label="Total amount" value={formatCurrency(payment.totalAmount)} tone="sky" detail="Received through all payment methods" />
            <MetricCard label="Success rate" value={formatPercent(payment.successRate || 0)} tone="violet" detail="Successful versus attempted payments" />
            <MetricCard label="Failures" value={formatCount(payment.failedPayments)} tone="rose" detail="Payment attempts that did not clear" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="h-72 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={safeArray(payment.paymentTrend)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={safeArray(payment.paymentMethods)} dataKey="count" nameKey="method" outerRadius={92} label>
                    {safeArray(payment.paymentMethods).map((entry, index) => (
                      <Cell key={`payment-${entry.method || index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartPanel>

        <ChartPanel title="Staff performance" description="Assignment load, completion rates, and response speed.">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Total staff" value={formatCount(staff.totalStaff)} tone="sky" detail="Active staff members in the selected society" />
            <MetricCard label="Average completion" value={formatPercent(staff.avgCompletionRate || 0)} tone="emerald" detail="Resolved versus assigned work items" />
            <MetricCard label="Top performer" value={getLatestLabel(staff.staffPerformance, "staffName")} tone="violet" detail="Best completion performance in the current window" />
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Staff</th>
                    <th className="px-4 py-3 text-left font-semibold">Role</th>
                    <th className="px-4 py-3 text-center font-semibold">Assigned</th>
                    <th className="px-4 py-3 text-center font-semibold">Resolved</th>
                    <th className="px-4 py-3 text-center font-semibold">Completion</th>
                    <th className="px-4 py-3 text-center font-semibold">Avg days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {safeArray(staff.staffPerformance).map((member, index) => (
                    <tr key={`${member.staffName || "staff"}-${index}`} className="bg-white/70">
                      <td className="px-4 py-3 font-medium text-slate-900">{member.staffName}</td>
                      <td className="px-4 py-3 text-slate-600">{member.role}</td>
                      <td className="px-4 py-3 text-center">{formatCount(member.tasksAssigned)}</td>
                      <td className="px-4 py-3 text-center">{formatCount(member.tasksResolved)}</td>
                      <td className="px-4 py-3 text-center font-semibold text-emerald-700">{formatPercent(member.completionRate || 0)}</td>
                      <td className="px-4 py-3 text-center">{member.avgCompletionDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ChartPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title="Security analytics" description="Incident heat, severity mix, and top hotspots.">
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Alerts" value={formatCount(security.totalAlerts)} tone="rose" detail="Detected in the current time window" />
            <MetricCard label="Critical issues" value={formatCount((safeArray(security.severityBreakdown).find((item) => item.severity === "critical") || {}).count)} tone="amber" detail="Highest severity incidents" />
            <MetricCard label="Top type" value={getLatestLabel(security.topAlertTypes, "type")} tone="violet" detail="Most common alert classification" />
            <MetricCard label="Hotspot" value={getLatestLabel(security.incidentsByLocation, "location")} tone="sky" detail="Location with the most alerts" />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="h-72 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={safeArray(security.alertTrend)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={safeArray(security.severityBreakdown)} dataKey="count" nameKey="severity" outerRadius={92} label>
                    {safeArray(security.severityBreakdown).map((entry, index) => (
                      <Cell key={`security-${entry.severity || index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartPanel>

        <ChartPanel title="AI analytics" description="Generated insight cards, recommendations, and anomaly summaries.">
          <div className="grid gap-4 md:grid-cols-2">
            {aiInsightCards.map((card) => (
              <div key={card.label} className={`rounded-2xl border p-4 shadow-sm ${TONE_MAP[card.tone || "slate"].shell}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{card.label}</p>
                <p className="mt-3 text-base font-semibold text-slate-900">{card.value}</p>
                {card.detail ? <p className="mt-2 text-sm text-slate-600">{card.detail}</p> : null}
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Generated widgets</p>
              <div className="mt-4 space-y-3">
                {aiWidgets.length ? (
                  aiWidgets.map((widget, index) => (
                    <div key={`${widget.title || "widget"}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{widget.title || "Insight"}</p>
                          <p className="mt-1 text-sm text-slate-600">{widget.detail || widget.value || "Automated insight card"}</p>
                        </div>
                        {widget.value ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{widget.value}</span> : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                    AI widget generation is still warming up.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">AI recommendations</p>
              <div className="mt-4 space-y-3">
                {aiRecommendations.length ? (
                  aiRecommendations.map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                      {item}
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                    Recommendations will appear once the AI analytics service returns a response.
                  </div>
                )}
              </div>
            </div>
          </div>
        </ChartPanel>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionTitle
          eyebrow="Export reports"
          title="Download dashboards and snapshots"
          description="Generate JSON or CSV exports for the current range, then archive or share the report with stakeholders."
        />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <MetricCard label="Selected range" value={`${rangeDays} days`} tone="sky" detail="Used for both API fetches and report exports" />
          <MetricCard label="Report format" value={exportFormat.toUpperCase()} tone="emerald" detail="Choose JSON for systems, CSV for spreadsheets" />
          <MetricCard label="Report type" value={exportType} tone="violet" detail="Export a single domain or the full analytics bundle" />
        </div>
      </section>
    </div>
  );
}

export default AnalyticsDashboard;
