import { useState } from "react";
import notificationBellIcon from "../../assets/ui/notification-premium-icon.png";
import "./premium-controls.css";

function isUnread(item) {
  if (typeof item?.unread === "boolean") return item.unread;
  if (typeof item?.is_read === "boolean") return !item.is_read;
  if (item?.read_at) return false;
  return Boolean(item?.unread || item?.read === false);
}

function getNotificationContent(item = {}) {
  if (Array.isArray(item.item)) {
    return {
      title: item.item[0] || "Notification",
      message: item.item[1] || "",
      time: item.item[2] ? `${item.item[2]} ago` : "",
      category: item.item[3] || "Update",
    };
  }

  return {
    title: item.title || item.alert_type || item.category || item.label || "Notification",
    message: item.message || item.description || item.priority || item.detail || "New update available.",
    time: item.time || item.created_at || item.updated_at || "",
    category: item.category || item.type || item.status || "Update",
  };
}

function formatCount(count) {
  if (!count) return "";
  return count > 99 ? "99+" : String(count);
}

export default function PremiumNotificationButton({
  notifications = [],
  unreadCount,
  open,
  onOpenChange,
  onMarkAllRead,
  onMarkRead,
  onViewAll,
  className = "",
  dropdownClassName = "",
  ariaLabel = "Notifications",
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = typeof open === "boolean" ? open : internalOpen;
  const count = typeof unreadCount === "number" ? unreadCount : notifications.filter(isUnread).length;

  function setOpen(nextOpen) {
    if (onOpenChange) onOpenChange(nextOpen);
    else setInternalOpen(nextOpen);
  }

  function handleMarkRead(item) {
    if (onMarkRead) onMarkRead(item.id ?? item.notice_id ?? item.key, item);
  }

  return (
    <div className={`premium-control-anchor ${className}`.trim()}>
      <button
        type="button"
        className={`premium-circle-button premium-notification-button ${isOpen ? "is-open" : ""}`}
        onClick={() => setOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`${ariaLabel}${count ? `, ${count} unread` : ""}`}
        title={ariaLabel}
      >
        <img className="premium-control-icon" src={notificationBellIcon} alt="" aria-hidden="true" />
        {count ? <span className="premium-notification-badge">{formatCount(count)}</span> : null}
      </button>

      {isOpen ? (
        <section className={`premium-notification-dropdown ${dropdownClassName}`.trim()} role="dialog" aria-label="Notification center">
          <header className="premium-notification-head">
            <div>
              <strong>Notifications</strong>
              <span>{count} unread</span>
            </div>
            <button type="button" onClick={onMarkAllRead} disabled={!count}>Mark all read</button>
          </header>

          <div className="premium-notification-list">
            {notifications.length ? notifications.slice(0, 8).map((item, index) => {
              const key = item.id ?? item.notice_id ?? item.key ?? index;
              const content = getNotificationContent(item);
              const unread = isUnread(item);
              return (
                <article className={`premium-notification-item ${unread ? "is-unread" : ""}`} key={key}>
                  <span className="premium-notification-dot" aria-hidden="true" />
                  <div>
                    <strong>{content.title}</strong>
                    <p>{content.message}</p>
                    <div className="premium-notification-meta">
                      <span>{content.category}{content.time ? ` / ${content.time}` : ""}</span>
                      {unread && onMarkRead ? <button type="button" onClick={() => handleMarkRead(item)}>Mark as read</button> : null}
                    </div>
                  </div>
                </article>
              );
            }) : <div className="premium-notification-empty">No notifications yet.</div>}
          </div>

          {onViewAll ? <button type="button" className="premium-notification-footer" onClick={onViewAll}>View all notifications</button> : null}
        </section>
      ) : null}
    </div>
  );
}
