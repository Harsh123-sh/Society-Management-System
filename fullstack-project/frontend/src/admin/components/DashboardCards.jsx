import { summaryStats } from "../data/dashboardData";

function DashboardCards() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {summaryStats.map((stat) => (
        <div
          key={stat.id}
          className="group relative overflow-hidden rounded-3xl border p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
          style={{
            backgroundColor: 'var(--card)',
            borderColor: 'var(--border)',
          }}
        >
          {/* Gradient Background */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 transition-opacity group-hover:opacity-5`}
          ></div>

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{stat.title}</p>
                <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--text)' }}>
                  {stat.value}
                </p>
              </div>
              <div className="text-4xl opacity-50">{stat.icon}</div>
            </div>

            {/* Trend */}
            <div className="mt-4 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${stat.trendUp ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
              >
                <span>{stat.trendUp ? "📈" : "📉"}</span>
                {stat.trend}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>vs last month</span>
            </div>
          </div>

          {/* Bottom Accent */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`}
          ></div>
        </div>
      ))}
    </div>
  );
}

export default DashboardCards;
