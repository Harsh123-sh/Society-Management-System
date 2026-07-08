import React, { useEffect, useState } from "react";
import { Headphones, RefreshCw } from "lucide-react";
import { fetchSuperAdminSupportTickets, updateSuperAdminSupportTicketStatus } from "../../services/authApi";

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [summary, setSummary] = useState({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  async function load(nextStatus = status) {
    setLoading(true);
    try {
      const response = await fetchSuperAdminSupportTickets(nextStatus ? { status: nextStatus } : {});
      setTickets(response?.data || []);
      setSummary(response?.summary || {});
    } catch (error) {
      setNotice({ type: "error", message: error?.response?.data?.message || "Failed to load support tickets." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(status); }, [status]);

  async function update(ticket, nextStatus) {
    try {
      await updateSuperAdminSupportTicketStatus(ticket.id, { status: nextStatus });
      setNotice({ type: "success", message: `Ticket moved to ${nextStatus.replace(/_/g, " ")}.` });
      load();
    } catch (error) {
      setNotice({ type: "error", message: error?.response?.data?.message || "Failed to update ticket." });
    }
  }

  return (
    <div>
      <section className="sa-page-head">
        <div>
          <span className="sa-eyebrow">Support Desk</span>
          <h1>Support Tickets</h1>
          <p>Track open, in-progress, resolved, escalated, and society-wise support tickets.</p>
        </div>
        <button className="sa-btn" onClick={() => load()} type="button"><RefreshCw size={16} /> Refresh</button>
      </section>
      {notice.message ? <div className={`sa-feedback ${notice.type}`}>{notice.message}</div> : null}
      <section className="kpi-grid">
        {["open", "pending", "in_progress", "resolved", "escalated"].map((item) => (
          <button key={item} type="button" className={`kpi-card sa-filter-card ${status === item ? "active" : ""}`} onClick={() => setStatus(status === item ? "" : item)}>
            <div className="kpi-title"><Headphones size={18} /> {item.replace(/_/g, " ")}</div>
            <div className="kpi-value">{summary[item] || 0}</div>
            <div className="kpi-detail">Ticket status</div>
          </button>
        ))}
      </section>
      {loading ? <div className="sa-loading">Loading support tickets...</div> : (
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead><tr><th>Ticket</th><th>Society</th><th>Requester</th><th>Priority</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td><strong>{ticket.title || `Ticket #${ticket.id}`}</strong><small>{ticket.description || ""}</small></td>
                  <td>{ticket.society_name || "-"} {ticket.society_code ? `(${ticket.society_code})` : ""}</td>
                  <td>{ticket.requester_name || ticket.requester_email || "-"}</td>
                  <td>{ticket.priority || ticket.category || "normal"}</td>
                  <td><span className={`sa-badge status-${ticket.status}`}>{String(ticket.status || "open").replace(/_/g, " ")}</span></td>
                  <td>{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString("en-IN") : "-"}</td>
                  <td>
                    <div className="sa-row-actions">
                      <button className="sa-btn sa-btn-ghost" type="button" onClick={() => update(ticket, "in_progress")}>Assign</button>
                      <button className="sa-btn sa-btn-ghost" type="button" onClick={() => update(ticket, "escalated")}>Escalate</button>
                      <button className="sa-btn" type="button" onClick={() => update(ticket, "resolved")}>Resolve</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!tickets.length ? <tr><td colSpan="7"><div className="sa-empty-inline">No support tickets found.</div></td></tr> : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
