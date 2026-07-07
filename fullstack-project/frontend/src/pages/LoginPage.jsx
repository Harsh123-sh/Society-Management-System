import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AlertMessage from "../components/AlertMessage";
import BrandLogo from "../components/BrandLogo";
import NexoraAuthVisual from "../components/NexoraAuthVisual";
import { getApiMessage, loginUser } from "../services/authApi";
import { getBackendBaseUrl } from "../services/runtimeUrls";
import {
  clearAuthSession,
  clearSuperAdminSession,
  clearSelectedSociety,
  getRoleHomePath,
  getSelectedSociety,
  getStoredRole,
  hasRequiredSocietyContext,
  isValidAuthToken,
  saveAuthSession,
  saveSelectedSociety,
} from "../utils/session";

const Motion = motion;

function resolveSocietyCode(selectedSociety, formSocietyCode = "") {
  const typedCode = String(formSocietyCode || "").trim();
  if (typedCode) return typedCode.toUpperCase();

  const selectedCode =
    selectedSociety?.code ||
    selectedSociety?.societyCode ||
    selectedSociety?.society_code ||
    "";
  const candidate = String(selectedCode).trim();

  if (candidate && candidate === String(selectedSociety?.id || "").trim() && /^\d+$/.test(candidate)) {
    return "";
  }

  return candidate.toUpperCase();
}

