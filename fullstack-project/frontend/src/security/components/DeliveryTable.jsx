import { deliveries } from "../data/securityData";

function DeliveryTable() {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-xl font-bold text-slate-900">📦 Deliveries Today</h3>
      </div>

      <div className="space-y-3 p-6">
        {deliveries.map((delivery) => (
          <div
            key={delivery.id}
            className={`flex items-center justify-between p-4 rounded-lg border-2 ${
              delivery.status === "delivered"
                ? "border-green-200 bg-green-50"
                : "border-yellow-200 bg-yellow-50"
            }`}
          >
            <div className="flex items-center gap-4 flex-1">
              <span className="text-4xl">{delivery.icon}</span>
              <div>
                <p className="font-bold text-slate-900">
                  {delivery.type} from {delivery.from}
                </p>
                <p className="text-sm text-slate-600">📍 Flat {delivery.flat}</p>
                <p className="text-xs text-slate-500">⏰ {delivery.entryTime}</p>
                {delivery.aiSuggestion && (
                  <p className="text-xs text-orange-700 font-semibold mt-1">
                    💡 {delivery.aiSuggestion}
                  </p>
                )}
              </div>
            </div>

            <span
              className={`inline-flex rounded-full px-4 py-2 text-xs font-bold ${
                delivery.status === "delivered"
                  ? "bg-green-200 text-green-800"
                  : "bg-yellow-200 text-yellow-800"
              }`}
            >
              {delivery.status === "delivered" ? "✓ Delivered" : "🕐 Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DeliveryTable;
