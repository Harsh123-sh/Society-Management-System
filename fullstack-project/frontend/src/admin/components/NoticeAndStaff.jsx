import { latestNotices, staffOverview, aiInsights } from "../data/dashboardData";

function NoticeActivitySection() {
  return (
    <div className="surface-card app-surface p-6">
      <h2 className="mb-6 text-xl font-bold text-[rgb(var(--app-text-rgb))]">Latest Notices</h2>

      <div className="space-y-4">
        {latestNotices.map((notice) => (
          <div
            key={notice.id}
            className="group cursor-pointer rounded-2xl border border-[rgb(var(--app-border-rgb))] p-4 transition-colors hover:border-[rgb(var(--app-primary-rgb))] hover:bg-[rgb(var(--app-surface-muted-rgb))]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold text-[rgb(var(--app-text-rgb))] group-hover:text-[rgb(var(--app-primary-rgb))]">
                  {notice.title}
                </p>
                <p className="mt-1 text-sm text-[rgb(var(--app-text-muted-rgb))]">{notice.description}</p>
                <div className="mt-3 flex items-center gap-4">
                  <span className="text-xs text-[rgb(var(--app-text-muted-rgb))]">
                    {new Date(notice.date).toLocaleDateString()}
                  </span>
                  <span className="rounded px-2 py-1 text-xs font-semibold text-[rgb(var(--app-text-rgb))] bg-[rgb(var(--app-surface-muted-rgb))]">
                    By: {notice.postedBy}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[rgb(var(--app-text-rgb))]">{notice.views}</p>
                <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">Views</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[rgb(var(--app-primary-rgb))] to-[rgb(var(--app-secondary-rgb))] px-4 py-2 font-semibold text-white transition-all hover:shadow-lg">
        Generate Notice with AI
      </button>
    </div>
  );
}

function StaffOverviewSection() {
  const onDuty = staffOverview.filter(s => s.status === "on_duty").length;
  const total = staffOverview.length;

  return (
    <div className="surface-card app-surface p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[rgb(var(--app-text-rgb))]">Staff Overview</h2>
        <div className="text-right">
          <p className="text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{onDuty}/{total}</p>
          <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">On Duty</p>
        </div>
      </div>

      <div className="space-y-3">
        {staffOverview.map((staff) => (
          <div
            key={staff.id}
            className="flex items-center justify-between rounded-2xl border border-[rgb(var(--app-border-rgb))] p-4 transition-colors hover:border-[rgb(var(--app-primary-rgb))]"
          >
            <div className="flex-1">
              <p className="font-semibold text-[rgb(var(--app-text-rgb))]">{staff.name}</p>
              <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">{staff.role}</p>
              <p className="mt-1 text-xs text-[rgb(var(--app-text-muted-rgb))]">{staff.shift}</p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                staff.status === "on_duty"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {staff.status === "on_duty" ? "✓ On Duty" : "Off Duty"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIInsightsSection() {
  return (
    <div className="surface-card app-surface p-6">
      <h2 className="mb-4 flex items-center text-xl font-bold text-[rgb(var(--app-text-rgb))]">
        <span className="mr-2">🤖</span>
        AI Insights
      </h2>

      <div className="space-y-3">
        {aiInsights.map((insight) => (
          <div
            key={insight.id}
            className={`rounded-lg p-4 ${
              insight.type === "critical"
                ? "border border-rose-300 bg-rose-100"
                : insight.type === "warning"
                  ? "border border-amber-300 bg-amber-100"
                  : insight.type === "success"
                    ? "border border-emerald-300 bg-emerald-100"
                    : "border border-sky-300 bg-sky-100"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{insight.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-[rgb(var(--app-text-rgb))]">{insight.title}</p>
                <p className="mt-1 text-sm text-[rgb(var(--app-text-muted-rgb))]">{insight.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { NoticeActivitySection, StaffOverviewSection, AIInsightsSection };
