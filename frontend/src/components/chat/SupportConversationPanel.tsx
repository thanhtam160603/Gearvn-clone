import type { Ref } from "react";
import { FiMessageCircle } from "react-icons/fi";
import type { ChatConversation, ChatMessage } from "@/lib/api/chat";
import ChatComposer from "./ChatComposer";
import ChatMessages from "./ChatMessages";

type Props = {
  selected?: ChatConversation;
  supportId: string;
  connected: boolean;
  busy: boolean;
  error: string;
  messages: ChatMessage[];
  messageCursor: string | null;
  loadingOlder: boolean;
  pendingBody?: string;
  draft: string;
  scrollRef: Ref<HTMLDivElement>;
  onClaim: () => void;
  onClose: () => void;
  onLoadOlder: () => void;
  onDraftChange: (value: string) => void;
  onSend: () => void;
};

export default function SupportConversationPanel({
  selected, supportId, connected, busy, error, messages, messageCursor,
  loadingOlder, pendingBody, draft, scrollRef, onClaim, onClose,
  onLoadOlder, onDraftChange, onSend,
}: Props) {
  const canReply = selected?.assignedSupportId === supportId && selected.status === "OPEN";

  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
      {!selected ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-neutral-500"><FiMessageCircle size={40} /><p>Chọn một hội thoại để bắt đầu.</p></div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <h2 className="font-semibold">Khách hàng {selected.customerId.slice(0, 8)}</h2>
              <p className="text-xs text-neutral-500">{canReply ? connected ? "Đã kết nối" : "Đang kết nối..." : selected.assignedSupportId ? "Nhân viên khác đang xử lý" : "Chưa nhận hội thoại"}</p>
            </div>
            {canReply ? (
              <button type="button" onClick={onClose} disabled={busy || !!pendingBody} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50">Đóng hội thoại</button>
            ) : !selected.assignedSupportId ? (
              <button type="button" onClick={onClaim} disabled={busy} className="rounded-lg bg-[var(--gearvn-red)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50">Nhận hội thoại</button>
            ) : null}
          </div>
          {canReply ? (
            <>
              <ChatMessages ref={scrollRef} messages={messages} ownUserId={supportId} pendingBody={pendingBody} nextCursor={messageCursor} loadingOlder={loadingOlder} onLoadOlder={onLoadOlder} />
              {error && <p role="alert" className="bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
              {pendingBody && !connected && <p className="bg-amber-50 px-4 py-2 text-xs text-amber-800">Tin nhắn sẽ được gửi khi kết nối lại.</p>}
              <ChatComposer draft={draft} onDraftChange={onDraftChange} onSend={onSend} sending={!!pendingBody} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-neutral-500">{error || (selected.assignedSupportId ? "Hội thoại đang được nhân viên khác xử lý." : "Nhận hội thoại để xem tin nhắn và trả lời khách hàng.")}</div>
          )}
        </>
      )}
    </div>
  );
}
