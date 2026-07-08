import React, { useEffect, useState } from "react";
import { CreditCard, RefreshCw } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchSuperAdminRevenueStats } from "../../services/authApi";

function rupees(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function Billing() {
  const [data, setData] = useState({ summary: {}, invoices: [], trend: [] });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  async function load() {
    setLoading(true);
    try {
      const response = await fetchSuperAdminRevenueStats();
      setData(response?.data || { summary: {}, invoices: [], trend: [] });
    } catch (error) {
      setNotice({ type: "error", message: error?.response?.data?.message || "Failed to load billing data." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const summary = data.summary || {};

  return (
    <div>
      <section className="sa-page-head">
        <div>
          <span className="sa-eyebrow">Revenue Operations</span>
          <h1>Billing & Revenue</h1>
          <p>Track monthly revenue, active paid societies, pending payments, expired subscriptions, and invoices.</p>
        </div>
        <button className="sa-btn" onClick={load} type="button"><RefreshCw size={16} /> Refresh</button>
      </section>
      {notice.message ? <div className={`sa-feedback ${notice.type}`}>{notice.message}</div> : null}
      <section className="kpi-grid">
        <article className="kpi-card"><div className="kpi-title"><CreditCard size={18} /> Monthly revenue</div><div className="kpi-value">{rupees(summary.monthly_revenue)}</div><div className="kpi-detail">Captured this month</div></article>
        <article className="kpi-card"><div className="kpi-title">Paid payments</div><div className="kpi-value">{summary.paid_payments || 0}</div><div className="kpi-detail">Authorized or captured</div></article>
        <article className="kpi-card"><div className="kpi-title">Pending payments</div><div className="kpi-value">{summary.pending_payments || 0}</div><div className="kpi-detail">Awaiting payment</div></article>
        <article className="kpi-card"><div className="kpi-title">Expired subscriptions</div><div className="kpi-value">{summary.expired_payments || 0}</div><div className="kpi-detail">Past due items</div></article>
      </section>
      <section className="sa-panel sa-chart-panel">
        <h2>Revenue Chart</h2>
        <div className="sa-chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.trend || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="period" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={44} />
              <Tooltip />
              <Area dataKey="total" type="monotone" stroke="#10b981" fill="#10b98133" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
      {loading ? <div className="sa-loading">Loading invoices...</div> : (
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead><tr><th>Invoice</th><th>Society</th><th>Amount</th><th>Status</th><th>Due Date</th><th>Created</th></tr></thead>
            <tbody>
              {(data.invoices || []).map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.title || `Invoice #${invoice.id}`}</td>
                  <td>{invoice.society_name || "-"} {invoice.society_code ? `(${invoice.society_code})` : ""}</td>
                  <td>{rupees(invoice.amount)}</td>
                  <td><span className={`sa-badge status-${invoice.payment_status}`}>{invoice.payment_status || "-"}</span></td>
                  <td>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-IN") : "-"}</td>
                  <td>{invoice.created_at ? new Date(invoice.created_at).toLocaleDateString("en-IN") : "-"}</td>
                </tr>
              ))}
              {!data.invoices?.length ? <tr><td colSpan="6"><div className="sa-empty-inline">No invoice records found.</div></td></tr> : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
