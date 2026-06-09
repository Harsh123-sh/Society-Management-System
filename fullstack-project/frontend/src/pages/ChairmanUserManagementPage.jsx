import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage } from "../services/authApi";
import { deleteUser, fetchUsers, permanentlyDeleteUser, restoreUser, updateUser, updateUserStatus } from "../services/userApi";
import { getStoredRole, getStoredUser } from "../utils/session";

const PAGE_SIZE = 12;

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "chairman", label: "Chairman" },
  { value: "secretary", label: "Secretary" },
  { value: "owner", label: "Owner" },
  { value: "tenant", label: "Tenant" },
  { value: "security", label: "Security Guard" },
  { value: "staff", label: "Staff" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending Approval" },
  { value: "rejected", label: "Rejected" },
  { value: "inactive", label: "Suspended" },
];

const KYC_OPTIONS = [
  { value: "all", label: "All KYC" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

const INITIAL_FILTERS = {
  role: "all",
  wing: "",
  floor: "",
  flatNumber: "",
  status: "all",
  kyc: "all",
  registrationFrom: "",
  registrationTo: "",
};

const SUMMARY_TONES = [
  { key: "totalResidents", label: "Total Residents", tone: "from-cyan-500 to-teal-500" },
  { key: "totalOwners", label: "Total Owners", tone: "from-violet-500 to-fuchsia-500" },
  { key: "totalTenants", label: "Total Tenants", tone: "from-sky-500 to-cyan-500" },
  { key: "totalStaff", label: "Total Staff", tone: "from-emerald-500 to-lime-500" },
  { key: "totalSecurity", label: "Total Security", tone: "from-amber-500 to-orange-500" },
  { key: "pendingApprovals", label: "Pending Approvals", tone: "from-amber-500 to-rose-500" },
  { key: "activeMembers", label: "Active Members", tone: "from-green-500 to-emerald-500" },
  { key: "vacantFlats", label: "Vacant Flats", tone: "from-slate-500 to-slate-700" },
];

function getRoleLabel(role, residentType) {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "admin") return "Chairman";
  if (normalized === "secretary") return "Secretary";
  if (normalized === "resident") return residentType === "tenant" ? "Tenant" : "Owner";
  if (normalized === "security") return "Security Guard";
  if (normalized === "staff") return "Staff";
  return role ? role[0].toUpperCase() + role.slice(1) : "-";
}

function getStatusLabel(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "pending") return "Pending Approval";
  if (normalized === "inactive") return "Suspended";
  if (normalized === "rejected") return "Rejected";
  if (normalized === "active") return "Active";
  return normalized || "-";
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function safeParseList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed].filter(Boolean);
  } catch {
    return value
      .split(/\n|,|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function initialFormFromUser(user) {
  return {
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    profile_photo_url: user?.profile_photo_url || "",
    family_members: Array.isArray(user?.family_members)
      ? JSON.stringify(user.family_members, null, 2)
      : typeof user?.family_members === "string"
        ? user.family_members
        : "",
  };
}

function IconButton({ title, onClick, children, tone = "neutral", disabled = false }) {
  const toneStyles = {
    neutral: "border-[rgb(var(--app-border-rgb))] text-[rgb(var(--app-text-rgb))] hover:bg-[rgb(var(--app-surface-muted-rgb))]",
    primary: "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 hover:bg-cyan-500/15 dark:text-cyan-200",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-200",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15 dark:text-amber-200",
    danger: "border-rose-500/20 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-200",
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${toneStyles[tone]}`}
      style={{ backgroundColor: "var(--surface)" }}
    >
      {children}
      <span className="hidden xl:inline">{title}</span>
    </button>
  );
}

function StatusPill({ status }) {
  const normalized = String(status || "").toLowerCase();
  const styles = {
    active: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-200",
    pending: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-200",
    rejected: "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-200",
    inactive: "bg-slate-500/10 text-slate-700 border-slate-500/20 dark:text-slate-200",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles[normalized] || styles.inactive}`}>
      {getStatusLabel(normalized)}
    </span>
  );
}

function RolePill({ role, residentType }) {
  const label = getRoleLabel(role, residentType);
  const normalized = String(role || "").toLowerCase();
  const styles = {
    admin: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20 dark:text-cyan-200",
    secretary: "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-200",
    resident: "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-200",
    staff: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-200",
    security: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-200",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles[normalized] || styles.resident}`}>
      {label}
    </span>
  );
}

function Avatar({ user }) {
  const initials = String(user?.name || "U")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

  if (user?.profile_photo_url) {
    return <img src={user.profile_photo_url} alt={user?.name || "Profile"} className="h-11 w-11 rounded-2xl object-cover ring-1 ring-[rgb(var(--app-border-rgb))]" />;
  }

  return (
    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,rgba(var(--app-primary-rgb),0.95),rgba(var(--app-accent-rgb),0.8))] text-sm font-bold text-[var(--text-main)] shadow-lg">
      {initials}
    </div>
  );
}

