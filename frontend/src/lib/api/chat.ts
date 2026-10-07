import { ApiError, authClient } from "./client";

export type ChatConversation = {
  id: string;
  customerId: string;
  assignedSupportId: string | null;
  status: "OPEN" | "CLOSED";
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  clientMessageId: string;
  body: string;
  createdAt: string;
};

export type ChatMessagePage = {
  items: ChatMessage[];
  nextCursor: string | null;
};

export type ChatConversationPage = {
  items: ChatConversation[];
  nextCursor: string | null;
};

export async function getOrCreateChat(): Promise<ChatConversation> {
  try {
    const { data } = await authClient.get<ChatConversation>("/api/chat/conversations/current");
    return data;
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
    const { data } = await authClient.post<ChatConversation>("/api/chat/conversations");
    return data;
  }
}

export async function getChatMessages(
  conversationId: string,
  cursor?: string,
): Promise<ChatMessagePage> {
  const { data } = await authClient.get<ChatMessagePage>(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
    { params: { limit: 30, ...(cursor ? { cursor } : {}) } },
  );
  return data;
}

export async function listSupportChats(cursor?: string): Promise<ChatConversationPage> {
  const { data } = await authClient.get<ChatConversationPage>("/api/support/conversations", {
    params: { limit: 30, ...(cursor ? { cursor } : {}) },
  });
  return data;
}

export async function claimSupportChat(id: string): Promise<ChatConversation> {
  const { data } = await authClient.post<ChatConversation>(`/api/support/conversations/${encodeURIComponent(id)}/join`);
  return data;
}

export async function closeSupportChat(id: string): Promise<ChatConversation> {
  const { data } = await authClient.post<ChatConversation>(`/api/support/conversations/${encodeURIComponent(id)}/close`);
  return data;
}

export async function getSupportMessages(id: string, cursor?: string): Promise<ChatMessagePage> {
  const { data } = await authClient.get<ChatMessagePage>(
    `/api/support/conversations/${encodeURIComponent(id)}/messages`,
    { params: { limit: 30, ...(cursor ? { cursor } : {}) } },
  );
  return data;
}
