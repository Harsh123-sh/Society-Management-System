import { useState } from "react";
import { adminProfile } from "../data/navigation";

function Navbar() {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <nav className="fixed right-0 top-0 z-30 w-full border-b border-slate-200 bg-white shadow-sm lg:left-64">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section - Search */}
        <div className="flex-1">
          <div className="hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search residents, payments, complaints..."
                className="w-80 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 pl-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            </div>
          </div>
        </div>

        {/* Right Section - Icons & Profile */}
        <div className="flex items-center gap-4">
          {/* AI Assistant Button */}
          <button className="hidden items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg transition-all md:flex">
            <span>🤖</span>
            AI Assistant
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
              className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <span className="text-xl">🔔</span>
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                3
              </span>
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-200 px-4 py-3">
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {[
                    {
                      id: 1,
                      title: "Payment Overdue",
                      message: "Flat A-101 payment overdue by 30 days",
                      time: "5m ago",
                      icon: "⚠️",
                    },
                    {
                      id: 2,
                      title: "New Complaint",
                      message: "Water leakage reported in Wing B",
                      time: "15m ago",
                      icon: "⚡",
                    },
                    {
                      id: 3,
                      title: "Visitor Alert",
                      message: "Unusual visitor activity detected",
                      time: "1h ago",
                      icon: "👤",
                    },
                  ].map((notif) => (
                    <div
                      key={notif.id}
                      className="border-b border-slate-100 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex gap-3">
                        <span className="text-lg">{notif.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{notif.title}</p>
                          <p className="text-sm text-slate-600">{notif.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100 transition-colors"
            >
              <img
                src={adminProfile.avatar}
                alt="Admin"
                className="h-8 w-8 rounded-full"
              />
              <div className="hidden text-left md:block">
                <p className="text-sm font-semibold text-slate-900">
                  {adminProfile.name}
                </p>
                <p className="text-xs text-slate-500">{adminProfile.role}</p>
              </div>
            </button>

            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-200 px-4 py-3">
                  <p className="font-semibold text-slate-900">{adminProfile.name}</p>
                  <p className="text-sm text-slate-500">{adminProfile.email}</p>
                </div>
                <div className="py-2">
                  {[
                    { icon: "👤", label: "Profile" },
                    { icon: "🔐", label: "Change Password" },
                    { icon: "⚙️", label: "Settings" },
                    { icon: "📋", label: "Activity Log" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className="flex w-full items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <span>{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-200 px-4 py-2">
                  <button className="w-full rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors">
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
