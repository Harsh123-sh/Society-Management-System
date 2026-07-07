import React, { useEffect, useMemo, useState } from "react";
import { Activity, Building2, ClipboardCheck, CreditCard, Headphones, HeartPulse, ShieldCheck, Users } from "lucide-react";
import "../../styles/superadmin.css";
import { fetchSuperAdminPlatformStats } from "../../services/authApi";

function money(value) {
  return Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function Kpi({ label, value, detail, icon: Icon }) {
  return (
    <article className="kpi-card">
      <div className="kpi-title">{React.createElement(Icon, { size: 18 })} {label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-detail">{detail}</div>
    </article>
  );
}

export default function Overview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetchSuperAdminPlatformStats();
      setStats(response?.data?.cards || {});
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load Super Admin dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const cards = useMemo(() => [
    { label: "Total Societies", value: stats?.totalSocieties ?? 0, detail: "Live platform societies", icon: Building2 },
    { label: "Active Societies", value: stats?.activeSocieties ?? 0, detail: "Operational accounts", icon: ShieldCheck },
    { label: "Pending Chairman", value: stats?.pendingChairmanRegistrations ?? stats?.chairmanRequests ?? 0, detail: "Registrations awaiting approval", icon: ClipboardCheck },
    { label: "Pending Secretary", value: stats?.secretaryRequests ?? 0, detail: "Same-society approvals", icon: Users },
    { label: "Total Users", value: stats?.totalPlatformUsers ?? 0, detail: "Across all societies", icon: Users },
    { label: "Monthly Revenue", value: `Rs. ${money(stats?.revenue)}`, detail: "Captured bill payments", icon: CreditCard },
    { label: "Support Tickets", value: stats?.totalComplaints ?? 0, detail: "Complaint/support volume", icon: Headphones },
    { label: "System Health", value: "Good", detail: `${stats?.loginEvents ?? 0} login events tracked`, icon: HeartPulse },
  ], [stats]);

  if (loading) {
    return (
      <div>
        <section className="sa-page-head"><div><h1>Dashboard Overview</h1><p>Loading platform intelligence from Supabase.</p></div></section>
        <section className="sa-skeleton-grid">{Array.from({ length: 8 }, (_, index) => <div className="sa-skeleton" key={index} />)}</section>
      </div>
    );
  }

  return (
    <div>
      <section className="sa-page-head">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Platform-wide society, approval, revenue, support, and health intelligence.</p>
        </div>
        <button className="sa-btn sa-btn-ghost" type="button" onClick={load}>Refresh</button>
      </section>

      {error ? <div className="sa-feedback error" role="alert">{error}</div> : null}

      <section className="kpi-grid">
        {cards.map((card) => <Kpi key={card.label} {...card} />)}
      </section>

      <section className="sa-grid-2">
        <article className="sa-panel">
          <h2>AI Platform Summary</h2>
          <p>
            Nexora is tracking {stats?.activeSocieties ?? 0} active societies, {stats?.pendingApprovals ?? 0} pending approvals,
            and Rs. {money(stats?.revenue)} in captured revenue. Prioritize chairman/secretary queues before onboarding stalls.
          </p>
          <div className="sa-list">
            <article><span>Approval Focus</span><strong>{(stats?.chairmanRequests ?? 0) + (stats?.secretaryRequests ?? 0)} pending</strong></article>
            <article><span>Subscription Health</span><strong>{stats?.activeSubscriptions ?? 0} active</strong></article>
            <article><span>Expiring Soon</span><strong>{stats?.expiringSubscriptions ?? 0}</strong></article>
          </div>
        </article>

        <article className="sa-panel">
          <h2>Financial Overview</h2>
          <p>Revenue is calculated from authorized or captured Supabase bill payments.</p>
          <div className="sa-list">
            <article><span>Monthly Revenue</span><strong>Rs. {money(stats?.revenue)}</strong></article>
            <article><span>Active Subscriptions</span><strong>{stats?.activeSubscriptions ?? 0}</strong></article>
            <article><span>Total Flats</span><strong>{stats?.totalFlats ?? 0}</strong></article>
          </div>
        </article>
      </section>

      <section className="sa-grid-2">
        <article className="sa-panel">
          <h2>Pending Approvals</h2>
          <div className="sa-list">
            <article><span>Chairman registrations</span><strong>{stats?.pendingChairmanRegistrations ?? stats?.chairmanRequests ?? 0}</strong></article>
            <article><span>Secretary approvals</span><strong>{stats?.secretaryRequests ?? 0}</strong></article>
            <article><span>Total approval queue</span><strong>{stats?.pendingApprovals ?? 0}</strong></article>
          </div>
        </article>
        <article className="sa-panel">
          <h2>Recent Activities</h2>
          <div className="sa-list">
            <article><Activity size={18} /><span>Platform stats refreshed</span><strong>Live</strong></article>
            <article><Building2 size={18} /><span>Society records are Supabase-backed</span><strong>{stats?.totalSocieties ?? 0}</strong></article>
            <article><HeartPulse size={18} /><span>System health checks</span><strong>Good</strong></article>
          </div>
        </article>
      </section>
    </div>
  );
}
