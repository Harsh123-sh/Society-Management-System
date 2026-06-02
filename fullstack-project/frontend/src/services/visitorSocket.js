import { io } from "socket.io-client";
import { getBackendBaseUrl } from "./runtimeUrls";

let socket = null;

function getBaseUrl() {
  return getBackendBaseUrl();
}

export function connectVisitorSocket() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  if (socket?.connected) return socket;

  socket = io(getBaseUrl(), {
    transports: ["websocket", "polling"],
    auth: {
      token: `Bearer ${token}`,
    },
  });

  return socket;
}

function bindVisitorEvent(eventName, callback) {
  if (!socket) return () => {};

  socket.on(eventName, callback);
  return () => socket.off(eventName, callback);
}

export function onVisitorNewEntry(callback) {
  return bindVisitorEvent("visitor:new_entry", callback);
}

export function onVisitorPreapproval(callback) {
  return bindVisitorEvent("visitor:preapproval_created", callback);
}

export function onVisitorBlacklist(callback) {
  return bindVisitorEvent("visitor:blacklist_detected", callback);
}

export function onVisitorEmergencyAlert(callback) {
  return bindVisitorEvent("visitor:emergency_alert", callback);
}

export function onVisitorOtpVerified(callback) {
  return bindVisitorEvent("visitor:otp_verified", callback);
}

export function disconnectVisitorSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}
