import SecurityDashboardCards from "../components/SecurityDashboardCards";
import VisitorQuickEntryForm from "../components/VisitorQuickEntryForm";
import PendingApprovalsPanel from "../components/PendingApprovalsPanel";
import VisitorActivityTable from "../components/VisitorActivityTable";
import DeliveryTable from "../components/DeliveryTable";
import VehicleTable from "../components/VehicleTable";
import { EmergencyAlertsPanel, AIInsightsPanel } from "../components/AlertsPanels";

function SecurityDashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900">🔒 Security Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Real-time monitoring & fast entry system
        </p>
      </div>

      {/* Summary Cards */}
      <div>
        <SecurityDashboardCards />
      </div>

      {/* Quick Visitor Entry Form */}
      <div>
        <VisitorQuickEntryForm />
      </div>

      {/* Pending Approvals & Emergency Alerts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PendingApprovalsPanel />
        </div>
        <div>
          <EmergencyAlertsPanel />
        </div>
      </div>

      {/* Visitor Activity */}
      <div>
        <VisitorActivityTable />
      </div>

      {/* Deliveries & Vehicles Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DeliveryTable />
        <VehicleTable />
      </div>

      {/* AI Insights */}
      <div>
        <AIInsightsPanel />
      </div>
    </div>
  );
}

export default SecurityDashboard;
