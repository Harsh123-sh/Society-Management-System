import { api } from "./authApi";

export async function fetchChatMembers(search = "") {
  const { data } = await api.get("/chats/members", {
    params: {
      search: search || undefined,
    },
  });
  return data;
}

export async function fetchChatConversations() {
  const { data } = await api.get("/chats/conversations");
  return data;
}

export async function fetchChatMessages(memberId) {
  const { data } = await api.get(`/chats/messages/${memberId}`);
  return data;
}

export async function fetchThreadMessages(threadId, search = "") {
  const { data } = await api.get(`/chats/threads/${threadId}`, {
    params: {
      search: search || undefined,
    },
  });
  return data;
}

export async function fetchChatThreads() {
  const { data } = await api.get("/chats/conversations");
  return data;
}

export async function createChatThread(payload) {
  const { data } = await api.post("/chats/threads", payload);
  return data;
}

export async function sendChatMessage(memberId, payload) {
  const { data } = await api.post(`/chats/messages/${memberId}`, payload);
  return data;
}

export async function sendThreadMessage(threadId, payload) {
  const { data } = await api.post(`/chats/threads/${threadId}/messages`, payload);
  return data;
}

export async function markThreadRead(threadId, payload = {}) {
  const { data } = await api.patch(`/chats/threads/${threadId}/read`, payload);
  return data;
}

export async function markMessageDelivered(messageId) {
  const { data } = await api.patch(`/chats/messages/${messageId}/read`);
  return data;
}

export async function reactToMessage(messageId, reaction) {
  const { data } = await api.post(`/chats/messages/${messageId}/react`, { reaction });
  return data;
}

export async function pinMessage(messageId, pinned = true) {
  const { data } = await api.post(`/chats/messages/${messageId}/pin`, { pinned });
  return data;
}

export async function searchMessages(query) {
  const { data } = await api.get("/chats/search", {
    params: { q: query || undefined },
  });
  return data;
}

export async function deleteChatMessageForMe(messageId) {
  const { data } = await api.patch(`/chats/messages/${messageId}/delete-for-me`);
  return data;
}

export async function deleteChatMessageForEveryone(messageId) {
  const { data } = await api.patch(`/chats/messages/${messageId}/delete-for-everyone`);
  return data;
}

export async function getSmartReply(prompt, context = "") {
  const { data } = await api.post("/ai/chat-smart-reply", {
    prompt,
    context,
  });
  return data;
}

export async function translateChatText(text, targetLanguage) {
  const { data } = await api.post("/ai/chat-translate", {
    text,
    targetLanguage,
  });
  return data;
}

export async function summarizeChatText(text) {
  const { data } = await api.post("/ai/chat-summarize", {
    text,
  });
  return data;
}
