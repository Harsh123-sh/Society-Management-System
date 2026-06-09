import DeliveryTable from "../components/DeliveryTable";
import VehicleTable from "../components/VehicleTable";
import { EmergencyAlertsPanel, AIInsightsPanel } from "../components/AlertsPanels";
import { emergencyAlerts } from "../data/securityData";

function DeliveriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">📦 Deliveries</h1>
        <p className="mt-2 text-slate-600">Track all delivery entries</p>
      </div>

      <DeliveryTable />

      {/* Delivery Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-[var(--text-main)] shadow-sm">
          <p className="text-sm opacity-90">Delivered Today</p>
          <p className="text-4xl font-bold mt-2">8</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-[var(--text-main)] shadow-sm">
          <p className="text-sm opacity-90">Pending</p>
          <p className="text-4xl font-bold mt-2">2</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-[var(--text-main)] shadow-sm">
          <p className="text-sm opacity-90">By Type</p>
          <p className="text-2xl font-bold mt-2">Food, Courier, Grocery</p>
        </div>
      </div>
    </div>
  );
}

function VehiclesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🚗 Vehicle Entry</h1>
        <p className="mt-2 text-slate-600">Monitor vehicle entries and exits</p>
      </div>

      <VehicleTable />

      {/* Vehicle Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-[var(--text-main)] shadow-sm">
          <p className="text-sm opacity-90">Currently Inside</p>
          <p className="text-4xl font-bold mt-2">4</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-6 text-[var(--text-main)] shadow-sm">
          <p className="text-sm opacity-90">Suspicious</p>
          <p className="text-4xl font-bold mt-2">1</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-[var(--text-main)] shadow-sm">
          <p className="text-sm opacity-90">Exited Today</p>
          <p className="text-4xl font-bold mt-2">5</p>
        </div>
      </div>
    </div>
  );
}

function AlertsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🚨 Emergency Alerts</h1>
        <p className="mt-2 text-slate-600">Real-time emergency management</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EmergencyAlertsPanel />
        </div>
        <div>
          <AIInsightsPanel />
        </div>
      </div>

      {/* Alert History */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900 mb-4">📋 Alert History</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">Type</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">Time</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-slate-900">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {emergencyAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-900">{alert.type}</td>
                  <td className="px-6 py-4 text-slate-700">{alert.location}</td>
                  <td className="px-6 py-4 text-slate-700">{alert.time}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        alert.status === "active"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {alert.status === "active" ? "🔴 Active" : "✓ Resolved"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export { DeliveriesPage, VehiclesPage, AlertsPage };
