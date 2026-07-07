import React, { useMemo, useState } from "react";
import { createSuperAdminSociety, getApiMessage } from "../../services/authApi";

function normalizeSocietyCode(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export default function CreateSociety({ onCreated }) {
  const emptyForm = {
    name: "",
    societyCode: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    contact_email: "",
    contact_phone: "",
    subscription_plan: "starter",
    default_language: "en",
    status: "active",
  };
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const societyCodeHint = useMemo(() => {
    const value = normalizeSocietyCode(form.societyCode);
    return value && value.length >= 2 && value.length <= 30 ? value : "";
  }, [form.societyCode]);

  function updateField(field, value) {
    if (field === "societyCode") {
      setForm((current) => ({ ...current, societyCode: normalizeSocietyCode(value) }));
      return;
    }
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setFeedback({ type: "", message: "" });

    const societyCode = normalizeSocietyCode(form.societyCode);
    if (!societyCode) {
      setFeedback({ type: "error", message: "Society code is required." });
      return;
    }
    if (societyCode.length < 2 || societyCode.length > 30 || !/^[A-Z0-9-]+$/.test(societyCode)) {
      setFeedback({ type: "error", message: "Society code must be 2 to 30 characters and use only uppercase letters, numbers, and hyphens." });
      return;
    }

    setLoading(true);
    try {
      const res = await createSuperAdminSociety({
        name: form.name.trim(),
        societyName: form.name.trim(),
        societyCode,
        code: societyCode,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        contactEmail: form.contact_email.trim(),
        contactPhone: form.contact_phone.trim(),
        contact_email: form.contact_email.trim(),
        contact_phone: form.contact_phone.trim(),
        subscriptionPlan: form.subscription_plan,
        subscription_plan: form.subscription_plan,
        defaultLanguage: form.default_language,
        default_language: form.default_language,
        status: form.status,
      });
      setFeedback({ type: "success", message: res?.message || "Society created successfully." });
      setForm(emptyForm);
      if (onCreated) onCreated(res?.data?.society || null);
    } catch (err) {
      setFeedback({ type: "error", message: getApiMessage(err, "Failed to create society.") });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <section className="sa-page-head">
        <div>
          <h1>Create Society</h1>
          <p>Create a Supabase-backed society with a unique code and subscription settings.</p>
        </div>
      </section>
      <section className="sa-panel">
      <form onSubmit={submit} className="form sa-form">
        <label>Society Name<input required value={form.name} onChange={(e) => updateField("name", e.target.value)} /></label>
        <label>
          Society Code
          <input required value={form.societyCode} onChange={(e) => updateField("societyCode", e.target.value)} placeholder="Example: GRR-0001" />
        </label>
        {societyCodeHint ? <small>Preview: {societyCodeHint}</small> : null}
        <label>Address<input value={form.address} onChange={(e) => updateField("address", e.target.value)} /></label>
        <label>City<input value={form.city} onChange={(e) => updateField("city", e.target.value)} /></label>
        <label>State<input value={form.state} onChange={(e) => updateField("state", e.target.value)} /></label>
        <label>Pincode<input value={form.pincode} onChange={(e) => updateField("pincode", e.target.value)} /></label>
        <label>Contact Email<input value={form.contact_email} onChange={(e) => updateField("contact_email", e.target.value)} /></label>
        <label>Contact Phone<input value={form.contact_phone} onChange={(e) => updateField("contact_phone", e.target.value)} /></label>
        <label>Subscription Plan
          <select value={form.subscription_plan} onChange={(e) => updateField("subscription_plan", e.target.value)}>
            <option value="starter">Starter</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </label>
        <label>Default Language
          <select value={form.default_language} onChange={(e) => updateField("default_language", e.target.value)}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="gu">Gujarati</option>
          </select>
        </label>
        <label>Status
          <select value={form.status} onChange={(e) => updateField("status", e.target.value)}>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="pending_chairman_registration">Pending Chairman Registration</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
        {feedback.message ? <p role="status" className={`sa-feedback ${feedback.type}`}>{feedback.message}</p> : null}
        <div className="sa-form-wide" style={{ marginTop: 4 }}>
          <button className="sa-btn" type="submit" disabled={loading}>{loading ? "Creating..." : "Create Society"}</button>
          <button className="sa-btn sa-btn-ghost" type="button" onClick={() => window.location.hash = "societies"} style={{ marginLeft: 8 }}>Cancel</button>
        </div>
      </form>
      </section>
    </div>
  );
}
