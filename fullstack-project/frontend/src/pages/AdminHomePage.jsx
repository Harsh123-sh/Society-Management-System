import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import { api, getApiMessage } from "../services/authApi";
import { approveFlat } from "../services/flatApi";

const ROLE_SHORTCUTS = [
  { id: "owner", label: "Owners", tone: "violet" },
  { id: "tenant", label: "Tenants", tone: "sky" },
  { id: "staff", label: "Staff", tone: "emerald" },
  { id: "security", label: "Security", tone: "amber" },
  { id: "admin", label: "Admins", tone: "rose" },
  { id: "all", label: "All Users", tone: "slate" },
];

function AdminHomePage() {
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [users, setUsers] = useState([]);
  const [flats, setFlats] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [bills, setBills] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingFlats, setPendingFlats] = useState([]);
  const [updatingRequestId, setUpdatingRequestId] = useState(null);

  const stats = useMemo(
    () => ({
      totalUsers: users.filter((user) => user.status === "active").length,
      totalFlats: flats.length,
      pendingDocuments: documents.filter((doc) => doc.status === "pending").length,
      openComplaints: complaints.filter((item) => item.status === "pending").length,
      pendingUsers: pendingUsers.length,
      pendingFlats: pendingFlats.length,
    }),
    [users, flats, documents, complaints, pendingUsers, pendingFlats]
  );

  async function loadAdminData() {
    try {
      setLoading(true);
      const [usersRes, pendingUsersRes, flatsRes, pendingFlatsRes, docsRes, billsRes, complaintsRes] = await Promise.all([
        api.get("/users", { params: { status: "active" } }),
        api.get("/users", { params: { status: "pending" } }),
        api.get("/flats"),
        api.get("/flats", { params: { approvalStatus: "pending" } }),
        api.get("/documents"),
        api.get("/bills"),
        api.get("/complaints"),
      ]);

      const usersData = usersRes.data?.data || [];
      setUsers(usersData);
      setPendingUsers(pendingUsersRes.data?.data || []);
      setFlats(flatsRes.data?.data || []);
      setPendingFlats(pendingFlatsRes.data?.data || []);
      setDocuments(docsRes.data?.data || []);
      setBills(billsRes.data?.data || []);
      setComplaints(complaintsRes.data?.data || []);
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not load admin dashboard"),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function handleApprovePendingUser(userId) {
    try {
      setUpdatingRequestId(userId);
      await api.patch(`/users/${userId}/status`, { status: "active" });
      setAlert({ type: "success", message: "User approved successfully" });
      await loadAdminData();
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not approve user"),
      });
    } finally {
      setUpdatingRequestId(null);
    }
  }

  async function handleRejectPendingUser(userId) {
    try {
      setUpdatingRequestId(userId);
      await api.patch(`/api/users/${userId}/status`, { status: "rejected" });
      setAlert({ type: "success", message: "User rejected successfully" });
      await loadAdminData();
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not reject user"),
      });
    } finally {
      setUpdatingRequestId(null);
    }
  }

  async function handleApproveFlatRequest(flatId) {
    try {
      setUpdatingRequestId(flatId);
      await approveFlat(flatId);
      setAlert({ type: "success", message: "Flat approved successfully" });
      await loadAdminData();
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not approve flat request"),
      });
    } finally {
      setUpdatingRequestId(null);
    }
  }

  if (loading) return <div className="text-sm text-slate-600">Loading...</div>;

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-slate-900">Admin Panel</h2>
      <AlertMessage type={alert.type} message={alert.message} />

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Users</p>
          <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Flats</p>
          <p className="text-2xl font-bold text-slate-900">{stats.totalFlats}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Pending Documents</p>
          <p className="text-2xl font-bold text-slate-900">{stats.pendingDocuments}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Open Complaints</p>
          <p className="text-2xl font-bold text-slate-900">{stats.openComplaints}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm text-amber-700">Pending Users</p>
          <p className="text-2xl font-bold text-slate-900">{stats.pendingUsers}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm text-amber-700">Pending Flats</p>
          <p className="text-2xl font-bold text-slate-900">{stats.pendingFlats}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" to="/admin/users">
          Open Filtered Users
        </Link>
        <Link className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" to="/admin/users?role=all">
          All Users View
        </Link>
        <Link className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" to="/admin/documents">
          View Documents
        </Link>
        <Link className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" to="/admin/flats">
          View Flat Details
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900">User Views</h3>
          <Link className="text-sm font-semibold text-blue-700 hover:text-blue-900" to="/admin/users">
            Open full user panel
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_SHORTCUTS.map((role) => {
            const userCount = role.id === "all"
              ? users.length
              : users.filter((user) => user.role === (role.id === "owner" || role.id === "tenant" ? "resident" : role.id) && (role.id === "owner" || role.id === "tenant" ? user.resident_type === role.id : true)).length;

            const toneClass = {
              violet: "border-violet-200 bg-violet-50 text-violet-700",
              sky: "border-sky-200 bg-sky-50 text-sky-700",
              emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
              amber: "border-amber-200 bg-amber-50 text-amber-700",
              rose: "border-rose-200 bg-rose-50 text-rose-700",
              slate: "border-slate-200 bg-slate-50 text-slate-700",
            }[role.tone];

            return (
              <Link
                key={role.id}
                to={`/admin/users?role=${role.id}`}
                className={`rounded-xl border px-4 py-4 transition hover:shadow-sm ${toneClass}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{role.label}</p>
                    <p className="mt-1 text-xs opacity-80">Open filtered list</p>
                  </div>
                  <span className="rounded-full bg-white/70 px-3 py-1 text-sm font-bold">
                    {userCount}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Pending User Approvals</h3>
          {pendingUsers.length ? (
            <div className="space-y-3">
              {pendingUsers.slice(0, 10).map((user) => (
                <div key={user.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-600">{user.email}</p>
                  <p className="text-xs text-slate-500">
                    Role: {user.role} | Status: {user.status} | Flat: {user.flat_number || "-"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={updatingRequestId === user.id}
                      onClick={() => handleApprovePendingUser(user.id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-[var(--text-main)] disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={updatingRequestId === user.id}
                      onClick={() => handleRejectPendingUser(user.id)}
                      className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-[var(--text-main)] disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">No pending user approvals.</p>
          )}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Pending Flat Approvals</h3>
          {pendingFlats.length ? (
            <div className="space-y-3">
              {pendingFlats.slice(0, 10).map((flat) => (
                <div key={flat.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {flat.building_name} - Wing {flat.wing} - Flat {flat.flat_number}
                  </p>
                  <p className="text-xs text-slate-600">
                    Floor: {flat.floor || "-"} | Type: {flat.flat_type || "-"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={updatingRequestId === flat.id}
                      onClick={() => handleApproveFlatRequest(flat.id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-[var(--text-main)] disabled:opacity-60"
                    >
                      Approve Flat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">No pending flat approvals.</p>
          )}
        </article>
      </section>
    </div>
  );
}

export default AdminHomePage;
