import { useEffect, useMemo, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import {
  fetchResidentSocietyStructure,
  submitResidenceRequest,
} from "../services/societyStructureApi";
import { getStoredUser } from "../utils/session";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function CompleteResidenceProfilePage({ pendingProfile = null, onSubmitted }) {
  const user = getStoredUser();
  const [societyCode, setSocietyCode] = useState(user?.society_code || user?.societyCode || "");
  const [structure, setStructure] = useState(null);
  const [form, setForm] = useState({
    towerId: "",
    wingId: "",
    floorId: "",
    flatId: "",
    residentType: user?.resident_type || "owner",
    familyMembersCount: 0,
    vehicleNumber: "",
    vehicleType: "",
    moveInDate: "",
    ownerName: "",
    ownerContact: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  useEffect(() => {
    if (!societyCode || pendingProfile) return;
    let active = true;
    setLoading(true);
    fetchResidentSocietyStructure(societyCode)
      .then((response) => {
        if (active) setStructure(response.data || response);
      })
      .catch(() => {
        if (active) setAlert({ type: "error", message: "Could not load society structure for this code." });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [societyCode, pendingProfile]);

  const towers = asArray(structure?.towers);
  const wings = asArray(structure?.wings).filter((wing) => !form.towerId || Number(wing.tower_id) === Number(form.towerId));
  const floors = asArray(structure?.floors).filter((floor) => !form.wingId || Number(floor.wing_id) === Number(form.wingId));
  const flats = asArray(structure?.flats).filter((flat) => {
    if (form.floorId && Number(flat.floor_id) !== Number(form.floorId)) return false;
    return flat.occupancy_status === "vacant" || form.residentType === "tenant";
  });

  const selectedFlat = useMemo(
    () => flats.find((flat) => Number(flat.id) === Number(form.flatId)) || null,
    [flats, form.flatId]
  );

  function update(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "towerId" ? { wingId: "", floorId: "", flatId: "" } : {}),
      ...(key === "wingId" ? { floorId: "", flatId: "" } : {}),
      ...(key === "floorId" ? { flatId: "" } : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!societyCode || !form.towerId || !form.wingId || !form.floorId || !form.flatId) {
      setAlert({ type: "error", message: "Select society, tower, wing, floor, and flat to continue." });
      return;
    }
    setSaving(true);
    setAlert({ type: "", message: "" });
    try {
      await submitResidenceRequest({
        societyCode,
        towerId: form.towerId,
        wingId: form.wingId,
        floorId: form.floorId,
        flatId: form.flatId,
        residentType: form.residentType,
        familyMembersCount: form.familyMembersCount,
        moveInDate: form.moveInDate || null,
        ownerName: form.ownerName || null,
        ownerContact: form.ownerContact || null,
        vehicleDetails: form.vehicleNumber
          ? [{ vehicleNumber: form.vehicleNumber, vehicleType: form.vehicleType || "car" }]
          : [],
      });
      setAlert({ type: "success", message: "Residence request submitted for chairman approval." });
      if (onSubmitted) onSubmitted();
    } catch (error) {
      setAlert({ type: "error", message: error?.response?.data?.message || "Could not submit residence request." });
    } finally {
      setSaving(false);
    }
  }

  if (pendingProfile) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-xl dark:border-amber-500/30 dark:bg-amber-950/30">
          <h1 className="text-2xl font-black text-amber-950 dark:text-amber-100">Residence approval pending</h1>
          <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">
            Your residence profile has been submitted. You can access the dashboard after the chairman approves it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-600">Residence Profile</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Complete your flat details</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          Select your society structure and submit it for approval before opening the resident dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-xl dark:border-white/10 dark:bg-slate-950/80">
        <AlertMessage type={alert.type} message={alert.message} />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Society Code
            <input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-slate-900" value={societyCode} onChange={(event) => setSocietyCode(event.target.value.toUpperCase())} />
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Resident Type
            <select className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-slate-900" value={form.residentType} onChange={(event) => update("residentType", event.target.value)}>
              <option value="owner">Owner</option>
              <option value="tenant">Tenant</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Tower / Block
            <select className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-slate-900" value={form.towerId} onChange={(event) => update("towerId", event.target.value)} disabled={loading}>
              <option value="">Select tower</option>
              {towers.map((tower) => <option key={tower.id} value={tower.id}>{tower.tower_name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Wing
            <select className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-slate-900" value={form.wingId} onChange={(event) => update("wingId", event.target.value)}>
              <option value="">Select wing</option>
              {wings.map((wing) => <option key={wing.id} value={wing.id}>{wing.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Floor
            <select className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-slate-900" value={form.floorId} onChange={(event) => update("floorId", event.target.value)}>
              <option value="">Select floor</option>
              {floors.map((floor) => <option key={floor.id} value={floor.id}>{floor.floor_label || floor.floor_number}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Flat / House
            <select className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-slate-900" value={form.flatId} onChange={(event) => update("flatId", event.target.value)}>
              <option value="">Select flat</option>
              {flats.map((flat) => <option key={flat.id} value={flat.id}>{flat.house_number || flat.flat_number} ({flat.occupancy_status})</option>)}
            </select>
          </label>
          {form.residentType === "tenant" && selectedFlat?.occupancy_status !== "vacant" ? (
            <>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Owner Name<input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-slate-900" value={form.ownerName} onChange={(event) => update("ownerName", event.target.value)} /></label>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Owner Contact<input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-slate-900" value={form.ownerContact} onChange={(event) => update("ownerContact", event.target.value)} /></label>
            </>
          ) : null}
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Family Members<input type="number" min="0" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-slate-900" value={form.familyMembersCount} onChange={(event) => update("familyMembersCount", event.target.value)} /></label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Move-in Date<input type="date" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-slate-900" value={form.moveInDate} onChange={(event) => update("moveInDate", event.target.value)} /></label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Vehicle Number<input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-slate-900" value={form.vehicleNumber} onChange={(event) => update("vehicleNumber", event.target.value.toUpperCase())} /></label>
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Vehicle Type<input className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-slate-900" value={form.vehicleType} onChange={(event) => update("vehicleType", event.target.value)} /></label>
        </div>
        <button type="submit" className="mt-5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-3 text-sm font-black text-white shadow-lg disabled:opacity-60" disabled={saving}>
          {saving ? "Submitting..." : "Submit for Approval"}
        </button>
      </form>
    </div>
  );
}
