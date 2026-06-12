import { useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import AuthLayout, { authLabelClass } from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import AuthLink from "../components/AuthLink";
import OtpInput from "../components/OtpInput";
import { forgotSuperAdminPassword, getApiMessage, verifySuperAdminOtp } from "../services/authApi";

function SuperAdminVerifyOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(
    () =>
      searchParams.get("email") ||
      sessionStorage.getItem("superAdminResetEmail") ||
      "",
    [searchParams]
  );
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  async function handleVerify(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    if (!email || !otp) {
      setAlert({ type: "error", message: "Email and OTP are required" });
      return;
    }

    try {
      setVerifying(true);
      const response = await verifySuperAdminOtp({ email, otp });
      sessionStorage.setItem("superAdminResetEmail", email.trim().toLowerCase());
      sessionStorage.setItem("superAdminResetVerified", "1");
      setAlert({ type: "success", message: response.message || "OTP verified successfully" });
      navigate(`/super-admin/reset-password?email=${encodeURIComponent(email.trim())}`, { replace: true });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Invalid or expired OTP") });
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setAlert({ type: "error", message: "Email is required" });
      return;
    }

    try {
      setResending(true);
      const response = await forgotSuperAdminPassword({ email });
      sessionStorage.setItem("superAdminResetEmail", email.trim().toLowerCase());
      sessionStorage.removeItem("superAdminResetVerified");
      setAlert({ type: "info", message: response.message || "OTP has been resent" });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not resend OTP") });
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    return <Navigate to="/super-admin/forgot-password" replace />;
  }

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle="Enter the 6-digit OTP sent to the registered Super Admin email."
      eyebrow="Platform Admin"
      insightTitle="Verify platform administrator access."
      insightSubtitle="OTP verification is tied to the registered email address."
      insightMeta={[
        ["Email OTP", "Platform account"],
        ["Time-limited", "Secure reset"],
      ]}
    >
      <AlertMessage type={alert.type} message={alert.message} />

      <form className="space-y-5" onSubmit={handleVerify}>
        <AuthInput
          label="Email"
          type="email"
          value={email}
          onChange={(value) => setEmail(value.trim())}
          autoComplete="email"
          required
        />

        <div>
          <label className={authLabelClass}>OTP</label>
          <div className="mt-2">
            <OtpInput value={otp} onChange={setOtp} autoFocus />
          </div>
        </div>

        <AuthButton type="submit" loading={verifying}>
          {verifying ? "Verifying..." : "Verify OTP"}
        </AuthButton>
      </form>

      <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="font-medium text-cyan-100 transition hover:text-[var(--text-main)] disabled:text-[var(--text-secondary)]"
        >
          {resending ? "Resending..." : "Resend OTP"}
        </button>
        <AuthLink to="/super-admin/login">Back to login</AuthLink>
      </div>
    </AuthLayout>
  );
}

export default SuperAdminVerifyOtpPage;
