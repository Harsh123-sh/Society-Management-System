import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { menuItems } from "../data/navigation";

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 z-40 h-screen bg-gradient-to-b from-[var(--page-bg)] to-[var(--page-bg)] text-[var(--text-main)] shadow-2xl transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo Section */}
        <div className="border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${collapsed ? "justify-center w-full" : ""}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <span className="text-lg font-bold">📱</span>
              </div>
              {!collapsed && (
                <div>
                  <h1 className="text-sm font-bold">Society Pro</h1>
                  <p className="text-xs text-slate-400">Admin Dashboard</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden rounded-lg p-1 hover:theme-surface lg:block"
            >
              {collapsed ? "→" : "←"}
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="overflow-y-auto p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`group flex items-center justify-between rounded-lg px-3 py-3 transition-all ${
                  isActive(item.path)
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-[var(--text-main)] shadow-lg"
                    : "text-slate-300 hover:theme-surface/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </div>
                {!collapsed && item.badge && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-700 p-4">
          <div className="flex items-center justify-between rounded-lg theme-surface/30 p-3">
            <div className={`flex items-center gap-2 ${collapsed ? "justify-center w-full" : ""}`}>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
              {!collapsed && (
                <div className="text-xs">
                  <p className="font-semibold">Admin User</p>
                  <p className="text-slate-400">v1.0</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <div
        className={`fixed inset-0 z-30 theme-modal-backdrop transition-opacity duration-300 lg:hidden ${
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        onClick={() => setCollapsed(true)}
      ></div>
    </>
  );
}

export default Sidebar;
