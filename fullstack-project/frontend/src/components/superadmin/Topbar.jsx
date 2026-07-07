import React from "react";
import { Bell, ChevronDown, Globe2, Moon, Search, Sun } from "lucide-react";

function Clock() {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="sa-date-card">
      <strong>{time.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
      <span>{time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
    </div>
  );
}

export default function Topbar({ title = "Dashboard Overview" }) {
  const [theme, setTheme] = React.useState(() => localStorage.getItem("superAdminTheme") || "light");
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [language, setLanguage] = React.useState(() => localStorage.getItem("language") || "EN");

  React.useEffect(() => {
    localStorage.setItem("superAdminTheme", theme);
    document.documentElement.dataset.superAdminTheme = theme;
  }, [theme]);

  function changeLanguage(value) {
    setLanguage(value);
    localStorage.setItem("language", value);
  }

  return (
    <header className="sa-topbar">
      <div className="sa-topbar-title">
        <span>Super Admin</span>
        <strong>{title}</strong>
      </div>

      <label className="sa-global-search">
        <Search size={17} />
        <input placeholder="Search societies, users, tickets..." />
      </label>

      <div className="sa-topbar-right">
        <Clock />
        <div className="sa-dropdown">
          <button className="sa-icon" type="button" onClick={() => setNotificationsOpen((value) => !value)} aria-label="Notifications">
            <Bell size={18} />
            <i>3</i>
          </button>
          {notificationsOpen ? (
            <div className="sa-popover">
              <strong>Notifications</strong>
              <button type="button">2 chairman registrations pending</button>
              <button type="button">Subscription renewal queue updated</button>
              <button type="button">System health checks are green</button>
            </div>
          ) : null}
        </div>
        <button className="sa-icon" type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <label className="sa-lang">
          <Globe2 size={16} />
          <select value={language} onChange={(event) => changeLanguage(event.target.value)}>
            <option value="EN">EN</option>
            <option value="HI">HI</option>
            <option value="GU">GU</option>
          </select>
        </label>
        <div className="sa-dropdown">
          <button className="sa-profile-mini" type="button" onClick={() => setProfileOpen((value) => !value)}>
            <span>SA</span>
            <div><strong>Super Admin</strong><small>Platform</small></div>
            <ChevronDown size={16} />
          </button>
          {profileOpen ? (
            <div className="sa-popover sa-profile-menu">
              <button type="button">Profile</button>
              <button type="button">Settings</button>
              <button type="button">Audit Trail</button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
