import type { Message } from '../generated/prisma/client';

export type MessageView = Pick<
  Message,
  'id' | 'conversationId' | 'senderId' | 'clientMessageId' | 'body' | 'createdAt'
>;

export function toMessageView(message: Message): MessageView {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    clientMessageId: message.clientMessageId,
    body: message.body,
    createdAt: message.createdAt,
  };
}
