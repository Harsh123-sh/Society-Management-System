function StaffNotificationsPage() {
  const notifications = [
    {
      id: 1,
      title: "New task assigned",
      detail: "Plumbing task assigned to Flat A-302",
      severity: "normal",
    },
    {
      id: 2,
      title: "Urgent complaint alert",
      detail: "Water leakage reported in Flat C-401",
      severity: "urgent",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-[var(--page-bg)] via-[var(--surface-soft)] to-fuchsia-700 p-6 text-[var(--text-main)] shadow-lg">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <p className="mt-1 text-sm text-slate-200">Track new task assignments and urgent complaint alerts in real time.</p>
      </section>

      <section className="space-y-3">
        {notifications.map((item) => (
          <article key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-600">{item.detail}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.severity === "urgent" ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"}`}>
                {item.severity}
              </span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default StaffNotificationsPage;
