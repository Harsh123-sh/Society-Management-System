import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getApiMessage } from "../services/authApi";
import { exportAnalyticsReport, fetchAnalyticsDashboardBundle } from "../services/analyticsApi";
import "./analytics-dashboard.css";

const PALETTE = ["#2563eb", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#22c55e", "#ec4899"];
const MONEY_KEYS = ["amount", "revenue", "collection", "dues", "income", "expense"];

const ICONS = {
  ai: "M12 3l1.7 5.2L19 10l-5.3 1.8L12 17l-1.7-5.2L5 10l5.3-1.8L12 3Zm6 12l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15ZM5.5 14l.7 1.8L8 16.5l-1.8.7L5.5 19l-.7-1.8L3 16.5l1.8-.7L5.5 14Z",
  calendar: "M7 3v4m10-4v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z",
  csv: "M12 3v12m0 0 4-4m-4 4-4-4M5 21h14",
  filter: "M4 5h16l-6 7v6l-4 2v-8L4 5Z",
  fullscreen: "M8 3H3v5m13-5h5v5M8 21H3v-5m18 0v5h-5",
  print: "M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M7 14h10v7H7v-7Z",
  refresh: "M20 6v5h-5M4 18v-5h5M18 11a6 6 0 0 0-10-4M6 13a6 6 0 0 0 10 4",
  report: "M6 3h9l3 3v15H6V3Zm8 0v4h4M9 12h6M9 16h6",
  spark: "M4 16l4-5 4 3 5-7 3 4",
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ra-icon">
      <path d={ICONS[name] || ICONS.report} />
    </svg>
  );
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function rows(value) {
  return Array.isArray(value) ? value : [];
}

function compact(value) {
  return safeNumber(value).toLocaleString("en-IN");
}

function money(value) {
  return `Rs. ${safeNumber(value).toLocaleString("en-IN")}`;
}

function percent(value) {
  return `${safeNumber(value).toFixed(1)}%`;
}

function cleanName(value, fallback = "Unassigned") {
  const text = String(value || "").trim();
  return text || fallback;
}

function monthLabel(value) {
  if (!value) return "N/A";
  const text = String(value);
  if (/^\d{4}-\d{2}/.test(text)) {
    const date = new Date(`${text.slice(0, 7)}-01T00:00:00`);
    return Number.isNaN(date.getTime()) ? text : date.toLocaleString("en-US", { month: "short" });
  }
  if (text.includes("T")) return text.slice(0, 10);
  return text;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoInputValue(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function hasValues(data, keys) {
  return rows(data).some((item) => keys.some((key) => safeNumber(item?.[key]) > 0));
}

function sum(data, key) {
  return rows(data).reduce((total, item) => total + safeNumber(item?.[key]), 0);
}

function trend(data, key) {
  const values = rows(data).map((item) => safeNumber(item?.[key])).filter((value) => value > 0);
  if (values.length < 2 || !values[0]) return 0;
  return ((values[values.length - 1] - values[0]) / values[0]) * 100;
}

function localSocietyName() {
  return localStorage.getItem("selectedSocietyName") || localStorage.getItem("societyName") || "Current Society";
}

function DashboardTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="ra-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => {
        const key = String(item.dataKey || "").toLowerCase();
        const isMoney = MONEY_KEYS.some((token) => key.includes(token));
        return (
          <span key={`${item.dataKey}-${item.name}`} style={{ color: item.color }}>
            {item.name || item.dataKey}: {isMoney ? money(item.value) : compact(item.value)}
          </span>
        );
      })}
    </div>
  );
}

function EmptyAnalytics() {
  return (
    <section className="ra-empty-state">
      <div className="ra-empty-illustration">
        <span />
        <span />
        <span />
      </div>
      <h2>No analytics available yet.</h2>
      <p>Charts will automatically appear as society operations generate data.</p>
    </section>
  );
}

function ChartEmpty() {
  return (
    <div className="ra-chart-empty">
      <Icon name="spark" />
      <strong>No analytics data available</strong>
      <span>This chart will render automatically when matching database records exist.</span>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="ra-skeleton-grid">
      {Array.from({ length: 8 }).map((_, index) => <div className="ra-skeleton-card" key={index} />)}
    </div>
  );
}

