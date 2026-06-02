import OwnerDashboardPage from "./OwnerDashboardPage";
import TenantDashboardPage from "./TenantDashboardPage";
import { getStoredUser } from "../utils/session";

function ResidentDashboardRouterPage() {
  const user = getStoredUser();
  const residentType = user?.resident_type || "owner";

  if (residentType === "tenant") {
    return <TenantDashboardPage />;
  }

  return <OwnerDashboardPage />;
}

export default ResidentDashboardRouterPage;
