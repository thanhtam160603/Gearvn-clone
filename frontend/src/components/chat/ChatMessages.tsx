import { forwardRef } from "react";
import type { ChatMessage } from "@/lib/api/chat";

type ChatMessagesProps = {
  messages: ChatMessage[];
  ownUserId: string;
  pendingBody?: string;
  nextCursor?: string | null;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
  greeting?: string;
};

const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(function ChatMessages({
  messages, ownUserId, pendingBody, nextCursor, loadingOlder, onLoadOlder, greeting,
}, ref) {
  return (
    <div ref={ref} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f8f9fb] px-4 py-4" aria-live="polite">
      {nextCursor && onLoadOlder && (
        <button type="button" onClick={onLoadOlder} disabled={loadingOlder} className="block w-full text-center text-xs font-medium text-[var(--gearvn-red)] disabled:opacity-50">
          {loadingOlder ? "Đang tải..." : "Xem tin nhắn cũ"}
        </button>
      )}
      {greeting && <div className="rounded-xl border border-red-100 bg-white p-3 text-sm leading-5 text-neutral-700 shadow-sm">{greeting}</div>}
      {messages.map((message) => {
        const own = message.senderId === ownUserId;
        return (
          <div key={message.id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${own ? "rounded-br-sm bg-[var(--gearvn-red)] text-white" : "rounded-bl-sm bg-white text-neutral-800"}`}>
              <p className="whitespace-pre-wrap break-words">{message.body}</p>
              <time dateTime={message.createdAt} className={`mt-1 block text-right text-[10px] ${own ? "text-white/75" : "text-neutral-400"}`}>
                {new Date(message.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </time>
            </div>
          </div>
        );
      })}
      {pendingBody && (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-red-100 px-3 py-2 text-sm text-neutral-800">
            <p className="whitespace-pre-wrap break-words">{pendingBody}</p>
            <span className="mt-1 block text-right text-[10px] text-neutral-500">Đang gửi...</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default ChatMessages;