function ActionIcon({ type }) {
  const paths = {
    view: <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Zm10 3.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7Z" />, 
    edit: <path d="M4 16.5V20h3.5l10-10-3.5-3.5-10 10Zm13.7-8.7a1 1 0 0 0 0-1.4l-2.1-2.1a1 1 0 0 0-1.4 0l-1.5 1.5 3.5 3.5 1.5-1.5Z" />, 
    approve: <path d="M9.2 16.2 4.8 11.8l1.4-1.4 3 3 8.6-8.6 1.4 1.4-10 10Z" />, 
    reject: <path d="m6.3 5.9 5.7 5.7 5.7-5.7 1.4 1.4-5.7 5.7 5.7 5.7-1.4 1.4-5.7-5.7-5.7 5.7-1.4-1.4 5.7-5.7-5.7-5.7 1.4-1.4Z" />, 
    suspend: <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm4 11H8v-2h8Z" />, 
    activate: <path d="M11 17h2v-5h5v-2h-5V5h-2v5H6v2h5Z" />, 
    delete: <path d="M7 7h10l-1 11H8L7 7Zm2-3h6l1 2H8l1-2Zm1 4h1v7h-1V8Zm3 0h1v7h-1V8Z" />, 
  };

  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

function DrawerField({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--app-text-muted-rgb))]">{label}</p>
      <div className="mt-1 text-sm text-[rgb(var(--app-text-rgb))]">{children}</div>
    </div>
  );
}

