const chatModel = require("../models/chatModel");
const notificationModel = require("../models/notificationModel");
const {
  emitChatMessage,
  emitChatMessageUpdate,
  emitChatPresence,
  emitChatReceipt,
  emitChatPushNotification,
} = require("../sockets/chatSocket");

async function notifyChatRecipients({ threadId, senderId, senderName, previewText }) {
  try {
    const members = await chatModel.getThreadMembers(threadId);
    const targetUserIds = members
      .map((member) => Number(member.user_id))
      .filter((memberId) => memberId && memberId !== Number(senderId));

    for (const userId of targetUserIds) {
      await notificationModel.createNotification({
        targetRole: "all",
        targetUserId: userId,
        title: `New chat message from ${senderName || "Resident"}`,
        message: previewText || "You have a new message",
        priority: "medium",
        category: "chat_message",
        deepLink: `/chat/thread/${threadId}`,
        relatedType: "chat_thread",
        relatedId: threadId,
      });
    }

    emitChatPushNotification({
      type: "chat:new_message",
      threadId,
      senderId,
      senderName: senderName || "Resident",
      previewText: previewText || "New message",
      targetUserIds,
      createdAt: new Date().toISOString(),
    });
  } catch (_error) {
    // Notification fanout should not block message delivery.
  }
}

async function ensureActiveChatActor(userId) {
  return chatModel.getChatActorContext(userId);
}

function isSocietyMemberMatch(currentUser, otherUser) {
  if (!currentUser || !otherUser) {
    return false;
  }

  if (currentUser.role === "super_admin") {
    return true;
  }

  if (!currentUser.society_id || !otherUser.society_id) {
    return false;
  }

  return Number(currentUser.society_id) === Number(otherUser.society_id);
}

