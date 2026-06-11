import { useEffect, useMemo, useRef, useState } from "react";
import AlertMessage from "../components/AlertMessage";
import { getApiMessage, getCurrentUserFromToken } from "../services/authApi";
import {
  createChatThread,
  deleteChatMessageForEveryone,
  deleteChatMessageForMe,
  fetchChatConversations,
  fetchChatMembers,
  fetchChatMessages,
  fetchThreadMessages,
  getSmartReply,
  markThreadRead,
  pinMessage,
  reactToMessage,
  searchMessages,
  sendThreadMessage,
  summarizeChatText,
  translateChatText,
} from "../services/chatApi";
import {
  emitChatCallEnd,
  emitChatCallInvite,
  connectChatSocket,
  disconnectChatSocket,
  emitChatJoinRooms,
  emitChatJoinThread,
  emitChatLeaveThread,
  emitChatTyping,
  emitChatWebRtcAnswer,
  emitChatWebRtcIceCandidate,
  emitChatWebRtcOffer,
  onChatCallEnd,
  onChatCallInvite,
  onChatMessage,
  onChatMessageUpdated,
  onChatPresence,
  onChatPushNotification,
  onChatReceipt,
  onChatTyping,
  onChatWebRtcAnswer,
  onChatWebRtcIceCandidate,
  onChatWebRtcOffer,
} from "../services/chatSocket";

const REACTION_SET = ["👍", "❤️", "😂", "😮", "🙏"];
const LANGUAGE_OPTIONS = ["en", "hi", "mr", "gu", "es"];
const RTC_CONFIGURATION = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function buildPreview(message) {
  if (!message) return "No messages yet";
  if (message.deleted_for_all) return "Message deleted";
  if (message.message_type === "image") return "Photo";
  if (message.message_type === "video") return "Video";
  if (message.message_type === "audio") return "Voice message";
  if (message.message_type === "file" || message.message_type === "pdf") return message.media_name || "File";
  return message.message || "Message";
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function detectMessageType(file) {
  if (!file) return "file";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type === "application/pdf") return "pdf";
  return "file";
}

