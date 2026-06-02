import { io } from "socket.io-client";
import { getBackendBaseUrl } from "./runtimeUrls";

let socket = null;

function getBaseUrl() {
  return getBackendBaseUrl();
}

export function connectChatSocket() {
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

export function onChatMessage(callback) {
  if (!socket) return () => {};

  socket.on("chat:new_message", callback);
  return () => socket.off("chat:new_message", callback);
}

export function onChatMessageUpdated(callback) {
  if (!socket) return () => {};

  socket.on("chat:message_updated", callback);
  return () => socket.off("chat:message_updated", callback);
}

export function onChatPresence(callback) {
  if (!socket) return () => {};

  socket.on("chat:presence", callback);
  return () => socket.off("chat:presence", callback);
}

export function onChatReceipt(callback) {
  if (!socket) return () => {};

  socket.on("chat:receipt", callback);
  return () => socket.off("chat:receipt", callback);
}

export function onChatTyping(callback) {
  if (!socket) return () => {};

  socket.on("chat:typing", callback);
  return () => socket.off("chat:typing", callback);
}

export function onChatPushNotification(callback) {
  if (!socket) return () => {};

  socket.on("chat:push_notification", callback);
  return () => socket.off("chat:push_notification", callback);
}

export function onChatCallInvite(callback) {
  if (!socket) return () => {};

  socket.on("chat:call_invite", callback);
  return () => socket.off("chat:call_invite", callback);
}

export function onChatWebRtcOffer(callback) {
  if (!socket) return () => {};

  socket.on("chat:webrtc_offer", callback);
  return () => socket.off("chat:webrtc_offer", callback);
}

export function onChatWebRtcAnswer(callback) {
  if (!socket) return () => {};

  socket.on("chat:webrtc_answer", callback);
  return () => socket.off("chat:webrtc_answer", callback);
}

export function onChatWebRtcIceCandidate(callback) {
  if (!socket) return () => {};

  socket.on("chat:webrtc_ice_candidate", callback);
  return () => socket.off("chat:webrtc_ice_candidate", callback);
}

export function onChatCallEnd(callback) {
  if (!socket) return () => {};

  socket.on("chat:call_end", callback);
  return () => socket.off("chat:call_end", callback);
}

export function emitChatTyping(payload) {
  if (!socket) return;
  socket.emit("chat:typing", payload);
}

export function emitChatJoinThread(threadId) {
  if (!socket || !threadId) return;
  socket.emit("chat:join_thread", { threadId });
}

export function emitChatLeaveThread(threadId) {
  if (!socket || !threadId) return;
  socket.emit("chat:leave_thread", { threadId });
}

export function emitChatJoinRooms(threadIds = []) {
  if (!socket) return;
  socket.emit("chat:join_rooms", { threadIds });
}

export function emitChatRead(payload) {
  if (!socket) return;
  socket.emit("chat:read", payload);
}

export function emitChatCallInvite(payload) {
  if (!socket) return;
  socket.emit("chat:call_invite", payload);
}

export function emitChatWebRtcOffer(payload) {
  if (!socket) return;
  socket.emit("chat:webrtc_offer", payload);
}

export function emitChatWebRtcAnswer(payload) {
  if (!socket) return;
  socket.emit("chat:webrtc_answer", payload);
}

export function emitChatWebRtcIceCandidate(payload) {
  if (!socket) return;
  socket.emit("chat:webrtc_ice_candidate", payload);
}

export function emitChatCallEnd(payload) {
  if (!socket) return;
  socket.emit("chat:call_end", payload);
}

export function disconnectChatSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}
