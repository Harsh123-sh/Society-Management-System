import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OwnerDashboardPage from "./OwnerDashboardPage";
import TenantDashboardPage from "./TenantDashboardPage";
import CompleteResidenceProfilePage from "./CompleteResidenceProfilePage";
import { fetchResidenceProfileStatus } from "../services/societyStructureApi";
import { getStoredUser } from "../utils/session";

function ResidentDashboardRouterPage() {
  const user = getStoredUser();
  const residentType = user?.resident_type || "owner";
  const navigate = useNavigate();
  const [profileState, setProfileState] = useState({ loading: true, profile: null });

  useEffect(() => {
    let active = true;
    
    // If user is a tenant, redirect to new tenant dashboard
    if (residentType === "tenant") {
      navigate("/tenant", { replace: true });
      return;
    }
    
    fetchResidenceProfileStatus()
      .then((response) => {
        if (active) setProfileState({ loading: false, profile: response.data || null });
      })
      .catch(() => {
        if (active) setProfileState({ loading: false, profile: null });
      });
    return () => {
      active = false;
    };
  }, [residentType, navigate]);

  if (profileState.loading && residentType !== "tenant") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300">
        Checking residence approval...
      </div>
    );
  }

  if (!profileState.profile || profileState.profile.approval_status !== "approved") {
    return (
      <CompleteResidenceProfilePage
        pendingProfile={profileState.profile?.approval_status === "pending" ? profileState.profile : null}
        onSubmitted={() => setProfileState((prev) => ({ ...prev, profile: { approval_status: "pending" } }))}
      />
    );
  }

  if (residentType === "tenant") {
    return null; // Will redirect via useEffect
  }

  return (
    <OwnerDashboardPage />
  );
}

export default ResidentDashboardRouterPage;