async function getMembers(req, res) {
  try {
    const currentUser = await ensureActiveChatActor(req.user.id);
    if (!currentUser) {
      return res.status(403).json({ success: false, message: "Chat is available only for active society members" });
    }

    const search = req.query.search ? String(req.query.search).trim() : "";
    const members = await chatModel.getChatMembersForUser({
      currentUserId: currentUser.id,
      currentRole: currentUser.role,
      societyId: currentUser.society_id,
      search,
    });

    return res.json({ success: true, data: members });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getConversations(req, res) {
  try {
    const currentUser = await ensureActiveChatActor(req.user.id);
    if (!currentUser) {
      return res.status(403).json({ success: false, message: "Chat is available only for active society members" });
    }

    const conversations = await chatModel.getConversations(currentUser.id);
    return res.json({ success: true, data: conversations });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createThread(req, res) {
  try {
    const currentUser = await ensureActiveChatActor(req.user.id);
    if (!currentUser) {
      return res.status(403).json({ success: false, message: "Chat is available only for active society members" });
    }

    const { threadType = "group", title, description, avatarUrl, memberIds = [] } = req.body;
    const members = Array.isArray(memberIds) ? memberIds.map(Number).filter(Boolean) : [];

    if (!["group", "channel"].includes(threadType)) {
      return res.status(400).json({ success: false, message: "threadType must be group or channel" });
    }

    if (threadType === "group" && members.length < 1) {
      return res.status(400).json({ success: false, message: "memberIds are required for group threads" });
    }

    const thread = await chatModel.createThread({
      createdBy: currentUser.id,
      societyId: currentUser.society_id || null,
      threadType,
      title,
      description,
      avatarUrl,
      memberIds: members,
    });

    return res.status(201).json({ success: true, message: "Thread created", data: thread });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getThreadMessages(req, res) {
  try {
    const currentUser = await ensureActiveChatActor(req.user.id);
    if (!currentUser) {
      return res.status(403).json({ success: false, message: "Chat is available only for active society members" });
    }

    const threadId = Number(req.params.threadId);
    const search = req.query.search ? String(req.query.search).trim() : "";
    const limit = req.query.limit ? Number(req.query.limit) : 200;

    const thread = await chatModel.getThreadById(threadId);
    if (!thread) {
      return res.status(404).json({ success: false, message: "Thread not found" });
    }

    if (thread.society_id && currentUser.society_id && Number(thread.society_id) !== Number(currentUser.society_id) && currentUser.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Chat is restricted to your society" });
    }

    const messages = await chatModel.getThreadMessages({ threadId, currentUserId: currentUser.id, limit, search });
    const members = await chatModel.getThreadMembers(threadId);
    await chatModel.markThreadRead({ threadId, userId: currentUser.id, messageId: messages.at(-1)?.id || null });

    return res.json({ success: true, data: { thread: { ...thread, members }, messages } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getMessages(req, res) {
  try {
    const currentUser = await ensureActiveChatActor(req.user.id);
    if (!currentUser) {
      return res.status(403).json({ success: false, message: "Chat is available only for active society members" });
    }

    const memberId = Number(req.params.memberId);
    const member = await chatModel.getChatMemberById(memberId);

    if (!member || !isSocietyMemberMatch(currentUser, member)) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    const thread = await chatModel.ensureDirectThread({
      userId: currentUser.id,
      peerId: memberId,
      societyId: currentUser.society_id || null,
    });

    const messages = await chatModel.getThreadMessages({
      threadId: thread.id,
      currentUserId: currentUser.id,
      limit: 200,
    });

    return res.json({ success: true, data: { thread, messages, member } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function sendMessage(req, res) {
  try {
    const currentUser = await ensureActiveChatActor(req.user.id);
    if (!currentUser) {
      return res.status(403).json({ success: false, message: "Chat is available only for active society members" });
    }

    const receiverId = Number(req.params.memberId);
    const member = await chatModel.getChatMemberById(receiverId);
    if (!member || !isSocietyMemberMatch(currentUser, member)) {
      return res.status(404).json({ success: false, message: "Member not found" });
    }

    const payload = req.body || {};
    const text = String(payload.message || payload.text || "").trim();
    const messageType = String(payload.messageType || payload.type || "text").trim();
    const mediaUrl = payload.mediaUrl || payload.media_url || null;
    const mediaName = payload.mediaName || payload.media_name || null;
    const mediaSize = payload.mediaSize || payload.media_size || null;
    const mimeType = payload.mimeType || payload.mime_type || null;
    const thumbnailUrl = payload.thumbnailUrl || payload.thumbnail_url || null;
    const replyToMessageId = payload.replyToMessageId || payload.reply_to_message_id || null;

    if (!text && !mediaUrl) {
      return res.status(400).json({ success: false, message: "message or mediaUrl is required" });
    }

    const thread = await chatModel.ensureDirectThread({
      userId: currentUser.id,
      peerId: receiverId,
      societyId: currentUser.society_id || null,
    });

    const messageId = await chatModel.createMessage({
      threadId: thread.id,
      senderId: currentUser.id,
      receiverId,
      message: text,
      messageType,
      mediaUrl,
      mediaName,
      mediaSize,
      mimeType,
      thumbnailUrl,
      replyToMessageId,
      metadata: payload.metadata || {},
    });

    const message = await chatModel.getMessageById(messageId);
    emitChatMessage(message);
    await notifyChatRecipients({
      threadId: thread.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      previewText: text || messageType || "New message",
    });

    return res.status(201).json({ success: true, message: "Message sent", data: { thread, message } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function sendThreadMessage(req, res) {
  try {
    const currentUser = await ensureActiveChatActor(req.user.id);
    if (!currentUser) {
      return res.status(403).json({ success: false, message: "Chat is available only for active society members" });
    }

    const threadId = Number(req.params.threadId);
    const thread = await chatModel.getThreadById(threadId);
    if (!thread) {
      return res.status(404).json({ success: false, message: "Thread not found" });
    }

    if (thread.society_id && currentUser.society_id && Number(thread.society_id) !== Number(currentUser.society_id) && currentUser.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Chat is restricted to your society" });
    }

    const payload = req.body || {};
    const messageText = String(payload.message || payload.text || "").trim();
    const messageType = String(payload.messageType || payload.type || "text").trim();
    const mediaUrl = payload.mediaUrl || payload.media_url || null;
    const mediaName = payload.mediaName || payload.media_name || null;
    const mediaSize = payload.mediaSize || payload.media_size || null;
    const mimeType = payload.mimeType || payload.mime_type || null;
    const thumbnailUrl = payload.thumbnailUrl || payload.thumbnail_url || null;
    const replyToMessageId = payload.replyToMessageId || payload.reply_to_message_id || null;

    if (!messageText && !mediaUrl) {
      return res.status(400).json({ success: false, message: "message or mediaUrl is required" });
    }

    const messageId = await chatModel.createMessage({
      threadId,
      senderId: currentUser.id,
      message: messageText,
      messageType,
      mediaUrl,
      mediaName,
      mediaSize,
      mimeType,
      thumbnailUrl,
      replyToMessageId,
      metadata: payload.metadata || {},
    });

    const message = await chatModel.getMessageById(messageId);
    emitChatMessage(message);
    await notifyChatRecipients({
      threadId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      previewText: messageText || messageType || "New message",
    });
    return res.status(201).json({ success: true, message: "Message sent", data: message });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function markThreadDelivered(req, res) {
  try {
    const currentUser = await ensureActiveChatActor(req.user.id);
    if (!currentUser) {
      return res.status(403).json({ success: false, message: "Chat is available only for active society members" });
    }

    const threadId = Number(req.params.threadId);
    await chatModel.markThreadRead({ threadId, userId: currentUser.id, messageId: Number(req.body?.messageId || req.body?.lastMessageId || 0) || null });
    emitChatReceipt({ threadId, userId: currentUser.id, status: "read" });

    return res.json({ success: true, message: "Thread marked as read" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function reactToMessage(req, res) {
  try {
    const currentUser = await ensureActiveChatActor(req.user.id);
    if (!currentUser) {
      return res.status(403).json({ success: false, message: "Chat is available only for active society members" });
    }

    const messageId = Number(req.params.id);
    const reaction = String(req.body.reaction || req.body.emoji || "").trim();
    const message = await chatModel.reactToMessage({ messageId, userId: currentUser.id, reaction });

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    emitChatMessageUpdate(message);
    return res.json({ success: true, message: "Reaction updated", data: message });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function pinMessage(req, res) {
  try {
    const currentUser = await ensureActiveChatActor(req.user.id);
    if (!currentUser) {
      return res.status(403).json({ success: false, message: "Chat is available only for active society members" });
    }

    const messageId = Number(req.params.id);
    const pinned = req.body?.pinned !== false;
    const message = await chatModel.pinMessage({ messageId, userId: currentUser.id, pinned });

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    emitChatMessageUpdate(message);
    return res.json({ success: true, message: pinned ? "Message pinned" : "Message unpinned", data: message });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function searchMessages(req, res) {
  try {
    const currentUser = await ensureActiveChatActor(req.user.id);
    if (!currentUser) {
      return res.status(403).json({ success: false, message: "Chat is available only for active society members" });
    }

    const query = String(req.query.q || req.query.search || "").trim();
    if (!query) {
      return res.status(400).json({ success: false, message: "q is required" });
    }

    const results = await chatModel.searchMessages({ userId: currentUser.id, query });
    return res.json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function markMessageDelivered(req, res) {
  try {
    const currentUser = await ensureActiveChatActor(req.user.id);
    if (!currentUser) {
      return res.status(403).json({ success: false, message: "Chat is available only for active society members" });
    }

    const messageId = Number(req.params.id);
    await chatModel.markMessageDelivered({ messageId, userId: currentUser.id });
    emitChatReceipt({ messageId, userId: currentUser.id, status: "delivered" });
    return res.json({ success: true, message: "Delivery recorded" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function deleteMessageForMe(req, res) {
  try {
    const currentUser = await ensureActiveChatActor(req.user.id);
    if (!currentUser) {
      return res.status(403).json({ success: false, message: "Chat is available only for active society members" });
    }

    const messageId = Number(req.params.id);
    const result = await chatModel.softDeleteMessageForMe({ messageId, userId: currentUser.id });

    if (!result.found) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (result.unauthorized) {
      return res.status(403).json({ success: false, message: "You can only delete messages from your own chat" });
    }

    const message = await chatModel.getMessageById(messageId);
    emitChatMessageUpdate(message);
    return res.json({ success: true, message: "Message deleted for you", data: message });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function deleteMessageForEveryone(req, res) {
  try {
    const currentUser = await ensureActiveChatActor(req.user.id);
    if (!currentUser) {
      return res.status(403).json({ success: false, message: "Chat is available only for active society members" });
    }

    const messageId = Number(req.params.id);
    const result = await chatModel.deleteMessageForEveryone({ messageId, userId: currentUser.id });

    if (!result.found) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (result.unauthorized) {
      return res.status(403).json({ success: false, message: "You can only delete messages you sent" });
    }

    const message = await chatModel.getMessageById(messageId);
    emitChatMessageUpdate(message);
    return res.json({ success: true, message: "Message deleted for everyone", data: message });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  getMembers,
  getConversations,
  getMessages,
  sendMessage,
  createThread,
  getThreadMessages,
  sendThreadMessage,
  markThreadDelivered,
  markMessageDelivered,
  reactToMessage,
  pinMessage,
  searchMessages,
  deleteMessageForMe,
  deleteMessageForEveryone,
};
