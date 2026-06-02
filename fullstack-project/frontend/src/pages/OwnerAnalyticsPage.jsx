import { useMemo } from "react";

function OwnerAnalyticsPage() {
  const insights = useMemo(() => ({
    monthlyRent: 15000,
    yearlyProfit: 180000,
    maintenanceTrend: "Up 8% vs last quarter",
    riskAlert: "Tenant delayed payment frequently",
  }), []);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-700 p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold">Income Tracking</h2>
        <p className="mt-1 text-sm text-slate-200">Rent received, monthly income summary, and profit trends for your property.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Ideal Rent Suggestion</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">₹{insights.monthlyRent.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">Based on location, flat type, and market trends</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Yearly Income</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">₹{insights.yearlyProfit.toLocaleString()}</p>
          <p className="mt-1 text-xs text-slate-500">Rent received minus recurring expenses</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Risk Alert</p>
          <p className="mt-2 text-base font-semibold text-rose-700">{insights.riskAlert}</p>
          <p className="mt-1 text-xs text-slate-500">AI flags payment and cost risks automatically</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Monthly Income Summary</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            {["Jan", "Feb", "Mar", "Apr"].map((month, index) => (
              <div key={month} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span>{month}</span>
                <span className="font-semibold">₹{(12000 + index * 1100).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">AI Agreement Generator</h3>
          <p className="mt-2 text-sm text-slate-600">Enter basic tenant details and generate a rental agreement draft automatically.</p>
          <div className="mt-4 grid gap-2">
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Tenant name" />
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Flat number" />
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Agreement period" />
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Generate Agreement</button>
          </div>
        </article>
      </section>
    </div>
  );
}

export default OwnerAnalyticsPage;
