import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import AuthLayout, { authLabelClass } from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import AuthLink from "../components/AuthLink";
import AlertMessage from "../components/AlertMessage";
import OtpInput from "../components/OtpInput";
import {
  getApiMessage,
  resendVerificationOtp,
  verifyEmailOtp,
} from "../services/authApi";

function OtpVerificationPage() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    email: searchParams.get("email") || "",
    otp: "",
  });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  function validate() {
    if (!form.email || !form.otp) {
      return "Email and OTP are required";
    }

    if (!/^\d{6}$/.test(form.otp)) {
      return "OTP must be 6 digits";
    }

    return null;
  }

  async function handleVerify(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    const validationError = validate();
    if (validationError) {
      setAlert({ type: "error", message: validationError });
      return;
    }

    try {
      setLoading(true);
      const response = await verifyEmailOtp(form);
      setAlert({
        type: "success",
        message: response.message || "OTP verified successfully",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "OTP verification failed"),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (!form.email) {
      setAlert({ type: "error", message: "Email is required to resend OTP" });
      return;
    }

    try {
      setResending(true);
      const response = await resendVerificationOtp({ email: form.email });
      setAlert({
        type: "info",
        message: response.message || "OTP sent",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not resend OTP"),
      });
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle="Enter the 6-digit code sent to your email address"
    >
      <AlertMessage type={alert.type} message={alert.message} />

      <form className="space-y-5" onSubmit={handleVerify}>
        <AuthInput
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => setForm((prev) => ({ ...prev, email: v }))}
          autoComplete="email"
          required
        />

        <div>
          <label className={authLabelClass}>OTP</label>
          <div className="mt-1">
            <OtpInput value={form.otp} onChange={(otp) => setForm((prev) => ({ ...prev, otp }))} autoFocus />
          </div>
        </div>

        <AuthButton type="submit" loading={loading}>{loading ? "Verifying..." : "Verify OTP"}</AuthButton>
      </form>

      <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={resending}
          onClick={handleResendOtp}
          className="font-medium text-cyan-100 transition hover:text-white disabled:text-white/40"
        >
          {resending ? "Resending..." : "Resend OTP"}
        </button>
        <AuthLink to="/login">Back to login</AuthLink>
      </div>
    </AuthLayout>
  );
}

export default OtpVerificationPage;
