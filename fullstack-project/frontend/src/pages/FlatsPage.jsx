import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage, getCurrentUserFromToken } from "../services/authApi";
import {
  archiveFlat,
  assignResident,
  approveFlat,
  deleteFlat,
  fetchFlats,
  fetchResidents,
  updateFlat,
} from "../services/flatApi";
import { bulkArchiveFlats, bulkDeleteFlats, createTower, fetchTowers, generateFlatsForTower } from "../services/towerApi";
import { getParkingStats } from "../services/parkingApi";

const OCCUPANCY_LABELS = {
  vacant: "Vacant",
  owner_occupied: "Owner Occupied",
  tenant_occupied: "Tenant Occupied",
  reserved: "Reserved",
  under_maintenance: "Under Maintenance",
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function FlatsPage() {
  const currentUser = useMemo(() => getCurrentUserFromToken(), []);
  const role = currentUser?.role || "resident";
  const canManageFlats = role === "admin" || role === "secretary";

  const [towers, setTowers] = useState([]);
  const [flats, setFlats] = useState([]);
  const [residents, setResidents] = useState([]);
  const [parkingStats, setParkingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [towerFilter, setTowerFilter] = useState("ALL");
  const [occupancyFilter, setOccupancyFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("grid");
  const [assignForm, setAssignForm] = useState({ flatId: "", residentId: "", moveInDate: "" });
  const [towerForm, setTowerForm] = useState({
    towerName: "",
    totalFloors: 10,
    flatsPerFloor: 4,
    flatNumberFormat: "floor_sequence",
  });

  async function loadData() {
    try {
      setLoading(true);
      const [towersResponse, flatsResponse, residentsResponse, parkingResponse] = await Promise.all([
        fetchTowers(),
        fetchFlats({ search: searchTerm || undefined }),
        fetchResidents(),
        getParkingStats(),
      ]);
      setTowers(towersResponse.data || []);
      setFlats(flatsResponse.data || []);
      setResidents((residentsResponse.data || []).filter((user) => normalize(user.role) === "resident" && normalize(user.status) === "active"));
      setParkingStats(parkingResponse.data || null);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not load flats data") });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredFlats = useMemo(() => {
    return flats.filter((flat) => {
      const towerName = String(flat.tower_name || flat.building_name || "").toLowerCase();
      const towerCode = String(flat.tower_code || flat.wing || "").toLowerCase();
      const occupancy = String(flat.occupancy_status || flat.status || "").toLowerCase();
      const query = normalize(searchTerm);
      const matchesSearch = !query || [flat.flat_number, towerName, towerCode, flat.resident_name, flat.parking_slot_number]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
      const matchesTower = towerFilter === "ALL" || String(flat.tower_id || flat.wing || "") === towerFilter || towerName.includes(towerFilter.toLowerCase());
      const matchesOccupancy = occupancyFilter === "ALL" || occupancy === occupancyFilter;
      return matchesSearch && matchesTower && matchesOccupancy;
    });
  }, [flats, searchTerm, towerFilter, occupancyFilter]);

  const towerOptions = useMemo(() => {
    return ["ALL", ...towers.map((tower) => String(tower.id))];
  }, [towers]);

  const stats = useMemo(() => {
    const totalFlats = flats.length;
    const occupiedFlats = flats.filter((flat) => normalize(flat.occupancy_status) !== "vacant").length;
    const vacantFlats = flats.filter((flat) => normalize(flat.occupancy_status) === "vacant").length;
    const ownerOccupied = flats.filter((flat) => normalize(flat.occupancy_status) === "owner_occupied").length;
    const tenantOccupied = flats.filter((flat) => normalize(flat.occupancy_status) === "tenant_occupied").length;
    const availableParking = Number(parkingStats?.available_slots || parkingStats?.available || 0);
    const assignedParking = Number(parkingStats?.assigned_slots || 0);

    return {
      totalFlats,
      occupiedFlats,
      vacantFlats,
      ownerOccupied,
      tenantOccupied,
      availableParking,
      assignedParking,
    };
  }, [flats, parkingStats]);

  async function handleCreateTower(event) {
    event.preventDefault();
    try {
      await createTower(towerForm);
      setAlert({ type: "success", message: "Tower created" });
      setTowerForm({ towerName: "", totalFloors: 10, flatsPerFloor: 4, flatNumberFormat: "floor_sequence" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not create tower") });
    }
  }

  async function handleGenerateFlats(towerId) {
    try {
      await generateFlatsForTower(towerId, {});
      setAlert({ type: "success", message: "Flats generated successfully" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not generate flats") });
    }
  }

  async function handleBulkArchive() {
    if (!selectedIds.length) return;
    try {
      await bulkArchiveFlats(selectedIds);
      setSelectedIds([]);
      setAlert({ type: "success", message: "Selected flats archived" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not archive flats") });
    }
  }

  async function handleBulkDelete() {
    if (!selectedIds.length) return;
    try {
      await bulkDeleteFlats(selectedIds);
      setSelectedIds([]);
      setAlert({ type: "success", message: "Selected flats deleted" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not delete flats") });
    }
  }

  async function handleEditFlat(flat) {
    const nextFlatType = window.prompt("Update flat type", flat.flat_type || "");
    if (nextFlatType === null) return;
    const nextOccupancy = window.prompt(
      `Update occupancy status (${Object.keys(OCCUPANCY_LABELS).join(", ")})`,
      flat.occupancy_status || "vacant"
    );
    if (nextOccupancy === null) return;

    try {
      await updateFlat(flat.id, {
        flatType: nextFlatType.trim() || null,
        occupancyStatus: nextOccupancy.trim() || null,
      });
      setAlert({ type: "success", message: "Flat updated" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not update flat") });
    }
  }

  async function handleArchiveFlat(flatId) {
    try {
      await archiveFlat(flatId);
      setAlert({ type: "success", message: "Flat archived" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not archive flat") });
    }
  }

  async function handleDeleteFlat(flatId) {
    try {
      await deleteFlat(flatId);
      setAlert({ type: "success", message: "Flat deleted" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not delete flat") });
    }
  }

  async function handleAssignResident(event) {
    event.preventDefault();
    try {
      await assignResident(assignForm.flatId, {
        residentId: Number(assignForm.residentId),
        moveInDate: assignForm.moveInDate || undefined,
      });
      setAssignForm({ flatId: "", residentId: "", moveInDate: "" });
      setAlert({ type: "success", message: "Resident assigned" });
      await loadData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not assign resident") });
    }
  }

  function exportCsv() {
    const header = ["Flat Number", "Tower", "Floor", "Flat Type", "Status", "Owner/Tenant", "Parking"].join(",");
    const rows = filteredFlats.map((flat) => [
      flat.flat_number,
      flat.tower_name || flat.building_name || flat.wing || "",
      flat.floor || "",
      flat.flat_type || "",
      flat.occupancy_status || flat.status || "",
      flat.resident_name || "",
      flat.parking_slot_number || "",
    ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "flats-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) return;

    const [headerLine, ...dataLines] = lines;
    const headers = headerLine.split(",").map((item) => item.trim().toLowerCase());

    for (const line of dataLines) {
      const values = line.split(",").map((item) => item.replace(/^"|"$/g, ""));
      const row = Object.fromEntries(headers.map((key, index) => [key, values[index] || ""]));
      if (!row.tower_name) continue;
      try {
        const tower = await createTower({
          towerName: row.tower_name,
          totalFloors: Number(row.total_floors || 1),
          flatsPerFloor: Number(row.flats_per_floor || 1),
          flatNumberFormat: row.flat_number_format || "floor_sequence",
        });
        if (tower?.data?.id) {
          await generateFlatsForTower(tower.data.id, { flatType: row.flat_type || null });
        }
      } catch (_error) {
        // skip invalid rows
      }
    }

    await loadData();
    setAlert({ type: "success", message: "Import complete" });
    event.target.value = "";
  }

  return (
    <div className="chairman-page space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[var(--page-bg)] via-[var(--surface-soft)] to-teal-800 p-6 text-[var(--text-main)] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)] sm:p-8">
        <div className="chairman-page flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">
          <span>Flat Operations</span>
          <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] tracking-[0.18em]">Tower-first management</span>
        </div>
        <div className="chairman-page mt-5 grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Enterprise flat management</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
              Create towers, auto-generate hundreds of flats, assign residents, and manage occupancy without manual repetitive entry.
            </p>
          </div>
          <div className="chairman-page grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Total Flats", stats.totalFlats],
              ["Occupied", stats.occupiedFlats],
              ["Vacant", stats.vacantFlats],
              ["Owner Occupied", stats.ownerOccupied],
              ["Tenant Occupied", stats.tenantOccupied],
              ["Assigned Parking", stats.assignedParking],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-main)]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AlertMessage type={alert.type} message={alert.message} />

      {canManageFlats && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="chairman-page flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Create tower</h3>
              <p className="text-sm text-slate-500">Define tower geometry once. Flats are generated automatically.</p>
            </div>
            <div className="chairman-page flex flex-wrap gap-2">
              <button onClick={exportCsv} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Export CSV</button>
              <label className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 cursor-pointer">
                Import CSV
                <input type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden" onChange={handleImportFile} />
              </label>
            </div>
          </div>

          <form className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5" onSubmit={handleCreateTower}>
            <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" placeholder="Tower name" value={towerForm.towerName} onChange={(e) => setTowerForm((prev) => ({ ...prev, towerName: e.target.value }))} />
            <input type="number" min="1" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" placeholder="Total floors" value={towerForm.totalFloors} onChange={(e) => setTowerForm((prev) => ({ ...prev, totalFloors: e.target.value }))} />
            <input type="number" min="1" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" placeholder="Flats per floor" value={towerForm.flatsPerFloor} onChange={(e) => setTowerForm((prev) => ({ ...prev, flatsPerFloor: e.target.value }))} />
            <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" value={towerForm.flatNumberFormat} onChange={(e) => setTowerForm((prev) => ({ ...prev, flatNumberFormat: e.target.value }))}>
              <option value="floor_sequence">101, 102...</option>
              <option value="floor_pad_sequence">0101, 0102...</option>
              <option value="custom">Tower+Floor+Seq</option>
            </select>
            <button type="submit" className="rounded-2xl bg-teal-600 px-4 py-3 text-sm font-semibold text-[var(--text-main)] hover:bg-teal-700">Save Tower</button>
          </form>
        </section>
      )}

      {canManageFlats && (
        <section className="grid gap-4 xl:grid-cols-4">
          {towers.map((tower) => (
            <article key={tower.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="chairman-page flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-slate-950">{tower.tower_name}</h4>
                  <p className="text-sm text-slate-500">Code {tower.tower_code}</p>
                </div>
                <button onClick={() => handleGenerateFlats(tower.id)} className="rounded-2xl theme-page px-3 py-2 text-xs font-semibold text-[var(--text-main)]">Generate Flats</button>
              </div>
              <div className="chairman-page mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="chairman-page rounded-2xl bg-slate-50 p-3"><p className="text-slate-500">Floors</p><p className="text-lg font-semibold">{tower.total_floors}</p></div>
                <div className="chairman-page rounded-2xl bg-slate-50 p-3"><p className="text-slate-500">Per Floor</p><p className="text-lg font-semibold">{tower.flats_per_floor}</p></div>
                <div className="chairman-page rounded-2xl bg-slate-50 p-3"><p className="text-slate-500">Flats</p><p className="text-lg font-semibold">{tower.total_flats || 0}</p></div>
                <div className="chairman-page rounded-2xl bg-slate-50 p-3"><p className="text-slate-500">Vacant</p><p className="text-lg font-semibold">{tower.vacant_flats || 0}</p></div>
              </div>
            </article>
          ))}
          {!towers.length && (
            <div className="chairman-page rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 xl:col-span-4">No towers configured yet.</div>
          )}
        </section>
      )}

      {canManageFlats && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="chairman-page flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Bulk actions</h3>
              <p className="text-sm text-slate-500">Select multiple flats to archive or delete.</p>
            </div>
            <div className="chairman-page flex flex-wrap gap-2">
              <button disabled={!selectedIds.length} onClick={handleBulkArchive} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">Bulk Archive</button>
              <button disabled={!selectedIds.length} onClick={handleBulkDelete} className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-[var(--text-main)] disabled:opacity-50">Bulk Delete</button>
            </div>
          </div>

          <div className="chairman-page mt-4 grid gap-3 md:grid-cols-3">
            <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" placeholder="Quick search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" value={towerFilter} onChange={(e) => setTowerFilter(e.target.value)}>
              {towerOptions.map((option) => (<option key={option} value={option}>{option === "ALL" ? "All Towers" : towers.find((t) => String(t.id) === option)?.tower_name || option}</option>))}
            </select>
            <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100" value={occupancyFilter} onChange={(e) => setOccupancyFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              {Object.keys(OCCUPANCY_LABELS).map((status) => <option key={status} value={status}>{OCCUPANCY_LABELS[status]}</option>)}
            </select>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="chairman-page flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Flat register</h3>
            <p className="text-sm text-slate-500">Tower, floor, type, status, owner, tenant, parking, and actions.</p>
          </div>
          <div className="chairman-page flex gap-2 text-sm">
            <button type="button" onClick={() => setActiveTab("grid")} className={`rounded-2xl px-4 py-2 font-semibold ${activeTab === "grid" ? "theme-page text-[var(--text-main)]" : "border border-slate-200 text-slate-700"}`}>Grid</button>
            <button type="button" onClick={() => setActiveTab("table")} className={`rounded-2xl px-4 py-2 font-semibold ${activeTab === "table" ? "theme-page text-[var(--text-main)]" : "border border-slate-200 text-slate-700"}`}>Table</button>
          </div>
        </div>

        {loading ? (
          <div className="chairman-page mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Loading flats...</div>
        ) : !filteredFlats.length ? (
          <div className="chairman-page mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">No flats found for the selected filters.</div>
        ) : activeTab === "grid" ? (
          <div className="chairman-page mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredFlats.map((flat) => (
              <article key={flat.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="chairman-page flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{flat.tower_name || flat.building_name || "Tower"}</p>
                    <h4 className="mt-1 text-xl font-bold text-slate-950">{flat.flat_number}</h4>
                    <p className="text-sm text-slate-500">Floor {flat.floor || "-"}</p>
                  </div>
                  <input type="checkbox" checked={selectedIds.includes(flat.id)} onChange={(e) => setSelectedIds((prev) => e.target.checked ? [...prev, flat.id] : prev.filter((id) => id !== flat.id))} />
                </div>
                <div className="chairman-page mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-white px-3 py-1 text-slate-700">{OCCUPANCY_LABELS[flat.occupancy_status] || flat.occupancy_status || flat.status}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-slate-700">{flat.flat_type || "Unspecified"}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-slate-700">Parking {flat.parking_slot_number || "-"}</span>
                </div>
                <div className="chairman-page mt-4 space-y-2 text-sm text-slate-700">
                  <p><span className="font-semibold">Owner/Tenant:</span> {flat.resident_name || "Unassigned"}</p>
                  <p><span className="font-semibold">Resident Status:</span> {flat.occupancy_resident_type || flat.occupancy_status || "vacant"}</p>
                  <p><span className="font-semibold">Move In:</span> {flat.move_in_date || "-"}</p>
                </div>
                <div className="chairman-page mt-4 flex flex-wrap gap-2">
                  <button onClick={() => setSelectedFlat(flat)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">View Details</button>
                  <button onClick={() => handleEditFlat(flat)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">Edit</button>
                  <button onClick={() => handleArchiveFlat(flat.id)} className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">Archive</button>
                  <button onClick={() => handleDeleteFlat(flat.id)} className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">Delete</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="chairman-page mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-3 py-3"></th>
                  <th className="px-3 py-3">Flat Number</th>
                  <th className="px-3 py-3">Tower</th>
                  <th className="px-3 py-3">Floor</th>
                  <th className="px-3 py-3">Flat Type</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Owner/Tenant</th>
                  <th className="px-3 py-3">Parking</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlats.map((flat) => (
                  <tr key={flat.id} className="border-b border-slate-100">
                    <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.includes(flat.id)} onChange={(e) => setSelectedIds((prev) => e.target.checked ? [...prev, flat.id] : prev.filter((id) => id !== flat.id))} /></td>
                    <td className="px-3 py-3 font-medium text-slate-950">{flat.flat_number}</td>
                    <td className="px-3 py-3 text-slate-700">{flat.tower_name || flat.building_name || flat.wing || "-"}</td>
                    <td className="px-3 py-3 text-slate-700">{flat.floor || "-"}</td>
                    <td className="px-3 py-3 text-slate-700">{flat.flat_type || "-"}</td>
                    <td className="px-3 py-3 text-slate-700">{OCCUPANCY_LABELS[flat.occupancy_status] || flat.status}</td>
                    <td className="px-3 py-3 text-slate-700">{flat.resident_name || "Unassigned"}</td>
                    <td className="px-3 py-3 text-slate-700">{flat.parking_slot_number || "-"}</td>
                    <td className="px-3 py-3">
                      <div className="chairman-page flex flex-wrap gap-2">
                        <button onClick={() => setSelectedFlat(flat)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold">View</button>
                        <button onClick={() => handleEditFlat(flat)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold">Edit</button>
                        <button onClick={() => handleArchiveFlat(flat.id)} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">Archive</button>
                        <button onClick={() => handleDeleteFlat(flat.id)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {canManageFlats && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Resident assignment</h3>
            <p className="text-sm text-slate-500">Move an approved resident into a flat when needed.</p>
          </div>
          <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={handleAssignResident}>
            <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" value={assignForm.flatId} onChange={(e) => setAssignForm((prev) => ({ ...prev, flatId: e.target.value }))}>
              <option value="">Select Flat</option>
              {flats.map((flat) => <option key={flat.id} value={flat.id}>{flat.flat_number} - {flat.tower_name || flat.building_name || flat.wing || "Tower"}</option>)}
            </select>
            <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" value={assignForm.residentId} onChange={(e) => setAssignForm((prev) => ({ ...prev, residentId: e.target.value }))}>
              <option value="">Select Resident</option>
              {residents.map((resident) => <option key={resident.id} value={resident.id}>{resident.name}</option>)}
            </select>
            <input type="date" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" value={assignForm.moveInDate} onChange={(e) => setAssignForm((prev) => ({ ...prev, moveInDate: e.target.value }))} />
            <button type="submit" className="rounded-2xl theme-page px-4 py-3 text-sm font-semibold text-[var(--text-main)] md:col-span-3">Assign Resident</button>
          </form>
        </section>
      )}

      {selectedFlat && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="chairman-page flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Flat details</h3>
              <p className="text-sm text-slate-500">{selectedFlat.flat_number} in {selectedFlat.tower_name || selectedFlat.building_name || selectedFlat.wing || "Tower"}</p>
            </div>
            <button onClick={() => setSelectedFlat(null)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Close</button>
          </div>
          <div className="chairman-page mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
            <div className="chairman-page rounded-2xl bg-slate-50 p-4"><p className="text-slate-500">Status</p><p className="mt-1 font-semibold">{OCCUPANCY_LABELS[selectedFlat.occupancy_status] || selectedFlat.status}</p></div>
            <div className="chairman-page rounded-2xl bg-slate-50 p-4"><p className="text-slate-500">Resident</p><p className="mt-1 font-semibold">{selectedFlat.resident_name || "Unassigned"}</p></div>
            <div className="chairman-page rounded-2xl bg-slate-50 p-4"><p className="text-slate-500">Parking</p><p className="mt-1 font-semibold">{selectedFlat.parking_slot_number || "Not linked"}</p></div>
            <div className="chairman-page rounded-2xl bg-slate-50 p-4"><p className="text-slate-500">Move In</p><p className="mt-1 font-semibold">{selectedFlat.move_in_date || "-"}</p></div>
          </div>
        </section>
      )}
    </div>
  );
}

export default FlatsPage;
