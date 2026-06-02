import { complaintStats, recentComplaints } from "../data/dashboardData";

function ComplaintAnalytics() {
  const total = complaintStats.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="surface-card app-surface p-6">
      <h2 className="mb-6 text-xl font-bold text-[rgb(var(--app-text-rgb))]">Complaint Analytics</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative h-48 w-48">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              {complaintStats.reduce((acc, item, index) => {
                const startAngle = (acc / total) * 360;
                const endAngle = ((acc + item.value) / total) * 360;
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;

                const x1 = 50 + 40 * Math.cos(startRad);
                const y1 = 50 + 40 * Math.sin(startRad);
                const x2 = 50 + 40 * Math.cos(endRad);
                const y2 = 50 + 40 * Math.sin(endRad);

                const largeArc = endAngle - startAngle > 180 ? 1 : 0;

                const pathData = [
                  `M 50 50`,
                  `L ${x1} ${y1}`,
                  `A 40 40 0 ${largeArc} 1 ${x2} ${y2}`,
                  `Z`,
                ].join(" ");

                return acc;
              }, 0)}

              {/* Simple segments */}
              {complaintStats.map((item, index) => {
                const start = (complaintStats
                  .slice(0, index)
                  .reduce((sum, it) => sum + it.value, 0) /
                  total) *
                  360;
                const angle = (item.value / total) * 360;
                const largeArc = angle > 180 ? 1 : 0;

                const startRad = ((start - 90) * Math.PI) / 180;
                const endRad = (((start + angle) - 90) * Math.PI) / 180;

                const x1 = 50 + 40 * Math.cos(startRad);
                const y1 = 50 + 40 * Math.sin(startRad);
                const x2 = 50 + 40 * Math.cos(endRad);
                const y2 = 50 + 40 * Math.sin(endRad);

                return (
                  <path
                    key={index}
                    d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={item.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                );
              })}

              <circle cx="50" cy="50" r="25" fill="white" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{total}</p>
              <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">Total</p>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 grid grid-cols-2 gap-3 w-full">
            {complaintStats.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-[rgb(var(--app-text-rgb))]">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Complaints */}
        <div>
          <h3 className="mb-4 font-semibold text-[rgb(var(--app-text-rgb))]">Recent Complaints</h3>
          <div className="space-y-3">
            {recentComplaints.map((complaint) => (
              <div
                key={complaint.id}
                className="rounded-2xl border border-[rgb(var(--app-border-rgb))] p-4 transition-colors hover:border-[rgb(var(--app-primary-rgb))]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-[rgb(var(--app-text-rgb))]">{complaint.resident}</p>
                    <p className="mt-1 text-sm text-[rgb(var(--app-text-muted-rgb))]">{complaint.issue}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          complaint.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : complaint.status === "in_progress"
                              ? "bg-sky-100 text-sky-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {complaint.status.replace("_", " ")}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          complaint.priority === "critical"
                            ? "bg-rose-100 text-rose-700"
                              : complaint.priority === "high"
                                ? "bg-orange-100 text-orange-700"
                                : complaint.priority === "medium"
                                  ? "bg-sky-100 text-sky-700"
                                  : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {complaint.priority}
                      </span>
                    </div>
                  </div>
                    <button className="rounded-lg bg-[rgb(var(--app-surface-muted-rgb))] px-3 py-1 text-xs font-semibold text-[rgb(var(--app-text-rgb))] transition-colors hover:opacity-90">
                    Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplaintAnalytics;
