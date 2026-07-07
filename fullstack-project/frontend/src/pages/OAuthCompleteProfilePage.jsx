import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AlertMessage from "../components/AlertMessage";
import BrandLogo from "../components/BrandLogo";
import NexoraAuthVisual from "../components/NexoraAuthVisual";
import { completeOAuthProfile, fetchSocietyByCode, getApiMessage } from "../services/authApi";

const roles = ["owner", "tenant", "staff", "security", "secretary", "chairman"];
const roleLabels = {
  owner: "Owner",
  tenant: "Tenant",
  staff: "Staff",
  security: "Security",
  secretary: "Secretary",
  chairman: "Chairman",
};

const Motion = motion;

function readOAuthCompletion() {
  try {
    return JSON.parse(sessionStorage.getItem("oauthCompletion") || "null");
  } catch {
    return null;
  }
}

export default function OAuthCompleteProfilePage() {
  const navigate = useNavigate();
  const completion = useMemo(readOAuthCompletion, []);
  const profile = completion?.profile || {};
  const [form, setForm] = useState({
    name: profile.name || "",
    email: profile.email || "",
    mobile: "",
    societyCode: "",
    role: "owner",
    wing: "",
    flatNumber: "",
    department: "",
    designation: "",
  });
  const [society, setSociety] = useState(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const isResidentRole = ["owner", "tenant"].includes(form.role);
  const isStaffRole = ["staff", "security"].includes(form.role);

  useEffect(() => {
    if (!completion?.completionToken || !profile.email) {
      navigate("/login", {
        replace: true,
        state: { message: "OAuth session expired. Please sign in again." },
      });
    }
  }, [completion, navigate, profile.email]);

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
    }, 400);
    return () => clearTimeout(timer);
  }, [form.societyCode]);

  async function handleSubmit(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    if (!form.name || !form.mobile || !form.societyCode || !form.role) {
      setAlert({ type: "error", message: "Please complete the required profile fields." });
      return;
    }
    if (isResidentRole && (!form.wing || !form.flatNumber)) {
      setAlert({ type: "error", message: "Flat details are required for owner and tenant accounts." });
      return;
    }
    if (isStaffRole && (!form.department || !form.designation)) {
      setAlert({ type: "error", message: "Department and designation are required for staff and security accounts." });
      return;
    }

    try {
      setLoading(true);
      const response = await completeOAuthProfile({
        completionToken: completion.completionToken,
        name: form.name,
        phone: form.mobile,
        mobile: form.mobile,
        societyCode: form.societyCode,
        role: form.role,
        wing: form.wing,
        flatNumber: form.flatNumber,
        department: form.department,
        designation: form.designation,
      });
      sessionStorage.removeItem("oauthCompletion");
      setSubmitted(true);
      setAlert({ type: "success", message: response.message || "Your account is pending society approval." });
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Registration failed.") });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="auth-v2 auth-v2-recovery">
        <section className="auth-v2-art">
          <div className="nexora-auth-brand"><BrandLogo to={null} variant="full" /></div>
          <NexoraAuthVisual type="register" />
          <div className="auth-v2-art-copy">
            <em>Approval Required</em>
            <h1>Almost there</h1>
            <p>Your society administrator will review your request before dashboard access is enabled.</p>
          </div>
        </section>
        <section className="auth-v2-form-zone">
          <Motion.div className="auth-v2-card auth-v2-success-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <div className="auth-v2-success-icon">&check;</div>
            <h1>Pending society approval</h1>
            <p>Your account is pending society approval.</p>
            <div className="auth-v2-success-actions">
              <Link className="auth-v2-ghost" to="/login">Back to login</Link>
            </div>
          </Motion.div>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-v2 auth-v2-register auth-v2-oauth-complete">
      <section className="auth-v2-onboarding">
        <div className="nexora-auth-brand"><BrandLogo to={null} variant="full" /></div>
        <NexoraAuthVisual type="register" />
        <div className="auth-v2-art-copy">
          <em>Secure OAuth Registration</em>
          <h1>Complete your Nexora profile</h1>
          <p>Verified sign-in is connected. Add your society details so the right approver can review your account.</p>
        </div>
        <div className="auth-v2-benefits">
          {["Verified Email", "Society Approval", "Role-Based Access", "Protected Dashboard"].map((item) => <span key={item}><b>&check;</b>{item}</span>)}
        </div>
      </section>

      <Motion.form className="auth-v2-card auth-v2-register-card auth-v2-step-card" onSubmit={handleSubmit} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div className="auth-v2-heading">
          <span>{profile.provider === "microsoft" ? "Microsoft" : "Google"} verified</span>
          <h2>Complete Profile</h2>
          <p>New OAuth users require society approval before dashboard access.</p>
        </div>
        <AlertMessage type={alert.type} message={alert.message} />

        <div className="auth-v2-contact-card auth-v2-oauth-identity">
          {profile.profilePhoto ? <img src={profile.profilePhoto} alt="" /> : <span>{(form.name || form.email || "N").slice(0, 1).toUpperCase()}</span>}
          <div>
            <strong>{form.name || "Verified user"}</strong>
            <em>{form.email}</em>
          </div>
        </div>

        <div className="auth-v2-two">
          <label className="auth-v2-field">
            <span>Full Name</span>
            <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </label>
          <label className="auth-v2-field">
            <span>Email</span>
            <input value={form.email} readOnly />
          </label>
        </div>

        <div className="auth-v2-two">
          <label className="auth-v2-field">
            <span>Mobile Number</span>
            <input value={form.mobile} onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value.replace(/[^\d+ -]/g, "") }))} required />
          </label>
          <label className="auth-v2-field">
            <span>Society Code</span>
            <input value={form.societyCode} onChange={(e) => setForm((p) => ({ ...p, societyCode: e.target.value.trim().toUpperCase() }))} required />
          </label>
        </div>

        <div className={`auth-v2-verify ${society ? "is-ok" : ""}`}>
          <strong>{checking ? "Checking society..." : society ? "Society verified" : "Society verification"}</strong>
          <span>{society?.name || society?.society_name || "Enter your active society code."}</span>
        </div>

        <div className="auth-v2-role-title"><span>Select role</span><strong>{roleLabels[form.role]}</strong></div>
        <div className="auth-v2-role-grid auth-v2-role-grid--cards">
          {roles.map((role) => (
            <button key={role} type="button" className={form.role === role ? "is-active" : ""} onClick={() => setForm((p) => ({ ...p, role }))}>
              <strong>{roleLabels[role]}</strong>
              <span>{["owner", "tenant"].includes(role) ? "Flat access" : ["staff", "security"].includes(role) ? "Work access" : "Society admin"}</span>
            </button>
          ))}
        </div>

        {isResidentRole ? (
          <div className="auth-v2-two">
            <label className="auth-v2-field">
              <span>Wing</span>
              <input value={form.wing} onChange={(e) => setForm((p) => ({ ...p, wing: e.target.value.trim().toUpperCase() }))} required />
            </label>
            <label className="auth-v2-field">
              <span>Flat Number</span>
              <input value={form.flatNumber} onChange={(e) => setForm((p) => ({ ...p, flatNumber: e.target.value.trim().toUpperCase() }))} required />
            </label>
          </div>
        ) : null}

        {isStaffRole ? (
          <div className="auth-v2-two">
            <label className="auth-v2-field">
              <span>Department</span>
              <input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} required />
            </label>
            <label className="auth-v2-field">
              <span>Designation</span>
              <input value={form.designation} onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))} required />
            </label>
          </div>
        ) : null}

        <button className="auth-v2-submit" disabled={loading}>{loading ? "Submitting..." : "Submit registration request"}</button>
        <p className="auth-v2-bottom">Wrong account? <Link to="/login">Return to login</Link></p>
      </Motion.form>
    </main>
  );
}
