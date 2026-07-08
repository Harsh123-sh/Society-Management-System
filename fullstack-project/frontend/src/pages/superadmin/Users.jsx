import React, { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Search, ShieldCheck, UserX } from "lucide-react";
import {
  deleteSuperAdminUser,
  fetchSuperAdminUsers,
  updateSuperAdminUserStatus,
} from "../../services/authApi";

const roles = ["super_admin", "chairman", "secretary", "owner", "tenant", "staff", "security"];
const roleLabels = {
  super_admin: "Super Admin",
  chairman: "Chairman",
  secretary: "Secretary",
  owner: "Owner",
  tenant: "Tenant",
  staff: "Staff",
  security: "Security",
};

function exportCsv(rows) {
  const headers = ["name", "email", "phone", "role", "status", "society_name", "society_code"];
  const csv = [headers.join(",")]
    .concat(rows.map((row) => headers.map((header) => JSON.stringify(row[header] || "")).join(",")))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "super-admin-users.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pageSize: 25 });
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: "", message: "" });

  async function load(next = {}) {
    const nextPage = next.page || pagination.page || 1;
    setLoading(true);
    setNotice({ type: "", message: "" });
    try {
      const response = await fetchSuperAdminUsers({
        page: nextPage,
        pageSize: pagination.pageSize,
        role: role || undefined,
        status: status || undefined,
        search: search || undefined,
      });
      setUsers(response?.data || []);
      setPagination(response?.pagination || { page: nextPage, total: 0, pageSize: pagination.pageSize });
    } catch (error) {
      setNotice({ type: "error", message: error?.response?.data?.message || "Failed to load users." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load({ page: 1 }); }, [role, status]);

  const counts = useMemo(() => roles.map((item) => ({
    role: item,
    count: users.filter((user) => user.role === item || (item === "chairman" && user.role === "admin")).length,
  })), [users]);

  async function setUserStatus(user, nextStatus) {
    try {
      await updateSuperAdminUserStatus(user.id, { status: nextStatus });
      setNotice({ type: "success", message: `${user.name || user.email} updated to ${nextStatus}.` });
      load();
    } catch (error) {
      setNotice({ type: "error", message: error?.response?.data?.message || "Failed to update user." });
    }
  }

  async function removeUser(user) {
    if (!confirm(`Delete ${user.name || user.email}? This is a soft delete.`)) return;
    try {
      await deleteSuperAdminUser(user.id);
      setNotice({ type: "success", message: "User deleted." });
      load();
    } catch (error) {
      setNotice({ type: "error", message: error?.response?.data?.message || "Failed to delete user." });
    }
  }

  return (
    <div>
      <section className="sa-page-head">
        <div>
          <span className="sa-eyebrow">Role Based Access</span>
          <h1>User Management</h1>
          <p>Search, filter, export, suspend, activate, and soft-delete Supabase users by role.</p>
        </div>
        <div className="sa-head-actions">
          <button className="sa-btn sa-btn-ghost" type="button" onClick={() => exportCsv(users)}><Download size={16} /> Export</button>
          <button className="sa-btn" type="button" onClick={() => load()}><RefreshCw size={16} /> Refresh</button>
        </div>
      </section>

      {notice.message ? <div role="status" className={`sa-feedback ${notice.type}`}>{notice.message}</div> : null}

      <section className="sa-role-tabs">
        <button className={!role ? "active" : ""} type="button" onClick={() => setRole("")}>All</button>
        {roles.map((item) => (
          <button key={item} className={role === item ? "active" : ""} type="button" onClick={() => setRole(item)}>
            {roleLabels[item]} <span>{counts.find((count) => count.role === item)?.count || 0}</span>
          </button>
        ))}
      </section>

      <section className="sa-page-toolbar">
        <label className="sa-toolbar-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, society" /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="pending_approval">Pending approval</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
          <option value="inactive">Inactive</option>
        </select>
        <button className="sa-btn" type="button" onClick={() => load({ page: 1 })}>Apply filters</button>
      </section>

      {loading ? <div className="sa-loading">Loading users...</div> : (
        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Society</th><th>Verified</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name || "-"}</td>
                  <td>{user.email}</td>
                  <td>{roleLabels[user.role] || user.role}</td>
                  <td>{user.society_name ? `${user.society_name} (${user.society_code || "-"})` : "Platform"}</td>
                  <td>{user.is_verified ? "Yes" : "No"}</td>
                  <td><span className={`sa-badge status-${user.status}`}>{String(user.status || "-").replace(/_/g, " ")}</span></td>
                  <td>
                    <div className="sa-row-actions">
                      <button className="sa-btn sa-btn-ghost" type="button" onClick={() => setUserStatus(user, "active")}><ShieldCheck size={15} /> Activate</button>
                      <button className="sa-btn sa-btn-ghost" type="button" onClick={() => setUserStatus(user, "suspended")}><UserX size={15} /> Suspend</button>
                      <button className="sa-btn sa-btn-danger" type="button" onClick={() => removeUser(user)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length ? <tr><td colSpan="7"><div className="sa-empty-inline">No users match this filter.</div></td></tr> : null}
            </tbody>
          </table>
        </div>
      )}

      <div className="sa-pagination">
        <span>Showing {users.length} of {pagination.total || users.length}</span>
        <div>
          <button className="sa-btn sa-btn-ghost" disabled={!pagination.hasPrevious} onClick={() => load({ page: pagination.page - 1 })}>Previous</button>
          <button className="sa-btn sa-btn-ghost" disabled={!pagination.hasNext} onClick={() => load({ page: pagination.page + 1 })}>Next</button>
        </div>
      </div>
    </div>
  );
}
