import React from "react";
import {
  Activity,
  Bell,
  Building2,
  ClipboardCheck,
  CreditCard,
  FileClock,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Search,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { clearSuperAdminSession } from "../../utils/session";
import nexoraLogo from "../../assets/branding/nexora-logo-dark.png";

const navItems = [
  { key: "overview", icon: LayoutDashboard, label: "Dashboard Overview" },
  { key: "societies", icon: Building2, label: "Society Management" },
  { key: "create", icon: ClipboardCheck, label: "Create Society" },
  { key: "chairman", icon: ShieldCheck, label: "Chairman Approvals" },
  { key: "secretary", icon: UserCog, label: "Secretary Approvals" },
  { key: "users", icon: Users, label: "User Management" },
  { key: "plans", icon: CreditCard, label: "Subscription Plans" },
  { key: "billing", icon: Activity, label: "Billing & Revenue" },
  { key: "support", icon: Bell, label: "Support Tickets" },
  { key: "health", icon: HeartPulse, label: "System Health" },
  { key: "audit", icon: FileClock, label: "Audit Logs" },
  { key: "settings", icon: Settings, label: "Settings" },
];

function MenuItem({ icon: Icon, label, active, onClick }) {
  return (
    <button className={`sa-menu-item ${active ? "active" : ""}`} onClick={onClick} type="button" title={label}>
      <span className="sa-menu-icon" aria-hidden>{React.createElement(Icon, { size: 18 })}</span>
      <span className="sa-menu-label">{label}</span>
    </button>
  );
}

export default function Sidebar({ activeKey, onChange, collapsed, onToggle, search = "", onSearch, mobileOpen = false, onCloseMobile }) {
  const filteredItems = navItems.filter((item) => item.label.toLowerCase().includes(String(search).toLowerCase()));

  function logout() {
    if (!confirm("Logout from Super Admin?")) return;
    clearSuperAdminSession();
    window.location.assign("/super-admin/login");
  }

  return (
    <>
    <button className={`sa-mobile-backdrop ${mobileOpen ? "is-open" : ""}`} type="button" aria-label="Close menu" onClick={onCloseMobile} />
    <aside className={`sa-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "is-mobile-open" : ""}`}>
      <div className="sa-brand">
        <button className="sa-logo-mark" type="button" onClick={() => onChange("overview")} aria-label="Open dashboard">
          <img src={nexoraLogo} alt="" />
        </button>
        <div className="sa-logo-copy">
          <strong>Nexora</strong>
          <span>Super Admin</span>
        </div>
        <button className="sa-collapse" onClick={onToggle} aria-label="Toggle sidebar" type="button"><Menu size={18} /></button>
        <button className="sa-mobile-close" onClick={onCloseMobile} aria-label="Close menu" type="button"><X size={18} /></button>
      </div>

      <div className="sa-profile">
        <div className="sa-avatar">SA</div>
        <div className="sa-profile-info">
          <div className="sa-name">Super Admin</div>
          <div className="sa-role">Platform Operations</div>
        </div>
      </div>

      <label className="sa-menu-search">
        <Search size={16} />
        <input value={search} onChange={(event) => onSearch?.(event.target.value)} placeholder="Search menu" />
      </label>

      <button className="sa-create-shortcut" type="button" onClick={() => onChange("create")}>
        <PlusCircle size={18} />
        <span>Create Society</span>
      </button>

      <nav className="sa-menu" aria-label="Super Admin dashboard">
        {filteredItems.map((item) => (
          <MenuItem key={item.key} icon={item.icon} label={item.label} active={activeKey === item.key} onClick={() => onChange(item.key)} />
        ))}
      </nav>

      <div className="sa-logout">
        <button onClick={logout} type="button"><LogOut size={18} /><span>Logout</span></button>
      </div>
    </aside>
    </>
  );
}
