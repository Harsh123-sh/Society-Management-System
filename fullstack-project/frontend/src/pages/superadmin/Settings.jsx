import React, { useState } from "react";
import { Bell, Palette, Save, Shield, SlidersHorizontal, UserCircle } from "lucide-react";

const tabs = [
  { key: "profile", label: "Super Admin Profile", icon: UserCircle },
  { key: "platform", label: "Platform Settings", icon: SlidersHorizontal },
  { key: "security", label: "Security Settings", icon: Shield },
  { key: "notifications", label: "Notification Settings", icon: Bell },
  { key: "appearance", label: "Appearance", icon: Palette },
];

export default function Settings() {
  const [active, setActive] = useState("profile");
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("nexoraSuperAdminSettings");
    return saved ? JSON.parse(saved) : {
      name: "Super Admin",
      email: "superadmin@nexora.app",
      platformName: "Nexora",
      maintenanceMode: false,
      twoFactorRequired: true,
      sessionTimeout: 30,
      emailAlerts: true,
      approvalAlerts: true,
      revenueAlerts: true,
      density: "comfortable",
      theme: localStorage.getItem("superAdminTheme") || "light",
    };
  });
  const [notice, setNotice] = useState("");

  function update(field, value) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  function save() {
    localStorage.setItem("nexoraSuperAdminSettings", JSON.stringify(settings));
    localStorage.setItem("superAdminTheme", settings.theme);
    document.documentElement.dataset.superAdminTheme = settings.theme;
    setNotice("Settings saved successfully.");
  }

  return (
    <div>
      <section className="sa-page-head">
        <div>
          <span className="sa-eyebrow">Control Preferences</span>
          <h1>Settings</h1>
          <p>Manage profile, platform behavior, security, notifications, and appearance.</p>
        </div>
        <button className="sa-btn" type="button" onClick={save}><Save size={16} /> Save settings</button>
      </section>
      {notice ? <div className="sa-feedback success">{notice}</div> : null}
      <section className="sa-settings-layout">
        <nav className="sa-settings-tabs">
          {tabs.map((tab) => (
            <button key={tab.key} className={active === tab.key ? "active" : ""} type="button" onClick={() => setActive(tab.key)}>
              {React.createElement(tab.icon, { size: 17 })} {tab.label}
            </button>
          ))}
        </nav>
        <article className="sa-panel">
          {active === "profile" ? (
            <div className="sa-form sa-form-grid">
              <label>Name<input value={settings.name} onChange={(event) => update("name", event.target.value)} /></label>
              <label>Email<input value={settings.email} onChange={(event) => update("email", event.target.value)} /></label>
            </div>
          ) : null}
          {active === "platform" ? (
            <div className="sa-form sa-form-grid">
              <label>Platform Name<input value={settings.platformName} onChange={(event) => update("platformName", event.target.value)} /></label>
              <label>Maintenance Mode<select value={settings.maintenanceMode ? "yes" : "no"} onChange={(event) => update("maintenanceMode", event.target.value === "yes")}><option value="no">Off</option><option value="yes">On</option></select></label>
            </div>
          ) : null}
          {active === "security" ? (
            <div className="sa-form sa-form-grid">
              <label>Require Two Factor<select value={settings.twoFactorRequired ? "yes" : "no"} onChange={(event) => update("twoFactorRequired", event.target.value === "yes")}><option value="yes">Required</option><option value="no">Optional</option></select></label>
              <label>Session Timeout (minutes)<input type="number" min="5" max="240" value={settings.sessionTimeout} onChange={(event) => update("sessionTimeout", Number(event.target.value))} /></label>
            </div>
          ) : null}
          {active === "notifications" ? (
            <div className="sa-toggle-list">
              {["emailAlerts", "approvalAlerts", "revenueAlerts"].map((field) => (
                <label key={field}><span>{field.replace(/([A-Z])/g, " $1")}</span><input type="checkbox" checked={settings[field]} onChange={(event) => update(field, event.target.checked)} /></label>
              ))}
            </div>
          ) : null}
          {active === "appearance" ? (
            <div className="sa-form sa-form-grid">
              <label>Theme<select value={settings.theme} onChange={(event) => update("theme", event.target.value)}><option value="light">Light</option><option value="dark">Dark</option></select></label>
              <label>Density<select value={settings.density} onChange={(event) => update("density", event.target.value)}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label>
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}
