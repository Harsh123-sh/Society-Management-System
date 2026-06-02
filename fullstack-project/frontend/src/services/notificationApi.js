import { api } from "./authApi";

export async function fetchNotifications(params = {}) {
  const { data } = await api.get("/notifications", { params });
  return data;
}

export async function markNotificationAsRead(id) {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
}

export async function createNotification(payload) {
  const { data } = await api.post("/notifications", payload);
  return data;
}

export async function registerDeviceToken(payload) {
  const { data } = await api.post("/notifications/devices/register", payload);
  return data;
}

export async function unregisterDeviceToken(fcmToken) {
  const { data } = await api.delete(`/notifications/devices/${encodeURIComponent(fcmToken)}`);
  return data;
}

export async function registerWebSubscription(subscription) {
  const { data } = await api.post("/notifications/web-subscriptions", { subscription });
  return data;
}

export async function unregisterWebSubscription(endpoint) {
  const { data } = await api.delete("/notifications/web-subscriptions", { data: { endpoint } });
  return data;
}

export async function sendPushAlert(payload) {
  const { data } = await api.post("/notifications/push/send", payload);
  return data;
}

export async function createEventReminder(payload) {
  const { data } = await api.post("/notifications/events", payload);
  return data;
}

export async function dispatchEventReminders(payload = {}) {
  const { data } = await api.post("/notifications/events/dispatch", payload);
  return data;
}