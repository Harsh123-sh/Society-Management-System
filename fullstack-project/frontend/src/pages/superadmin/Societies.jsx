import React, { useEffect, useState } from "react";
import Modal from "../../components/superadmin/Modal";
import "../../styles/superadmin.css";
import { superAdminApi } from "../../services/authApi";
import { API_BASE_URL } from "../../config/api";

function normalizeSocietyCode(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export default function Societies() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignSociety, setAssignSociety] = useState(null);
  const [assignEmail, setAssignEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTimer, setSearchTimer] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [detailsSociety, setDetailsSociety] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editSociety, setEditSociety] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", code: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  async function load() {
    setLoading(true);
    try {
      const params = { page, pageSize, sortBy, sortOrder };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await superAdminApi.get("/super-admin/societies", { params });
      setRows(res.data?.data || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, sortOrder, search, statusFilter]);

  function exportCsv(rowsToExport) {
    const headers = ["code", "name", "city", "subscription_plan", "status"];
    const csv = [headers.join(",")].concat(
      rowsToExport.map((r) => headers.map((h) => JSON.stringify(r[h] || "")).join(","))
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "societies.csv"; a.click(); URL.revokeObjectURL(url);
  }

  function toggleSort(column) {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  }

  // Autocomplete: search users when assign modal is open and input changes
  useEffect(() => {
    if (!assignModalOpen) return;
    if (searchTimer) clearTimeout(searchTimer);
    if (!assignEmail || assignEmail.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await superAdminApi.get('/super-admin/users/search', { params: { query: assignEmail, limit: 8 } });
        setSearchResults(res.data?.data || []);
      } catch (err) {
        console.error('search users failed', err);
        setSearchResults([]);
      }
    }, 300);
    setSearchTimer(t);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignEmail, assignModalOpen]);

  function sortIndicator(column) {
    if (sortBy !== column) return "";
    return sortOrder === "asc" ? "▲" : "▼";
  }

  function openDetails(society) {
    setDetailsSociety(society);
    setDetailsOpen(true);
  }

  function openEdit(society) {
    setEditSociety(society);
    setEditForm({
      name: society?.society_name || society?.name || "",
      code: society?.code || "",
    });
    setEditOpen(true);
  }

  async function saveEdit(event) {
    event.preventDefault();
    const nextCode = normalizeSocietyCode(editForm.code);
    if (!nextCode || nextCode.length < 2 || nextCode.length > 30 || !/^[A-Z0-9-]+$/.test(nextCode)) {
      alert("Society code must be 2 to 30 characters and use only uppercase letters, numbers, and hyphens.");
      return;
    }

    setEditSaving(true);
    try {
      await superAdminApi.put(`/super-admin/societies/${editSociety.id}`, {
        name: editForm.name.trim(),
        societyName: editForm.name.trim(),
        code: nextCode,
      });
      setNotice({ type: "success", message: "Society updated successfully." });
      setEditOpen(false);
      setEditSociety(null);
      load();
    } catch (err) {
      setNotice({ type: "error", message: err?.response?.data?.message || "Failed to update society" });
    } finally {
      setEditSaving(false);
    }
  }

  async function bulkAction(action) {
    if (!confirm(`Perform ${action} on ${selected.size} societies?`)) return;
    const ids = Array.from(selected);
    try {
      const res = await superAdminApi.post("/super-admin/societies/bulk", { action, ids });
      setNotice({ type: "success", message: res.data?.message || "Bulk action completed" });
      setSelected(new Set());
      load();
    } catch (err) { alert(err?.response?.data?.message || "Failed"); }
  }

  async function serverExport() {
    const params = { search, status: statusFilter, sortBy, sortOrder };
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/super-admin/societies/export?${query}`;
    try {
      const token = localStorage.getItem("superAdminToken") || localStorage.getItem("accessToken") || localStorage.getItem("token");
      const res = await fetch(url, { headers: { Accept: "text/csv", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "societies-server.csv";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) { console.error(err); alert("Export failed"); }
  }

  return (
    <div>
      <section className="sa-page-head">
        <div>
          <h1>Society Management</h1>
          <p>Create, edit, view, export, and assign Chairmen to societies.</p>
        </div>
      </section>
      {notice.message ? <div role="status" className={`sa-feedback ${notice.type}`} style={{ marginBottom: 12 }}>{notice.message}</div> : null}
      <div className="sa-page-toolbar">
        <button onClick={() => window.location.hash = "create"} className="sa-btn">Create Society</button>
        <button onClick={load} className="sa-btn sa-btn-ghost">Refresh</button>
        <div className="sa-toolbar-spacer" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input placeholder="Search societies" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending_chairman_registration">Pending Chairman</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="rejected">Rejected</option>
          </select>
          <button onClick={() => { setPage(1); load(); }} className="sa-btn">Filter</button>
          <button onClick={() => exportCsv(rows)} className="sa-btn sa-btn-ghost">Export CSV</button>
        </div>
      </div>
      {loading ? (
        <div className="sa-loading">Loading societies...</div>
      ) : (
        <div className="sa-table-wrap">
        <table className="sa-table">
          <thead>
            <tr>
              <th><input type="checkbox" onChange={(e) => { if (e.target.checked) { setSelected(new Set(rows.map(r => r.id))); } else { setSelected(new Set()); } }} /></th>
              <th onClick={() => toggleSort('code')}>Code {sortIndicator('code')}</th>
              <th onClick={() => toggleSort('name')}>Name {sortIndicator('name')}</th>
              <th onClick={() => toggleSort('city')}>City {sortIndicator('city')}</th>
              <th onClick={() => toggleSort('subscription_plan')}>Plan {sortIndicator('subscription_plan')}</th>
              <th onClick={() => toggleSort('status')}>Status {sortIndicator('status')}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><input type="checkbox" checked={selected.has(r.id)} onChange={(e) => { const next = new Set(selected); if (e.target.checked) next.add(r.id); else next.delete(r.id); setSelected(next); }} /></td>
                <td>{r.code}</td>
                <td>{r.society_name || r.name}</td>
                <td>{r.city}</td>
                <td>{r.subscription_plan}</td>
                <td><span className={`sa-badge status-${r.status}`}>{String(r.status || "-").replace(/_/g, " ")}</span></td>
                <td>
                  <div className="sa-row-actions">
                  <button onClick={() => openDetails(r)} className="sa-btn">View</button>
                  <button onClick={() => openEdit(r)} className="sa-btn sa-btn-ghost">Edit</button>
                  <button onClick={async () => { if (!confirm('Suspend society?')) return; await superAdminApi.patch(`/super-admin/societies/${r.id}`, { status: 'suspended' }); setNotice({ type: 'success', message: 'Society suspended.' }); load(); }} className="sa-btn sa-btn-ghost">Suspend</button>
                  <button onClick={async () => { if (!confirm('Delete society? The record will be marked deleted, not physically removed.')) return; await superAdminApi.delete(`/super-admin/societies/${r.id}`); setNotice({ type: 'success', message: 'Society deleted.' }); load(); }} className="sa-btn sa-btn-danger">Delete</button>
                  <button onClick={() => { setAssignSociety(r); setAssignModalOpen(true); setAssignEmail(''); }} className="sa-btn">Assign Chairman</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => bulkAction('suspend')} className="sa-btn" disabled={selected.size === 0}>Bulk Suspend</button>
          <button onClick={() => bulkAction('activate')} className="sa-btn" disabled={selected.size === 0}>Bulk Activate</button>
          <button onClick={() => bulkAction('delete')} className="sa-btn" disabled={selected.size === 0}>Bulk Delete</button>
          <button onClick={() => serverExport()} className="sa-btn sa-btn-ghost">Export CSV (server)</button>
          <button onClick={() => { if (page > 1) { setPage(page - 1); } load(); }} className="sa-btn">Prev</button>
          <button onClick={() => { if (page * pageSize < total) { setPage(page + 1); } load(); }} className="sa-btn">Next</button>
        </div>
      </div>

      <Modal title={detailsSociety ? `${detailsSociety.society_name || detailsSociety.name} details` : 'Society details'} visible={detailsOpen} onClose={() => { setDetailsOpen(false); setDetailsSociety(null); }}>
        {detailsSociety ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div><strong>Society Name</strong><div>{detailsSociety.society_name || detailsSociety.name}</div></div>
            <div><strong>Society Code</strong><div>{detailsSociety.code || '-'}</div></div>
            <div><strong>City</strong><div>{detailsSociety.city || '-'}</div></div>
            <div><strong>Status</strong><div>{detailsSociety.status || '-'}</div></div>
            <div><strong>Plan</strong><div>{detailsSociety.subscription_plan || '-'}</div></div>
          </div>
        ) : null}
      </Modal>

      <Modal title={editSociety ? `Edit ${editSociety.society_name || editSociety.name}` : 'Edit society'} visible={editOpen} onClose={() => { setEditOpen(false); setEditSociety(null); }}>
        {editSociety ? (
          <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label>Society Name<input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></label>
            <label>Society Code<input value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: normalizeSocietyCode(e.target.value) })} placeholder="Example: GRR-0001" /></label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="sa-btn" type="submit" disabled={editSaving}>{editSaving ? 'Saving...' : 'Save'}</button>
              <button className="sa-btn sa-btn-ghost" type="button" onClick={() => { setEditOpen(false); setEditSociety(null); }}>Cancel</button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal title={assignSociety ? `Assign Chairman - ${assignSociety.society_name || assignSociety.name}` : 'Assign Chairman'} visible={assignModalOpen} onClose={() => setAssignModalOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label>Search existing user by email or name</label>
          <div style={{ position: 'relative' }}>
            <input value={assignEmail} onChange={(e) => { setAssignEmail(e.target.value); setSelectedUser(null); }} placeholder="user@example.com or name" />
            {searchResults.length > 0 && assignEmail && !selectedUser && (
              <div style={{ position: 'absolute', top: 42, left: 0, right: 0, background: '#fff', boxShadow: '0 10px 30px rgba(2,6,23,0.08)', borderRadius: 8, zIndex: 2000 }}>
                {searchResults.map(u => (
                  <div key={u.id} style={{ padding: 10, cursor: 'pointer' }} onClick={() => { setSelectedUser(u); setAssignEmail(u.email); setSearchResults([]); }}>
                    <div style={{ fontWeight: 600 }}>{u.name} <small style={{ color: '#6b7280' }}>({u.email})</small></div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{u.role} {u.society_id ? `• society ${u.society_id}` : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="sa-btn" onClick={async () => {
              try {
                const payload = selectedUser ? { userId: selectedUser.id } : { userEmail: assignEmail };
                const res = await superAdminApi.post(`/super-admin/societies/${assignSociety.id}/assign-chairman`, payload);
                setNotice({ type: 'success', message: res.data?.message || 'Assigned' });
                setAssignModalOpen(false);
                setAssignEmail('');
                setSelectedUser(null);
                load();
              } catch (err) { alert(err?.response?.data?.message || 'Failed'); }
            }}>Assign</button>
            <button className="sa-btn sa-btn-ghost" onClick={() => setAssignModalOpen(false)}>Cancel</button>
          </div>
          <div style={{ marginTop: 8 }}><small>Note: the user must exist in the system. Use exact email.</small></div>
        </div>
      </Modal>
    </div>
  );
}
