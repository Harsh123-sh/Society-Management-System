import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage } from "../services/authApi";
import {
  deleteUser,
  fetchTrashUsers,
  fetchUsers,
  permanentlyDeleteUser,
  restoreUser,
  updateUserRole,
  updateUserStatus,
} from "../services/userApi";

const ROLE_TABS = [
  { id: "owner", label: "Owners", shortLabel: "Owner" },
  { id: "tenant", label: "Tenants", shortLabel: "Tenant" },
  { id: "staff", label: "Staff", shortLabel: "Staff" },
  { id: "security", label: "Security", shortLabel: "Security" },
  { id: "admin", label: "Admins", shortLabel: "Admin" },
  { id: "all", label: "All Users", shortLabel: "All Users" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "inactive", label: "Inactive" },
];

const ACCOUNT_STATUS_OPTIONS = ["pending", "active", "rejected", "inactive"];
const ACCOUNT_ROLE_OPTIONS = ["admin", "secretary", "resident", "staff", "security"];
const DEFAULT_ROLE = "owner";
const DEFAULT_STATUS = "all";

const ROLE_STYLES = {
  owner: "bg-violet-100 text-violet-700 ring-violet-200",
  tenant: "bg-sky-100 text-sky-700 ring-sky-200",
  staff: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  security: "bg-amber-100 text-amber-700 ring-amber-200",
  admin: "bg-rose-100 text-rose-700 ring-rose-200",
  resident: "bg-slate-100 text-slate-700 ring-slate-200",
};

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  inactive: "bg-slate-100 text-slate-700",
};

function getRoleLabel(role, residentType) {
  if (role === "resident") {
    return residentType ? residentType : "resident";
  }
  return role || "user";
}