function ChatPage() {
  const currentUser = useMemo(() => getCurrentUserFromToken(), []);
  const [members, setMembers] = useState([]);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [threadFilter, setThreadFilter] = useState("all");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingState, setTypingState] = useState({});
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [searchResults, setSearchResults] = useState([]);
  const [showThreadCreator, setShowThreadCreator] = useState(false);
  const [newThreadType, setNewThreadType] = useState("group");
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadDescription, setNewThreadDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [attachment, setAttachment] = useState(null);
  const [translateLanguage, setTranslateLanguage] = useState("hi");
  const [smartReplyLoading, setSmartReplyLoading] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState("idle");
  const [activeCallTargetId, setActiveCallTargetId] = useState(null);
  const fileInputRef = useRef(null);
  const messageScrollRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const visibleThreads = threads.filter((thread) => {
    if (threadFilter === "all") return true;
    return thread.thread_type === threadFilter;
  });

  const activeThreadMeta = activeThread || null;
  const activeThreadMessages = messages;
  const pinnedMessage = activeThreadMessages.find((message) => message.is_pinned) || null;
  const currentUserId = currentUser?.id;

  function resolvePeerUserId(thread = activeThreadMeta) {
    if (!thread) return null;
    if (thread.thread_type !== "direct") return null;

    if (thread.peer_id && Number(thread.peer_id) !== Number(currentUserId)) {
      return Number(thread.peer_id);
    }

    const members = Array.isArray(thread.members) ? thread.members : [];
    const peer = members.find((member) => Number(member.user_id || member.id) !== Number(currentUserId));
    return peer ? Number(peer.user_id || peer.id) : null;
  }

  function teardownCallState() {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setActiveCallTargetId(null);
    setIncomingCall(null);
    setCallStatus("idle");
  }

  async function createPeerConnection(targetUserId, threadId) {
    const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = localStream;

    const peer = new RTCPeerConnection(RTC_CONFIGURATION);
    peerConnectionRef.current = peer;

    localStream.getTracks().forEach((track) => peer.addTrack(track, localStream));

    peer.onicecandidate = (event) => {
      if (!event.candidate) return;
      emitChatWebRtcIceCandidate({
        targetUserId,
        threadId,
        candidate: event.candidate,
      });
    };

    peer.ontrack = (event) => {
      if (!remoteAudioRef.current) return;
      const [stream] = event.streams;
      remoteAudioRef.current.srcObject = stream;
      remoteAudioRef.current.play().catch(() => {});
    };

    return peer;
  }

  async function startAudioCall() {
    const targetUserId = resolvePeerUserId();
    if (!targetUserId) {
      setAlert({ type: "error", message: "Audio call is available for direct chats only" });
      return;
    }

    try {
      const threadId = activeThreadMeta?.id || null;
      setCallStatus("dialing");
      setActiveCallTargetId(targetUserId);
      emitChatCallInvite({ targetUserId, threadId, callType: "audio" });

      const peer = await createPeerConnection(targetUserId, threadId);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      emitChatWebRtcOffer({ targetUserId, threadId, offer });
    } catch (_error) {
      teardownCallState();
      setAlert({ type: "error", message: "Could not start audio call" });
    }
  }

  function endAudioCall(reason = "ended") {
    if (activeCallTargetId) {
      emitChatCallEnd({
        targetUserId: activeCallTargetId,
        threadId: activeThreadMeta?.id || null,
        reason,
      });
    }
    teardownCallState();
  }

  async function acceptIncomingCall() {
    if (!incomingCall?.fromUserId) return;
    try {
      const threadId = incomingCall.threadId || activeThreadMeta?.id || null;
      setActiveCallTargetId(incomingCall.fromUserId);
      setCallStatus("connecting");
      await createPeerConnection(incomingCall.fromUserId, threadId);
      setIncomingCall(null);
    } catch (_error) {
      teardownCallState();
      setAlert({ type: "error", message: "Could not accept incoming call" });
    }
  }

  async function refreshSidebar(search = searchTerm) {
    const [membersResponse, conversationsResponse] = await Promise.all([
      fetchChatMembers(search),
      fetchChatConversations(),
    ]);

    setMembers(membersResponse.data || []);
    setThreads(conversationsResponse.data || []);
  }

  async function loadThread(thread) {
    if (!thread?.id) {
      setActiveThread(null);
      setMessages([]);
      return;
    }

    const response = await fetchThreadMessages(thread.id, searchTerm);
    const threadData = response.data?.thread || thread;
    const threadMessages = response.data?.messages || [];
    const threadMembers = response.data?.thread ? response.data.thread.members || [] : thread.members || [];

    setActiveThread({ ...threadData, members: threadMembers });
    setMessages(threadMessages);
    await markThreadRead(thread.id, { messageId: threadMessages.at(-1)?.id || null });
  }

  async function openMemberChat(member) {
    try {
      setAlert({ type: "", message: "" });
      const response = await fetchChatMessages(member.id);
      const thread = response.data?.thread || null;
      const threadMessages = response.data?.messages || [];
      const chatMember = response.data?.member || member;

      if (thread) {
        setActiveThread({
          ...thread,
          title: thread.title || chatMember.name,
          peer_name: chatMember.name,
          peer_role: chatMember.role,
          peer_wing: chatMember.wing,
          peer_floor: chatMember.floor,
          members: response.data?.members || [chatMember],
        });
        setMessages(threadMessages);
        emitChatJoinThread(thread.id);
        await markThreadRead(thread.id, { messageId: threadMessages.at(-1)?.id || null });
      }
      await refreshSidebar(searchTerm);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not open chat") });
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        setLoading(true);
        await refreshSidebar();
        if (isMounted) {
          const current = threads[0] || null;
          if (current) {
            await loadThread(current);
          }
        }
      } catch (error) {
        if (!isMounted) return;
        setAlert({ type: "error", message: getApiMessage(error, "Could not load chat") });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    const socket = connectChatSocket();
    bootstrap();

    const unsubscribeMessage = onChatMessage((incomingMessage) => {
      setThreads((previous) => {
        if (previous.some((thread) => thread.id === incomingMessage.thread_id)) {
          return previous.map((thread) =>
            thread.id === incomingMessage.thread_id
              ? { ...thread, latest_message: incomingMessage, last_message_at: incomingMessage.created_at }
              : thread
          );
        }
        return previous;
      });

      if (incomingMessage.thread_id === activeThreadMeta?.id) {
        setMessages((previous) => {
          if (previous.some((item) => item.id === incomingMessage.id)) {
            return previous;
          }
          return [...previous, incomingMessage];
        });
        markThreadRead(incomingMessage.thread_id, { messageId: incomingMessage.id }).catch(() => {});
      }
    });

    const unsubscribeUpdated = onChatMessageUpdated((updatedMessage) => {
      if (updatedMessage.thread_id === activeThreadMeta?.id) {
        setMessages((previous) =>
          previous.map((message) => (message.id === updatedMessage.id ? updatedMessage : message))
        );
      }
    });

    const unsubscribeTyping = onChatTyping((payload) => {
      const fromUserId = Number(payload?.fromUserId);
      if (!fromUserId) return;

      setTypingState((previous) => ({
        ...previous,
        [fromUserId]: Boolean(payload?.isTyping),
      }));
    });

    const unsubscribePresence = onChatPresence((payload) => {
      setOnlineUserIds(Array.isArray(payload?.onlineUserIds) ? payload.onlineUserIds : []);
    });

    const unsubscribeReceipt = onChatReceipt((payload) => {
      if (payload?.threadId === activeThreadMeta?.id) {
        loadThread(activeThreadMeta).catch(() => {});
      }
    });

    const unsubscribePushNotification = onChatPushNotification((payload) => {
      if (!payload?.previewText) return;

      if ("Notification" in window && Notification.permission === "granted") {
        // Use browser notification for WhatsApp-style push behavior when the tab is backgrounded.
        new Notification(payload.senderName || "Society Messenger", {
          body: payload.previewText,
          tag: `thread-${payload.threadId}`,
        });
      }
    });

    const unsubscribeCallInvite = onChatCallInvite((payload) => {
      if (!payload?.fromUserId) return;
      setIncomingCall(payload);
      setCallStatus("ringing");
    });

    const unsubscribeOffer = onChatWebRtcOffer(async (payload) => {
      if (!payload?.offer || !payload?.fromUserId) return;

      try {
        const threadId = payload.threadId || activeThreadMeta?.id || null;
        if (!peerConnectionRef.current) {
          await createPeerConnection(payload.fromUserId, threadId);
          setActiveCallTargetId(payload.fromUserId);
        }

        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        emitChatWebRtcAnswer({
          targetUserId: payload.fromUserId,
          threadId,
          answer,
        });
        setCallStatus("connected");
      } catch (_error) {
        teardownCallState();
      }
    });

    const unsubscribeAnswer = onChatWebRtcAnswer(async (payload) => {
      if (!payload?.answer || !peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
        setCallStatus("connected");
      } catch (_error) {
        teardownCallState();
      }
    });

    const unsubscribeIce = onChatWebRtcIceCandidate(async (payload) => {
      if (!payload?.candidate || !peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (_error) {
        // Ignore transient ICE negotiation errors from stale candidates.
      }
    });

    const unsubscribeCallEnd = onChatCallEnd(() => {
      teardownCallState();
    });

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    return () => {
      isMounted = false;
      unsubscribeMessage();
      unsubscribeUpdated();
      unsubscribeTyping();
      unsubscribePresence();
      unsubscribeReceipt();
      unsubscribePushNotification();
      unsubscribeCallInvite();
      unsubscribeOffer();
      unsubscribeAnswer();
      unsubscribeIce();
      unsubscribeCallEnd();
      if (socket) {
        disconnectChatSocket();
      }
      teardownCallState();
    };
  }, [searchTerm, activeThreadMeta?.id]);

  useEffect(() => {
    if (!activeThreadMeta?.id) {
      return;
    }

    emitChatJoinThread(activeThreadMeta.id);
    emitChatJoinRooms(threads.map((thread) => thread.id));
    loadThread(activeThreadMeta).catch((error) => {
      setAlert({ type: "error", message: getApiMessage(error, "Could not load thread") });
    });

    return () => {
      emitChatLeaveThread(activeThreadMeta.id);
    };
  }, [activeThreadMeta?.id]);

  useEffect(() => {
    if (!messageScrollRef.current) return;
    messageScrollRef.current.scrollTop = messageScrollRef.current.scrollHeight;
  }, [messages, activeThreadMeta?.id]);

  useEffect(() => {
    if (!isRecording) {
      clearInterval(timerRef.current);
      setRecordSeconds(0);
      return undefined;
    }

    timerRef.current = setInterval(() => {
      setRecordSeconds((previous) => previous + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  async function handleMemberSearch(event) {
    event.preventDefault();
    try {
      await refreshSidebar(searchTerm);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not search members") });
    }
  }

  async function handleThreadSearch(event) {
    event.preventDefault();
    if (!activeThreadMeta?.id) return;

    try {
      const response = await searchMessages(searchTerm);
      setSearchResults(response.data || []);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not search messages") });
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault();
    setAlert({ type: "", message: "" });

    if (!activeThreadMeta?.id) {
      return;
    }

    const payload = {
      message: draft.trim(),
      messageType: attachment?.messageType || "text",
      mediaUrl: attachment?.dataUrl || null,
      mediaName: attachment?.name || null,
      mediaSize: attachment?.size || null,
      mimeType: attachment?.mimeType || null,
      metadata: {
        attachmentPreview: attachment?.preview || null,
      },
    };

    if (!payload.message && !payload.mediaUrl) {
      return;
    }

    try {
      setSending(true);

      const response = await sendThreadMessage(activeThreadMeta.id, payload);

      const sentMessage = response.data?.message || response.data;
      if (sentMessage?.id) {
        setMessages((previous) => {
          if (previous.some((item) => item.id === sentMessage.id)) {
            return previous;
          }
          return [...previous, sentMessage];
        });
      }

      setDraft("");
      setAttachment(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      emitChatTyping({ threadId: activeThreadMeta.id, isTyping: false });
      await refreshSidebar(searchTerm);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not send message") });
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteForMe(messageId) {
    try {
      await deleteChatMessageForMe(messageId);
      setMessages((previous) => previous.filter((message) => message.id !== messageId));
      await refreshSidebar(searchTerm);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not delete message") });
    }
  }

  async function handleDeleteForEveryone(messageId) {
    try {
      await deleteChatMessageForEveryone(messageId);
      await loadThread(activeThreadMeta);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not delete message for everyone") });
    }
  }

  async function handleReact(messageId, reaction) {
    try {
      await reactToMessage(messageId, reaction);
      await loadThread(activeThreadMeta);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not add reaction") });
    }
  }

  async function handlePin(messageId, pinned = true) {
    try {
      await pinMessage(messageId, pinned);
      await loadThread(activeThreadMeta);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not pin message") });
    }
  }

  async function handleSmartReply() {
    if (!draft.trim()) return;
    try {
      setSmartReplyLoading(true);
      const response = await getSmartReply(draft, activeThreadMeta?.title || activeThreadMeta?.peer_name || "");
      setDraft(response.data?.reply || response.data?.smartReply || draft);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not generate smart reply") });
    } finally {
      setSmartReplyLoading(false);
    }
  }

  async function handleTranslateDraft() {
    if (!draft.trim()) return;
    try {
      const response = await translateChatText(draft, translateLanguage);
      setDraft(response.data?.translation || draft);
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not translate message") });
    }
  }

  async function handleSummarizeThread() {
    const combinedText = messages.map((message) => message.message).filter(Boolean).join(" ");
    if (!combinedText) return;
    try {
      const response = await summarizeChatText(combinedText);
      setSummaryText(response.data?.summary || "");
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not summarize thread") });
    }
  }

  async function handleCreateThread(event) {
    event.preventDefault();
    try {
      const response = await createChatThread({
        threadType: newThreadType,
        title: newThreadTitle,
        description: newThreadDescription,
        memberIds: selectedMemberIds,
      });

      const createdThread = response.data;
      setThreads((previous) => [createdThread, ...previous]);
      setShowThreadCreator(false);
      setNewThreadTitle("");
      setNewThreadDescription("");
      setSelectedMemberIds([]);
      if (createdThread?.id) {
        await loadThread(createdThread);
      }
    } catch (error) {
      setAlert({ type: "error", message: getApiMessage(error, "Could not create thread") });
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        size: file.size,
        mimeType: file.type,
        messageType: detectMessageType(file),
        dataUrl: String(reader.result || ""),
        preview: file.type.startsWith("image/") ? String(reader.result || "") : null,
      });
    };
    reader.readAsDataURL(file);
  }

  async function toggleVoiceRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          setAttachment({
            name: `voice-${Date.now()}.webm`,
            size: blob.size,
            mimeType: blob.type,
            messageType: "audio",
            dataUrl: String(reader.result || ""),
            preview: null,
          });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      setAlert({ type: "error", message: "Microphone access is required for voice messages" });
    }
  }

  function renderMessageStatus(message) {
    const receipts = Array.isArray(message.receipts) ? message.receipts : [];
    const delivered = receipts.some((item) => item.delivered_at);
    const read = receipts.some((item) => item.read_at);

    if (message.sender_id !== currentUserId) {
      return null;
    }

    return (
      <span className="ml-2 text-[11px] text-slate-400">
        {read ? "Read" : delivered ? "Delivered" : "Sent"}
      </span>
    );
  }

  return (
    <div className="chairman-page min-h-[calc(100vh-2rem)] rounded-[2rem] border border-white/10 theme-surface text-slate-100 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
      <div className="chairman-page grid min-h-[calc(100vh-2rem)] lg:grid-cols-[340px_1fr]">
        <aside className="flex flex-col border-r border-white/10 theme-surface">
          <div className="chairman-page border-b border-white/10 p-4">
            <div className="chairman-page flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Realtime chat</p>
                <h2 className="mt-1 text-2xl font-semibold text-[var(--text-main)]">Society Messenger</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowThreadCreator((previous) => !previous)}
                className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
              >
                New thread
              </button>
            </div>

            <div className="chairman-page mt-3 flex items-center gap-2 text-xs text-slate-400">
              <span className={`h-2.5 w-2.5 rounded-full ${onlineUserIds.includes(currentUserId) ? "bg-emerald-400" : "bg-slate-500"}`} />
              <span>{onlineUserIds.length} users online</span>
              <span className="rounded-full border border-white/10 px-2 py-1">{currentUser?.role || "member"}</span>
            </div>
          </div>

          <div className="chairman-page border-b border-white/10 p-4">
            <form className="space-y-2" onSubmit={handleMemberSearch}>
              <input
                type="text"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none ring-cyan-400/60 placeholder:text-slate-500 focus:ring"
                placeholder="Search members or threads"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <div className="chairman-page flex gap-2">
                <button type="submit" className="flex-1 rounded-2xl bg-white px-4 py-3 text-xs font-semibold text-slate-950">
                  Search people
                </button>
                <button type="button" onClick={handleThreadSearch} className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-[var(--text-main)]">
                  Search chats
                </button>
              </div>
            </form>

            <div className="chairman-page mt-4 flex flex-wrap gap-2">
              {[
                ["all", "All"],
                ["direct", "Direct"],
                ["group", "Groups"],
                ["channel", "Channels"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setThreadFilter(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    threadFilter === key ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {showThreadCreator ? (
            <form className="border-b border-white/10 p-4" onSubmit={handleCreateThread}>
              <div className="chairman-page grid gap-3">
                <div className="chairman-page grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewThreadType("group")}
                    className={`rounded-2xl border px-3 py-2 text-sm ${newThreadType === "group" ? "border-cyan-400 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300"}`}
                  >
                    Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewThreadType("channel")}
                    className={`rounded-2xl border px-3 py-2 text-sm ${newThreadType === "channel" ? "border-cyan-400 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300"}`}
                  >
                    Channel
                  </button>
                </div>
                <input
                  value={newThreadTitle}
                  onChange={(event) => setNewThreadTitle(event.target.value)}
                  placeholder="Thread title"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-main)] outline-none placeholder:text-slate-500"
                />
                <textarea
                  value={newThreadDescription}
                  onChange={(event) => setNewThreadDescription(event.target.value)}
                  placeholder="Description"
                  rows={3}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-main)] outline-none placeholder:text-slate-500"
                />
                <div className="chairman-page max-h-32 space-y-2 overflow-auto rounded-2xl border border-white/10 p-2">
                  {members.map((member) => {
                    const checked = selectedMemberIds.includes(member.id);
                    return (
                      <label key={member.id} className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-white/5">
                        <span>
                          {member.name} <span className="text-slate-500">({member.role})</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedMemberIds((previous) =>
                              checked ? previous.filter((id) => id !== member.id) : [...previous, member.id]
                            )
                          }
                        />
                      </label>
                    );
                  })}
                </div>
                <button type="submit" className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950">
                  Create {newThreadType}
                </button>
              </div>
            </form>
          ) : null}

          <div className="chairman-page flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="chairman-page rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">Loading chats...</div>
            ) : visibleThreads.length ? (
              visibleThreads.map((thread) => {
                const latest = thread.latest_message;
                const isActive = activeThreadMeta?.id === thread.id;
                const title = thread.title || thread.peer_name || (thread.thread_type === "direct" ? "Direct chat" : "Thread");
                const unread = thread.unread_count || 0;

                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => loadThread(thread)}
                    className={`mx-2 mb-2 w-[calc(100%-1rem)] rounded-3xl border p-4 text-left transition ${
                      isActive ? "border-cyan-400/60 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:bg-white/7"
                    }`}
                  >
                    <div className="chairman-page flex items-start justify-between gap-3">
                      <div>
                        <div className="chairman-page flex items-center gap-2">
                          <h3 className="font-semibold text-[var(--text-main)]">{title}</h3>
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.25em] text-slate-400">
                            {thread.thread_type}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm text-slate-400">{buildPreview(latest)}</p>
                      </div>
                      {unread ? <span className="rounded-full bg-cyan-400 px-2 py-1 text-[11px] font-semibold text-slate-950">{unread}</span> : null}
                    </div>
                    <div className="chairman-page mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{formatTime(thread.last_message_at || latest?.created_at)}</span>
                      <span>{latest?.sender_name || ""}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="chairman-page mx-2 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">No threads found.</div>
            )}

            {searchResults.length ? (
              <div className="chairman-page mx-2 mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Search results</h4>
                <div className="chairman-page mt-3 space-y-2">
                  {searchResults.map((result) => (
                    <div key={result.id} className="rounded-2xl border border-white/10 theme-surface p-3 text-xs text-slate-300">
                      <div className="chairman-page flex items-center justify-between gap-2">
                        <span className="font-semibold text-[var(--text-main)]">{result.sender_name}</span>
                        <span>{formatTime(result.created_at)}</span>
                      </div>
                      <p className="mt-1 line-clamp-2">{buildPreview(result)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(180deg,#0f172a_0%,#020617_100%)]">
          {activeThreadMeta ? (
            <>
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 theme-surface px-5 py-4 backdrop-blur-xl">
                <div>
                  <div className="chairman-page flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-[var(--text-main)]">
                      {activeThreadMeta.title || activeThreadMeta.peer_name || "Chat"}
                    </h2>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.24em] text-slate-400">
                      {activeThreadMeta.thread_type}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {activeThreadMeta.description || activeThreadMeta.peer_name || "Secure society conversation"}
                  </p>
                </div>

                <div className="chairman-page flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={startAudioCall}
                    disabled={activeThreadMeta.thread_type !== "direct" || callStatus === "connecting" || callStatus === "connected" || callStatus === "dialing"}
                    className="rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-2 text-xs text-emerald-100 disabled:opacity-50"
                  >
                    {callStatus === "dialing" ? "Dialing..." : "Audio call"}
                  </button>
                  <button
                    type="button"
                    onClick={() => endAudioCall("manual_end")}
                    disabled={callStatus === "idle"}
                    className="rounded-full border border-rose-300/30 bg-rose-400/15 px-3 py-2 text-xs text-rose-100 disabled:opacity-50"
                  >
                    End call
                  </button>
                  <span className="rounded-full border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-300">
                    {callStatus}
                  </span>
                  <button type="button" onClick={handleSummarizeThread} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-[var(--text-main)]">
                    Summarize
                  </button>
                  <button type="button" onClick={handleSmartReply} disabled={smartReplyLoading} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-[var(--text-main)] disabled:opacity-50">
                    {smartReplyLoading ? "AI thinking..." : "Smart reply"}
                  </button>
                  <select value={translateLanguage} onChange={(event) => setTranslateLanguage(event.target.value)} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-[var(--text-main)]">
                    {LANGUAGE_OPTIONS.map((language) => (
                      <option key={language} value={language} className="theme-surface">
                        {language.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={handleTranslateDraft} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-[var(--text-main)]">
                    Translate draft
                  </button>
                </div>
              </header>

              {incomingCall ? (
                <div className="chairman-page mx-4 mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">
                  <div className="chairman-page flex flex-wrap items-center justify-between gap-3">
                    <p>
                      Incoming {incomingCall.callType || "audio"} call from <span className="font-semibold">{incomingCall.fromName || "Resident"}</span>
                    </p>
                    <div className="chairman-page flex items-center gap-2">
                      <button type="button" onClick={acceptIncomingCall} className="rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-semibold text-slate-950">
                        Accept
                      </button>
                      <button type="button" onClick={() => endAudioCall("rejected")} className="rounded-full border border-rose-300/40 bg-rose-400/20 px-3 py-1.5 text-xs font-semibold text-rose-100">
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="chairman-page flex-1 overflow-y-auto px-4 py-4" ref={messageScrollRef}>
                {pinnedMessage ? (
                  <div className="chairman-page mb-4 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-50">
                    <div className="chairman-page flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.24em] text-cyan-200">Pinned message</span>
                      <button type="button" onClick={() => handlePin(pinnedMessage.id, false)} className="text-xs text-cyan-100 underline">
                        Unpin
                      </button>
                    </div>
                    <p className="mt-2">{buildPreview(pinnedMessage)}</p>
                  </div>
                ) : null}

                {summaryText ? (
                  <div className="chairman-page mb-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
                    <span className="text-xs uppercase tracking-[0.24em] text-emerald-200">AI summary</span>
                    <p className="mt-2">{summaryText}</p>
                  </div>
                ) : null}

                <div className="chairman-page space-y-3">
                  {activeThreadMessages.length ? (
                    activeThreadMessages.map((message) => {
                      const isMine = message.sender_id === currentUserId;
                      const reactions = Array.isArray(message.reactions) ? message.reactions : [];
                      const mediaUrl = message.media_url || message.metadata_json?.attachmentPreview || null;

                      return (
                        <article key={message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`group max-w-[min(720px,92%)] rounded-[2rem] px-4 py-3 shadow-lg ${isMine ? "bg-cyan-500 text-slate-950" : "bg-white/8 text-slate-100 backdrop-blur-xl"}`}>
                            <div className="chairman-page mb-2 flex items-center justify-between gap-3 text-[11px] opacity-80">
                              <span>{message.sender_name || "Unknown"}</span>
                              <span>{formatDate(message.created_at)} {formatTime(message.created_at)}</span>
                            </div>

                            {message.reply_message ? (
                              <div className="chairman-page mb-2 rounded-2xl border border-white/10 theme-modal-backdrop p-3 text-xs opacity-90">
                                <p className="font-semibold">Replying to</p>
                                <p>{message.reply_message}</p>
                              </div>
                            ) : null}

                            {message.deleted_for_all ? (
                              <p className="italic text-sm opacity-80">Message deleted</p>
                            ) : (
                              <>
                                {message.message ? <p className="whitespace-pre-wrap text-[15px] leading-7">{message.message}</p> : null}
                                {mediaUrl ? (
                                  <div className="chairman-page mt-3 overflow-hidden rounded-2xl border border-white/10 theme-modal-backdrop">
                                    {message.message_type === "image" || String(message.mime_type || "").startsWith("image/") ? (
                                      <img src={mediaUrl} alt={message.media_name || "attachment"} className="max-h-80 w-full object-cover" />
                                    ) : message.message_type === "video" ? (
                                      <video src={mediaUrl} controls className="w-full" />
                                    ) : message.message_type === "audio" ? (
                                      <audio src={mediaUrl} controls className="w-full" />
                                    ) : (
                                      <a href={mediaUrl} target="_blank" rel="noreferrer" className="block p-3 text-sm underline">
                                        {message.media_name || "Open attachment"}
                                      </a>
                                    )}
                                  </div>
                                ) : null}
                              </>
                            )}

                            {reactions.length ? (
                              <div className="chairman-page mt-2 flex flex-wrap gap-1">
                                {reactions.map((reaction, index) => (
                                  <span key={`${reaction.reaction}-${index}`} className="rounded-full theme-modal-backdrop px-2 py-1 text-[11px]">
                                    {reaction.reaction}
                                  </span>
                                ))}
                              </div>
                            ) : null}

                            <div className="chairman-page mt-3 flex flex-wrap items-center gap-2 text-[11px] opacity-80">
                              <span>{buildPreview(message)}</span>
                              {renderMessageStatus(message)}
                            </div>

                            <div className="chairman-page mt-3 flex flex-wrap gap-2 opacity-0 transition group-hover:opacity-100">
                              {REACTION_SET.map((emoji) => (
                                <button key={emoji} type="button" onClick={() => handleReact(message.id, emoji)} className="rounded-full border border-white/10 theme-modal-backdrop px-2 py-1 text-xs">
                                  {emoji}
                                </button>
                              ))}
                              <button type="button" onClick={() => handlePin(message.id, true)} className="rounded-full border border-white/10 theme-modal-backdrop px-2 py-1 text-xs">
                                Pin
                              </button>
                              <button type="button" onClick={() => handleDeleteForMe(message.id)} className="rounded-full border border-white/10 theme-modal-backdrop px-2 py-1 text-xs">
                                Delete for me
                              </button>
                              {isMine ? (
                                <button type="button" onClick={() => handleDeleteForEveryone(message.id)} className="rounded-full border border-white/10 theme-modal-backdrop px-2 py-1 text-xs">
                                  Delete for everyone
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="chairman-page rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-slate-300">
                      <p className="font-medium text-[var(--text-main)]">No messages yet.</p>
                      <p className="mt-2">Send a note, share a file, record a voice message, or start with AI smart reply.</p>
                    </div>
                  )}
                </div>
              </div>

              <footer className="border-t border-white/10 theme-surface p-4 backdrop-blur-xl">
                <audio ref={remoteAudioRef} autoPlay className="hidden" />
                {attachment ? (
                  <div className="chairman-page mb-3 flex items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                    <div>
                      <p className="font-semibold text-[var(--text-main)]">{attachment.name}</p>
                      <p>{attachment.mimeType || "attachment"}</p>
                    </div>
                    <button type="button" onClick={() => setAttachment(null)} className="text-xs text-cyan-200 underline">
                      Remove
                    </button>
                  </div>
                ) : null}

                <form onSubmit={handleSendMessage} className="flex flex-col gap-3 lg:flex-row lg:items-end">
                  <div className="chairman-page flex-1 rounded-[2rem] border border-white/10 bg-white/5 p-3 shadow-xl shadow-[var(--shadow)]">
                    <textarea
                      value={draft}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setDraft(nextValue);
                        if (activeThreadMeta?.id) {
                          emitChatTyping({ threadId: activeThreadMeta.id, isTyping: nextValue.length > 0 });
                        }
                      }}
                      rows={3}
                      placeholder="Type a message, add a file, paste an image, or ask AI to rewrite it..."
                      className="w-full resize-none bg-transparent text-sm text-[var(--text-main)] outline-none placeholder:text-slate-500"
                    />
                    <div className="chairman-page mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3 text-xs text-slate-300">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full border border-white/10 theme-modal-backdrop px-3 py-1.5">
                        Attach file
                      </button>
                      <button type="button" onClick={toggleVoiceRecording} className={`rounded-full border px-3 py-1.5 ${isRecording ? "border-rose-400 bg-rose-400/10 text-rose-100" : "border-white/10 theme-modal-backdrop"}`}>
                        {isRecording ? `Recording ${recordSeconds}s` : "Voice note"}
                      </button>
                      <button type="button" onClick={handleSmartReply} className="rounded-full border border-white/10 theme-modal-backdrop px-3 py-1.5">
                        AI smart reply
                      </button>
                      <button type="button" onClick={() => setDraft((previous) => `${previous}${previous ? "\n" : ""}Need a quick update please.`)} className="rounded-full border border-white/10 theme-modal-backdrop px-3 py-1.5">
                        Quick insert
                      </button>
                    </div>
                  </div>

                  <div className="chairman-page flex items-center gap-2">
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                    <button type="submit" disabled={sending || (!draft.trim() && !attachment)} className="rounded-[1.5rem] bg-cyan-400 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </div>
                </form>
              </footer>
            </>
          ) : (
            <div className="chairman-page flex flex-1 items-center justify-center p-8 text-center">
              <div className="chairman-page max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-8 text-slate-300">
                <h3 className="text-xl font-semibold text-[var(--text-main)]">Select a thread</h3>
                <p className="mt-2 text-sm">Open a direct message, create a group, or start a society channel to begin realtime communication.</p>
              </div>
            </div>
          )}

          <AlertMessage type={alert.type} message={alert.message} />
        </section>
      </div>
    </div>
  );
}

export default ChatPage;
