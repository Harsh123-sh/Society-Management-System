import { useState } from "react";
import PremiumNotificationButton from "../../components/common/PremiumNotificationButton";
import { adminProfile } from "../data/navigation";

const adminNotificationsSeed = [
  { id: 1, title: "Payment Overdue", message: "Flat A-101 payment overdue by 30 days", time: "5m ago", category: "Finance", unread: true },
  { id: 2, title: "New Complaint", message: "Water leakage reported in Wing B", time: "15m ago", category: "Complaint", unread: true },
  { id: 3, title: "Visitor Alert", message: "Unusual visitor activity detected", time: "1h ago", category: "Security", unread: true },
];

function Navbar() {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(adminNotificationsSeed);
  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <nav className="fixed right-0 top-0 z-30 w-full border-b border-slate-200 bg-white shadow-sm lg:left-64">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex-1">
          <div className="hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search residents, payments, complaints..."
                className="w-80 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 pl-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">Search</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="hidden items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-[var(--text-main)] hover:shadow-lg transition-all md:flex">
            <span>AI</span>
            AI Assistant
          </button>

          <PremiumNotificationButton
            notifications={notifications}
            unreadCount={unreadCount}
            open={showNotifications}
            onOpenChange={(nextOpen) => {
              setShowNotifications(nextOpen);
              if (nextOpen) setShowProfile(false);
            }}
            onMarkAllRead={() => setNotifications((current) => current.map((item) => ({ ...item, unread: false })))}
            onMarkRead={(id) => setNotifications((current) => current.map((item) => item.id === id ? { ...item, unread: false } : item))}
          />

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

            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-200 px-4 py-3">
                  <p className="font-semibold text-slate-900">{adminProfile.name}</p>
                  <p className="text-sm text-slate-500">{adminProfile.email}</p>
                </div>
                <div className="py-2">
                  {[
                    { icon: "User", label: "Profile" },
                    { icon: "Lock", label: "Change Password" },
                    { icon: "Settings", label: "Settings" },
                    { icon: "Log", label: "Activity Log" },
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
