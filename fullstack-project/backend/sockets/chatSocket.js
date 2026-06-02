const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const chatModel = require("../models/chatModel");

let ioInstance = null;
const activeUsers = new Map();

function getAllowedOrigins() {
  return (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getUserRoom(userId) {
  return `user:${userId}`;
}

function getSocietyRoom(societyId) {
  return `society:${societyId || "global"}`;
}

function getThreadRoom(threadId) {
  return `thread:${threadId}`;
}

function emitPresenceForSociety(societyId) {
  if (!ioInstance) return;

  const room = getSocietyRoom(societyId);
  const users = [...activeUsers.values()].filter((entry) => String(entry.societyId || "global") === String(societyId || "global"));
  ioInstance.to(room).emit("chat:presence", {
    societyId: societyId || null,
    onlineUserIds: users.map((entry) => entry.userId),
    count: users.length,
  });
}

  function emitChatPushNotification(payload) {
    if (!ioInstance || !payload) return;

    const targetUserIds = Array.isArray(payload.targetUserIds)
      ? payload.targetUserIds.map((id) => Number(id)).filter(Boolean)
      : [];

    for (const userId of targetUserIds) {
      ioInstance.to(getUserRoom(userId)).emit("chat:push_notification", {
        ...payload,
        targetUserId: userId,
      });
    }
  }

function initChatSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: getAllowedOrigins(),
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    try {
      if (!process.env.JWT_SECRET) {
        return next(new Error("Server authentication is not configured"));
      }

      const authHeader = socket.handshake.auth?.token || "";
      const token = String(authHeader).startsWith("Bearer ") ? String(authHeader).slice(7) : String(authHeader);

      if (!token) {
        return next(new Error("Access token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      return next();
    } catch (error) {
      return next(new Error("Invalid or expired token"));
    }
  });

  ioInstance.on("connection", (socket) => {
    const userId = Number(socket.user?.id);
    const societyId = socket.user?.societyId || null;

    if (!userId) {
      socket.disconnect();
      return;
    }

    socket.join(getUserRoom(userId));
    socket.join(getSocietyRoom(societyId));
    activeUsers.set(socket.id, { userId, societyId, connectedAt: new Date() });
    emitPresenceForSociety(societyId);

    socket.on("chat:join_thread", ({ threadId }) => {
      const room = getThreadRoom(Number(threadId));
      if (Number(threadId)) {
        socket.join(room);
      }
    });

    socket.on("chat:leave_thread", ({ threadId }) => {
      const room = getThreadRoom(Number(threadId));
      if (Number(threadId)) {
        socket.leave(room);
      }
    });

    socket.on("chat:typing", (payload) => {
      const threadId = Number(payload?.threadId);
      if (!threadId) return;

      ioInstance.to(getThreadRoom(threadId)).emit("chat:typing", {
        threadId,
        fromUserId: userId,
        fromName: socket.user?.name || null,
        isTyping: Boolean(payload?.isTyping),
      });
    });

    socket.on("chat:read", (payload) => {
      const threadId = Number(payload?.threadId);
      if (!threadId) return;

      ioInstance.to(getThreadRoom(threadId)).emit("chat:receipt", {
        threadId,
        userId,
        status: "read",
        lastMessageId: Number(payload?.lastMessageId || payload?.messageId || 0) || null,
      });
    });

    socket.on("chat:join_rooms", ({ threadIds = [] } = {}) => {
      const rooms = Array.isArray(threadIds) ? threadIds.map((threadId) => Number(threadId)).filter(Boolean) : [];
      for (const threadId of rooms) {
        socket.join(getThreadRoom(threadId));
      }
    });

    socket.on("chat:call_invite", (payload = {}) => {
      const targetUserId = Number(payload.targetUserId);
      const threadId = Number(payload.threadId || 0) || null;
      if (!targetUserId) return;

      ioInstance.to(getUserRoom(targetUserId)).emit("chat:call_invite", {
        threadId,
        callType: payload.callType || "audio",
        fromUserId: userId,
        fromName: socket.user?.name || null,
        fromRole: socket.user?.role || null,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on("chat:webrtc_offer", (payload = {}) => {
      const targetUserId = Number(payload.targetUserId);
      if (!targetUserId || !payload.offer) return;

      ioInstance.to(getUserRoom(targetUserId)).emit("chat:webrtc_offer", {
        threadId: Number(payload.threadId || 0) || null,
        fromUserId: userId,
        offer: payload.offer,
      });
    });

    socket.on("chat:webrtc_answer", (payload = {}) => {
      const targetUserId = Number(payload.targetUserId);
      if (!targetUserId || !payload.answer) return;

      ioInstance.to(getUserRoom(targetUserId)).emit("chat:webrtc_answer", {
        threadId: Number(payload.threadId || 0) || null,
        fromUserId: userId,
        answer: payload.answer,
      });
    });

    socket.on("chat:webrtc_ice_candidate", (payload = {}) => {
      const targetUserId = Number(payload.targetUserId);
      if (!targetUserId || !payload.candidate) return;

      ioInstance.to(getUserRoom(targetUserId)).emit("chat:webrtc_ice_candidate", {
        threadId: Number(payload.threadId || 0) || null,
        fromUserId: userId,
        candidate: payload.candidate,
      });
    });

    socket.on("chat:call_end", (payload = {}) => {
      const targetUserId = Number(payload.targetUserId);
      if (!targetUserId) return;

      ioInstance.to(getUserRoom(targetUserId)).emit("chat:call_end", {
        threadId: Number(payload.threadId || 0) || null,
        fromUserId: userId,
        reason: payload.reason || "ended",
      });
    });

    socket.on("disconnect", () => {
      const userEntry = activeUsers.get(socket.id);
      activeUsers.delete(socket.id);
      if (userEntry) {
        emitPresenceForSociety(userEntry.societyId);
      }
    });
  });

  return ioInstance;
}

function emitChatMessage(message) {
  if (!ioInstance || !message) return;

  const threadRoom = message.thread_id ? getThreadRoom(message.thread_id) : null;
  if (threadRoom) {
    ioInstance.to(threadRoom).emit("chat:new_message", message);
  }

  if (message.sender_id) {
    ioInstance.to(getUserRoom(message.sender_id)).emit("chat:new_message", message);
  }

  if (message.receiver_id) {
    ioInstance.to(getUserRoom(message.receiver_id)).emit("chat:new_message", message);
  }
}

function emitChatMessageUpdate(message) {
  if (!ioInstance || !message) return;

  const threadRoom = message.thread_id ? getThreadRoom(message.thread_id) : null;
  if (threadRoom) {
    ioInstance.to(threadRoom).emit("chat:message_updated", message);
  }

  if (message.sender_id) {
    ioInstance.to(getUserRoom(message.sender_id)).emit("chat:message_updated", message);
  }

  if (message.receiver_id) {
    ioInstance.to(getUserRoom(message.receiver_id)).emit("chat:message_updated", message);
  }
}

function emitChatReceipt(payload) {
  if (!ioInstance || !payload) return;

  if (payload.threadId) {
    ioInstance.to(getThreadRoom(payload.threadId)).emit("chat:receipt", payload);
  }

  if (payload.userId) {
    ioInstance.to(getUserRoom(payload.userId)).emit("chat:receipt", payload);
  }
}

function emitChatPresence(payload) {
  if (!ioInstance || !payload) return;

  ioInstance.to(getSocietyRoom(payload.societyId)).emit("chat:presence", payload);
}

function emitVisitorEvent(eventName, payload) {
  if (!ioInstance || !eventName) return;

  ioInstance.to(getSocietyRoom(payload?.societyId || null)).emit(eventName, payload);
  ioInstance.to(getUserRoom(payload?.userId || 0)).emit(eventName, payload);
}

module.exports = {
  initChatSocket,
  emitChatMessage,
  emitChatMessageUpdate,
  emitChatReceipt,
  emitChatPresence,
  emitChatPushNotification,
  emitVisitorEvent,
};
