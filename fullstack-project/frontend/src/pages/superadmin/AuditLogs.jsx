import React, { useEffect, useState } from "react";
import { FileClock, RefreshCw, Search } from "lucide-react";
import { fetchSuperAdminActivityLogs } from "../../services/authApi";

export default function AuditLogs() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  async function load(page = pagination.page || 1) {
    setLoading(true);
    try {
      const response = await fetchSuperAdminActivityLogs({ page, pageSize: 25, search: search || undefined, action: action || undefined });
      setRows(response?.activities || []);
      setPagination({ page: response?.page || page, totalPages: response?.totalPages || 1, total: response?.total || 0 });
    } catch (error) {
      setNotice({ type: "error", message: error?.response?.data?.message || "Failed to load audit logs." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); }, [action]);

  return (
    <div>
      <section className="sa-page-head">
        <div>
          <span className="sa-eyebrow">Compliance Timeline</span>
          <h1>Audit Logs</h1>
          <p>Track login, logout, society changes, approvals, rejections, suspensions, settings, and failed attempts.</p>
        </div>
        <button className="sa-btn" onClick={() => load()} type="button"><RefreshCw size={16} /> Refresh</button>
      </section>
      {notice.message ? <div className={`sa-feedback ${notice.type}`}>{notice.message}</div> : null}
      <section className="sa-page-toolbar">
        <label className="sa-toolbar-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter user, role, action, society" /></label>
        <select value={action} onChange={(event) => setAction(event.target.value)}>
          <option value="">All actions</option>
          <option value="super_admin_login">Login</option>
          <option value="society_created">Society created</option>
          <option value="society_updated">Society updated</option>
          <option value="user_active">User approved/active</option>
          <option value="user_suspended">User suspended</option>
          <option value="user_deleted">User deleted</option>
        </select>
        <button className="sa-btn" type="button" onClick={() => load(1)}>Apply filters</button>
      </section>
      {loading ? <div className="sa-loading">Loading audit logs...</div> : (
        <section className="sa-timeline">
          {rows.map((row) => (
            <article key={row.id}>
              <div className="sa-timeline-icon"><FileClock size={17} /></div>
              <div>
                <h2>{String(row.action || "activity").replace(/_/g, " ")}</h2>
                <p>{row.user_name || row.user_email || "System"} {row.resource_type ? `changed ${row.resource_type}` : ""}</p>
                <small>{row.created_at ? new Date(row.created_at).toLocaleString("en-IN") : ""}</small>
              </div>
              <span className={`sa-badge status-${row.status || "success"}`}>{row.status || "success"}</span>
            </article>
          ))}
          {!rows.length ? <div className="sa-empty">No audit logs match this filter.</div> : null}
        </section>
      )}
      <div className="sa-pagination">
        <span>{pagination.total} audit events</span>
        <div>
          <button className="sa-btn sa-btn-ghost" disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>Previous</button>
          <button className="sa-btn sa-btn-ghost" disabled={pagination.page >= pagination.totalPages} onClick={() => load(pagination.page + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
