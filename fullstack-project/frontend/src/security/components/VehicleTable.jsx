import { vehicles } from "../data/securityData";

function VehicleTable() {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-xl font-bold text-slate-900">🚗 Vehicle Entry</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">
                Vehicle No.
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Type</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Owner</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Flat</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">
                Entry Time
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-900">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {vehicles.map((vehicle) => (
              <tr
                key={vehicle.id}
                className={`hover:bg-slate-50 transition-colors ${
                  vehicle.suspicious ? "bg-red-50" : ""
                }`}
              >
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900 text-lg">
                    {vehicle.number}
                    {vehicle.suspicious && (
                      <span className="ml-2 text-xs bg-red-500 text-[var(--text-main)] px-2 py-1 rounded-full">
                        ⚠️ Unknown
                      </span>
                    )}
                  </div>
                  {vehicle.aiAlert && (
                    <p className="text-xs text-red-700 font-semibold mt-1">
                      🚨 {vehicle.aiAlert}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-slate-700">{vehicle.type}</span>
                </td>
                <td className="px-6 py-4 text-slate-700">{vehicle.owner}</td>
                <td className="px-6 py-4 text-slate-700 font-semibold">
                  {vehicle.flat}
                </td>
                <td className="px-6 py-4 text-slate-700">{vehicle.entryTime}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      vehicle.status === "inside"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {vehicle.status === "inside" ? "📍 Inside" : "✓ Exited"}
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

export default VehicleTable;
