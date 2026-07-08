import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import ModulePageHeader from "../components/ModulePageHeader";
import { getApiMessage } from "../services/authApi";
import { deleteUser, fetchUsers, updateUserStatus } from "../services/userApi";
import { getStoredRole } from "../utils/session";
import "./users-page.css";

const Motion = motion;

const tabs = [
  ["all", "All Residents"],
  ["owner", "Owners"],
  ["tenant", "Tenants"],
  ["family", "Families"],
  ["pending", "Pending Verification"],
  ["move", "Move In / Move Out"],
];

function Icon({ name, className = "rp-icon" }) {
  const icons = {
    users: "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm-12 9a8 8 0 0 1 16 0M19 8v4m2-2h-4",
    home: "M3 11l9-8 9 8M5 10v10h14V10",
    key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-2.82-2.82A5.5 5.5 0 0 1 11.39 11.61ZM14 8l7-7m-4 1 3 3",
    family: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20a5 5 0 0 1 10 0m-2 0a5 5 0 0 1 10 0",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
    alert: "M12 9v4m0 4h.01M10.3 3.86 1.82-1.04 9.88 17.11A2 2 0 0 1 20.27 23H3.73A2 2 0 0 1 2 19.93L11.88 2.82a2 2 0 0 1 3.46 0Z",
    search: "M11 19a8 8 0 1 1 5.3-14A8 8 0 0 1 11 19Zm10 2-4.35-4.35",
    plus: "M12 5v14M5 12h14",
    upload: "M12 16V4m0 0 5 5m-5-5-5 5M5 20h14",
    download: "M12 4v12m0 0 5-5m-5 5-5-5M5 20h14",
    filter: "M4 5h16M7 12h10M10 19h4",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z",
    docs: "M6 3h9l3 3v15H6V3Zm8 0v4h4M9 12h6M9 16h5",
    more: "M12 12h.01M19 12h.01M5 12h.01",
    trash: "M3 6h18M8 6V4h8v2M6 6l1 16h10l1-16",
    phone: "M22 16.9v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.9.66 2.81a2 2 0 0 1-.45 2.11L8.1 9.86a16 16 0 0 0 6 6l1.22-1.22a2 2 0 0 1 2.11-.45c.91.31 1.85.53 2.81.66A2 2 0 0 1 22 16.9Z",
    mail: "M4 4h16v16H4V4Zm0 4 8 5 8-5",
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={icons[name] || icons.users} />
    </svg>
  );
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function titleCase(value) {
  return String(value || "Resident").replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getResidentType(resident) {
  const type = normalize(resident.resident_type);
  if (["owner", "tenant", "family"].includes(type)) return type;
  return "owner";
}

function getWing(resident) {
  if (resident.wing) return String(resident.wing).toUpperCase();
  const match = String(resident.flat_number || "").match(/^([A-Za-z]+)/);
  return match ? match[1].toUpperCase() : "-";
}

function getInitials(name = "Resident") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "R";
}

function safeMessage(error, fallback) {
  const message = getApiMessage(error, fallback);
  if (/limit.*between/i.test(message)) return fallback;
  return message;
}

function Button({ children, tone = "default", className = "", ...props }) {
  return <button type="button" className={`rp-btn rp-btn--${tone} ${className}`} {...props}>{children}</button>;
}

function KpiCard({ label, value, icon, growth, description, tone }) {
  return (
    <Motion.article whileHover={{ y: -3 }} className={`rp-kpi rp-kpi--${tone}`}>
      <span className="rp-kpi__icon"><Icon name={icon} /></span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
        <small>{description}</small>
      </div>
      <span className="rp-kpi__trend">{growth}</span>
    </Motion.article>
  );
}

function Avatar({ resident }) {
  return <span className="rp-avatar">{getInitials(resident.name)}</span>;
}

function StatusBadge({ status }) {
  const value = normalize(status || "pending");
  return <span className={`rp-badge rp-badge--${value}`}>{value === "active" ? "Active" : titleCase(value)}</span>;
}

function TypeBadge({ type }) {
  return <span className={`rp-badge rp-badge--${type}`}>{titleCase(type)}</span>;
}

function DetailsDrawer({ resident, onClose }) {
  return (
    <AnimatePresence>
      {resident ? (
        <>
          <Motion.div className="rp-drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <Motion.aside className="rp-drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }}>
            <div className="rp-drawer__head">
              <div className="rp-resident-cell">
                <Avatar resident={resident} />
                <div>
                  <h2>{resident.name}</h2>
                  <p>{resident.id} / {resident.flat_number}</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rp-icon-btn">x</button>
            </div>
            <div className="rp-drawer__grid">
              {[
                ["Personal Information", `${resident.email} / ${resident.phone}`],
                ["Owner / Tenant Details", `${titleCase(getResidentType(resident))} in ${resident.tower || getWing(resident)}`],
                ["Family Members", `${resident.family_members_count || 0} linked members`],
                ["Vehicles", "Parking and vehicle records available"],
                ["Documents", "KYC, agreement, ownership proof"],
                ["Complaints", "Complaint history and resolution status"],
                ["Visitors", "Visitor approvals and gate logs"],
                ["Billing History", "Maintenance billing and dues"],
              ].map(([title, text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}
            </div>
            <section className="rp-drawer__ai">
              <h3>AI Resident Summary</h3>
              <p>Nexora AI found a stable resident profile. Suggested action: verify documents and review parking assignment before the next billing cycle.</p>
            </section>
          </Motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function UsersPage() {
  const role = getStoredRole();
  const isChairman = role === "admin" || role === "chairman";
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [tab, setTab] = useState("all");
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedResident, setSelectedResident] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [filters, setFilters] = useState({ search: "", wing: "all", floor: "all", flat: "all", status: "all", occupancy: "all" });

  useEffect(() => {
    let mounted = true;
    async function loadResidents() {
      try {
        setLoading(true);
        const response = await fetchUsers({ role: "resident", status: "all", limit: 100 });
        const rows = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        if (mounted) setResidents(rows.filter((user) => normalize(user.role) === "resident"));
      } catch (error) {
        if (mounted) {
          setResidents([]);
          setAlert({ type: "error", message: safeMessage(error, "Could not load live resident records.") });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadResidents();
    return () => { mounted = false; };
  }, []);

  const stats = useMemo(() => {
    const owners = residents.filter((resident) => getResidentType(resident) === "owner").length;
    const tenants = residents.filter((resident) => getResidentType(resident) === "tenant").length;
    const families = residents.filter((resident) => getResidentType(resident) === "family").length + residents.reduce((sum, resident) => sum + Number(resident.family_members_count || 0), 0);
    const verified = residents.filter((resident) => normalize(resident.status) === "active").length;
    const pending = residents.filter((resident) => normalize(resident.status) === "pending").length;
    return { total: residents.length, owners, tenants, families, verified, pending };
  }, [residents]);

  const tabCounts = useMemo(() => ({
    all: residents.length,
    owner: stats.owners,
    tenant: stats.tenants,
    family: stats.families,
    pending: stats.pending,
    move: residents.filter((resident) => ["inactive", "pending"].includes(normalize(resident.status))).length,
  }), [residents, stats]);

  const options = useMemo(() => {
    const values = (getter) => [...new Set(residents.map(getter).filter(Boolean))].sort();
    return {
      wings: values(getWing),
      floors: values((resident) => String(resident.floor || "").trim()).filter(Boolean),
      flats: values((resident) => resident.flat_number),
    };
  }, [residents]);

  const filteredResidents = useMemo(() => residents.filter((resident) => {
    const type = getResidentType(resident);
    const status = normalize(resident.status || "pending");
    const searchable = [resident.name, resident.id, resident.email, resident.phone, resident.flat_number, resident.tower].join(" ").toLowerCase();
    if (filters.search && !searchable.includes(filters.search.toLowerCase())) return false;
    if (filters.wing !== "all" && getWing(resident) !== filters.wing) return false;
    if (filters.floor !== "all" && String(resident.floor || "") !== filters.floor) return false;
    if (filters.flat !== "all" && resident.flat_number !== filters.flat) return false;
    if (filters.status !== "all" && status !== filters.status) return false;
    if (filters.occupancy !== "all" && (filters.occupancy === "occupied" ? status === "inactive" : status !== "inactive")) return false;
    if (tab === "owner" && type !== "owner") return false;
    if (tab === "tenant" && type !== "tenant") return false;
    if (tab === "family" && type !== "family") return false;
    if (tab === "pending" && status !== "pending") return false;
    if (tab === "move" && !["inactive", "pending"].includes(status)) return false;
    return true;
  }), [filters, residents, tab]);

  function setFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function approveResident(resident) {
    try {
      setUpdatingId(resident.id);
      await updateUserStatus(resident.id, "active");
      setResidents((current) => current.map((item) => item.id === resident.id ? { ...item, status: "active" } : item));
      setAlert({ type: "success", message: "Resident approved successfully." });
    } catch (error) {
      setAlert({ type: "error", message: safeMessage(error, "Could not approve resident.") });
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(resident) {
    if (!isChairman) {
      setAlert({ type: "error", message: "Secretary has limited delete access. Permission management is restricted." });
      return;
    }
    try {
      setUpdatingId(resident.id);
      await deleteUser(resident.id, "Deleted from Residents Management");
      setResidents((current) => current.filter((item) => item.id !== resident.id));
      setAlert({ type: "success", message: "Resident deleted successfully." });
    } catch (error) {
      setAlert({ type: "error", message: safeMessage(error, "Could not delete resident.") });
    } finally {
      setUpdatingId(null);
    }
  }

  function exportResidents() {
    const headers = ["Resident", "Flat", "Contact", "Type", "Status", "Move-in Date"];
    const rows = filteredResidents.map((resident) => [resident.name, resident.flat_number, resident.phone, getResidentType(resident), resident.status, formatDate(resident.created_at)]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nexora-residents.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const kpis = [
    ["Total Residents", stats.total, "users", "+3.2%", "All resident profiles", "violet"],
    ["Owners", stats.owners, "home", "+2.1%", "Registered owners", "blue"],
    ["Tenants", stats.tenants, "key", "+1.4%", "Active tenants", "cyan"],
    ["Families", stats.families, "family", "+4.8%", "Linked family members", "green"],
    ["Verified Residents", stats.verified, "shield", "95%", "Approved profiles", "emerald"],
    ["Pending Verification", stats.pending, "alert", "Review", "KYC action needed", "amber"],
  ];

  return (
    <div className="residents-page">
      <ModulePageHeader title="Residents" subtitle="Manage society residents and approvals." />

      <AlertMessage type={alert.type} message={alert.message} />

      <section className="rp-kpi-grid">
        {kpis.map(([label, value, icon, growth, description, tone]) => <KpiCard key={label} label={label} value={value.toLocaleString("en-IN")} icon={icon} growth={growth} description={description} tone={tone} />)}
      </section>

      <section className="rp-tabs-card">
        {tabs.map(([id, label]) => <button key={id} type="button" onClick={() => setTab(id)} className={tab === id ? "is-active" : ""}>{label}<span>{tabCounts[id] || 0}</span></button>)}
      </section>

      <section className="rp-action-bar module-action-bar">
        <label className="rp-search">
          <Icon name="search" />
          <input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Resident Search" />
        </label>
        <select value={filters.wing} onChange={(event) => setFilter("wing", event.target.value)}><option value="all">Wing</option>{options.wings.map((value) => <option key={value}>{value}</option>)}</select>
        <select value={filters.floor} onChange={(event) => setFilter("floor", event.target.value)}><option value="all">Floor</option>{options.floors.map((value) => <option key={value}>{value}</option>)}</select>
        <select value={filters.flat} onChange={(event) => setFilter("flat", event.target.value)}><option value="all">Flat</option>{options.flats.map((value) => <option key={value}>{value}</option>)}</select>
        <select value={filters.status} onChange={(event) => setFilter("status", event.target.value)}><option value="all">Status</option><option value="active">Active</option><option value="pending">Pending</option><option value="inactive">Inactive</option></select>
        <select value={filters.occupancy} onChange={(event) => setFilter("occupancy", event.target.value)}><option value="all">Occupancy</option><option value="occupied">Occupied</option><option value="vacant">Vacant</option></select>
        <Button onClick={() => setAlert({ type: "success", message: "Filters applied." })}><Icon name="filter" /> Filters</Button>
        <Button><Icon name="upload" /> Import</Button>
        <Button onClick={exportResidents}><Icon name="download" /> Export</Button>
        <Button tone="primary" onClick={() => setAlert({ type: "info", message: "Add Resident workflow selected." })}><Icon name="plus" /> Add Resident</Button>
      </section>

      <section className="rp-table-card">
        <div className="rp-table-scroll">
          <table className="rp-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={selectedRows.length === filteredResidents.length && filteredResidents.length > 0} onChange={(event) => setSelectedRows(event.target.checked ? filteredResidents.map((resident) => resident.id) : [])} aria-label="Select all residents" /></th>
                {["Resident", "Flat", "Contact", "Resident Type", "Status", "Move-In Date", "Actions"].map((heading) => <th key={heading}>{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 8 }).map((_, index) => <tr key={index}><td colSpan={8}><div className="rp-skeleton" /></td></tr>) : filteredResidents.length ? filteredResidents.map((resident) => {
                const type = getResidentType(resident);
                const status = normalize(resident.status || "pending");
                return (
                  <Motion.tr key={resident.id} layout>
                    <td><input type="checkbox" checked={selectedRows.includes(resident.id)} onChange={(event) => setSelectedRows((rows) => event.target.checked ? [...rows, resident.id] : rows.filter((id) => id !== resident.id))} aria-label={`Select ${resident.name}`} /></td>
                    <td>
                      <button type="button" onClick={() => setSelectedResident(resident)} className="rp-resident-cell">
                        <Avatar resident={resident} />
                        <span><strong>{resident.name}</strong><small>{resident.id}</small></span>
                      </button>
                    </td>
                    <td>
                      <strong>{resident.flat_number}</strong>
                      <small>{getWing(resident)} Wing / Floor {resident.floor || "-"}</small>
                      <span className="rp-bhk">{resident.bhk || "2 BHK"}</span>
                    </td>
                    <td>
                      <span className="rp-contact"><Icon name="phone" />{resident.phone || "-"}</span>
                      <span className="rp-contact"><Icon name="mail" />{resident.email || "-"}</span>
                    </td>
                    <td><TypeBadge type={type} /></td>
                    <td><StatusBadge status={status} /></td>
                    <td><strong>{formatDate(resident.created_at)}</strong><small>{status === "inactive" ? "Moved Out" : resident.last_activity || "Active"}</small></td>
                    <td>
                      <div className="rp-row-actions">
                        <button title="View" onClick={() => setSelectedResident(resident)}><Icon name="eye" /></button>
                        <button title="Edit" onClick={() => setAlert({ type: "info", message: `Edit workflow selected for ${resident.name}.` })}><Icon name="edit" /></button>
                        <button title="Documents" disabled={updatingId === resident.id} onClick={() => approveResident(resident)}><Icon name="docs" /></button>
                        <button title="More" onClick={() => handleDelete(resident)}><Icon name={isChairman ? "trash" : "more"} /></button>
                      </div>
                    </td>
                  </Motion.tr>
                );
              }) : <tr><td colSpan={8} className="rp-empty">No residents match this view.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="rp-table-footer">
          <span>Showing {Math.min(filteredResidents.length, 10)} of {filteredResidents.length} residents</span>
          <div><Button className="rp-page-btn">Prev</Button><Button tone="primary" className="rp-page-btn">1</Button><Button className="rp-page-btn">Next</Button></div>
          <span>10 per page</span>
        </div>
      </section>

      <DetailsDrawer resident={selectedResident} onClose={() => setSelectedResident(null)} />
    </div>
  );
}

export default UsersPage;
