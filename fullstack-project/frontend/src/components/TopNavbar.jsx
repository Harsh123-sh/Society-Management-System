import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import LanguageSelector from "./LanguageSelector";
import PremiumNotificationButton from "./common/PremiumNotificationButton";
import PremiumThemeToggle from "./common/PremiumThemeToggle";
import { useTranslation } from "../contexts/LanguageContext";
import { getStoredRole, getStoredUser } from "../utils/session";

function TopbarIcon({ name }) {
  const paths = {
    menu: "M4 7h16M4 12h16M4 17h16",
    bell: "M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4",
    chevron: "m6 9 6 6 6-6",
    calendar: "M8 3v4m8-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    shield: "M12 3 5 6v5c0 4.4 2.8 8.4 7 10 4.2-1.6 7-5.6 7-10V6l-7-3Zm-3 9 2 2 4-5",
    logout: "M10 17l5-5-5-5M15 12H3m8-8h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-8",
    check: "M20 6 9 17l-5-5",
    clock: "M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
  };

  return (
    <svg className="dashboard-topbar-svg-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

const pageMeta = {
  dashboard: ["Dashboard", "Operational overview for the society."],
  users: ["Residents", "Manage society residents and approvals."],
  residents: ["Residents", "Manage society residents and approvals."],
  flats: ["Flats & Properties", "Manage flats, ownership, occupancy, and maintenance."],
  property: ["Flats & Properties", "Manage flats, ownership, occupancy, and maintenance."],
  visitors: ["Visitors", "Track visitor movement and approvals."],
  security: ["Visitors", "Track visitor movement and approvals."],
  billing: ["Billing & Finance", "Monitor collections, dues, invoices, and expenses."],
  complaints: ["Complaints", "Resolve resident complaints and service requests."],
  community: ["Complaints", "Resolve resident complaints and service requests."],
  notices: ["Notices", "Society announcements and communication."],
  parking: ["Parking", "Manage parking and shared facility assignments."],
  staff: ["Staff & Security", "Manage staff, shifts, vendors, and security operations."],
  documents: ["Documents", "Store society documents and approvals."],
  analytics: ["Reports & Analytics", "Review society performance and trends."],
  "analytics-ai": ["Reports & Analytics", "Review society performance and trends."],
  settings: ["Settings", "Manage society preferences and account controls."],
};

const notificationsSeed = [
  ["Resident registration", "A-1204 owner KYC is waiting for review.", "2m", "Residents"],
  ["Complaint priority", "Lift issue in Tower B was marked urgent.", "18m", "Complaints"],
  ["Visitor approval", "Guest approval requested for C-0503.", "31m", "Visitors"],
  ["Billing alert", "48 flats have pending maintenance dues.", "1h", "Finance"],
  ["Notice delivery", "Water shutdown notice reached 92% residents.", "3h", "Notices"],
  ["Maintenance update", "Pump inspection scheduled for tomorrow.", "5h", "Maintenance"],
];

const eventMap = {
  5: "Maintenance",
  12: "Billing",
  18: "Holiday",
  24: "AGM",
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getRoleLabel(role, t) {
  if (role === "admin") return "Chairman";
  if (role === "secretary") return "Secretary";
  if (role === "accountant") return "Accountant";
  if (role === "super_admin") return t("role.super_admin");
  if (!role) return t("role.resident");
  return role[0].toUpperCase() + role.slice(1);
}

function getCalendarDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function TopNavbar({ onMenuClick, onLogout }) {
  const { t } = useTranslation();
  const location = useLocation();
  const [now, setNow] = useState(new Date());
  const [profileOpen, setProfileOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileModal, setProfileModal] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [notifications, setNotifications] = useState(notificationsSeed.map((item, index) => ({ id: index + 1, unread: index < 4, item })));
  const [user, setUser] = useState(() => getStoredUser() || {});
  const role = getStoredRole();
  const isStaff = role === "staff";
  const isLeadership = role === "admin" || role === "secretary";
  const societyName = user.societyName || user.society_name || (!isStaff ? localStorage.getItem("societyName") : "") || "Green Valley Society";
  const roleLabel = getRoleLabel(role, t);
  const displayName = user.name || user.userName || (role === "admin" ? "Rohit" : roleLabel);
  const initials = String(displayName || roleLabel || "N").slice(0, 1).toUpperCase();
  const currentSegment = location.pathname.split("/").filter(Boolean).pop() || "dashboard";
  const [pageTitle, pageSubtitle] = pageMeta[currentSegment] || [roleLabel, societyName];
  const leadershipSubtitle = currentSegment === "dashboard"
    ? `${getGreeting()}, ${displayName} - ${societyName}`
    : pageSubtitle;
  const calendarDays = useMemo(() => getCalendarDays(viewMonth), [viewMonth]);
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const refreshUser = () => setUser(getStoredUser() || {});
    window.addEventListener("chairman-settings:profile-updated", refreshUser);
    window.addEventListener("storage", refreshUser);
    return () => {
      window.removeEventListener("chairman-settings:profile-updated", refreshUser);
      window.removeEventListener("storage", refreshUser);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNotifications((current) => current.map((notification, index) => index === 0 ? { ...notification, unread: true } : notification));
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const modalOpen = Boolean(profileModal || confirmLogout);
    if (!modalOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [profileModal, confirmLogout]);

  function changeMonth(delta) {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function markAllRead() {
    setNotifications((current) => current.map((notification) => ({ ...notification, unread: false })));
  }

  function markNotificationRead(id) {
    setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, unread: false } : notification));
  }

  if (!isLeadership) {
    return (
      <header className="dashboard-navbar sticky top-0 z-20 px-4 sm:px-6 lg:px-8">
        <div className="dashboard-navbar-inner mx-auto flex max-w-7xl items-center gap-3">
          <button type="button" onClick={onMenuClick} className="dashboard-menu-button rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm transition md:hidden">
            <TopbarIcon name="menu" />
            <span>{t("common.menu")}</span>
          </button>
          <div className="dashboard-page-title">
            <strong>{pageTitle}</strong>
            <span>{pageSubtitle}</span>
          </div>
          <div className="dashboard-navbar-actions ml-auto flex items-center gap-2">
            <LanguageSelector className="hidden lg:block" supportedCodes={["en", "hi", "gu"]} />
            <PremiumThemeToggle />
            <button type="button" onClick={() => setConfirmLogout(true)} className="dashboard-logout-button auth-button auth-button--primary rounded-xl px-4 py-2 text-sm">
              <TopbarIcon name="logout" />
              <span className="hidden xl:inline">{t("security.logout")}</span>
            </button>
          </div>
        </div>
        {confirmLogout ? <LogoutDialog onCancel={() => setConfirmLogout(false)} onConfirm={onLogout} /> : null}
      </header>
    );
  }

  return (
    <header className="dashboard-navbar chairman-topbar sticky top-0 z-20 px-4 sm:px-6 lg:px-8">
      <div className="dashboard-navbar-inner chairman-topbar-inner mx-auto flex max-w-none items-center gap-3">
        <button type="button" onClick={onMenuClick} className="dashboard-menu-button rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm transition md:hidden">
          <TopbarIcon name="menu" />
          <span>{t("common.menu")}</span>
        </button>

        <div className="dashboard-page-title chairman-page-title">
          <strong>{pageTitle}</strong>
          <span>{leadershipSubtitle}</span>
          {currentSegment === "dashboard" ? <small>Society health stable</small> : null}
        </div>

        <div className="dashboard-date-time chairman-date-card" aria-label="Current date and time">
          <button type="button" onClick={() => setCalendarOpen((open) => !open)}>
            <TopbarIcon name="calendar" />
            <span>
              <strong>{now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
              <small>{now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</small>
            </span>
          </button>
          {calendarOpen ? (
            <CalendarPanel
              viewMonth={viewMonth}
              days={calendarDays}
              today={now}
              onPrev={() => changeMonth(-1)}
              onNext={() => changeMonth(1)}
              onToday={() => setViewMonth(new Date())}
            />
          ) : null}
        </div>

        <div className="dashboard-leadership-actions chairman-actions ml-auto">
          <PremiumNotificationButton
            notifications={notifications}
            unreadCount={unreadCount}
            open={notificationsOpen}
            onOpenChange={setNotificationsOpen}
            onMarkAllRead={markAllRead}
            onMarkRead={markNotificationRead}
            onViewAll={() => setNotificationsOpen(false)}
          />
          <PremiumThemeToggle className="chairman-theme-selector" />
          <LanguageSelector className="chairman-language-selector" supportedCodes={["en", "hi", "gu"]} variant="premium" />
          <div className="dashboard-profile-menu">
            <button type="button" className="dashboard-profile-button" onClick={() => setProfileOpen((open) => !open)} aria-haspopup="menu" aria-expanded={profileOpen}>
              <span className="dashboard-profile-avatar">{initials}</span>
              <span className="dashboard-profile-meta">
                <strong>{displayName}</strong>
                <span>{roleLabel}</span>
              </span>
              <TopbarIcon name="chevron" />
            </button>
            {profileOpen ? (
              <div className="dashboard-profile-dropdown" role="menu">
                <button type="button" role="menuitem" onClick={() => { setProfileModal("profile"); setProfileOpen(false); }}><TopbarIcon name="user" />Profile</button>
                <button type="button" role="menuitem" onClick={() => { setProfileModal("settings"); setProfileOpen(false); }}><TopbarIcon name="check" />Account Settings</button>
                <button type="button" role="menuitem" onClick={() => { setProfileModal("security"); setProfileOpen(false); }}><TopbarIcon name="shield" />Security</button>
                <button type="button" role="menuitem" onClick={() => { setConfirmLogout(true); setProfileOpen(false); }}><TopbarIcon name="logout" />Logout</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {profileModal === "profile" ? <ProfileDialog user={user} societyName={societyName} onClose={() => setProfileModal(null)} /> : null}
      {profileModal === "settings" ? <AccountSettingsDialog user={user} societyName={societyName} onClose={() => setProfileModal(null)} /> : null}
      {profileModal === "security" ? <SecurityDialog user={user} onClose={() => setProfileModal(null)} /> : null}
      {confirmLogout ? <LogoutDialog onCancel={() => setConfirmLogout(false)} onConfirm={onLogout} /> : null}
    </header>
  );
}

function CalendarPanel({ viewMonth, days, today, onPrev, onNext, onToday }) {
  const monthLabel = viewMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  return (
    <div className="chairman-calendar-panel">
      <div className="chairman-calendar-head">
        <button type="button" onClick={onPrev}>Prev</button>
        <strong>{monthLabel}</strong>
        <button type="button" onClick={onNext}>Next</button>
      </div>
      <button type="button" className="chairman-calendar-today" onClick={onToday}>Today</button>
      <div className="chairman-calendar-weekdays">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="chairman-calendar-grid">
        {days.map((date) => {
          const sameMonth = date.getMonth() === viewMonth.getMonth();
          const isToday = date.toDateString() === today.toDateString();
          const event = sameMonth ? eventMap[date.getDate()] : null;
          return (
            <span key={date.toISOString()} className={`${sameMonth ? "" : "is-muted"} ${isToday ? "is-today" : ""} ${event ? "has-event" : ""}`} title={event || ""}>
              {date.getDate()}
              {event ? <i>{event}</i> : null}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function ProfileDialog({ user, societyName, onClose }) {
  return (
    <Modal
      title="Profile Settings"
      subtitle="Manage your Chairman account information."
      onClose={onClose}
      footer={(
        <>
          <button type="button" className="chairman-modal-button chairman-modal-button--ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="chairman-modal-button chairman-modal-button--primary" onClick={onClose}>Save Changes</button>
        </>
      )}
    >
      <div className="chairman-profile-editor">
        <label className="chairman-avatar-upload">
          <span>{String(user.name || user.userName || "R").slice(0, 1).toUpperCase()}</span>
          <input type="file" accept="image/*" />
          <small>Upload profile image</small>
        </label>
        <div className="chairman-form-grid">
          <label>Name<input defaultValue={user.name || user.userName || "Rohit"} /></label>
          <label>Email<input defaultValue={user.email || ""} /></label>
          <label>Phone<input defaultValue={user.phone || user.mobile || ""} /></label>
          <label>Society<input defaultValue={societyName} /></label>
          <label>Designation<input defaultValue="Chairman" /></label>
          <label>Society Code<input defaultValue={user.societyCode || user.society_code || localStorage.getItem("societyId") || ""} /></label>
        </div>
      </div>
    </Modal>
  );
}

function AccountSettingsDialog({ user, societyName, onClose }) {
  return (
    <Modal
      title="Account Settings"
      subtitle="Manage account preferences and contact information."
      onClose={onClose}
      footer={<button type="button" className="chairman-modal-button chairman-modal-button--primary" onClick={onClose}>Close</button>}
    >
      <div className="chairman-security-grid">
        {[
          ["Contact details", user.email || user.phone || "Add verified contact details."],
          ["Society details", societyName || "Society information is loaded from your session."],
          ["Notification preferences", "Choose alerts for approvals, billing, visitors, and notices."],
          ["Regional preferences", "Language and display settings are available in the top navigation."],
        ].map(([title, text]) => (
          <article key={title}>
            <TopbarIcon name="check" />
            <div>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
            <button type="button">Edit</button>
          </article>
        ))}
      </div>
    </Modal>
  );
}

function SecurityDialog({ user, onClose }) {
  return (
    <Modal
      title="Account Security"
      subtitle="Review password, email, session, and login controls."
      onClose={onClose}
      footer={<button type="button" className="chairman-modal-button chairman-modal-button--primary" onClick={onClose}>Close</button>}
    >
      <div className="chairman-security-grid">
        {[
          ["Change password", "Update your account password and recovery details."],
          ["Change email", user.email || "No verified email on this session."],
          ["Two-factor authentication", "Future ready. Connect authenticator or OTP provider."],
          ["Active sessions", "This browser is currently active."],
          ["Login history", "Recent login history will appear after audit sync."],
        ].map(([title, text]) => (
          <article key={title}>
            <TopbarIcon name={title.includes("sessions") || title.includes("history") ? "clock" : "shield"} />
            <div>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
            <button type="button">Manage</button>
          </article>
        ))}
      </div>
    </Modal>
  );
}

function LogoutDialog({ onCancel, onConfirm }) {
  return (
    <Modal
      title="Confirm Logout"
      subtitle="Confirm that you want to end this Chairman session."
      onClose={onCancel}
      footer={(
        <>
          <button type="button" className="chairman-modal-button chairman-modal-button--ghost" onClick={onCancel}>Stay Signed In</button>
          <button type="button" className="chairman-modal-button chairman-modal-button--primary" onClick={onConfirm}>Logout</button>
        </>
      )}
    >
      <p className="chairman-dialog-copy">You will be signed out and redirected to the login page.</p>
    </Modal>
  );
}

function Modal({ title, subtitle, children, footer, onClose }) {
  return (
    <div className="chairman-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="chairman-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="chairman-modal-head">
          <div>
            <h2><span className="chairman-modal-title-icon" aria-hidden="true"><TopbarIcon name="user" /></span>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog">X</button>
        </div>
        <div className="chairman-modal-body">
          {children}
        </div>
        {footer ? <div className="chairman-modal-footer">{footer}</div> : null}
      </section>
    </div>
  );
}

export default TopNavbar;
