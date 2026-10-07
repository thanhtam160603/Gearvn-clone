export type ChatSocketEvent = { event: string; data: Record<string, unknown> };

export function chatSocketUrl(): string {
  const url = new URL(
    process.env.NEXT_PUBLIC_CHAT_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin,
    window.location.origin,
  );
  url.pathname = "/chat";
  url.search = "";
  url.hash = "";
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export function readChatSocketEvent(raw: string): ChatSocketEvent | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const frame = value as Record<string, unknown>;
    if (typeof frame.event !== "string" || typeof frame.data !== "object" || frame.data === null) return null;
    return { event: frame.event, data: frame.data as Record<string, unknown> };
  } catch {
    return null;
  }
}
