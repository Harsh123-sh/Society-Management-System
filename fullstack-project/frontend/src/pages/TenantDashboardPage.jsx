import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function TenantDashboardPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to new tenant dashboard
    navigate("/tenant/dashboard", { replace: true });
  }, [navigate]);

  return null; // This page will redirect immediately
}

export default TenantDashboardPage;
