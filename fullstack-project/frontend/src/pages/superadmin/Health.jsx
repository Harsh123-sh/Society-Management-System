import React, { useEffect, useState } from "react";
import { Activity, Database, HeartPulse, RefreshCw, Server, ShieldAlert } from "lucide-react";
import { fetchSuperAdminSystemHealth } from "../../services/authApi";

function HealthCard({ icon, title, status, detail }) {
  return (
    <article className="sa-panel sa-health-card">
      {React.createElement(icon, { size: 22 })}
      <div>
        <h2>{title}</h2>
        <span className={`sa-badge status-${status}`}>{status}</span>
        <p>{detail}</p>
      </div>
    </article>
  );
}

export default function Health() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  async function load() {
    setLoading(true);
    try {
      const response = await fetchSuperAdminSystemHealth();
      setHealth(response?.data || null);
    } catch (error) {
      setNotice({ type: "error", message: error?.response?.data?.message || "Failed to load system health." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <section className="sa-page-head">
        <div>
          <span className="sa-eyebrow">Infrastructure</span>
          <h1>System Health</h1>
          <p>Backend status, Supabase database status, API latency, storage, sessions, and failed login signals.</p>
        </div>
        <button className="sa-btn" onClick={load} type="button"><RefreshCw size={16} /> Refresh</button>
      </section>
      {notice.message ? <div className={`sa-feedback ${notice.type}`}>{notice.message}</div> : null}
      {loading && !health ? <div className="sa-loading">Checking system health...</div> : (
        <section className="sa-health-grid">
          <HealthCard icon={Server} title="Backend Status" status={health?.backend?.status || "unknown"} detail={`Uptime: ${health?.backend?.uptimeSeconds || 0}s`} />
          <HealthCard icon={Database} title="Database Status" status={health?.database?.status || "unknown"} detail={`Latency: ${health?.database?.latencyMs ?? "-"}ms`} />
          <HealthCard icon={Activity} title="API Latency" status={health?.api?.status || "unknown"} detail={`${health?.api?.latencyMs ?? "-"}ms response`} />
          <HealthCard icon={HeartPulse} title="Storage Usage" status={health?.storage?.status || "unknown"} detail={health?.storage?.usagePercent == null ? "Provider storage available" : `${health.storage.usagePercent}% used`} />
          <HealthCard icon={ShieldAlert} title="Active Sessions" status="operational" detail={`${health?.sessions?.active || 0} login events in 24h`} />
          <HealthCard icon={ShieldAlert} title="Failed Logins" status={(health?.sessions?.failedLogins || 0) > 0 ? "degraded" : "operational"} detail={`${health?.sessions?.failedLogins || 0} failed attempts tracked`} />
          <HealthCard icon={Database} title="Supabase Connection" status={health?.supabase?.status || "unknown"} detail={health?.supabase?.host || "Configured database host"} />
        </section>
      )}
    </div>
  );
}
