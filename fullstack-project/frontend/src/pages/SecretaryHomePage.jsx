import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import { api, getApiMessage } from "../services/authApi";
import { getStoredUser } from "../utils/session";

function SecretaryHomePage() {
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [societyContext, setSocietyContext] = useState(null);
  const [users, setUsers] = useState([]);
  const [bills, setBills] = useState([]);
  const [complaints, setComplaints] = useState([]);

  const stats = useMemo(
    () => ({
      users: users.length,
      unpaidBills: bills.filter((bill) => bill.status === "unpaid").length,
      pendingComplaints: complaints.filter((item) => item.status === "pending").length,
    }),
    [users, bills, complaints]
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [societyRes, usersRes, billsRes, complaintsRes] = await Promise.all([
          api.get("dashboards/society"),
          api.get("/users"),
          api.get("/bills"),
          api.get("/complaints"),
        ]);
        setSocietyContext(societyRes.data?.data || null);
        setUsers(usersRes.data?.data || []);
        setBills(billsRes.data?.data || []);
        setComplaints(complaintsRes.data?.data || []);
      } catch (error) {
        setAlert({
          type: "error",
          message: getApiMessage(error, "Could not load secretary dashboard"),
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const currentUser = getStoredUser();
  const roleLabel = currentUser?.role === "admin" ? "Chairman" : currentUser?.role === "secretary" ? "Secretary" : currentUser?.role || "User";
  const society = societyContext?.society || null;
  const societyName = society?.name || currentUser?.society_name || localStorage.getItem("societyName") || "Linked society";
  const societyCode = society?.code || currentUser?.society_code || localStorage.getItem("societyId") || "";

  if (loading) return <div className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Loading...</div>;

  return (
    <div className="space-y-6">
      <section className="surface-card app-surface rounded-[28px] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--app-text-muted-rgb))]">Society operations console</p>
        <h2 className="mt-2 text-3xl font-bold text-[rgb(var(--app-text-rgb))]">{currentUser?.name || `${roleLabel} profile`}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[rgb(var(--app-text-muted-rgb))]">
          {roleLabel} access for {societyName}. All visible data is linked to the assigned society only.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-[rgb(var(--app-text-rgb))]">
          <span className="rounded-full border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-2 font-semibold">{roleLabel}</span>
          <span className="rounded-full border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-2 font-semibold">{societyCode ? `Society code: ${societyCode}` : "Society linked"}</span>
        </div>
      </section>
      <AlertMessage type={alert.type} message={alert.message} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="surface-card app-surface p-4">
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Chairman / Secretary</p>
          <p className="text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{currentUser?.name || "Profile not loaded"}</p>
        </div>
        <div className="surface-card app-surface p-4">
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Society Name</p>
          <p className="text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{societyName}</p>
        </div>
        <div className="surface-card app-surface p-4">
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Society Details</p>
          <p className="text-sm font-semibold text-[rgb(var(--app-text-rgb))]">
            {society?.address || [society?.city, society?.state].filter(Boolean).join(", ") || "Linked society details"}
          </p>
        </div>
        <div className="surface-card app-surface p-4">
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Linked Scope</p>
          <p className="text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{society?.status || "active"}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="surface-card app-surface p-4">
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Users Managed</p>
          <p className="text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{stats.users}</p>
        </div>
        <div className="surface-card app-surface p-4">
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Unpaid Bills</p>
          <p className="text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{stats.unpaidBills}</p>
        </div>
        <div className="surface-card app-surface p-4">
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Pending Complaints</p>
          <p className="text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{stats.pendingComplaints}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link className="rounded-xl bg-[rgb(var(--app-primary-rgb))] px-3 py-2 text-sm font-semibold text-white transition-all hover:opacity-90" to="/secretary/users">
          Manage Users
        </Link>
        <Link className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition-all hover:opacity-90" to="/secretary/billing">
          Create Bills
        </Link>
        <Link className="rounded-xl border border-[rgb(var(--app-border-rgb))] px-3 py-2 text-sm font-semibold text-[rgb(var(--app-text-rgb))] transition-colors hover:border-[rgb(var(--app-primary-rgb))]" to="/secretary/complaints">
          Manage Complaints
        </Link>
      </div>
    </div>
  );
}

export { default } from "./ChairmanSecretaryDashboardPage";
