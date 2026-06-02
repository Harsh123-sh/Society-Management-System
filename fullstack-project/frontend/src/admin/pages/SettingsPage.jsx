import { useState } from "react";

function SettingsPage() {
  const [settings, setSettings] = useState({
    societyName: "Greenview Heights",
    email: "admin@greenviewheights.com",
    phone: "+91 8765432100",
    address: "123 Society Lane, City, State",
    maintenanceCharges: "2500",
    waterCharges: "150",
    parkingCharges: "500",
  });

  const [roles, setRoles] = useState([
    { role: "Admin", permissions: ["View All", "Manage Users", "Create Notices", "Manage Payments"], color: "red" },
    { role: "Manager", permissions: ["View Dashboard", "Manage Complaints", "Create Notices"], color: "blue" },
    { role: "Staff", permissions: ["View Visitors", "Log Attendance"], color: "green" },
    { role: "Resident", permissions: ["View Notices", "Pay Bills", "Complaint Submission"], color: "slate" },
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">⚙️ Settings</h1>
        <p className="mt-2 text-slate-600">Manage society configuration and permissions</p>
      </div>

      {/* Society Settings */}
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">🏢 Society Information</h2>
        
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Society Name
              </label>
              <input
                type="text"
                value={settings.societyName}
                onChange={(e) =>
                  setSettings({ ...settings, societyName: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) =>
                  setSettings({ ...settings, email: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) =>
                  setSettings({ ...settings, phone: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) =>
                  setSettings({ ...settings, address: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-white hover:shadow-lg transition-all">
            💾 Save Changes
          </button>
        </div>
      </div>

      {/* Charges Settings */}
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">💰 Fee Structure</h2>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Maintenance Charges (₹/month)
            </label>
            <input
              type="number"
              value={settings.maintenanceCharges}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maintenanceCharges: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Water Charges (₹/month)
            </label>
            <input
              type="number"
              value={settings.waterCharges}
              onChange={(e) =>
                setSettings({ ...settings, waterCharges: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Parking Charges (₹/month)
            </label>
            <input
              type="number"
              value={settings.parkingCharges}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  parkingCharges: e.target.value,
                })
              }
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <button className="mt-6 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-white hover:shadow-lg transition-all">
          💾 Update Charges
        </button>
      </div>

      {/* Role & Permissions */}
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">🔐 Roles & Permissions</h2>
        
        <div className="space-y-4">
          {roles.map((roleData) => (
            <div
              key={roleData.role}
              className="rounded-lg border border-slate-200 p-6 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-900">
                    {roleData.role}
                  </h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {roleData.permissions.map((perm) => (
                      <span
                        key={perm}
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-${roleData.color}-100 text-${roleData.color}-700`}
                      >
                        ✓ {perm}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="rounded-lg bg-slate-100 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200 transition-colors">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="mt-6 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-white hover:shadow-lg transition-all">
          ➕ Add New Role
        </button>
      </div>

      {/* Notification Settings */}
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">🔔 Notifications</h2>
        
        <div className="space-y-4">
          {[
            { setting: "Email Alerts", enabled: true },
            { setting: "SMS Notifications", enabled: false },
            { setting: "Push Notifications", enabled: true },
            { setting: "Payment Reminders", enabled: true },
            { setting: "Complaint Updates", enabled: true },
            { setting: "Visitor Alerts", enabled: false },
          ].map((notif) => (
            <div
              key={notif.setting}
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
            >
              <span className="font-semibold text-slate-900">{notif.setting}</span>
              <button
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  notif.enabled ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    notif.enabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                ></span>
              </button>
            </div>
          ))}
        </div>

        <button className="mt-6 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-white hover:shadow-lg transition-all">
          💾 Save Preferences
        </button>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl bg-red-50 p-8 border border-red-200">
        <h2 className="text-2xl font-bold text-red-900 mb-6">⚠️ Danger Zone</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-red-900">Clear Cache</p>
              <p className="text-sm text-red-700">Remove all cached data</p>
            </div>
            <button className="rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600 transition-colors">
              Clear
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-red-900">Reset Database</p>
              <p className="text-sm text-red-700">This action cannot be undone</p>
            </div>
            <button className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 transition-colors">
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
