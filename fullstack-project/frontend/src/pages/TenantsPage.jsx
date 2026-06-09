import { useEffect, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage, api } from "../services/authApi";

function TenantsPage() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });

  async function loadTenants() {
    try {
      setLoading(true);
      const res = await api.get("/users", { params: { role: "resident" } });
      const list = (res.data?.data || []).filter((u) => u.resident_type === "tenant");
      setTenants(list);
    } catch (err) {
      setAlert({ type: "error", message: getApiMessage(err, "Could not load tenants") });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTenants(); }, []);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", phone: "", password: "", flatId: "" });

  async function handleCreateTenant(e) {
    e.preventDefault();
    setAlert({ type: "", message: "" });
    try {
      await api.post('/users', { name: createForm.name, email: createForm.email, password: createForm.password || 'changeme123', role: 'resident', residentType: 'tenant', flatId: createForm.flatId || null });
      setShowCreate(false);
      setCreateForm({ name: '', email: '', phone: '', password: '', flatId: '' });
      await loadTenants();
      setAlert({ type: 'success', message: 'Tenant created' });
    } catch (err) {
      setAlert({ type: 'error', message: getApiMessage(err, 'Could not create tenant') });
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold">Tenants</h2>
      <AlertMessage type={alert.type} message={alert.message} />

      <div className="rounded-2xl border bg-white p-4">
        <div className="flex justify-end mb-3">
          <button onClick={() => setShowCreate(true)} className="rounded-md bg-blue-600 px-3 py-2 text-[var(--text-main)]">Add Tenant</button>
        </div>
        {loading ? (
          <div className="p-6">Loading tenants...</div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Flat</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="px-3 py-2">{t.name}</td>
                  <td className="px-3 py-2">{t.email}</td>
                  <td className="px-3 py-2">{t.phone || "-"}</td>
                  <td className="px-3 py-2">{t.flat_number || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center theme-surface">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h4 className="text-lg font-semibold">Create Tenant</h4>
            <form className="mt-4 space-y-3" onSubmit={handleCreateTenant}>
              <input className="w-full rounded-md border px-3 py-2" placeholder="Name" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
              <input className="w-full rounded-md border px-3 py-2" placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
              <input className="w-full rounded-md border px-3 py-2" placeholder="Phone" value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} />
              <input className="w-full rounded-md border px-3 py-2" placeholder="Flat ID (optional)" value={createForm.flatId} onChange={(e) => setCreateForm((p) => ({ ...p, flatId: e.target.value }))} />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-2">Cancel</button>
                <button type="submit" className="px-3 py-2 rounded-md bg-blue-600 text-[var(--text-main)]">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TenantsPage;
