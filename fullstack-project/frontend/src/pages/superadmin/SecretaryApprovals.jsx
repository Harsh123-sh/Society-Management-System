import React, { useEffect, useState } from "react";
import { superAdminApi } from "../../services/authApi";
import Modal from "../../components/superadmin/Modal";

export default function SecretaryApprovals() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await superAdminApi.get("/super-admin/pending-approvals?role=secretary");
      setRows(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function approve(id) {
    if (!confirm('Approve this secretary?')) return;
    try {
      await superAdminApi.post(`/super-admin/pending-approvals/${id}/approve`, {});
      setNotice({ type: "success", message: "Secretary approved." });
      load();
    } catch (error) {
      setNotice({ type: "error", message: error?.response?.data?.message || "Failed to approve secretary." });
    }
  }

  async function reject(id) {
    const reason = prompt("Reason for rejecting this secretary?");
    if (!reason) return;
    try {
      await superAdminApi.post(`/super-admin/pending-approvals/${id}/reject`, { reason });
      setNotice({ type: "success", message: "Secretary rejected." });
      load();
    } catch (error) {
      setNotice({ type: "error", message: error?.response?.data?.message || "Failed to reject secretary." });
    }
  }

  return (
    <div>
      <section className="sa-page-head">
        <div>
          <h1>Secretary Approvals</h1>
          <p>Review secretary registrations. Super Admin approval can override society-level queues.</p>
        </div>
        <button className="sa-btn sa-btn-ghost" type="button" onClick={load}>Refresh</button>
      </section>
      {notice.message ? <div role="status" className={`sa-feedback ${notice.type}`} style={{ marginBottom: 12 }}>{notice.message}</div> : null}
      {loading ? <div className="sa-loading">Loading secretary approvals...</div> : rows.length === 0 ? <div className="sa-empty">No pending secretary approvals.</div> : (
        <div className="sa-table-wrap">
        <table className="sa-table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Society Name</th><th>Society Code</th><th>OTP Verified</th><th>Status</th><th>Requested Date</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.approval_id}>
                <td>{r.name}</td>
                <td>{r.email}</td>
                <td>{r.mobile || "-"}</td>
                <td>{r.society_name}</td>
                <td>{r.society_code}</td>
                <td>{r.is_verified ? "Yes" : "No"}</td>
                <td><span className={`sa-badge status-${r.status}`}>{r.status}</span></td>
                <td>{r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN") : "-"}</td>
                <td>
                  <div className="sa-row-actions">
                    <button className="sa-btn sa-btn-ghost" onClick={() => setSelected(r)}>View</button>
                    <button className="sa-btn" onClick={() => approve(r.approval_id)}>Approve</button>
                    <button className="sa-btn sa-btn-danger" onClick={() => reject(r.approval_id)}>Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
      <Modal title="Secretary Approval Details" visible={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="sa-detail-grid">
            <div><strong>Name</strong><span>{selected.name}</span></div>
            <div><strong>Email</strong><span>{selected.email}</span></div>
            <div><strong>Phone</strong><span>{selected.mobile || "-"}</span></div>
            <div><strong>Society</strong><span>{selected.society_name} ({selected.society_code})</span></div>
            <div><strong>OTP Verified</strong><span>{selected.is_verified ? "Yes" : "No"}</span></div>
            <div><strong>Requested</strong><span>{selected.created_at ? new Date(selected.created_at).toLocaleString("en-IN") : "-"}</span></div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
