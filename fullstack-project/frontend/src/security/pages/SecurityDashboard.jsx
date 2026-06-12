import SecurityDashboardCards from "../components/SecurityDashboardCards";
import VisitorQuickEntryForm from "../components/VisitorQuickEntryForm";
import PendingApprovalsPanel from "../components/PendingApprovalsPanel";
import VisitorActivityTable from "../components/VisitorActivityTable";
import DeliveryTable from "../components/DeliveryTable";
import VehicleTable from "../components/VehicleTable";
import { EmergencyAlertsPanel, AIInsightsPanel } from "../components/AlertsPanels";

function SecurityDashboard() {
  return (
    <div className="security-content security-page space-y-6">
      <div className="surface-card app-surface rounded-[22px] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[rgb(var(--app-text-muted-rgb))]">
          Gate operations dashboard
        </p>
        <h1 className="mt-2 font-bold text-[rgb(var(--app-text-rgb))]">Security Dashboard</h1>
        <p className="mt-2 text-sm text-[rgb(var(--app-text-muted-rgb))]">
          Visitor check-in, gate pass approvals, alerts, logs, and vehicle movement in one operational view.
        </p>
      </div>

      <SecurityDashboardCards />

      <VisitorQuickEntryForm />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PendingApprovalsPanel />
        </div>
        <EmergencyAlertsPanel />
      </div>

      <VisitorActivityTable />

      <div className="grid gap-6 lg:grid-cols-2">
        <DeliveryTable />
        <VehicleTable />
      </div>

      <AIInsightsPanel />
    </div>
  );
}

export default SecurityDashboard;
