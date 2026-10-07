import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getChatMessages, getOrCreateChat, type ChatMessage } from "@/lib/api/chat";
import { chatSocketUrl, readChatSocketEvent } from "@/lib/chat-socket";

type PendingMessage = { clientMessageId: string; body: string; userId: string };
type ChatStatus = "loading" | "connecting" | "connected" | "offline" | "error";

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}

export function useCustomerChat(open: boolean, userId: string | undefined, accessToken: string | null) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<ChatStatus>("loading");
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<PendingMessage | null>(null);
  const [error, setError] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const pendingRef = useRef<PendingMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const olderScrollHeight = useRef<number | null>(null);
  const readyForUser = loadedUserId === userId;
  const activeConversationId = readyForUser ? conversationId : null;

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;

    void (async () => {
      try {
        const conversation = await getOrCreateChat();
        const page = await getChatMessages(conversation.id);
        if (cancelled) return;
        if (
          pendingRef.current &&
          (pendingRef.current.userId !== userId ||
            page.items.some((message) => message.clientMessageId === pendingRef.current?.clientMessageId))
        ) {
          pendingRef.current = null;
          setPending(null);
        }
        setMessages(page.items.reverse());
        setNextCursor(page.nextCursor);
        setConversationId(conversation.id);
        setLoadedUserId(userId);
        setStatus("connecting");
        setError("");
      } catch {
        if (cancelled) return;
        setMessages([]);
        setConversationId(null);
        setLoadedUserId(userId);
        setStatus("error");
        setError("Không tải được hội thoại. Vui lòng đóng và mở lại hộp chat.");
      }
    })();

    return () => { cancelled = true; };
  }, [open, userId]);

  useEffect(() => {
    if (!open || !activeConversationId || !accessToken) return;
    let stopped = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const conversationId = activeConversationId;

    function connect() {
      if (stopped) return;
      setStatus("connecting");
      const socket = new WebSocket(chatSocketUrl());
      socketRef.current = socket;

      socket.onopen = () => {
        if (stopped || socketRef.current !== socket) return;
        socket.send(JSON.stringify({ event: "chat.auth", data: { token: accessToken } }));
      };

      socket.onmessage = (messageEvent) => {
        if (stopped || socketRef.current !== socket) return;
        const frame = readChatSocketEvent(String(messageEvent.data));
        if (!frame) return;

        if (frame.event === "chat.auth.ok") {
          socket.send(JSON.stringify({ event: "chat.conversation.join", data: { conversationId } }));
        } else if (frame.event === "chat.conversation.joined") {
          attempts = 0;
          setStatus("connected");
          setError("");
          void getChatMessages(conversationId).then((page) => {
            if (!stopped && socketRef.current === socket) {
              setMessages((current) => mergeMessages(current, page.items));
              if (page.items.some((message) => message.clientMessageId === pendingRef.current?.clientMessageId)) {
                pendingRef.current = null;
                setPending(null);
              }
            }
          }).catch(() => {});
          const unsent = pendingRef.current;
          if (unsent && unsent.userId === userId) {
            socket.send(JSON.stringify({ event: "chat.message.send", data: { conversationId, clientMessageId: unsent.clientMessageId, body: unsent.body } }));
          }
        } else if (frame.event === "chat.message.created") {
          const data = frame.data;
          if (typeof data.id !== "string" || typeof data.body !== "string" || typeof data.senderId !== "string") return;
          const chatMessage = data as ChatMessage;
          setMessages((current) => mergeMessages(current, [chatMessage]));
          if (pendingRef.current?.clientMessageId === chatMessage.clientMessageId) {
            pendingRef.current = null;
            setPending(null);
          }
        } else if (frame.event === "chat.message.ack") {
          if (pendingRef.current?.clientMessageId === frame.data.clientMessageId) {
            pendingRef.current = null;
            setPending(null);
            void getChatMessages(conversationId).then((page) => {
              if (!stopped) setMessages((current) => mergeMessages(current, page.items));
            }).catch(() => {});
          }
        } else if (frame.event === "chat.error") {
          if (frame.data.code === "CONVERSATION_FORBIDDEN" || frame.data.code === "CHAT_CONFLICT") {
            setError("Hội thoại đã đóng. Hãy đóng và mở lại hộp chat để bắt đầu cuộc trò chuyện mới.");
            setStatus("error");
          } else {
            setError(typeof frame.data.message === "string" ? frame.data.message : "Không gửi được tin nhắn.");
          }
        }
      };

      socket.onerror = () => socket.close();
      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null;
        if (stopped) return;
        setStatus("offline");
        reconnectTimer = setTimeout(connect, Math.min(2_000 * 2 ** attempts++, 15_000));
      };
    }

    connect();
    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [open, activeConversationId, accessToken, userId]);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!open || !container) return;
    if (olderScrollHeight.current !== null) {
      container.scrollTop += container.scrollHeight - olderScrollHeight.current;
      olderScrollHeight.current = null;
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, [open, messages, pending]);

  function sendMessage() {
    const body = draft.trim();
    const socket = socketRef.current;
    if (!body || body.length > 2_000 || !userId || status === "error" || pendingRef.current) return;
    const outgoing = { clientMessageId: crypto.randomUUID(), body, userId };
    pendingRef.current = outgoing;
    setPending(outgoing);
    setDraft("");
    setError("");
    if (status === "connected" && activeConversationId && socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event: "chat.message.send", data: { conversationId: activeConversationId, clientMessageId: outgoing.clientMessageId, body } }));
    }
  }

  function retryPending() {
    const socket = socketRef.current;
    if (!pendingRef.current || !activeConversationId || !socket || status !== "connected") return;
    setError("");
    socket.send(JSON.stringify({ event: "chat.message.send", data: { conversationId: activeConversationId, clientMessageId: pendingRef.current.clientMessageId, body: pendingRef.current.body } }));
  }

  function resetConnection() {
    // Load the conversation again before opening a socket for the next widget session.
    setConversationId(null);
    setLoadedUserId(null);
    setStatus("loading");
    setError("");
  }

  async function loadOlder() {
    if (!activeConversationId || !nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    olderScrollHeight.current = scrollRef.current?.scrollHeight ?? null;
    try {
      const page = await getChatMessages(activeConversationId, nextCursor);
      setMessages((current) => mergeMessages(current, page.items));
      setNextCursor(page.nextCursor);
    } catch {
      olderScrollHeight.current = null;
      setError("Không tải được tin nhắn cũ.");
    } finally {
      setLoadingOlder(false);
    }
  }

  return {
    readyForUser, messages, nextCursor, status, draft, setDraft, pending,
    error, loadingOlder, scrollRef, sendMessage, retryPending, loadOlder,
    resetConnection,
  };
}