function KpiCard({ item }) {
  return (
    <article className="ra-kpi-card">
      <div className="ra-kpi-top">
        <span className="ra-kpi-dot" style={{ "--accent": item.color }} />
        <span className={`ra-trend ${item.delta >= 0 ? "is-up" : "is-down"}`}>{item.delta >= 0 ? "Up" : "Down"} {Math.abs(safeNumber(item.delta)).toFixed(1)}%</span>
      </div>
      <span className="ra-kpi-label">{item.label}</span>
      <strong>{item.value}</strong>
      <small>{item.subtitle}</small>
      <div className="ra-kpi-spark">
        {hasValues(item.spark, ["value"]) ? (
          <ResponsiveContainer width="100%" height={34}>
            <LineChart data={item.spark}>
              <Line type="monotone" dataKey="value" stroke={item.color} strokeWidth={2.5} dot={false} isAnimationActive />
            </LineChart>
          </ResponsiveContainer>
        ) : <Icon name="spark" />}
      </div>
      <p>{item.insight}</p>
    </article>
  );
}

function ChartShell({ chart, activeFilter, onFilter, onExport, onFullscreen }) {
  const cardRef = useRef(null);
  const span = chart.size === "hero" ? "span-8" : chart.size === "wide" ? "span-6" : "span-4";

  return (
    <article ref={cardRef} className={`ra-bi-card ${span}`}>
      <div className="ra-bi-card-head">
        <div>
          <span>{chart.domain}</span>
          <h3>{chart.title}</h3>
        </div>
        <div className="ra-chart-actions">
          <button type="button" title="Fullscreen" onClick={() => onFullscreen(cardRef.current)}><Icon name="fullscreen" /></button>
          <button type="button" title="Export CSV" onClick={() => onExport("csv", chart.exportType)}><Icon name="csv" /></button>
          <button type="button" title="Drill down" onClick={() => onFilter(chart.domain)}><Icon name="filter" /></button>
        </div>
      </div>
      <div className="ra-chart-meta">
        <span>{chart.type}</span>
        {activeFilter === chart.domain ? <b>Cross filter active</b> : null}
      </div>
      <div className="ra-chart-body">{chart.hasData ? chart.render() : <ChartEmpty />}</div>
      <p>{chart.insight}</p>
    </article>
  );
}

