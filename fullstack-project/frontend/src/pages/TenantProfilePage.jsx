import { useMemo } from "react";
import { getStoredUser } from "../utils/session";

function TenantProfilePage() {
  const user = useMemo(() => getStoredUser(), []);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-[var(--page-bg)] via-[var(--surface-soft)] to-violet-700 p-6 text-[var(--text-main)] shadow-lg">
        <h2 className="text-2xl font-bold">Tenant Profile</h2>
        <p className="mt-1 text-sm text-slate-200">Flat details, rent profile, documents, and quick tenant status.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Name</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{user?.name || user?.email || "Tenant"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Tenant Status</p>
          <p className="mt-2 text-xl font-bold text-slate-900">Occupied</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Payment Mode</p>
          <p className="mt-2 text-xl font-bold text-slate-900">Auto reminders on</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Lease & Documents</h3>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          <li className="rounded-lg border border-slate-200 px-3 py-2">Rental agreement available</li>
          <li className="rounded-lg border border-slate-200 px-3 py-2">ID proof on file</li>
          <li className="rounded-lg border border-slate-200 px-3 py-2">Maintenance receipts and bills ready for download</li>
        </ul>
      </section>
    </div>
  );
}

export default TenantProfilePage;
