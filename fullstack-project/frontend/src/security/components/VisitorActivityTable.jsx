import { visitorActivity } from "../data/securityData";

function VisitorActivityTable() {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-xl font-bold text-slate-900">👥 Visitor Activity</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Name</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Flat</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Purpose</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Entry</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Exit</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {visitorActivity.map((visitor) => (
              <tr
                key={visitor.id}
                className={`hover:bg-slate-50 transition-colors ${
                  visitor.suspicious ? "bg-red-50" : ""
                }`}
              >
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">
                    {visitor.name}
                    {visitor.suspicious && (
                      <span className="ml-2 text-xs bg-red-500 text-[var(--text-main)] px-2 py-1 rounded-full">
                        ⚠️ Suspicious
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-700 font-semibold">{visitor.flat}</td>
                <td className="px-6 py-4 text-slate-700">{visitor.purpose}</td>
                <td className="px-6 py-4 text-slate-700">{visitor.entryTime}</td>
                <td className="px-6 py-4 text-slate-700">
                  {visitor.exitTime || "-"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      visitor.status === "exited"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {visitor.status === "exited" ? "✓ Exited" : "📍 Inside"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VisitorActivityTable;
