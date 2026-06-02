import { useEffect, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthPasswordInput from "../components/AuthPasswordInput";
import AuthButton from "../components/AuthButton";
import AuthLink from "../components/AuthLink";
import SocialButtons from "../components/SocialButtons";
import { getApiMessage, loginUser } from "../services/authApi";
import { clearAuthSession, clearSuperAdminSession } from "../utils/session";
import {
  getRoleHomePath,
  clearSelectedSociety,
  getSelectedSociety,
  getStoredRole,
  isValidAuthToken,
  saveAuthSession,
  saveSelectedSociety,
} from "../utils/session";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "", societyCode: "" });
  const [selectedSociety, setSelectedSociety] = useState(() => getSelectedSociety() || null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const token = localStorage.getItem("token");
  const storedRole = getStoredRole();

  useEffect(() => {
    clearSuperAdminSession();
  }, []);

  useEffect(() => {
    if (token && !isValidAuthToken(token)) {
      clearAuthSession();
    }
  }, [token]);

  if (isValidAuthToken(token)) {
    return <Navigate to={getRoleHomePath(storedRole)} replace />;
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const societyId = searchParams.get("societyId");

    if (societyId) {
      const society = { id: societyId, name: societyId };
      saveSelectedSociety(society);
      setSelectedSociety(society);
      setForm((prev) => ({ ...prev, societyCode: society.id }));
      return;
    }

    const stored = getSelectedSociety();
    if (stored?.id) {
      setSelectedSociety(stored);
      setForm((prev) => ({ ...prev, societyCode: stored.id }));
    }
  }, [location.search]);

  function validate() {
    if (!form.email) {
      return "Email is required";
    }

    if (!form.password) {
      return "Password is required";
    }

    if (!form.societyCode) {
      return "Society code is required";
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
      clearAuthSession();
      const payload = {
        ...form,
        societyCode: selectedSociety?.id || form.societyCode,
      };
      const response = await loginUser(payload);
      const user = response.user || response.data;
      console.log("[LoginPage] auth payload", {
        role: user?.role,
        tokenExists: Boolean(response.token),
        societyId: user?.societyId || user?.society_id || selectedSociety?.id || form.societyCode,
        societyName: user?.societyName || user?.society_name || selectedSociety?.name || form.societyCode,
        userName: user?.name || user?.userName,
      });
      saveAuthSession({
        token: response.token,
        user,
        societyId: user?.societyId || user?.society_id || selectedSociety?.id || form.societyCode,
        societyName: user?.societyName || user?.society_name || selectedSociety?.name || form.societyCode,
      });

      setAlert({
        type: "success",
        message: response.message || "Login successful",
      });

      if (user?.role === "super_admin") {
        navigate("/super-admin/dashboard", { replace: true });
        return;
      }

      navigate(getRoleHomePath(user?.role), { replace: true });
    } catch (error) {
      console.error("[LoginPage] login error", error?.response?.data || error?.message || error);
      const apiMessage = getApiMessage(error, "Login failed");
      setAlert({
        type: "error",
        message: apiMessage === "Your account is waiting for admin approval" ? "Your account is pending approval." : apiMessage,
      });
    } finally {
      setLoading(false);
    }
  }
  const renderValidationError = validate();
  const canSubmit = renderValidationError === null;

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to your society workspace.">
      {alert.message && <AlertMessage type={alert.type} message={alert.message} />}

      <div className="mb-4 flex items-center justify-start">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
        >
          <span className="text-base">←</span>
          Back to Home
        </button>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {selectedSociety ? (
          <div className="rounded-3xl border p-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}>
            <p className="text-sm text-muted">Selected society</p>
            <p className="mt-2 text-lg font-semibold text-[var(--text)]">{selectedSociety.name}</p>
            <p className="text-sm text-muted">Code: {selectedSociety.id}</p>
            <button
              type="button"
              className="mt-3 text-sm font-semibold underline underline-offset-4"
              style={{ color: "var(--text)" }}
              onClick={() => {
                clearSelectedSociety();
                setSelectedSociety(null);
                setForm((prev) => ({ ...prev, societyCode: "" }));
              }}
            >
              Choose a different society
            </button>
          </div>
        ) : (
          <AuthInput
            label="Society Code"
            type="text"
            value={form.societyCode}
            onChange={(v) => setForm((prev) => ({ ...prev, societyCode: v.trim().toUpperCase() }))}
            placeholder="e.g., SOCIETYCODE"
            autoComplete="off"
            required
          />
        )}

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

        <div className="flex items-center justify-between gap-3 text-sm" style={{ color: "var(--text-muted)" }}>
          <label className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <input type="checkbox" className="h-4 w-4 rounded border" style={{ borderColor: "var(--border)", backgroundColor: "var(--input-bg)" }} />
            Remember me
          </label>
          <AuthLink to="/forgot-password">Forgot password?</AuthLink>
        </div>

        {renderValidationError && (
          <p className="text-sm text-red-500">{renderValidationError}</p>
        )}

        <AuthButton type="submit" loading={loading} disabled={!canSubmit || loading}>
          {loading ? "Signing in..." : "Sign in"}
        </AuthButton>
      </form>

      <div className="space-y-4 pt-2">
        <p className="text-sm text-white/70">
          New to Society Pro? {" "}
          <AuthLink to="/register" className="font-semibold text-white">
            Create account
          </AuthLink>
        </p>

        <SocialButtons />
      </div>

      <p className="text-xs text-[rgb(var(--app-text-muted-rgb))]">Your data is encrypted and secure.</p>
    </AuthLayout>
  );
}

export default LoginPage;
