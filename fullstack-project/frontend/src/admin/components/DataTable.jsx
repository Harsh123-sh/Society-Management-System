// Generic Table Component for Reusability
function DataTable({ columns, data, actions = [] }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-sm font-semibold text-slate-900"
                >
                  {col.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((row, index) => (
              <tr
                key={index}
                className="hover:bg-slate-50 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-slate-700">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {actions.map((action) => (
                        <button
                          key={action.key}
                          onClick={() => action.onClick(row)}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${action.className}`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length === 0 && (
        <div className="px-6 py-12 text-center text-slate-500">
          <p>No data available</p>
        </div>
      )}
    </div>
  );
}

// Badge Component
function Badge({ status, variant = "default" }) {
  const variants = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-slate-100 text-slate-800",
    pending: "bg-yellow-100 text-yellow-800",
    overdue: "bg-red-100 text-red-800",
    paid: "bg-green-100 text-green-800",
    approved: "bg-blue-100 text-blue-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        variants[status] || variants[variant]
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

// Action Button Group
function ActionButtons({ onEdit, onDelete, onView }) {
  return (
    <div className="flex gap-2">
      {onView && (
        <button className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200 transition-colors">
          👁️
        </button>
      )}
      {onEdit && (
        <button className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-200 transition-colors">
          ✏️
        </button>
      )}
      {onDelete && (
        <button className="rounded-lg bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 transition-colors">
          🗑️
        </button>
      )}
    </div>
  );
}

export { DataTable, Badge, ActionButtons };
