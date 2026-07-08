import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Moon,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Sun,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import { getApiMessage, loginSuperAdmin } from "../services/authApi";
import {
  getStoredSuperAdminRole,
  getStoredSuperAdminToken,
  saveSuperAdminSession,
} from "../utils/session";
import nexoraLogo from "../assets/branding/nexora-logo-dark.png";
import "./super-admin-login.css";

const features = [
  { label: "Complete Control", icon: ServerCog },
  { label: "Real-time Overview", icon: BarChart3 },
  { label: "Secure & Reliable", icon: ShieldCheck },
  { label: "System Configuration", icon: Zap },
];

const stats = [
  { label: "Total Societies", value: "128+" },
  { label: "Total Users", value: "42K+" },
  { label: "System Uptime", value: "99.9%" },
];

function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({
    email: localStorage.getItem("nexoraSuperAdminEmail") || "",
    password: "",
  }));
  const [backupForm, setBackupForm] = useState({ email: "", code: "" });
  const [remember, setRemember] = useState(() => localStorage.getItem("nexoraRememberSuperAdmin") === "true");
  const [showPassword, setShowPassword] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("nexoraSuperAdminTheme") || "dark");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });
  const [shake, setShake] = useState(false);

  const token = getStoredSuperAdminToken();
  const storedRole = getStoredSuperAdminRole();

  useEffect(() => {
    document.documentElement.dataset.superAdminLoginTheme = theme;
    localStorage.setItem("nexoraSuperAdminTheme", theme);
  }, [theme]);

  useEffect(() => {
    document.body.classList.add("sa-superadmin-login-active");
    return () => {
      document.body.classList.remove("sa-superadmin-login-active");
      delete document.documentElement.dataset.superAdminLoginTheme;
    };
  }, []);

  useEffect(() => {
    if (!toast.message || toast.type === "success") return undefined;
    const timer = window.setTimeout(() => setToast({ type: "", message: "" }), 5200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  if (token && storedRole === "super_admin") {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  function validate() {
    if (!form.email || !form.password) return "Email and password are required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    return null;
  }

  function showError(message) {
    setToast({ type: "error", message });
    setShake(true);
    window.setTimeout(() => setShake(false), 520);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setToast({ type: "", message: "" });

    const validationError = validate();
    if (validationError) {
      showError(validationError);
      return;
    }

    try {
      setLoading(true);
      const response = await loginSuperAdmin({
        email: form.email.trim(),
        password: form.password,
      });
      const user = response.user || response.data;
      saveSuperAdminSession({ token: response.token, user });

      if (remember) {
        localStorage.setItem("nexoraRememberSuperAdmin", "true");
        localStorage.setItem("nexoraSuperAdminEmail", form.email.trim());
      } else {
        localStorage.removeItem("nexoraRememberSuperAdmin");
        localStorage.removeItem("nexoraSuperAdminEmail");
      }

      setSuccess(true);
      setToast({ type: "success", message: response.message || "Secure session established. Redirecting..." });
      window.setTimeout(() => navigate("/super-admin/dashboard", { replace: true }), 620);
    } catch (error) {
      showError(getApiMessage(error, "Super admin login failed."));
    } finally {
      setLoading(false);
    }
  }

  function handleBackupSubmit(event) {
    event.preventDefault();
    setBackupOpen(false);
    setToast({
      type: "info",
      message: "Backup code verification is ready. Use your recovery code with platform security if primary access is unavailable.",
    });
  }

  return (
    <main className={`sa-login-shell sa-login-shell--${theme}`}>
      <div className="sa-login-bg" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <button
        type="button"
        className="sa-login-theme"
        onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        aria-label="Toggle theme"
      >
        <Sun className="sa-theme-sun" size={18} />
        <Moon className="sa-theme-moon" size={18} />
      </button>

      {toast.message ? (
        <div className={`sa-login-toast is-${toast.type || "info"}`} role="status">
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast({ type: "", message: "" })} aria-label="Dismiss message">
            <X size={15} />
          </button>
        </div>
      ) : null}

      <section className="sa-login-brand-panel">
        <div className="sa-brand-overlay" />
        <div className="sa-particles" aria-hidden="true">
          {Array.from({ length: 14 }, (_, index) => <i key={index} />)}
        </div>

        <div className="sa-brand-content">
          <div className="sa-brand-logo">
            <img src={nexoraLogo} alt="Nexora" />
            <span>Smart Society Management</span>
          </div>

          <div className="sa-brand-copy">
            <span className="sa-brand-kicker">{greeting}, platform administrator</span>
            <h1>Smart Society Management</h1>
            <h2>Super Admin Secure Access Portal</h2>
            <p>
              Command every society, user, approval, billing workflow, and system setting from a protected Nexora control layer.
            </p>
          </div>

          <div className="sa-feature-list">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.label}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </article>
              );
            })}
          </div>

          <div className="sa-brand-stats">
            {stats.map((item) => (
              <article key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="sa-floating-shield" aria-hidden="true">
          <ShieldCheck size={34} />
          <span><LockKeyhole size={16} /></span>
        </div>
      </section>

      <section className="sa-login-form-side">
        <form className={`sa-login-card ${shake ? "is-shaking" : ""} ${success ? "is-success" : ""}`} onSubmit={handleSubmit}>
          <div className="sa-login-card-head">
            <div className="sa-lock-orb">
              <ShieldCheck size={24} />
            </div>
            <span>Protected platform access</span>
            <h2>Super Admin Login</h2>
            <p>Access the super admin dashboard</p>
          </div>

          <label className="sa-field">
            <span>Email address</span>
            <div>
              <UsersRound size={18} />
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                autoComplete="email"
                placeholder="admin@nexora.app"
                required
              />
            </div>
          </label>

          <label className="sa-field">
            <span>Password</span>
            <div>
              <LockKeyhole size={18} />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                autoComplete="current-password"
                placeholder="Enter secure password"
                required
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <div className="sa-form-row">
            <label className="sa-remember">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              <span>Remember me</span>
            </label>
            <Link to="/super-admin/forgot-password">Forgot Password?</Link>
          </div>

          <button type="submit" className="sa-signin-button" disabled={loading || success}>
            {loading ? <span className="sa-spinner" /> : success ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
            <span>{loading ? "Signing In..." : success ? "Redirecting..." : "Sign In"}</span>
            {!loading && !success ? <ArrowRight size={18} /> : null}
          </button>

          <button type="button" className="sa-backup-button" onClick={() => setBackupOpen(true)}>
            <KeyRound size={18} />
            Login with Backup Code
          </button>

          <div className="sa-security-note">
            <Sparkles size={17} />
            <p>Encrypted admin access with session protection, audit visibility, and restricted platform controls.</p>
          </div>
        </form>
      </section>

      {backupOpen ? (
        <div className="sa-backup-modal" role="presentation" onMouseDown={() => setBackupOpen(false)}>
          <form className="sa-backup-card" role="dialog" aria-modal="true" aria-labelledby="backup-title" onSubmit={handleBackupSubmit} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="sa-backup-close" onClick={() => setBackupOpen(false)} aria-label="Close backup code modal">
              <X size={18} />
            </button>
            <div className="sa-lock-orb">
              <KeyRound size={24} />
            </div>
            <h2 id="backup-title">Backup Code Login</h2>
            <p>Use a recovery code issued by the Nexora platform security team.</p>
            <label className="sa-field">
              <span>Email address</span>
              <div>
                <UsersRound size={18} />
                <input type="email" value={backupForm.email} onChange={(event) => setBackupForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="admin@nexora.app" required />
              </div>
            </label>
            <label className="sa-field">
              <span>Backup code</span>
              <div>
                <KeyRound size={18} />
                <input value={backupForm.code} onChange={(event) => setBackupForm((prev) => ({ ...prev, code: event.target.value }))} placeholder="XXXX-XXXX-XXXX" required />
              </div>
            </label>
            <button type="submit" className="sa-signin-button">
              <ShieldCheck size={18} />
              Verify Backup Code
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}

export default SuperAdminLoginPage;
