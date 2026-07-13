import { useState } from "react";
import { motion as Motion } from "framer-motion";
import { getStoredUser } from "../utils/session";

function TenantSettings() {
  const user = getStoredUser();
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Manage your account and preferences
        </p>
      </div>

      <div className="flex gap-4 border-b dark:border-slate-700" style={{ borderColor: "var(--border)" }}>
        {[
          { id: "profile", label: "Profile Settings" },
          { id: "password", label: "Change Password" },
          { id: "notifications", label: "Notifications" },
          { id: "language", label: "Language" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium text-sm transition border-b-2 ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <Motion.div
          className="rounded-2xl border bg-white p-8 dark:bg-slate-800"
          style={{ borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
                style={{ borderColor: "var(--border)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
                style={{ borderColor: "var(--border)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="w-full rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
                style={{ borderColor: "var(--border)" }}
              />
            </div>
            <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
              Save Changes
            </button>
          </div>
        </Motion.div>
      )}

      {activeTab === "password" && (
        <Motion.div
          className="rounded-2xl border bg-white p-8 dark:bg-slate-800"
          style={{ borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Password</label>
              <input
                type="password"
                className="w-full rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
                style={{ borderColor: "var(--border)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Password</label>
              <input
                type="password"
                className="w-full rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
                style={{ borderColor: "var(--border)" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm Password</label>
              <input
                type="password"
                className="w-full rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
                style={{ borderColor: "var(--border)" }}
              />
            </div>
            <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
              Update Password
            </button>
          </div>
        </Motion.div>
      )}

      {activeTab === "notifications" && (
        <Motion.div
          className="rounded-2xl border bg-white p-8 dark:bg-slate-800"
          style={{ borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Notification Preferences</h2>
          <div className="space-y-4">
            {[
              { id: "bills", label: "Bill Notifications", desc: "Receive updates about bills" },
              { id: "complaints", label: "Complaint Updates", desc: "Get notified about complaint status" },
              { id: "community", label: "Community Alerts", desc: "Receive community announcements" },
              { id: "events", label: "Event Invitations", desc: "Get invited to upcoming events" },
            ].map((pref) => (
              <div key={pref.id} className="flex items-center justify-between p-4 border rounded-lg dark:border-slate-700" style={{ borderColor: "var(--border)" }}>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{pref.label}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{pref.desc}</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
            ))}
          </div>
        </Motion.div>
      )}

      {activeTab === "language" && (
        <Motion.div
          className="rounded-2xl border bg-white p-8 dark:bg-slate-800"
          style={{ borderColor: "var(--border)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Language Preferences</h2>
          <select className="w-full rounded-lg border px-4 py-2 dark:bg-slate-700 dark:border-slate-600" style={{ borderColor: "var(--border)" }}>
            <option>English</option>
            <option>Hindi</option>
            <option>Gujarati</option>
            <option>Marathi</option>
          </select>
        </Motion.div>
      )}
    </div>
  );
}

export default TenantSettings;
