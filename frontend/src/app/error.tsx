"use client";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container-shell flex min-h-96 flex-col items-center justify-center gap-4 py-12 text-center">
      <h1 className="text-xl font-semibold">Không tải được dữ liệu từ máy chủ</h1>
      <p className="text-sm text-neutral-600">Kiểm tra kết nối rồi thử lại.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-[var(--gearvn-red)] px-5 py-2 text-sm font-semibold text-white"
      >
        Thử lại
      </button>
    </main>
  );
}
