import { useState } from "react";
import AuthLayout, { authLabelClass } from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import AuthLink from "../components/AuthLink";
import AlertMessage from "../components/AlertMessage";
import OtpInput from "../components/OtpInput";
import AuthPasswordInput from "../components/AuthPasswordInput";
import {
  forgotPassword,
  getApiMessage,
  resetPassword,
} from "../services/authApi";

function ForgotPasswordPage() {
  const [requestEmail, setRequestEmail] = useState("");
  const [resetForm, setResetForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [requestLoading, setRequestLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  function validateReset() {
    if (
      !resetForm.email ||
      !resetForm.otp ||
      !resetForm.confirmPassword
    ) {
      return "All reset fields are required";
    }

    if (!/^\d{6}$/.test(resetForm.otp)) {
      return "OTP must be 6 digits";
    }

    if (resetForm.newPassword.length < 6) {
      return "New password must be at least 6 characters";
    }

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      return "Passwords do not match";
    }

    return null;
  }

  async function handleRequestOtp(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    if (!requestEmail) {
      setAlert({ type: "error", message: "Email is required" });
      return;
    }

    try {
      setRequestLoading(true);
      const response = await forgotPassword({ email: requestEmail });
      setResetForm((prev) => ({ ...prev, email: requestEmail }));
      setAlert({
        type: "info",
        message: response.message || "OTP sent for password reset",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Could not send reset OTP"),
      });
    } finally {
      setRequestLoading(false);
    }
  }
  async function handleResetPassword(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    const validationError = validateReset();
    if (validationError) {
      setAlert({ type: "error", message: validationError });
      return;
    }

    try {
      setResetLoading(true);
      const response = await resetPassword({
        email: resetForm.email,
        otp: resetForm.otp,
        newPassword: resetForm.newPassword,
      });

      setAlert({
        type: "success",
        message: response.message || "Password reset successful",
      });

      setResetForm({
        email: resetForm.email,
        otp: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Password reset failed"),
      });
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Request a code, verify it, and set a new password"
    >
      <AlertMessage type={alert.type} message={alert.message} />

      <form className="space-y-4" onSubmit={handleRequestOtp}>
        <h2 className="text-sm font-semibold text-white">Step 1: Request OTP</h2>
        <AuthInput label="Email" type="email" value={requestEmail} onChange={(v) => setRequestEmail(v)} autoComplete="email" required />
        <AuthButton type="submit" loading={requestLoading}>{requestLoading ? "Sending OTP..." : "Send OTP"}</AuthButton>
      </form>

      <form className="space-y-4" onSubmit={handleResetPassword}>
        <h2 className="text-sm font-semibold text-white">Step 2: Reset Password</h2>
        <div>
          <label className={authLabelClass}>Email</label>
          <AuthInput label="Email" type="email" value={resetForm.email} onChange={(v) => setResetForm((prev) => ({ ...prev, email: v }))} autoComplete="email" required />
        </div>
        <div>
          <label className={authLabelClass}>OTP</label>
          <div className="mt-1">
            <OtpInput
              value={resetForm.otp}
              onChange={(otp) => setResetForm((prev) => ({ ...prev, otp }))}
              disabled={resetLoading}
            />
          </div>
        </div>
        <div>
          <label className={authLabelClass}>New password</label>
          <AuthPasswordInput label="New password" value={resetForm.newPassword} onChange={(v) => setResetForm((prev) => ({ ...prev, newPassword: v }))} autoComplete="new-password" required />
        </div>
        <div>
          <label className={authLabelClass}>Confirm new password</label>
          <AuthPasswordInput label="Confirm new password" value={resetForm.confirmPassword} onChange={(v) => setResetForm((prev) => ({ ...prev, confirmPassword: v }))} autoComplete="new-password" required />
        </div>
        <AuthButton type="submit" loading={resetLoading}>{resetLoading ? "Resetting..." : "Reset password"}</AuthButton>
      </form>

      <p className="text-sm text-white/70">
        Remembered your password?{" "}
        <AuthLink to="/login" className="font-medium text-white">
          Back to login
        </AuthLink>
      </p>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
