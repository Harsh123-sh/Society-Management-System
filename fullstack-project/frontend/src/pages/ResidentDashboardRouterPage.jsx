import OwnerDashboardPage from "./OwnerDashboardPage";
import TenantDashboardPage from "./TenantDashboardPage";
import { getStoredUser } from "../utils/session";

function ResidentDashboardRouterPage() {
  const user = getStoredUser();
  const residentType = user?.resident_type || "owner";

  if (residentType === "tenant") {
    return (
      <div className="resident-page resident-tenant-page">
        <TenantDashboardPage />
      </div>
    );
  }

  return (
    <div className="resident-page resident-owner-page">
      <OwnerDashboardPage />
    </div>
  );
}

export default ResidentDashboardRouterPage;
