import type { SubmitEvent } from "react";
import { FiSend } from "react-icons/fi";

type ChatComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
  unavailable?: boolean;
};

export default function ChatComposer({ draft, onDraftChange, onSend, sending, unavailable = false }: ChatComposerProps) {
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.trim() && !sending && !unavailable) onSend();
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2 border-t border-neutral-200 bg-white p-3">
      <textarea
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder="Nhập tin nhắn..."
        aria-label="Nội dung tin nhắn"
        rows={1}
        maxLength={2000}
        className="max-h-24 min-h-10 flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-[var(--gearvn-red)]"
      />
      <button
        type="submit"
        aria-label="Gửi tin nhắn"
        disabled={!draft.trim() || sending || unavailable}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--gearvn-red)] text-white disabled:bg-neutral-300"
      >
        <FiSend size={18} />
      </button>
    </form>
  );
}
