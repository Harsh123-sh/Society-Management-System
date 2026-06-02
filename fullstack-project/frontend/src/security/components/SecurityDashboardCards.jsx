import { summaryStats } from "../data/securityData";

function SecurityDashboardCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {summaryStats.map((stat) => (
        <div
          key={stat.id}
          className="surface-card app-surface cursor-pointer rounded-3xl p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>{stat.title}</p>
              <p className="mt-3 text-4xl font-bold" style={{ color: 'var(--text)' }}>{stat.value}</p>
            </div>
            <span className="text-3xl">{stat.icon}</span>
          </div>
          <div className="mt-4 h-1 rounded-full bg-[rgb(var(--app-primary-rgb))] opacity-20"></div>
        </div>
      ))}
    </div>
  );
}

export default SecurityDashboardCards;
