import React, { useEffect, useState } from "react";
import { CreditCard, RefreshCw } from "lucide-react";
import { fetchSuperAdminSubscriptions } from "../../services/authApi";

export default function Plans() {
  const [data, setData] = useState({ summary: {}, plans: [], subscriptions: [] });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  async function load() {
    setLoading(true);
    try {
      const response = await fetchSuperAdminSubscriptions();
      setData(response?.data || { summary: {}, plans: [], subscriptions: [] });
    } catch (error) {
      setNotice({ type: "error", message: error?.response?.data?.message || "Failed to load plans." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <section className="sa-page-head">
        <div>
          <span className="sa-eyebrow">Subscription Controls</span>
          <h1>Subscription Plans</h1>
          <p>Manage plan tiers, active subscriptions, billing status, expiry dates, and tenant limits.</p>
        </div>
        <button className="sa-btn" onClick={load} type="button"><RefreshCw size={16} /> Refresh</button>
      </section>
      {notice.message ? <div className={`sa-feedback ${notice.type}`}>{notice.message}</div> : null}
      <section className="sa-plan-grid">
        {(data.plans?.length ? data.plans : [
          { name: "Starter", key: "starter", price: 4999 },
          { name: "Professional", key: "professional", price: 12999 },
          { name: "Enterprise", key: "enterprise", price: 29999 },
        ]).map((plan) => (
          <article className="sa-panel sa-plan-card" key={plan.key || plan.name}>
            <CreditCard size={20} />
            <h2>{plan.name}</h2>
            <strong>Rs. {Number(plan.price || 0).toLocaleString("en-IN")}/mo</strong>
            <p>{plan.key === "enterprise" ? "Unlimited societies, premium support, custom limits." : plan.key === "professional" || plan.key === "premium" ? "Higher user and flat limits for growing communities." : "Best for new societies starting with Nexora."}</p>
            <div className="sa-limit-row"><span>Max users</span><b>{plan.key === "enterprise" ? "Unlimited" : plan.key === "starter" ? "250" : "2,000"}</b></div>
            <div className="sa-limit-row"><span>Max flats</span><b>{plan.key === "enterprise" ? "Unlimited" : plan.key === "starter" ? "120" : "1,000"}</b></div>
            <div className="sa-limit-row"><span>Max societies</span><b>{plan.key === "enterprise" ? "Unlimited" : "1"}</b></div>
          </article>
        ))}
      </section>
      {loading ? <div className="sa-loading">Loading subscriptions...</div> : (
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead><tr><th>Society</th><th>Plan</th><th>Status</th><th>Billing Cycle</th><th>Expiry</th><th>Monthly Value</th></tr></thead>
            <tbody>
              {(data.subscriptions || []).map((item) => (
                <tr key={item.id}>
                  <td>{item.society_name} ({item.society_code})</td>
                  <td>{item.plan_name}</td>
                  <td><span className={`sa-badge status-${item.status}`}>{item.status}</span></td>
                  <td>{item.billing_cycle || "monthly"}</td>
                  <td>{item.renewal_at ? new Date(item.renewal_at).toLocaleDateString("en-IN") : "-"}</td>
                  <td>Rs. {Number(item.monthly_value || 0).toLocaleString("en-IN")}</td>
                </tr>
              ))}
              {!data.subscriptions?.length ? <tr><td colSpan="6"><div className="sa-empty-inline">No active subscription records yet.</div></td></tr> : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
