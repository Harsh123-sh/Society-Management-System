import { visitorsList, aiInsights } from "../data/dashboardData";

function VisitorAnalytics() {
  const peakHours = [
    { hour: "6 AM", count: 8 },
    { hour: "9 AM", count: 24 },
    { hour: "12 PM", count: 15 },
    { hour: "3 PM", count: 18 },
    { hour: "6 PM", count: 22 },
    { hour: "9 PM", count: 12 },
  ];

  const maxCount = Math.max(...peakHours.map(h => h.count));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Visitor Peak Hours Chart */}
      <div className="surface-card app-surface p-6">
        <h2 className="mb-6 text-xl font-bold text-[rgb(var(--app-text-rgb))]">Visitor Peak Hours</h2>
        
        <div className="flex items-end justify-between gap-3 h-56">
          {peakHours.map((hour) => (
            <div key={hour.hour} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="cursor-pointer rounded-t-lg bg-gradient-to-t from-[rgb(var(--app-primary-rgb))] to-[rgb(var(--app-secondary-rgb))] transition-all hover:opacity-90"
                style={{ height: `${(hour.count / maxCount) * 200}px` }}
              ></div>
              <span className="text-xs font-semibold text-[rgb(var(--app-text-muted-rgb))]">{hour.hour}</span>
              <span className="text-xs text-[rgb(var(--app-text-muted-rgb))]">{hour.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Visitors */}
      <div className="surface-card app-surface p-6">
        <h2 className="mb-6 text-xl font-bold text-[rgb(var(--app-text-rgb))]">Visitors Today</h2>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {visitorsList.map((visitor) => (
            <div
              key={visitor.id}
              className="flex items-center justify-between rounded-2xl border border-[rgb(var(--app-border-rgb))] p-4 transition-colors hover:border-[rgb(var(--app-primary-rgb))]"
            >
              <div className="flex-1">
                <p className="font-semibold text-[rgb(var(--app-text-rgb))]">{visitor.name}</p>
                <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">
                  Flat {visitor.flat} - {visitor.purpose}
                </p>
                <p className="mt-1 text-xs text-[rgb(var(--app-text-muted-rgb))]">
                  {visitor.entryTime} {visitor.exitTime ? `- ${visitor.exitTime}` : ""}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  visitor.status === "in_premises"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {visitor.status === "in_premises" ? "In Premises" : "Exited"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default VisitorAnalytics;
