import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchSuperAdminSocietyDetails, getApiMessage } from "../services/authApi";

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function Metric({ label, value, helper }) {
  return (
    <motion.div className="sa-stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -6 }}>
      <p>{label}</p>
      <strong>{value}</strong>
      {helper ? <span>{helper}</span> : null}
    </motion.div>
  );
}

function SocietyStat({ label, value }) {
  return (
    <div className="sa-mini-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function Badge({ value }) {
  const tone = String(value || "").toLowerCase();
  const classes =
    tone === "active"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
      : tone === "suspended" || tone === "deleted"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
        : tone === "trial" || tone === "inactive"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
          : "border-white/10 bg-white/5 text-slate-200";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${classes}`}>{value || "unknown"}</span>;
}

export default function SuperAdminSocietyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSociety() {
      setLoading(true);
      setError("");

      if (!id) {
        setError("Invalid society identifier.");
        setLoading(false);
        return;
      }

      try {
        console.log("[SuperAdminSocietyAPI] detail page loading", { id });
        const response = await fetchSuperAdminSocietyDetails(id);
        console.log("[SuperAdminSocietyAPI] detail page response", response);
        if (!cancelled) {
          setPayload(response?.data || null);
        }
      } catch (err) {
        const message = getApiMessage(err, "Failed to load society details.");
        console.error("[SuperAdminSocietyAPI] detail page error", err?.response?.data || err?.message || err);
        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSociety();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const society = payload?.society;
  const counts = payload?.counts || {};
  const analytics = payload?.analytics || [];
  const subscription = payload?.subscription || null;

  return (
    <div className="superadmin-shell superadmin-details">
      <div className="sa-container">
        <header className="sa-hero">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="sa-eyebrow">Society details</p>
              <h1>{society?.name || "Society details"}</h1>
              <p>
                Review the full society profile, status, counts, payments, complaints, visitors, flats, and analytics from the shared MySQL source.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge value={society?.status} />
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">Code: {society?.society_code || society?.code || "-"}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">Created: {formatDate(society?.created_at)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/super-admin/dashboard")}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-[var(--text-main)] transition hover:bg-white/10"
              >
                Back to dashboard
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-full bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="rounded-[24px] border border-dashed border-white/15 bg-white/5 px-6 py-8 text-slate-300">Loading society details...</div>
        ) : error ? (
          <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 px-6 py-5 text-rose-100">{error}</div>
        ) : society ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric label="Total users" value={counts.totalUsers ?? 0} helper="All users in this society" />
              <Metric label="Residents" value={counts.totalResidents ?? 0} helper="Active resident accounts" />
              <Metric label="Flats" value={counts.totalFlats ?? 0} helper="Total flat records" />
              <Metric label="Complaints" value={counts.totalComplaints ?? 0} helper="Complaint records across the society" />
            </section>

            <section className="sa-panel">
              <div className="sa-panel__header">
                <div>
                  <p className="sa-eyebrow">Society health</p>
                  <h2>Health indicators and management actions</h2>
                  <p>Fast operational readout for occupancy, approvals, security, billing, and complaint pressure.</p>
                </div>
              </div>
              <div className="sa-panel__body">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <SocietyStat label="Occupancy health" value={`${counts.occupiedFlats ?? 0}/${counts.totalFlats ?? 0} flats`} />
                  <SocietyStat label="Complaint pressure" value={`${counts.pendingComplaints ?? 0} pending`} />
                  <SocietyStat label="Security readiness" value={`${counts.activeSecurityStaff ?? 0} active staff`} />
                  <SocietyStat label="Billing activity" value={`${counts.totalPayments ?? 0} payments`} />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={() => navigate("/super-admin/dashboard")} className="sa-secondary-btn">Open society management</button>
                  <button type="button" onClick={() => window.print()} className="sa-secondary-btn">Export profile</button>
                  <button type="button" onClick={() => window.location.reload()} className="sa-primary-btn">Refresh health</button>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="sa-panel">
                <div className="sa-panel__body">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Society profile</p>
                    <h2 className="mt-2 text-2xl font-semibold text-[var(--text-main)]">Core details</h2>
                  </div>
                  <Badge value={society.status} />
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <SocietyStat label="Society name" value={society.name || "-"} />
                  <SocietyStat label="Society code" value={society.society_code || society.code || "-"} />
                  <SocietyStat label="City" value={society.city || "-"} />
                  <SocietyStat label="State" value={society.state || "-"} />
                  <SocietyStat label="Address" value={society.address || "-"} />
                  <SocietyStat label="Pincode" value={society.pincode || "-"} />
                  <SocietyStat label="Contact email" value={society.contact_email || "-"} />
                  <SocietyStat label="Contact phone" value={society.contact_phone || "-"} />
                </div>
                </div>
              </div>

              <div className="sa-panel">
                <div className="sa-panel__body">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Operations</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--text-main)]">Live society metrics</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <SocietyStat label="Chairman" value={counts.chairmanCount ?? 0} />
                  <SocietyStat label="Secretary" value={counts.secretaryCount ?? 0} />
                  <SocietyStat label="Security staff" value={counts.activeSecurityStaff ?? 0} />
                  <SocietyStat label="Visitors" value={counts.totalVisitors ?? 0} />
                  <SocietyStat label="Payments" value={counts.totalPayments ?? 0} />
                  <SocietyStat label="Occupied flats" value={counts.occupiedFlats ?? 0} />
                  <SocietyStat label="Vacant flats" value={counts.vacantFlats ?? 0} />
                  <SocietyStat label="Pending complaints" value={counts.pendingComplaints ?? 0} />
                </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/20 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Subscription</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--text-main)]">Billing context</h2>
                <div className="mt-6 space-y-3 text-sm text-slate-300">
                  <p><span className="text-slate-500">Plan:</span> {subscription?.plan_name || society.subscription_plan || "starter"}</p>
                  <p><span className="text-slate-500">Billing cycle:</span> {subscription?.billing_cycle || "monthly"}</p>
                  <p><span className="text-slate-500">Status:</span> {subscription?.status || "trial"}</p>
                  <p><span className="text-slate-500">Renewal:</span> {formatDate(subscription?.renewal_at)}</p>
                  <p><span className="text-slate-500">Provider:</span> {subscription?.provider_name || "platform"}</p>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-lg shadow-slate-950/20 backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Analytics history</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--text-main)]">Stored monthly metrics</h2>
                {Array.isArray(analytics) && analytics.length ? (
                  <div className="mt-6 space-y-3">
                    {analytics.map((item) => (
                      <div key={item.id} className="rounded-[20px] border border-white/10 theme-surface px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-[var(--text-main)]">{item.metricDate}</p>
                          <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
                        </div>
                        <pre className="mt-2 overflow-auto text-xs text-slate-300">{JSON.stringify(item.metrics, null, 2)}</pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-[20px] border border-white/10 theme-surface px-5 py-6 text-slate-300">No analytics history recorded yet.</div>
                )}
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-[24px] border border-white/10 bg-white/5 px-6 py-8 text-slate-300">No society found.</div>
        )}
      </div>
    </div>
  );
}
