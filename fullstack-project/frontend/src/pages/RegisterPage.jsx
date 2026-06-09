import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import AuthLayout, { authLabelClass } from "../components/AuthLayout";
import AuthInput from "../components/AuthInput";
import AuthPasswordInput from "../components/AuthPasswordInput";
import AuthButton from "../components/AuthButton";
import AuthLink from "../components/AuthLink";
import RoleSelectCard from "../components/RoleSelectCard";
import SocietyCodeInput from "../components/SocietyCodeInput";
import ThemeSelect from "../components/ThemeSelect";
import {
  getApiMessage,
  registerUser,
  fetchSocietyByCode,
  fetchWingsBySocietyCode,
  fetchAvailableFlats,
} from "../services/authApi";

function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const societyCodeParam = searchParams.get("societyCode") || "";
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    societyCode: "",
    role: "chairman",
    wing: "A",
    flatNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingSociety, setLoadingSociety] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [availableWings, setAvailableWings] = useState([]);
  const [societyInfo, setSocietyInfo] = useState(null);
  const [flatOptions, setFlatOptions] = useState([]);

  const isResidentRole = ["owner", "tenant"].includes(form.role);
  const isOfficerRole = ["chairman", "secretary"].includes(form.role);

  useEffect(() => {
    const code = societyCodeParam.trim().toUpperCase();
    if (!code) return;

    setForm((prev) => (prev.societyCode === code ? prev : { ...prev, societyCode: code }));
    loadSocietyContext(code);
  }, [societyCodeParam]);

  function validate() {
    if (!form.name || !form.email || !form.password || !form.confirmPassword || !form.societyCode || !form.role) {
      return "All fields are required";
    }

    if (isResidentRole && (!form.wing || !form.flatNumber)) {
      return "Wing and flat number are required for resident roles";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return "Please enter a valid email address";
    }

    if (form.password.length < 8) {
      return "Password must be at least 8 characters";
    }

    if (form.password !== form.confirmPassword) {
      return "Passwords do not match";
    }

    if (isResidentRole) {
      const flatRegex = /^[A-Za-z0-9\-\/]+$/;
      if (!flatRegex.test(form.flatNumber)) {
        return "Flat number is invalid";
      }
    }

    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    const validationError = validate();
    if (validationError) {
      setAlert({ type: "error", message: validationError });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        societyCode: form.societyCode,
        role: form.role,
      };

      if (isResidentRole) {
        payload.flatNumber = form.flatNumber;
        payload.wing = form.wing;
      }

      const response = await registerUser(payload);
      setAlert({
        type: "success",
        message: response.message || "Registered successfully. Verify OTP next.",
      });

      navigate(
        `/verify-otp?email=${encodeURIComponent(form.email)}&societyCode=${encodeURIComponent(form.societyCode)}`
      );
    } catch (error) {
      setAlert({
        type: "error",
        message: getApiMessage(error, "Registration failed"),
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadSocietyContext(code) {
    if (!code) {
      setSocietyInfo(null);
      setAvailableWings([]);
      setFlatOptions([]);
      return;
    }

    setLoadingSociety(true);
    try {
      const societyResponse = await fetchSocietyByCode(code);
      const society = societyResponse.data;
      setSocietyInfo(society);

      const wingsResponse = await fetchWingsBySocietyCode(code);
      const wings = Array.isArray(wingsResponse.data)
        ? wingsResponse.data.map((option) => String(option.code || option.name || option.id).trim())
        : [];

      setAvailableWings(wings);
      if (wings.length && !wings.includes(form.wing)) {
        setForm((prev) => ({ ...prev, wing: wings[0] }));
      }

      if (wings.length) {
        const flatsResponse = await fetchAvailableFlats({ societyCode: code, wing: wings[0] });
        setFlatOptions(Array.isArray(flatsResponse.data) ? flatsResponse.data.map((flat) => flat.flat_number) : []);
      } else {
        setFlatOptions([]);
      }
    } catch (error) {
      setSocietyInfo(null);
      setAvailableWings([]);
      setFlatOptions([]);
    } finally {
      setLoadingSociety(false);
    }
  }

  async function handleSocietyCodeChange(v) {
    const code = v.trim().toUpperCase();
    setForm((prev) => ({ ...prev, societyCode: code }));
    if (code.length >= 2) {
      await loadSocietyContext(code);
    } else {
      setSocietyInfo(null);
      setAvailableWings([]);
      setFlatOptions([]);
    }
  }

  async function handleWingChange(value) {
    setForm((prev) => ({ ...prev, wing: value }));
    if (form.societyCode) {
      try {
        const flatsResponse = await fetchAvailableFlats({ societyCode: form.societyCode, wing: value });
        setFlatOptions(Array.isArray(flatsResponse.data) ? flatsResponse.data.map((flat) => flat.flat_number) : []);
      } catch (error) {
        setFlatOptions([]);
      }
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle={
        isOfficerRole
          ? "Register as Chairman or Secretary for super admin approval"
          : isResidentRole
            ? "Register as a resident with your society code, wing, and flat number"
            : "Register as staff or security"
      }
    >
      <AlertMessage type={alert.type} message={alert.message} />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInput label="Name" type="text" value={form.name} onChange={(v) => setForm((prev) => ({ ...prev, name: v }))} autoComplete="name" required />

        <AuthInput label="Email" type="email" value={form.email} onChange={(v) => setForm((prev) => ({ ...prev, email: v.trim() }))} autoComplete="email" required />

        <AuthPasswordInput label="Password" value={form.password} onChange={(v) => setForm((prev) => ({ ...prev, password: v }))} autoComplete="new-password" required />

        <AuthPasswordInput label="Confirm Password" value={form.confirmPassword} onChange={(v) => setForm((prev) => ({ ...prev, confirmPassword: v }))} autoComplete="new-password" required />

        <div>
          <label className={authLabelClass}>I am registering as a</label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              { value: "chairman", title: "Chairman", description: "Initial society onboarding role" },
              { value: "secretary", title: "Secretary", description: "Initial society onboarding role" },
              { value: "owner", title: "Flat Owner", description: "Requires flat number" },
              { value: "tenant", title: "Tenant", description: "Requires flat number" },
              { value: "staff", title: "Staff", description: "No flat required" },
              { value: "security", title: "Security", description: "No flat required" },
            ].map((option) => (
              <RoleSelectCard
                key={option.value}
                active={form.role === option.value}
                title={option.title}
                description={option.description}
                value={option.value}
                onSelect={(value) => setForm((prev) => ({ ...prev, role: value }))}
              />
            ))}
          </div>
        </div>

        <SocietyCodeInput
          value={form.societyCode}
          onChange={handleSocietyCodeChange}
          helperText="Use the society code shared after onboarding."
          societyName={societyInfo ? societyInfo.name || societyInfo.code : null}
          status={loadingSociety ? "Validating society..." : societyInfo ? "Verified society identity" : form.societyCode ? "Society code not recognized yet." : null}
        />

        {isResidentRole && (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className={authLabelClass}>Wing</label>
              {availableWings.length ? (
                <ThemeSelect
                  id="wing-select"
                  options={availableWings.map((w) => ({ label: `Wing ${w}`, value: w }))}
                  value={form.wing}
                  onChange={(v) => handleWingChange(v)}
                  placeholder="Select wing"
                />
              ) : (
                <AuthInput
                  label="Wing"
                  type="text"
                  value={form.wing}
                  onChange={(v) => handleWingChange(v)}
                  required={isResidentRole}
                />
              )}
            </div>
            <div>
              <AuthInput
                label="Flat Number"
                type="text"
                value={form.flatNumber}
                onChange={(v) => setForm((prev) => ({ ...prev, flatNumber: v.trim() }))}
                placeholder="101"
                required={isResidentRole}
              />
              {flatOptions.length ? (
                <div className="mt-2 rounded-3xl border border-white/10 bg-white/5 p-3 text-sm text-[var(--text-secondary)]">
                  <div className="font-medium text-[var(--text-main)]">Suggested flats</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {flatOptions.slice(0, 8).map((flat) => (
                      <button
                        key={flat}
                        type="button"
                        className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-[var(--text-main)] transition hover:bg-cyan-400/15"
                        onClick={() => setForm((prev) => ({ ...prev, flatNumber: flat }))}
                      >
                        {flat}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        <AuthButton type="submit" loading={loading}>{loading ? "Creating account..." : "Create account"}</AuthButton>
      </form>

      <p className="text-sm text-[var(--text-secondary)]">
        Already have an account?{" "}
        <AuthLink to="/login" className="font-semibold text-[var(--text-main)]">
          Sign in
        </AuthLink>
      </p>
    </AuthLayout>
  );
}

export default RegisterPage;
