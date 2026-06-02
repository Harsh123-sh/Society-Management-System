import { Routes, Route } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import SocietyPage from "./pages/SocietyPage";
import PaymentsPage from "./pages/PaymentsPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import VisitorsPage from "./pages/VisitorsPage";
import StaffPage from "./pages/StaffPage";
import VendorsPage from "./pages/VendorsPage";
import BookingsPage from "./pages/BookingsPage";
import NoticesPage from "./pages/NoticesPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";

function AdminRouter() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/society" element={<SocietyPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/visitors" element={<VisitorsPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/notices" element={<NoticesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AdminLayout>
  );
}

export default AdminRouter;
