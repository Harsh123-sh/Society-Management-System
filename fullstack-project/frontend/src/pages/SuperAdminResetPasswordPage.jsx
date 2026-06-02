import { useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import AuthLayout, { authLabelClass } from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthPasswordInput from "../components/AuthPasswordInput";
import AuthButton from "../components/AuthButton";
import AuthLink from "../components/AuthLink";
import { getApiMessage, resetSuperAdminPassword } from "../services/authApi";

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;

function SuperAdminResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(
    () =>
      searchParams.get("email") ||
      sessionStorage.getItem("superAdminResetEmail") ||
      "",
    [searchParams]
  );
  const verified = sessionStorage.getItem("superAdminResetVerified") === "1";
  const [email] = useState(initialEmail);
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  function validate() {
    if (!email) {
      return "Email is required";
    }

    if (!verified) {
      return "OTP verification is required before resetting the password";
    }

    if (!form.newPassword || !form.confirmPassword) {
      return "New password and confirm password are required";
    }

    if (!strongPasswordRegex.test(form.newPassword)) {
      return "Password must include uppercase, lowercase, number, and special character";
    }

    if (form.newPassword !== form.confirmPassword) {
      return "Passwords do not match";
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
      const response = await resetSuperAdminPassword({
        email,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      sessionStorage.removeItem("superAdminResetEmail");
      sessionStorage.removeItem("superAdminResetVerified");

      setAlert({ type: "success", message: response.message || "Password reset successful" });
      navigate("/super-admin/login", { replace: true });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Password reset failed") });
    } finally {
      setLoading(false);
    }
  }

  if (!email) {
    return <Navigate to="/super-admin/forgot-password" replace />;
  }

  if (!verified) {
    return <Navigate to={`/super-admin/verify-otp?email=${encodeURIComponent(email)}`} replace />;
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Set a new secure password for the hidden Super Admin account."
    >
      <AlertMessage type={alert.type} message={alert.message} />

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className={authLabelClass}>Email</label>
          <AuthInput label="Email" type="email" value={email} disabled autoComplete="email" required />
        </div>

        <AuthPasswordInput
          label="New password"
          value={form.newPassword}
          onChange={(value) => setForm((prev) => ({ ...prev, newPassword: value }))}
          autoComplete="new-password"
          required
        />

        <AuthPasswordInput
          label="Confirm password"
          value={form.confirmPassword}
          onChange={(value) => setForm((prev) => ({ ...prev, confirmPassword: value }))}
          autoComplete="new-password"
          required
        />

        <AuthButton type="submit" loading={loading}>
          {loading ? "Resetting..." : "Reset password"}
        </AuthButton>
      </form>

      <div className="flex items-center justify-between text-sm">
        <AuthLink to="/super-admin/verify-otp">Back to OTP verification</AuthLink>
        <AuthLink to="/super-admin/login">Back to login</AuthLink>
      </div>
    </AuthLayout>
  );
}

export default SuperAdminResetPasswordPage;