"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import {
  claimSupportChat, closeSupportChat, getSupportMessages, listSupportChats,
  type ChatConversation, type ChatMessage,
} from "@/lib/api/chat";
import { chatSocketUrl, readChatSocketEvent } from "@/lib/chat-socket";
import { selectAccessToken, selectAuthInitialized, selectAuthUser } from "@/store/auth-selectors";
import { openLoginDialog } from "@/store/ui-slice";
import SupportConversationList from "./SupportConversationList";
import SupportConversationPanel from "./SupportConversationPanel";

type PendingReply = { clientMessageId: string; body: string };

function mergeMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const rows = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) rows.set(message.id, message);
  return [...rows.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

export default function SupportChat() {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector(selectAuthInitialized);
  const user = useAppSelector(selectAuthUser);
  const token = useAppSelector(selectAccessToken);
  const supportId = user?.role === "support" ? user.id : null;
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listCursor, setListCursor] = useState<string | null>(null);
  const [messageCursor, setMessageCursor] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<PendingReply | null>(null);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const pendingRef = useRef<PendingReply | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const olderScrollHeight = useRef<number | null>(null);
  const selected = conversations.find((conversation) => conversation.id === selectedId);
  const canReply = !!supportId && selected?.assignedSupportId === supportId && selected.status === "OPEN";

  useEffect(() => {
    if (!supportId) return;
    let cancelled = false;
    void listSupportChats().then((page) => {
      if (cancelled) return;
      setConversations(page.items);
      setListCursor(page.nextCursor);
      setListError("");
    }).catch(() => { if (!cancelled) setListError("Không tải được danh sách hội thoại."); });
    return () => { cancelled = true; };
  }, [supportId]);

  useEffect(() => {
    if (!canReply || !selectedId) return;
    let cancelled = false;
    const conversationId = selectedId;
    void getSupportMessages(conversationId).then((page) => {
      if (cancelled) return;
      setMessages(page.items.reverse());
      setMessageCursor(page.nextCursor);
      setError("");
      if (page.items.some((message) => message.clientMessageId === pendingRef.current?.clientMessageId)) {
        pendingRef.current = null;
        setPending(null);
      }
    }).catch(() => { if (!cancelled) setError("Không tải được lịch sử hội thoại."); });
    return () => { cancelled = true; };
  }, [canReply, selectedId]);

  useEffect(() => {
    if (!canReply || !selectedId || !token) return;
    let stopped = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const conversationId = selectedId;

    function connect() {
      if (stopped) return;
      const socket = new WebSocket(chatSocketUrl());
      socketRef.current = socket;
      socket.onopen = () => socket.send(JSON.stringify({ event: "chat.auth", data: { token } }));
      socket.onmessage = (event) => {
        const frame = readChatSocketEvent(String(event.data));
        if (!frame) return;
        if (frame.event === "chat.auth.ok") {
          socket.send(JSON.stringify({ event: "chat.conversation.join", data: { conversationId } }));
        } else if (frame.event === "chat.conversation.joined") {
          attempts = 0;
          setConnected(true);
          setError("");
          void getSupportMessages(conversationId).then((page) => {
            if (stopped || socketRef.current !== socket) return;
            setMessages((current) => mergeMessages(current, page.items));
            if (page.items.some((message) => message.clientMessageId === pendingRef.current?.clientMessageId)) {
              pendingRef.current = null;
              setPending(null);
            }
          }).catch(() => {});
          const unsent = pendingRef.current;
          if (unsent) socket.send(JSON.stringify({ event: "chat.message.send", data: { conversationId, ...unsent } }));
        } else if (frame.event === "chat.message.created") {
          const message = frame.data;
          if (typeof message.id !== "string" || typeof message.body !== "string" || typeof message.senderId !== "string") return;
          setMessages((current) => mergeMessages(current, [message as ChatMessage]));
          if (pendingRef.current?.clientMessageId === message.clientMessageId) {
            pendingRef.current = null;
            setPending(null);
          }
        } else if (frame.event === "chat.message.ack") {
          if (pendingRef.current?.clientMessageId === frame.data.clientMessageId) {
            pendingRef.current = null;
            setPending(null);
            void getSupportMessages(conversationId).then((page) => {
              if (!stopped) setMessages((current) => mergeMessages(current, page.items));
            }).catch(() => {});
          }
        } else if (frame.event === "chat.error") {
          setError(typeof frame.data.message === "string" ? frame.data.message : "Không gửi được tin nhắn.");
          if (frame.data.code === "CONVERSATION_FORBIDDEN" || frame.data.code === "CHAT_CONFLICT") setConnected(false);
        }
      };
      socket.onerror = () => socket.close();
      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null;
        if (stopped) return;
        setConnected(false);
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
  }, [canReply, selectedId, token]);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (olderScrollHeight.current !== null) {
      container.scrollTop += container.scrollHeight - olderScrollHeight.current;
      olderScrollHeight.current = null;
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, pending]);

  async function refreshList() {
    setLoading(true);
    try {
      const page = await listSupportChats();
      setConversations(page.items);
      setListCursor(page.nextCursor);
      setListError("");
    } catch {
      setListError("Không tải được danh sách hội thoại.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMoreConversations() {
    if (!listCursor || loading) return;
    setLoading(true);
    try {
      const page = await listSupportChats(listCursor);
      setConversations((current) => [...current, ...page.items.filter((row) => !current.some((item) => item.id === row.id))]);
      setListCursor(page.nextCursor);
    } catch {
      setListError("Không tải được các hội thoại tiếp theo.");
    } finally {
      setLoading(false);
    }
  }

  function selectConversation(id: string) {
    if (id === selectedId) return;
    setSelectedId(id);
    setMessages([]);
    setMessageCursor(null);
    setDraft("");
    setError("");
    setConnected(false);
    pendingRef.current = null;
    setPending(null);
  }

  async function claim() {
    if (!selectedId || busy) return;
    setBusy(true);
    try {
      const claimed = await claimSupportChat(selectedId);
      setConversations((current) => current.map((row) => row.id === claimed.id ? claimed : row));
      setError("");
    } catch {
      setError("Không nhận được hội thoại. Có thể nhân viên khác đã nhận; hãy tải lại danh sách.");
    } finally {
      setBusy(false);
    }
  }

  async function close() {
    if (!selectedId || busy || pendingRef.current) return;
    setBusy(true);
    try {
      await closeSupportChat(selectedId);
      setConversations((current) => current.filter((row) => row.id !== selectedId));
      setSelectedId(null);
      setMessages([]);
      setError("");
    } catch {
      setError("Không đóng được hội thoại. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  function send() {
    const body = draft.trim();
    const socket = socketRef.current;
    if (!body || !canReply || !selectedId || !supportId || pendingRef.current) return;
    const outgoing = { clientMessageId: crypto.randomUUID(), body };
    pendingRef.current = outgoing;
    setPending(outgoing);
    setDraft("");
    setError("");
    if (connected && socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event: "chat.message.send", data: { conversationId: selectedId, ...outgoing } }));
    }
  }

  async function loadOlder() {
    if (!selectedId || !messageCursor || loadingOlder) return;
    setLoadingOlder(true);
    olderScrollHeight.current = scrollRef.current?.scrollHeight ?? null;
    try {
      const page = await getSupportMessages(selectedId, messageCursor);
      setMessages((current) => mergeMessages(current, page.items));
      setMessageCursor(page.nextCursor);
    } catch {
      olderScrollHeight.current = null;
      setError("Không tải được tin nhắn cũ.");
    } finally {
      setLoadingOlder(false);
    }
  }

  if (!initialized) return <p className="rounded-xl bg-white p-8 text-center text-neutral-600">Đang kiểm tra phiên đăng nhập...</p>;
  if (!user) return (
    <div className="rounded-xl bg-white p-10 text-center shadow-sm">
      <h1 className="text-2xl font-bold">Hộp thư Support</h1>
      <p className="mt-3 text-neutral-600">Đăng nhập bằng tài khoản nhân viên hỗ trợ để trả lời khách hàng.</p>
      <button type="button" onClick={() => dispatch(openLoginDialog("/support"))} className="mt-5 rounded-lg bg-[var(--gearvn-red)] px-5 py-3 font-semibold text-white">Đăng nhập</button>
    </div>
  );
  if (user.role !== "support") return (
    <div className="rounded-xl bg-white p-10 text-center shadow-sm">
      <h1 className="text-2xl font-bold">Hộp thư Support</h1>
      <p className="mt-3 text-neutral-600">Trang này chỉ dành cho tài khoản nhân viên hỗ trợ.</p>
    </div>
  );

  return (
    <section aria-label="Hộp thư hỗ trợ khách hàng">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-neutral-900">Hộp thư hỗ trợ</h1><p className="mt-1 text-sm text-neutral-500">Các hội thoại khách hàng đang mở</p></div>
        <button type="button" onClick={() => void refreshList()} disabled={loading} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium disabled:opacity-50"><FiRefreshCw /> Làm mới</button>
      </div>
      <div className="grid h-[680px] min-h-[420px] max-h-[calc(100dvh-180px)] grid-rows-[180px_minmax(0,1fr)] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm md:grid-cols-[300px_minmax(0,1fr)] md:grid-rows-1">
        <SupportConversationList
          conversations={conversations}
          selectedId={selectedId}
          supportId={user.id}
          cursor={listCursor}
          loading={loading}
          error={listError}
          onSelect={selectConversation}
          onLoadMore={() => void loadMoreConversations()}
        />
        <SupportConversationPanel
          selected={selected}
          supportId={user.id}
          connected={connected}
          busy={busy}
          error={error}
          messages={messages}
          messageCursor={messageCursor}
          loadingOlder={loadingOlder}
          pendingBody={pending?.body}
          draft={draft}
          scrollRef={scrollRef}
          onClaim={() => void claim()}
          onClose={() => void close()}
          onLoadOlder={() => void loadOlder()}
          onDraftChange={setDraft}
          onSend={send}
        />
      </div>
    </section>
  );
}
