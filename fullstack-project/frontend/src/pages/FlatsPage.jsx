import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import ModulePageHeader from "../components/ModulePageHeader";
import { getApiMessage } from "../services/authApi";
import { archiveFlat, deleteFlat, fetchFlats, fetchResidents, updateFlat } from "../services/flatApi";
import { getStoredRole } from "../utils/session";

const Motion = motion;

const tabs = [
  ["all", "All Flats"],
  ["occupied", "Occupied"],
  ["vacant", "Vacant"],
  ["under_maintenance", "Under Maintenance"],
  ["society_owned", "Society Owned"],
  ["tenant_occupied", "Tenant Occupied"],
  ["owner_occupied", "Owner Occupied"],
  ["archived", "Archived"],
];

const kpiLabels = [
  ["Total Flats", "building", "Complete property register"],
  ["Occupied Flats", "home", "Currently allocated homes"],
  ["Vacant Flats", "key", "Ready for allocation"],
  ["Under Maintenance", "tool", "Needs repair or inspection"],
  ["Total Towers", "tower", "Configured towers"],
  ["Total Wings", "layers", "Society wing structure"],
  ["Total Floors", "floor", "Mapped floors"],
  ["Occupancy Rate", "chart", "Portfolio health"],
];

function Icon({ name, className = "h-4 w-4" }) {
  const icons = {
    building: "M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16M8 7h.01M12 7h.01M8 11h.01M12 11h.01M8 15h.01M12 15h.01M3 21h18",
    home: "M3 11l9-8 9 8M5 10v10h14V10",
    key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-2.82-2.82A5.5 5.5 0 0 1 11.39 11.61ZM14 8l7-7m-4 1 3 3",
    tool: "M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3 2.4-2.4Z",
    tower: "M8 21h8M12 3v18M7 7h10M6 11h12M5 15h14",
    layers: "m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5",
    floor: "M4 20h16M6 20V4h12v16M9 8h6M9 12h6M9 16h6",
    chart: "M4 19V5m0 14h16M8 16v-5m4 5V8m4 8v-7",
    spark: "M12 3l1.7 5.1L19 10l-5.3 1.9L12 17l-1.7-5.1L5 10l5.3-1.9L12 3Z",
    plus: "M12 5v14M5 12h14",
    upload: "M12 16V4m0 0 5 5m-5-5-5 5M5 20h14",
    download: "M12 4v12m0 0 5-5m-5 5-5-5M5 20h14",
    search: "M11 19a8 8 0 1 1 5.3-14A8 8 0 0 1 11 19Zm10 2-4.35-4.35",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z",
    transfer: "M7 7h11m0 0-3-3m3 3-3 3M17 17H6m0 0 3 3m-3-3 3-3",
    file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6",
    clock: "M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
    more: "M12 12h.01M19 12h.01M5 12h.01",
    trash: "M3 6h18M8 6V4h8v2M6 6l1 16h10l1-16",
    car: "M5 17h14l-1.5-5h-11L5 17Zm2 0v2m10-2v2M7 12l2-5h6l2 5",
    bill: "M7 3h10v18l-2-1-2 1-2-1-2 1-2-1-2 1V3Zm3 5h4M10 12h4M10 16h2",
  };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={icons[name] || icons.spark} />
    </svg>
  );
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function titleCase(value) {
  return String(value || "-").replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function getOccupancy(flat) {
  return normalize(flat.occupancy_status || flat.status || "vacant");
}

function getWing(flat) {
  if (flat.wing) return String(flat.wing).toUpperCase();
  const match = String(flat.flat_number || "").match(/^([A-Za-z]+)/);
  return match ? match[1].toUpperCase() : "-";
}

function getTower(flat) {
  return flat.tower_name || flat.building_name || flat.tower || `Tower ${getWing(flat)}`;
}

function getFloor(flat) {
  if (flat.floor) return String(flat.floor);
  const match = String(flat.flat_number || "").match(/(\d{2})\d{2}$/);
  return match ? String(Number(match[1])) : "-";
}

function getArea(flat) {
  return Number(flat.area_sqft || flat.area || flat.built_up_area || 0);
}

function getOwnerTenant(flat) {
  return flat.tenant_name || flat.owner_name || flat.resident_name || "Unassigned";
}

function getStatusTone(value) {
  const status = normalize(value);
  if (status.includes("owner") || status.includes("tenant") || status === "verified" || status === "clear") return "emerald";
  if (status.includes("vacant") || status.includes("pending")) return "amber";
  if (status.includes("maintenance") || status.includes("repair")) return "rose";
  if (status.includes("archived")) return "slate";
  return "blue";
}

function Pill({ children, tone = "blue" }) {
  const tones = {
    blue: "border-blue-400/25 bg-blue-400/10 text-blue-500",
    violet: "border-violet-400/25 bg-violet-400/10 text-violet-500",
    emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-500",
    amber: "border-amber-400/25 bg-amber-400/10 text-amber-500",
    rose: "border-rose-400/25 bg-rose-400/10 text-rose-500",
    slate: "border-slate-400/25 bg-slate-400/10 text-slate-500",
  };
  return <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}

function Button({ children, tone = "default", className = "", ...props }) {
  const tones = {
    primary: "border-blue-500 bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.22)]",
    ai: "border-violet-500 bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-[0_12px_28px_rgba(124,58,237,0.2)]",
    danger: "border-rose-400/30 bg-rose-400/10 text-rose-500",
    default: "border-[var(--border-color)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] text-[var(--text)]",
  };
  return <button type="button" className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${tones[tone]} ${className}`} {...props}>{children}</button>;
}

function KpiCard({ label, value, icon, description, trend, tone }) {
  return (
    <Motion.article whileHover={{ y: -2 }} className="relative min-h-[112px] overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] p-4 shadow-sm backdrop-blur-2xl">
      <div className={`absolute -right-8 -top-10 h-24 w-24 rounded-full blur-2xl opacity-40 ${tone}`} />
      <div className="relative flex items-start justify-between gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white ${tone}`}><Icon name={icon} /></span>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black text-emerald-500">{trend}</span>
      </div>
      <div className="relative mt-3">
        <p className="text-[11px] font-black uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
        <strong className="mt-1 block text-2xl font-black tracking-tight text-[var(--text)]">{value}</strong>
        <span className="mt-1 block truncate text-xs text-[var(--text-muted)]">{description}</span>
      </div>
    </Motion.article>
  );
}

