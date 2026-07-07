import { useEffect, useMemo, useRef, useState } from "react";
import { useThemeEngine } from "../contexts/ThemeContext";
import { useTranslation } from "../contexts/LanguageContext";
import { getAppearanceSettings, saveAppearanceSettings } from "../utils/appearance";
import { getStoredUser } from "../utils/session";
import { getApiMessage } from "../services/authApi";
import {
  fetchChairmanSettings,
  updateAppearanceSettings,
  updateChairmanProfile,
  updateNotificationSettings,
  updateSocietyProfile,
  uploadProfileImage,
  uploadSocietyLogo,
} from "../services/chairmanSettingsApi";
import "./settings-page.css";

const SETTINGS_KEY = "chairman_dashboard_settings_v2";
const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const ICONS = {
  camera: "M4 8h3l1.5-2h7L17 8h3v11H4V8Zm8 8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  check: "M20 6 9 17l-5-5",
  close: "M18 6 6 18M6 6l12 12",
  moon: "M20.2 14.2A7.6 7.6 0 0 1 9.8 3.8 8.2 8.2 0 1 0 20.2 14.2Z",
  monitor: "M4 5h16a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 17H4a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 4 5Zm5 16h6m-3-4v4",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c.8-4 3.6-6 8-6s7.2 2 8 6",
  save: "M5 3h12l2 2v16H5V3Zm3 0v6h7V3M8 21v-7h8v7",
  society: "M3 21h18M5 21V7l7-4 7 4v14M9 21v-7h6v7M8 10h.01M12 10h.01M16 10h.01",
  spinner: "M12 3a9 9 0 1 0 9 9",
  sun: "M12 4V2m0 20v-2m8-8h2M2 12h2m14.95-6.95 1.41-1.41M3.64 20.36l1.41-1.41m0-13.9L3.64 3.64m16.72 16.72-1.41-1.41M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 13h4",
};

const sections = [
  { id: "profile", label: "Profile", icon: "profile" },
  { id: "society", label: "Society Profile", icon: "society" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "appearance", label: "Appearance", icon: "monitor" },
];

const languageOptions = [
  ["en", "English"],
  ["hi", "Hindi"],
  ["gu", "Gujarati"],
];

