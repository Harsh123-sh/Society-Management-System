import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import AuthLayout from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthButton from "../components/AuthButton";
import AuthLink from "../components/AuthLink";
import { getApiMessage, resendVerificationOtp, verifyEmailOtp } from "../services/authApi";

function VerifyOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const societyCodeParam = searchParams.get("societyCode") || "";

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [countdown, setCountdown] = useState(0);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return undefined;

    const timer = window.setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  function validateEmail() {
    if (!email) return "Email is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";

    return null;
  }

  function validateInputs() {
    const emailError = validateEmail();
    if (emailError) return emailError;

    if (!otp) return "OTP is required";
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) return "OTP must be a 6-digit number";

    return null;
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    const validationError = validateInputs();
    if (validationError) {
      setAlert({ type: "error", message: validationError });
      return;
    }

    if (verificationAttempts >= 5) {
      setAlert({
        type: "error",
        message: "Maximum verification attempts exceeded. Please request a new OTP.",
      });
      return;
    }

    try {
      setLoading(true);
      const trimmedEmail = email.trim();
      if (!societyCodeParam) {
        throw new Error("Society code is required for OTP verification.");
      }
      const response = await verifyEmailOtp({ email: trimmedEmail, otp, societyCode: societyCodeParam });

      setAlert({
        type: "success",
        message: response.message || "Email verified successfully.",
      });
      setIsVerified(true);

      window.setTimeout(() => {
        const query = new URLSearchParams({
          email: trimmedEmail,
          verified: "true",
        });

        if (societyCodeParam) {
          query.set("societyCode", societyCodeParam);
        }

        navigate(`/login?${query.toString()}`, { replace: true });
      }, 2000);
    } catch (error) {
      const newAttempts = verificationAttempts + 1;
      const remainingAttempts = 5 - newAttempts;

      setVerificationAttempts(newAttempts);
      setOtp("");
      setAlert({
        type: "error",
        message:
          getApiMessage(error, "OTP verification failed") +
          (remainingAttempts > 0 ? ` (${remainingAttempts} attempts remaining)` : " (Maximum attempts reached)"),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    const emailError = validateEmail();
    if (emailError) {
      setAlert({ type: "error", message: emailError });
      return;
    }

    try {
      setResendLoading(true);
      if (!societyCodeParam) {
        throw new Error("Society code is required to resend the OTP.");
      }
      const response = await resendVerificationOtp({ email: email.trim(), societyCode: societyCodeParam });

      setOtp("");
      setOtpSent(true);
      setCountdown(60);
      setVerificationAttempts(0);
      setAlert({
        type: "success",
        message: response.message || "Verification OTP sent.",
      });
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Failed to resend OTP"),
      });
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the 6-digit OTP sent to your email address. OTPs expire after 10 minutes."
    >
      <AlertMessage type={alert.type} message={alert.message} />

      {!isVerified ? (
        <>
          <form className="space-y-5" onSubmit={handleVerifyOtp}>
            <AuthInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(value) => setEmail(value.trim())}
              autoComplete="email"
              required
              disabled={Boolean(emailParam)}
              helperText={emailParam ? "Email selected from login recovery" : ""}
            />

            {societyCodeParam && (
              <div
                className="rounded-2xl border px-4 py-3 text-sm"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              >
                <span style={{ color: "var(--text-muted)" }}>Society Code: </span>
                <strong>{societyCodeParam}</strong>
              </div>
            )}

            <div
              className="rounded-2xl border p-4"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <label className="mb-2 block text-sm font-medium text-[var(--text)]" htmlFor="email-otp">
                OTP Code
              </label>
              <input
                id="email-otp"
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                placeholder="000000"
                className="w-full rounded-xl border px-4 py-3 text-center text-2xl font-bold tracking-[0.32em] transition focus:outline-none focus:ring-2 focus:ring-cyan-400"
                style={{
                  backgroundColor: "var(--input-bg)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
                required
                autoComplete="one-time-code"
                inputMode="numeric"
                aria-describedby="email-otp-help"
                disabled={loading}
              />
              <p id="email-otp-help" className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                Enter the 6-digit code sent to {email || "your email"}.
              </p>
            </div>

            <AuthButton type="submit" loading={loading} disabled={loading || otp.length !== 6}>
              {loading ? "Verifying OTP..." : "Verify OTP"}
            </AuthButton>
          </form>

          <div className="mt-6 space-y-4 border-t pt-6" style={{ borderColor: "var(--border)" }}>
            <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
              Didn't receive the OTP?
            </p>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={countdown > 0 || resendLoading}
              className="w-full rounded-xl border px-4 py-3 text-sm font-semibold transition hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
              aria-live="polite"
            >
              {resendLoading
                ? "Sending OTP..."
                : countdown > 0
                  ? `Resend OTP in ${countdown}s`
                  : otpSent
                    ? "Resend OTP"
                    : "Send OTP"}
            </button>
          </div>

          <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            Wrong email?{" "}
            <AuthLink to="/login" className="font-semibold text-[var(--text)]">
              Back to login
            </AuthLink>
          </p>
        </>
      ) : (
        <div className="space-y-4 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/20">
            <svg className="h-8 w-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-[var(--text)]">Email verified successfully.</h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Your email has been verified. You will be redirected to login now.
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Redirecting in a moment...
          </p>
        </div>
      )}
    </AuthLayout>
  );
}

export default VerifyOtpPage;