function saveOtpSocietyCode(value) {
  const societyCode = String(value || "").trim().toUpperCase();
  if (!societyCode) return;
  sessionStorage.setItem("otpSocietyCode", societyCode);
  localStorage.setItem("otpSocietyCode", societyCode);
  localStorage.setItem("societyCode", societyCode);
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "", societyCode: "" });
  const [selectedSociety, setSelectedSociety] = useState(() => getSelectedSociety() || null);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState("");
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const token = localStorage.getItem("token");
  const storedRole = getStoredRole();

  useEffect(() => clearSuperAdminSession(), []);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const societyCode = params.get("societyCode");
    const email = params.get("email");
    const oauthError = params.get("oauth_error");
    const oauthDebug = params.get("oauth_debug");
    if (email) setForm((prev) => ({ ...prev, email }));
    if (params.get("verified") === "true") setAlert({ type: "success", message: "Email verified successfully." });
    if (oauthError) {
      setAlert({
        type: "error",
        message: `${oauthError}${import.meta.env.DEV && oauthDebug ? ` Developer details: ${oauthDebug}` : ""}`,
      });
    }
    if (location.state?.message) setAlert({ type: "error", message: location.state.message });
    const storedLoginError = sessionStorage.getItem("loginErrorMessage");
    if (storedLoginError) {
      setAlert({ type: "error", message: storedLoginError });
      sessionStorage.removeItem("loginErrorMessage");
    }
    const storedLoginSuccess = sessionStorage.getItem("loginSuccessMessage");
    if (storedLoginSuccess) {
      setAlert({ type: "success", message: storedLoginSuccess });
      sessionStorage.removeItem("loginSuccessMessage");
    }
    if (societyCode) {
      const normalizedSocietyCode = societyCode.trim().toUpperCase();
      const society = { id: normalizedSocietyCode, code: normalizedSocietyCode, societyCode: normalizedSocietyCode, name: normalizedSocietyCode };
      saveSelectedSociety(society);
      setSelectedSociety(society);
      setForm((prev) => ({ ...prev, societyCode: normalizedSocietyCode }));
    }
  }, [location.search, location.state]);

  if (isValidAuthToken(token)) return <Navigate to={getRoleHomePath(storedRole)} replace />;

  const loginSocietyCode = resolveSocietyCode(selectedSociety, form.societyCode);
  const canSubmit = form.email && form.password && loginSocietyCode;
  const otpEmail = unverifiedEmail || form.email;
  const otpSocietyCode = loginSocietyCode;
  const otpPath = `/verify-otp?email=${encodeURIComponent(otpEmail)}&societyCode=${encodeURIComponent(otpSocietyCode)}`;

  async function handleSubmit(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });
    if (!canSubmit) {
      setAlert({ type: "error", message: "Email, password and society code are required." });
      return;
    }
    try {
      setLoading(true);
      const payload = {
        email: form.email.trim(),
        password: form.password,
        societyCode: loginSocietyCode,
      };
      saveOtpSocietyCode(loginSocietyCode);
      clearAuthSession();
      clearSelectedSociety();
      const response = await loginUser(payload);
      const user = response.user || response.data;
      if (!hasRequiredSocietyContext(user)) {
        clearAuthSession();
        clearSelectedSociety();
        setAlert({ type: "error", message: "Society access not found. Please login again." });
        return;
      }
      saveAuthSession({
        accessToken: response.accessToken || response.access_token || response.token,
        refreshToken: response.refreshToken || response.refresh_token,
        user,
        societyId: user?.societyId || user?.society_id,
        societyName: user?.societyName || user?.society_name,
      });
      if (remember) localStorage.setItem("rememberedLoginEmail", form.email);
      navigate(getRoleHomePath(user?.role), { replace: true });
    } catch (error) {
      const data = error?.response?.data || {};
      if (data.code === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(data.email || form.email);
        setAlert({ type: "error", message: "Please verify your email before login." });
      } else {
        setAlert({ type: "error", message: getApiMessage(error, "Login failed") });
      }
    } finally {
      setLoading(false);
    }
  }

  function completeOAuthLogin(response) {
    if (response.requiresProfileCompletion) {
      sessionStorage.setItem(
        "oauthCompletion",
        JSON.stringify({ completionToken: response.completionToken, profile: response.profile })
      );
      navigate("/auth/complete-profile", { replace: true });
      return;
    }

    const user = response.user || response.data;
    const accessToken = response.accessToken || response.access_token || response.token;
    if (!accessToken || !hasRequiredSocietyContext(user)) {
      clearAuthSession();
      clearSelectedSociety();
      setAlert({ type: "error", message: "Society access not found. Please login again." });
      return;
    }

    saveAuthSession({
      accessToken,
      refreshToken: response.refreshToken || response.refresh_token,
      user,
      societyId: user?.societyId || user?.society_id,
      societyName: user?.societyName || user?.society_name,
    });
    navigate(getRoleHomePath(user?.role), { replace: true });
  }

  function requestBackendOAuthResult(provider) {
    const params = new URLSearchParams();
    const societyCode = loginSocietyCode;
    if (societyCode) params.set("societyCode", societyCode);
    const popup = window.open(
      `${getBackendBaseUrl()}/api/auth/${provider}${params.toString() ? `?${params.toString()}` : ""}`,
      `nexora${provider}OAuth`,
      "width=520,height=680,menubar=no,toolbar=no,status=no"
    );
    if (!popup) return Promise.reject(new Error(`${provider === "microsoft" ? "Microsoft" : "Google"} login popup was blocked.`));

    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        window.removeEventListener("message", handleMessage);
        popup.close();
        reject(new Error(`${provider === "microsoft" ? "Microsoft" : "Google"} login failed.`));
      }, 120000);

      function handleMessage(event) {
        if (event.origin !== getBackendBaseUrl() || event.data?.type !== "nexora-backend-oauth-callback") return;
        window.clearTimeout(timeout);
        window.removeEventListener("message", handleMessage);
        if (!event.data.success) {
          const error = new Error(event.data.message || `${provider === "microsoft" ? "Microsoft" : "Google"} login failed.`);
          error.code = event.data.code;
          error.missing = event.data.missing || [];
          error.warnings = event.data.warnings || [];
          error.debugMessage = event.data.debugMessage || "";
          reject(error);
          return;
        }
        resolve(event.data);
      }

      window.addEventListener("message", handleMessage);
    });
  }

  async function handleOAuthLogin(provider) {
    const providerLabel = provider === "microsoft" ? "Microsoft" : "Google";
    setAlert({ type: "", message: "" });
    setOauthLoading(provider);
    clearAuthSession();
    clearSelectedSociety();
    try {
      const response = await requestBackendOAuthResult(provider);
      completeOAuthLogin(response);
    } catch (error) {
      const message = error?.response
        ? getApiMessage(error, `${providerLabel} login failed.`)
        : error?.message || `${providerLabel} login failed.`;
      const devHint = import.meta.env.DEV && error?.code === "OAUTH_CONFIGURATION_MISSING" && error?.missing?.length
        ? ` Developer setup: add ${error.missing.join(", ")} in backend .env and restart the backend.`
        : "";
      const warningHint = import.meta.env.DEV && error?.warnings?.length
        ? ` ${error.warnings.join(" ")}`
        : "";
      const debugHint = import.meta.env.DEV && error?.debugMessage
        ? ` Developer details: ${error.debugMessage}`
        : "";
      setAlert({ type: "error", message: `${message}${devHint}${warningHint}${debugHint}` });
    } finally {
      setOauthLoading("");
    }
  }

  const oauthDisabled = Boolean(oauthLoading || loading);

  return (
    <main className="auth-v2 auth-v2-login">
      <div className="nexora-login-bg" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <section className="auth-v2-art">
        <div className="nexora-login-brand"><BrandLogo to={null} variant="full" /></div>
        <NexoraAuthVisual type="login" />
        <Motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="auth-v2-art-copy">
          <h1>Manage Your Community Smarter</h1>
          <p>One intelligent platform to manage residents, visitors, security, maintenance, billing, and society operations.</p>
        </Motion.div>
        <div className="auth-v2-illustration">
          <div><span>✓</span><strong>Secure</strong></div>
          <div><span>✓</span><strong>Multi-Society</strong></div>
          <div><span>✓</span><strong>AI Powered</strong></div>
          <div><span>✓</span><strong>Real-Time</strong></div>
        </div>
        <div className="auth-v2-illustration auth-v2-illustration-premium">
          <div><span>&check;</span><strong>Secure Access</strong></div>
          <div><span>&check;</span><strong>Multi-Society</strong></div>
          <div><span>&check;</span><strong>AI Powered</strong></div>
          <div><span>&check;</span><strong>Real-Time Analytics</strong></div>
        </div>
      </section>

      <section className="auth-v2-form-zone">
        <Motion.form className="auth-v2-card" onSubmit={handleSubmit} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
          <div className="auth-v2-heading">
            <div className="nexora-form-logo" aria-hidden="true"><img src="/nexora-icon.png" alt="" /></div>
            <span>Secure Access</span>
            <h2>Welcome Back</h2>
            <p>Access your society dashboard</p>
          </div>
          <AlertMessage type={alert.type} message={alert.message} />
          {unverifiedEmail ? (
            <div className="auth-v2-warning" role="status">
              <strong>Email verification required</strong>
              <span>Verify {unverifiedEmail} to continue securely.</span>
            </div>
          ) : null}
          {selectedSociety ? (
            <div className="auth-v2-society"><span>Selected society</span><strong>{selectedSociety.name}</strong><button type="button" onClick={() => { clearSelectedSociety(); setSelectedSociety(null); setForm((p) => ({ ...p, societyCode: "" })); }}>Change</button></div>
          ) : (
            <label className="auth-v2-field"><span>Society Selector</span><input value={form.societyCode} onChange={(e) => setForm((p) => ({ ...p, societyCode: e.target.value.trim().toUpperCase() }))} placeholder="e.g. GREEN-01" /></label>
          )}
          <label className="auth-v2-field"><span>Email / Mobile Number</span><input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value.trim() }))} placeholder="name@society.com" autoComplete="email" /></label>
          <label className="auth-v2-field"><span>Password</span><div><input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Enter password" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? "Hide" : "Show"}</button></div></label>
          <div className="auth-v2-row"><label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label><Link to="/forgot-password">Forgot Password?</Link></div>
          <button className="auth-v2-submit" disabled={!canSubmit || loading}>{loading ? "Signing in..." : "Login"}</button>
          <button type="button" className="auth-v2-otp-action" onClick={() => { saveOtpSocietyCode(otpSocietyCode); navigate(otpPath, { state: { email: otpEmail, societyCode: otpSocietyCode } }); }}>
            <span>Need email verification?</span>
            <strong>Verify OTP</strong>
          </button>
          <div className="auth-v2-social-label"><span />Continue With<span /></div>
          <div className="auth-v2-social">
            <button type="button" className="auth-v2-social-btn" disabled={oauthDisabled} onClick={() => handleOAuthLogin("google")}>
              <span className="auth-v2-provider-icon auth-v2-provider-icon--google" aria-hidden="true">G</span>
              <strong>{oauthLoading === "google" ? "Connecting..." : "Continue with Google"}</strong>
              {oauthLoading === "google" ? <i aria-hidden="true" /> : null}
            </button>
            <button type="button" className="auth-v2-social-btn" disabled={oauthDisabled} onClick={() => handleOAuthLogin("microsoft")}>
              <span className="auth-v2-provider-icon auth-v2-provider-icon--microsoft" aria-hidden="true"><b /><b /><b /><b /></span>
              <strong>{oauthLoading === "microsoft" ? "Connecting..." : "Continue with Microsoft"}</strong>
              {oauthLoading === "microsoft" ? <i aria-hidden="true" /> : null}
            </button>
          </div>
          <p className="auth-v2-bottom">New here? <Link to="/register">Create account</Link></p>
        </Motion.form>
      </section>
    </main>
  );
}