function Icon({ name }) {
  return (
    <svg className={`settings-icon ${name === "spinner" ? "is-spin" : ""}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name] || ICONS.check} />
    </svg>
  );
}

function safeJson(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function getLocalSettings() {
  const user = getStoredUser() || {};
  const appearance = getAppearanceSettings();
  const saved = typeof window === "undefined" ? null : safeJson(localStorage.getItem(SETTINGS_KEY));
  const base = {
    profile: {
      photo: user.profile_photo_url || user.profilePhotoUrl || "",
      fullName: user.name || user.userName || "Chairman",
      email: user.email || "chairman@nexora.local",
      mobile: user.phone || user.mobile || "+91 98765 43210",
      designation: user.designation || "Chairman",
      password: "",
    },
    society: {
      logo: localStorage.getItem("societyLogoUrl") || "",
      name: localStorage.getItem("selectedSocietyName") || localStorage.getItem("societyName") || "Nexora Heights",
      registrationNumber: "",
      code: localStorage.getItem("societyCode") || localStorage.getItem("societyId") || "NXH-001",
      address: "",
      phone: "",
      email: "",
      officeTiming: "",
    },
    notifications: {
      notices: true,
      complaints: true,
      visitors: true,
      billing: true,
      email: true,
      push: true,
    },
    appearance: {
      theme: appearance.theme || "auto",
      language: localStorage.getItem("society_language_v1") || "en",
    },
  };
  return saved ? mergeSettings(base, saved) : base;
}

function mergeSettings(base, incoming = {}) {
  return Object.fromEntries(
    Object.entries(base).map(([key, value]) => [key, { ...value, ...(incoming[key] || {}) }])
  );
}

function persistLocal(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function updateStoredUser(partial) {
  const current = safeJson(localStorage.getItem("user")) || {};
  const next = { ...current, ...partial };
  localStorage.setItem("user", JSON.stringify(next));
  if (partial.name) localStorage.setItem("userName", partial.name);
  if (partial.email) localStorage.setItem("userEmail", partial.email);
  window.dispatchEvent(new Event("chairman-settings:profile-updated"));
}

function normalizeApiSettings(data) {
  const local = getLocalSettings();
  return mergeSettings(local, {
    profile: data?.profile || {},
    society: data?.society || {},
    notifications: data?.notifications || {},
    appearance: data?.appearance || {},
  });
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function validateMobile(value) {
  return /^[+()0-9\s-]{7,18}$/.test(String(value || "").trim());
}

function Field({ label, error, children, wide = false }) {
  return (
    <label className={`settings-field ${wide ? "is-wide" : ""} ${error ? "has-error" : ""}`}>
      <span>{label}</span>
      {children}
      {error ? <small className="settings-error">{error}</small> : null}
    </label>
  );
}

function Toast({ toast, onClose }) {
  if (!toast.message) return null;
  return (
    <div className={`settings-toast settings-toast--${toast.type || "success"}`}>
      <strong>{toast.message}</strong>
      <button type="button" onClick={onClose} aria-label="Dismiss"><Icon name="close" /></button>
    </div>
  );
}

function Toggle({ label, checked, disabled, onChange }) {
  return (
    <button type="button" disabled={disabled} className={`settings-toggle ${checked ? "is-on" : ""}`} onClick={() => onChange(!checked)}>
      <span className="settings-toggle-copy"><strong>{label}</strong></span>
      <span className="settings-switch" aria-hidden="true" />
    </button>
  );
}

function UploadRow({ title, detail, image, fallbackIcon, uploading, onPick, onRemove }) {
  return (
    <div className="settings-profile-row settings-upload-row">
      <div className={`settings-avatar ${image ? "has-image" : ""}`}>
        {image ? <img src={image} alt="" /> : <Icon name={fallbackIcon} />}
      </div>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      <div className="settings-upload-actions">
        <button type="button" onClick={onPick} disabled={uploading}>
          {uploading ? <Icon name="spinner" /> : null}
          {image ? "Change" : "Upload"}
        </button>
        {image ? <button type="button" onClick={onRemove} disabled={uploading}>Remove</button> : null}
      </div>
    </div>
  );
}

function SettingsPage() {
  const theme = useThemeEngine();
  const { setLocale } = useTranslation();
  const profileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const [active, setActive] = useState("profile");
  const [settings, setSettings] = useState(getLocalSettings);
  const [saved, setSaved] = useState(settings);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState("");
  const [uploading, setUploading] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: "", message: "" });
  const activeSection = sections.find((item) => item.id === active) || sections[0];
  const dirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(saved), [settings, saved]);

  useEffect(() => {
    let cancelled = false;
    fetchChairmanSettings()
      .then((response) => {
        if (cancelled) return;
        const next = normalizeApiSettings(response.data);
        setSettings(next);
        setSaved(next);
        persistLocal(next);
        applyAppearance(next.appearance, false);
      })
      .catch((error) => {
        setToast({ type: "error", message: getApiMessage(error, "Could not load backend settings. Showing saved local settings.") });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function showToast(type, message) {
    setToast({ type, message });
  }

  function update(section, key, value) {
    setErrors((current) => ({ ...current, [`${section}.${key}`]: "" }));
    setSettings((current) => {
      const next = { ...current, [section]: { ...current[section], [key]: value } };
      if (section === "appearance") {
        applyAppearance(next.appearance, true);
      }
      return next;
    });
  }

  function applyAppearance(appearance, persist = true) {
    theme.setThemeMode(appearance.theme || "auto");
    setLocale(appearance.language || "en");
    saveAppearanceSettings({ theme: appearance.theme || "auto" });
    if (persist) {
      localStorage.setItem("society_language_v1", appearance.language || "en");
    }
  }

  function validate(section) {
    const nextErrors = {};
    if (section === "profile") {
      if (!settings.profile.fullName.trim()) nextErrors["profile.fullName"] = "Full name is required.";
      if (!validateEmail(settings.profile.email)) nextErrors["profile.email"] = "Enter a valid email address.";
      if (!validateMobile(settings.profile.mobile)) nextErrors["profile.mobile"] = "Enter a valid mobile number.";
      if (!settings.profile.designation.trim()) nextErrors["profile.designation"] = "Designation is required.";
    }
    if (section === "society") {
      if (!settings.society.name.trim()) nextErrors["society.name"] = "Society name is required.";
      if (!settings.society.code.trim()) nextErrors["society.code"] = "Society code is required.";
      if (settings.society.email && !validateEmail(settings.society.email)) nextErrors["society.email"] = "Enter a valid email address.";
      if (settings.society.phone && !validateMobile(settings.society.phone)) nextErrors["society.phone"] = "Enter a valid phone number.";
    }
    setErrors(nextErrors);
    return !Object.keys(nextErrors).length;
  }

  async function saveSection(section = active) {
    if (!validate(section)) {
      showToast("error", "Please fix the highlighted fields.");
      return;
    }
    setSaving(section);
    try {
      let response;
      if (section === "profile") {
        response = await updateChairmanProfile(settings.profile);
        updateStoredUser({
          name: settings.profile.fullName,
          email: settings.profile.email,
          phone: settings.profile.mobile,
          designation: settings.profile.designation,
          profile_photo_url: settings.profile.photo,
        });
      } else if (section === "society") {
        response = await updateSocietyProfile(settings.society);
        localStorage.setItem("societyName", settings.society.name);
        localStorage.setItem("selectedSocietyName", settings.society.name);
        localStorage.setItem("societyCode", settings.society.code);
        localStorage.setItem("societyLogoUrl", settings.society.logo || "");
        window.dispatchEvent(new Event("chairman-settings:logo-updated"));
      } else if (section === "notifications") {
        response = await updateNotificationSettings(settings.notifications);
      } else {
        response = await updateAppearanceSettings(settings.appearance);
        applyAppearance(settings.appearance, true);
      }

      const next = { ...settings };
      setSaved(next);
      persistLocal(next);
      showToast("success", response?.message || "Settings saved.");
    } catch (error) {
      showToast("error", getApiMessage(error, "Could not save settings."));
    } finally {
      setSaving("");
    }
  }

  function validateImage(file) {
    if (!file) return "No file selected.";
    if (!IMAGE_TYPES.includes(file.type)) return "Only JPG, PNG and WebP images are allowed.";
    return "";
  }

  async function handleImageUpload(kind, file) {
    const error = validateImage(file);
    if (error) {
      showToast("error", error);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const section = kind === "profile" ? "profile" : "society";
    const key = kind === "profile" ? "photo" : "logo";
    update(section, key, previewUrl);
    setUploading(kind);

    try {
      const response = kind === "profile" ? await uploadProfileImage(file) : await uploadSocietyLogo(file);
      const url = response?.data?.imageUrl || response?.data?.logoUrl || previewUrl;
      update(section, key, url);
      const next = { ...settings, [section]: { ...settings[section], [key]: url } };
      setSettings(next);
      setSaved(next);
      persistLocal(next);

      if (kind === "profile") {
        updateStoredUser({ profile_photo_url: url });
      } else {
        localStorage.setItem("societyLogoUrl", url);
        window.dispatchEvent(new Event("chairman-settings:logo-updated"));
      }
      showToast("success", response?.message || "Image uploaded.");
    } catch (uploadError) {
      showToast("error", getApiMessage(uploadError, "Could not upload image."));
      update(section, key, saved[section][key] || "");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploading("");
    }
  }

  function removeImage(kind) {
    const section = kind === "profile" ? "profile" : "society";
    const key = kind === "profile" ? "photo" : "logo";
    update(section, key, "");
    showToast("success", kind === "profile" ? "Profile image removed. Save profile to persist." : "Society logo removed. Save society profile to persist.");
  }

  function renderContent() {
    if (active === "profile") {
      return (
        <>
          <input ref={profileInputRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageUpload("profile", event.target.files?.[0])} />
          <UploadRow
            fallbackIcon="camera"
            title="Profile Photo"
            detail="Shown on approvals, audit trails, and chairman communication."
            image={settings.profile.photo}
            uploading={uploading === "profile"}
            onPick={() => profileInputRef.current?.click()}
            onRemove={() => removeImage("profile")}
          />
          <div className="settings-form-grid">
            <Field label="Full Name" error={errors["profile.fullName"]}><input value={settings.profile.fullName} onChange={(event) => update("profile", "fullName", event.target.value)} /></Field>
            <Field label="Email" error={errors["profile.email"]}><input type="email" value={settings.profile.email} onChange={(event) => update("profile", "email", event.target.value)} /></Field>
            <Field label="Mobile" error={errors["profile.mobile"]}><input value={settings.profile.mobile} onChange={(event) => update("profile", "mobile", event.target.value)} /></Field>
            <Field label="Designation" error={errors["profile.designation"]}><input value={settings.profile.designation} onChange={(event) => update("profile", "designation", event.target.value)} /></Field>
            <Field label="Change Password" wide><input type="password" value={settings.profile.password || ""} placeholder="Enter new password" onChange={(event) => update("profile", "password", event.target.value)} /></Field>
          </div>
          <SectionSave section="profile" saving={saving} onSave={saveSection} />
        </>
      );
    }

    if (active === "society") {
      return (
        <>
          <input ref={logoInputRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageUpload("society", event.target.files?.[0])} />
          <UploadRow
            fallbackIcon="society"
            title="Society Logo"
            detail="Used on notices, bills, receipts, and resident-facing pages."
            image={settings.society.logo}
            uploading={uploading === "society"}
            onPick={() => logoInputRef.current?.click()}
            onRemove={() => removeImage("society")}
          />
          <div className="settings-form-grid">
            <Field label="Society Name" error={errors["society.name"]}><input value={settings.society.name} onChange={(event) => update("society", "name", event.target.value)} /></Field>
            <Field label="Registration Number"><input value={settings.society.registrationNumber} onChange={(event) => update("society", "registrationNumber", event.target.value)} /></Field>
            <Field label="Society Code" error={errors["society.code"]}><input value={settings.society.code} onChange={(event) => update("society", "code", event.target.value)} /></Field>
            <Field label="Phone" error={errors["society.phone"]}><input value={settings.society.phone} onChange={(event) => update("society", "phone", event.target.value)} /></Field>
            <Field label="Email" error={errors["society.email"]}><input type="email" value={settings.society.email} onChange={(event) => update("society", "email", event.target.value)} /></Field>
            <Field label="Office Timing"><input value={settings.society.officeTiming} onChange={(event) => update("society", "officeTiming", event.target.value)} /></Field>
            <Field label="Address" wide><textarea value={settings.society.address} onChange={(event) => update("society", "address", event.target.value)} /></Field>
          </div>
          <SectionSave section="society" saving={saving} onSave={saveSection} />
        </>
      );
    }

    if (active === "notifications") {
      return (
        <>
          <div className="settings-toggle-grid">
            <Toggle label="Notices" checked={settings.notifications.notices} disabled={saving === "notifications"} onChange={(value) => update("notifications", "notices", value)} />
            <Toggle label="Complaints" checked={settings.notifications.complaints} disabled={saving === "notifications"} onChange={(value) => update("notifications", "complaints", value)} />
            <Toggle label="Visitor alerts" checked={settings.notifications.visitors} disabled={saving === "notifications"} onChange={(value) => update("notifications", "visitors", value)} />
            <Toggle label="Billing alerts" checked={settings.notifications.billing} disabled={saving === "notifications"} onChange={(value) => update("notifications", "billing", value)} />
            <Toggle label="Email notifications" checked={settings.notifications.email} disabled={saving === "notifications"} onChange={(value) => update("notifications", "email", value)} />
            <Toggle label="Push notifications" checked={settings.notifications.push} disabled={saving === "notifications"} onChange={(value) => update("notifications", "push", value)} />
          </div>
          <SectionSave section="notifications" saving={saving} onSave={saveSection} />
        </>
      );
    }

    return (
      <>
        <div className="settings-theme-choice" role="group" aria-label="Theme">
          {[
            ["light", "Light", "sun"],
            ["dark", "Dark", "moon"],
            ["auto", "System", "monitor"],
          ].map(([value, label, icon]) => (
            <button key={value} type="button" disabled={saving === "appearance"} className={settings.appearance.theme === value ? "is-active" : ""} onClick={() => update("appearance", "theme", value)}>
              <Icon name={icon} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <Field label="Language">
          <select value={settings.appearance.language} onChange={(event) => update("appearance", "language", event.target.value)}>
            {languageOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </Field>
        <SectionSave section="appearance" saving={saving} onSave={saveSection} />
      </>
    );
  }

  return (
    <main className="settings-page">
      <Toast toast={toast} onClose={() => setToast({ type: "", message: "" })} />
      <aside className="settings-sidebar">
        <div className="settings-brand">
          <span><Icon name="society" /></span>
          <div>
            <strong>Settings</strong>
            <small>{loading ? "Loading settings..." : "Chairman workspace"}</small>
          </div>
        </div>
        <nav aria-label="Settings sections">
          {sections.map((item) => (
            <button key={item.id} type="button" className={active === item.id ? "is-active" : ""} onClick={() => setActive(item.id)}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="settings-content">
        <header className="settings-header">
          <div>
            <span>Enterprise SaaS Settings</span>
            <h1>{activeSection.label}</h1>
            <p>Focused chairman controls for identity, society profile, notifications, and appearance.</p>
          </div>
        </header>

        <article className="settings-card">
          <div className="settings-card-head">
            <span><Icon name={activeSection.icon} /></span>
            <div>
              <h2>{activeSection.label}</h2>
              <p>Changes save to the backend and stay active after refresh.</p>
            </div>
          </div>
          <div className="settings-card-body">{renderContent()}</div>
        </article>
      </section>

      <div className="settings-save-bar">
        <span>{dirty ? "Unsaved changes" : "All changes saved"}</span>
        <div>
          <button type="button" onClick={() => { setSettings(saved); setErrors({}); }} disabled={!dirty || Boolean(saving)}>Cancel</button>
          <button type="button" className="is-primary" onClick={() => saveSection(active)} disabled={!dirty || Boolean(saving)}>
            {saving ? <Icon name="spinner" /> : <Icon name="save" />} Save Current Section
          </button>
        </div>
      </div>
    </main>
  );
}

function SectionSave({ section, saving, onSave }) {
  return (
    <div className="settings-section-actions">
      <button type="button" className="is-primary" disabled={Boolean(saving)} onClick={() => onSave(section)}>
        {saving === section ? <Icon name="spinner" /> : <Icon name="save" />}
        {saving === section ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

export default SettingsPage;