function DetailsDrawer({ flat, onClose }) {
  return (
    <AnimatePresence>
      {flat ? (
        <>
          <Motion.div className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <Motion.aside className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto border-l border-[var(--border-color)] bg-[var(--surface)] p-5 shadow-2xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-blue-500">Property Details</p>
                <h2 className="mt-1 text-2xl font-black text-[var(--text)]">{flat.flat_number}</h2>
                <p className="text-sm text-[var(--text-muted)]">{getTower(flat)} - Wing {getWing(flat)} - Floor {getFloor(flat)}</p>
              </div>
              <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--border-color)] text-[var(--text)]">x</button>
            </div>

            <section className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Basic Details", `${getArea(flat) || "-"} sq.ft - ${flat.flat_type || "Configuration pending"}`],
                ["Owner Information", `${flat.owner_name || "Unassigned"} - Ownership documents ${flat.verification_status || "pending"}`],
                ["Tenant Information", `${flat.tenant_name || "No tenant"} - Move-in ${flat.move_in_date || "-"}`],
                ["Parking", `${flat.parking_slot_number || "No slot"} - Vehicles ${flat.vehicles || "-"}`],
                ["Maintenance", `Bills clear: ${flat.pending_dues || "INR 0"} - ${flat.maintenance_status || "Clear"}`],
                ["Documents", "Ownership proof, tax documents, and agreements indexed"],
              ].map(([title, text]) => (
                <article key={title} className="rounded-2xl border border-[var(--border-color)] bg-[var(--surface-muted)]/60 p-4">
                  <h3 className="text-sm font-black text-[var(--text)]">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{text}</p>
                </article>
              ))}
            </section>

            <section className="mt-5">
              <h3 className="text-sm font-black text-[var(--text)]">Activity Timeline</h3>
              <div className="mt-3 grid gap-3">
                {["Ownership record updated", "Maintenance bill generated", "Parking slot reviewed", "Document verification completed"].map((item, index) => (
                  <article key={item} className="grid grid-cols-[56px_1fr] gap-3 border-l-2 border-blue-400/40 pl-3 text-sm">
                    <span className="text-xs font-bold text-[var(--text-muted)]">{`${9 + index}:15`}</span>
                    <p className="text-[var(--text)]">{item}</p>
                  </article>
                ))}
              </div>
            </section>
          </Motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ActionMenu({ flat, onView, onEdit, onAssignOwner, onAssignTenant, onMaintenance, onDocuments, onDelete }) {
  const [open, setOpen] = useState(false);
  const actions = [
    ["View", onView],
    ["Edit", onEdit],
    ["Assign Owner", onAssignOwner],
    ["Assign Tenant", onAssignTenant],
    ["Maintenance History", onMaintenance],
    ["Documents", onDocuments],
    ["Delete", onDelete],
  ];

  return (
    <div className="relative inline-flex">
      <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[var(--border-color)] px-3 text-xs font-black text-[var(--text)]">
        Actions
        <Icon name="more" />
      </button>
      {open ? (
        <div className="absolute right-0 top-10 z-20 grid w-48 gap-1 rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-2 shadow-2xl">
          {actions.map(([label, handler]) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setOpen(false);
                handler(flat);
              }}
              className={`rounded-xl px-3 py-2 text-left text-xs font-bold hover:bg-[var(--surface-muted)] ${label === "Delete" ? "text-rose-500" : "text-[var(--text)]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FlatsPage() {
  const role = getStoredRole();
  const isChairman = role === "admin" || role === "chairman";
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [tab, setTab] = useState("all");
  const [filters, setFilters] = useState({ search: "", tower: "all", wing: "all", floor: "all", occupancy: "all", status: "all", maintenance: "all", date: "" });

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [flatsResponse] = await Promise.all([fetchFlats(), fetchResidents()]);
        const flatRows = Array.isArray(flatsResponse?.data) ? flatsResponse.data : Array.isArray(flatsResponse) ? flatsResponse : [];
        if (mounted) {
          setFlats(flatRows);
        }
      } catch (error) {
        if (mounted) {
          setFlats([]);
          setAlert({ type: "error", message: getApiMessage(error, "Could not load flats. Check the property API and try again.") });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  const options = useMemo(() => {
    const values = (getter) => [...new Set(flats.map(getter).filter(Boolean))].sort();
    return {
      towers: values(getTower),
      wings: values(getWing),
      floors: values(getFloor),
    };
  }, [flats]);

  const stats = useMemo(() => {
    const total = flats.length;
    const occupied = flats.filter((flat) => ["owner_occupied", "tenant_occupied", "occupied"].includes(getOccupancy(flat))).length;
    const vacant = flats.filter((flat) => getOccupancy(flat) === "vacant").length;
    const maintenance = flats.filter((flat) => getOccupancy(flat).includes("maintenance") || normalize(flat.maintenance_status).includes("repair")).length;
    const towers = new Set(flats.map(getTower)).size;
    const wings = new Set(flats.map(getWing)).size;
    const floors = new Set(flats.map((flat) => `${getTower(flat)}-${getFloor(flat)}`)).size;
    const occupancyRate = total ? Math.round((occupied / total) * 100) : 0;
    return { total, occupied, vacant, maintenance, towers, wings, floors, occupancyRate };
  }, [flats]);

  const tabCounts = useMemo(() => ({
    all: flats.length,
    occupied: stats.occupied,
    vacant: stats.vacant,
    under_maintenance: stats.maintenance,
    society_owned: flats.filter((flat) => normalize(flat.ownership_type).includes("society")).length,
    tenant_occupied: flats.filter((flat) => getOccupancy(flat) === "tenant_occupied").length,
    owner_occupied: flats.filter((flat) => getOccupancy(flat) === "owner_occupied").length,
    archived: flats.filter((flat) => getOccupancy(flat) === "archived").length,
  }), [flats, stats]);

  const filteredFlats = useMemo(() => {
    return flats.filter((flat) => {
      const occupancy = getOccupancy(flat);
      const searchable = [flat.flat_number, flat.owner_name, flat.tenant_name, flat.resident_name, flat.mobile, flat.email, getWing(flat), getTower(flat)].join(" ").toLowerCase();
      if (filters.search && !searchable.includes(filters.search.toLowerCase())) return false;
      if (filters.tower !== "all" && getTower(flat) !== filters.tower) return false;
      if (filters.wing !== "all" && getWing(flat) !== filters.wing) return false;
      if (filters.floor !== "all" && getFloor(flat) !== filters.floor) return false;
      if (filters.occupancy !== "all" && occupancy !== filters.occupancy) return false;
      if (filters.status !== "all" && normalize(flat.verification_status || "pending") !== filters.status) return false;
      if (filters.maintenance !== "all" && (filters.maintenance === "clear" ? normalize(flat.maintenance_status) !== "clear" : normalize(flat.maintenance_status) === "clear")) return false;
      if (tab === "occupied" && !["owner_occupied", "tenant_occupied", "occupied"].includes(occupancy)) return false;
      if (tab === "vacant" && occupancy !== "vacant") return false;
      if (tab === "under_maintenance" && !occupancy.includes("maintenance")) return false;
      if (tab === "society_owned" && !normalize(flat.ownership_type).includes("society")) return false;
      if (tab === "tenant_occupied" && occupancy !== "tenant_occupied") return false;
      if (tab === "owner_occupied" && occupancy !== "owner_occupied") return false;
      if (tab === "archived" && occupancy !== "archived") return false;
      return true;
    });
  }, [filters, flats, tab]);

  function setFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function clearFilters() {
    setFilters({ search: "", tower: "all", wing: "all", floor: "all", occupancy: "all", status: "all", maintenance: "all", date: "" });
    setTab("all");
  }

  function showWorkflow(action, flat) {
    setAlert({ type: "info", message: `${action} workflow selected${flat ? ` for ${flat.flat_number}` : ""}.` });
  }

  async function handleUpdateFlat(flat, payload) {
    try {
      setUpdatingId(flat.id);
      await updateFlat(flat.id, payload);
      setFlats((current) => current.map((item) => item.id === flat.id ? { ...item, ...payload } : item));
      setAlert({ type: "success", message: "Flat updated successfully." });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not update flat") });
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleArchive(flat) {
    try {
      setUpdatingId(flat.id);
      await archiveFlat(flat.id);
      setFlats((current) => current.map((item) => item.id === flat.id ? { ...item, occupancy_status: "archived" } : item));
      setAlert({ type: "success", message: "Flat archived successfully." });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not archive flat") });
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(flat) {
    if (!isChairman) {
      setAlert({ type: "error", message: "Secretary cannot delete towers or change global property configuration." });
      return;
    }
    try {
      setUpdatingId(flat.id);
      await deleteFlat(flat.id);
      setFlats((current) => current.filter((item) => item.id !== flat.id));
      setAlert({ type: "success", message: "Flat deleted successfully." });
      setDeleteCandidate(null);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not delete flat") });
    } finally {
      setUpdatingId(null);
    }
  }

  function exportFlats() {
    const headers = ["Flat Number", "Tower", "Wing", "Floor", "Flat Type", "Area", "Ownership", "Occupancy", "Owner/Tenant", "Parking", "Maintenance", "Verification", "Last Updated"];
    const rows = filteredFlats.map((flat) => [flat.flat_number, getTower(flat), getWing(flat), getFloor(flat), flat.flat_type || "-", getArea(flat) || "-", flat.ownership_type || "-", titleCase(getOccupancy(flat)), getOwnerTenant(flat), flat.parking_slot_number || "-", flat.maintenance_status || "-", flat.verification_status || "-", formatDate(flat.updated_at)]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nexora-flats-properties.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const kpiValues = [stats.total, stats.occupied, stats.vacant, stats.maintenance, stats.towers, stats.wings, stats.floors, `${stats.occupancyRate}%`];

  return (
    <div className="space-y-4 text-[var(--text)]">
      <ModulePageHeader
        title="Flats & Properties"
        subtitle="Manage flats, ownership, occupancy, and maintenance."
        actions={(
          <>
            <Button tone="primary" onClick={() => showWorkflow("Add Flat")}><Icon name="plus" /> Add Flat</Button>
            <Button onClick={() => showWorkflow("Import Flats")}><Icon name="upload" /> Import Flats</Button>
            <Button onClick={exportFlats}><Icon name="download" /> Export Data</Button>
            <Button onClick={() => showWorkflow("Bulk Actions")}>Bulk Actions</Button>
          </>
        )}
      />

      <AlertMessage type={alert.type} message={alert.message} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpiLabels.map(([label, icon, description], index) => (
          <KpiCard key={label} label={label} value={String(kpiValues[index])} icon={icon} description={description} trend={["+2.8%", "+1.9%", "-6", "+3", "Stable", "Mapped", "+4", "Live"][index]} tone={["from-blue-600 to-cyan-500", "from-emerald-500 to-cyan-500", "from-amber-400 to-orange-500", "from-rose-500 to-orange-500", "from-violet-600 to-blue-500", "from-cyan-500 to-blue-500", "from-blue-500 to-violet-500", "from-green-500 to-emerald-500"][index]} />
        ))}
      </section>

      <section className="rounded-[20px] border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] p-2 shadow-sm backdrop-blur-2xl">
        <nav className="flex gap-2 overflow-x-auto" aria-label="Property tabs">
          {tabs.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTab(id)} className={`flex h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-black transition ${tab === id ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.2)]" : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"}`}>{label}<span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px]">{tabCounts[id] || 0}</span></button>
          ))}
        </nav>
      </section>

      <section className="rounded-[20px] border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] p-4 shadow-sm backdrop-blur-2xl">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="xl:col-span-2 flex h-10 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-3 text-sm"><Icon name="search" className="h-4 w-4 text-[var(--text-muted)]" /><input value={filters.search} onChange={(event) => setFilter("search", event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search flat, owner, tenant, mobile, email, wing, tower..." /></label>
          {[["tower", "Tower", options.towers], ["wing", "Wing", options.wings], ["floor", "Floor", options.floors]].map(([key, label, values]) => (
            <select key={key} value={filters[key]} onChange={(event) => setFilter(key, event.target.value)} className="h-10 rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none">
              <option value="all">{label}</option>
              {values.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          ))}
          <select value={filters.occupancy} onChange={(event) => setFilter("occupancy", event.target.value)} className="h-10 rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none"><option value="all">Occupancy</option><option value="owner_occupied">Owner Occupied</option><option value="tenant_occupied">Tenant Occupied</option><option value="vacant">Vacant</option><option value="under_maintenance">Under Maintenance</option></select>
          <select value={filters.status} onChange={(event) => setFilter("status", event.target.value)} className="h-10 rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none"><option value="all">Status</option><option value="verified">Verified</option><option value="pending">Pending</option><option value="archived">Archived</option></select>
          <select value={filters.maintenance} onChange={(event) => setFilter("maintenance", event.target.value)} className="h-10 rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none"><option value="all">Maintenance Status</option><option value="clear">Clear</option><option value="issue">Issue / Repair</option></select>
          <input value={filters.date} onChange={(event) => setFilter("date", event.target.value)} type="date" className="h-10 rounded-xl border border-[var(--border-color)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] outline-none" aria-label="Custom date" />
        </div>
        <div className="mt-3 flex flex-wrap justify-end gap-2"><Button tone="primary">Apply</Button><Button onClick={clearFilters}>Reset</Button><Button onClick={exportFlats}>Export</Button></div>
      </section>

      <section className="overflow-hidden rounded-[20px] border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] shadow-sm backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-color)] p-4">
          <div><h2 className="text-lg font-black text-[var(--text)]">Property Register</h2><p className="text-xs text-[var(--text-muted)]">Showing {filteredFlats.length} of {flats.length} flats</p></div>
          <div className="flex gap-2"><Button onClick={exportFlats}><Icon name="download" /> Export</Button><Button disabled={!selectedRows.length}>Bulk Selection ({selectedRows.length})</Button></div>
        </div>
        <div className="max-h-[620px] overflow-auto">
          <table className="min-w-[1040px] w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-[var(--surface)] shadow-sm">
              <tr className="border-b border-[var(--border-color)] text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="w-12 px-4 py-3"><input type="checkbox" checked={selectedRows.length === filteredFlats.length && filteredFlats.length > 0} onChange={(event) => setSelectedRows(event.target.checked ? filteredFlats.map((flat) => flat.id) : [])} aria-label="Select all flats" /></th>
                {["Flat No", "Tower", "Wing", "Floor", "Owner", "Tenant", "Occupancy", "Maintenance Status", "Parking", "Verification", "Actions"].map((heading) => <th key={heading} className="resize-x overflow-hidden px-4 py-3 font-black">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 6 }).map((_, index) => <tr key={index} className="border-b border-[var(--border-color)]"><td colSpan={12} className="p-4"><div className="h-10 animate-pulse rounded-xl bg-[var(--surface-muted)]" /></td></tr>) : filteredFlats.length ? filteredFlats.map((flat) => {
                const occupancy = getOccupancy(flat);
                return (
                  <Motion.tr key={flat.id} layout className="group border-b border-[var(--border-color)] transition hover:bg-blue-500/[0.06]">
                    <td className="px-4 py-3"><input type="checkbox" checked={selectedRows.includes(flat.id)} onChange={(event) => setSelectedRows((rows) => event.target.checked ? [...rows, flat.id] : rows.filter((id) => id !== flat.id))} aria-label={`Select ${flat.flat_number}`} /></td>
                    <td className="px-4 py-3"><button type="button" onClick={() => setSelectedFlat(flat)} className="font-black text-blue-500">{flat.flat_number}</button></td>
                    <td className="px-4 py-3 text-[var(--text)]">{getTower(flat)}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{getWing(flat)}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{getFloor(flat)}</td>
                    <td className="px-4 py-3 text-[var(--text)]">{flat.owner_name || "Unassigned"}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{flat.tenant_name || "-"}</td>
                    <td className="px-4 py-3"><Pill tone={getStatusTone(occupancy)}>{titleCase(occupancy)}</Pill></td>
                    <td className="px-4 py-3"><Pill tone={getStatusTone(flat.maintenance_status)}>{flat.maintenance_status || "Clear"}</Pill></td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{flat.parking_slot_number || "-"}</td>
                    <td className="px-4 py-3"><Pill tone={getStatusTone(flat.verification_status)}>{flat.verification_status || "Pending"}</Pill></td>
                    <td className="px-4 py-3">
                      <ActionMenu
                        flat={flat}
                        onView={() => setSelectedFlat(flat)}
                        onEdit={() => handleUpdateFlat(flat, { maintenance_status: flat.maintenance_status || "Clear" })}
                        onAssignOwner={() => showWorkflow("Assign Owner", flat)}
                        onAssignTenant={() => showWorkflow("Assign Tenant", flat)}
                        onMaintenance={() => showWorkflow("Maintenance History", flat)}
                        onDocuments={() => showWorkflow("Documents", flat)}
                        onDelete={() => setDeleteCandidate(flat)}
                      />
                    </td>
                  </Motion.tr>
                );
              }) : <tr><td colSpan={12} className="px-4 py-12 text-center text-[var(--text-muted)]">No properties match this view. Clear filters or add a new flat.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-color)] p-4 text-xs text-[var(--text-muted)]">
          <span>Page 1 of 42</span><div className="flex items-center gap-2"><Button className="min-h-8">Previous</Button><Button tone="primary" className="min-h-8">1</Button><Button className="min-h-8">2</Button><Button className="min-h-8">3</Button><Button className="min-h-8">Next</Button></div><span>10 per page</span>
        </div>
      </section>

      <DetailsDrawer flat={selectedFlat} onClose={() => setSelectedFlat(null)} />
      {deleteCandidate ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" role="presentation" onMouseDown={() => setDeleteCandidate(null)}>
          <section className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--surface)] p-5 shadow-2xl" role="dialog" aria-modal="true" aria-label="Delete flat" onMouseDown={(event) => event.stopPropagation()}>
            <h2 className="text-lg font-black text-[var(--text)]">Delete flat {deleteCandidate.flat_number}?</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">This action removes the flat from the property register after backend confirmation.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setDeleteCandidate(null)}>Cancel</Button>
              <Button tone="danger" disabled={updatingId === deleteCandidate.id} onClick={() => handleDelete(deleteCandidate)}>Delete</Button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default FlatsPage;