function InsightPanel({ insights, healthScore }) {
  return (
    <aside className="ra-insights-panel">
      <div className="ra-insights-head">
        <span><Icon name="ai" /> AI Analytics Status</span>
        <strong>Live</strong>
      </div>
      <div className="ra-health-gauge">
        <ResponsiveContainer width="100%" height={156}>
          <RadialBarChart innerRadius="74%" outerRadius="100%" data={[{ name: "Health", value: healthScore, fill: "#14b8a6" }]} startAngle={90} endAngle={-270}>
            <RadialBar dataKey="value" cornerRadius={12} background={{ fill: "rgba(148, 163, 184, 0.18)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <strong>{Math.round(healthScore)}</strong>
        <span>Society Health Score</span>
      </div>
      <div className="ra-insight-list">
        {insights.map((item) => (
          <article key={item}>
            <span />
            <p>{item}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}

function Donut({ data, dataKey = "value", nameKey = "name" }) {
  const chartRows = rows(data).filter((item) => safeNumber(item?.[dataKey]) > 0);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={chartRows} dataKey={dataKey} nameKey={nameKey} innerRadius="58%" outerRadius="82%" paddingAngle={4}>
          {chartRows.map((entry, index) => <Cell key={`${entry[nameKey]}-${index}`} fill={PALETTE[index % PALETTE.length]} />)}
        </Pie>
        <Tooltip content={<DashboardTooltip />} />
        <Legend iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}

function Heatmap({ data }) {
  const heatRows = rows(data).map((item) => ({ hour: cleanName(item.hour), value: safeNumber(item.visitors ?? item.count ?? item.value) })).filter((item) => item.value > 0);
  const max = Math.max(...heatRows.map((item) => item.value), 1);
  return (
    <div className="ra-heatmap">
      {heatRows.map((item) => (
        <button type="button" key={item.hour} className="ra-heat-cell" style={{ "--heat": `${Math.max(14, (item.value / max) * 100)}%` }} title={`${item.hour}: ${item.value}`}>
          <span>{item.hour}</span>
          <strong>{compact(item.value)}</strong>
        </button>
      ))}
    </div>
  );
}

function TreemapLike({ data, labelKey = "name", valueKey = "value" }) {
  const chartRows = rows(data).filter((item) => safeNumber(item?.[valueKey]) > 0).slice(0, 8);
  const total = Math.max(sum(chartRows, valueKey), 1);
  return (
    <div className="ra-treemap">
      {chartRows.map((item, index) => (
        <div key={`${item[labelKey]}-${index}`} style={{ "--basis": `${Math.max(18, (safeNumber(item[valueKey]) / total) * 100)}%`, "--accent": PALETTE[index % PALETTE.length] }}>
          <strong>{cleanName(item[labelKey])}</strong>
          <span>{compact(item[valueKey])}</span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsDashboard() {
  const [rangeDays, setRangeDays] = useState(90);
  const [startDate, setStartDate] = useState(daysAgoInputValue(90));
  const [endDate, setEndDate] = useState(todayInputValue());
  const [comparePrevious, setComparePrevious] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeFilter, setActiveFilter] = useState("");
  const [dashboard, setDashboard] = useState({ overview: null, analytics: null, ai: null });
  const loadedRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (loadedRef.current) setRefreshing(true);
      else setLoading(true);
      setError("");

      try {
        const bundle = await fetchAnalyticsDashboardBundle({ days: rangeDays, startDate, endDate });
        if (!active) return;
        setDashboard({ overview: bundle.overview || null, analytics: bundle.analytics || null, ai: bundle.ai || null });
        setLastUpdated(new Date());
        loadedRef.current = true;
      } catch (loadError) {
        if (active) setError(getApiMessage(loadError, "Failed to load analytics dashboard"));
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
  }, [rangeDays, startDate, endDate, refreshTick]);

  const model = useMemo(() => {
    const overview = dashboard.overview || {};
    const analytics = dashboard.analytics || {};
    const financial = analytics.financial || {};
    const payment = analytics.payment || {};
    const visitor = analytics.visitor || {};
    const complaint = analytics.complaint || {};
    const staff = analytics.staff || {};
    const security = analytics.security || {};

    const monthlyRevenue = rows(financial.monthlyRevenue).map((item) => ({
      month: monthLabel(item.month || item.date),
      collection: safeNumber(item.revenue ?? item.collection ?? item.amount),
      income: safeNumber(item.revenue ?? item.collection ?? item.amount),
      expense: safeNumber(item.expenses ?? item.expense ?? item.billed),
    })).filter((item) => item.month !== "N/A");

    const billStatus = rows(financial.billStatus || overview?.charts?.billStatus).map((item) => ({
      name: cleanName(item.name || item.status),
      count: safeNumber(item.count ?? item.value),
      amount: safeNumber(item.amount),
    }));

    const pendingDuesByWing = rows(financial.pendingDuesByWing).map((item) => ({
      wing: cleanName(item.wing),
      count: safeNumber(item.count),
      amount: safeNumber(item.amount),
    }));

    const paymentMethods = rows(payment.paymentMethods || financial.paymentMethods).map((item) => ({
      name: cleanName(item.name || item.method || item.payment_method, "Unknown"),
      value: safeNumber(item.value ?? item.count),
      amount: safeNumber(item.amount),
    }));

    const visitorTrend = rows(visitor.visitTrend).map((item) => ({ date: monthLabel(item.date), visitors: safeNumber(item.count ?? item.visitors) }));
    const visitorTypes = rows(visitor.visitorTypes).map((item) => ({ name: cleanName(item.name || item.type), value: safeNumber(item.value ?? item.count) }));
    const complaintStatus = rows(complaint.complaintStatus || overview?.charts?.complaintStatus).map((item) => ({ name: cleanName(item.name || item.status), value: safeNumber(item.value ?? item.count) }));
    const complaintCategories = rows(complaint.topCategories).map((item) => ({ category: cleanName(item.category || item.name), count: safeNumber(item.count ?? item.value) }));
    const complaintTrend = rows(complaint.complaintTrend).map((item) => ({ date: monthLabel(item.date), count: safeNumber(item.count) }));
    const residentBreakdown = rows(visitor.residentBreakdown).map((item) => ({ name: cleanName(item.name || item.residentType), value: safeNumber(item.value ?? item.count) }));
    const moveInOut = rows(visitor.moveInOut).map((item) => ({ month: monthLabel(item.month), moveIn: safeNumber(item.moveIn), moveOut: safeNumber(item.moveOut) }));
    const flatStatus = rows(visitor.flatStatus).map((item) => ({ name: cleanName(item.name), value: safeNumber(item.value) }));
    const parkingUsage = rows(visitor.parkingUsage).map((item) => ({ name: cleanName(item.name), value: safeNumber(item.value) }));
    const staffPerformance = rows(staff.staffPerformance).map((item) => ({
      name: cleanName(item.staffName || item.name),
      assigned: safeNumber(item.tasksAssigned),
      resolved: safeNumber(item.tasksResolved),
      completion: safeNumber(item.completionRate),
    }));
    const staffAttendanceTrend = rows(staff.attendanceTrend).map((item) => ({
      date: monthLabel(item.date),
      present: safeNumber(item.present),
      total: safeNumber(item.total),
    }));
    const securityAlerts = rows(security.alertTrend).map((item) => ({ date: monthLabel(item.date), alerts: safeNumber(item.count) }));
    const aiRequests = rows((analytics.ai || {}).requestTrend).map((item) => ({ date: monthLabel(item.date), requests: safeNumber(item.count) }));

    const paidBills = billStatus.filter((item) => /paid/i.test(item.name)).reduce((total, item) => total + item.count, 0);
    const unpaidBills = billStatus.filter((item) => /unpaid|pending|overdue/i.test(item.name)).reduce((total, item) => total + item.count, 0);
    const pendingDuesAmount = pendingDuesByWing.length ? sum(pendingDuesByWing, "amount") : billStatus.filter((item) => /unpaid|pending|overdue/i.test(item.name)).reduce((total, item) => total + item.amount, 0);
    const totalFlats = safeNumber(visitor.occupancy?.totalFlats);
    const occupiedFlats = safeNumber(visitor.occupancy?.occupiedFlats);
    const occupancyRate = totalFlats ? (occupiedFlats / totalFlats) * 100 : safeNumber(visitor.occupancy?.occupancyRate);
    const collectionEfficiency = safeNumber(financial.collectionRate);
    const resolutionRate = safeNumber(complaint.resolutionRate);
    const staffCompletion = safeNumber(staff.avgCompletionRate);
    const healthScore = Math.round([collectionEfficiency, occupancyRate, resolutionRate, staffCompletion].filter(Boolean).reduce((a, b) => a + b, 0) / Math.max(1, [collectionEfficiency, occupancyRate, resolutionRate, staffCompletion].filter(Boolean).length));

    return {
      ai: dashboard.ai || {},
      overview,
      financial,
      payment,
      visitor,
      complaint,
      staff,
      security,
      monthlyRevenue,
      billStatus,
      pendingDuesByWing,
      paymentMethods,
      visitorTrend,
      visitorTypes,
      complaintStatus,
      complaintCategories,
      complaintTrend,
      residentBreakdown,
      moveInOut,
      flatStatus,
      parkingUsage,
      staffPerformance,
      staffAttendanceTrend,
      securityAlerts,
      aiRequests,
      paidBills,
      unpaidBills,
      pendingDuesAmount,
      totalFlats,
      occupiedFlats,
      occupancyRate,
      collectionEfficiency,
      resolutionRate,
      staffCompletion,
      healthScore,
    };
  }, [dashboard]);

  const kpis = useMemo(() => {
    const totalResidents = safeNumber(model.overview?.totals?.totalResidents);
    const totalVisitors = safeNumber(model.visitor.totalVisitors);
    const totalStaff = safeNumber(model.staff.totalStaff);
    const totalRevenue = safeNumber(model.financial.totalRevenue);
    const generatedBills = sum(model.billStatus, "count");
    const vacantFlats = Math.max(0, model.totalFlats - model.occupiedFlats);
    const openComplaints = safeNumber(model.overview?.totals?.pendingComplaints ?? model.complaint.totalComplaints);

    return [
      ["Monthly Revenue", money(totalRevenue), trend(model.monthlyRevenue, "collection"), "Live collection feed", totalRevenue ? "Revenue analytics synced from bills and payments." : "Waiting for collection records.", "#2563eb", model.monthlyRevenue.map((item) => ({ value: item.collection }))],
      ["Pending Dues", money(model.pendingDuesAmount), -model.unpaidBills, `${compact(model.unpaidBills)} unpaid bills`, model.pendingDuesAmount ? "Focus recovery on the highest pending wing." : "No pending dues detected.", "#ef4444", model.pendingDuesByWing.map((item) => ({ value: item.amount || item.count }))],
      ["Paid Bills", compact(model.paidBills), generatedBills ? (model.paidBills / generatedBills) * 100 : 0, `${compact(generatedBills)} generated`, "Paid bill ratio is calculated from live billing status.", "#14b8a6", model.billStatus.map((item) => ({ value: item.count }))],
      ["Unpaid Bills", compact(model.unpaidBills), -model.unpaidBills, "Outstanding invoices", model.unpaidBills ? "Follow-up queue is active." : "No unpaid bill volume in this range.", "#f59e0b", model.billStatus.map((item) => ({ value: item.count }))],
      ["Total Residents", compact(totalResidents), 0, "Approved residents", "Resident count is scoped to the selected society.", "#06b6d4", rows(model.overview?.charts?.monthlyTrend).map((item) => ({ value: safeNumber(item.residents ?? item.bills) }))],
      ["Total Flats", compact(model.totalFlats), 0, `${compact(vacantFlats)} vacant`, "Flat capacity is read from occupancy records.", "#8b5cf6", model.flatStatus.map((item) => ({ value: item.value }))],
      ["Occupancy Rate", percent(model.occupancyRate), model.occupancyRate, `${compact(model.occupiedFlats)} occupied`, model.occupancyRate >= 90 ? "Occupancy is at executive target." : "Occupancy has room to improve.", "#22c55e", model.flatStatus.map((item) => ({ value: item.value }))],
      ["Visitors", compact(totalVisitors), safeNumber(model.visitor.approvalRate), `${percent(model.visitor.approvalRate)} approved`, totalVisitors ? "Visitor movement is available for BI analysis." : "Visitor analytics will appear after entries.", "#ec4899", model.visitorTrend.map((item) => ({ value: item.visitors }))],
      ["Open Complaints", compact(openComplaints), -openComplaints, `${percent(model.resolutionRate)} resolution`, model.resolutionRate >= 80 ? "Complaint resolution is healthy." : "Resolution needs management attention.", "#ef4444", model.complaintTrend.map((item) => ({ value: item.count }))],
      ["Active Staff", compact(totalStaff), model.staffCompletion, `${percent(model.staffCompletion)} completion`, totalStaff ? "Staff performance feed is connected." : "Staff analytics will appear after records.", "#14b8a6", model.staffPerformance.map((item) => ({ value: item.completion }))],
      ["Collection Efficiency", percent(model.collectionEfficiency), model.collectionEfficiency, "Billing health", model.collectionEfficiency >= 90 ? "Collection efficiency is excellent." : "Collection efficiency is below executive target.", "#2563eb", model.monthlyRevenue.map((item) => ({ value: item.collection }))],
      ["Society Health Score", compact(model.healthScore), model.healthScore, "Composite AI score", model.healthScore >= 80 ? "Society health score is Excellent." : "AI recommends reviewing operational weak spots.", "#10b981", [{ value: model.healthScore }]],
    ].map(([label, value, delta, subtitle, insight, color, spark]) => ({ label, value, delta, subtitle, insight, color, spark }));
  }, [model]);

  const charts = useMemo(() => {
    const generated = [];
    const add = (condition, chart) => {
      generated.push({ ...chart, hasData: Boolean(condition) });
    };

    add(hasValues(model.monthlyRevenue, ["collection"]), {
      title: "Monthly Collection Trend",
      domain: "Finance",
      type: "Line Chart",
      size: "hero",
      exportType: "financial",
      insight: `Monthly revenue changed ${trend(model.monthlyRevenue, "collection").toFixed(1)}% in this range.`,
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={model.monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
            <Tooltip content={<DashboardTooltip />} />
            <Line type="monotone" dataKey="collection" name="Collection" stroke="#2563eb" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ),
    });

    add(hasValues(model.monthlyRevenue, ["income", "expense"]), {
      title: "Income vs Expenses",
      domain: "Finance",
      type: "Composed Chart",
      size: "wide",
      exportType: "financial",
      insight: "Income and billed expense movement are matched to the selected date range.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={model.monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
            <Tooltip content={<DashboardTooltip />} />
            <Bar dataKey="expense" name="Expenses" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            <Line type="monotone" dataKey="income" name="Income" stroke="#14b8a6" strokeWidth={3} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      ),
    });

    add(hasValues(model.billStatus, ["count", "amount"]), {
      title: "Payment Status",
      domain: "Billing",
      type: "Donut Chart",
      size: "small",
      exportType: "financial",
      insight: `${compact(model.paidBills)} paid bills and ${compact(model.unpaidBills)} unpaid bills are in scope.`,
      render: () => <Donut data={model.billStatus} dataKey="count" />,
    });

    add(hasValues(model.pendingDuesByWing, ["amount", "count"]), {
      title: "Pending Dues by Wing",
      domain: "Finance",
      type: "Horizontal Bar",
      size: "wide",
      exportType: "financial",
      insight: "AI prioritizes wings with the highest pending dues for recovery action.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={model.pendingDuesByWing}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="wing" width={84} />
            <Tooltip content={<DashboardTooltip />} />
            <Bar dataKey="amount" name="Pending dues" fill="#ef4444" radius={[0, 10, 10, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    });

    add(hasValues(model.paymentMethods, ["value", "amount"]), {
      title: "Payment Method Distribution",
      domain: "Payments",
      type: "Pie Chart",
      size: "small",
      exportType: "payment",
      insight: "Payment method distribution is selected because multiple payment channels exist.",
      render: () => <Donut data={model.paymentMethods} />,
    });

    add(hasValues(model.visitorTrend, ["visitors"]), {
      title: "Daily Visitors",
      domain: "Visitors",
      type: "Area Chart",
      size: "wide",
      exportType: "visitor",
      insight: `Visitors changed ${trend(model.visitorTrend, "visitors").toFixed(1)}% across the selected period.`,
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={model.visitorTrend}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<DashboardTooltip />} />
            <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#06b6d4" fill="#bfdbfe" />
          </AreaChart>
        </ResponsiveContainer>
      ),
    });

    add(hasValues(model.visitorTrend, ["visitors"]), {
      title: "Monthly Visitors",
      domain: "Visitors",
      type: "Line Chart",
      size: "wide",
      exportType: "visitor",
      insight: "Monthly visitor volume is derived from visitor entry records.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={model.visitorTrend}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<DashboardTooltip />} />
            <Line type="monotone" dataKey="visitors" name="Visitors" stroke="#2563eb" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ),
    });

    add(hasValues(model.visitorTypes, ["value"]), {
      title: "Visitor Type Share",
      domain: "Visitors",
      type: "Treemap",
      size: "small",
      exportType: "visitor",
      insight: "Visitor categories are compact enough for a share-of-volume visualization.",
      render: () => <TreemapLike data={model.visitorTypes} />,
    });

    add(hasValues(model.visitor.peakHours, ["visitors", "count", "value"]), {
      title: "Visitor Heatmap",
      domain: "Security",
      type: "Heatmap",
      size: "wide",
      exportType: "visitor",
      insight: "Peak-hour concentration helps security plan gate staffing.",
      render: () => <Heatmap data={model.visitor.peakHours} />,
    });

    add(hasValues(model.complaintCategories, ["count"]), {
      title: "Complaint Category Distribution",
      domain: "Complaints",
      type: "Column Chart",
      size: "wide",
      exportType: "complaint",
      insight: "Complaint categories are ranked to expose recurring service issues.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={model.complaintCategories}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip content={<DashboardTooltip />} />
            <Bar dataKey="count" name="Complaints" fill="#f59e0b" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    });

    add(hasValues(model.complaintStatus, ["value"]), {
      title: "Complaint Resolution Mix",
      domain: "Complaints",
      type: "Donut Chart",
      size: "small",
      exportType: "complaint",
      insight: `Resolution efficiency is ${percent(model.resolutionRate)} for the period.`,
      render: () => <Donut data={model.complaintStatus} />,
    });

    add(hasValues(model.complaintTrend, ["count"]), {
      title: "Complaint Trend",
      domain: "Complaints",
      type: "Timeline",
      size: "wide",
      exportType: "complaint",
      insight: "Complaint volume over time is selected for service desk trend review.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={model.complaintTrend}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<DashboardTooltip />} />
            <Line type="monotone" dataKey="count" name="Complaints" stroke="#ef4444" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ),
    });

    add(model.totalFlats > 0, {
      title: "Occupancy Trend",
      domain: "Residents",
      type: "Gauge",
      size: "small",
      exportType: "visitor",
      insight: `${compact(model.occupiedFlats)} of ${compact(model.totalFlats)} flats are occupied.`,
      render: () => (
        <div className="ra-gauge">
          <ResponsiveContainer width="100%" height={168}>
            <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ name: "Occupancy", value: model.occupancyRate, fill: "#8b5cf6" }]} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={12} background={{ fill: "rgba(148, 163, 184, 0.18)" }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <strong>{percent(model.occupancyRate)}</strong>
        </div>
      ),
    });

    add(hasValues(model.residentBreakdown, ["value"]), {
      title: "Owner vs Tenant",
      domain: "Residents",
      type: "Donut Chart",
      size: "small",
      exportType: "visitor",
      insight: "Resident type split is useful for committee planning and notices.",
      render: () => <Donut data={model.residentBreakdown} />,
    });

    add(hasValues(model.moveInOut, ["moveIn", "moveOut"]), {
      title: "Property Occupancy Trend",
      domain: "Residents",
      type: "Stacked Bar",
      size: "wide",
      exportType: "visitor",
      insight: "Resident movement is shown only because move-in or move-out records exist.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={model.moveInOut}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<DashboardTooltip />} />
            <Bar dataKey="moveIn" name="Move In" stackId="move" fill="#14b8a6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="moveOut" name="Move Out" stackId="move" fill="#ef4444" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    });

    add(hasValues(model.staffAttendanceTrend, ["present", "total"]), {
      title: "Staff Attendance Trend",
      domain: "Staff",
      type: "Area Chart",
      size: "wide",
      exportType: "all",
      insight: "Attendance is sourced from staff attendance records for the selected period.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={model.staffAttendanceTrend}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<DashboardTooltip />} />
            <Area type="monotone" dataKey="total" name="Scheduled" stroke="#94a3b8" fill="#e2e8f0" />
            <Area type="monotone" dataKey="present" name="Present" stroke="#14b8a6" fill="#99f6e4" />
          </AreaChart>
        </ResponsiveContainer>
      ),
    });

    add(hasValues(model.staffPerformance, ["completion", "assigned", "resolved"]), {
      title: "Staff Performance",
      domain: "Staff",
      type: "Combo Chart",
      size: "wide",
      exportType: "all",
      insight: `Average staff task completion is ${percent(model.staffCompletion)}.`,
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={model.staffPerformance}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<DashboardTooltip />} />
            <Bar dataKey="assigned" name="Assigned" fill="#94a3b8" radius={[8, 8, 0, 0]} />
            <Line dataKey="completion" name="Completion" stroke="#22c55e" strokeWidth={3} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      ),
    });

    add(hasValues(model.parkingUsage, ["value"]), {
      title: "Parking Usage",
      domain: "Parking",
      type: "Radial Progress",
      size: "small",
      exportType: "visitor",
      insight: "Parking analytics appear automatically because parking allocation data exists.",
      render: () => <Donut data={model.parkingUsage} />,
    });

    add(hasValues(model.securityAlerts, ["alerts"]), {
      title: "Security Shift Analysis",
      domain: "Security",
      type: "Line Chart",
      size: "wide",
      exportType: "all",
      insight: "Security alerts are trended for executive risk monitoring.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={model.securityAlerts}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<DashboardTooltip />} />
            <Line type="monotone" dataKey="alerts" name="Alerts" stroke="#ec4899" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ),
    });

    add(hasValues(model.aiRequests, ["requests"]), {
      title: "AI Prediction Charts",
      domain: "AI",
      type: "Line Chart",
      size: "wide",
      exportType: "ai",
      insight: "AI prediction activity follows assistant usage from live chat records.",
      render: () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={model.aiRequests}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip content={<DashboardTooltip />} />
            <Line type="monotone" dataKey="requests" name="AI Requests" stroke="#8b5cf6" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ),
    });

    return generated;
  }, [model]);

  const insights = useMemo(() => {
    const generated = [];
    if (hasValues(model.monthlyRevenue, ["collection"])) generated.push(`Monthly revenue changed ${trend(model.monthlyRevenue, "collection").toFixed(1)}% in the selected period.`);
    if (model.pendingDuesByWing.length) generated.push(`${model.pendingDuesByWing[0]?.wing || "A wing"} has the highest pending dues exposure.`);
    if (hasValues(model.visitorTrend, ["visitors"])) generated.push(`Visitors changed ${trend(model.visitorTrend, "visitors").toFixed(1)}% against the first synced point.`);
    if (model.resolutionRate) generated.push(`Complaint resolution reached ${percent(model.resolutionRate)}.`);
    if (model.staffCompletion) generated.push(`Staff task completion is ${percent(model.staffCompletion)}.`);
    if (model.collectionEfficiency) generated.push(`Collection efficiency reached ${percent(model.collectionEfficiency)}.`);
    generated.push(`Society health score is ${model.healthScore >= 80 ? "Excellent" : model.healthScore >= 60 ? "Stable" : "Needs attention"}.`);
    return rows(model.ai?.recommendations).map((item) => item.title || item.message || item).filter(Boolean).concat(generated).slice(0, 7);
  }, [model]);

  async function handleExport(format = "json", type = "all") {
    try {
      setExporting(true);
      setError("");
      await exportAnalyticsReport({ format, type, params: { days: rangeDays, startDate, endDate } });
    } catch (exportError) {
      setError(getApiMessage(exportError, "Failed to export analytics report"));
    } finally {
      setExporting(false);
    }
  }

  function applyRange(days) {
    setRangeDays(days);
    setStartDate(daysAgoInputValue(days));
    setEndDate(todayInputValue());
  }

  function fullscreen(node) {
    node?.requestFullscreen?.();
  }

  if (loading && !loadedRef.current) {
    return (
      <main className="ra-page">
        <div className="ra-loading">
          <h1>Loading Reports & Analytics</h1>
          <p>Preparing society-scoped executive intelligence.</p>
          <SkeletonGrid />
        </div>
      </main>
    );
  }

  return (
    <main className="ra-page">
      <header className="ra-executive-header">
        <div className="ra-title-block">
          <span>Executive Business Intelligence</span>
          <h1>Reports & Analytics</h1>
          <div className="ra-header-meta">
            <b>{localSocietyName()}</b>
            <span>{startDate} to {endDate}</span>
            <span>Last Refresh: {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Syncing"}</span>
            <span><Icon name="ai" /> AI Analytics Live</span>
          </div>
        </div>
        <div className="ra-header-actions">
          <label className="ra-date-range">
            <Icon name="calendar" />
            <select value={rangeDays} onChange={(event) => applyRange(Number(event.target.value))}>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 180 days</option>
              <option value={365}>This year</option>
            </select>
          </label>
          <input aria-label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <input aria-label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          <label className="ra-compare"><input type="checkbox" checked={comparePrevious} onChange={(event) => setComparePrevious(event.target.checked)} /> Compare Previous Period</label>
          <button type="button" onClick={() => handleExport("json", "all")} disabled={exporting}><Icon name="report" /> Export PDF</button>
          <button type="button" onClick={() => handleExport("csv", "all")} disabled={exporting}><Icon name="csv" /> Export Excel</button>
          <button type="button" onClick={() => window.print()}><Icon name="print" /> Print</button>
          <button type="button" className="is-primary" onClick={() => setRefreshTick((value) => value + 1)}><Icon name="refresh" /> {refreshing ? "Refreshing" : "Refresh Analytics"}</button>
        </div>
      </header>

      {error ? <div className="ra-alert">{error}</div> : null}

      <section className="ra-filter-bar">
        {["Tower", "Wing", "Floor", "Resident Type", "Bill Type", "Complaint Category", "Visitor Type", "Staff Department"].map((label) => (
          <label className="ra-filter" key={label}>
            <span>{label}</span>
            <select>
              <option>All {label}s</option>
              <option>Available Records</option>
            </select>
          </label>
        ))}
        <div className="ra-filter-actions">
          <button type="button" className="is-primary" onClick={() => setRefreshTick((value) => value + 1)}>Apply</button>
          <button type="button" onClick={() => { applyRange(90); setActiveFilter(""); }}>Reset</button>
          {activeFilter ? <span>Filtered by {activeFilter}</span> : null}
        </div>
      </section>

      <section className="ra-kpi-grid">
        {kpis.map((item) => <KpiCard key={item.label} item={item} />)}
      </section>

      <section className="ra-workspace">
        <div className="ra-bi-grid">
          {charts.length ? charts.map((chart) => (
            <ChartShell
              key={`${chart.domain}-${chart.title}`}
              chart={chart}
              activeFilter={activeFilter}
              onFilter={(domain) => setActiveFilter((current) => current === domain ? "" : domain)}
              onExport={handleExport}
              onFullscreen={fullscreen}
            />
          )) : <EmptyAnalytics />}
        </div>
        <InsightPanel insights={insights} healthScore={model.healthScore} />
      </section>
    </main>
  );
}

export default AnalyticsDashboard;

