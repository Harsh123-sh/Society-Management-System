import { Navigate, Route, Routes } from "react-router-dom";
import SecurityCommandCenter from "./pages/SecurityCommandCenter";

function SecurityRouter() {
  return (
    <Routes>
      <Route index element={<SecurityCommandCenter />} />
      <Route path="visitors" element={<Navigate to="/security-dashboard#visitors" replace />} />
      <Route path="pre-approved" element={<Navigate to="/security-dashboard#visitors" replace />} />
      <Route path="deliveries" element={<Navigate to="/security-dashboard#deliveries" replace />} />
      <Route path="vehicles" element={<Navigate to="/security-dashboard#vehicles" replace />} />
      <Route path="gate-pass" element={<Navigate to="/security-dashboard#visitors" replace />} />
      <Route path="staff-entry" element={<Navigate to="/security-dashboard#staff" replace />} />
      <Route path="attendance" element={<Navigate to="/security-dashboard#attendance" replace />} />
      <Route path="alerts" element={<Navigate to="/security-dashboard#emergency" replace />} />
      <Route path="notices" element={<Navigate to="/security-dashboard#notices" replace />} />
      <Route path="shifts" element={<Navigate to="/security-dashboard#shifts" replace />} />
      <Route path="profile" element={<Navigate to="/security-dashboard#profile" replace />} />
      <Route path="settings" element={<Navigate to="/security-dashboard#profile" replace />} />
      <Route path="*" element={<Navigate to="/security-dashboard" replace />} />
    </Routes>
  );
}

export default SecurityRouter;