function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeRole, setActiveRole] = useState(searchParams.get("role") || DEFAULT_ROLE);
  const [users, setUsers] = useState([]);
  const [trashUsers, setTrashUsers] = useState([]);
  const [showTrash, setShowTrash] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS);
  const [pendingStatusByUser, setPendingStatusByUser] = useState({});
  const [pendingRoleByUser, setPendingRoleByUser] = useState({});
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const selectedRoleLabel = useMemo(() => {
    return ROLE_TABS.find((tab) => tab.id === activeRole)?.label || "Owners";
  }, [activeRole]);

  const userStats = useMemo(() => {
    const activeCount = users.filter((user) => user.status === "active").length;
    const pendingCount = users.filter((user) => user.status === "pending").length;
    const inactiveCount = users.filter((user) => user.status === "inactive").length;

    return [
      { label: "Visible", value: users.length },
      { label: "Active", value: activeCount },
      { label: "Pending", value: pendingCount },
      { label: "Inactive", value: inactiveCount },
    ];
  }, [users]);

  useEffect(() => {
    const roleFromUrl = searchParams.get("role") || DEFAULT_ROLE;
    setActiveRole(roleFromUrl);
  }, [searchParams]);

  useEffect(() => {
    if (!searchParams.get("role")) {
      setSearchParams({ role: DEFAULT_ROLE }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  async function loadUsers(role = activeRole) {
    try {
      setLoading(true);
      const params = {
        search: searchTerm || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      };

      if (role !== "all") {
        params.role = role;
      }

      const [usersData, trashData] = await Promise.all([
        fetchUsers(params),
        fetchTrashUsers({ search: searchTerm || undefined }),
      ]);

      setUsers(usersData.data || []);
      setTrashUsers(trashData.data || []);
      setPendingStatusByUser((prev) => {
        const next = {};
        for (const user of usersData.data || []) {
          next[user.id] = prev[user.id] || user.status || "pending";
        }
        return next;
      });
      setPendingRoleByUser((prev) => {
        const next = {};
        for (const user of usersData.data || []) {
          next[user.id] = prev[user.id] || user.role || "resident";
        }
        return next;
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not load users"),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers(activeRole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole, statusFilter]);

  function handleRoleChange(role) {
    setActiveRole(role);
    setSearchParams({ role }, { replace: true });
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    loadUsers(activeRole);
  }

  function handleResetFilters() {
    setSearchTerm("");
    setStatusFilter(DEFAULT_STATUS);
    setActiveRole(DEFAULT_ROLE);
    setSearchParams({ role: DEFAULT_ROLE }, { replace: true });
    loadUsers(DEFAULT_ROLE);
  }

  async function handleStatusUpdate(userId) {
    const selectedStatus = pendingStatusByUser[userId];
    if (!selectedStatus) return;

    try {
      setUpdatingUserId(userId);
      const response = await updateUserStatus(userId, selectedStatus);

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, status: response.data?.status || selectedStatus } : user
        )
      );

      setAlert({
        type: "success",
        message: response.message || "User status updated",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not update user status"),
      });
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleRoleUpdate(userId) {
    const selectedRole = pendingRoleByUser[userId];
    if (!selectedRole) return;

    try {
      setUpdatingUserId(userId);
      const response = await updateUserRole(userId, selectedRole);

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                role: response.data?.role || selectedRole,
                resident_type:
                  response.data?.role === "resident"
                    ? user.resident_type || "owner"
                    : response.data?.resident_type || null,
              }
            : user
        )
      );

      setAlert({
        type: "success",
        message: response.message || "User role updated",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not update user role"),
      });
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleDeleteUser(userId, userEmail) {
    const shouldDelete = window.confirm(
      `Delete user ${userEmail}? This will archive the account and free the email for reuse.`
    );
    if (!shouldDelete) return;

    const reason = window.prompt("Enter delete reason (required for audit log):");
    if (!reason || !reason.trim()) {
      setAlert({ type: "error", message: "Delete reason is required" });
      return;
    }

    try {
      setUpdatingUserId(userId);
      const response = await deleteUser(userId, reason.trim());

      setUsers((prev) => prev.filter((user) => user.id !== userId));
      await loadUsers(activeRole);
      setAlert({
        type: "success",
        message: response.message || "User deleted successfully",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not delete user"),
      });
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleRestoreUser(userId) {
    try {
      setUpdatingUserId(userId);
      const response = await restoreUser(userId);
      setAlert({
        type: "success",
        message: response.message || "User restored successfully",
      });
      await loadUsers(activeRole);
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not restore user"),
      });
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handlePermanentlyDeleteUser(userId, userEmail) {
    const shouldDelete = window.confirm(
      `Permanently delete user ${userEmail} from trash? Historical records will be preserved.`
    );
    if (!shouldDelete) return;

    try {
      setUpdatingUserId(userId);
      const response = await permanentlyDeleteUser(userId);
      setAlert({
        type: "success",
        message: response.message || "User permanently deleted from trash",
      });
      await loadUsers(activeRole);
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not permanently delete user"),
      });
    } finally {
      setUpdatingUserId(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[var(--page-bg)] via-[var(--surface-soft)] to-teal-800 p-6 text-[var(--text-main)] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)] sm:p-8">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
          <span>Resident Directory</span>
          <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] tracking-[0.18em]">Role-based control</span>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              User Management
            </p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Role-based users panel</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
              Focus on one role at a time. Use the All Users view only when you need the full list.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 lg:grid-cols-2">
            {userStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-main)]">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AlertMessage type={alert.type} message={alert.message} />

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {ROLE_TABS.map((tab) => {
            const isActive = activeRole === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleRoleChange(tab.id)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-slate-900 theme-surface text-[var(--text-main)]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <form className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" onSubmit={handleSearchSubmit}>
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto_auto]">
          <input
            type="text"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            placeholder={`Search ${selectedRoleLabel.toLowerCase()} by name, email, society, or flat number`}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--text-main)] transition hover:opacity-95"
            style={{ backgroundColor: "rgb(var(--app-accent-rgb))" }}
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Society</th>
                <th className="px-4 py-3 font-semibold">Flat</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-slate-600" colSpan={7}>
                    Loading users...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-4 align-top">
                      <div className="font-semibold text-slate-900">{user.name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Created {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            ROLE_STYLES[user.role] || ROLE_STYLES.resident
                          }`}
                        >
                          {getRoleLabel(user.role, user.resident_type)}
                        </span>
                        {user.resident_type && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {user.resident_type}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-slate-600">{user.email}</td>
                    <td className="px-4 py-4 align-top text-slate-600">{user.society_code || "-"}</td>
                    <td className="px-4 py-4 align-top text-slate-600">
                      {user.wing && user.flat_number ? `${user.wing}-${user.flat_number}` : user.flat_number || "-"}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLES[user.status] || STATUS_STYLES.pending
                        }`}
                      >
                        {user.status || "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex min-w-0 flex-col gap-2">
                        <select
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 outline-none"
                          value={pendingRoleByUser[user.id] || user.role || "resident"}
                          onChange={(event) =>
                            setPendingRoleByUser((prev) => ({
                              ...prev,
                              [user.id]: event.target.value,
                            }))
                          }
                        >
                          {ACCOUNT_ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={updatingUserId === user.id}
                          onClick={() => handleRoleUpdate(user.id)}
                          className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updatingUserId === user.id ? "Saving..." : "Update Role"}
                        </button>
                        <select
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 outline-none"
                          value={pendingStatusByUser[user.id] || user.status || "pending"}
                          onChange={(event) =>
                            setPendingStatusByUser((prev) => ({
                              ...prev,
                              [user.id]: event.target.value,
                            }))
                          }
                        >
                          {ACCOUNT_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={updatingUserId === user.id}
                          onClick={() => handleStatusUpdate(user.id)}
                          className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updatingUserId === user.id ? "Saving..." : "Update Status"}
                        </button>
                        <button
                          type="button"
                          disabled={updatingUserId === user.id || user.status === "inactive"}
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {updatingUserId === user.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-4 text-slate-600" colSpan={7}>
                    No {selectedRoleLabel.toLowerCase()} users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showTrash && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h3 className="text-base font-semibold text-slate-950">Trash</h3>
              <p className="text-xs text-slate-500">
                {trashUsers.length} deleted user{trashUsers.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Archived Email</th>
                  <th className="px-4 py-3 font-semibold">Original Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold">Deleted At</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trashUsers.length > 0 ? (
                  trashUsers.map((user) => (
                    <tr key={`trash-${user.id}`} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{user.email}</td>
                      <td className="px-4 py-3 text-slate-600">{user.original_email || "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            ROLE_STYLES[user.role] || ROLE_STYLES.resident
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{user.delete_reason || "-"}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {user.deleted_at ? new Date(user.deleted_at).toLocaleString() : "-"}
                      </td>
                      <td className="px-4 py-3">
                      <div className="flex min-w-0 flex-col gap-2">
                          <button
                            type="button"
                            disabled={updatingUserId === user.id}
                            onClick={() => handleRestoreUser(user.id)}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingUserId === user.id ? "Restoring..." : "Restore"}
                          </button>
                          <button
                            type="button"
                            disabled={updatingUserId === user.id}
                            onClick={() => handlePermanentlyDeleteUser(user.id, user.original_email || user.email)}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {updatingUserId === user.id ? "Deleting..." : "Permanent Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-3 text-slate-600" colSpan={7}>
                      Trash is empty.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowTrash((prev) => !prev)}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {showTrash ? "Hide Trash" : `Show Trash (${trashUsers.length})`}
        </button>
      </div>
    </div>
  );
}

export default UsersPage;
