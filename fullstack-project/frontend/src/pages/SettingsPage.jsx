import { useEffect, useMemo, useState } from "react";
import { getAppearanceSettings, saveAppearanceSettings } from "../utils/appearance";

const ADMIN_SETTINGS_KEY = "society_admin_settings_v1";

const accentOptions = [
  { label: "Teal", value: "15 118 110" },
  { label: "Blue", value: "37 99 235" },
  { label: "Slate", value: "51 65 85" },
  { label: "Amber", value: "217 119 6" },
];

function readSavedSettings() {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(ADMIN_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function SettingsPage() {
  const [settings, setSettings] = useState(() => ({
    societyName: "Greenview Heights",
    email: "admin@greenviewheights.com",
    phone: "+91 8765432100",
    address: "123 Society Lane, City, State",
    maintenanceCharges: "2500",
    waterCharges: "150",
    parkingCharges: "500",
    lateFeePercent: "2",
    graceDays: "5",
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    appearance: getAppearanceSettings(),
    ai: {
      autoDraftNotices: true,
      complaintSummaries: true,
      billingAnomalyAlerts: true,
      residentFollowUps: true,
    },
  }));

  useEffect(() => {
    const saved = readSavedSettings();
    if (saved) {
      setSettings((previous) => ({
        ...previous,
        ...saved,
        appearance: { ...previous.appearance, ...(saved.appearance || {}) },
        ai: { ...previous.ai, ...(saved.ai || {}) },
      }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    saveAppearanceSettings(settings.appearance);
  }, [settings.appearance]);

  const stats = useMemo(
    () => [
      { label: "Society profile", value: settings.societyName },
      { label: "Billing cycle", value: `${settings.maintenanceCharges} / month` },
      { label: "AI automations", value: Object.values(settings.ai).filter(Boolean).length },
    ],
    [settings]
  );

  function updateField(key, value) {
    setSettings((previous) => ({ ...previous, [key]: value }));
  }

  function updateAppearance(key, value) {
    setSettings((previous) => ({
      ...previous,
      appearance: { ...previous.appearance, [key]: value },
    }));
  }

  function updateAiFeature(key, value) {
    setSettings((previous) => ({
      ...previous,
      ai: { ...previous.ai, [key]: value },
    }));
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-teal-800 p-6 text-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)] sm:p-8">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
          <span>Society Control Center</span>
          <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] tracking-[0.18em]">Production-ready UI</span>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Operations and appearance settings</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
              Configure the society profile, billing defaults, notifications, and AI workflows from one structured control panel.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Society profile</h3>
                <p className="text-sm text-slate-500">Core details visible throughout the platform.</p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Auto-saved locally
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Society name</span>
                <input
                  type="text"
                  value={settings.societyName}
                  onChange={(event) => updateField("societyName", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Support email</span>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Contact number</span>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Address</span>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(event) => updateField("address", event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Billing defaults</h3>
              <p className="text-sm text-slate-500">Control recurring charges and penalty rules.</p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                { key: "maintenanceCharges", label: "Maintenance (₹/month)" },
                { key: "waterCharges", label: "Water charge (₹/month)" },
                { key: "parkingCharges", label: "Parking charge (₹/month)" },
                { key: "lateFeePercent", label: "Late fee %" },
                { key: "graceDays", label: "Grace days" },
              ].map((item) => (
                <label key={item.key} className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  <input
                    type="number"
                    min="0"
                    value={settings[item.key]}
                    onChange={(event) => updateField(item.key, event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Notifications</h3>
              <p className="text-sm text-slate-500">Prefer a cleaner, more reliable communication stack.</p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                { key: "emailNotifications", label: "Email alerts" },
                { key: "smsNotifications", label: "SMS alerts" },
                { key: "pushNotifications", label: "Push notifications" },
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <span>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={settings[item.key]}
                    onChange={(event) => updateField(item.key, event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                </label>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-lg font-semibold text-slate-950">Appearance</h3>
            <p className="text-sm text-slate-500">Adjust the live shell theme from here.</p>

            <div className="mt-5 space-y-4">
              <div>
                <span className="text-sm font-medium text-slate-700">Accent color</span>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {accentOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateAppearance("accent", option.value)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                        settings.appearance.accent === option.value
                          ? "border-teal-500 bg-teal-50 text-teal-800"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className="mb-2 block h-3 w-3 rounded-full"
                        style={{ backgroundColor: `rgb(${option.value})` }}
                      />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Theme</span>
                  <select
                    value={settings.appearance.theme}
                    onChange={(event) => updateAppearance("theme", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Density</span>
                  <select
                    value={settings.appearance.density}
                    onChange={(event) => updateAppearance("density", event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  >
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-lg font-semibold text-slate-950">AI operations</h3>
            <p className="text-sm text-slate-500">Helpful automation without cluttering the workflow.</p>

            <div className="mt-4 space-y-3">
              {[
                { key: "autoDraftNotices", label: "Draft notices from prompts" },
                { key: "complaintSummaries", label: "Summarize complaint trends" },
                { key: "billingAnomalyAlerts", label: "Detect billing anomalies" },
                { key: "residentFollowUps", label: "Suggest resident follow-ups" },
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <span>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={settings.ai[item.key]}
                    onChange={(event) => updateAiFeature(item.key, event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            These preferences are saved locally in the browser for now and instantly applied to the dashboard shell.
          </div>
        </aside>
      </div>
    </div>
  );
}

export default SettingsPage;
