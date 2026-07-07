import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AlertMessage from "../components/AlertMessage";
import BrandLogo from "../components/BrandLogo";
import NexoraAuthVisual from "../components/NexoraAuthVisual";
import { forgotPassword, getApiMessage, resetPassword } from "../services/authApi";
import { getSelectedSociety, saveSelectedSociety } from "../utils/session";

const Motion = motion;

export default function ForgotPasswordPage() {
  const selected = getSelectedSociety();
  const [request, setRequest] = useState({ email: "", societyCode: selected?.id || "" });
  const [reset, setReset] = useState({ email: "", societyCode: selected?.id || "", otp: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState("");
  const [alert, setAlert] = useState({ type: "", message: "" });
  const resetStageActive = Boolean(reset.email);
  const resetScore = [reset.newPassword.length >= 8, /[A-Z]/.test(reset.newPassword), /\d/.test(reset.newPassword), /[^A-Za-z0-9]/.test(reset.newPassword)].filter(Boolean).length;

  async function requestOtp(event) {
    event.preventDefault();
    try {
      setLoading("request");
      const response = await forgotPassword(request);
      saveSelectedSociety({ id: request.societyCode, name: request.societyCode });
      setReset((prev) => ({ ...prev, ...request }));
      setAlert({ type: "success", message: response.message || "Reset OTP sent." });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not send reset OTP") });
    } finally {
      setLoading("");
    }
  }

  async function submitReset(event) {
    event.preventDefault();
    if (reset.newPassword !== reset.confirmPassword) {
      setAlert({ type: "error", message: "Passwords do not match." });
      return;
    }
    try {
      setLoading("reset");
      const response = await resetPassword({ email: reset.email, societyCode: reset.societyCode, otp: reset.otp, newPassword: reset.newPassword });
      setAlert({ type: "success", message: response.message || "Password reset successful." });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Password reset failed") });
    } finally {
      setLoading("");
    }
  }

  return (
    <main className="auth-v2 auth-v2-recovery">
      <section className="auth-v2-art">
        <div className="nexora-auth-brand"><BrandLogo to={null} variant="full" /></div>
        <NexoraAuthVisual type={resetStageActive ? "reset" : "forgot"} />
        <div className="auth-v2-art-copy"><em>{resetStageActive ? "Protection Animation" : "Security Pulse"}</em><h1>{resetStageActive ? "Create New Password" : "Account Recovery"}</h1><p>{resetStageActive ? "Set a strong password to secure your account." : "Enter your registered email or mobile number and we will send you a verification code."}</p></div>
        <div className="auth-v2-illustration"><div><span>✓</span><strong>Protected</strong></div><div><span>✓</span><strong>Encrypted</strong></div><div><span>✓</span><strong>Verified</strong></div></div>
      </section>
      <section className="auth-v2-form-zone">
        <Motion.div className="auth-v2-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <div className="auth-v2-heading"><span>{resetStageActive ? "Protection Shield" : "Recovery Key"}</span><h2>{resetStageActive ? "Create New Password" : "Forgot Password"}</h2><p>{resetStageActive ? "Enter the OTP and choose a strong password." : "We will send a verification code to reset your password."}</p></div>
          <AlertMessage type={alert.type} message={alert.message} />
          {!resetStageActive ? (
            <form className="auth-v2-stack" onSubmit={requestOtp}>
              <label className="auth-v2-field"><span>Society Code</span><input value={request.societyCode} onChange={(e) => setRequest((p) => ({ ...p, societyCode: e.target.value.trim().toUpperCase() }))} required /></label>
              <label className="auth-v2-field"><span>Email / Mobile</span><input value={request.email} onChange={(e) => setRequest((p) => ({ ...p, email: e.target.value.trim() }))} required /></label>
              <button className="auth-v2-submit" disabled={loading === "request"}>{loading === "request" ? "Sending..." : "Send OTP"}</button>
            </form>
          ) : (
            <form className="auth-v2-stack" onSubmit={submitReset}>
              <label className="auth-v2-field"><span>6 Digit OTP</span><input value={reset.otp} onChange={(e) => setReset((p) => ({ ...p, otp: e.target.value.replace(/\D/g, "").slice(0, 6) }))} inputMode="numeric" required /></label>
              <label className="auth-v2-field"><span>New Password</span><input type="password" value={reset.newPassword} onChange={(e) => setReset((p) => ({ ...p, newPassword: e.target.value }))} required /></label>
              <div className="auth-v2-strength"><span style={{ width: `${resetScore * 25}%` }} /><em>{["Weak", "Fair", "Good", "Strong"][Math.max(resetScore - 1, 0)]} password</em></div>
              <label className="auth-v2-field"><span>Confirm Password</span><input type="password" value={reset.confirmPassword} onChange={(e) => setReset((p) => ({ ...p, confirmPassword: e.target.value }))} required /></label>
              <button className="auth-v2-submit" disabled={loading === "reset"}>{loading === "reset" ? "Updating..." : "Update Password"}</button>
              <button type="button" className="auth-v2-ghost" onClick={() => setReset((prev) => ({ ...prev, email: "" }))}>Use different contact</button>
            </form>
          )}
          <p className="auth-v2-bottom"><Link to="/login">Back To Login</Link></p>
        </Motion.div>
      </section>
    </main>
  );
}
