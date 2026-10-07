"use client";

import { useRef, useState } from "react";
import { FiMessageCircle, FiX } from "react-icons/fi";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import { selectAccessToken, selectAuthInitialized, selectAuthUser } from "@/store/auth-selectors";
import { openLoginDialog } from "@/store/ui-slice";
import ChatComposer from "./ChatComposer";
import ChatMessages from "./ChatMessages";
import { useCustomerChat } from "./useCustomerChat";

export default function ChatWidget() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const initialized = useAppSelector(selectAuthInitialized);
  const user = useAppSelector(selectAuthUser);
  const userId = user?.role === "customer" ? user.id : undefined;
  const accessToken = useAppSelector(selectAccessToken);
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement | null>(null);
  const {
    readyForUser, messages, nextCursor, status, draft, setDraft, pending,
    error, loadingOlder, scrollRef, sendMessage, retryPending, loadOlder,
    resetConnection,
  } = useCustomerChat(open, userId, accessToken);

  function closeWidget() {
    resetConnection();
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }

  function requestLogin() {
    dispatch(openLoginDialog(window.location.pathname + window.location.search));
  }

  const visibleStatus = readyForUser ? status : "loading";
  const statusLabel = visibleStatus === "connected" ? "Đã kết nối" : visibleStatus === "loading" || visibleStatus === "connecting" ? "Đang kết nối" : "Tạm mất kết nối";

  if (user?.role === "support" || pathname.startsWith("/support")) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6">
      {open && (
        <section
          role="dialog"
          aria-label="Chat hỗ trợ GEARVN"
          className="mb-3 flex h-[min(560px,calc(100dvh-100px))] w-[min(370px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
        >
          <div className="flex items-center gap-3 bg-[var(--gearvn-red)] px-4 py-3 text-white">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white font-black text-[var(--gearvn-red)]">G</div>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold">Chat với GEARVN</h2>
              <p className="flex items-center gap-1.5 text-xs text-white/90">
                <span className={`h-2 w-2 rounded-full ${visibleStatus === "connected" ? "bg-green-300" : "bg-white/70"}`} />
                {user ? statusLabel : "Hỗ trợ khách hàng"}
              </p>
            </div>
            <button type="button" onClick={closeWidget} aria-label="Đóng hộp chat" className="rounded-full p-2 hover:bg-white/15"><FiX size={20} /></button>
          </div>

          {!initialized ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-neutral-500">Đang kiểm tra phiên đăng nhập...</div>
          ) : !user ? (
            <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
              <FiMessageCircle className="mb-4 text-[var(--gearvn-red)]" size={44} />
              <h3 className="text-lg font-bold text-neutral-900">GEARVN luôn sẵn sàng lắng nghe</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">Đăng nhập để gửi câu hỏi và xem lại cuộc trò chuyện của bạn.</p>
              <button type="button" onClick={requestLogin} className="mt-5 rounded-lg bg-[var(--gearvn-red)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--gearvn-red-dark)]">Đăng nhập để chat</button>
            </div>
          ) : (
            <>
              <ChatMessages
                ref={scrollRef}
                messages={readyForUser ? messages : []}
                ownUserId={user.id}
                pendingBody={readyForUser ? pending?.body : undefined}
                nextCursor={readyForUser ? nextCursor : null}
                loadingOlder={loadingOlder}
                onLoadOlder={() => void loadOlder()}
                greeting="Xin chào! Bạn cần GEARVN hỗ trợ điều gì? Hãy để lại tin nhắn tại đây."
              />
              {readyForUser && error && <div role="alert" className="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">{error}{pending && status === "connected" && <button type="button" onClick={retryPending} className="ml-2 font-semibold underline">Gửi lại</button>}</div>}
              {pending && status !== "connected" && <p className="bg-amber-50 px-4 py-2 text-xs text-amber-800">Tin nhắn sẽ được gửi khi kết nối lại.</p>}
              <ChatComposer draft={draft} onDraftChange={setDraft} onSend={sendMessage} sending={!!pending} unavailable={status === "error"} />
            </>
          )}
        </section>
      )}
      {!open && (
        <button
          ref={launcherRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở chat hỗ trợ"
          aria-expanded={false}
          className="ml-auto flex h-14 items-center gap-2 rounded-full bg-[var(--gearvn-red)] px-4 font-semibold text-white shadow-lg transition hover:bg-[var(--gearvn-red-dark)]"
        >
          <FiMessageCircle size={24} />
          <span className="text-sm">Chat với GEARVN</span>
        </button>
      )}
    </div>
  );
}
