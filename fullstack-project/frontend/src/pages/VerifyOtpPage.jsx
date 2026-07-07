import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import AlertMessage from "../components/AlertMessage";
import BrandLogo from "../components/BrandLogo";
import NexoraAuthVisual from "../components/NexoraAuthVisual";
import { BRAND } from "../config/brand";
import { getApiMessage, resendVerificationOtp, verifyEmailOtp } from "../services/authApi";

const Motion = motion;
const OTP_LENGTH = 6;

function getStoredSocietyCode() {
  return (
    sessionStorage.getItem("otpSocietyCode") ||
    localStorage.getItem("otpSocietyCode") ||
    localStorage.getItem("societyCode") ||
    ""
  );
}

function persistSocietyCode(value) {
  const societyCode = String(value || "").trim().toUpperCase();
  if (!societyCode) return;
  sessionStorage.setItem("otpSocietyCode", societyCode);
  localStorage.setItem("otpSocietyCode", societyCode);
  localStorage.setItem("societyCode", societyCode);
}

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const emailParam = params.get("email") || "";
  const societyCodeParam = params.get("societyCode") || location.state?.societyCode || getStoredSocietyCode();
  const [email, setEmail] = useState(emailParam);
  const [societyCode, setSocietyCode] = useState(() => String(societyCodeParam || "").trim().toUpperCase());
  const [otpValues, setOtpValues] = useState(() => Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const inputRefs = useRef([]);
  const otp = otpValues.join("");

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (societyCode) persistSocietyCode(societyCode);
  }, [societyCode]);

  function setOtpFromIndex(index, rawValue) {
    const digits = rawValue.replace(/\D/g, "");
    if (!digits) {
      setOtpValues((current) => current.map((value, itemIndex) => (itemIndex === index ? "" : value)));
      return;
    }

    setOtpValues((current) => {
      const next = [...current];
      digits.slice(0, OTP_LENGTH - index).split("").forEach((digit, offset) => {
        next[index + offset] = digit;
      });
      return next;
    });

    const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  }

  function handleOtpKeyDown(index, event) {
    if (event.key === "Backspace" && !otpValues[index] && index > 0) {
      event.preventDefault();
      setOtpValues((current) => current.map((value, itemIndex) => (itemIndex === index - 1 ? "" : value)));
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(index, event) {
    event.preventDefault();
    setOtpFromIndex(index, event.clipboardData.getData("text"));
  }

  function resetOtp() {
    setOtpValues(Array(OTP_LENGTH).fill(""));
    window.setTimeout(() => inputRefs.current[0]?.focus(), 0);
  }

  async function verify(event) {
    event.preventDefault();
    const normalizedSocietyCode = societyCode.trim().toUpperCase();
    if (!email || otp.length !== OTP_LENGTH || !normalizedSocietyCode) {
      setAlert({ type: "error", message: "Email, society code and 6 digit OTP are required." });
      return;
    }

    try {
      setLoading(true);
      persistSocietyCode(normalizedSocietyCode);
      const response = await verifyEmailOtp({ email: email.trim(), societyCode: normalizedSocietyCode, otp });
      setAlert({ type: "success", message: response.message || "Email verified successfully." });
      setVerified(true);
    } catch (error) {
      resetOtp();
      setAlert({ type: "error", message: getApiMessage(error, "OTP verification failed") });
    } finally {
      setLoading(false);
    }
  }

  async function resend(event) {
    event.preventDefault();
    const normalizedSocietyCode = societyCode.trim().toUpperCase();
    if (!email || !normalizedSocietyCode) {
      setAlert({ type: "error", message: "Email and society code are required to resend OTP." });
      return;
    }

    try {
      setResending(true);
      persistSocietyCode(normalizedSocietyCode);
      const response = await resendVerificationOtp({ email: email.trim(), societyCode: normalizedSocietyCode });
      resetOtp();
      setCountdown(60);
      setAlert({ type: "success", message: response.message || "Verification OTP sent." });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Failed to resend OTP") });
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="auth-v2 auth-v2-otp">
      <section className="auth-v2-art">
        <div className="nexora-auth-brand"><BrandLogo to={null} variant="full" /></div>
        <NexoraAuthVisual type="otp" />
        <div className="auth-v2-art-copy">
          <em>Secure Verification</em>
          <h1>Secure Verification</h1>
          <p>We have sent a 6 digit verification code to your registered email {email || "address"}.</p>
        </div>
        <div className="auth-v2-illustration">
          <div><span>&check;</span><strong>Protected</strong></div>
          <div><span>&check;</span><strong>Verified</strong></div>
          <div><span>&check;</span><strong>Encrypted</strong></div>
        </div>
      </section>
      <section className="auth-v2-form-zone">
        {!verified ? (
          <Motion.form className="auth-v2-card auth-v2-otp-card" onSubmit={verify} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            <div className="auth-v2-heading"><span>Security Shield</span><h2>Verify Your OTP</h2><p>Enter the 6 digit code sent to your email.</p></div>
            <AlertMessage type={alert.type} message={alert.message} />
            <label className="auth-v2-field">
              <span>Society Code</span>
              <input
                value={societyCode}
                onChange={(event) => setSocietyCode(event.target.value.trim().toUpperCase())}
                placeholder="e.g. GREEN-01"
                autoComplete="organization"
              />
            </label>
            <div className="auth-v2-contact-card">
              <span>Registered Email / Mobile</span>
              <strong>{email || "Enter your registered contact"}</strong>
            </div>
            {!emailParam ? (
              <label className="auth-v2-field">
                <span>Registered Contact</span>
                <input value={email} onChange={(event) => setEmail(event.target.value.trim())} />
              </label>
            ) : null}
            <div className="auth-v2-otp-boxes">
              {otpValues.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => { inputRefs.current[index] = node; }}
                  aria-label={`OTP digit ${index + 1}`}
                  value={digit}
                  onChange={(event) => setOtpFromIndex(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  onPaste={(event) => handleOtpPaste(index, event)}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={OTP_LENGTH}
                />
              ))}
            </div>
            <button className="auth-v2-submit" disabled={loading || otp.length !== OTP_LENGTH || !societyCode.trim() || !email.trim()}>{loading ? "Verifying..." : "Verify OTP"}</button>
            <button type="button" className="auth-v2-ghost" onClick={resend} disabled={countdown > 0 || resending || !societyCode.trim() || !email.trim()}>{resending ? "Sending..." : countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}</button>
            <p className="auth-v2-bottom"><Link to="/login">Change Contact</Link></p>
          </Motion.form>
        ) : (
          <Motion.div className="auth-v2-card auth-v2-success-card" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="auth-v2-success-icon">&check;</div>
            <h1>Email Verified</h1>
            <p>Welcome to {BRAND.name}. Your verification is complete and your account is ready.</p>
            <div className="auth-v2-code-context"><span>Status</span><strong>Verified and secure</strong></div>
            <button className="auth-v2-submit" onClick={() => navigate(`/login?email=${encodeURIComponent(email)}&societyCode=${encodeURIComponent(societyCode)}&verified=true`)}>Continue To Dashboard</button>
            <div className="auth-v2-success-actions"><button type="button" onClick={resend}>Resend Email</button><button type="button" onClick={() => setVerified(false)}>Change Email</button></div>
          </Motion.div>
        )}
      </section>
    </main>
  );
}
