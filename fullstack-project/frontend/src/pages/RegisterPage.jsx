import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import AlertMessage from "../components/AlertMessage";
import BrandLogo from "../components/BrandLogo";
import NexoraAuthVisual from "../components/NexoraAuthVisual";
import { fetchSocietyByCode, getApiMessage, registerUser } from "../services/authApi";

const roles = ["secretary", "owner", "tenant", "staff", "security"];
const roleDescriptions = {
  secretary: "Manage society operations",
  owner: "Access owner services",
  tenant: "Use resident workflows",
  staff: "Track assigned work",
  security: "Handle gate operations",
};
const steps = ["Basic Information", "Society Information", "Security Setup", "Create Account"];
const Motion = motion;

function saveOtpSocietyCode(value) {
  const societyCode = String(value || "").trim().toUpperCase();
  if (!societyCode) return;
  sessionStorage.setItem("otpSocietyCode", societyCode);
  localStorage.setItem("otpSocietyCode", societyCode);
  localStorage.setItem("societyCode", societyCode);
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: "", mobile: "", email: "", societyCode: searchParams.get("societyCode") || "", role: "owner", password: "", confirmPassword: "" });
  const [society, setSociety] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [step, setStep] = useState(0);
  const score = [form.password.length >= 8, /[A-Z]/.test(form.password), /\d/.test(form.password), /[^A-Za-z0-9]/.test(form.password)].filter(Boolean).length;
  const canGoNext = [
    Boolean(form.name && form.mobile && form.email),
    Boolean(form.societyCode),
    Boolean(form.password && form.confirmPassword),
    accepted,
  ][step];

  useEffect(() => {
    if (form.societyCode.length < 2) {
      setSociety(null);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        setChecking(true);
        const response = await fetchSocietyByCode(form.societyCode);
        setSociety(response.data);
      } catch {
        setSociety(null);
      } finally {
        setChecking(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [form.societyCode]);

  async function handleSubmit(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });
    if (!form.name || !form.mobile || !form.email || !form.societyCode || !form.role || !form.password || !form.confirmPassword) {
      setAlert({ type: "error", message: "Please complete all registration steps." });
      return;
    }
    if (!accepted) {
      setAlert({ type: "error", message: "Please accept the Terms & Conditions." });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setAlert({ type: "error", message: "Passwords do not match." });
      return;
    }
    try {
      setLoading(true);
      const normalizedSocietyCode = form.societyCode.trim().toUpperCase();
      saveOtpSocietyCode(normalizedSocietyCode);
      const response = await registerUser({ name: form.name, phone: form.mobile, mobile: form.mobile, email: form.email, password: form.password, societyCode: normalizedSocietyCode, role: form.role });
      setAlert({ type: "success", message: response.message || "Account created." });
      navigate(`/verify-otp?email=${encodeURIComponent(form.email)}&societyCode=${encodeURIComponent(normalizedSocietyCode)}`, { state: { email: form.email, societyCode: normalizedSocietyCode } });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Registration failed") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-v2 auth-v2-register">
      <section className="auth-v2-onboarding">
        <div className="nexora-auth-brand"><BrandLogo to={null} variant="full" /></div>
        <NexoraAuthVisual type="register" />
        <div className="auth-v2-steps">{steps.map((item, index) => <i key={item} className={index <= step ? "is-active" : ""} />)}</div>
        <div className="auth-v2-art-copy">
          <em>Join the Nexora Network</em>
          <h1>Join the Nexora Network</h1>
          <p>Create your account and join thousands of societies already using Nexora.</p>
        </div>
        <div className="auth-v2-benefits">{["Secure Access", "Multi-Society", "AI Powered", "Real-Time Analytics"].map((item) => <span key={item}><b>✓</b>{item}</span>)}</div>
      </section>

      <Motion.form className="auth-v2-card auth-v2-register-card auth-v2-step-card" onSubmit={handleSubmit} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-v2-heading"><span>Step {step + 1} of 4</span><h2>{steps[step]}</h2><p>Tell us who you are and where you belong.</p></div>
        <div className="auth-v2-stepper" aria-label="Registration progress">
          {steps.map((item, index) => (
            <button key={item} type="button" className={index === step ? "is-active" : index < step ? "is-done" : ""} onClick={() => setStep(index)}>
              <span>{index + 1}</span>
              <strong>{item}</strong>
            </button>
          ))}
        </div>
        <AlertMessage type={alert.type} message={alert.message} />

        <div className="auth-v2-step-panel">
          <div className={step === 0 ? "auth-v2-step-section is-active" : "auth-v2-step-section"}>
            <div className="auth-v2-two"><label className="auth-v2-field"><span>Full Name</span><input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></label><label className="auth-v2-field"><span>Mobile Number</span><input value={form.mobile} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value.replace(/[^\d+ -]/g, "") }))} required /></label></div>
            <label className="auth-v2-field"><span>Email Address</span><input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value.trim() }))} required /></label>
          </div>

          <div className={step === 1 ? "auth-v2-step-section is-active" : "auth-v2-step-section"}>
            <label className="auth-v2-field"><span>Society Code</span><input value={form.societyCode} onChange={(e) => setForm((p) => ({ ...p, societyCode: e.target.value.trim().toUpperCase() }))} required /></label>
            <div className={`auth-v2-verify ${society ? "is-ok" : ""}`}><strong>{checking ? "Checking society..." : society ? "Society verified" : "Society verification"}</strong><span>{society?.name || society?.society_name || "Enter your active society code to connect your account."}</span></div>
            <div className="auth-v2-role-title"><span>Choose your role</span><strong>{form.role}</strong></div>
            <div className="auth-v2-role-grid auth-v2-role-grid--cards">{roles.map((role) => <button key={role} type="button" className={form.role === role ? "is-active" : ""} onClick={() => setForm((p) => ({ ...p, role }))}><strong>{role}</strong><span>{roleDescriptions[role]}</span></button>)}</div>
          </div>

          <div className={step === 2 ? "auth-v2-step-section is-active" : "auth-v2-step-section"}>
            <div className="auth-v2-two"><label className="auth-v2-field"><span>Password</span><input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required /></label><label className="auth-v2-field"><span>Confirm Password</span><input type="password" value={form.confirmPassword} onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))} required /></label></div>
            <div className="auth-v2-strength"><span style={{ width: `${score * 25}%` }} /><em>{["Weak", "Fair", "Good", "Strong"][Math.max(score - 1, 0)]} password</em></div>
          </div>

          <div className={step === 3 ? "auth-v2-step-section is-active" : "auth-v2-step-section"}>
            <div className="auth-v2-review">
              <div><span>Name</span><strong>{form.name || "Required"}</strong></div>
              <div><span>Contact</span><strong>{form.email || form.mobile || "Required"}</strong></div>
              <div><span>Society</span><strong>{society?.name || society?.society_name || form.societyCode || "Required"}</strong></div>
              <div><span>Role</span><strong>{form.role}</strong></div>
            </div>
            <label className="auth-v2-terms"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /><span>I agree to the Privacy Policy and Terms & Conditions.</span></label>
            <button className="auth-v2-submit" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
          </div>
        </div>

        <div className="auth-v2-step-actions">
          <button type="button" className="auth-v2-ghost" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>Back</button>
          {step < 3 ? <button type="button" className="auth-v2-submit" disabled={!canGoNext} onClick={() => setStep((current) => Math.min(3, current + 1))}>Continue</button> : null}
        </div>
        <p className="auth-v2-bottom">
          <Link to="/chairman/register">Register as Chairman</Link>
          <span> | </span>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </Motion.form>
    </main>
  );
}
