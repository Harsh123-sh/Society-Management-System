import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthPasswordInput from "../components/AuthPasswordInput";
import AuthButton from "../components/AuthButton";
import AuthLink from "../components/AuthLink";
import { getApiMessage, loginSuperAdmin } from "../services/authApi";
import {
  getStoredSuperAdminRole,
  getStoredSuperAdminToken,
  saveSuperAdminSession,
} from "../utils/session";

function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const token = getStoredSuperAdminToken();
  const storedRole = getStoredSuperAdminRole();

  if (token && storedRole === "super_admin") {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  function validate() {
    if (!form.email || !form.password) {
      return "Email and password are required";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return "Please enter a valid email address";
    }

    if (form.password.length < 8) {
      return "Password must be at least 8 characters";
    }

    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    const validationError = validate();
    if (validationError) {
      setAlert({ type: "error", message: validationError });
      return;
    }

    try {
      setLoading(true);
      const response = await loginSuperAdmin({
        email: form.email,
        password: form.password,
      });
      const user = response.user || response.data;
      saveSuperAdminSession({ token: response.token, user });

      setAlert({ type: "success", message: response.message || "Super admin login successful" });
      navigate("/super-admin/dashboard", { replace: true });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Super admin login failed") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Super Admin Login"
      subtitle="Access the platform administration dashboard."
      eyebrow="Platform Admin"
      insightTitle="Secure access for platform administrators."
      insightSubtitle="Manage the platform without selecting an individual society."
      insightMeta={[
        ["Platform-level", "Global access"],
        ["Protected", "Direct admin access"],
      ]}
    >
      {alert.message && <AlertMessage type={alert.type} message={alert.message} />}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthInput
          label="Email Address"
          type="email"
          value={form.email}
          onChange={(v) => setForm((prev) => ({ ...prev, email: v.trim() }))}
          autoComplete="email"
          required
        />

        <AuthPasswordInput
          label="Password"
          value={form.password}
          onChange={(v) => setForm((prev) => ({ ...prev, password: v }))}
          autoComplete="current-password"
          required
        />

        <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
          <span className="text-sm text-slate-400">Hidden route for super admin only</span>
          <div className="flex flex-col items-end gap-2">
            <AuthLink to="/super-admin/forgot-password">Forgot password?</AuthLink>
            <AuthLink to="/login">Regular login</AuthLink>
          </div>
        </div>

        <AuthButton type="submit" loading={loading}>
          {loading ? "Signing in..." : "Access super admin panel"}
        </AuthButton>
      </form>

      <div className="space-y-4 pt-2">
        <p className="text-sm text-slate-400">
          Super admin credentials are managed by platform administrators.
        </p>
      </div>
    </AuthLayout>
  );
}

export default SuperAdminLoginPage;
