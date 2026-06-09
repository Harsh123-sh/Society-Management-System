import { useEffect, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage } from "../services/authApi";
import { fetchNotifications, markNotificationAsRead } from "../services/notificationApi";

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: "", message: "" });

  async function loadNotifications() {
    try {
      setLoading(true);
      const response = await fetchNotifications();
      setNotifications(response.data || []);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not load notifications") });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function handleMarkRead(id) {
    try {
      await markNotificationAsRead(id);
      await loadNotifications();
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not update notification") });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
        <p className="text-sm text-slate-600">Track important society alerts, approvals, and updates.</p>
      </div>

      <AlertMessage type={alert.type} message={alert.message} />

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Loading notifications...</div>
      ) : notifications.length ? (
        <div className="space-y-3">
          {notifications.map((item) => (
            <article key={item.id} className={`rounded-xl border p-4 shadow-sm ${item.is_read ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-700">{item.message}</p>
                  <p className="mt-2 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                {!item.is_read && (
                  <button onClick={() => handleMarkRead(item.id)} className="rounded-lg theme-surface px-3 py-2 text-xs font-semibold text-[var(--text-main)]">Mark read</button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">No notifications yet.</div>
      )}
    </div>
  );
}

export default NotificationsPage;