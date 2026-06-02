import { Routes, Route } from "react-router-dom";
import SecurityLayout from "./components/SecurityLayout";
import SecurityDashboardPage from "../pages/SecurityDashboardPage";
import VisitorEntryPage from "./pages/VisitorEntryPage";
import {
  AlertsPage,
  DeliveriesPage,
  GatePassPage,
  PreApprovedPage,
  ReportsPage,
  SecuritySettingsPage,
  StaffEntryPage,
  VehiclesPage,
} from "./pages/PremiumSecurityPages";

function SecurityRouter() {
  return (
    <SecurityLayout>
      <Routes>
        <Route index element={<SecurityDashboardPage />} />
        <Route path="visitors" element={<VisitorEntryPage />} />
        <Route path="pre-approved" element={<PreApprovedPage />} />
        <Route path="deliveries" element={<DeliveriesPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="gate-pass" element={<GatePassPage />} />
        <Route path="staff-entry" element={<StaffEntryPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SecuritySettingsPage />} />
      </Routes>
    </SecurityLayout>
  );
}

export default SecurityRouter;
