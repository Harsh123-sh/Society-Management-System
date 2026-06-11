import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

const menuItems = [
  { id: 1, name: "Dashboard", path: "/security-dashboard", icon: "D" },
  { id: 2, name: "Visitors", path: "/security-dashboard/visitors", icon: "V" },
  { id: 3, name: "Pre-Approved", path: "/security-dashboard/pre-approved", icon: "P" },
  { id: 4, name: "Deliveries", path: "/security-dashboard/deliveries", icon: "L" },
  { id: 5, name: "Vehicles", path: "/security-dashboard/vehicles", icon: "C" },
  { id: 6, name: "Gate Pass", path: "/security-dashboard/gate-pass", icon: "G" },
  { id: 7, name: "Staff Entry", path: "/security-dashboard/staff-entry", icon: "S" },
  { id: 8, name: "Alerts", path: "/security-dashboard/alerts", icon: "A" },
  { id: 9, name: "Reports", path: "/security-dashboard/reports", icon: "R" },
  { id: 10, name: "Settings", path: "/security-dashboard/settings", icon: "T" },
];

function SecuritySidebar() {
  const [collapsed, setCollapsed] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 1024 : false));

  useEffect(() => {
    function handleOpen() {
      setCollapsed(false);
    }

    window.addEventListener("security-sidebar:open", handleOpen);
    return () => window.removeEventListener("security-sidebar:open", handleOpen);
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {!collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          className="dashboard-overlay fixed inset-0 z-30 lg:hidden"
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`security-sidebar dashboard-sidebar fixed left-0 top-0 z-40 h-screen border-r border-[var(--border)] bg-[var(--card-bg)] transition-all duration-300 ${
          collapsed ? "w-0 lg:w-20" : "w-64 lg:w-64"
        }`}
      >
        {/* Header */}
        <div className="flex h-20 items-center justify-between border-b border-[var(--border)] px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              <div>
                <h1 className="text-lg font-bold text-[var(--text-primary)]">Security</h1>
                <p className="text-xs text-[var(--text-secondary)]">Command Center</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="security-icon-button hidden lg:block text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {menuItems.map((item) => {
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 1024) {
                    setCollapsed(true);
                  }
                }}
                className={({ isActive }) =>
                  `security-nav-link dashboard-nav-link flex items-center gap-3 rounded-lg px-4 py-3 transition-all ${
                    isActive ? "is-active bg-[rgb(var(--app-primary-rgb))] text-[var(--text-main)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  } ${collapsed ? "justify-center" : ""}`
                }
                title={collapsed ? item.name : ""}
              >
                <span className="text-sm font-semibold">•</span>
                {!collapsed && <span className="text-sm font-semibold">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t border-[var(--border)] p-4">
            <div className="text-sm text-[var(--text-secondary)]">
              <p className="font-semibold text-[var(--text-primary)]">Guard ID: SEC001</p>
              <p>Shift: 8 AM - 4 PM</p>
            </div>
          </div>
        )}
      </aside>

      {/* Close Button for Mobile */}
      {!collapsed && (
        <button
          onClick={() => setCollapsed(true)}
          className="security-mobile-close fixed right-4 top-4 z-50 lg:hidden text-[var(--text-main)] text-2xl"
        >
          ✕
        </button>
      )}
    </>
  );
}

export default SecuritySidebar;
