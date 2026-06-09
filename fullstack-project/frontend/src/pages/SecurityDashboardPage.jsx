import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage } from "../services/authApi";
import {
  acknowledgeVisitorEmergencyAlert,
  approveVisitorPreapproval,
  fetchVisitorAnalytics,
  fetchVisitorDashboard,
  fetchVisitorEmergencyAlerts,
  fetchVisitorHistory,
  issueVisitorQrPass,
} from "../services/visitorApi";
import {
  connectVisitorSocket,
  disconnectVisitorSocket,
  onVisitorBlacklist,
  onVisitorEmergencyAlert,
  onVisitorNewEntry,
  onVisitorOtpVerified,
  onVisitorPreapproval,
} from "../services/visitorSocket";

function MetricCard({ title, value, helper, tone = "slate" }) {
  const toneMap = {
    slate: "border-[var(--border)] bg-[var(--card-bg)]",
    blue: "border-sky-200 bg-sky-50",
    green: "border-emerald-200 bg-emerald-50",
    amber: "border-amber-200 bg-amber-50",
    red: "border-rose-200 bg-rose-50",
  };

  return (
    <article className={`surface-card app-surface rounded-3xl border p-5 ${toneMap[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--app-text-muted-rgb))]">{title}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-sm text-[rgb(var(--app-text-muted-rgb))]">{helper}</p>
    </article>
  );
}

function SecurityDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [feed, setFeed] = useState([]);
  const [alert, setAlert] = useState({ type: "", message: "" });

  async function loadData() {
    try {
      setLoading(true);
      const [dashboardResponse, analyticsResponse, alertsResponse, historyResponse] = await Promise.allSettled([
        fetchVisitorDashboard(),
        fetchVisitorAnalytics(),
        fetchVisitorEmergencyAlerts(),
        fetchVisitorHistory({ fromDate: new Date().toISOString().slice(0, 10) }),
      ]);

      const nextAlerts = [];

      if (dashboardResponse.status === "fulfilled") {
        setDashboard(dashboardResponse.value?.data || null);
      } else {
        setDashboard(null);
        nextAlerts.push("Visitor dashboard summary could not load.");
        console.error("[SecurityDashboardPage] dashboard error", dashboardResponse.reason);
      }

      if (analyticsResponse.status === "fulfilled") {
        setAnalytics(analyticsResponse.value?.data || null);
      } else {
        setAnalytics(null);
        nextAlerts.push("Visitor analytics could not load.");
        console.error("[SecurityDashboardPage] analytics error", analyticsResponse.reason);
      }

      if (alertsResponse.status === "fulfilled") {
        setAlerts(alertsResponse.value?.data || []);
      } else {
        setAlerts([]);
        nextAlerts.push("Emergency alerts could not load.");
        console.error("[SecurityDashboardPage] alerts error", alertsResponse.reason);
      }

      if (historyResponse.status === "fulfilled") {
        setHistory(historyResponse.value?.data || []);
      } else {
        setHistory([]);
        nextAlerts.push("Visitor history could not load.");
        console.error("[SecurityDashboardPage] history error", historyResponse.reason);
      }

      setAlert(
        nextAlerts.length
          ? { type: "info", message: nextAlerts.join(" ") }
          : { type: "", message: "" }
      );
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not load visitor dashboard") });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    connectVisitorSocket();

    const offEntry = onVisitorNewEntry((payload) => {
      setFeed((prev) => [{ type: "entry", payload, at: new Date().toLocaleTimeString() }, ...prev].slice(0, 8));
      loadData();
    });
    const offPreapproval = onVisitorPreapproval((payload) => {
      setFeed((prev) => [{ type: "approval", payload, at: new Date().toLocaleTimeString() }, ...prev].slice(0, 8));
      loadData();
    });
    const offBlacklist = onVisitorBlacklist((payload) => {
      setFeed((prev) => [{ type: "blacklist", payload, at: new Date().toLocaleTimeString() }, ...prev].slice(0, 8));
      loadData();
    });
    const offAlert = onVisitorEmergencyAlert((payload) => {
      setFeed((prev) => [{ type: "alert", payload, at: new Date().toLocaleTimeString() }, ...prev].slice(0, 8));
      loadData();
    });
    const offOtp = onVisitorOtpVerified((payload) => {
      setFeed((prev) => [{ type: "otp", payload, at: new Date().toLocaleTimeString() }, ...prev].slice(0, 8));
    });

    return () => {
      offEntry();
      offPreapproval();
      offBlacklist();
      offAlert();
      offOtp();
      disconnectVisitorSocket();
    };
  }, []);

  const summary = dashboard?.summary || {};
  const pendingApprovals = dashboard?.pendingApprovals || [];
  const recentVisitors = dashboard?.recentVisitors || [];
  const activePasses = dashboard?.activePasses || [];
  const blacklistEntries = dashboard?.blacklistEntries || [];
  const dashboardDeliveries = dashboard?.deliveries || [];
  const dashboardVehicles = dashboard?.vehicles || [];

  const wingStats = useMemo(() => analytics?.byWing || [], [analytics]);
  const purposeStats = useMemo(() => analytics?.byPurpose || [], [analytics]);

  async function handleApprove(id) {
    try {
      const response = await approveVisitorPreapproval(id);
      setAlert({ type: "success", message: response.message || "Visitor approved" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not approve visitor") });
    }
  }

  async function handleIssuePass(id) {
    try {
      const response = await issueVisitorQrPass(id);
      setAlert({ type: "success", message: response.message || "QR pass issued" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not issue QR pass") });
    }
  }

  async function handleAckAlert(id) {
    try {
      const response = await acknowledgeVisitorEmergencyAlert(id);
      setAlert({ type: "success", message: response.message || "Alert acknowledged" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not acknowledge alert") });
    }
  }

  if (loading) {
    return <div className="text-sm text-[var(--text-secondary)]">Loading visitor dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-[var(--hero-bg)] p-6 text-[var(--text-main)] shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">Smart Security Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold">Visitor Operations Center</h1>
        <p className="mt-2 max-w-3xl text-sm text-emerald-100">
          Realtime approvals, QR passes, OTP verification, face recognition, blacklist detection, and emergency alerts.
        </p>
      </section>

      <AlertMessage type={alert.type} message={alert.message} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total visits" value={summary.total_visits || 0} helper="All recorded visits" tone="blue" />
        <MetricCard title="Today visits" value={summary.today_visits || 0} helper="Entries logged today" tone="green" />
        <MetricCard title="Active visits" value={summary.active_visits || 0} helper="Visitors inside premises" tone="amber" />
        <MetricCard title="Blacklist hits" value={summary.blacklist_hits || 0} helper="Blocked or flagged entries" tone="red" />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Pending Resident Approvals</h2>
          <div className="mt-4 space-y-3">
            {pendingApprovals.length ? pendingApprovals.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-[rgb(var(--app-surface-muted-rgb))] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{item.visitor_name}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{item.purpose} • {item.visit_date}</p>
                    <p className="text-xs text-[var(--text-secondary)]">Flat {item.wing || "-"}-{item.flat_number || item.flat_id || "-"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-lg bg-[rgb(var(--app-primary-rgb))] px-3 py-2 text-xs font-semibold text-[var(--text-main)] transition-all hover:opacity-90" onClick={() => handleApprove(item.id)}>
                      Approve
                    </button>
                    <button className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[rgb(var(--app-primary-rgb))]" onClick={() => handleIssuePass(item.id)}>
                      Issue QR
                    </button>
                  </div>
                </div>
              </div>
            )) : <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">No pending approvals.</p>}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Realtime Security Feed</h2>
          <div className="mt-4 space-y-3">
            {feed.length ? feed.map((item, index) => (
              <div key={`${item.type}-${index}`} className="rounded-2xl border border-[var(--border)] bg-[rgb(var(--app-surface-muted-rgb))] p-3 text-sm text-[var(--text-secondary)]">
                <p className="font-semibold text-[var(--text-primary)]">{item.type.toUpperCase()}</p>
                <p>{item.at}</p>
              </div>
            )) : <p className="text-sm text-[var(--text-secondary)]">Waiting for realtime visitor activity.</p>}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Visitors</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                  <th className="px-3 py-2">Visitor</th>
                  <th className="px-3 py-2">Flat</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {recentVisitors.slice(0, 8).map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border)]">
                    <td className="px-3 py-2 font-medium text-[var(--text-primary)]">{row.visitor_name}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{row.wing || "-"}-{row.flat_number || "-"}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{row.status}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{Number(row.face_match_confidence || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Analytics</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--app-text-muted-rgb))]">By Wing</p>
              <div className="mt-3 space-y-3">
                {wingStats.map((item) => (
                  <div key={item.wing}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[var(--text-primary)]">Wing {item.wing}</span>
                      <span className="text-[var(--text-secondary)]">{item.total}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-[rgb(var(--app-surface-muted-rgb))]">
                      <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, Number(item.total || 0) * 10)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--app-text-muted-rgb))]">By Purpose</p>
              <div className="mt-3 space-y-3">
                {purposeStats.map((item) => (
                  <div key={item.purpose}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[var(--text-primary)]">{item.purpose}</span>
                      <span className="text-[var(--text-secondary)]">{item.total}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-[rgb(var(--app-surface-muted-rgb))]">
                      <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(100, Number(item.total || 0) * 10)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Active QR Passes</h2>
          <div className="mt-4 space-y-3">
            {activePasses.map((pass) => (
              <div key={pass.id} className="rounded-xl border border-[var(--border)] bg-[rgb(var(--app-surface-muted-rgb))] p-3 text-sm">
                <p className="font-semibold text-[var(--text-primary)]">{pass.visitor_name}</p>
                <p className="text-[var(--text-secondary)]">Token: {pass.pass_token}</p>
                <p className="text-[var(--text-secondary)]">Expires: {new Date(pass.expires_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Vehicle Entries</h2>
          <div className="mt-4 space-y-3">
            {dashboardVehicles.slice(0, 5).map((vehicle) => (
              <div key={vehicle.id} className="rounded-xl border border-[var(--border)] bg-[rgb(var(--app-surface-muted-rgb))] p-3 text-sm">
                <p className="font-semibold text-[var(--text-primary)]">{vehicle.vehicle_number}</p>
                <p className="text-[var(--text-secondary)]">{vehicle.owner_name || "Unknown"}</p>
                <p className="text-[var(--text-secondary)]">{vehicle.entry_method} • {vehicle.status}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Deliveries</h2>
          <div className="mt-4 space-y-3">
            {dashboardDeliveries.slice(0, 5).map((delivery) => (
              <div key={delivery.id} className="rounded-xl border border-[var(--border)] bg-[rgb(var(--app-surface-muted-rgb))] p-3 text-sm">
                <p className="font-semibold text-[var(--text-primary)]">{delivery.delivery_type}</p>
                <p className="text-[var(--text-secondary)]">{delivery.recipient_name || delivery.package_id || "Delivery item"}</p>
                <p className="text-[var(--text-secondary)]">Status: {delivery.status}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-rose-950">Blacklisted Visitors</h2>
          <div className="mt-4 space-y-3">
            {blacklistEntries.length ? blacklistEntries.map((item) => (
              <div key={item.id} className="rounded-xl border border-rose-200 bg-[var(--card-bg)] p-3 text-sm">
                <p className="font-semibold text-[var(--text-primary)]">{item.visitor_name || item.phone || "Unknown visitor"}</p>
                <p className="text-[var(--text-secondary)]">{item.reason}</p>
              </div>
            )) : <p className="text-sm text-[var(--text-secondary)]">No active blacklist entries.</p>}
          </div>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-amber-950">Emergency Alerts</h2>
          <div className="mt-4 space-y-3">
            {alerts.length ? alerts.map((item) => (
              <div key={item.id} className="rounded-xl border border-amber-200 bg-[var(--card-bg)] p-3 text-sm">
                <p className="font-semibold text-[var(--text-primary)]">{item.alert_type} • {item.severity}</p>
                <p className="text-[var(--text-secondary)]">{item.message}</p>
                <div className="mt-2 flex gap-2">
                  <button className="rounded-lg bg-[rgb(var(--app-primary-rgb))] px-3 py-2 text-xs font-semibold text-[var(--text-main)]" onClick={() => handleAckAlert(item.id)}>
                    Acknowledge
                  </button>
                </div>
              </div>
            )) : <p className="text-sm text-[var(--text-secondary)]">No active emergency alerts.</p>}
          </div>
        </article>
      </section>
    </div>
  );
}

export default SecurityDashboardPage;