function ChairmanUserManagementPage() {
  const role = getStoredRole();
  const currentUser = getStoredUser();
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({});
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerMode, setDrawerMode] = useState("view");
  const [editForm, setEditForm] = useState(initialFormFromUser(null));
  const [profileSavingId, setProfileSavingId] = useState(null);

  const society = useMemo(() => {
    const first = users[0];
    return {
      name: first?.society_name || currentUser?.societyName || first?.societyName || "-",
      code: first?.society_code || currentUser?.societyCode || first?.societyCode || "-",
      address:
        [first?.society_address, first?.society_city, first?.society_state].filter(Boolean).join(", ") ||
        currentUser?.societyAddress ||
        "-",
    };
  }, [currentUser?.societyAddress, currentUser?.societyCode, currentUser?.societyName, users]);

  const visibleUsers = useMemo(() => {
    const seen = new Set();
    return users.filter((user) => {
      const email = String(user?.email || "").trim().toLowerCase();
      if (!email || !email.includes("@") || email.includes(" ")) return false;
      const key = `${user.id}-${email}-${String(user?.flat_number || "").trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [users]);

  const summaryCards = useMemo(
    () => SUMMARY_TONES.map((item) => ({ ...item, value: Number(summary?.[item.key] ?? 0) })),
    [summary]
  );

  async function loadUsers(nextPage = page, nextFilters = filters, nextSearch = searchTerm) {
    try {
      setLoading(true);
      const response = await fetchUsers({
        search: nextSearch || undefined,
        role: nextFilters.role === "all" ? undefined : nextFilters.role,
        wing: nextFilters.wing || undefined,
        floor: nextFilters.floor || undefined,
        flatNumber: nextFilters.flatNumber || undefined,
        status: nextFilters.status === "all" ? undefined : nextFilters.status,
        registrationFrom: nextFilters.registrationFrom || undefined,
        registrationTo: nextFilters.registrationTo || undefined,
        page: nextPage,
        limit: PAGE_SIZE,
      });

      const payload = response?.data || [];
      setUsers(Array.isArray(payload) ? payload : []);
      setSummary(response?.summary || {});
      setMeta(response?.meta || { total: payload.length, page: nextPage, limit: PAGE_SIZE, totalPages: 1 });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not load users") });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(page, filters, searchTerm);
    }, 240);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters, searchTerm]);

  useEffect(() => {
    if (role && role !== "admin" && role !== "secretary") {
      setAlert({ type: "warning", message: "This user directory is available to chairman and secretary roles only." });
    }
  }, [role]);

  function updateFilter(name, value) {
    setPage(1);
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function resetFilters() {
    setSearchTerm("");
    setFilters(INITIAL_FILTERS);
    setPage(1);
  }

  function openProfile(user, mode = "view") {
    setSelectedUser(user);
    setDrawerMode(mode);
    setEditForm(initialFormFromUser(user));
  }

  function closeDrawer() {
    setSelectedUser(null);
    setDrawerMode("view");
    setEditForm(initialFormFromUser(null));
  }

  async function changeUserStatus(userId, status) {
    try {
      setProfileSavingId(userId);
      const response = await updateUserStatus(userId, status);
      setUsers((current) => current.map((user) => (user.id === userId ? { ...user, status: response?.data?.status || status } : user)));
      setAlert({ type: "success", message: response?.message || "User status updated" });
      if (selectedUser?.id === userId) {
        setSelectedUser((current) => (current ? { ...current, status } : current));
      }
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not update status") });
    } finally {
      setProfileSavingId(null);
    }
  }

  async function handleDelete(user) {
    const shouldDelete = window.confirm(`Delete ${user.name}? This will archive the account.`);
    if (!shouldDelete) return;

    const reason = window.prompt("Enter delete reason for the audit log:");
    if (!reason || !reason.trim()) {
      setAlert({ type: "error", message: "Delete reason is required" });
      return;
    }

    try {
      setProfileSavingId(user.id);
      const response = await deleteUser(user.id, reason.trim());
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setAlert({ type: "success", message: response?.message || "User deleted" });
      if (selectedUser?.id === user.id) {
        closeDrawer();
      }
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not delete user") });
    } finally {
      setProfileSavingId(null);
    }
  }

  async function handleEditSave(event) {
    event.preventDefault();
    if (!selectedUser) return;

    try {
      setSaving(true);
      const response = await updateUser(selectedUser.id, editForm);
      const updatedUser = response?.data || {
        ...selectedUser,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        profile_photo_url: editForm.profile_photo_url,
        family_members: editForm.family_members,
      };

      setUsers((current) => current.map((item) => (item.id === selectedUser.id ? { ...item, ...updatedUser } : item)));
      setSelectedUser((current) => (current ? { ...current, ...updatedUser } : current));
      setAlert({ type: "success", message: response?.message || "User updated successfully" });
      setDrawerMode("view");
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not update user") });
    } finally {
      setSaving(false);
    }
  }

  const totalPages = meta.totalPages || Math.max(Math.ceil((meta.total || 0) / PAGE_SIZE), 1);

  return (
    <div className="space-y-6 text-[rgb(var(--app-text-rgb))]">
      <section className="overflow-hidden rounded-[28px] border border-[rgb(var(--app-border-rgb))] bg-[linear-gradient(135deg,rgba(var(--app-surface-rgb),0.98),rgba(var(--app-surface-muted-rgb),0.94))] p-6 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[rgb(var(--app-text-muted-rgb))]">Society user management</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {role === "secretary" ? "Secretary" : "Chairman"} User Directory
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--app-text-muted-rgb))] sm:text-base">
              Manage residents, owners, tenants, staff, and security from your own society only. Pending approvals can be approved or rejected from the same view.
            </p>
          </div>
          <div className="grid min-w-[280px] gap-3 rounded-3xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4 shadow-lg sm:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[rgb(var(--app-text-muted-rgb))]">Society</p>
              <p className="mt-1 text-sm font-semibold">{society.name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[rgb(var(--app-text-muted-rgb))]">Code</p>
              <p className="mt-1 text-sm font-semibold">{society.code}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[rgb(var(--app-text-muted-rgb))]">Address</p>
              <p className="mt-1 text-sm font-semibold">{society.address}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <article key={card.key} className="rounded-3xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-4 shadow-sm">
              <div className={`inline-flex rounded-full bg-gradient-to-r ${card.tone} px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-main)]`}>
                {card.label}
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight">{card.value}</p>
            </article>
          ))}
        </div>
      </section>

      <AlertMessage type={alert.type} message={alert.message} />

      <section className="rounded-[28px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] p-5 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.26)] sm:p-6">
        <div className="grid gap-4 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--app-text-muted-rgb))]">Search</label>
            <input
              value={searchTerm}
              onChange={(event) => {
                setPage(1);
                setSearchTerm(event.target.value);
              }}
              placeholder="Name, mobile, email, flat number, wing, or society"
              className="mt-2 w-full rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--app-text-muted-rgb))]">Role</label>
            <select
              value={filters.role}
              onChange={(event) => updateFilter("role", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            >
              {ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--app-text-muted-rgb))]">Status</label>
            <select
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            >
              {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--app-text-muted-rgb))]">KYC</label>
            <select
              value={filters.kyc}
              onChange={(event) => updateFilter("kyc", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            >
              {KYC_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--app-text-muted-rgb))]">Wing</label>
            <input
              value={filters.wing}
              onChange={(event) => updateFilter("wing", event.target.value.trim().toUpperCase())}
              placeholder="Wing A"
              className="mt-2 w-full rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--app-text-muted-rgb))]">Floor</label>
            <input
              value={filters.floor}
              onChange={(event) => updateFilter("floor", event.target.value.trim())}
              placeholder="3"
              className="mt-2 w-full rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--app-text-muted-rgb))]">Flat</label>
            <input
              value={filters.flatNumber}
              onChange={(event) => updateFilter("flatNumber", event.target.value.trim().toUpperCase())}
              placeholder="A-302"
              className="mt-2 w-full rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--app-text-muted-rgb))]">From</label>
            <input
              type="date"
              value={filters.registrationFrom}
              onChange={(event) => updateFilter("registrationFrom", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--app-text-muted-rgb))]">To</label>
            <input
              type="date"
              value={filters.registrationTo}
              onChange={(event) => updateFilter("registrationTo", event.target.value)}
              className="mt-2 w-full rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
            />
          </div>

          <div className="flex items-end gap-3 lg:col-span-2">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-3 text-sm font-semibold text-[rgb(var(--app-text-rgb))] transition hover:border-cyan-500"
            >
              Reset filters
            </button>
            <div className="rounded-2xl border border-[rgb(var(--app-border-rgb))] px-4 py-3 text-sm text-[rgb(var(--app-text-muted-rgb))]">
              Page {meta.page || page} of {totalPages}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] shadow-[0_20px_60px_-32px_rgba(15,23,42,0.22)]">
        <div className="overflow-x-auto">
          <table className="min-w-full w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[rgb(var(--app-surface-muted-rgb))] text-[10px] font-bold uppercase tracking-[0.24em] text-[rgb(var(--app-text-muted-rgb))]">
              <tr>
                <th className="px-4 py-4">Profile Photo</th>
                <th className="px-4 py-4">User ID</th>
                <th className="px-4 py-4">Full Name</th>
                <th className="px-4 py-4">Mobile Number</th>
                <th className="px-4 py-4">Email Address</th>
                <th className="px-4 py-4">Role</th>
                <th className="px-4 py-4">Resident Type</th>
                <th className="px-4 py-4">Society Name</th>
                <th className="px-4 py-4">Wing</th>
                <th className="px-4 py-4">Floor</th>
                <th className="px-4 py-4">Flat Number</th>
                <th className="px-4 py-4">Registration Date</th>
                <th className="px-4 py-4">Last Login</th>
                <th className="px-4 py-4">KYC Status</th>
                <th className="px-4 py-4">Account Status</th>
                <th className="px-4 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`sk-${index}`} className="border-t border-[rgb(var(--app-border-rgb))]">
                    <td colSpan={16} className="px-4 py-5">
                      <div className="h-5 animate-pulse rounded-full bg-[rgb(var(--app-surface-muted-rgb))]" />
                    </td>
                  </tr>
                ))
              ) : visibleUsers.length ? (
                visibleUsers.map((user) => {
                  const currentStatus = String(user?.status || "").toLowerCase();
                  const kycStatus = String(user?.kyc_status || "pending").toLowerCase();
                  const residentType = String(user?.resident_type || "").toLowerCase();
                  const isPending = currentStatus === "pending";
                  const isActive = currentStatus === "active";
                  const isRejected = currentStatus === "rejected";
                  const isInactive = currentStatus === "inactive";
                  const flatSummary = [user?.flat_wing || user?.wing_name || user?.wing_code, user?.flat_floor, user?.flat_flat_number || user?.flat_number].filter(Boolean).join(" • ") || "-";

                  return (
                    <tr key={user.id} className="border-t border-[rgb(var(--app-border-rgb))] transition hover:bg-[rgb(var(--app-surface-muted-rgb))]">
                      <td className="px-4 py-4 align-top"><Avatar user={user} /></td>
                      <td className="px-4 py-4 align-top font-semibold">#{user.id}</td>
                      <td className="px-4 py-4 align-top">
                        <div className="font-semibold">{user.name || "-"}</div>
                        <div className="mt-1 max-w-[260px] truncate text-xs text-[rgb(var(--app-text-muted-rgb))]">{user.phone || "No mobile number"}</div>
                      </td>
                      <td className="px-4 py-4 align-top">{user.phone || "-"}</td>
                      <td className="px-4 py-4 align-top max-w-[220px] truncate">{user.email || "-"}</td>
                      <td className="px-4 py-4 align-top"><RolePill role={user.role} residentType={residentType} /></td>
                      <td className="px-4 py-4 align-top">{user.role === "resident" ? (residentType ? residentType[0].toUpperCase() + residentType.slice(1) : "-") : "-"}</td>
                      <td className="px-4 py-4 align-top max-w-[220px]">
                        <div className="font-medium">{user.society_name || society.name || "-"}</div>
                        <div className="mt-1 text-xs text-[rgb(var(--app-text-muted-rgb))]">{user.society_code || society.code || "-"}</div>
                      </td>
                      <td className="px-4 py-4 align-top">{user.flat_wing || user.wing_name || user.wing_code || "-"}</td>
                      <td className="px-4 py-4 align-top">{user.flat_floor || "-"}</td>
                      <td className="px-4 py-4 align-top">{user.flat_flat_number || user.flat_number || "-"}</td>
                      <td className="px-4 py-4 align-top">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-4 align-top">{formatDateTime(user.last_login)}</td>
                      <td className="px-4 py-4 align-top"><StatusPill status={kycStatus} /></td>
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-2">
                          <StatusPill status={currentStatus} />
                          <div className="text-xs text-[rgb(var(--app-text-muted-rgb))]">{isPending ? "Waiting for approval" : isActive ? "Live and active" : isRejected ? "Rejected by chairman" : "Suspended"}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <IconButton title="View Profile" tone="primary" onClick={() => openProfile(user, "view")}>
                            <ActionIcon type="view" />
                          </IconButton>
                          <IconButton title="Edit User" tone="neutral" onClick={() => openProfile(user, "edit")}>
                            <ActionIcon type="edit" />
                          </IconButton>
                          {isPending ? (
                            <>
                              <IconButton title="Approve" tone="success" disabled={profileSavingId === user.id} onClick={() => changeUserStatus(user.id, "active")}>
                                <ActionIcon type="approve" />
                              </IconButton>
                              <IconButton title="Reject" tone="danger" disabled={profileSavingId === user.id} onClick={() => changeUserStatus(user.id, "rejected")}>
                                <ActionIcon type="reject" />
                              </IconButton>
                            </>
                          ) : null}
                          {isActive ? (
                            <IconButton title="Suspend" tone="warning" disabled={profileSavingId === user.id} onClick={() => changeUserStatus(user.id, "inactive")}>
                              <ActionIcon type="suspend" />
                            </IconButton>
                          ) : null}
                          {isInactive || isRejected ? (
                            <IconButton title="Activate" tone="success" disabled={profileSavingId === user.id} onClick={() => changeUserStatus(user.id, "active")}>
                              <ActionIcon type="activate" />
                            </IconButton>
                          ) : null}
                          <IconButton title="Delete" tone="danger" disabled={profileSavingId === user.id} onClick={() => handleDelete(user)}>
                            <ActionIcon type="delete" />
                          </IconButton>
                        </div>
                        <div className="mt-2 text-xs text-[rgb(var(--app-text-muted-rgb))]">Flat: {flatSummary}</div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-[rgb(var(--app-text-muted-rgb))]" colSpan={16}>
                    No society users matched your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] px-4 py-4 shadow-sm">
        <div className="text-sm text-[rgb(var(--app-text-muted-rgb))]">
          Showing {visibleUsers.length} of {meta.total || visibleUsers.length} users
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            className="rounded-xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <div className="rounded-xl border border-[rgb(var(--app-border-rgb))] px-4 py-2 text-sm font-semibold">
            Page {page} / {totalPages}
          </div>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
            className="rounded-xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {selectedUser ? (
        <div className="fixed inset-0 z-50 flex">
          <button type="button" aria-label="Close profile drawer" onClick={closeDrawer} className="absolute inset-0 theme-surface backdrop-blur-sm" />
          <aside className="relative ml-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-rgb))] shadow-[0_24px_80px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between border-b border-[rgb(var(--app-border-rgb))] px-6 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[rgb(var(--app-text-muted-rgb))]">{drawerMode === "edit" ? "Edit profile" : "Profile details"}</p>
                <h3 className="mt-1 text-2xl font-semibold">{selectedUser.name || "User Profile"}</h3>
              </div>
              <button type="button" onClick={closeDrawer} className="rounded-xl border border-[rgb(var(--app-border-rgb))] px-3 py-2 text-sm font-semibold">
                Close
              </button>
            </div>

            <div className="grid gap-6 px-6 py-6">
              <div className="flex items-start gap-4 rounded-[24px] border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4">
                <Avatar user={selectedUser} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-lg font-semibold">{selectedUser.name || "-"}</h4>
                    <RolePill role={selectedUser.role} residentType={selectedUser.resident_type} />
                    <StatusPill status={selectedUser.status} />
                  </div>
                  <p className="mt-1 text-sm text-[rgb(var(--app-text-muted-rgb))]">#{selectedUser.id} • {selectedUser.email || "-"}</p>
                </div>
              </div>

              {drawerMode === "edit" ? (
                <form onSubmit={handleEditSave} className="space-y-4 rounded-[24px] border border-[rgb(var(--app-border-rgb))] p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--app-text-muted-rgb))]">Full Name</span>
                      <input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-3 text-sm outline-none" />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--app-text-muted-rgb))]">Mobile Number</span>
                      <input value={editForm.phone} onChange={(event) => setEditForm((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-3 text-sm outline-none" />
                    </label>
                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--app-text-muted-rgb))]">Email Address</span>
                      <input value={editForm.email} onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-3 text-sm outline-none" />
                    </label>
                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--app-text-muted-rgb))]">Profile Photo URL</span>
                      <input value={editForm.profile_photo_url} onChange={(event) => setEditForm((current) => ({ ...current, profile_photo_url: event.target.value }))} className="w-full rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-3 text-sm outline-none" />
                    </label>
                    <label className="space-y-2 sm:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--app-text-muted-rgb))]">Family Members JSON</span>
                      <textarea rows="5" value={editForm.family_members} onChange={(event) => setEditForm((current) => ({ ...current, family_members: event.target.value }))} className="w-full rounded-2xl border border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] px-4 py-3 text-sm outline-none" placeholder='[{"name":"Spouse","relation":"Wife"}]' />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button type="submit" disabled={saving} className="rounded-2xl bg-[rgb(var(--app-primary-rgb))] px-4 py-3 text-sm font-semibold text-[var(--text-main)] disabled:opacity-60">
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                    <button type="button" onClick={() => setDrawerMode("view")} className="rounded-2xl border border-[rgb(var(--app-border-rgb))] px-4 py-3 text-sm font-semibold">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="grid gap-4 rounded-[24px] border border-[rgb(var(--app-border-rgb))] p-5 sm:grid-cols-2">
                <DrawerField label="Photo">{selectedUser.profile_photo_url ? <a href={selectedUser.profile_photo_url} target="_blank" rel="noreferrer" className="break-all text-cyan-600 underline">Open photo</a> : "-"}</DrawerField>
                <DrawerField label="Name">{selectedUser.name || "-"}</DrawerField>
                <DrawerField label="Mobile">{selectedUser.phone || "-"}</DrawerField>
                <DrawerField label="Email">{selectedUser.email || "-"}</DrawerField>
                <DrawerField label="Society">{selectedUser.society_name || society.name || "-"}</DrawerField>
                <DrawerField label="Wing">{selectedUser.flat_wing || selectedUser.wing_name || selectedUser.wing_code || "-"}</DrawerField>
                <DrawerField label="Floor">{selectedUser.flat_floor || "-"}</DrawerField>
                <DrawerField label="Flat Number">{selectedUser.flat_flat_number || selectedUser.flat_number || "-"}</DrawerField>
                <DrawerField label="Resident Type">{selectedUser.role === "resident" ? (selectedUser.resident_type || "-") : "-"}</DrawerField>
                <DrawerField label="Family Members">{safeParseList(selectedUser.family_members).length ? `${safeParseList(selectedUser.family_members).length} member(s)` : "-"}</DrawerField>
                <DrawerField label="Vehicles">{safeParseList(selectedUser.vehicles || selectedUser.vehicle_numbers || selectedUser.vehicle_number).length ? `${safeParseList(selectedUser.vehicles || selectedUser.vehicle_numbers || selectedUser.vehicle_number).length} vehicle(s)` : "-"}</DrawerField>
                <DrawerField label="Registration Date">{formatDateTime(selectedUser.created_at)}</DrawerField>
                <DrawerField label="Last Login">{formatDateTime(selectedUser.last_login)}</DrawerField>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => openProfile(selectedUser, "edit")} className="rounded-2xl border border-[rgb(var(--app-border-rgb))] px-4 py-3 text-sm font-semibold">
                  Edit User
                </button>
                {String(selectedUser.status || "").toLowerCase() === "pending" ? (
                  <>
                    <button type="button" onClick={() => changeUserStatus(selectedUser.id, "active")} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-[var(--text-main)]">
                      Approve
                    </button>
                    <button type="button" onClick={() => changeUserStatus(selectedUser.id, "rejected")} className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-[var(--text-main)]">
                      Reject
                    </button>
                  </>
                ) : null}
                {String(selectedUser.status || "").toLowerCase() === "active" ? (
                  <button type="button" onClick={() => changeUserStatus(selectedUser.id, "inactive")} className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-[var(--text-main)]">
                    Suspend
                  </button>
                ) : null}
                {String(selectedUser.status || "").toLowerCase() === "inactive" || String(selectedUser.status || "").toLowerCase() === "rejected" ? (
                  <button type="button" onClick={() => changeUserStatus(selectedUser.id, "active")} className="rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-[var(--text-main)]">
                    Activate
                  </button>
                ) : null}
                <button type="button" onClick={() => handleDelete(selectedUser)} className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700">
                  Delete
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

export default ChairmanUserManagementPage;
