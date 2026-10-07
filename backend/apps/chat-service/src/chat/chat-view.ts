import type { Conversation } from '../generated/prisma/client';

export type ConversationView = Conversation;
export type Page<T> = { items: T[]; nextCursor: string | null };
