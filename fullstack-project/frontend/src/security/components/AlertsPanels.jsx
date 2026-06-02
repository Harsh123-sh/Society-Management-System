import { emergencyAlerts, aiInsights } from "../data/securityData";

function EmergencyAlertsPanel() {
  return (
    <div className="rounded-2xl bg-red-50 p-6 shadow-sm border-2 border-red-300">
      <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
        🚨 Emergency Alerts
      </h3>

      <div className="space-y-3">
        {emergencyAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border-2 flex items-start gap-3 ${
              alert.status === "active"
                ? "border-red-500 bg-red-100"
                : "border-green-500 bg-green-100"
            }`}
          >
            <span className="text-3xl">{alert.icon}</span>
            <div className="flex-1">
              <p className="font-bold text-slate-900 text-lg">{alert.type}</p>
              <p className="text-sm text-slate-700">📍 {alert.location}</p>
              <p className="text-xs text-slate-600">⏰ {alert.time}</p>
            </div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${
                alert.status === "active"
                  ? "bg-red-500 text-white"
                  : "bg-green-500 text-white"
              }`}
            >
              {alert.status === "active" ? "🔴 Active" : "✓ Resolved"}
            </span>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
        📞 Emergency Contact
      </button>
    </div>
  );
}

function AIInsightsPanel() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm border border-purple-200">
      <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
        🤖 AI Insights
      </h3>

      <div className="space-y-3">
        {aiInsights.map((insight) => (
          <div
            key={insight.id}
            className={`p-4 rounded-lg border-l-4 ${
              insight.type === "alert"
                ? "border-red-500 bg-red-50"
                : insight.type === "warning"
                  ? "border-orange-500 bg-orange-50"
                  : "border-blue-500 bg-blue-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{insight.icon}</p>
                <p className="text-sm text-slate-700 mt-1">{insight.message}</p>
              </div>
              <button className="px-3 py-1 text-xs font-semibold bg-white rounded hover:bg-slate-100 transition-colors whitespace-nowrap">
                {insight.action}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { EmergencyAlertsPanel, AIInsightsPanel };
