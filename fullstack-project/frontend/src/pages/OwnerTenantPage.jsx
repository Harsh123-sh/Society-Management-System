import { useMemo, useState } from "react";
import { getStoredUser } from "../utils/session";

const tenantSeed = [
  { id: 1, name: "Rahul Verma", phone: "9876543210", moveIn: "2025-02-12", status: "Active" },
  { id: 2, name: "Priya Shah", phone: "9988776655", moveIn: "2025-10-05", status: "Moved Out" },
];

function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

function OwnerTenantPage() {
  const user = useMemo(() => getStoredUser(), []);
  const [tenants, setTenants] = useState(tenantSeed);
  const [form, setForm] = useState({ name: "", phone: "", agreement: "", moveIn: "" });

  const activeTenants = tenants.filter((tenant) => tenant.status === "Active").length;

  function handleSubmit(event) {
    event.preventDefault();
    if (!form.name || !form.phone) return;
    setTenants((prev) => [
      { id: Date.now(), name: form.name, phone: form.phone, moveIn: form.moveIn || "-", status: "Active" },
      ...prev,
    ]);
    setForm({ name: "", phone: "", agreement: "", moveIn: "" });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-700 p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold">Tenant Management</h2>
        <p className="mt-1 text-sm text-slate-200">Add, edit, and track tenants, agreements, and move-in / move-out history.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Your Flat" value={user?.resident_type === "owner" ? "Owner Unit" : "Property"} helper="Wing, floor, and flat details are available in My Property" />
        <StatCard label="Active Tenants" value={activeTenants} helper="Currently linked tenant records" />
        <StatCard label="Agreement Status" value="Ready" helper="Rental agreement upload and generation supported" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Add / Edit Tenant</h3>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Tenant name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Phone number" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Move-in date" type="date" value={form.moveIn} onChange={(event) => setForm((prev) => ({ ...prev, moveIn: event.target.value }))} />
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Upload / agreement reference" value={form.agreement} onChange={(event) => setForm((prev) => ({ ...prev, agreement: event.target.value }))} />
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Save Tenant</button>
          </form>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Tenant History</h3>
          <div className="mt-4 space-y-3">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="rounded-lg border border-slate-200 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{tenant.name}</p>
                    <p className="text-xs text-slate-500">{tenant.phone} | Move-in: {tenant.moveIn}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{tenant.status}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Move-in / Move-out Tracking</h3>
        <p className="mt-2 text-sm text-slate-600">Track tenant changes, agreement expiry, and document collection from this screen.</p>
      </section>
    </div>
  );
}

export default OwnerTenantPage;
