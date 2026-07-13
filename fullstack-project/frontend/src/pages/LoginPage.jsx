import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AlertMessage from "../components/AlertMessage";
import BrandLogo from "../components/BrandLogo";
import NexoraAuthVisual from "../components/NexoraAuthVisual";
import { fetchCurrentUser, fetchOAuthConfig, getApiMessage, loginUser, socialLogin } from "../services/authApi";
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

function hasOAuthClientId(value) {
  const normalized = String(value || "").trim();
  const normalizedLower = normalized.toLowerCase();
  if (!normalized) return false;
  if (["null", "undefined", "test", "demo", "placeholder"].includes(normalizedLower)) return false;
  if (normalizedLower.includes("_here") || normalizedLower.includes("-here")) return false;
  return !normalizedLower.includes("your_") && !normalizedLower.includes("your-");
}

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
  const [oauthConfig, setOauthConfig] = useState(null);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const token = localStorage.getItem("token");
  const storedRole = getStoredRole();

  useEffect(() => clearSuperAdminSession(), []);
  useEffect(() => {
    let active = true;
    fetchOAuthConfig()
      .then((response) => {
        if (active) setOauthConfig(response.data || response);
      })
      .catch(() => {
        if (active) setOauthConfig({ google: { enabled: false }, microsoft: { enabled: false } });
      });
    return () => {
      active = false;
    };
  }, []);
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
      const accessToken = response.accessToken || response.access_token || response.token;
      const initialUser = response.user || response.data;
      saveAuthSession({
        accessToken,
        refreshToken: response.refreshToken || response.refresh_token,
        user: initialUser,
        societyId: initialUser?.societyId || initialUser?.society_id,
        societyName: initialUser?.societyName || initialUser?.society_name,
      });
      const profileResponse = await fetchCurrentUser();
      const profileUser = profileResponse.user || profileResponse.data || {};
      const user = { ...initialUser, ...profileUser };
      if (!hasRequiredSocietyContext(user)) {
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

    const initialUser = response.user || response.data;
    const accessToken = response.accessToken || response.access_token || response.token;
    if (!accessToken || !hasRequiredSocietyContext(initialUser)) {
      clearAuthSession();
      clearSelectedSociety();
      setAlert({ type: "error", message: "Society access not found. Please login again." });
      return;
    }

    saveAuthSession({
      accessToken,
      refreshToken: response.refreshToken || response.refresh_token,
      user: initialUser,
      societyId: initialUser?.societyId || initialUser?.society_id,
      societyName: initialUser?.societyName || initialUser?.society_name,
    });
    fetchCurrentUser()
      .then((profileResponse) => {
        const profileUser = profileResponse.user || profileResponse.data || {};
        const user = { ...initialUser, ...profileUser };
        if (!hasRequiredSocietyContext(user)) {
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
      })
      .catch((error) => {
        clearAuthSession();
        clearSelectedSociety();
        setAlert({ type: "error", message: getApiMessage(error, "Login failed") });
      });
  }

  function getOAuthRedirectUri() {
    return `${window.location.origin}/oauth/popup-callback`;
  }

  function buildProviderOAuthUrl(provider) {
    const redirectUri = getOAuthRedirectUri();
    const state = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    sessionStorage.setItem(`oauthState:${provider}`, state);

    if (provider === "google") {
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "token",
        scope: "openid email profile",
        prompt: "select_account",
        state,
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    const params = new URLSearchParams({
      client_id: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "token",
      response_mode: "fragment",
      scope: "openid profile email User.Read",
      prompt: "select_account",
      state,
    });
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  function requestProviderAccessToken(provider) {
    const popup = window.open(
      buildProviderOAuthUrl(provider),
      `nexora${provider}OAuth`,
      "width=520,height=680,menubar=no,toolbar=no,status=no"
    );
    if (!popup) return Promise.reject(new Error(`${providerLabel(provider)} login popup was blocked.`));

    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        window.removeEventListener("message", handleMessage);
        popup.close();
        reject(new Error(`${providerLabel(provider)} login failed.`));
      }, 120000);

      function handleMessage(event) {
        if (event.origin !== window.location.origin || event.data?.type !== "nexora-frontend-oauth-token") return;
        const expectedState = sessionStorage.getItem(`oauthState:${provider}`);
        sessionStorage.removeItem(`oauthState:${provider}`);
        window.clearTimeout(timeout);
        window.removeEventListener("message", handleMessage);
        popup.close();

        if (!event.data.success || !event.data.accessToken) {
          reject(new Error(event.data.errorDescription || event.data.error || `${providerLabel(provider)} login failed.`));
          return;
        }
        if (expectedState && event.data.state !== expectedState) {
          reject(new Error("OAuth state mismatch. Please try again."));
          return;
        }
        resolve(event.data.accessToken);
      }

      window.addEventListener("message", handleMessage);
    });
  }

  function providerLabel(provider) {
    return provider === "microsoft" ? "Microsoft" : "Google";
  }

  async function handleOAuthLogin(provider) {
    const label = providerLabel(provider);
    if (!isOAuthProviderReady(provider)) {
      setAlert({ type: "error", message: `${label} login is not configured yet.` });
      return;
    }
    setAlert({ type: "", message: "" });
    setOauthLoading(provider);
    clearAuthSession();
    clearSelectedSociety();
    try {
      const providerAccessToken = await requestProviderAccessToken(provider);
      const response = await socialLogin(provider, {
        provider,
        accessToken: providerAccessToken,
        societyCode: loginSocietyCode,
      });
      completeOAuthLogin(response);
    } catch (error) {
      const message = error?.response
        ? getApiMessage(error, `${label} login failed.`)
        : error?.message || `${label} login failed.`;
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

  const frontendOAuthConfig = {
    google: hasOAuthClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID),
    microsoft: hasOAuthClientId(import.meta.env.VITE_MICROSOFT_CLIENT_ID),
  };
  function isOAuthProviderReady(provider) {
    return Boolean(frontendOAuthConfig[provider] && oauthConfig?.[provider]?.socialEnabled);
  }
  function getOAuthUnavailableMessage(provider) {
    if (provider === "google") return "Google login is not configured yet.";
    if (provider === "microsoft") return "Microsoft login is not configured yet.";
    return "Social login is not configured yet.";
  }
  function handleUnavailableOAuthClick(provider) {
    if (isOAuthProviderReady(provider) || oauthDisabled) return;
    setAlert({ type: "error", message: getOAuthUnavailableMessage(provider) });
  }
  const googleReady = isOAuthProviderReady("google");
  const microsoftReady = isOAuthProviderReady("microsoft");
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
            <span className={!googleReady ? "auth-v2-social-wrap is-disabled" : "auth-v2-social-wrap"} title={!googleReady ? getOAuthUnavailableMessage("google") : undefined} onClick={() => handleUnavailableOAuthClick("google")}>
              <button type="button" className="auth-v2-social-btn" disabled={oauthDisabled || !googleReady} onClick={() => handleOAuthLogin("google")}>
                <span className="auth-v2-provider-icon auth-v2-provider-icon--google" aria-hidden="true">G</span>
                <strong>{oauthLoading === "google" ? "Connecting..." : googleReady ? "Continue with Google" : "Google not configured"}</strong>
                {oauthLoading === "google" ? <i aria-hidden="true" /> : null}
              </button>
            </span>
            <span className={!microsoftReady ? "auth-v2-social-wrap is-disabled" : "auth-v2-social-wrap"} title={!microsoftReady ? getOAuthUnavailableMessage("microsoft") : undefined} onClick={() => handleUnavailableOAuthClick("microsoft")}>
              <button type="button" className="auth-v2-social-btn" disabled={oauthDisabled || !microsoftReady} onClick={() => handleOAuthLogin("microsoft")}>
                <span className="auth-v2-provider-icon auth-v2-provider-icon--microsoft" aria-hidden="true"><b /><b /><b /><b /></span>
                <strong>{oauthLoading === "microsoft" ? "Connecting..." : microsoftReady ? "Continue with Microsoft" : "Microsoft not configured"}</strong>
                {oauthLoading === "microsoft" ? <i aria-hidden="true" /> : null}
              </button>
            </span>
          </div>
          <p className="auth-v2-bottom">New here? <Link to="/register">Create account</Link></p>
        </Motion.form>
      </section>
    </main>
  );
}
