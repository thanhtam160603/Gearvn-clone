import type { ChatConversation } from "@/lib/api/chat";

type Props = {
  conversations: ChatConversation[];
  selectedId: string | null;
  supportId: string;
  cursor: string | null;
  loading: boolean;
  error: string;
  onSelect: (id: string) => void;
  onLoadMore: () => void;
};

export default function SupportConversationList({ conversations, selectedId, supportId, cursor, loading, error, onSelect, onLoadMore }: Props) {
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden border-b border-neutral-200 md:border-b-0 md:border-r">
      <h2 className="border-b px-4 py-3 font-semibold">Hội thoại ({conversations.length})</h2>
      {error && <p role="alert" className="px-4 py-3 text-sm text-red-600">{error}</p>}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {conversations.length === 0 && !error && <p className="px-4 py-6 text-sm text-neutral-500">Chưa có hội thoại đang mở.</p>}
        {conversations.map((conversation) => (
          <button key={conversation.id} type="button" onClick={() => onSelect(conversation.id)} className={`w-full border-b px-4 py-3 text-left hover:bg-red-50 ${selectedId === conversation.id ? "bg-red-50" : ""}`}>
            <span className="block truncate text-sm font-semibold text-neutral-900">Khách hàng {conversation.customerId.slice(0, 8)}</span>
            <span className="mt-1 block text-xs text-neutral-500">{conversation.assignedSupportId === supportId ? "Bạn đang xử lý" : conversation.assignedSupportId ? "Nhân viên khác đang xử lý" : "Chưa có nhân viên nhận"}</span>
            <time dateTime={conversation.updatedAt} className="mt-1 block text-xs text-neutral-400">{new Date(conversation.updatedAt).toLocaleString("vi-VN")}</time>
          </button>
        ))}
        {cursor && <button type="button" onClick={onLoadMore} disabled={loading} className="w-full p-3 text-sm font-medium text-[var(--gearvn-red)] disabled:opacity-50">Xem thêm hội thoại</button>}
      </div>
    </aside>
  );
}
