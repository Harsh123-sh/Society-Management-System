import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  ClipboardCheck,
  CreditCard,
  Headphones,
  HeartPulse,
  ShieldCheck,
  TrendingUp,
  Users,
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
import "../../styles/superadmin.css";
import {
  fetchSuperAdminAnalytics,
  fetchSuperAdminPlatformStats,
  fetchSuperAdminSocieties,
  fetchSuperAdminActivityLogs,
  fetchSuperAdminPendingApprovals,
  fetchSuperAdminSupportTickets,
} from "../../services/authApi";

function number(value) {
  return Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function money(value) {
  return `Rs. ${number(value)}`;
}

function Kpi({ label, value, detail, icon: Icon, tone = "blue" }) {
  return (
    <article className={`kpi-card tone-${tone}`}>
      <div className="kpi-title">{React.createElement(Icon, { size: 18 })}<span>{label}</span></div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-detail">{detail}</div>
    </article>
  );
}

function ChartPanel({ title, subtitle, children }) {
  return (
    <article className="sa-panel sa-chart-panel">
      <div className="sa-panel-head">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="sa-chart-box">{children}</div>
    </article>
  );
}

function MiniArea({ data, color = "#6d5efc" }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.34} />
            <stop offset="95%" stopColor={color} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="period" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={36} />
        <Tooltip />
        <Area type="monotone" dataKey="total" stroke={color} fill={`url(#fill-${color.replace("#", "")})`} strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState({});
  const [societies, setSocieties] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [statsRes, analyticsRes, societiesRes, approvalsRes, activitiesRes, ticketsRes] = await Promise.allSettled([
        fetchSuperAdminPlatformStats(),
        fetchSuperAdminAnalytics(),
        fetchSuperAdminSocieties({ page: 1, pageSize: 6 }),
        fetchSuperAdminPendingApprovals({ page: 1, pageSize: 6 }),
        fetchSuperAdminActivityLogs({ page: 1, pageSize: 6 }),
        fetchSuperAdminSupportTickets(),
      ]);

      if (statsRes.status === "fulfilled") setStats(statsRes.value?.data?.cards || {});
      if (analyticsRes.status === "fulfilled") setAnalytics(analyticsRes.value?.data || {});
      if (societiesRes.status === "fulfilled") setSocieties(societiesRes.value?.data || []);
      if (approvalsRes.status === "fulfilled") setApprovals(approvalsRes.value?.data || []);
      if (activitiesRes.status === "fulfilled") setActivities(activitiesRes.value?.activities || []);
      if (ticketsRes.status === "fulfilled") setTickets(ticketsRes.value?.data || []);

      const failed = [statsRes, analyticsRes].find((item) => item.status === "rejected");
      if (failed) setError(failed.reason?.response?.data?.message || "Some dashboard data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const cards = useMemo(() => [
    { label: "Total Societies", value: number(stats?.totalSocieties), detail: "Registered Nexora societies", icon: Building2, tone: "blue" },
    { label: "Active Societies", value: number(stats?.activeSocieties), detail: "Operational tenants", icon: ShieldCheck, tone: "green" },
    { label: "Pending Chairman", value: number(stats?.pendingChairmanRegistrations ?? stats?.chairmanRequests), detail: "Awaiting verification", icon: ClipboardCheck, tone: "amber" },
    { label: "Pending Secretary", value: number(stats?.secretaryRequests), detail: "Requires admin review", icon: Users, tone: "purple" },
    { label: "Total Users", value: number(stats?.totalPlatformUsers), detail: "Across all societies", icon: Users, tone: "blue" },
    { label: "Monthly Revenue", value: money(stats?.revenue), detail: "Captured payments", icon: CreditCard, tone: "green" },
    { label: "Active Subscriptions", value: number(stats?.activeSubscriptions), detail: `${number(stats?.expiringSubscriptions)} expiring soon`, icon: TrendingUp, tone: "purple" },
    { label: "Support Tickets", value: number(stats?.totalComplaints || tickets.length), detail: "Support and complaint queue", icon: Headphones, tone: "amber" },
    { label: "System Health", value: "Good", detail: `${number(stats?.loginEvents)} login events`, icon: HeartPulse, tone: "green" },
  ], [stats, tickets.length]);

  const subscriptionDistribution = [
    { name: "Active", value: Number(stats?.activeSubscriptions || 0), color: "#10b981" },
    { name: "Expiring", value: Number(stats?.expiringSubscriptions || 0), color: "#f59e0b" },
    { name: "Pending", value: Number(stats?.pendingSocietyRequests || 0), color: "#6d5efc" },
  ].filter((item) => item.value > 0);

  const approvalTrend = [
    { period: "Chairman", total: Number(stats?.pendingChairmanRegistrations ?? stats?.chairmanRequests ?? 0) },
    { period: "Secretary", total: Number(stats?.secretaryRequests || 0) },
    { period: "All", total: Number(stats?.pendingApprovals || 0) },
  ];

  if (loading) {
    return (
      <div>
        <section className="sa-page-head"><div><h1>Dashboard Overview</h1><p>Loading live platform intelligence.</p></div></section>
        <section className="sa-skeleton-grid">{Array.from({ length: 9 }, (_, index) => <div className="sa-skeleton" key={index} />)}</section>
      </div>
    );
  }

  return (
    <div className="sa-dashboard-view">
      <section className="sa-page-head sa-hero-head">
        <div>
          <span className="sa-eyebrow">Nexora Command Center</span>
          <h1>Dashboard Overview</h1>
          <p>Live societies, approvals, revenue, user growth, support, and audit health from the Super Admin control layer.</p>
        </div>
        <button className="sa-btn sa-btn-ghost" type="button" onClick={load}>Refresh data</button>
      </section>

      {error ? <div className="sa-feedback error" role="alert"><AlertTriangle size={16} /> {error}</div> : null}

      <section className="kpi-grid kpi-grid-compact">
        {cards.map((card) => <Kpi key={card.label} {...card} />)}
      </section>

      <section className="sa-chart-grid">
        <ChartPanel title="Society Growth Trend" subtitle="Monthly society onboarding">
          <MiniArea data={analytics.societyGrowth || []} color="#6d5efc" />
        </ChartPanel>
        <ChartPanel title="Revenue Trend" subtitle="Captured bill payments">
          <MiniArea data={analytics.revenueTrend || []} color="#10b981" />
        </ChartPanel>
        <ChartPanel title="User Registration Trend" subtitle="New platform users">
          <MiniArea data={analytics.userGrowth || []} color="#0ea5e9" />
        </ChartPanel>
        <ChartPanel title="Approval Trend" subtitle="Current approval pressure">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={approvalTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={36} />
              <Tooltip />
              <Bar dataKey="total" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Subscription Distribution" subtitle="Active, pending, and renewal load">
          {subscriptionDistribution.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={subscriptionDistribution} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={4}>
                  {subscriptionDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="sa-empty-inline">No subscription records yet.</div>}
        </ChartPanel>
        <ChartPanel title="Support Ticket Status" subtitle="Support load by month">
          <MiniArea data={analytics.complaintTrend || []} color="#f43f5e" />
        </ChartPanel>
      </section>

      <section className="sa-grid-3">
        <article className="sa-panel">
          <h2>Recent Societies</h2>
          <div className="sa-list">
            {societies.length ? societies.map((society) => (
              <article key={society.id}>
                <span>{society.society_name || society.name}<small>{society.code}</small></span>
                <strong>{String(society.status || "-").replace(/_/g, " ")}</strong>
              </article>
            )) : <div className="sa-empty-inline">No societies found.</div>}
          </div>
        </article>
        <article className="sa-panel">
          <h2>Pending Approvals</h2>
          <div className="sa-list">
            {approvals.length ? approvals.map((approval) => (
              <article key={approval.approval_id || approval.user_id}>
                <span>{approval.name}<small>{approval.society_name || approval.society_code}</small></span>
                <strong>{approval.role}</strong>
              </article>
            )) : <div className="sa-empty-inline">No pending approvals.</div>}
          </div>
        </article>
        <article className="sa-panel">
          <h2>Recent Activities</h2>
          <div className="sa-list">
            {activities.length ? activities.map((activity) => (
              <article key={activity.id}>
                <Activity size={17} />
                <span>{activity.action}<small>{activity.user_email || "System"}</small></span>
                <strong>{activity.status || "ok"}</strong>
              </article>
            )) : <div className="sa-empty-inline">No audit activity yet.</div>}
          </div>
        </article>
      </section>
    </div>
  );
}
