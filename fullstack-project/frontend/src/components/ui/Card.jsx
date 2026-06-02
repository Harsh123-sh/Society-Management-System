/**
 * Reusable Card Component
 * Usage: <Card title="..." icon="..." className="..."><content></Card>
 */
export function Card({ title, subtitle, icon, children, className = "", footer, onClick }) {
  return (
    <div
      className={`surface-card app-surface rounded-3xl transition ${className} ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      {/* Header */}
      {(title || icon) && (
        <div className="border-b border-[rgb(var(--app-border-rgb))] p-4 sm:p-6">
          <div className="flex items-start gap-3">
            {icon && <span className="text-2xl">{icon}</span>}
            <div>
              {title && <h3 className="font-bold text-[rgb(var(--app-text-rgb))]">{title}</h3>}
              {subtitle && <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 sm:p-6">{children}</div>

      {/* Footer */}
      {footer && <div className="border-t border-[rgb(var(--app-border-rgb))] bg-[rgb(var(--app-surface-muted-rgb))] p-4 sm:p-6">{footer}</div>}
    </div>
  );
}

export function CardGrid({ children, cols = 3 }) {
  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[cols];

  return <div className={`grid gap-4 sm:gap-6 ${gridClass}`}>{children}</div>;
}

export function StatsCard({ icon, label, value, change, status = "neutral" }) {
  const statusColor = {
    positive: "text-emerald-600 bg-emerald-50",
    negative: "text-rose-600 bg-rose-50",
    neutral: "text-indigo-600 bg-indigo-50",
  }[status];

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[rgb(var(--app-text-rgb))]">{value}</p>
          {change && <p className={`text-xs mt-2 ${statusColor}`}>↑ {change}% this month</p>}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </Card>
  );
}