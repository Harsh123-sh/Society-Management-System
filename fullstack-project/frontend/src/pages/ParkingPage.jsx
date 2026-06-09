import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage } from "../services/authApi";
import { createParkingSlot, getParkingSlots, getParkingStats } from "../services/parkingApi";

function ParkingPage() {
  const [slots, setSlots] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [form, setForm] = useState({ slot_number: "", wing: "", floor: 1, type: "2wheeler", block: "" });

  async function loadParkingData() {
    try {
      setLoading(true);
      const [slotsRes, statsRes] = await Promise.all([getParkingSlots(), getParkingStats()]);
      setSlots(slotsRes?.data || []);
      setStatsData(statsRes?.data || null);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not load parking data") });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadParkingData();
  }, []);

  const stats = useMemo(() => {
    if (statsData) {
      return {
        total: Number(statsData.total_slots || 0),
        assigned: Number(statsData.assigned_slots || 0),
        visitor: slots.filter((slot) => String(slot.status || "").toLowerCase() === "visitor").length,
        vacant: Number(statsData.available_slots || 0),
      };
    }

    return {
      total: slots.length,
      assigned: slots.filter((slot) => String(slot.status || "").toLowerCase() === "assigned").length,
      visitor: slots.filter((slot) => String(slot.status || "").toLowerCase() === "visitor").length,
      vacant: slots.filter((slot) => String(slot.status || "").toLowerCase() === "available").length,
    };
  }, [slots, statsData]);

  async function handleAddSlot(event) {
    event.preventDefault();
    if (!form.slot_number.trim() || !form.wing.trim()) return;

    try {
      setSubmitting(true);
      await createParkingSlot({
        slot_number: form.slot_number.trim().toUpperCase(),
        wing: form.wing.trim().toUpperCase(),
        floor: Number(form.floor) || 1,
        type: form.type,
        block: form.block.trim() || null,
      });
      setAlert({ type: "success", message: "Parking slot created successfully" });
      setForm({ slot_number: "", wing: "", floor: 1, type: "2wheeler", block: "" });
      await loadParkingData();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not create parking slot") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Parking Management</h2>
        <p className="text-sm text-slate-600">
          Assign slots, track vehicles, and maintain visitor parking visibility.
        </p>
      </div>

      <AlertMessage type={alert.type} message={alert.message} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total Slots</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Assigned</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.assigned}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Visitor Parking</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.visitor}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Vacant</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.vacant}</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Add Parking Slot</h3>
        <form className="mt-4 grid gap-3 md:grid-cols-5" onSubmit={handleAddSlot}>
          <input
            type="text"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
            placeholder="Slot number (A-12)"
            value={form.slot_number}
            onChange={(event) => setForm((prev) => ({ ...prev, slot_number: event.target.value }))}
          />
          <input
            type="text"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
            placeholder="Wing"
            value={form.wing}
            onChange={(event) => setForm((prev) => ({ ...prev, wing: event.target.value }))}
          />
          <input
            type="number"
            min="1"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
            placeholder="Floor"
            value={form.floor}
            onChange={(event) => setForm((prev) => ({ ...prev, floor: event.target.value }))}
          />
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
            value={form.type}
            onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
          >
            <option value="2wheeler">2 Wheeler</option>
            <option value="4wheeler">4 Wheeler</option>
          </select>
          <input
            type="text"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
            placeholder="Block (optional)"
            value={form.block}
            onChange={(event) => setForm((prev) => ({ ...prev, block: event.target.value }))}
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg theme-surface px-4 py-2 text-sm font-medium text-[var(--text-main)] hover:theme-surface disabled:cursor-not-allowed disabled:opacity-60 md:col-span-5"
          >
            {submitting ? "Saving..." : "Save Slot"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Slot Register</h3>

        {loading ? (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Loading parking slots...</div>
        ) : slots.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-3 py-2">Slot</th>
                  <th className="px-3 py-2">Assigned To</th>
                  <th className="px-3 py-2">Vehicle</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900">{slot.slot_number}</td>
                    <td className="px-3 py-2 text-slate-700">{slot.owner_name || "Unassigned"}</td>
                    <td className="px-3 py-2 text-slate-700">{slot.vehicle_number || "-"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          slot.status === "assigned"
                            ? "bg-blue-100 text-blue-700"
                            : slot.status === "visitor"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {slot.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            No parking slots assigned yet.
          </div>
        )}
      </section>
    </div>
  );
}

export default ParkingPage;
