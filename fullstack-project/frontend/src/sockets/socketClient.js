import { io } from "socket.io-client";
import { getBackendBaseUrl } from "../services/runtimeUrls";

let socket = null;

export function initSocket() {
  if (socket) return socket;
  const base = getBackendBaseUrl();
  socket = io(base, {
    transports: ["polling", "websocket"],
    reconnectionAttempts: 2,
    timeout: 8000,
  });

  socket.on("connect", () => {
    // console.log("socket connected", socket.id);
  });

  socket.on("disconnect", () => {
    // console.log("socket disconnected");
  });

  return socket;
}

export function subscribe(event, cb) {
  const s = initSocket();
  s.on(event, cb);
  return () => s.off(event, cb);
}

export function emit(event, payload) {
  const s = initSocket();
  s.emit(event, payload);
}
