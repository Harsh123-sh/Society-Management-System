import { financialData, pendingDues } from "../data/dashboardData";

function FinancialOverview() {
  // Calculate max value for scaling
  const maxValue = Math.max(...financialData.map(d => Math.max(d.income, d.expense)));
  const scale = 150 / maxValue;

  return (
    <div className="surface-card app-surface p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[rgb(var(--app-text-rgb))]">Financial Overview</h2>
        <select className="ui-input max-w-[180px] px-3 py-2 text-sm">
          <option>Last 6 months</option>
          <option>Last 3 months</option>
          <option>This year</option>
        </select>
      </div>

      {/* Chart */}
      <div className="mb-8 flex items-end justify-between gap-3 h-56">
        {financialData.map((data, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative w-full flex gap-1">
              {/* Income Bar */}
              <div className="flex-1">
                <div
                    className="cursor-pointer rounded-t-lg bg-gradient-to-t from-[rgb(var(--app-primary-rgb))] to-[rgb(var(--app-secondary-rgb))] transition-all hover:opacity-90"
                  style={{ height: `${data.income * scale}px` }}
                ></div>
              </div>
              {/* Expense Bar */}
              <div className="flex-1">
                <div
                    className="cursor-pointer rounded-t-lg bg-gradient-to-t from-amber-500 to-orange-400 transition-all hover:opacity-90"
                  style={{ height: `${data.expense * scale}px` }}
                ></div>
              </div>
            </div>
              <span className="text-xs font-semibold text-[rgb(var(--app-text-muted-rgb))]">{data.month}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-6 border-t border-[rgb(var(--app-border-rgb))] pt-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gradient-to-r from-[rgb(var(--app-primary-rgb))] to-[rgb(var(--app-secondary-rgb))]"></div>
          <span className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-400"></div>
          <span className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Expense</span>
        </div>
      </div>

      {/* Pending Dues */}
      <div className="mt-8 border-t border-[rgb(var(--app-border-rgb))] pt-6">
        <h3 className="mb-4 text-lg font-semibold text-[rgb(var(--app-text-rgb))]">Pending Dues</h3>
        <div className="space-y-3">
          {pendingDues.map((due) => (
            <div
              key={due.id}
              className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                due.status === "critical"
                  ? "border-l-4 border-rose-500 bg-rose-50"
                  : due.status === "warning"
                    ? "border-l-4 border-amber-500 bg-amber-50"
                    : "border-l-4 border-yellow-500 bg-yellow-50"
              }`}
            >
              <div className="flex-1">
                <p className="font-semibold text-[rgb(var(--app-text-rgb))]">{due.resident}</p>
                <p className="text-sm text-[rgb(var(--app-text-muted-rgb))]">Flat {due.flat} - Wing {due.wing}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[rgb(var(--app-text-rgb))]">{due.amount}</p>
                <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">{due.daysOverdue}d overdue</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FinancialOverview;
