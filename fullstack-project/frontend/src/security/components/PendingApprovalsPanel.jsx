import { pendingApprovals } from "../data/securityData";

function PendingApprovalsPanel() {
  return (
    <div className="surface-card app-surface p-6">
      <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-[rgb(var(--app-text-rgb))]">
        Pending Approvals ({pendingApprovals.length})
      </h3>

      <div className="space-y-3">
        {pendingApprovals.map((approval) => (
          <div
            key={approval.id}
            className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:border-amber-300"
          >
            <div className="flex-1">
              <p className="text-lg font-bold text-[rgb(var(--app-text-rgb))]">{approval.name}</p>
              <div className="mt-2 space-y-1 text-sm text-[rgb(var(--app-text-muted-rgb))]">
                <p>📍 Flat: {approval.flat} | 📌 {approval.purpose}</p>
                <p>⏰ {approval.arrivalTime}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-600">
                ✓ Approve
              </button>
              <button className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-rose-600">
                ✕ Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PendingApprovalsPanel;
