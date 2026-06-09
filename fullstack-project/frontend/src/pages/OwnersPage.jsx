import { useEffect, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import { fetchOwners, fetchOwnerProperties, assignOwnerProperty, removeOwnerProperty } from "../services/ownerApi";
import { getApiMessage, api } from "../services/authApi";

function OwnersPage() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [properties, setProperties] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ flatId: "", livingStartDate: "" });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", phone: "", password: "" });

  async function loadOwners() {
    try {
      setLoading(true);
      const res = await fetchOwners();
      setOwners(res.data || []);
    } catch (err) {
      setAlert({ type: "error", message: getApiMessage(err, "Could not load owners") });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOwners();
  }, []);

  async function openProperties(owner) {
    setSelectedOwner(owner);
    try {
      const res = await fetchOwnerProperties(owner.id);
      setProperties(res.data || []);
    } catch (err) {
      setAlert({ type: "error", message: getApiMessage(err, "Could not load properties") });
    }
  }

  async function handleAssign(e) {
    e.preventDefault();
    setAlert({ type: "", message: "" });
    try {
      await assignOwnerProperty(selectedOwner.id, { flatId: Number(assignForm.flatId), livingStartDate: assignForm.livingStartDate || null });
      setShowAssignModal(false);
      setAssignForm({ flatId: "", livingStartDate: "" });
      await openProperties(selectedOwner);
      await loadOwners();
      setAlert({ type: "success", message: "Property assigned" });
    } catch (err) {
      setAlert({ type: "error", message: getApiMessage(err, "Could not assign property") });
    }
  }

  async function handleRemoveProperty(propertyId) {
    setAlert({ type: "", message: "" });
    try {
      await removeOwnerProperty(selectedOwner.id, propertyId);
      await openProperties(selectedOwner);
      await loadOwners();
      setAlert({ type: "success", message: "Property removed" });
    } catch (err) {
      setAlert({ type: "error", message: getApiMessage(err, "Could not remove property") });
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Owners</h2>
      <AlertMessage type={alert.type} message={alert.message} />

      <div className="flex justify-end">
        <button onClick={() => setShowCreateModal(true)} className="rounded-md bg-blue-600 px-3 py-2 text-[var(--text-main)]">Add Owner</button>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        {loading ? (
          <div className="p-6">Loading owners...</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Flats</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {owners.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-3 py-2">{o.name}</td>
                  <td className="px-3 py-2">{o.email}</td>
                  <td className="px-3 py-2">{o.phone || "-"}</td>
                  <td className="px-3 py-2">{o.flat_number || "-"}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => openProperties(o)} className="mr-2 text-sm text-sky-600">Properties</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Properties panel */}
      {selectedOwner && (
        <div className="rounded-2xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Properties for {selectedOwner.name}</h3>
            <div>
              <button onClick={() => setShowAssignModal(true)} className="rounded-md bg-emerald-600 px-3 py-2 text-[var(--text-main)]">Assign Flat</button>
            </div>
          </div>

          <div className="mt-3">
            {properties.length ? (
              <ul className="space-y-2">
                {properties.map((p) => (
                  <li key={p.owner_property_id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <div className="font-semibold">{p.building_name} - {p.flat_number}</div>
                      <div className="text-sm text-slate-500">Wing {p.wing} | Floor {p.floor}</div>
                    </div>
                    <div>
                      <button onClick={() => handleRemoveProperty(p.owner_property_id)} className="text-rose-600">Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-sm text-slate-500">No properties assigned.</div>
            )}
          </div>
        </div>
      )}

      {/* Assign modal */}
      {showAssignModal && selectedOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center theme-surface">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h4 className="text-lg font-semibold">Assign flat to {selectedOwner.name}</h4>
            <form className="mt-4 space-y-3" onSubmit={handleAssign}>
              <input type="number" placeholder="Flat ID" value={assignForm.flatId} onChange={(e) => setAssignForm((p) => ({ ...p, flatId: e.target.value }))} className="w-full rounded-md border px-3 py-2" />
              <input type="date" placeholder="Living start date" value={assignForm.livingStartDate} onChange={(e) => setAssignForm((p) => ({ ...p, livingStartDate: e.target.value }))} className="w-full rounded-md border px-3 py-2" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-3 py-2">Cancel</button>
                <button type="submit" className="px-3 py-2 rounded-md bg-emerald-600 text-[var(--text-main)]">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Owner modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center theme-surface">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h4 className="text-lg font-semibold">Create Owner</h4>
            <form className="mt-4 space-y-3" onSubmit={async (e) => {
              e.preventDefault();
              setAlert({ type: "", message: "" });
              try {
                await api.post('/users', { name: createForm.name, email: createForm.email, password: createForm.password || 'changeme123', role: 'resident', residentType: 'owner' });
                setShowCreateModal(false);
                setCreateForm({ name: '', email: '', phone: '', password: '' });
                await loadOwners();
                setAlert({ type: 'success', message: 'Owner created' });
              } catch (err) {
                setAlert({ type: 'error', message: getApiMessage(err, 'Could not create owner') });
              }
            }}>
              <input className="w-full rounded-md border px-3 py-2" placeholder="Name" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
              <input className="w-full rounded-md border px-3 py-2" placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
              <input className="w-full rounded-md border px-3 py-2" placeholder="Phone" value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-3 py-2">Cancel</button>
                <button type="submit" className="px-3 py-2 rounded-md bg-blue-600 text-[var(--text-main)]">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnersPage;
