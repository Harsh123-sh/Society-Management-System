import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  deleteComplaint,
  deleteNotice,
  fetchArchiveCenter,
  restoreComplaint,
  restoreNotice,
  updateRetentionRule,
} from "../services/archiveApi";

const defaultFilters = {
  search: "",
  status: "all",
  category: "",
  flatNumber: "",
  residentId: "",
  fromDate: "",
  toDate: "",
};

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString();
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function StatCard({ label, value, tone = "teal" }) {
  return (
    <motion.div className={`sa-stat-card sa-stat-card--${tone}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -6 }}>
      <p>{label}</p>
      <strong>{value}</strong>
    </motion.div>
  );
}

function ArchiveRow({ item, type, selected, onSelect, onRestore, onDelete }) {
  const title = type === "complaint" ? item.title : item.title;
  const subtitle =
    type === "complaint"
      ? `${item.resident_name || "Unknown resident"} • ${item.resident_flat_number || "No flat"} • ${item.category || "general"}`
      : `${item.created_by_name || "Unknown user"} • ${item.status || "unknown"}`;

  return (
    <tr className="sa-table-row">
      <td className="px-4 py-3 align-top">
        <input type="checkbox" checked={selected} onChange={() => onSelect(item.id, type)} />
      </td>
      <td className="px-4 py-3 align-top">
        <p className="font-semibold text-[var(--text-main)]">{title}</p>
        <p className="mt-1 max-w-xl text-sm text-slate-300">{subtitle}</p>
      </td>
      <td className="px-4 py-3 align-top text-sm text-slate-300">{item.status}</td>
      <td className="px-4 py-3 align-top text-sm text-slate-300">{formatDate(item.created_at)}</td>
      <td className="px-4 py-3 align-top text-sm text-slate-300">{formatDate(item.archived_at || item.deleted_at)}</td>
      <td className="px-4 py-3 align-top text-right">
        <div className="chairman-page flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => onRestore(type, item.id)}
          className="sa-row-action sa-row-action--restore"
          >
            Restore
          </button>
          <button
            type="button"
            onClick={() => onDelete(type, item.id)}
          className="sa-row-action sa-row-action--delete"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

function ArchiveCenterPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archiveData, setArchiveData] = useState({
    stats: {},
    retentionRules: [],
    complaints: [],
    notices: [],
    auditLogs: [],
  });
  const [filters, setFilters] = useState(defaultFilters);
  const [activeTab, setActiveTab] = useState("complaints");
  const [selectedItems, setSelectedItems] = useState([]);
  const [alert, setAlert] = useState(null);

  async function loadArchiveCenter(nextFilters = filters) {
    setLoading(true);
    setAlert(null);

    try {
      const response = await fetchArchiveCenter(nextFilters);
      setArchiveData(response.data || { stats: {}, retentionRules: [], complaints: [], notices: [], auditLogs: [] });
      setSelectedItems([]);
    } catch (error) {
      setAlert({ type: "error", message: error?.response?.data?.message || "Could not load archive center" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArchiveCenter();
  }, []);

  const stats = archiveData.stats || {};
  const complaints = archiveData.complaints || [];
  const notices = archiveData.notices || [];
  const retentionRules = archiveData.retentionRules || [];
  const auditLogs = archiveData.auditLogs || [];

  const visibleRows = useMemo(() => {
    return activeTab === "notices" ? notices : complaints;
  }, [activeTab, complaints, notices]);

  function toggleSelected(id, type) {
    const key = `${type}:${id}`;
    setSelectedItems((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  }

  async function handleRestore(type, id) {
    setSaving(true);
    setAlert(null);

    try {
      if (type === "complaint") {
        await restoreComplaint(id);
      } else {
        await restoreNotice(id);
      }
      await loadArchiveCenter();
      setAlert({ type: "success", message: `${type === "complaint" ? "Complaint" : "Notice"} restored.` });
    } catch (error) {
      setAlert({ type: "error", message: error?.response?.data?.message || "Restore failed" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(type, id) {
    const reason = window.prompt("Enter delete reason for audit trail:");
    if (!reason) {
      return;
    }

    setSaving(true);
    setAlert(null);

    try {
      if (type === "complaint") {
        await deleteComplaint(id, reason);
      } else {
        await deleteNotice(id, reason);
      }
      await loadArchiveCenter();
      setAlert({ type: "success", message: `${type === "complaint" ? "Complaint" : "Notice"} deleted.` });
    } catch (error) {
      setAlert({ type: "error", message: error?.response?.data?.message || "Delete failed" });
    } finally {
      setSaving(false);
    }
  }

  async function handleRetentionSave(rule) {
    const retentionDays = Number(window.prompt(`Retention days for ${rule.resource_type}`, rule.retention_days));
    if (Number.isNaN(retentionDays)) {
      return;
    }
    const archiveAfterDays = Number(
      window.prompt(`Archive after days for ${rule.resource_type}`, rule.archive_after_days)
    );
    if (Number.isNaN(archiveAfterDays)) {
      return;
    }

    setSaving(true);
    setAlert(null);

    try {
      await updateRetentionRule(rule.resource_type, {
        retentionDays,
        archiveAfterDays,
        autoArchiveEnabled: Boolean(rule.auto_archive_enabled),
        allowPermanentDelete: Boolean(rule.allow_permanent_delete),
      });
      await loadArchiveCenter();
      setAlert({ type: "success", message: `Retention rule updated for ${rule.resource_type}.` });
    } catch (error) {
      setAlert({ type: "error", message: error?.response?.data?.message || "Retention update failed" });
    } finally {
      setSaving(false);
    }
  }

  function exportCurrentView() {
    const rows = activeTab === "notices" ? notices : complaints;
    const csvRows = [
      ["id", "title", "status", "category", "created_at", "archived_or_deleted_at", "owner"],
      ...rows.map((item) => [
        item.id,
        item.title,
        item.status,
        item.category || "",
        item.created_at,
        item.archived_at || item.deleted_at || "",
        item.resident_name || item.created_by_name || "",
      ]),
    ];

    downloadCsv(`${activeTab}-archive.csv`, csvRows);
  }

  function handlePrint() {
    window.print();
  }

  const selectedCount = selectedItems.length;

  async function handleBulkRestore() {
    if (!selectedItems.length) {
      return;
    }

    setSaving(true);
    setAlert(null);

    try {
      for (const entry of selectedItems) {
        const [type, id] = entry.split(":");
        if (type === "complaint") {
          await restoreComplaint(Number(id));
        } else {
          await restoreNotice(Number(id));
        }
      }
      await loadArchiveCenter();
      setAlert({ type: "success", message: `${selectedItems.length} records restored.` });
    } catch (error) {
      setAlert({ type: "error", message: error?.response?.data?.message || "Bulk restore failed" });
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkDelete() {
    if (!selectedItems.length) {
      return;
    }

    const reason = window.prompt("Enter delete reason for selected records:");
    if (!reason) {
      return;
    }

    setSaving(true);
    setAlert(null);

    try {
      for (const entry of selectedItems) {
        const [type, id] = entry.split(":");
        if (type === "complaint") {
          await deleteComplaint(Number(id), reason);
        } else {
          await deleteNotice(Number(id), reason);
        }
      }
      await loadArchiveCenter();
      setAlert({ type: "success", message: `${selectedItems.length} records deleted.` });
    } catch (error) {
      setAlert({ type: "error", message: error?.response?.data?.message || "Bulk delete failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="chairman-page superadmin-shell superadmin-archive">
      <div className="chairman-page sa-container">
        <section className="sa-hero">
          <div className="chairman-page flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="sa-eyebrow">Archive Center</p>
              <h1>Data retention and record lifecycle control</h1>
              <p>
                Manage archived complaints and notices, restore records when needed, enforce retention rules, and keep every action in the audit trail.
              </p>
            </div>
            <div className="chairman-page flex flex-wrap gap-3">
              <button type="button" onClick={() => loadArchiveCenter()} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-[var(--text-main)] hover:bg-white/15">
                Refresh
              </button>
              <button type="button" onClick={exportCurrentView} className="rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-2 text-sm font-semibold text-teal-100 hover:bg-teal-400/20">
                Export CSV
              </button>
              <button type="button" onClick={handlePrint} className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/20">
                Print / Save PDF
              </button>
            </div>
          </div>

          {alert ? (
            <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${alert.type === "success" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100" : "border-rose-400/30 bg-rose-400/10 text-rose-100"}`}>
              {alert.message}
            </div>
          ) : null}
        </section>

        <div className="chairman-page grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Archived complaints" value={stats?.complaints?.archived_count || 0} tone="teal" />
          <StatCard label="Deleted complaints" value={stats?.complaints?.deleted_count || 0} tone="rose" />
          <StatCard label="Archived notices" value={stats?.notices?.archived_count || 0} tone="cyan" />
          <StatCard label="Retention rules" value={stats?.retention?.total_rules || 0} tone="amber" />
        </div>

        <section className="sa-panel sa-filter-panel">
          <div className="chairman-page sa-panel__body">
          <div className="chairman-page grid gap-3 lg:grid-cols-7">
            <input className="sa-input lg:col-span-2" placeholder="Search title, resident, or email" value={filters.search} onChange={(e) => setFilters((current) => ({ ...current, search: e.target.value }))} />
            <select className="sa-input" value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}>
              <option value="all">All statuses</option>
              <option value="archived">Archived</option>
              <option value="deleted">Deleted</option>
            </select>
            <input className="sa-input" placeholder="Category" value={filters.category} onChange={(e) => setFilters((current) => ({ ...current, category: e.target.value }))} />
            <input className="sa-input" placeholder="Flat number" value={filters.flatNumber} onChange={(e) => setFilters((current) => ({ ...current, flatNumber: e.target.value }))} />
            <input className="sa-input" placeholder="Resident ID" value={filters.residentId} onChange={(e) => setFilters((current) => ({ ...current, residentId: e.target.value }))} />
            <input className="sa-input" type="date" value={filters.fromDate} onChange={(e) => setFilters((current) => ({ ...current, fromDate: e.target.value }))} />
            <input className="sa-input" type="date" value={filters.toDate} onChange={(e) => setFilters((current) => ({ ...current, toDate: e.target.value }))} />
          </div>
          <div className="chairman-page mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => loadArchiveCenter(filters)} className="sa-primary-btn">
              Apply Filters
            </button>
            <button type="button" onClick={() => setFilters(defaultFilters)} className="sa-secondary-btn">
              Reset
            </button>
            <button type="button" onClick={handleBulkRestore} disabled={!selectedCount || saving} className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 disabled:opacity-40">
              Restore selected ({selectedCount})
            </button>
            <button type="button" onClick={handleBulkDelete} disabled={!selectedCount || saving} className="rounded-full border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-100 disabled:opacity-40">
              Delete selected ({selectedCount})
            </button>
          </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr),minmax(0,1fr)]">
          <div className="chairman-page sa-panel">
            <div className="chairman-page sa-panel__body">
            <div className="chairman-page flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Archived records</p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--text-main)]">Complaints and notices</h2>
              </div>
              <div className="chairman-page flex rounded-full border border-white/10 bg-white/5 p-1 text-sm">
                <button type="button" onClick={() => setActiveTab("complaints")} className={`rounded-full px-4 py-2 ${activeTab === "complaints" ? "bg-teal-400 text-slate-950" : "text-slate-300"}`}>
                  Complaints
                </button>
                <button type="button" onClick={() => setActiveTab("notices")} className={`rounded-full px-4 py-2 ${activeTab === "notices" ? "bg-teal-400 text-slate-950" : "text-slate-300"}`}>
                  Notices
                </button>
              </div>
            </div>

            <div className="chairman-page sa-table-wrap mt-5">
              {loading ? (
                <div className="chairman-page p-6 text-sm text-slate-300">Loading archive records...</div>
              ) : visibleRows.length ? (
                <div className="chairman-page overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-3">Select</th>
                        <th className="px-4 py-3">Record</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3">Archived</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((item) => (
                        <ArchiveRow
                          key={`${activeTab}-${item.id}`}
                          item={item}
                          type={activeTab === "notices" ? "notice" : "complaint"}
                          selected={selectedItems.includes(`${activeTab === "notices" ? "notice" : "complaint"}:${item.id}`)}
                          onSelect={toggleSelected}
                          onRestore={handleRestore}
                          onDelete={handleDelete}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="chairman-page sa-empty-state"><p>No archived records found.</p><span>Try adjusting filters or switching between complaints and notices.</span></div>
              )}
            </div>
            </div>
          </div>

          <div className="chairman-page space-y-6">
            <section className="rounded-[30px] border border-white/10 theme-surface p-5 shadow-2xl backdrop-blur-xl">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Retention</p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--text-main)]">Policy controls</h2>
              </div>
              <div className="chairman-page mt-4 space-y-3">
                {retentionRules.map((rule) => (
                  <div key={rule.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="chairman-page flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--text-main)]">{rule.resource_type}</p>
                        <p className="text-xs text-slate-400">Auto archive: {rule.auto_archive_enabled ? "enabled" : "disabled"}</p>
                      </div>
                      <button type="button" onClick={() => handleRetentionSave(rule)} className="rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-white/10">
                        Edit
                      </button>
                    </div>
                    <div className="chairman-page mt-3 grid grid-cols-2 gap-3 text-sm text-slate-300">
                      <div>Retention: {rule.retention_days} days</div>
                      <div>Archive after: {rule.archive_after_days} days</div>
                      <div>Permanent delete: {rule.allow_permanent_delete ? "allowed" : "disabled"}</div>
                      <div>Updated by: {rule.updated_by_name || "system"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-white/10 theme-surface p-5 shadow-2xl backdrop-blur-xl">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Audit trail</p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--text-main)]">Recent archive actions</h2>
              </div>
              <div className="chairman-page mt-4 space-y-3 max-h-[520px] overflow-auto pr-1">
                {auditLogs.length ? (
                  auditLogs.map((log) => (
                    <div key={log.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                      <div className="chairman-page flex items-center justify-between gap-3">
                        <p className="font-semibold text-[var(--text-main)]">{log.action} {log.resource_type}</p>
                        <p className="text-xs text-slate-400">{formatDate(log.created_at)}</p>
                      </div>
                      <p className="mt-1">{log.details || "No details provided"}</p>
                      <p className="mt-2 text-xs text-slate-400">{log.user_name || log.user_email || "System"}</p>
                    </div>
                  ))
                ) : (
                  <div className="chairman-page rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">No recent archive activity.</div>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ArchiveCenterPage;
