import { defaultManuals } from "../utils/staffDashboardData";

function StaffDocumentsPage() {
  return (
    <div className="staff-page staff-documents-page space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-[var(--page-bg)] via-[var(--surface-soft)] to-cyan-700 p-6 text-[var(--text-main)] shadow-lg">
        <h2 className="text-2xl font-bold">Document Access</h2>
        <p className="mt-1 text-sm text-slate-200">Work instructions, manuals, and operational SOPs for daily tasks.</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Manuals</h3>
        <div className="mt-3 space-y-2">
          {defaultManuals.map((manual) => (
            <div key={manual.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <div>
                <p className="font-semibold text-slate-900">{manual.title}</p>
                <p className="text-xs text-slate-500">{manual.category} | Updated {manual.updatedAt}</p>
              </div>
              <button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
                Open
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default StaffDocumentsPage;
