import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import AlertMessage from "../components/AlertMessage";
import BrandLogo from "../components/BrandLogo";
import NexoraAuthVisual from "../components/NexoraAuthVisual";
import {
  getApiMessage,
  registerChairman,
  resendChairmanOtp,
  validateChairmanSociety,
  verifyChairmanOtp,
} from "../services/authApi";

const Motion = motion;
const OTP_LENGTH = 6;

function getStoredSocietyCode() {
  return (
    new URLSearchParams(window.location.search).get("societyCode") ||
    sessionStorage.getItem("otpSocietyCode") ||
    localStorage.getItem("otpSocietyCode") ||
    localStorage.getItem("societyCode") ||
    ""
  ).trim().toUpperCase();
}

function saveSocietyCode(value) {
  const societyCode = String(value || "").trim().toUpperCase();
  if (!societyCode) return;
  sessionStorage.setItem("otpSocietyCode", societyCode);
  localStorage.setItem("otpSocietyCode", societyCode);
  localStorage.setItem("societyCode", societyCode);
}

export default function ChairmanRegisterPage() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    societyCode: searchParams.get("societyCode")?.trim().toUpperCase() || getStoredSocietyCode(),
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [society, setSociety] = useState(null);
  const [checkingSociety, setCheckingSociety] = useState(false);
  const [societyMessage, setSocietyMessage] = useState("");
  const [otpValues, setOtpValues] = useState(() => Array(OTP_LENGTH).fill(""));
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const otpRefs = useRef([]);
  const otp = otpValues.join("");

  useEffect(() => {
    const societyCode = form.societyCode.trim().toUpperCase();
    setSociety(null);
    setSocietyMessage("");
    if (societyCode.length < 2) return undefined;
    saveSocietyCode(societyCode);

    const timer = window.setTimeout(async () => {
      try {
        setCheckingSociety(true);
        const response = await validateChairmanSociety(societyCode);
        setSociety(response.data);
        setSocietyMessage(response.message || "Society verified.");
      } catch (error) {
        setSociety(null);
        setSocietyMessage(getApiMessage(error, "Invalid society code."));
      } finally {
        setCheckingSociety(false);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [form.societyCode]);

  useEffect(() => {
    if (step === "otp") {
      otpRefs.current[0]?.focus();
    }
  }, [step]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: field === "societyCode" ? value.trim().toUpperCase() : value,
    }));
  }

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

    otpRefs.current[Math.min(index + digits.length, OTP_LENGTH - 1)]?.focus();
  }

  function handleOtpKeyDown(index, event) {
    if (event.key === "Backspace" && !otpValues[index] && index > 0) {
      event.preventDefault();
      setOtpValues((current) => current.map((value, itemIndex) => (itemIndex === index - 1 ? "" : value)));
      otpRefs.current[index - 1]?.focus();
    }
  }

  function resetOtp() {
    setOtpValues(Array(OTP_LENGTH).fill(""));
    window.setTimeout(() => otpRefs.current[0]?.focus(), 0);
  }

  async function submitRegistration(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    if (!society) {
      setAlert({ type: "error", message: "Enter a valid society code before registering." });
      return;
    }
    if (!form.name || !form.email || !form.mobile || !form.password || !form.confirmPassword) {
      setAlert({ type: "error", message: "Please complete all fields." });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setAlert({ type: "error", message: "Passwords do not match." });
      return;
    }

    try {
      setLoading(true);
      const response = await registerChairman({
        societyCode: form.societyCode,
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: "chairman",
      });
      setAlert({ type: "success", message: response.message || "OTP sent for Chairman registration." });
      setStep("otp");
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Chairman registration failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function submitOtp(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });
    if (otp.length !== OTP_LENGTH) {
      setAlert({ type: "error", message: "Enter the 6 digit OTP." });
      return;
    }

    try {
      setLoading(true);
      const response = await verifyChairmanOtp({
        societyCode: form.societyCode,
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        otp,
        role: "chairman",
      });
      setAlert({ type: "success", message: response.message || "Registration submitted. Waiting for Super Admin approval." });
      setStep("done");
    } catch (error) {
      resetOtp();
      setAlert({ type: "error", message: getApiMessage(error, "OTP verification failed.") });
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    try {
      setResending(true);
      const response = await resendChairmanOtp({
        societyCode: form.societyCode,
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        role: "chairman",
      });
      resetOtp();
      setAlert({ type: "success", message: response.message || "Verification OTP sent." });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Failed to resend OTP.") });
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="auth-v2 auth-v2-register">
      <section className="auth-v2-onboarding">
        <div className="nexora-auth-brand"><BrandLogo to={null} variant="full" /></div>
        <NexoraAuthVisual type="register" />
        <div className="auth-v2-art-copy">
          <em>Chairman Onboarding</em>
          <h1>Chairman Registration</h1>
          <p>Complete the society-linked registration submitted by the Super Admin.</p>
        </div>
      </section>

      <Motion.form className="auth-v2-card auth-v2-register-card auth-v2-step-card" onSubmit={step === "otp" ? submitOtp : submitRegistration} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-v2-heading">
          <span>Role: Chairman</span>
          <h2>{step === "otp" ? "Verify OTP" : step === "done" ? "Submitted" : "Create Chairman Account"}</h2>
          <p>{society?.name || "Enter your assigned society code."}</p>
        </div>
        <AlertMessage type={alert.type} message={alert.message} />

        {step === "done" ? (
          <div className="auth-v2-review">
            <div><span>Status</span><strong>Registration submitted</strong></div>
            <div><span>Approval</span><strong>Waiting for Super Admin approval</strong></div>
            <div><span>Society</span><strong>{society?.name || form.societyCode}</strong></div>
            <div><span>Role</span><strong>Chairman</strong></div>
          </div>
        ) : null}

        {step === "form" ? (
          <>
            <label className="auth-v2-field"><span>Society Code</span><input value={form.societyCode} onChange={(event) => updateField("societyCode", event.target.value)} placeholder="e.g. GREEN-01" /></label>
            {form.societyCode ? <div className={`auth-v2-verify ${society ? "is-ok" : ""}`}><strong>{checkingSociety ? "Checking society..." : society ? "Society verified" : "Society validation"}</strong><span>{societyMessage || "Enter the society code created by Super Admin."}</span></div> : null}
            <label className="auth-v2-field"><span>Full Name</span><input value={form.name} onChange={(event) => updateField("name", event.target.value)} /></label>
            <label className="auth-v2-field"><span>Email</span><input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value.trim())} /></label>
            <label className="auth-v2-field"><span>Mobile Number</span><input value={form.mobile} onChange={(event) => updateField("mobile", event.target.value.replace(/[^\d+ -]/g, ""))} /></label>
            <div className="auth-v2-two">
              <label className="auth-v2-field"><span>Password</span><input type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} /></label>
              <label className="auth-v2-field"><span>Confirm Password</span><input type="password" value={form.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} /></label>
            </div>
            <button className="auth-v2-submit" disabled={loading || !society}>{loading ? "Sending OTP..." : "Send OTP"}</button>
          </>
        ) : null}

        {step === "otp" ? (
          <>
            <div className="auth-v2-contact-card">
              <span>Chairman Account</span>
              <strong>{form.email}</strong>
            </div>
            <div className="auth-v2-otp-boxes">
              {otpValues.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => { otpRefs.current[index] = node; }}
                  aria-label={`OTP digit ${index + 1}`}
                  value={digit}
                  onChange={(event) => setOtpFromIndex(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  onPaste={(event) => {
                    event.preventDefault();
                    setOtpFromIndex(index, event.clipboardData.getData("text"));
                  }}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={OTP_LENGTH}
                />
              ))}
            </div>
            <button className="auth-v2-submit" disabled={loading || otp.length !== OTP_LENGTH}>{loading ? "Verifying..." : "Verify OTP"}</button>
            <button type="button" className="auth-v2-ghost" disabled={resending} onClick={resendOtp}>{resending ? "Sending..." : "Resend OTP"}</button>
          </>
        ) : null}

        <p className="auth-v2-bottom">Already approved? <Link to="/login">Sign in</Link></p>
      </Motion.form>
    </main>
  );
}
