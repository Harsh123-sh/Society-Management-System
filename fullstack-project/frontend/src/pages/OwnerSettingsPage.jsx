import { useEffect, useState } from "react";
import { getAppearanceSettings, saveAppearanceSettings } from "../utils/appearance";

const OWNER_SETTINGS_KEY = "society_owner_settings_v1";

const accentOptions = [
  { label: "Teal", value: "15 118 110" },
  { label: "Blue", value: "37 99 235" },
  { label: "Amber", value: "217 119 6" },
];

function readSavedSettings() {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(OWNER_SETTINGS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function OwnerSettingsPage() {
  const [settings, setSettings] = useState(() => ({
    emailAlerts: true,
    paymentReminders: true,
    maintenanceUpdates: true,
    visitorAlerts: true,
    smartReplies: true,
    privacyMode: false,
    notificationTone: "Balanced",
    appearance: getAppearanceSettings(),
  }));

  useEffect(() => {
    const saved = readSavedSettings();
    if (saved) {
      setSettings((previous) => ({
        ...previous,
        ...saved,
        appearance: { ...previous.appearance, ...(saved.appearance || {}) },
      }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(OWNER_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    saveAppearanceSettings(settings.appearance);
  }, [settings.appearance]);

  function update(key, value) {
    setSettings((previous) => ({ ...previous, [key]: value }));
  }

  function updateAppearance(key, value) {
    setSettings((previous) => ({
      ...previous,
      appearance: { ...previous.appearance, [key]: value },
    }));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-teal-800 p-6 text-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.55)] sm:p-8">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
          <span>Owner Control Panel</span>
          <span className="rounded-full border border-white/15 px-3 py-1 text-[10px] tracking-[0.18em]">Persistent preferences</span>
        </div>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">Personal preferences and smart notifications</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
          Fine-tune how you receive payment reminders, visitor alerts, and AI-generated helper prompts for your flat.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-lg font-semibold text-slate-950">Notifications</h3>
            <p className="text-sm text-slate-500">Keep the important reminders, reduce the noise.</p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                { key: "emailAlerts", label: "Email payment reminders" },
                { key: "paymentReminders", label: "Maintenance due reminders" },
                { key: "maintenanceUpdates", label: "Maintenance status updates" },
                { key: "visitorAlerts", label: "Visitor arrival alerts" },
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <span>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={settings[item.key]}
                    onChange={(event) => update(item.key, event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-lg font-semibold text-slate-950">AI helper tools</h3>
            <p className="text-sm text-slate-500">Lightweight automation for day-to-day flat management.</p>

            <div className="mt-5 space-y-3">
              <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <span>Smart reply suggestions in chat</span>
                <input
                  type="checkbox"
                  checked={settings.smartReplies}
                  onChange={(event) => update("smartReplies", event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
              </label>
              <label className="space-y-2 block">
                <span className="text-sm font-medium text-slate-700">Notification tone</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  value={settings.notificationTone}
                  onChange={(event) => update("notificationTone", event.target.value)}
                >
                  <option value="Balanced">Balanced</option>
                  <option value="Concise">Concise</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </label>
              <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <span>Privacy mode for public status</span>
                <input
                  type="checkbox"
                  checked={settings.privacyMode}
                  onChange={(event) => update("privacyMode", event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
              </label>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-lg font-semibold text-slate-950">Appearance</h3>
            <p className="text-sm text-slate-500">Align the dashboard with your preference.</p>

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {accentOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateAppearance("accent", option.value)}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                      settings.appearance.accent === option.value
                        ? "border-teal-500 bg-teal-50 text-teal-800"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: `rgb(${option.value})` }} />
                    {option.label}
                  </button>
                ))}
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

          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            These preferences are saved locally in the browser for now and instantly applied to the dashboard shell.
          </div>
        </aside>
      </div>
    </div>
  );
}

export default OwnerSettingsPage;
