import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import AuthLink from "../components/AuthLink";
import { forgotSuperAdminPassword, getApiMessage } from "../services/authApi";

function SuperAdminForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    if (!email) {
      setAlert({ type: "error", message: "Email is required" });
      return;
    }

    try {
      setLoading(true);
      const response = await forgotSuperAdminPassword({ email });
      sessionStorage.setItem("superAdminResetEmail", email.trim().toLowerCase());
      sessionStorage.removeItem("superAdminResetVerified");
      setAlert({
        type: "success",
        message: response.message || "If this email is registered as Super Admin, OTP has been sent.",
      });
      navigate(`/super-admin/verify-otp?email=${encodeURIComponent(email.trim())}`, { replace: true });
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "If this email is registered as Super Admin, OTP has been sent."),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Forgot Super Admin Password"
      subtitle="Request a one-time email OTP to verify hidden platform access."
    >
      <AlertMessage type={alert.type} message={alert.message} />

      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthInput
          label="Super Admin Email"
          type="email"
          value={email}
          onChange={(value) => setEmail(value.trim())}
          autoComplete="email"
          required
        />

        <AuthButton type="submit" loading={loading}>
          {loading ? "Sending OTP..." : "Send OTP"}
        </AuthButton>
      </form>

      <div className="flex items-center justify-between text-sm">
        <AuthLink to="/super-admin/login">Back to login</AuthLink>
        <span className="text-[var(--text-secondary)]">Hidden route only</span>
      </div>
    </AuthLayout>
  );
}

export default SuperAdminForgotPasswordPage;