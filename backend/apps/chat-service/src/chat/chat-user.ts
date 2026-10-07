import type { RequestWithId } from '@app/common';
export type ChatUser = { id: string; role: 'CUSTOMER' | 'SUPPORT' };
export type ChatRequest = RequestWithId & { user: ChatUser };